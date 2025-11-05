import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Fetch badge counts for all pages
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's last viewed timestamps for each page
    const { data: pageViews } = await supabase
      .from('user_page_views')
      .select('page_name, last_viewed_at')
      .eq('user_id', user.id)

    // Convert to map for easy lookup
    const viewMap = new Map<string, string>()
    pageViews?.forEach(pv => {
      viewMap.set(pv.page_name, pv.last_viewed_at)
    })

    const counts: Record<string, number> = {
      profile: 0,
      bids: 0,
      transactions: 0,
      'nft-transactions': 0,
      support: 0
    }

    // 1. My NFT Profile: New offers on my NFTs
    const profileLastViewed = viewMap.get('profile')
    if (profileLastViewed) {
      // Get user's NFTs
      const { data: userNFTs } = await supabase
        .from('nfts')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'approved')

      if (userNFTs && userNFTs.length > 0) {
        const nftIds = userNFTs.map(nft => nft.id)
        
        // Count new bids on those NFTs
        const { count } = await supabase
          .from('nft_bids')
          .select('id', { count: 'exact', head: true })
          .in('nft_id', nftIds)
          .neq('bidder_id', user.id) // Exclude own bids
          .gte('created_at', profileLastViewed)

        counts.profile = count || 0
      }
    } else {
      // First time viewing - count all pending offers
      const { data: userNFTs } = await supabase
        .from('nfts')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'approved')

      if (userNFTs && userNFTs.length > 0) {
        const nftIds = userNFTs.map(nft => nft.id)
        
        const { count } = await supabase
          .from('nft_bids')
          .select('id', { count: 'exact', head: true })
          .in('nft_id', nftIds)
          .neq('bidder_id', user.id)
          .eq('status', 'pending')

        counts.profile = count || 0
      }
    }

    // 2. My Bids: Status changes (accepted/rejected) since last view
    const bidsLastViewed = viewMap.get('bids')
    if (bidsLastViewed) {
      const { count } = await supabase
        .from('nft_bids')
        .select('id', { count: 'exact', head: true })
        .eq('bidder_id', user.id)
        .in('status', ['accepted', 'rejected'])
        .gte('updated_at', bidsLastViewed)

      counts.bids = count || 0
    } else {
      // First time viewing - count all accepted/rejected bids
      const { count } = await supabase
        .from('nft_bids')
        .select('id', { count: 'exact', head: true })
        .eq('bidder_id', user.id)
        .in('status', ['accepted', 'rejected'])

      counts.bids = count || 0
    }

    // 3. Transactions: New transactions since last view
    const transactionsLastViewed = viewMap.get('transactions')
    if (transactionsLastViewed) {
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', transactionsLastViewed)

      counts.transactions = count || 0
    } else {
      // First time viewing - count recent transactions (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())

      counts.transactions = count || 0
    }

    // 4. NFT Transactions: New buy/sell transactions since last view
    const nftTransactionsLastViewed = viewMap.get('nft-transactions')
    if (nftTransactionsLastViewed) {
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('type', ['buy', 'sell'])
        .eq('status', 'completed')
        .gte('created_at', nftTransactionsLastViewed)

      counts['nft-transactions'] = count || 0
    } else {
      // First time viewing - count recent NFT transactions (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('type', ['buy', 'sell'])
        .eq('status', 'completed')
        .gte('created_at', sevenDaysAgo.toISOString())

      counts['nft-transactions'] = count || 0
    }

    // 5. Support: Unread admin messages in support tickets
    const supportLastViewed = viewMap.get('support')
    if (supportLastViewed) {
      // Get user's tickets
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id)

      if (tickets && tickets.length > 0) {
        const ticketIds = tickets.map(t => t.id)
        
        // Count admin messages created after last view
        const { count } = await supabase
          .from('support_ticket_messages')
          .select('id', { count: 'exact', head: true })
          .in('ticket_id', ticketIds)
          .eq('is_admin', true)
          .gte('created_at', supportLastViewed)

        counts.support = count || 0
      }
    } else {
      // First time viewing - count all admin messages
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id)

      if (tickets && tickets.length > 0) {
        const ticketIds = tickets.map(t => t.id)
        
        const { count } = await supabase
          .from('support_ticket_messages')
          .select('id', { count: 'exact', head: true })
          .in('ticket_id', ticketIds)
          .eq('is_admin', true)

        counts.support = count || 0
      }
    }

    return NextResponse.json({ counts })
  } catch (error) {
    console.error('Badge counts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

