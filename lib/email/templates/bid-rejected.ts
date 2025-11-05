export interface BidRejectedData {
  bidderUsername: string
  sellerUsername: string
  nftTitle: string
  nftId: string
  bidAmount: string
  bidAmountUsd?: string
  siteName: string
  siteUrl: string
}

export function getBidRejectedTemplate(data: BidRejectedData) {
  return {
    subject: `Bid Declined - "${data.nftTitle}"`,
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
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Bid Declined</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi <strong>${data.bidderUsername}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                The seller <strong>${data.sellerUsername}</strong> has declined your bid on:
              </p>
              
              <!-- NFT Title -->
              <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #111; font-size: 20px; font-weight: 700;">${data.nftTitle}</p>
              </div>
              
              <!-- Refund Notice -->
              <div style="background-color: #dbeafe; border: 1px solid #93c5fd; padding: 20px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 12px; color: #1e40af; font-size: 15px; font-weight: 600;">✓ Funds Returned</p>
                <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.5;">
                  Your bid of <strong>${data.bidAmount} ETH</strong> has been returned to your wallet balance.
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Don't give up! You can:
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>Place a higher bid on this NFT</li>
                <li>Explore other amazing artworks</li>
                <li>Set up alerts for similar NFTs</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/nft/${data.nftId}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  View NFT
                </a>
                <a href="${data.siteUrl}/" style="display: inline-block; background-color: #6b7280; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Browse Marketplace
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Keep exploring! The perfect NFT is waiting for you.
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
Hi ${data.bidderUsername},

The seller ${data.sellerUsername} has declined your bid on:

NFT: ${data.nftTitle}

✓ Funds Returned
Your bid of ${data.bidAmount} ETH has been returned to your wallet balance.

Don't give up! You can:
- Place a higher bid on this NFT
- Explore other amazing artworks
- Set up alerts for similar NFTs

View NFT: ${data.siteUrl}/nft/${data.nftId}
Browse Marketplace: ${data.siteUrl}/

Keep exploring! The perfect NFT is waiting for you.

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

