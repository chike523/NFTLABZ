import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTicketId } from '@/lib/utils/ticket-id'
import { EmailNotificationService } from '@/lib/email/notification-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, message, attachments } = body

    const sanitizedSubject = typeof subject === 'string' ? subject.trim() : ''
    const sanitizedMessage = typeof message === 'string' ? message.trim() : ''

    if (!sanitizedSubject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    // Generate unique ticket ID
    let ticketId = generateTicketId()
    let isUnique = false
    let attempts = 0
    
    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('ticket_id', ticketId)
        .single()
      
      if (!existing) {
        isUnique = true
      } else {
        ticketId = generateTicketId()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique ticket ID' }, { status: 500 })
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        subject: sanitizedSubject,
        status: 'open',
        priority: 'medium'
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Create first message
    // Note: Using .maybeSingle() instead of .single() to handle cases where RLS might prevent seeing the inserted row
    let firstMessage: any = null
    const { data: insertedMessage, error: messageError } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        message: sanitizedMessage || '[Attachment]',
        is_admin: false
      })
      .select()
      .maybeSingle()

    // If error, check if it's just a visibility issue (message might still be created)
    if (messageError) {
      console.error('Error creating first message:', messageError)
      
      // Check if message was actually created (sometimes RLS prevents SELECT but INSERT succeeds)
      const { data: checkMessage } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checkMessage) {
        // Message was created, just use it
        firstMessage = checkMessage
      } else {
        // Message creation actually failed - return ticket anyway
        console.warn('Message creation failed, but ticket was created:', ticket.id)
        return NextResponse.json({ 
          success: true, 
          ticket: {
            ...ticket,
            messages: [],
            attachments: []
          },
          warning: 'Ticket created but initial message failed. Please add a message manually.'
        })
      }
    } else {
      firstMessage = insertedMessage
    }

    let responseAttachments: any[] = []

    // Create attachments if any (only if message was created)
    if (firstMessage && attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentInserts = attachments.map((att: { file_url: string; file_name: string; file_type: string; file_size: number }) => ({
        ticket_id: ticket.id,
        message_id: firstMessage.id,
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

      const { data: messageAttachments } = await supabase
        .from('support_ticket_attachments')
        .select('*')
        .eq('message_id', firstMessage.id)

      responseAttachments = messageAttachments || []
    }

    const messagePreview =
      sanitizedMessage ||
      (responseAttachments.length > 0 ? 'User attached files to this ticket.' : 'No message provided.')

    try {
      const adminEmails = await EmailNotificationService.getAdminEmails()
      if (adminEmails.length > 0) {
        await EmailNotificationService.sendAdminSupportTicketCreated(adminEmails, {
          ticketId: ticket.ticket_id,
          subject: sanitizedSubject,
          userName:
            user.user_metadata?.display_name ||
            user.user_metadata?.username ||
            user.email?.split('@')[0] ||
            'User',
          userEmail: user.email || 'N/A',
          messagePreview: messagePreview.length > 240 ? `${messagePreview.slice(0, 237)}...` : messagePreview,
          siteName: 'Artistrytonal',
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        })
      }
    } catch (emailError) {
      console.error('[Email] Admin support ticket created notification failed:', emailError)
    }

    return NextResponse.json({ 
      success: true, 
      ticket: {
        ...ticket,
        messages: firstMessage ? [firstMessage] : [],
        attachments: responseAttachments
      }
    })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = Number(searchParams.get('limit') || '50')
    const offset = Number(searchParams.get('offset') || '0')

    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Get last message for each ticket
    if (tickets && tickets.length > 0) {
      const ticketIds = tickets.map(t => t.id)
      
      const { data: lastMessages } = await supabase
        .from('support_ticket_messages')
        .select('ticket_id, message, created_at')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: false })

      // Group messages by ticket and get the latest
      const messagesByTicket = new Map()
      lastMessages?.forEach(msg => {
        if (!messagesByTicket.has(msg.ticket_id)) {
          messagesByTicket.set(msg.ticket_id, msg)
        }
      })

      // Add last message preview to each ticket
      tickets.forEach((ticket: any) => {
        ticket.last_message = messagesByTicket.get(ticket.id)?.message?.substring(0, 100) || ''
        ticket.last_message_at_preview = messagesByTicket.get(ticket.id)?.created_at || ticket.last_message_at
      })
    }

    return NextResponse.json({ 
      data: tickets || [], 
      count: count || 0,
      error: null 
    })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', data: null, count: 0 },
      { status: 500 }
    )
  }
}

