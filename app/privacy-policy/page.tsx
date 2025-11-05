"use client"

import React from 'react'
import Header from "@/components/header"
import Footer from "@/components/footer"
import { usePrivacyEmail, useSiteName } from '@/hooks/use-settings'

export default function PrivacyPolicyPage() {
  const privacyEmail = usePrivacyEmail()
  const siteName = useSiteName()
  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: December {new Date().getFullYear()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                At {siteName}, we collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Account information (email address, username, wallet address)</li>
                <li>Transaction data and NFT ownership records</li>
                <li>Communication preferences and support interactions</li>
                <li>Device information and usage analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Process transactions and manage your NFT collection</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send important updates about your account and our services</li>
                <li>Improve our platform and develop new features</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Blockchain and NFT Data</h2>
              <p className="text-muted-foreground mb-4">
                As an NFT marketplace, we work with blockchain technology. Please note:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Blockchain transactions are public and permanent</li>
                <li>Your wallet address may be visible on the blockchain</li>
                <li>NFT ownership is recorded on the blockchain, not in our databases</li>
                <li>We cannot modify or delete blockchain transaction data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share information only in these circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in platform operations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information on a need-to-know basis</li>
                <li>Secure wallet integration and transaction processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access and update your account information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your transaction history</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Essential cookies for platform functionality</li>
                <li>Analytics cookies to understand usage patterns</li>
                <li>Preference cookies to remember your settings</li>
                <li>You can manage cookie preferences in your browser</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                Our platform integrates with third-party services:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Blockchain networks (Ethereum, etc.)</li>
                <li>Wallet providers (MetaMask, WalletConnect)</li>
                <li>Payment processors and cryptocurrency exchanges</li>
                <li>Analytics and security services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our services after any modifications constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> {privacyEmail}<br />
                  <strong>Address:</strong> {siteName} Privacy Team<br />
                  <strong>Response Time:</strong> We aim to respond within 48 hours
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
