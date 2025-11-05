import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get all messages for this ticket
    const { data: messages, error: messagesError } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Get all attachments for this ticket
    const { data: attachments, error: attachmentsError } = await supabase
      .from('support_ticket_attachments')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError)
      // Continue without attachments
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

    return NextResponse.json({
      data: {
        ...ticket,
        messages: messagesWithAttachments
      },
      error: null
    })
  } catch (error) {
    console.error('Get ticket error:', error)
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
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // User can only close their own open tickets
    if (status !== 'closed') {
      return NextResponse.json({ error: 'Users can only close tickets' }, { status: 400 })
    }

    // Check ticket ownership and current status
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.status !== 'open') {
      return NextResponse.json({ error: 'Can only close open tickets' }, { status: 400 })
    }

    // Update ticket status
    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update({ status: 'closed' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedTicket, error: null })
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

