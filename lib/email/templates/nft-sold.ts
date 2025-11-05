export interface NftSoldData {
  sellerUsername: string
  buyerUsername: string
  nftTitle: string
  nftId: string
  nftImage?: string
  saleAmount: string
  saleAmountUsd?: string
  platformFee: string
  netEarnings: string
  siteName: string
  siteUrl: string
}

export function getNftSoldTemplate(data: NftSoldData) {
  return {
    subject: `💰 NFT Sold! "${data.nftTitle}" - ${data.saleAmount} ETH`,
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">💰 You Made a Sale!</h1>
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
                Congratulations! Your NFT has been sold to <strong>${data.buyerUsername}</strong>!
              </p>
              
              <!-- NFT Title -->
              <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #111; font-size: 22px; font-weight: 700;">${data.nftTitle}</p>
              </div>
              
              <!-- Earnings Box -->
              <div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 24px; margin: 20px 0; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px;">Sale Price:</td>
                    <td style="padding: 8px 0; color: #111; font-size: 18px; text-align: right; font-weight: 700;">${data.saleAmount} ETH</td>
                  </tr>
                  ${data.saleAmountUsd ? `
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 13px;">USD Value:</td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; text-align: right;">≈ $${data.saleAmountUsd}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 13px;">Platform Fee:</td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 13px; text-align: right;">-${data.platformFee} ETH</td>
                  </tr>
                  <tr style="border-top: 2px solid #10b981;">
                    <td style="padding: 12px 0 0; color: #065f46; font-size: 15px; font-weight: 600;">Your Earnings:</td>
                    <td style="padding: 12px 0 0; color: #111; font-size: 24px; text-align: right; font-weight: 700;">${data.netEarnings} ETH</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #dbeafe; border: 1px solid #93c5fd; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                  <strong>✓ Funds Added:</strong> Your earnings have been credited to your wallet balance.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/dashboard/nft-transactions" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Transaction
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Great job! Keep creating amazing art 🎨
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

Congratulations! Your NFT has been sold to ${data.buyerUsername}!

NFT: ${data.nftTitle}

Sale Summary:
- Sale Price: ${data.saleAmount} ETH${data.saleAmountUsd ? ` (≈ $${data.saleAmountUsd} USD)` : ''}
- Platform Fee: -${data.platformFee} ETH
- Your Earnings: ${data.netEarnings} ETH

✓ Funds Added: Your earnings have been credited to your wallet balance.

View Transaction: ${data.siteUrl}/dashboard/nft-transactions

Great job! Keep creating amazing art 🎨

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

