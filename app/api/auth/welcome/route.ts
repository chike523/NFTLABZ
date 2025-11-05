import { NextRequest, NextResponse } from 'next/server'
import { EmailNotificationService } from '@/lib/email/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username } = body

    if (!email || !username) {
      return NextResponse.json({ error: 'Email and username are required' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const siteName = 'Artistrytonal'
    
    await EmailNotificationService.sendWelcome(email, {
      username,
      email,
      siteName,
      siteUrl
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Welcome email error:', error)
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 })
  }
}

