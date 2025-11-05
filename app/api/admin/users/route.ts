import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = createAdminClient()
    } catch (adminError) {
      console.warn('Admin client failed, falling back to regular client:', adminError)
      supabase = await createClient()
    }
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // Build query
    let query = supabase
      .from('Users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error: usersError, count } = await query
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Fetch wallets and NFT counts for each user
    const usersWithData = await Promise.all(
      (users || []).map(async (user) => {
        const [walletsResult, nftCountResult] = await Promise.all([
          supabase
            .from('wallets')
            .select('wallet_address')
            .eq('user_id', user.id),
          supabase
            .from('nfts')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id)
        ])
        
        // Handle case where nfts table doesn't exist
        const nftCount = nftCountResult.error && 
          (nftCountResult.error.message.includes('relation "nfts" does not exist') ||
           nftCountResult.error.message.includes('relation "public.nfts" does not exist'))
          ? 0 
          : (nftCountResult.count || 0)
        
        return {
          ...user,
          wallets: walletsResult.data || [],
          nftCount: nftCount
        }
      })
    )

    return NextResponse.json({ 
      data: usersWithData, 
      count: count || 0 
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}
