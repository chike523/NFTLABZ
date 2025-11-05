import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function parseFilters(url: string) {
  const { searchParams } = new URL(url)
  return {
    limit: Number(searchParams.get('limit') || '50'),
    offset: Number(searchParams.get('offset') || '0'),
    status: searchParams.get('status') || undefined,
    type: searchParams.get('type') || undefined,
    search: searchParams.get('search') || undefined
  }
}

export async function GET(request: Request) {
  try {
    const { limit, offset, status, type, search } = parseFilters(request.url)
    const supabase = createAdminClient()

    const baseSelect = `
      id,
      type,
      status,
      amount_eth,
      amount_usd,
      token_symbol,
      from_address,
      to_address,
      created_at,
      updated_at,
      user_id,
      nft_id,
      admin_note
    `

    let query = supabase
      .from('transactions')
      .select(baseSelect, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (search) {
      const like = `%${search}%`
      query = query.or(
        `id.ilike.${like},from_address.ilike.${like},to_address.ilike.${like}`
      )
    }

    let { data, error, count } = await query

    if (error && error.message?.includes('token_symbol')) {
      // Column not available; retry without it for backward compatibility
      query = supabase
        .from('transactions')
        .select(
          `
            id,
            type,
            status,
            amount_eth,
            amount_usd,
            from_address,
            to_address,
            created_at,
            updated_at,
            user_id,
            nft_id,
            admin_note
          `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (type && type !== 'all') {
        query = query.eq('type', type)
      }

      if (search) {
        const like = `%${search}%`
        query = query.or(
          `id.ilike.${like},from_address.ilike.${like},to_address.ilike.${like}`
        )
      }

      const retry = await query
      data = retry.data
      error = retry.error
      count = retry.count
    }

    if (error) {
      throw error
    }

    const transactions = data || []

    const userIds = Array.from(new Set(transactions.map((tx) => tx.user_id).filter(Boolean)))
    let users: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: userRows } = await supabase
        .from('Users')
        .select('id, username, display_name, email')
        .in('id', userIds)
      if (userRows) {
        users = userRows.reduce((acc, row) => {
          acc[row.id] = row
          return acc
        }, {} as Record<string, any>)
      }
    }

    const nftIds = Array.from(new Set(transactions.map((tx) => tx.nft_id).filter(Boolean)))
    let nfts: Record<string, any> = {}
    if (nftIds.length > 0) {
      const { data: nftRows } = await supabase
        .from('nfts')
        .select('id, title')
        .in('id', nftIds)
      if (nftRows) {
        nfts = nftRows.reduce((acc, row) => {
          acc[row.id] = row
          return acc
        }, {} as Record<string, any>)
      }
    }

    const enriched = transactions.map((tx) => ({
      ...tx,
      user: tx.user_id ? users[tx.user_id] || null : null,
      nft: tx.nft_id ? nfts[tx.nft_id] || null : null
    }))

    return NextResponse.json({ data: enriched, count: count || 0 })
  } catch (error: any) {
    console.error('Admin transactions fetch failed:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch transactions', data: [], count: 0 },
      { status: 500 }
    )
  }
}

