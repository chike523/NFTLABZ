import { sendMail } from './mailer'
import { getDepositApprovedTemplate, DepositApprovedData } from './templates/deposit-approved'
import { getDepositRejectedTemplate, DepositRejectedData } from './templates/deposit-rejected'
import { getWithdrawalApprovedTemplate, WithdrawalApprovedData } from './templates/withdrawal-approved'
import { getWithdrawalRejectedTemplate, WithdrawalRejectedData } from './templates/withdrawal-rejected'
import { getNftApprovedTemplate, NftApprovedData } from './templates/nft-approved'
import { getNftRejectedTemplate, NftRejectedData } from './templates/nft-rejected'
import { getAdminNewDepositTemplate, AdminNewDepositData } from './templates/admin-new-deposit'
import { getAdminNewWithdrawalTemplate, AdminNewWithdrawalData } from './templates/admin-new-withdrawal'
import { getBidReceivedTemplate, BidReceivedData } from './templates/bid-received'
import { getBidAcceptedTemplate, BidAcceptedData } from './templates/bid-accepted'
import { getBidRejectedTemplate, BidRejectedData } from './templates/bid-rejected'
import { getNftSoldTemplate, NftSoldData } from './templates/nft-sold'
import { getNftPurchasedTemplate, NftPurchasedData } from './templates/nft-purchased'
import { getWelcomeTemplate, WelcomeEmailData } from './templates/welcome'
import { getPasswordResetTemplate, PasswordResetData } from './templates/password-reset'
import { getSupportReplyTemplate, SupportReplyData } from './templates/support-reply'
import { getWalletAdjustmentTemplate, WalletAdjustmentData } from './templates/wallet-adjustment'
import { createAdminClient } from '@/lib/supabase/admin'

export class EmailNotificationService {
  /**
   * Send deposit approved email to user
   */
  static async sendDepositApproved(to: string, data: DepositApprovedData) {
    try {
      const { subject, html, text } = getDepositApprovedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'deposit_approved', 'sent')
    } catch (error) {
      console.error('[Email] Deposit approved failed:', error)
      await this.logEmail(to, 'Deposit Approved', 'deposit_approved', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send deposit rejected email to user
   */
  static async sendDepositRejected(to: string, data: DepositRejectedData) {
    try {
      const { subject, html, text } = getDepositRejectedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'deposit_rejected', 'sent')
    } catch (error) {
      console.error('[Email] Deposit rejected failed:', error)
      await this.logEmail(to, 'Deposit Rejected', 'deposit_rejected', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send withdrawal approved email to user
   */
  static async sendWithdrawalApproved(to: string, data: WithdrawalApprovedData) {
    try {
      const { subject, html, text } = getWithdrawalApprovedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'withdrawal_approved', 'sent')
    } catch (error) {
      console.error('[Email] Withdrawal approved failed:', error)
      await this.logEmail(to, 'Withdrawal Approved', 'withdrawal_approved', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send withdrawal rejected email to user
   */
  static async sendWithdrawalRejected(to: string, data: WithdrawalRejectedData) {
    try {
      const { subject, html, text } = getWithdrawalRejectedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'withdrawal_rejected', 'sent')
    } catch (error) {
      console.error('[Email] Withdrawal rejected failed:', error)
      await this.logEmail(to, 'Withdrawal Rejected', 'withdrawal_rejected', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send NFT approved email to user
   */
  static async sendNftApproved(to: string, data: NftApprovedData) {
    try {
      const { subject, html, text } = getNftApprovedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'nft_approved', 'sent')
    } catch (error) {
      console.error('[Email] NFT approved failed:', error)
      await this.logEmail(to, 'NFT Approved', 'nft_approved', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send NFT rejected email to user
   */
  static async sendNftRejected(to: string, data: NftRejectedData) {
    try {
      const { subject, html, text } = getNftRejectedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'nft_rejected', 'sent')
    } catch (error) {
      console.error('[Email] NFT rejected failed:', error)
      await this.logEmail(to, 'NFT Rejected', 'nft_rejected', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send new deposit alert to admins
   */
  static async sendAdminNewDeposit(adminEmails: string[], data: AdminNewDepositData) {
    try {
      const { subject, html, text } = getAdminNewDepositTemplate(data)
      
      for (const email of adminEmails) {
        await sendMail({ to: email, subject, html, text })
        await this.logEmail(email, subject, 'admin_new_deposit', 'sent')
      }
    } catch (error) {
      console.error('[Email] Admin new deposit failed:', error)
      throw error
    }
  }

  /**
   * Send new withdrawal alert to admins
   */
  static async sendAdminNewWithdrawal(adminEmails: string[], data: AdminNewWithdrawalData) {
    try {
      const { subject, html, text } = getAdminNewWithdrawalTemplate(data)
      
      for (const email of adminEmails) {
        await sendMail({ to: email, subject, html, text })
        await this.logEmail(email, subject, 'admin_new_withdrawal', 'sent')
      }
    } catch (error) {
      console.error('[Email] Admin new withdrawal failed:', error)
      throw error
    }
  }

  /**
   * Send new bid received notification to seller
   */
  static async sendBidReceived(to: string, data: BidReceivedData) {
    try {
      const { subject, html, text } = getBidReceivedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'bid_received', 'sent')
    } catch (error) {
      console.error('[Email] Bid received failed:', error)
      await this.logEmail(to, 'Bid Received', 'bid_received', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send bid accepted notification to bidder
   */
  static async sendBidAccepted(to: string, data: BidAcceptedData) {
    try {
      const { subject, html, text } = getBidAcceptedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'bid_accepted', 'sent')
    } catch (error) {
      console.error('[Email] Bid accepted failed:', error)
      await this.logEmail(to, 'Bid Accepted', 'bid_accepted', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send bid rejected notification to bidder
   */
  static async sendBidRejected(to: string, data: BidRejectedData) {
    try {
      const { subject, html, text } = getBidRejectedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'bid_rejected', 'sent')
    } catch (error) {
      console.error('[Email] Bid rejected failed:', error)
      await this.logEmail(to, 'Bid Rejected', 'bid_rejected', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send NFT sold notification to seller
   */
  static async sendNftSold(to: string, data: NftSoldData) {
    try {
      const { subject, html, text } = getNftSoldTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'nft_sold', 'sent')
    } catch (error) {
      console.error('[Email] NFT sold failed:', error)
      await this.logEmail(to, 'NFT Sold', 'nft_sold', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send NFT purchased confirmation to buyer
   */
  static async sendNftPurchased(to: string, data: NftPurchasedData) {
    try {
      const { subject, html, text } = getNftPurchasedTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'nft_purchased', 'sent')
    } catch (error) {
      console.error('[Email] NFT purchased failed:', error)
      await this.logEmail(to, 'NFT Purchased', 'nft_purchased', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcome(to: string, data: WelcomeEmailData) {
    try {
      const { subject, html, text } = getWelcomeTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'welcome', 'sent')
    } catch (error) {
      console.error('[Email] Welcome email failed:', error)
      await this.logEmail(to, 'Welcome', 'welcome', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(to: string, data: PasswordResetData) {
    try {
      const { subject, html, text } = getPasswordResetTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'password_reset', 'sent')
    } catch (error) {
      console.error('[Email] Password reset failed:', error)
      await this.logEmail(to, 'Password Reset', 'password_reset', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send support ticket reply notification
   */
  static async sendSupportReply(to: string, data: SupportReplyData) {
    try {
      const { subject, html, text } = getSupportReplyTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, 'support_reply', 'sent')
    } catch (error) {
      console.error('[Email] Support reply failed:', error)
      await this.logEmail(to, 'Support Reply', 'support_reply', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send wallet adjustment notification to user
   */
  static async sendWalletAdjustment(to: string, data: WalletAdjustmentData) {
    try {
      const { subject, html, text } = getWalletAdjustmentTemplate(data)
      await sendMail({ to, subject, html, text })
      await this.logEmail(to, subject, `wallet_${data.action}`, 'sent')
    } catch (error) {
      console.error('[Email] Wallet adjustment notification failed:', error)
      await this.logEmail(
        to,
        `Wallet ${data.action}`,
        `wallet_${data.action}`,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  /**
   * Get list of admin emails for alerts (uses contact email from settings)
   */
  static async getAdminEmails(): Promise<string[]> {
    try {
      const supabase = createAdminClient()
      
      // Fetch contact email from site settings
      const { data: emailSetting, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'email')
        .maybeSingle()
      
      if (error) {
        console.error('[Email] Failed to fetch contact email from settings:', error)
        return []
      }
      
      const contactEmail = emailSetting?.value?.trim()
      
      if (!contactEmail || !contactEmail.includes('@')) {
        console.warn('[Email] No valid contact email found in settings')
        return []
      }
      
      console.log(`[Email] Using admin contact email:`, contactEmail)
      
      return [contactEmail]
    } catch (error) {
      console.error('[Email] Get admin emails failed:', error)
      return []
    }
  }

  /**
   * Log email to database for audit trail
   */
  private static async logEmail(
    toEmail: string,
    subject: string,
    emailType: string,
    status: 'sent' | 'failed',
    errorMessage?: string
  ) {
    try {
      const supabase = createAdminClient()
      
      await supabase
        .from('email_logs')
        .insert({
          to_email: toEmail,
          subject,
          email_type: emailType,
          status,
          error_message: errorMessage || null,
          sent_at: new Date().toISOString()
        })
    } catch (error) {
      // Don't throw - logging failure shouldn't break email sending
      console.error('[Email] Failed to log email:', error)
    }
  }
}

