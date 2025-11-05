export interface AdminNewWithdrawalData {
  username: string
  userEmail: string
  amount: string
  amountUsd?: string
  toAddress: string
  transactionId: string
  siteName: string
  siteUrl: string
}

export function getAdminNewWithdrawalTemplate(data: AdminNewWithdrawalData) {
  return {
    subject: `⚠️ New Withdrawal Request - ${data.amount} ETH from ${data.username}`,
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
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">⚠️ Withdrawal Pending Review</h1>
            </td>
          </tr>
          
          <!-- Alert Icon -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px;">
              <div style="width: 70px; height: 70px; background-color: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <polyline points="19 16 12 23 5 16"></polyline>
                </svg>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 15px; line-height: 1.6;">
                A user has requested a withdrawal that requires immediate review.
              </p>
              
              <!-- User Info -->
              <div style="background-color: #f9fafb; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #666; font-size: 12px; font-weight: 600;">USER DETAILS</p>
                <p style="margin: 0 0 6px; color: #111; font-size: 15px;"><strong>${data.username}</strong></p>
                <p style="margin: 0; color: #666; font-size: 13px;">${data.userEmail}</p>
              </div>
              
              <!-- Amount Box -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Withdrawal Amount</p>
                <p style="margin: 0; color: #111; font-size: 28px; font-weight: 700;">${data.amount} ETH</p>
                ${data.amountUsd ? `<p style="margin: 8px 0 0; color: #666; font-size: 14px;">≈ $${data.amountUsd} USD</p>` : ''}
              </div>
              
              <!-- Destination Address -->
              <div style="background-color: #f9fafb; padding: 14px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 6px; color: #666; font-size: 12px; font-weight: 600;">DESTINATION WALLET</p>
                <code style="background-color: #ffffff; padding: 8px; border-radius: 4px; display: block; font-size: 11px; word-break: break-all; color: #111; border: 1px solid #e5e7eb;">${data.toAddress}</code>
              </div>
              
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 14px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; color: #991b1b; font-size: 13px; font-weight: 600;">
                  ⏰ Action Required: User is waiting for approval
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/admin/transactions/${data.transactionId}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Review Withdrawal
                </a>
              </div>
              
              <p style="margin: 20px 0 0; color: #666; font-size: 13px; text-align: center;">
                Please verify the user's balance and transaction details before approving.
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
⚠️ NEW WITHDRAWAL REQUEST

A user has requested a withdrawal that requires immediate review.

USER DETAILS:
${data.username}
${data.userEmail}

Withdrawal Amount: ${data.amount} ETH${data.amountUsd ? ` (≈ $${data.amountUsd} USD)` : ''}
Destination Wallet: ${data.toAddress}

⏰ Action Required: User is waiting for approval

Review Withdrawal: ${data.siteUrl}/admin/transactions/${data.transactionId}

Please verify the user's balance and transaction details before approving.

${data.siteName} Admin Notification System
    `
  }
}

