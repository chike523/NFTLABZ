import { NextRequest, NextResponse } from 'next/server'
import { getEmailConfig, sendMail } from '@/lib/email/mailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toEmail } = body

    if (!toEmail) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    const config = await getEmailConfig()

    const info = await sendMail({
      to: toEmail,
      subject: `Test Email from ${config.fromName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p><strong>Settings used:</strong></p>
          <ul>
            <li>SMTP Host: ${config.host}</li>
            <li>SMTP Port: ${config.port}</li>
            <li>From Email: ${config.fromEmail}</li>
            <li>From Name: ${config.fromName}</li>
          </ul>
          <p>If you received this email, your email configuration is working properly!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated test email from your ${config.fromName} admin panel.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Test email sent successfully'
    })
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send test email',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

