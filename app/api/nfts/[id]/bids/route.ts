import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailNotificationService } from '@/lib/email/notification-service'

// POST: Place a bid on an NFT
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nftId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, amount_usd } = body

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid bid amount' }, { status: 400 })
    }

    // Get NFT and verify
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .select('id, title, owner_id, price_eth, status')
      .eq('id', nftId)
      .single()

    if (nftError || !nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
    }

    if (nft.status !== 'approved') {
      return NextResponse.json({ error: 'This NFT is not available for bidding' }, { status: 400 })
    }

    if (nft.owner_id === user.id) {
      return NextResponse.json({ error: 'You cannot bid on your own NFT' }, { status: 400 })
    }

    if (amount < nft.price_eth) {
      return NextResponse.json({ 
        error: `Bid must be at least ${nft.price_eth} ETH (asking price)` 
      }, { status: 400 })
    }

    // Check user balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance_eth, balance, id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    const balance = wallet.balance_eth ?? wallet.balance ?? 0

    if (amount > balance) {
      return NextResponse.json({ 
        error: 'Insufficient balance. You do not have enough in your wallet.' 
      }, { status: 400 })
    }

    // Check for existing pending bid
    const { data: existingBid } = await supabase
      .from('nft_bids')
      .select('id')
      .eq('nft_id', nftId)
      .eq('bidder_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingBid) {
      return NextResponse.json({ 
        error: 'You already have a pending bid on this NFT. Cancel it first to place a new bid.' 
      }, { status: 400 })
    }

    // Subtract amount from wallet (escrow)
    const updatedBalance = balance - amount

    let walletUpdate = await supabase
      .from('wallets')
      .update({
        balance_eth: updatedBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    // Fallback for legacy balance column
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
      console.error('Failed to escrow funds:', walletUpdate.error)
      return NextResponse.json({ error: 'Failed to escrow funds' }, { status: 500 })
    }

    // Create bid record
    const { data: bid, error: bidError } = await supabase
      .from('nft_bids')
      .insert({
        nft_id: nftId,
        bidder_id: user.id,
        amount_eth: amount,
        amount_usd: amount_usd,
        status: 'pending'
      })
      .select()
      .single()

    if (bidError) {
      // Rollback wallet update
      await supabase
        .from('wallets')
        .update({ balance_eth: balance })
        .eq('id', wallet.id)
      
      console.error('Failed to create bid:', bidError)
      return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 })
    }

    // Create wallet transaction record
    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'bid_escrow',
      amount: -amount,
      currency: 'ETH',
      balance_after: updatedBalance,
      description: `Bid placed on "${nft.title}"`
    })

    // Send email notification to NFT owner
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const siteName = 'Artistrytonal'
    
    // Fetch owner and bidder details
    const { data: owner } = await supabase
      .from('Users')
      .select('email, username, display_name')
      .eq('id', nft.owner_id)
      .maybeSingle()
    
    if (owner?.email) {
      const bidderUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'A collector'
      
      EmailNotificationService.sendBidReceived(owner.email, {
        sellerUsername: owner.display_name || owner.username || owner.email,
        bidderUsername,
        nftTitle: nft.title || 'Your NFT',
        nftId: nft.id,
        nftImage: undefined, // Can add if NFT image URL is available
        bidAmount: String(amount),
        bidAmountUsd: amount_usd ? String(amount_usd) : undefined,
        siteName,
        siteUrl
      }).catch(err => console.error('[Email] Bid received notification failed:', err))
    }

    return NextResponse.json({ 
      data: bid,
      message: 'Bid placed successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Bid placement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: List bids for an NFT
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nftId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('nft_bids')
      .select('*')
      .eq('nft_id', nftId)
      .order('amount_eth', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: bids, error } = await query

    if (error) {
      console.error('Error fetching bids:', error)
      return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
    }

    // Get bidder details separately
    if (bids && bids.length > 0) {
      const bidderIds = Array.from(new Set(bids.map(b => b.bidder_id)))
      const { data: bidders } = await supabase
        .from('Users')
        .select('id, username, display_name, email')
        .in('id', bidderIds)

      const biddersMap = new Map((bidders || []).map(u => [u.id, u]))
      const bidsWithBidders = bids.map(bid => ({
        ...bid,
        bidder: biddersMap.get(bid.bidder_id) || null
      }))

      return NextResponse.json({ data: bidsWithBidders })
    }

    return NextResponse.json({ data: [] })
  } catch (error) {
    console.error('Get bids error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

