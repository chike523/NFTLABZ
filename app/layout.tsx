import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { SettingsProvider } from "@/contexts/settings-context"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { Toaster } from "@/components/ui/toaster"
import PageLoader from "@/components/page-loader"
import SupportChatWidget from "@/components/support-chat-widget"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

// Note: Metadata is static in Next.js, so we'll use default values here
// Dynamic metadata will be handled in individual pages using generateMetadata
export const metadata: Metadata = {
  title: "NFT Marketplace - Digital Art Platform",
  description: "Discover and collect extraordinary NFTs",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon will be set dynamically by DynamicFavicon component */}
      </head>
      <body className={`${inter.className} font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <SettingsProvider>
            <PageLoader />
            <DynamicFavicon />
            <SupportChatWidget />
            <div suppressHydrationWarning>
              {children}
            </div>
            <Toaster />
          </SettingsProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
