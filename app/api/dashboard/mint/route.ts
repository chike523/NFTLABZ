import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface MintRequestBody {
  title: string
  description?: string | null
  image_url: string
  category_id?: string | null
  price_eth?: number | null
  royalty_percentage?: number | null
}

type WalletUpdateColumn = 'balance_eth' | 'balance'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: MintRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const title = (body.title ?? '').trim()
  const description = body.description?.trim() || null
  const imageUrl = (body.image_url ?? '').trim()
  const categoryId = body.category_id?.trim() || null
  const priceEth = typeof body.price_eth === 'number' ? body.price_eth : null
  const royaltyPercentage =
    typeof body.royalty_percentage === 'number' ? body.royalty_percentage : null

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (title.length < 3 || title.length > 200) {
    return NextResponse.json(
      { error: 'Title must be between 3 and 200 characters' },
      { status: 400 },
    )
  }

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
  }

  if (!priceEth || priceEth <= 0) {
    return NextResponse.json(
      { error: 'Price must be a number greater than 0' },
      { status: 400 },
    )
  }

  if (!categoryId) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  }

  if (royaltyPercentage !== null) {
    if (royaltyPercentage < 0 || royaltyPercentage > 50) {
      return NextResponse.json(
        { error: 'Royalty must be between 0 and 50 percent' },
        { status: 400 },
      )
    }
  }

  // Fetch minting fee setting
  const { data: feeSetting, error: feeError } = await adminSupabase
    .from('site_settings')
    .select('value, type')
    .eq('key', 'minting_fee_eth')
    .maybeSingle()

  if (feeError && feeError.code !== 'PGRST116') {
    console.error('[Mint] Failed to fetch minting fee setting:', feeError)
    return NextResponse.json({ error: 'Failed to load minting fee' }, { status: 500 })
  }

  let mintingFee = 0
  if (feeSetting?.value !== undefined && feeSetting?.value !== null) {
    if (feeSetting.type === 'number') {
      mintingFee = parseFloat(feeSetting.value ?? '0')
    } else {
      mintingFee = parseFloat(feeSetting.value)
    }
  }

  if (!isFinite(mintingFee) || mintingFee < 0) {
    mintingFee = 0
  }

  // Fetch user's primary wallet
  const { data: wallet, error: walletError } = await adminSupabase
    .from('wallets')
    .select('id, balance_eth, balance, balance_usd, user_id, is_primary')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .maybeSingle()

  if (walletError) {
    console.error('[Mint] Failed to fetch wallet:', walletError)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }

  if (!wallet) {
    return NextResponse.json({ error: 'No wallet found for user' }, { status: 404 })
  }

  const currentBalance = Number(wallet.balance_eth ?? wallet.balance ?? 0)
  if (currentBalance < mintingFee) {
    return NextResponse.json(
      { error: 'Insufficient balance to cover minting fee' },
      { status: 400 },
    )
  }

  let walletUpdateColumn: WalletUpdateColumn = 'balance_eth'
  let balanceAfter = currentBalance
  let walletUpdated = false

  if (mintingFee > 0) {
    balanceAfter = parseFloat((currentBalance - mintingFee).toFixed(8))

    const walletUpdate = await adminSupabase
      .from('wallets')
      .update({ balance_eth: balanceAfter })
      .eq('id', wallet.id)
      .eq('user_id', user.id)
      .eq('is_primary', true)

    if (walletUpdate.error) {
      if (walletUpdate.error.message?.includes('balance_eth')) {
        const fallbackUpdate = await adminSupabase
          .from('wallets')
          .update({ balance: balanceAfter })
          .eq('id', wallet.id)
          .eq('user_id', user.id)
          .eq('is_primary', true)

        if (fallbackUpdate.error) {
          console.error('[Mint] Wallet update fallback failed:', fallbackUpdate.error)
          return NextResponse.json(
            { error: 'Failed to debit wallet for minting fee' },
            { status: 500 },
          )
        }

        walletUpdateColumn = 'balance'
        walletUpdated = true
      } else {
        console.error('[Mint] Wallet update failed:', walletUpdate.error)
        return NextResponse.json(
          { error: 'Failed to debit wallet for minting fee' },
          { status: 500 },
        )
      }
    } else {
      walletUpdated = true
    }
  }

  try {
    // Insert NFT record
    const nftInsertPayload: Record<string, any> = {
      owner_id: user.id,
      creator_id: user.id,
      title,
      description,
      image_url: imageUrl,
      category_id: categoryId,
      price_eth: priceEth,
      royalty_percentage: royaltyPercentage ?? 0,
      status: 'pending',
    }

    const { data: nft, error: nftError } = await adminSupabase
      .from('nfts')
      .insert(nftInsertPayload)
      .select('*')
      .single()

    if (nftError) {
      console.error('[Mint] NFT insert failed:', nftError)
      if (walletUpdated && mintingFee > 0) {
        await revertWalletBalance(
          adminSupabase,
          wallet.id,
          user.id,
          currentBalance,
          walletUpdateColumn,
        )
      }
      return NextResponse.json({ error: 'Failed to create NFT' }, { status: 500 })
    }

    let transactionId: string | null = null
    if (mintingFee > 0) {
      const transactionPayload = {
        user_id: user.id,
        nft_id: nft.id,
        type: 'mint' as const,
        amount_eth: mintingFee,
        amount_usd: null,
        from_address: null,
        to_address: null,
        tx_hash: null,
        status: 'completed' as const,
        gas_fee: 0,
        platform_fee: mintingFee,
      }

      let transactionResult = await adminSupabase
        .from('transactions')
        .insert(transactionPayload)
        .select('id')
        .single()

      if (transactionResult.error) {
        console.error('[Mint] Transaction insert failed:', transactionResult.error)
        await adminSupabase.from('nfts').delete().eq('id', nft.id)
        if (walletUpdated) {
          await revertWalletBalance(
            adminSupabase,
            wallet.id,
            user.id,
            currentBalance,
            walletUpdateColumn,
          )
        }
        return NextResponse.json(
          { error: 'Failed to log minting transaction' },
          { status: 500 },
        )
      }

      transactionId = transactionResult.data?.id ?? null
    }

    return NextResponse.json(
      {
        data: nft,
        minting_fee: mintingFee,
        transaction_id: transactionId,
        wallet: {
          balance_before: currentBalance,
          balance_after: balanceAfter,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[Mint] Unexpected error:', error)
    if (walletUpdated && mintingFee > 0) {
      await revertWalletBalance(
        adminSupabase,
        wallet.id,
        user.id,
        currentBalance,
        walletUpdateColumn,
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function revertWalletBalance(
  supabase: ReturnType<typeof createAdminClient>,
  walletId: string,
  userId: string,
  balance: number,
  column: WalletUpdateColumn,
) {
  if (column === 'balance_eth') {
    const { error } = await supabase
      .from('wallets')
      .update({ balance_eth: balance })
      .eq('id', walletId)
      .eq('user_id', userId)
      .eq('is_primary', true)

    if (!error) {
      return
    }

    if (error.message?.includes('balance_eth')) {
      await supabase
        .from('wallets')
        .update({ balance })
        .eq('id', walletId)
        .eq('user_id', userId)
        .eq('is_primary', true)
    } else {
      console.error('[Mint] Wallet revert failed:', error)
    }
  } else {
    const { error } = await supabase
      .from('wallets')
      .update({ balance })
      .eq('id', walletId)
      .eq('user_id', userId)
      .eq('is_primary', true)

    if (error) {
      console.error('[Mint] Wallet revert failed:', error)
    }
  }
}


