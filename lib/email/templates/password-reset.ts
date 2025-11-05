export interface PasswordResetData {
  username: string
  resetLink: string
  expiresIn: string
  siteName: string
  siteUrl: string
}

export function getPasswordResetTemplate(data: PasswordResetData) {
  return {
    subject: `Reset Your ${data.siteName} Password`,
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
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
            </td>
          </tr>
          
          <!-- Lock Icon -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px;">
              <div style="width: 80px; height: 80px; background-color: #dbeafe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
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
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 6px; font-weight: 600; font-size: 17px; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);">
                  Reset Password
                </a>
              </div>
              
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">⏱️ Link Expires Soon</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                  This reset link will expire in <strong>${data.expiresIn}</strong>. Request a new one if it expires.
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #666; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              
              <div style="background-color: #f9fafb; padding: 12px; border-radius: 4px; margin: 10px 0 20px;">
                <code style="color: #3b82f6; font-size: 12px; word-break: break-all;">${data.resetLink}</code>
              </div>
              
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Didn't request this?</strong> If you didn't ask to reset your password, please ignore this email or contact support if you're concerned about your account security.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Questions? <a href="${data.siteUrl}/dashboard/support" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
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

We received a request to reset your password. Click the link below to create a new password:

${data.resetLink}

⏱️ Link Expires Soon
This reset link will expire in ${data.expiresIn}. Request a new one if it expires.

⚠️ Didn't request this? If you didn't ask to reset your password, please ignore this email or contact support if you're concerned about your account security.

Questions? Contact Support: ${data.siteUrl}/dashboard/support

© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.
    `
  }
}

