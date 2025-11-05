"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import UserGuard from "@/components/auth/user-guard"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [isAuthPage, setIsAuthPage] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if it's an auth page (signin, signup, etc.)
    const authPages = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/verify-email', '/auth/reset-password']
    setIsAuthPage(authPages.some(page => pathname.startsWith(page)))
  }, [pathname])

  // Additional auth check for dashboard pages
  useEffect(() => {
    const verifyAccess = async () => {
      if (isAuthPage) {
        setIsChecking(false)
        return
      }

      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Check for valid session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.log('🔒 Dashboard Layout: Session error, redirecting to login:', error.message)
          router.replace('/auth/signin')
          return
        }
        
        if (!session || !session.user) {
          console.log('🔒 Dashboard Layout: No valid session, redirecting to login')
          router.replace('/auth/signin')
          return
        }
        
        // Check if session is expired
        if (session.expires_at && session.expires_at < Date.now() / 1000) {
          console.log('🔒 Dashboard Layout: Session expired, redirecting to login')
          router.replace('/auth/signin')
          return
        }
        
        console.log('🔒 Dashboard Layout: Valid session confirmed')
        setIsChecking(false)
        
      } catch (error) {
        console.log('🔒 Dashboard Layout: Error checking session, redirecting to login:', error)
        router.replace('/auth/signin')
      }
    }

    verifyAccess()
  }, [pathname, isAuthPage, router])

  // If it's an auth page, show it without protection
  if (isAuthPage) {
    return <>{children}</>
  }

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

      // For all dashboard pages, wrap with UserGuard
      return (
        <UserGuard>
          {children}
        </UserGuard>
      )
}
