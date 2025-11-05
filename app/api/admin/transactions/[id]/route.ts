import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmailNotificationService } from '@/lib/email/notification-service'

async function getTransactionById(supabase: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const [userRow, nftRow] = await Promise.all([
    data.user_id
      ? supabase
          .from('Users')
          .select('id, username, display_name, email')
          .eq('id', data.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    data.nft_id
      ? supabase
          .from('nfts')
          .select('id, title')
          .eq('id', data.nft_id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ])

  return {
    ...data,
    user: userRow?.data || null,
    nft: nftRow?.data || null
  }
}

async function applyDepositApproval(
  supabase: ReturnType<typeof createAdminClient>,
  transaction: any
) {
  if (transaction.type !== 'deposit') {
    console.log('[applyDepositApproval] Skipping: not a deposit transaction')
    return
  }

  console.log('[applyDepositApproval] Processing deposit for user:', transaction.user_id, 'amount:', transaction.amount_eth)

  // Find or create primary wallet
  let { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', transaction.user_id)
    .eq('is_primary', true)
    .single()

  if (walletError || !wallet) {
    console.log('[applyDepositApproval] No primary wallet found, creating one...')
    
    // Create primary wallet
    const now = new Date().toISOString()
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        user_id: transaction.user_id,
        wallet_type: 'external',
        wallet_address: null,
        balance_eth: 0,
        balance_usd: 0,
        is_primary: true,
        is_verified: false,
        created_at: now,
        updated_at: now
      })
      .select('*')
      .single()

    if (createError && createError.message?.includes('wallet_type')) {
      console.log('[applyDepositApproval] wallet_type column missing, using legacy schema...')
      
      const { data: legacyWallet, error: legacyError } = await supabase
        .from('wallets')
        .insert({
          user_id: transaction.user_id,
          wallet_address: null,
          balance: 0,
          created_at: now,
          updated_at: now
        })
        .select('*')
        .single()

      if (legacyError) {
        console.error('[applyDepositApproval] Failed to create legacy wallet:', legacyError)
        throw new Error('Failed to create primary wallet for user')
      }

      wallet = legacyWallet
      console.log('[applyDepositApproval] Created legacy wallet:', wallet.id)
    } else if (createError) {
      console.error('[applyDepositApproval] Failed to create wallet:', createError)
      throw new Error('Failed to create primary wallet for user')
    } else {
      wallet = newWallet
      console.log('[applyDepositApproval] Created new wallet:', wallet.id)
    }
  } else {
    console.log('[applyDepositApproval] Found existing wallet:', wallet.id)
  }

  const currentBalance = Number(wallet.balance_eth ?? wallet.balance ?? 0)
  const updatedBalance = currentBalance + Number(transaction.amount_eth || 0)
  const currentUsd = Number(wallet.balance_usd ?? 0)
  const updatedUsd = currentUsd + Number(transaction.amount_usd || 0)

  console.log('[applyDepositApproval] Updating balance:', currentBalance, '→', updatedBalance)

  let walletUpdate = await supabase
    .from('wallets')
    .update({
      balance_eth: updatedBalance,
      balance_usd: updatedUsd,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)

  if (walletUpdate.error && walletUpdate.error.message?.includes('balance_eth')) {
    console.log('[applyDepositApproval] balance_eth column missing, using legacy balance column...')
    
    walletUpdate = await supabase
      .from('wallets')
      .update({
        balance: updatedBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
  }

  if (walletUpdate.error) {
    console.error('[applyDepositApproval] Wallet update failed:', walletUpdate.error)
    throw walletUpdate.error
  }

  console.log('[applyDepositApproval] Wallet updated successfully')
  
  // Verify the update actually worked
  const { data: verifyWallet, error: verifyError } = await supabase
    .from('wallets')
    .select('balance_eth, balance_usd, balance')
    .eq('id', wallet.id)
    .single()
  
  if (verifyError) {
    console.error('[applyDepositApproval] Verification query failed:', verifyError)
  } else {
    const verifiedBalance = verifyWallet?.balance_eth ?? verifyWallet?.balance ?? 0
    console.log('[applyDepositApproval] Verified wallet balance after update:', verifiedBalance, '(expected:', updatedBalance, ')')
    
    if (Math.abs(Number(verifiedBalance) - updatedBalance) > 0.0001) {
      console.warn('[applyDepositApproval] WARNING: Balance mismatch! Database shows:', verifiedBalance, 'but expected:', updatedBalance)
    }
  }

  const currency = ['ETH', 'WETH', 'USD'].includes((transaction.token_symbol || '').toUpperCase())
    ? (transaction.token_symbol || 'ETH').toUpperCase()
    : 'ETH'

  const walletTxInsert = await supabase.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    transaction_id: transaction.id,
    type: 'deposit',
    amount: transaction.amount_eth,
    currency,
    balance_after: updatedBalance
  })

  if (walletTxInsert.error && walletTxInsert.error.message?.includes('relation "wallet_transactions" does not exist')) {
    console.warn('[applyDepositApproval] wallet_transactions table not available; skipping ledger entry')
  } else if (walletTxInsert.error) {
    console.error('[applyDepositApproval] wallet_transactions insert failed:', walletTxInsert.error)
    throw walletTxInsert.error
  } else {
    console.log('[applyDepositApproval] Wallet transaction recorded')
  }

  console.log('[applyDepositApproval] Deposit approval complete')
}

async function revertApprovedDeposit(
  supabase: ReturnType<typeof createAdminClient>,
  transaction: any
) {
  if (transaction.type !== 'deposit' || transaction.status !== 'completed') {
    return
  }

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', transaction.user_id)
    .eq('is_primary', true)
    .single()

  if (walletError || !wallet) {
    return
  }

  const currentBalance = Number(wallet.balance_eth || 0)
  const updatedBalance = currentBalance - Number(transaction.amount_eth || 0)
  const currentUsd = Number(wallet.balance_usd || 0)
  const updatedUsd = currentUsd - Number(transaction.amount_usd || 0)

  let walletUpdate = await supabase
    .from('wallets')
    .update({
      balance_eth: updatedBalance,
      balance_usd: updatedUsd,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)

  if (walletUpdate.error && walletUpdate.error.message?.includes('balance_eth')) {
    walletUpdate = await supabase
      .from('wallets')
      .update({
        balance: updatedBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
  }

  if (walletUpdate.error) {
    throw walletUpdate.error
  }

  const { error: deleteWalletTxError } = await supabase
    .from('wallet_transactions')
    .delete()
    .eq('transaction_id', transaction.id)

  if (deleteWalletTxError) {
    throw deleteWalletTxError
  }
}

async function applyWithdrawalApproval(
  supabase: ReturnType<typeof createAdminClient>,
  transaction: any
) {
  console.log('[applyWithdrawalApproval] Starting withdrawal approval for transaction:', transaction.id)

  // Fetch user's primary wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', transaction.user_id)
    .eq('is_primary', true)
    .single()

  if (walletError || !wallet) {
    console.error('[applyWithdrawalApproval] Wallet not found:', walletError)
    throw new Error('User wallet not found')
  }

  const currentBalance = Number(wallet.balance_eth ?? wallet.balance ?? 0)
  const withdrawalAmount = Number(transaction.amount_eth || 0)

  // Double-check sufficient balance
  if (withdrawalAmount > currentBalance) {
    console.error('[applyWithdrawalApproval] Insufficient balance:', currentBalance, 'needed:', withdrawalAmount)
    throw new Error('Insufficient balance for withdrawal')
  }

  const updatedBalance = currentBalance - withdrawalAmount
  const currentUsd = Number(wallet.balance_usd ?? 0)
  const updatedUsd = currentUsd - Number(transaction.amount_usd || 0)

  console.log('[applyWithdrawalApproval] Subtracting balance:', currentBalance, '→', updatedBalance)

  // Update wallet balance
  let walletUpdate = await supabase
    .from('wallets')
    .update({
      balance_eth: updatedBalance,
      balance_usd: updatedUsd,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)

  // Fallback for legacy balance column
  if (walletUpdate.error && walletUpdate.error.message?.includes('balance_eth')) {
    console.log('[applyWithdrawalApproval] balance_eth column missing, using legacy balance column...')
    
    walletUpdate = await supabase
      .from('wallets')
      .update({
        balance: updatedBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
  }

  if (walletUpdate.error) {
    console.error('[applyWithdrawalApproval] Wallet update failed:', walletUpdate.error)
    throw walletUpdate.error
  }

  console.log('[applyWithdrawalApproval] Wallet updated successfully')

  // Verify the update
  const { data: verifyWallet, error: verifyError } = await supabase
    .from('wallets')
    .select('balance_eth, balance_usd, balance')
    .eq('id', wallet.id)
    .single()
  
  if (verifyError) {
    console.error('[applyWithdrawalApproval] Verification query failed:', verifyError)
  } else {
    const verifiedBalance = verifyWallet?.balance_eth ?? verifyWallet?.balance ?? 0
    console.log('[applyWithdrawalApproval] Verified wallet balance after update:', verifiedBalance, '(expected:', updatedBalance, ')')
  }

  // Record in wallet_transactions
  const currency = ['ETH', 'WETH', 'USD'].includes((transaction.token_symbol || '').toUpperCase())
    ? (transaction.token_symbol || 'ETH').toUpperCase()
    : 'ETH'

  const walletTxInsert = await supabase.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    transaction_id: transaction.id,
    type: 'withdrawal',
    amount: -withdrawalAmount, // Negative for withdrawal
    currency,
    balance_after: updatedBalance
  })

  if (walletTxInsert.error && walletTxInsert.error.message?.includes('relation "wallet_transactions" does not exist')) {
    console.warn('[applyWithdrawalApproval] wallet_transactions table not available; skipping ledger entry')
  } else if (walletTxInsert.error) {
    console.error('[applyWithdrawalApproval] wallet_transactions insert failed:', walletTxInsert.error)
    throw walletTxInsert.error
  } else {
    console.log('[applyWithdrawalApproval] Wallet transaction recorded')
  }

  console.log('[applyWithdrawalApproval] Withdrawal approval complete')
}

async function revertApprovedWithdrawal(
  supabase: ReturnType<typeof createAdminClient>,
  transaction: any
) {
  if (transaction.type !== 'withdrawal' || transaction.status !== 'completed') {
    return
  }

  console.log('[revertApprovedWithdrawal] Reverting withdrawal for transaction:', transaction.id)

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', transaction.user_id)
    .eq('is_primary', true)
    .single()

  if (walletError || !wallet) {
    console.warn('[revertApprovedWithdrawal] Wallet not found:', walletError)
    return
  }

  // Add the amount back
  const currentBalance = Number(wallet.balance_eth ?? wallet.balance ?? 0)
  const updatedBalance = currentBalance + Number(transaction.amount_eth || 0)
  const currentUsd = Number(wallet.balance_usd ?? 0)
  const updatedUsd = currentUsd + Number(transaction.amount_usd || 0)

  console.log('[revertApprovedWithdrawal] Adding balance back:', currentBalance, '→', updatedBalance)

  let walletUpdate = await supabase
    .from('wallets')
    .update({
      balance_eth: updatedBalance,
      balance_usd: updatedUsd,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)

  if (walletUpdate.error && walletUpdate.error.message?.includes('balance_eth')) {
    walletUpdate = await supabase
      .from('wallets')
      .update({
        balance: updatedBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
  }

  if (walletUpdate.error) {
    console.error('[revertApprovedWithdrawal] Wallet update failed:', walletUpdate.error)
    throw walletUpdate.error
  }

  // Delete wallet transaction record
  const { error: deleteWalletTxError } = await supabase
    .from('wallet_transactions')
    .delete()
    .eq('transaction_id', transaction.id)

  if (deleteWalletTxError && !deleteWalletTxError.message?.includes('relation "wallet_transactions" does not exist')) {
    console.error('[revertApprovedWithdrawal] Failed to delete wallet transaction:', deleteWalletTxError)
  }

  console.log('[revertApprovedWithdrawal] Withdrawal revert complete')
}

// =============================================
// GET: Fetch single transaction
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const data = await getTransactionById(supabase, id)

    if (!data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Admin transaction fetch failed:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch transaction', data: null },
      { status: error?.code === 'PGRST116' ? 404 : 500 }
    )
  }
}

// =============================================
// PATCH: Update transaction
// =============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[PATCH /api/admin/transactions] Processing transaction:', id)
    
    const supabase = createAdminClient()
    const transaction = await getTransactionById(supabase, id)

    if (!transaction) {
      console.error('[PATCH] Transaction not found:', id)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.log('[PATCH] Current transaction status:', transaction.status, 'type:', transaction.type, 'amount:', transaction.amount_eth, 'user:', transaction.user_id)

    const body = await request.json()
    const nextStatus = body.status as string | undefined
    const adminNote = typeof body.adminNote === 'string' ? body.adminNote : undefined

    console.log('[PATCH] Requested status change:', transaction.status, '→', nextStatus)

    if (!nextStatus || !['pending', 'completed', 'failed', 'cancelled'].includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      status: nextStatus,
      admin_note: adminNote ?? null,
      updated_at: new Date().toISOString()
    }

    if (transaction.status !== 'completed' && nextStatus === 'completed') {
      console.log('[PATCH] Approving transaction - applying wallet balance update...')
      try {
        if (transaction.type === 'deposit') {
          await applyDepositApproval(supabase, transaction)
          console.log('[PATCH] Deposit approval completed successfully')
        } else if (transaction.type === 'withdrawal') {
          await applyWithdrawalApproval(supabase, transaction)
          console.log('[PATCH] Withdrawal approval completed successfully')
        }
      } catch (approvalError: any) {
        console.error('[PATCH] Wallet balance update failed:', approvalError)
        throw new Error(`Failed to update wallet balance: ${approvalError?.message || approvalError}`)
      }
    }

    if (transaction.status === 'completed' && nextStatus !== 'completed') {
      if (transaction.type === 'deposit') {
        await revertApprovedDeposit(supabase, transaction)
      } else if (transaction.type === 'withdrawal') {
        await revertApprovedWithdrawal(supabase, transaction)
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const enriched = await getTransactionById(supabase, id)

    // Send email notifications asynchronously (don't block the response)
    if (enriched?.user?.email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const siteName = 'Artistrytonal' // Can be fetched from settings if needed
      
      try {
        if (enriched.type === 'deposit') {
          if (transaction.status !== 'completed' && nextStatus === 'completed') {
            // Deposit approved
            EmailNotificationService.sendDepositApproved(enriched.user.email, {
              username: enriched.user.display_name || enriched.user.username || enriched.user.email,
              amount: String(enriched.amount_eth || 0),
              amountUsd: enriched.amount_usd ? String(enriched.amount_usd) : undefined,
              transactionHash: enriched.tx_hash || undefined,
              siteName,
              siteUrl
            }).catch(err => console.error('[Email] Deposit approved notification failed:', err))
          } else if (transaction.status === 'pending' && ['failed', 'cancelled'].includes(nextStatus)) {
            // Deposit rejected
            EmailNotificationService.sendDepositRejected(enriched.user.email, {
              username: enriched.user.display_name || enriched.user.username || enriched.user.email,
              amount: String(enriched.amount_eth || 0),
              amountUsd: enriched.amount_usd ? String(enriched.amount_usd) : undefined,
              reason: adminNote || 'Transaction could not be verified',
              siteName,
              siteUrl
            }).catch(err => console.error('[Email] Deposit rejected notification failed:', err))
          }
        } else if (enriched.type === 'withdrawal') {
          if (transaction.status !== 'completed' && nextStatus === 'completed') {
            // Withdrawal approved
            EmailNotificationService.sendWithdrawalApproved(enriched.user.email, {
              username: enriched.user.display_name || enriched.user.username || enriched.user.email,
              amount: String(enriched.amount_eth || 0),
              amountUsd: enriched.amount_usd ? String(enriched.amount_usd) : undefined,
              toAddress: enriched.to_address || 'N/A',
              transactionHash: enriched.tx_hash || undefined,
              siteName,
              siteUrl
            }).catch(err => console.error('[Email] Withdrawal approved notification failed:', err))
          } else if (transaction.status === 'pending' && ['failed', 'cancelled'].includes(nextStatus)) {
            // Withdrawal rejected
            EmailNotificationService.sendWithdrawalRejected(enriched.user.email, {
              username: enriched.user.display_name || enriched.user.username || enriched.user.email,
              amount: String(enriched.amount_eth || 0),
              amountUsd: enriched.amount_usd ? String(enriched.amount_usd) : undefined,
              toAddress: enriched.to_address || 'N/A',
              reason: adminNote || 'Withdrawal request was declined',
              siteName,
              siteUrl
            }).catch(err => console.error('[Email] Withdrawal rejected notification failed:', err))
          }
        }
      } catch (emailError) {
        // Log but don't fail the transaction
        console.error('[Email] Notification error:', emailError)
      }
    }

    return NextResponse.json({ data: enriched })
  } catch (error: any) {
    console.error('Admin transaction update failed:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const transaction = await getTransactionById(supabase, id)

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status === 'completed') {
      if (transaction.type === 'deposit') {
        await revertApprovedDeposit(supabase, transaction)
      } else if (transaction.type === 'withdrawal') {
        await revertApprovedWithdrawal(supabase, transaction)
      }
    }

    const { error: deleteWalletTxError } = await supabase
      .from('wallet_transactions')
      .delete()
      .eq('transaction_id', transaction.id)

    if (deleteWalletTxError) {
      throw deleteWalletTxError
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin transaction deletion failed:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}

