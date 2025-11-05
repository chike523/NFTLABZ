import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Fetch user's buy and sell NFT transactions
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch all user's buy and sell transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        nft:nfts(id, title, image_url, price_eth)
      `)
      .eq('user_id', user.id)
      .in('type', ['buy', 'sell'])
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (txError) {
      console.error('Error fetching transactions:', txError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // For each transaction, we need to find the other party using cross-user data.
    // Because transactions are protected by RLS, use the admin client to gather
    // the matching buy/sell records for the NFTs involved.

    const nftIds = Array.from(new Set((transactions || [])
      .map((tx) => tx.nft_id)
      .filter((id): id is string => Boolean(id))))

    const adminClient = createAdminClient()

    let relatedTransactions: any[] = []
    if (nftIds.length > 0) {
      const { data: relatedData, error: relatedError } = await adminClient
        .from('transactions')
        .select('*')
        .in('nft_id', nftIds)
        .in('type', ['buy', 'sell'])
        .eq('status', 'completed')

      if (relatedError) {
        console.error('Error fetching related transactions:', relatedError)
      } else {
        relatedTransactions = relatedData || []
      }
    }

    const transactionsWithCounterparty = (transactions || []).map((tx) => {
      const candidates = relatedTransactions.filter((candidate) =>
        candidate.nft_id === tx.nft_id &&
        candidate.type !== tx.type &&
        candidate.user_id !== tx.user_id
      )

      let counterpart: any = null
      let smallestDiff = Number.POSITIVE_INFINITY
      const txCreatedAt = new Date(tx.created_at).getTime()

      for (const candidate of candidates) {
        const diff = Math.abs(new Date(candidate.created_at).getTime() - txCreatedAt)
        if (diff < smallestDiff) {
          smallestDiff = diff
          counterpart = candidate
        }
      }

      if (counterpart) {
        console.log(`[NFT Tx] Matched ${tx.type} tx ${tx.id} with counterpart ${counterpart.id} (Δ ${smallestDiff}ms)`)
      } else {
        console.log(`[NFT Tx] No counterpart found for ${tx.type} tx ${tx.id}`)
      }

      return {
        ...tx,
        buyerId: tx.type === 'sell' ? counterpart?.user_id ?? null : null,
        sellerId: tx.type === 'buy' ? counterpart?.user_id ?? null : null
      }
    })

    const counterpartIds = Array.from(new Set(
      transactionsWithCounterparty.flatMap((tx) => [tx.buyerId, tx.sellerId])
        .filter((id): id is string => Boolean(id))
    ))

    let counterpartUsers = new Map<string, any>()
    if (counterpartIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('Users')
        .select('id, username, email, display_name')
        .in('id', counterpartIds)

      if (usersError) {
        console.error('Error fetching counterpart users:', usersError)
      } else if (usersData) {
        counterpartUsers = new Map(usersData.map((user) => [user.id, user]))
      }
    }

    const enrichedTransactions = transactionsWithCounterparty.map((tx) => {
      const { buyerId, sellerId, ...rest } = tx

      if (tx.type === 'sell' && buyerId) {
        return {
          ...rest,
          buyer: counterpartUsers.get(buyerId) || null
        }
      }

      if (tx.type === 'buy' && sellerId) {
        return {
          ...rest,
          seller: counterpartUsers.get(sellerId) || null
        }
      }

      return rest
    })

    // Separate into sold and bought
    const sold = enrichedTransactions.filter(tx => tx.type === 'sell')
    const bought = enrichedTransactions.filter(tx => tx.type === 'buy')

    return NextResponse.json({ sold, bought })
  } catch (error) {
    console.error('Get NFT transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

