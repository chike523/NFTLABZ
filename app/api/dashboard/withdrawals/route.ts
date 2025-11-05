import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailNotificationService } from '@/lib/email/notification-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { address, amount, network } = body

    // Validate inputs
    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Withdrawal address is required' }, { status: 400 })
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    // Fetch user wallet balance
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance_eth, balance, id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()

    if (walletError) {
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
    }

    if (!wallet) {
      return NextResponse.json({ error: 'No wallet found' }, { status: 404 })
    }

    const balance = wallet.balance_eth ?? wallet.balance ?? 0

    // Check sufficient balance
    if (amount > balance) {
      return NextResponse.json({ 
        error: 'Insufficient balance. You do not have enough in your wallet.' 
      }, { status: 400 })
    }

    // Create pending withdrawal transaction
    const roundedAmount = Number(amount.toFixed(8))
    const tokenSymbol = network?.toUpperCase() || 'ETH'

    const transactionPayload = {
      user_id: user.id,
      type: 'withdrawal',
      amount_eth: roundedAmount,
      amount_usd: null,
      from_address: null,
      to_address: address.trim(),
      status: 'pending',
      gas_fee: 0,
      platform_fee: 0
    }

    // Try with token_symbol first
    let transactionResult = await supabase
      .from('transactions')
      .insert({ ...transactionPayload, token_symbol: tokenSymbol })
      .select()
      .single()

    // Fallback if token_symbol column doesn't exist
    if (transactionResult.error && transactionResult.error.message?.includes('token_symbol')) {
      transactionResult = await supabase
        .from('transactions')
        .insert(transactionPayload)
        .select()
        .single()
    }

    if (transactionResult.error) {
      console.error('Failed to create withdrawal transaction:', transactionResult.error)
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
    }

    // Send admin alert email asynchronously
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const siteName = 'Artistrytonal'
    
    EmailNotificationService.getAdminEmails()
      .then(adminEmails => {
        if (adminEmails.length > 0) {
          return EmailNotificationService.sendAdminNewWithdrawal(adminEmails, {
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            userEmail: user.email || 'N/A',
            amount: String(roundedAmount),
            amountUsd: undefined, // Can calculate if needed
            toAddress: address.trim(),
            transactionId: transactionResult.data.id,
            siteName,
            siteUrl
          })
        }
      })
      .catch(err => console.error('[Email] Admin withdrawal alert failed:', err))

    return NextResponse.json({ 
      data: transactionResult.data,
      message: 'Withdrawal request submitted successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Withdrawal creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

