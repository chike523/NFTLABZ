import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Mark a page as read (upsert last_viewed_at timestamp)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { page_name } = body

    if (!page_name || typeof page_name !== 'string') {
      return NextResponse.json({ error: 'Invalid page_name' }, { status: 400 })
    }

    // Validate page_name
    const validPages = ['profile', 'bids', 'transactions', 'nft-transactions', 'support']
    if (!validPages.includes(page_name)) {
      return NextResponse.json({ error: 'Invalid page_name' }, { status: 400 })
    }

    // Upsert the last_viewed_at timestamp
    const { error: upsertError } = await supabase
      .from('user_page_views')
      .upsert({
        user_id: user.id,
        page_name,
        last_viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,page_name'
      })

    if (upsertError) {
      console.error('Mark page read error:', upsertError)
      return NextResponse.json({ error: 'Failed to mark page as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark page read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

