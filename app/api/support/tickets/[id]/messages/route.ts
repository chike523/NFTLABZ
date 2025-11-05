import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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
    const { message, attachments, has_attachments } = body

    const attachmentListRaw = Array.isArray(attachments) ? attachments : []
    const attachmentList = attachmentListRaw.filter((att: any) => att && att.file_url)
    const hasMessage = typeof message === 'string' && message.trim().length > 0
    const hasPendingAttachments = Boolean(has_attachments) || attachmentListRaw.length > 0

    if (!hasMessage && attachmentList.length === 0 && !hasPendingAttachments) {
      return NextResponse.json({ error: 'Message or attachments are required' }, { status: 400 })
    }

    // Verify ticket ownership
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status, user_id')
      .eq('id', id)
      .maybeSingle()

    if (ticketError) {
      console.error('Error checking ticket:', ticketError)
      return NextResponse.json({ error: 'Failed to verify ticket' }, { status: 500 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify ownership
    if (ticket.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Prevent adding messages to closed tickets
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return NextResponse.json({ error: 'Cannot add messages to closed or resolved tickets' }, { status: 400 })
    }

    // Create message
    // Use maybeSingle() to handle RLS visibility issues
    let newMessage: any = null
    const { data: insertedMessage, error: messageError } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: id,
        user_id: user.id,
        message: hasMessage ? message.trim() : '[Attachment]',
        is_admin: false
      })
      .select()
      .maybeSingle()

    if (messageError) {
      console.error('Error creating message:', messageError)
      
      // Check if message was actually created (RLS might prevent SELECT but INSERT succeeds)
      const { data: checkMessage } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checkMessage) {
        // Message was created, use it
        newMessage = checkMessage
      } else {
        // Message creation actually failed - log full error details
        console.error('Message creation failed completely:', {
          error: messageError,
          code: messageError.code,
          message: messageError.message,
          details: messageError.details,
          hint: messageError.hint,
          ticket_id: id,
          user_id: user.id
        })
        return NextResponse.json({ 
          error: 'Failed to create message',
          details: messageError.message || 'Unknown error',
          code: messageError.code
        }, { status: 500 })
      }
    } else {
      newMessage = insertedMessage
    }

    if (!newMessage) {
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Create attachments if any
    if (attachmentList.length > 0) {
      const attachmentInserts = attachmentList.map((att: { file_url: string; file_name: string; file_type: string; file_size: number }) => ({
        ticket_id: id,
        message_id: newMessage.id,
        file_url: att.file_url,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size,
        uploaded_by: user.id
      }))

      const { error: attachError } = await supabase
        .from('support_ticket_attachments')
        .insert(attachmentInserts)

      if (attachError) {
        console.error('Error creating attachments:', attachError)
        // Continue anyway - attachments are optional
      }

      // Fetch attachments for response
      const { data: messageAttachments } = await supabase
        .from('support_ticket_attachments')
        .select('*')
        .eq('message_id', newMessage.id)

      return NextResponse.json({
        success: true,
        message: {
          ...newMessage,
          attachments: messageAttachments || []
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: {
        ...newMessage,
        attachments: []
      }
    })
  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

