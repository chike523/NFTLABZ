import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const assignedTo = searchParams.get('assigned_to') || undefined
    const userId = searchParams.get('user_id') || undefined
    const search = searchParams.get('search') || undefined
    const limit = Number(searchParams.get('limit') || '50')
    const offset = Number(searchParams.get('offset') || '0')

    let query = supabase
      .from('support_tickets')
      .select('*, user_id', { count: 'exact' })
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }

    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query = query.is('assigned_to', null)
      } else {
        query = query.eq('assigned_to', assignedTo)
      }
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (search) {
      query = query.or(`ticket_id.ilike.%${search}%,subject.ilike.%${search}%`)
    }

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Get user details for each ticket
    if (tickets && tickets.length > 0) {
      const userIds = Array.from(new Set(tickets.map((t: any) => t.user_id).filter(Boolean)))
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('Users')
          .select('id, username, display_name, email')
          .in('id', userIds)

        const usersMap = new Map(users?.map((u: any) => [u.id, u]) || [])

        tickets.forEach((ticket: any) => {
          ticket.user = usersMap.get(ticket.user_id) || null
        })
      }
    }

    return NextResponse.json({
      data: tickets || [],
      count: count || 0,
      error: null
    })
  } catch (error) {
    console.error('Get admin tickets error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', data: null, count: 0 },
      { status: 500 }
    )
  }
}

