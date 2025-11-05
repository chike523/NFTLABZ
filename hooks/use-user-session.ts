"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

interface UserSession {
  user: any
  profile: any
  isAuthenticated: boolean
  isEmailVerified: boolean
  isActive: boolean
  role: string
}

export function useUserSession() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userSession, setUserSession] = useState<UserSession | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkUserSession = async () => {
      if (loading) return

      if (!user) {
        setUserSession(null)
        setIsChecking(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Get user profile
        const { data: profile, error } = await supabase
          .from('Users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error || !profile) {
          setUserSession(null)
          setIsChecking(false)
          return
        }

        setUserSession({
          user,
          profile,
          isAuthenticated: true,
          isEmailVerified: !!user.email_confirmed_at,
          isActive: profile.status === 'active',
          role: profile.role || 'user'
        })
      } catch (error) {
        console.error('Error checking user session:', error)
        setUserSession(null)
      } finally {
        setIsChecking(false)
      }
    }

    checkUserSession()
  }, [user, loading])

  const logout = async () => {
    try {
      console.log('🔒 User Session: Starting logout process...')
      
      // Direct logout without complex state management
      const supabase = createClient()
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
      
      // Clear local state
      setUserSession(null)
      
      console.log('🔒 User Session: Logout successful, redirecting to signin...')
      
      // Immediate redirect to avoid React state issues
      window.location.href = '/auth/signin'
      
    } catch (error) {
      console.error('🔒 User Session: Logout error:', error)
      // Force redirect even if logout fails
      window.location.href = '/auth/signin'
    }
  }

  const hasRole = (requiredRole: string) => {
    if (!userSession) return false
    
    const roleHierarchy = {
      'admin': 3,
      'moderator': 2,
      'user': 1
    }

    const userLevel = roleHierarchy[userSession.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
  }

  const canAccess = (requirements: {
    requireEmailVerification?: boolean
    requireActiveStatus?: boolean
    requireRole?: string
  } = {}) => {
    if (!userSession) return false

    if (requirements.requireEmailVerification && !userSession.isEmailVerified) {
      return false
    }

    if (requirements.requireActiveStatus && !userSession.isActive) {
      return false
    }

    if (requirements.requireRole && !hasRole(requirements.requireRole)) {
      return false
    }

    return true
  }

  return {
    userSession,
    isChecking,
    isAuthenticated: !!userSession?.isAuthenticated,
    isEmailVerified: !!userSession?.isEmailVerified,
    isActive: !!userSession?.isActive,
    role: userSession?.role || 'user',
    hasRole,
    canAccess,
    logout
  }
}
