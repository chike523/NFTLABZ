export interface WithdrawalRejectedData {
  username: string
  amount: string
  amountUsd?: string
  toAddress: string
  reason?: string
  siteName: string
  siteUrl: string
}

export function getWithdrawalRejectedTemplate(data: WithdrawalRejectedData) {
  return {
    subject: `❌ Withdrawal Rejected - ${data.amount} ETH`,
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
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Withdrawal Declined</h1>
            </td>
          </tr>
          
          <!-- Warning Icon -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px;">
              <div style="width: 80px; height: 80px; background-color: #fee2e2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
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
                We're unable to process your withdrawal request at this time.
              </p>
              
              <!-- Amount Box -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #991b1b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Rejected Amount</p>
                <p style="margin: 0; color: #111; font-size: 28px; font-weight: 700;">${data.amount} ETH</p>
                ${data.amountUsd ? `<p style="margin: 8px 0 0; color: #666; font-size: 14px;">≈ $${data.amountUsd} USD</p>` : ''}
                <p style="margin: 12px 0 0; color: #666; font-size: 13px;">To: ${data.toAddress.slice(0, 10)}...${data.toAddress.slice(-8)}</p>
              </div>
              
              ${data.reason ? `
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">Reason:</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">${data.reason}</p>
              </div>
              ` : ''}
              
              <div style="background-color: #dbeafe; border: 1px solid #93c5fd; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                  <strong>✓ Your funds are safe:</strong> The requested amount has been returned to your wallet balance.
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>What to do next:</strong>
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>Review the rejection reason above</li>
                <li>Verify your withdrawal address is correct</li>
                <li>Contact support if you need assistance</li>
                <li>Try submitting a new withdrawal request</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/dashboard/support" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  Contact Support
                </a>
                <a href="${data.siteUrl}/dashboard/withdraw" style="display: inline-block; background-color: #6b7280; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Try Again
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Need help? <a href="${data.siteUrl}/dashboard/support" style="color: #667eea; text-decoration: none;">Open a support ticket</a>
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

We're unable to process your withdrawal request at this time.

Rejected Amount: ${data.amount} ETH${data.amountUsd ? ` (≈ $${data.amountUsd} USD)` : ''}
To Address: ${data.toAddress}

${data.reason ? `Reason: ${data.reason}` : ''}

✓ Your funds are safe: The requested amount has been returned to your wallet balance.

What to do next:
- Review the rejection reason above
- Verify your withdrawal address is correct
- Contact support if you need assistance
- Try submitting a new withdrawal request

Contact Support: ${data.siteUrl}/dashboard/support
Try Again: ${data.siteUrl}/dashboard/withdraw

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

