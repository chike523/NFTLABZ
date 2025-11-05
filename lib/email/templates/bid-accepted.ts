export interface BidAcceptedData {
  bidderUsername: string
  sellerUsername: string
  nftTitle: string
  nftId: string
  nftImage?: string
  bidAmount: string
  bidAmountUsd?: string
  platformFee: string
  siteName: string
  siteUrl: string
}

export function getBidAcceptedTemplate(data: BidAcceptedData) {
  return {
    subject: `🎉 Your Bid Was Accepted! - "${data.nftTitle}"`,
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Congratulations!</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Your bid was accepted</p>
            </td>
          </tr>
          
          ${data.nftImage ? `
          <!-- NFT Image -->
          <tr>
            <td align="center" style="padding: 30px 30px 10px;">
              <img src="${data.nftImage}" alt="${data.nftTitle}" style="max-width: 400px; width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);" />
            </td>
          </tr>
          ` : ''}
          
          <!-- Content -->
          <tr>
            <td style="padding: ${data.nftImage ? '20px' : '30px'} 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi <strong>${data.bidderUsername}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Excellent news! <strong>${data.sellerUsername}</strong> has accepted your bid. The NFT is now yours!
              </p>
              
              <!-- NFT Title -->
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #065f46; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">You Now Own</p>
                <p style="margin: 0; color: #111; font-size: 24px; font-weight: 700;">${data.nftTitle}</p>
              </div>
              
              <!-- Transaction Details -->
              <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 12px; color: #666; font-size: 14px; font-weight: 600;">Transaction Summary</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Purchase Price:</td>
                    <td style="padding: 8px 0; color: #111; font-size: 14px; text-align: right; font-weight: 600;">${data.bidAmount} ETH</td>
                  </tr>
                  ${data.bidAmountUsd ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 13px;">USD Value:</td>
                    <td style="padding: 8px 0; color: #666; font-size: 13px; text-align: right;">≈ $${data.bidAmountUsd}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Seller:</td>
                    <td style="padding: 8px 0; color: #111; font-size: 14px; text-align: right;">${data.sellerUsername}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                The NFT has been transferred to your account. You can now:
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>View it in your NFT Profile</li>
                <li>Display it in your collection</li>
                <li>List it for resale anytime</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/nft/${data.nftId}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  View Your NFT
                </a>
                <a href="${data.siteUrl}/dashboard/profile" style="display: inline-block; background-color: #6b7280; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  My Collection
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Enjoy your new NFT! 🎨
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

Excellent news! ${data.sellerUsername} has accepted your bid. The NFT is now yours!

You Now Own: ${data.nftTitle}

Transaction Summary:
- Purchase Price: ${data.bidAmount} ETH${data.bidAmountUsd ? ` (≈ $${data.bidAmountUsd} USD)` : ''}
- Seller: ${data.sellerUsername}

The NFT has been transferred to your account. You can now:
- View it in your NFT Profile
- Display it in your collection
- List it for resale anytime

View Your NFT: ${data.siteUrl}/nft/${data.nftId}
My Collection: ${data.siteUrl}/dashboard/profile

Enjoy your new NFT! 🎨

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

