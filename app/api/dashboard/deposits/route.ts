import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmailNotificationService } from '@/lib/email/notification-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { walletId, amount, symbol, usdAmount, network } = body ?? {}

    if (!walletId || typeof walletId !== 'string') {
      return NextResponse.json({ error: 'walletId is required' }, { status: 400 })
    }

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    const trimmedSymbol = typeof symbol === 'string' && symbol.trim() ? symbol.trim().toUpperCase() : 'ETH'

    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError) {
      console.warn('Admin client unavailable, falling back to user client:', adminError)
      adminClient = supabase
    }

    const { data: wallet, error: walletError } = await adminClient
      .from('deposit_wallets')
      .select('*')
      .eq('id', walletId)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Deposit wallet not found' }, { status: 404 })
    }

    if (!wallet.is_active) {
      return NextResponse.json({ error: 'Deposit wallet is inactive' }, { status: 400 })
    }

    const roundedAmount = Number(amount.toFixed(8))
    const roundedUsd = typeof usdAmount === 'number' && Number.isFinite(usdAmount)
      ? Number(usdAmount.toFixed(2))
      : null

    const transactionPayload: Record<string, any> = {
      user_id: user.id,
      type: 'deposit',
      amount_eth: roundedAmount,
      amount_usd: roundedUsd,
      from_address: null,
      to_address: wallet.address,
      status: 'pending',
      gas_fee: 0,
      platform_fee: 0
    }

    let transactionResult = await supabase
      .from('transactions')
      .insert({
        ...transactionPayload,
        token_symbol: trimmedSymbol
      })
      .select()
      .single()

    if (transactionResult.error && transactionResult.error.message?.includes('token_symbol')) {
      transactionResult = await supabase
        .from('transactions')
        .insert(transactionPayload)
        .select()
        .single()
    }

    if (transactionResult.error) {
      console.error('Failed to create pending deposit transaction:', transactionResult.error)
      return NextResponse.json({ error: 'Failed to create deposit transaction' }, { status: 500 })
    }

    // Send admin alert email asynchronously
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const siteName = 'Artistrytonal'
    
    EmailNotificationService.getAdminEmails()
      .then(adminEmails => {
        if (adminEmails.length > 0) {
          return EmailNotificationService.sendAdminNewDeposit(adminEmails, {
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            userEmail: user.email || 'N/A',
            amount: String(roundedAmount),
            amountUsd: roundedUsd ? String(roundedUsd) : undefined,
            transactionId: transactionResult.data.id,
            siteName,
            siteUrl
          })
        }
      })
      .catch(err => console.error('[Email] Admin deposit alert failed:', err))

    return NextResponse.json({
      data: transactionResult.data,
      context: {
        wallet: {
          id: wallet.id,
          name: wallet.name,
          network: wallet.network
        },
        symbol: trimmedSymbol,
        network
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Deposit creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

