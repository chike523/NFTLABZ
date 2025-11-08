import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmailNotificationService } from '@/lib/email/notification-service'

type WalletAction = 'credit' | 'debit'

interface AdjustmentPayload {
  action: WalletAction
  amount: number
  note?: string | null
  silent?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()
  const userId = params.id

  if (!userId) {
    return NextResponse.json({ error: 'Missing user identifier' }, { status: 400 })
  }

  let payload: AdjustmentPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const { action, amount, note, silent } = payload

  if (action !== 'credit' && action !== 'debit') {
    return NextResponse.json({ error: 'Invalid action. Must be credit or debit.' }, { status: 400 })
  }

  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
  }

  try {
    // Ensure user exists (lightweight check)
    const { data: existingUser, error: userError } = await supabase
      .from('Users')
      .select('id, email, username, display_name')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      console.error('[Admin Wallet Adjustment] Failed to fetch user:', userError)
      return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 })
    }

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch or create primary wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance_eth, balance, balance_usd, is_primary')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle()

    if (walletError) {
      console.error('[Admin Wallet Adjustment] Failed to fetch wallet:', walletError)
      return NextResponse.json({ error: 'Failed to fetch user wallet' }, { status: 500 })
    }

    if (!wallet) {
      const now = new Date().toISOString()
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          wallet_type: 'internal',
          wallet_address: null,
          balance_eth: 0,
          balance_usd: 0,
          is_primary: true,
          is_verified: false,
          created_at: now,
          updated_at: now,
        })
        .select('id, balance_eth, balance, balance_usd, is_primary')
        .maybeSingle()

      if (createError) {
        if (createError.message?.includes('wallet_type')) {
          const { data: legacyWallet, error: legacyError } = await supabase
            .from('wallets')
            .insert({
              user_id: userId,
              wallet_address: null,
              balance: 0,
              created_at: now,
              updated_at: now,
            })
            .select('id, balance_eth, balance, balance_usd, is_primary')
            .maybeSingle()

          if (legacyError) {
            console.error('[Admin Wallet Adjustment] Failed to create wallet (legacy):', legacyError)
            return NextResponse.json({ error: 'Failed to create wallet for user' }, { status: 500 })
          }

          wallet = legacyWallet!
        } else {
          console.error('[Admin Wallet Adjustment] Failed to create wallet:', createError)
          return NextResponse.json({ error: 'Failed to create wallet for user' }, { status: 500 })
        }
      } else {
        wallet = newWallet!
      }
    }

    const currentBalance = Number(wallet.balance_eth ?? wallet.balance ?? 0)
    const updatedBalance =
      action === 'credit' ? currentBalance + numericAmount : currentBalance - numericAmount

    if (action === 'debit' && updatedBalance < 0) {
      return NextResponse.json(
        { error: 'Insufficient balance to perform debit.' },
        { status: 400 }
      )
    }

    const updatePayload: Record<string, number | string> = {
      balance_eth: updatedBalance,
      updated_at: new Date().toISOString(),
    }

    let walletUpdate = await supabase
      .from('wallets')
      .update(updatePayload)
      .eq('id', wallet.id)
      .eq('user_id', userId)
      .eq('is_primary', true)

    if (walletUpdate.error) {
      if (walletUpdate.error.message?.includes('balance_eth')) {
        walletUpdate = await supabase
          .from('wallets')
          .update({
            balance: updatedBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id)
          .eq('user_id', userId)
          .eq('is_primary', true)
      }
    }

    if (walletUpdate.error) {
      console.error('[Admin Wallet Adjustment] Wallet update failed:', walletUpdate.error)
      return NextResponse.json({ error: 'Failed to update wallet balance' }, { status: 500 })
    }

    let transactionId: string | null = null
    let notificationSent = false

    if (!silent) {
      const trimmedNote = note?.toString().trim()
      const adminNotePayload = trimmedNote
        ? JSON.stringify({
            note: trimmedNote,
            action,
          })
        : null

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          nft_id: null,
          type: action === 'credit' ? 'deposit' : 'withdrawal',
          amount_eth: numericAmount,
          amount_usd: null,
          from_address: null,
          to_address: null,
          tx_hash: null,
          status: 'completed',
          gas_fee: 0,
          platform_fee: 0,
          admin_note: adminNotePayload,
        })
        .select('id')
        .maybeSingle()

      if (transactionError) {
        console.error('[Admin Wallet Adjustment] Failed to log transaction:', transactionError)
        // Attempt to revert wallet balance to original state
        await supabase
          .from('wallets')
          .update({
            balance_eth: currentBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id)
          .eq('user_id', userId)
          .eq('is_primary', true)

        return NextResponse.json(
          { error: 'Failed to record transaction. Wallet balance restored.' },
          { status: 500 }
        )
      }

      transactionId = transaction?.id ?? null
      if (existingUser?.email) {
        const recipientName =
          existingUser.display_name ||
          existingUser.username ||
          existingUser.email.split('@')[0] ||
          'User'

        try {
          await EmailNotificationService.sendWalletAdjustment(existingUser.email, {
            username: recipientName,
            amount: numericAmount.toString(),
            action,
            transactionType: action === 'credit' ? 'deposit' : 'withdrawal',
            note: trimmedNote || undefined,
            balanceAfter: updatedBalance.toString(),
            siteName: 'Artistrytonal',
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          })
          notificationSent = true
        } catch (emailError) {
          console.error('[Admin Wallet Adjustment] Failed to send notification email:', emailError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        balance_before: currentBalance,
        balance_after: updatedBalance,
        transaction_id: transactionId,
        notification_sent: notificationSent,
        should_refresh_badges: !silent,
      },
    })
  } catch (error) {
    console.error('[Admin Wallet Adjustment] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


