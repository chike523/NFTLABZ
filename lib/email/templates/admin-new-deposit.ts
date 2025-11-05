export interface AdminNewDepositData {
  username: string
  userEmail: string
  amount: string
  amountUsd?: string
  transactionHash?: string
  transactionId: string
  siteName: string
  siteUrl: string
}

export function getAdminNewDepositTemplate(data: AdminNewDepositData) {
  return {
    subject: `🔔 New Deposit Request - ${data.amount} ETH from ${data.username}`,
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
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">⚡ New Deposit Pending</h1>
            </td>
          </tr>
          
          <!-- Alert Icon -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px;">
              <div style="width: 70px; height: 70px; background-color: #dbeafe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="13"></line>
                  <polyline points="5 8 12 1 19 8"></polyline>
                </svg>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 15px; line-height: 1.6;">
                A new deposit request requires your review.
              </p>
              
              <!-- User Info -->
              <div style="background-color: #f9fafb; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #666; font-size: 12px; font-weight: 600;">USER DETAILS</p>
                <p style="margin: 0 0 6px; color: #111; font-size: 15px;"><strong>${data.username}</strong></p>
                <p style="margin: 0; color: #666; font-size: 13px;">${data.userEmail}</p>
              </div>
              
              <!-- Amount Box -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #1e40af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Deposit Amount</p>
                <p style="margin: 0; color: #111; font-size: 28px; font-weight: 700;">${data.amount} ETH</p>
                ${data.amountUsd ? `<p style="margin: 8px 0 0; color: #666; font-size: 14px;">≈ $${data.amountUsd} USD</p>` : ''}
              </div>
              
              ${data.transactionHash ? `
              <div style="background-color: #f9fafb; padding: 14px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 6px; color: #666; font-size: 12px; font-weight: 600;">TRANSACTION HASH</p>
                <code style="background-color: #ffffff; padding: 8px; border-radius: 4px; display: block; font-size: 11px; word-break: break-all; color: #111; border: 1px solid #e5e7eb;">${data.transactionHash}</code>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/admin/transactions/${data.transactionId}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Review & Approve
                </a>
              </div>
              
              <p style="margin: 20px 0 0; color: #666; font-size: 13px; text-align: center;">
                Please review this deposit promptly to ensure a good user experience.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                ${data.siteName} Admin Notification System
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
⚡ NEW DEPOSIT PENDING

A new deposit request requires your review.

USER DETAILS:
${data.username}
${data.userEmail}

Deposit Amount: ${data.amount} ETH${data.amountUsd ? ` (≈ $${data.amountUsd} USD)` : ''}
${data.transactionHash ? `Transaction Hash: ${data.transactionHash}` : ''}

Review & Approve: ${data.siteUrl}/admin/transactions/${data.transactionId}

Please review this deposit promptly to ensure a good user experience.

${data.siteName} Admin Notification System
    `
  }
}

