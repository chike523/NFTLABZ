import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service role not configured')
  }
  return createClient(url, key)
}

// GET /api/admin/nfts?limit=&offset=&search=&status=&category=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || '50')
    const offset = Number(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || undefined
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined

    const supabase = getServiceClient()

    let query = supabase
      .from('nfts')
      .select(
        `*, category:categories(name, slug)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // NOTE: category here expects category_id (UUID). If caller sends slug, they should resolve to id first.
    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query
    if (error) throw error

    // Attach minimal owner/creator data
    if (data && data.length > 0) {
      const userIds = Array.from(
        new Set(
          data
            .flatMap((n: any) => [n.owner_id, n.creator_id])
            .filter(Boolean)
        )
      )
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('Users')
          .select('id, username, display_name')
          .in('id', userIds)
        if (users) {
          data.forEach((n: any) => {
            n.owner = users.find((u: any) => u.id === n.owner_id) || null
            n.creator = users.find((u: any) => u.id === n.creator_id) || null
          })
        }
      }
    }

    return NextResponse.json({ data, count: count || 0, error: null })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, count: 0, error: err?.message || 'Failed to fetch NFTs' },
      { status: 500 }
    )
  }
}


