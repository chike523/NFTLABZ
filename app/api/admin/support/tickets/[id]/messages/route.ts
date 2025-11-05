import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailNotificationService } from '@/lib/email/notification-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verify admin access
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: adminCheck } = await supabase
      .from('Admin')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
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

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Create admin message
    const { data: newMessage, error: messageError } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: id,
        user_id: user.id,
        message: hasMessage ? message.trim() : '[Attachment]',
        is_admin: true
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating admin message:', messageError)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', id)
    }

    // Send email notification to user
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const siteName = 'Artistrytonal'
    
    // Fetch ticket details including user email
    const { data: fullTicket } = await supabase
      .from('support_tickets')
      .select('ticket_id, subject, user_id')
      .eq('id', id)
      .single()
    
    if (fullTicket) {
      const { data: ticketOwner } = await supabase
        .from('Users')
        .select('email, username, display_name')
        .eq('id', fullTicket.user_id)
        .maybeSingle()
      
      if (ticketOwner?.email) {
        const messagePreview = hasMessage ? message.trim().substring(0, 150) : '[Admin sent an attachment]'
        
        EmailNotificationService.sendSupportReply(ticketOwner.email, {
          username: ticketOwner.display_name || ticketOwner.username || ticketOwner.email,
          ticketId: fullTicket.ticket_id,
          ticketSubject: fullTicket.subject,
          replyPreview: messagePreview,
          siteName,
          siteUrl,
          ticketUrl: `${siteUrl}/dashboard/support/${id}`
        }).catch(err => console.error('[Email] Support reply notification failed:', err))
      }
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
    console.error('Create admin message error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

