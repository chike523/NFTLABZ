import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Get ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get user details
    const { data: user } = await supabase
      .from('Users')
      .select('id, username, display_name, email')
      .eq('id', ticket.user_id)
      .single()

    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Get all attachments
    const { data: attachments, error: attachmentsError } = await supabase
      .from('support_ticket_attachments')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError)
    }

    // Group attachments by message_id
    const attachmentsByMessage = new Map()
    attachments?.forEach(att => {
      if (!attachmentsByMessage.has(att.message_id)) {
        attachmentsByMessage.set(att.message_id, [])
      }
      attachmentsByMessage.get(att.message_id).push(att)
    })

    // Attach attachments to their messages
    const messagesWithAttachments = messages?.map(msg => ({
      ...msg,
      attachments: attachmentsByMessage.get(msg.id) || []
    })) || []

    const userName = user?.display_name || user?.username || null
    const userEmail = user?.email || null

    return NextResponse.json({
      data: {
        ...ticket,
        user: user || null,
        user_name: userName,
        user_email: userEmail,
        messages: messagesWithAttachments
      },
      error: null
    })
  } catch (error) {
    console.error('Get admin ticket error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', data: null },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // First get authenticated user with regular client
    const { createClient: createAuthClient } = await import('@/lib/supabase/server')
    const authSupabase = await createAuthClient()
    
    // Verify admin access
    const { data: { user }, error: userError } = await authSupabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: adminCheck } = await authSupabase
      .from('Admin')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Now use admin client for the update
    const supabase = createAdminClient()

    const body = await request.json()
    const { status, priority, assigned_to } = body

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (status && ['open', 'in_progress', 'closed', 'resolved'].includes(status)) {
      updates.status = status
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      updates.priority = priority
    }

    if (assigned_to !== undefined) {
      updates.assigned_to = assigned_to || null
    }

    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedTicket, error: null })
  } catch (error) {
    console.error('Update admin ticket error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

