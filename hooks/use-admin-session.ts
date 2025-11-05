"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

interface AdminSession {
  user: any
  admin: any
  isAdmin: boolean
  role: string
}

export function useAdminSession() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAdminSession = async () => {
      if (loading) return

      if (!user) {
        setAdminSession(null)
        setIsChecking(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Check admin status
        const { data: admin, error } = await supabase
          .from('Admin')
          .select('role, status, user_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (error || !admin) {
          setAdminSession(null)
          setIsChecking(false)
          return
        }

        setAdminSession({
          user,
          admin,
          isAdmin: true,
          role: admin.role
        })
      } catch (error) {
        console.error('Error checking admin session:', error)
        setAdminSession(null)
      } finally {
        setIsChecking(false)
      }
    }

    checkAdminSession()
  }, [user, loading])

  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      
      // Clear local state
      setAdminSession(null)
      
      // Redirect to login
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect
      window.location.href = '/admin/login'
    }
  }

  const hasRole = (requiredRole: string) => {
    if (!adminSession) return false
    
    const roleHierarchy = {
      'super_admin': 4,
      'admin': 3,
      'moderator': 2,
      'support': 1
    }

    const userLevel = roleHierarchy[adminSession.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
  }

  return {
    adminSession,
    isChecking,
    isAdmin: !!adminSession?.isAdmin,
    role: adminSession?.role,
    hasRole,
    logout
  }
}
