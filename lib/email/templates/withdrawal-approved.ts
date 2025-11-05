export interface WithdrawalApprovedData {
  username: string
  amount: string
  amountUsd?: string
  toAddress: string
  transactionHash?: string
  siteName: string
  siteUrl: string
}

export function getWithdrawalApprovedTemplate(data: WithdrawalApprovedData) {
  return {
    subject: `✅ Withdrawal Approved - ${data.amount} ETH`,
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
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Withdrawal Approved!</h1>
            </td>
          </tr>
          
          <!-- Success Icon -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px;">
              <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
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
                Your withdrawal request has been approved and is being processed.
              </p>
              
              <!-- Amount Box -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #065f46; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Withdrawal Amount</p>
                <p style="margin: 0; color: #111; font-size: 28px; font-weight: 700;">${data.amount} ETH</p>
                ${data.amountUsd ? `<p style="margin: 8px 0 0; color: #666; font-size: 14px;">≈ $${data.amountUsd} USD</p>` : ''}
              </div>
              
              <div style="background-color: #f9fafb; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #666; font-size: 13px; font-weight: 600;">Destination Address</p>
                <code style="background-color: #ffffff; padding: 8px 12px; border-radius: 4px; display: block; font-size: 12px; word-break: break-all; color: #111; border: 1px solid #e5e7eb;">${data.toAddress}</code>
              </div>
              
              ${data.transactionHash ? `
              <div style="background-color: #f9fafb; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #666; font-size: 13px; font-weight: 600;">Transaction Hash</p>
                <code style="background-color: #ffffff; padding: 8px 12px; border-radius: 4px; display: block; font-size: 12px; word-break: break-all; color: #111; border: 1px solid #e5e7eb;">${data.transactionHash}</code>
              </div>
              ` : ''}
              
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>⏱️ Processing Time:</strong> Your funds should arrive in your wallet within 15-30 minutes depending on network congestion.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/dashboard/transactions" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Transaction
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@${data.siteName.toLowerCase().replace(/\s+/g, '')}.com" style="color: #10b981; text-decoration: none;">support@${data.siteName.toLowerCase().replace(/\s+/g, '')}.com</a>
              </p>
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

Your withdrawal request has been approved and is being processed.

Withdrawal Amount: ${data.amount} ETH${data.amountUsd ? ` (≈ $${data.amountUsd} USD)` : ''}
Destination Address: ${data.toAddress}
${data.transactionHash ? `Transaction Hash: ${data.transactionHash}` : ''}

Processing Time: Your funds should arrive in your wallet within 15-30 minutes depending on network congestion.

View Transaction: ${data.siteUrl}/dashboard/transactions

Questions? Contact us at support@${data.siteName.toLowerCase().replace(/\s+/g, '')}.com

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

