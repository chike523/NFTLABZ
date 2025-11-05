export interface WelcomeEmailData {
  username: string
  email: string
  siteName: string
  siteUrl: string
}

export function getWelcomeTemplate(data: WelcomeEmailData) {
  return {
    subject: `Welcome to ${data.siteName}! 🎨`,
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
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center;">
              <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 32px; font-weight: 700;">Welcome to ${data.siteName}! 🎨</h1>
              <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Your journey into digital art begins here</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 18px; line-height: 1.6;">
                Hi <strong>${data.username}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #333333; font-size: 16px; line-height: 1.6;">
                We're thrilled to have you join our community of digital artists and collectors! Your account is all set up and ready to go.
              </p>
              
              <!-- Quick Start Guide -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 24px; margin: 24px 0; border-radius: 8px; border: 1px solid #bae6fd;">
                <h3 style="margin: 0 0 16px; color: #0c4a6e; font-size: 18px; font-weight: 600;">🚀 Quick Start Guide</h3>
                
                <div style="margin-bottom: 16px;">
                  <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 12px;">
                    <p style="margin: 0 0 8px; color: #667eea; font-size: 15px; font-weight: 600;">1️⃣ Add Funds to Your Wallet</p>
                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">Make a deposit to start buying NFTs or placing bids</p>
                  </div>
                  
                  <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 12px;">
                    <p style="margin: 0 0 8px; color: #667eea; font-size: 15px; font-weight: 600;">2️⃣ Explore the Marketplace</p>
                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">Discover unique digital art from talented creators</p>
                  </div>
                  
                  <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 12px;">
                    <p style="margin: 0 0 8px; color: #667eea; font-size: 15px; font-weight: 600;">3️⃣ Create Your First NFT</p>
                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">Upload your artwork and mint it as an NFT</p>
                  </div>
                </div>
              </div>
              
              <p style="margin: 24px 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>What you can do on ${data.siteName}:</strong>
              </p>
              
              <ul style="margin: 0 0 24px; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                <li>Buy and collect unique digital artworks</li>
                <li>Place bids on your favorite NFTs</li>
                <li>Mint and sell your own creations</li>
                <li>Build your digital art portfolio</li>
                <li>Connect with artists and collectors</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${data.siteUrl}/dashboard" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  Go to Dashboard
                </a>
                <a href="${data.siteUrl}/" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Browse NFTs
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Need help getting started? <a href="${data.siteUrl}/dashboard/support" style="color: #667eea; text-decoration: none;">Contact Support</a>
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
Welcome to ${data.siteName}! 🎨

Hi ${data.username},

We're thrilled to have you join our community of digital artists and collectors! Your account is all set up and ready to go.

🚀 QUICK START GUIDE

1️⃣ Add Funds to Your Wallet
Make a deposit to start buying NFTs or placing bids

2️⃣ Explore the Marketplace
Discover unique digital art from talented creators

3️⃣ Create Your First NFT
Upload your artwork and mint it as an NFT

What you can do on ${data.siteName}:
- Buy and collect unique digital artworks
- Place bids on your favorite NFTs
- Mint and sell your own creations
- Build your digital art portfolio
- Connect with artists and collectors

Go to Dashboard: ${data.siteUrl}/dashboard
Browse NFTs: ${data.siteUrl}/

Need help getting started? Contact Support: ${data.siteUrl}/dashboard/support

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

