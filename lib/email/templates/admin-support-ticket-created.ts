export interface AdminSupportTicketCreatedData {
  ticketId: string
  subject: string
  userName: string
  userEmail: string
  messagePreview: string
  siteName: string
  siteUrl: string
}

export function getAdminSupportTicketCreatedTemplate(data: AdminSupportTicketCreatedData) {
  return {
    subject: `🆕 New Support Ticket #${data.ticketId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Support Ticket</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.25);">
          <tr>
            <td style="padding:40px 36px;background:linear-gradient(135deg,#6366f1 0%,#0ea5e9 100%);">
              <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;">New Support Ticket</h1>
              <p style="margin:10px 0 0;color:#e2e8f0;font-size:16px;">Ticket <strong>#${data.ticketId}</strong> requires your attention.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">
                A new support ticket was created by <strong>${data.userName}</strong> (${data.userEmail}).
              </p>
              <div style="margin:24px 0;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                <div style="background-color:#f1f5f9;padding:14px 18px;">
                  <p style="margin:0;font-size:12px;letter-spacing:0.08em;color:#475569;text-transform:uppercase;">Subject</p>
                  <p style="margin:6px 0 0;font-size:18px;color:#0f172a;font-weight:600;">${data.subject}</p>
                </div>
                <div style="padding:20px 18px;background-color:#ffffff;">
                  <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;">Message Preview</p>
                  <p style="margin:0;color:#1f2937;font-size:15px;line-height:1.6;">${data.messagePreview}</p>
                </div>
              </div>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;">You can review and respond to this ticket from the admin dashboard.</p>
              <div style="text-align:center;">
                <a href="${data.siteUrl}/admin/support/${encodeURIComponent(data.ticketId)}" style="display:inline-block;background-color:#0ea5e9;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:15px;">Open Ticket</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:13px;">© ${new Date().getFullYear()} ${data.siteName}. Manage tickets in the admin dashboard.</p>
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
New Support Ticket

Ticket: #${data.ticketId}
Subject: ${data.subject}
From: ${data.userName} (${data.userEmail})

Message Preview:
${data.messagePreview}

Review the ticket: ${data.siteUrl}/admin/support/${encodeURIComponent(data.ticketId)}

© ${new Date().getFullYear()} ${data.siteName}
    `,
  }
}


