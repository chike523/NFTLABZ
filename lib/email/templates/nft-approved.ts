export interface NftApprovedData {
  username: string
  nftTitle: string
  nftId: string
  nftImage?: string
  priceEth?: string
  siteName: string
  siteUrl: string
}

export function getNftApprovedTemplate(data: NftApprovedData) {
  return {
    subject: `🎉 Your NFT "${data.nftTitle}" is Now Live!`,
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">NFT Approved! 🎨</h1>
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
                Hi <strong>${data.username}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Congratulations! Your NFT has been approved and is now live on our marketplace! 🚀
              </p>
              
              <!-- NFT Details Box -->
              <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #5b21b6; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">NFT Title</p>
                <p style="margin: 0 0 12px; color: #111; font-size: 24px; font-weight: 700;">${data.nftTitle}</p>
                ${data.priceEth ? `
                <p style="margin: 0; color: #666; font-size: 16px;">
                  <strong>Listed Price:</strong> ${data.priceEth} ETH
                </p>
                ` : ''}
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>What happens next:</strong>
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>Your NFT is visible to all marketplace visitors</li>
                <li>Collectors can now purchase or bid on it</li>
                <li>You'll receive email notifications for bids and purchases</li>
                <li>Track performance in your NFT Profile</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/nft/${data.nftId}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  View Your NFT
                </a>
                <a href="${data.siteUrl}/dashboard/profile" style="display: inline-block; background-color: #6b7280; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  My Profile
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Share your NFT on social media to reach more collectors!
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

Congratulations! Your NFT has been approved and is now live on our marketplace! 🚀

NFT Title: ${data.nftTitle}
${data.priceEth ? `Listed Price: ${data.priceEth} ETH` : ''}

What happens next:
- Your NFT is visible to all marketplace visitors
- Collectors can now purchase or bid on it
- You'll receive email notifications for bids and purchases
- Track performance in your NFT Profile

View Your NFT: ${data.siteUrl}/nft/${data.nftId}
My Profile: ${data.siteUrl}/dashboard/profile

Share your NFT on social media to reach more collectors!

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

