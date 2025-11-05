export interface NftPurchasedData {
  buyerUsername: string
  sellerUsername: string
  nftTitle: string
  nftId: string
  nftImage?: string
  purchaseAmount: string
  purchaseAmountUsd?: string
  siteName: string
  siteUrl: string
}

export function getNftPurchasedTemplate(data: NftPurchasedData) {
  return {
    subject: `✅ Purchase Confirmed - "${data.nftTitle}"`,
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✅ Purchase Confirmed!</h1>
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
                Hi <strong>${data.buyerUsername}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Congratulations on your purchase! You are now the proud owner of this NFT 🎉
              </p>
              
              <!-- NFT Title -->
              <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #5b21b6; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">You Now Own</p>
                <p style="margin: 0; color: #111; font-size: 24px; font-weight: 700;">${data.nftTitle}</p>
              </div>
              
              <!-- Purchase Details -->
              <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 12px; color: #666; font-size: 14px; font-weight: 600;">Purchase Details</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Price Paid:</td>
                    <td style="padding: 8px 0; color: #111; font-size: 14px; text-align: right; font-weight: 600;">${data.purchaseAmount} ETH</td>
                  </tr>
                  ${data.purchaseAmountUsd ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 13px;">USD Value:</td>
                    <td style="padding: 8px 0; color: #666; font-size: 13px; text-align: right;">≈ $${data.purchaseAmountUsd}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Previous Owner:</td>
                    <td style="padding: 8px 0; color: #111; font-size: 14px; text-align: right;">${data.sellerUsername}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>What's next:</strong>
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>View your NFT in your collection</li>
                <li>Show it off to friends and followers</li>
                <li>List it for resale whenever you want</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/nft/${data.nftId}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
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
                Thank you for supporting digital artists! 🎨
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
Hi ${data.buyerUsername},

Congratulations on your purchase! You are now the proud owner of this NFT 🎉

You Now Own: ${data.nftTitle}

Purchase Details:
- Price Paid: ${data.purchaseAmount} ETH${data.purchaseAmountUsd ? ` (≈ $${data.purchaseAmountUsd} USD)` : ''}
- Previous Owner: ${data.sellerUsername}

What's next:
- View your NFT in your collection
- Show it off to friends and followers
- List it for resale whenever you want

View Your NFT: ${data.siteUrl}/nft/${data.nftId}
My Collection: ${data.siteUrl}/dashboard/profile

Thank you for supporting digital artists! 🎨

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

