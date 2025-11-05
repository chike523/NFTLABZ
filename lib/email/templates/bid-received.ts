export interface BidReceivedData {
  sellerUsername: string
  bidderUsername: string
  nftTitle: string
  nftId: string
  nftImage?: string
  bidAmount: string
  bidAmountUsd?: string
  siteName: string
  siteUrl: string
}

export function getBidReceivedTemplate(data: BidReceivedData) {
  return {
    subject: `🎯 New Bid on "${data.nftTitle}" - ${data.bidAmount} ETH`,
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
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎯 You Received a Bid!</h1>
            </td>
          </tr>
          
          ${data.nftImage ? `
          <!-- NFT Image -->
          <tr>
            <td align="center" style="padding: 30px 30px 10px;">
              <img src="${data.nftImage}" alt="${data.nftTitle}" style="max-width: 350px; width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);" />
            </td>
          </tr>
          ` : ''}
          
          <!-- Content -->
          <tr>
            <td style="padding: ${data.nftImage ? '20px' : '30px'} 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi <strong>${data.sellerUsername}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Great news! <strong>${data.bidderUsername}</strong> placed a bid on your NFT:
              </p>
              
              <!-- NFT Title -->
              <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px; color: #111; font-size: 22px; font-weight: 700;">${data.nftTitle}</p>
              </div>
              
              <!-- Bid Amount -->
              <div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 24px; margin: 20px 0; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Bid Amount</p>
                <p style="margin: 0; color: #111; font-size: 36px; font-weight: 700;">${data.bidAmount} ETH</p>
                ${data.bidAmountUsd ? `<p style="margin: 8px 0 0; color: #059669; font-size: 18px; font-weight: 500;">≈ $${data.bidAmountUsd} USD</p>` : ''}
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>What you can do:</strong>
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>Accept the bid to sell your NFT instantly</li>
                <li>Reject it if you want to wait for a higher offer</li>
                <li>View all bids in your NFT Profile</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/dashboard/profile?tab=offers" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Review Bid
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Keep up the great work! More collectors are discovering your art.
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
Hi ${data.sellerUsername},

Great news! ${data.bidderUsername} placed a bid on your NFT:

NFT: ${data.nftTitle}
Bid Amount: ${data.bidAmount} ETH${data.bidAmountUsd ? ` (≈ $${data.bidAmountUsd} USD)` : ''}

What you can do:
- Accept the bid to sell your NFT instantly
- Reject it if you want to wait for a higher offer
- View all bids in your NFT Profile

Review Bid: ${data.siteUrl}/dashboard/profile?tab=offers

Keep up the great work! More collectors are discovering your art.

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

