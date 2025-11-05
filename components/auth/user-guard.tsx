"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

interface UserGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function UserGuard({ 
  children, 
  fallback 
}: UserGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      if (loading) return

      if (!user) {
        console.log('🔒 UserGuard: No user, redirecting to login')
        router.push('/auth/signin')
        return
      }

      try {
        const supabase = createClient()
        
        // First, check if user is an admin (block admins from user areas)
        const { data: adminCheck } = await supabase
          .from('Admin')
          .select('user_id')
          .eq('user_id', user.id)
          .single()

        if (adminCheck) {
          console.log('🔒 UserGuard: Admin user attempting to access user area')
          router.push('/admin/login')
          return
        }

        // Check if user has a profile (basic user check)
        const { data: profile, error } = await supabase
          .from('Users')
          .select('id, status')
          .eq('id', user.id)
          .single()

        if (error || !profile) {
          console.log('🔒 UserGuard: User profile not found')
          router.push('/auth/signin')
          return
        }

        // Check if account is active
        if (profile.status !== 'active') {
          console.log('🔒 UserGuard: User account is not active')
          router.push('/auth/signin')
          return
        }

        console.log('🔒 UserGuard: User authorized')
        setIsAuthorized(true)
      } catch (error) {
        console.log('🔒 UserGuard: Error checking user status:', error)
        router.push('/auth/signin')
      } finally {
        setIsChecking(false)
      }
    }

    checkUserStatus()
  }, [user, loading, router])

  // Show loading state
  if (isChecking) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized message
  if (!isAuthorized) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show authorized content
  return <>{children}</>
}