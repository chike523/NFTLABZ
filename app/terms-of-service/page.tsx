"use client"

import React from 'react'
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useLegalEmail, useSiteName } from '@/hooks/use-settings'

export default function TermsOfServicePage() {
  const legalEmail = useLegalEmail()
  const siteName = useSiteName()
  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: December {new Date().getFullYear()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using {siteName}'s platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Platform Description</h2>
              <p className="text-muted-foreground mb-4">
                {siteName} is a decentralized NFT marketplace that facilitates the buying, selling, and trading of non-fungible tokens (NFTs). Our platform operates on blockchain technology and provides tools for creators and collectors to interact in the digital art ecosystem.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>
              <p className="text-muted-foreground mb-4">
                To use certain features of our platform, you must:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Be at least 18 years old or the age of majority in your jurisdiction</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. NFT Transactions</h2>
              <p className="text-muted-foreground mb-4">
                When buying, selling, or trading NFTs on our platform:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All transactions are final and cannot be reversed</li>
                <li>You are responsible for verifying NFT authenticity and ownership</li>
                <li>Transaction fees and gas costs are your responsibility</li>
                <li>We do not guarantee the value or future performance of NFTs</li>
                <li>Blockchain transactions are public and permanent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property Rights</h2>
              <p className="text-muted-foreground mb-4">
                Regarding intellectual property:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>NFT ownership does not automatically transfer copyright</li>
                <li>Creators retain intellectual property rights unless explicitly transferred</li>
                <li>You may not use NFTs for commercial purposes without permission</li>
                <li>Respect the rights of content creators and copyright holders</li>
                <li>Report any intellectual property violations to us</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Prohibited Activities</h2>
              <p className="text-muted-foreground mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use the platform for illegal activities or fraud</li>
                <li>Create or trade NFTs containing illegal, harmful, or offensive content</li>
                <li>Attempt to hack, disrupt, or compromise platform security</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Manipulate prices or engage in market manipulation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Fees and Payments</h2>
              <p className="text-muted-foreground mb-4">
                Our fee structure includes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Transaction fees for successful trades</li>
                <li>Gas fees for blockchain transactions (paid to network)</li>
                <li>Listing fees for certain premium features</li>
                <li>All fees are clearly displayed before transaction completion</li>
                <li>Fees are non-refundable once transactions are processed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Disclaimers and Limitations</h2>
              <p className="text-muted-foreground mb-4">
                Our platform is provided "as is" without warranties of any kind. We disclaim:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Guarantees regarding NFT authenticity or value</li>
                <li>Assurance of uninterrupted or error-free service</li>
                <li>Responsibility for third-party actions or content</li>
                <li>Liability for investment losses or market fluctuations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law, {siteName} shall not be liable for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Direct, indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>NFT value fluctuations or market volatility</li>
                <li>Blockchain network issues or transaction failures</li>
                <li>Third-party service disruptions or security breaches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground mb-4">
                You agree to indemnify and hold harmless {siteName} from any claims, damages, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Your use of the platform in violation of these terms</li>
                <li>Your violation of any laws or third-party rights</li>
                <li>Content you create, upload, or share on the platform</li>
                <li>Your participation in NFT transactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Platform Availability</h2>
              <p className="text-muted-foreground mb-4">
                We strive to maintain platform availability but cannot guarantee:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Uninterrupted access to our services</li>
                <li>Immediate resolution of technical issues</li>
                <li>Compatibility with all devices or browsers</li>
                <li>Support for all blockchain networks or wallets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
              <p className="text-muted-foreground mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate these Terms of Service</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Pose a security risk to our platform or users</li>
                <li>Fail to comply with applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These Terms of Service are governed by and construed in accordance with applicable laws. Any disputes arising from these terms or your use of the platform will be resolved through binding arbitration or in the courts of competent jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these terms at any time. We will notify users of material changes through our platform or by email. Your continued use of the platform after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> {legalEmail}<br />
                  <strong>Address:</strong> {siteName} Legal Team<br />
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
