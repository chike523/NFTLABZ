import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get ticket counts by status
    const [openTickets, inProgressTickets, closedTickets, resolvedTickets, highPriorityTickets, assignedTickets] = await Promise.all([
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('priority', 'high'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).not('assigned_to', 'is', null)
    ])

    // Get recent tickets (last 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const { count: recentTickets } = await supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString())

    return NextResponse.json({
      data: {
        open: openTickets.count || 0,
        in_progress: inProgressTickets.count || 0,
        closed: closedTickets.count || 0,
        resolved: resolvedTickets.count || 0,
        high_priority: highPriorityTickets.count || 0,
        assigned: assignedTickets.count || 0,
        recent_24h: recentTickets || 0,
        total: (openTickets.count || 0) + (inProgressTickets.count || 0) + (closedTickets.count || 0) + (resolvedTickets.count || 0)
      },
      error: null
    })
  } catch (error) {
    console.error('Get support stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', data: null },
      { status: 500 }
    )
  }
}

