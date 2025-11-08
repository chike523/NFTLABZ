import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { EmailNotificationService } from '@/lib/email/notification-service'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service role not configured')
  }
  return createClient(url, key)
}

// GET /api/admin/nfts/:id
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('nfts')
      .select(`*, category:categories(name, slug)`) 
      .eq('id', params.id)
      .single()
    if (error) throw error

    // Attach minimal owner/creator data
    if (data) {
      const userIds = [data.owner_id, data.creator_id].filter(Boolean)
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('Users')
          .select('id, username, display_name')
          .in('id', userIds)
        if (users) {
          ;(data as any).owner = users.find((u: any) => u.id === data.owner_id) || null
          ;(data as any).creator = users.find((u: any) => u.id === data.creator_id) || null
        }
      }
    }

    return NextResponse.json({ data, error: null })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: err?.message || 'Failed to fetch NFT' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/nfts/:id  { status?: 'approved'|'rejected' }
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const { status } = body || {}
    const supabase = getServiceClient()

    // Get NFT before update to check status change
    const { data: beforeNft } = await supabase
      .from('nfts')
      .select('id, title, image_url, price_eth, status, owner_id, creator_id')
      .eq('id', params.id)
      .single()

    if (status) {
      const { error } = await supabase
        .from('nfts')
        .update({ status })
        .eq('id', params.id)
      if (error) throw error
    }

    const { data, error } = await supabase
      .from('nfts')
      .select(`*, category:categories(name, slug)`) 
      .eq('id', params.id)
      .single()
    if (error) throw error

    // Send email notification if status changed
    if (beforeNft && status && beforeNft.status !== status) {
      const ownerId = data.owner_id || data.creator_id
      
      if (ownerId) {
        const { data: owner } = await supabase
          .from('Users')
          .select('email, username, display_name')
          .eq('id', ownerId)
          .maybeSingle()
        
        if (owner?.email) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
          const siteName = 'Artistrytonal'
          
          try {
            if (status === 'approved') {
              EmailNotificationService.sendNftApproved(owner.email, {
                username: owner.display_name || owner.username || owner.email,
                nftTitle: data.title || 'Your NFT',
                nftId: data.id,
                nftImage: data.image_url ? `${siteUrl}${data.image_url}` : undefined,
                priceEth: data.price_eth ? String(data.price_eth) : undefined,
                siteName,
                siteUrl
              }).catch(err => console.error('[Email] NFT approved notification failed:', err))
            } else if (status === 'rejected') {
              await processMintFeeRefund(supabase, params.id, ownerId)
              EmailNotificationService.sendNftRejected(owner.email, {
                username: owner.display_name || owner.username || owner.email,
                nftTitle: data.title || 'Your NFT',
                nftId: data.id,
                nftImage: data.image_url ? `${siteUrl}${data.image_url}` : undefined,
                reason: body.adminNote || 'Your NFT does not meet our current guidelines. Please review and resubmit.',
                siteName,
                siteUrl
              }).catch(err => console.error('[Email] NFT rejected notification failed:', err))
            }
          } catch (emailError) {
            console.error('[Email] NFT notification error:', emailError)
          }
        }
      }
    }

    return NextResponse.json({ data, error: null })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: err?.message || 'Failed to update NFT' },
      { status: 500 }
    )
  }
}

async function processMintFeeRefund(
  supabase: ReturnType<typeof getServiceClient>,
  nftId: string,
  userId: string
) {
  try {
    // Fetch mint transaction
    const { data: mintTransaction, error: mintTxError } = await supabase
      .from('transactions')
      .select('id, amount_eth, status')
      .eq('nft_id', nftId)
      .eq('type', 'mint')
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (mintTxError) {
      console.error('[Mint Refund] Failed to fetch mint transaction:', mintTxError)
      return
    }

    const refundAmount = Number(mintTransaction?.amount_eth ?? 0)
    if (!mintTransaction || !refundAmount || refundAmount <= 0) {
      return
    }

    if (mintTransaction.status && mintTransaction.status !== 'completed') {
      // Already refunded or cancelled
      return
    }

    // Fetch user wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance_eth, balance')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle()

    if (walletError || !wallet) {
      console.error('[Mint Refund] Failed to fetch wallet for refund:', walletError)
      return
    }

    const currentBalance = Number(wallet.balance_eth ?? wallet.balance ?? 0)
    const updatedBalance = parseFloat((currentBalance + refundAmount).toFixed(8))

    let walletUpdate = await supabase
      .from('wallets')
      .update({ balance_eth: updatedBalance })
      .eq('id', wallet.id)
      .eq('user_id', userId)
      .eq('is_primary', true)

    if (walletUpdate.error) {
      if (walletUpdate.error.message?.includes('balance_eth')) {
        walletUpdate = await supabase
          .from('wallets')
          .update({ balance: updatedBalance })
          .eq('id', wallet.id)
          .eq('user_id', userId)
          .eq('is_primary', true)

        if (walletUpdate.error) {
          console.error('[Mint Refund] Wallet balance fallback failed:', walletUpdate.error)
          return
        }
      } else {
        console.error('[Mint Refund] Wallet balance update failed:', walletUpdate.error)
        return
      }
    }

    // Mark original mint transaction as cancelled
    const { error: cancelError } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', mintTransaction.id)

    if (cancelError) {
      console.error('[Mint Refund] Failed to cancel mint transaction:', cancelError)
    }

    // Log refund transaction
    const { error: refundTxError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        nft_id: nftId,
        type: 'deposit',
        amount_eth: refundAmount,
        amount_usd: null,
        from_address: null,
        to_address: null,
        tx_hash: null,
        status: 'completed',
        gas_fee: 0,
        platform_fee: 0
      })

    if (refundTxError) {
      console.error('[Mint Refund] Failed to record refund transaction:', refundTxError)
    }
  } catch (error) {
    console.error('[Mint Refund] Unexpected error:', error)
  }
}

// DELETE /api/admin/nfts/:id
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient()
    const { error } = await supabase
      .from('nfts')
      .delete()
      .eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete NFT' },
      { status: 500 }
    )
  }
}


