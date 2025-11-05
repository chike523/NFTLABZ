import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Fetch ticket to verify permissions
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, ticket_id, user_id')
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const isOwner = ticket.user_id === user.id

    if (!isOwner) {
      const { data: adminRecord } = await supabase
        .from('Admin')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (!adminRecord) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const messageIdRaw = formData.get('message_id')
    const messageId = typeof messageIdRaw === 'string' && messageIdRaw.trim().length > 0 ? messageIdRaw.trim() : null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // If message_id provided, ensure it belongs to ticket
    if (messageId) {
      const { data: messageRecord, error: messageError } = await supabase
        .from('support_ticket_messages')
        .select('id')
        .eq('id', messageId)
        .eq('ticket_id', id)
        .maybeSingle()

      if (messageError || !messageRecord) {
        return NextResponse.json({ error: 'Invalid message reference' }, { status: 400 })
      }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create directory structure: public/uploads/support/TICKET-ID/
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'support', ticket.ticket_id)
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = join(uploadDir, fileName)

    // Write file to disk
    await writeFile(filePath, buffer)

    // Generate public URL path
    const publicUrl = `/uploads/support/${ticket.ticket_id}/${fileName}`

    // Auto-attach to message if message_id provided
    if (messageId) {
      const { error: attachmentError } = await supabase
        .from('support_ticket_attachments')
        .insert({
          ticket_id: ticket.id,
          message_id: messageId,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id
        })

      if (attachmentError) {
        console.error('Attachment insert error:', attachmentError)
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        message_id: messageId
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

