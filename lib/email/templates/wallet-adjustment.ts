export interface WalletAdjustmentData {
  username: string
  amount: string
  action: 'credit' | 'debit'
  transactionType: string
  note?: string
  balanceAfter?: string
  siteName: string
  siteUrl: string
}

export function getWalletAdjustmentTemplate(data: WalletAdjustmentData) {
  const actionLabel = data.action === 'credit' ? 'Wallet Credited' : 'Wallet Debited'
  const subjectPrefix = data.action === 'credit' ? 'Funds Added' : 'Funds Removed'
  const amountLine =
    data.action === 'credit'
      ? `We added ${data.amount} ETH to your wallet.`
      : `We removed ${data.amount} ETH from your wallet.`

  const balanceLine = data.balanceAfter
    ? `<p style="margin: 0 0 16px; color: #4b5563;">Your updated balance is <strong>${data.balanceAfter} ETH</strong>.</p>`
    : ''

  const noteSection = data.note
    ? `
      <div style="margin: 24px 0; border-left: 4px solid #0ea5e9; background-color: #f0f9ff; padding: 16px 20px; border-radius: 6px;">
        <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #0369a1;">
          Admin Note
        </p>
        <p style="margin: 8px 0 0; color: #0f172a; line-height: 1.6;">
          ${data.note}
        </p>
      </div>
    `
    : ''

  return {
    subject: `🔔 ${subjectPrefix} - ${data.amount} ETH`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${actionLabel}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:16px; box-shadow:0 15px 50px rgba(15,23,42,0.1); overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding:40px 32px;">
              <h1 style="margin:0; font-size:28px; color:#ffffff; font-weight:700;">${actionLabel}</h1>
              <p style="margin:12px 0 0; color:#e2e8f0; font-size:16px;">Transaction Type: <strong>${data.transactionType}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px; color:#475569; font-size:16px;">
                Hi <strong>${data.username}</strong>,
              </p>
              <p style="margin:0 0 16px; color:#1e293b; font-size:16px; line-height:1.6;">
                ${amountLine}
              </p>

              <div style="margin:24px 0; border-radius:12px; padding:24px; background:linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); border:1px solid #e2e8f0;">
                <p style="margin:0 0 8px; color:#64748b; font-size:12px; letter-spacing:0.08em; text-transform:uppercase;">Amount</p>
                <p style="margin:0; font-size:28px; font-weight:700; color:#0f172a;">${data.amount} ETH</p>
                <p style="margin:16px 0 0; color:#475569; font-size:14px;">
                  ${data.action === 'credit' ? 'This credit was applied by an administrator.' : 'This debit was applied by an administrator.'}
                </p>
              </div>

              ${balanceLine}
              ${noteSection}

              <p style="margin:24px 0 0; color:#475569; font-size:15px; line-height:1.6;">
                You can review the details of this adjustment and your full transaction history from your dashboard.
              </p>
              <div style="text-align:center; margin:32px 0 0;">
                <a href="${data.siteUrl}/dashboard/transactions" style="display:inline-block; background-color:#0ea5e9; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:999px; font-weight:600; font-size:15px;">
                  View Transactions
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc; padding:24px 40px; text-align:center;">
              <p style="margin:0; color:#94a3b8; font-size:13px;">
                Need help? Contact us at <a href="mailto:support@${data.siteName.toLowerCase().replace(/\\s+/g, '')}.com" style="color:#0ea5e9; text-decoration:none;">support@${data.siteName.toLowerCase().replace(/\\s+/g, '')}.com</a>
              </p>
              <p style="margin:12px 0 0; color:#cbd5f5; font-size:12px;">© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.</p>
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

${amountLine}
Transaction Type: ${data.transactionType}
${note ? `\nAdmin note:\n${data.note}\n` : ''}
${data.balanceAfter ? `Updated balance: ${data.balanceAfter} ETH\n` : ''}

You can review your transaction history here:
${data.siteUrl}/dashboard/transactions

If you have any questions, contact us at support@${data.siteName.toLowerCase().replace(/\s+/g, '')}.com

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `,
  }
}


