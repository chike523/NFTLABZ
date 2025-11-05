export interface SupportReplyData {
  username: string
  ticketId: string
  ticketSubject: string
  replyPreview: string
  siteName: string
  siteUrl: string
  ticketUrl: string
}

export function getSupportReplyTemplate(data: SupportReplyData) {
  return {
    subject: `💬 New Reply to Your Support Ticket #${data.ticketId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">💬 Support Team Replied</h1>
            </td>
          </tr>
          
          <!-- Message Icon -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px;">
              <div style="width: 80px; height: 80px; background-color: #dbeafe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi <strong>${data.username}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Our support team has replied to your ticket:
              </p>
              
              <!-- Ticket Info -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #1e40af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Ticket #{data.ticketId}</p>
                <p style="margin: 0; color: #111; font-size: 18px; font-weight: 700;">${data.ticketSubject}</p>
              </div>
              
              <!-- Reply Preview -->
              <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 6px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px; color: #666; font-size: 13px; font-weight: 600;">Latest Reply:</p>
                <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6; font-style: italic;">"${data.replyPreview}${data.replyPreview.length > 100 ? '...' : ''}"</p>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Click below to view the full conversation and continue chatting with our team:
              </p>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.ticketUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View & Reply
                </a>
              </div>
              
              <p style="margin: 20px 0 0; color: #666; font-size: 13px; text-align: center;">
                We're here to help! Respond directly in the ticket for faster assistance.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Hi ${data.username},

Our support team has replied to your ticket:

Ticket #${data.ticketId}: ${data.ticketSubject}

Latest Reply:
"${data.replyPreview}${data.replyPreview.length > 100 ? '...' : ''}"

Click below to view the full conversation and continue chatting with our team:

${data.ticketUrl}

We're here to help! Respond directly in the ticket for faster assistance.

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

