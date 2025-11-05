export interface NftRejectedData {
  username: string
  nftTitle: string
  nftId: string
  nftImage?: string
  reason?: string
  siteName: string
  siteUrl: string
}

export function getNftRejectedTemplate(data: NftRejectedData) {
  return {
    subject: `NFT Submission Needs Revision: "${data.nftTitle}"`,
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
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">NFT Needs Revision</h1>
            </td>
          </tr>
          
          ${data.nftImage ? `
          <!-- NFT Image -->
          <tr>
            <td align="center" style="padding: 30px 30px 10px;">
              <img src="${data.nftImage}" alt="${data.nftTitle}" style="max-width: 300px; width: 100%; height: auto; border-radius: 8px; opacity: 0.7;" />
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
                Thank you for submitting your NFT. After review, we need you to make some revisions before we can approve it for the marketplace.
              </p>
              
              <!-- NFT Title Box -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">NFT Title</p>
                <p style="margin: 0; color: #111; font-size: 20px; font-weight: 700;">${data.nftTitle}</p>
              </div>
              
              ${data.reason ? `
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600;">Feedback from our team:</p>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">${data.reason}</p>
              </div>
              ` : ''}
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>Common reasons for revision:</strong>
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>Image quality needs improvement</li>
                <li>Title or description violates guidelines</li>
                <li>Pricing information is incomplete</li>
                <li>Copyright or ownership concerns</li>
              </ul>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Please review your submission and make the necessary changes. Once updated, resubmit your NFT for approval.
              </p>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/dashboard/profile" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  View My NFTs
                </a>
                <a href="${data.siteUrl}/dashboard/support" style="display: inline-block; background-color: #6b7280; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Contact Support
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Questions about the rejection? <a href="${data.siteUrl}/dashboard/support" style="color: #f59e0b; text-decoration: none;">Open a support ticket</a>
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

Thank you for submitting your NFT. After review, we need you to make some revisions before we can approve it for the marketplace.

NFT Title: ${data.nftTitle}

${data.reason ? `Feedback from our team:\n${data.reason}\n` : ''}

Common reasons for revision:
- Image quality needs improvement
- Title or description violates guidelines
- Pricing information is incomplete
- Copyright or ownership concerns

Please review your submission and make the necessary changes. Once updated, resubmit your NFT for approval.

View My NFTs: ${data.siteUrl}/dashboard/profile
Contact Support: ${data.siteUrl}/dashboard/support

Questions about the rejection? Open a support ticket.

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

