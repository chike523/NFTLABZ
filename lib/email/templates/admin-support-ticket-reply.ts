export interface AdminSupportTicketReplyData {
  ticketId: string
  subject: string
  userName: string
  userEmail: string
  messagePreview: string
  siteName: string
  siteUrl: string
}

export function getAdminSupportTicketReplyTemplate(data: AdminSupportTicketReplyData) {
  return {
    subject: `💬 New Reply on Ticket #${data.ticketId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Ticket Reply</title>
</head>
<body style="margin:0;padding:0;background-color:#111827;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111827;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 35px rgba(15,23,42,0.2);">
          <tr>
            <td style="padding:36px;background:linear-gradient(135deg,#f97316 0%,#fb7185 100%);">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">New Reply From User</h1>
              <p style="margin:12px 0 0;color:#ffe4e6;font-size:16px;">Ticket <strong>#${data.ticketId}</strong> has a new message.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#1f2937;font-size:16px;">
                <strong>${data.userName}</strong> (${data.userEmail}) replied to the ticket:
              </p>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Subject</p>
              <p style="margin:0 0 18px;color:#111827;font-size:18px;font-weight:600;">${data.subject}</p>
              <div style="background-color:#f9fafb;border-radius:12px;padding:20px;border:1px solid #e5e7eb;">
                <p style="margin:0 0 10px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Message Preview</p>
                <p style="margin:0;color:#1f2937;font-size:15px;line-height:1.7;">${data.messagePreview}</p>
              </div>
              <p style="margin:24px 0 0;color:#475569;font-size:15px;">Please respond to keep the user informed.</p>
              <div style="text-align:center;margin-top:28px;">
                <a href="${data.siteUrl}/admin/support/${encodeURIComponent(data.ticketId)}" style="display:inline-block;background-color:#f97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;">View Ticket</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:22px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:13px;">© ${new Date().getFullYear()} ${data.siteName}. Stay on top of support conversations.</p>
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
New user reply on ticket #${data.ticketId}

Subject: ${data.subject}
From: ${data.userName} (${data.userEmail})

Message Preview:
${data.messagePreview}

Review and respond: ${data.siteUrl}/admin/support/${encodeURIComponent(data.ticketId)}

© ${new Date().getFullYear()} ${data.siteName}
    `,
  }
}


