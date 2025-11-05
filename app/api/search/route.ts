import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ data: [] })
    }

    const supabase = await createClient()
    const searchTerm = `%${query.trim()}%`

    // Search in NFTs table
    const { data: nfts, error } = await supabase
      .from('nfts')
      .select(`
        id,
        title,
        description,
        image_url,
        price_eth,
        status,
        creator_id,
        owner_id
      `)
      .eq('status', 'approved')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(20)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Fetch creator names for the results
    if (nfts && nfts.length > 0) {
      const creatorIds = Array.from(new Set(nfts.map(nft => nft.creator_id || nft.owner_id).filter(Boolean)))
      
      const { data: creators } = await supabase
        .from('Users')
        .select('id, username, display_name')
        .in('id', creatorIds)

      const creatorsMap = new Map(creators?.map(c => [c.id, c]) || [])

      const enrichedNfts = nfts.map(nft => ({
        ...nft,
        creator_name: creatorsMap.get(nft.creator_id || nft.owner_id)?.display_name || 
                      creatorsMap.get(nft.creator_id || nft.owner_id)?.username || 
                      'Unknown'
      }))

      return NextResponse.json({ data: enrichedNfts })
    }

    return NextResponse.json({ data: [] })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

