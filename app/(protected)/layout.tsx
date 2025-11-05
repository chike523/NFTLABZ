"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import UserGuard from "@/components/auth/user-guard"

interface ProtectedLayoutProps {
  children: React.ReactNode
  requireEmailVerification?: boolean
  requireActiveStatus?: boolean
}

export default function ProtectedLayout({
  children,
  requireEmailVerification = false,
  requireActiveStatus = true
}: ProtectedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [isAuthPage, setIsAuthPage] = useState(false)

  useEffect(() => {
    // Check if it's an auth page (signin, signup, etc.)
    const authPages = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/verify-email', '/auth/reset-password']
    setIsAuthPage(authPages.some(page => pathname.startsWith(page)))
  }, [pathname])

  // If it's an auth page, show it without protection
  if (isAuthPage) {
    return <>{children}</>
  }

  // For all other protected pages, wrap with UserGuard
  return (
    <UserGuard 
      requireEmailVerification={requireEmailVerification}
      requireActiveStatus={requireActiveStatus}
    >
      {children}
    </UserGuard>
  )
}
