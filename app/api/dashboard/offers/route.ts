import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Fetch all bids on user's NFTs
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's NFTs
    const { data: nfts, error: nftsError } = await supabase
      .from('nfts')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'approved')

    if (nftsError) {
      console.error('Error fetching NFTs:', nftsError)
      return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
    }

    if (!nfts || nfts.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get all pending bids on those NFTs (excluding owner's own bids)
    const nftIds = nfts.map(n => n.id)
    const { data: bids, error: bidsError } = await supabase
      .from('nft_bids')
      .select('*')
      .in('nft_id', nftIds)
      .eq('status', 'pending')
      .neq('bidder_id', user.id)
      .order('amount_eth', { ascending: false })

    if (bidsError) {
      console.error('Error fetching bids:', bidsError)
      return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
    }

    // Get unique bidder IDs and fetch user details separately
    const bidderIds = Array.from(new Set((bids || []).map(b => b.bidder_id)))
    const { data: bidders } = await supabase
      .from('Users')
      .select('id, username, display_name, email')
      .in('id', bidderIds)

    // Map bidder details to bids
    const biddersMap = new Map((bidders || []).map(u => [u.id, u]))
    const bidsWithBidders = (bids || []).map(bid => ({
      ...bid,
      bidder: biddersMap.get(bid.bidder_id) || null
    }))

    // Group bids by NFT
    const nftsWithBids = nfts.map(nft => {
      const nftBids = bidsWithBidders.filter(b => b.nft_id === nft.id)
      const highestBid = nftBids.length > 0 
        ? Math.max(...nftBids.map(b => Number(b.amount_eth)))
        : 0

      return {
        nft,
        bids: nftBids,
        bidCount: nftBids.length,
        highestBid
      }
    }).filter(item => item.bidCount > 0) // Only include NFTs with bids

    return NextResponse.json({ data: nftsWithBids })
  } catch (error) {
    console.error('Get offers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

