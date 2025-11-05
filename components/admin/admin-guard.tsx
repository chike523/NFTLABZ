"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

interface AdminGuardProps {
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'admin' | 'moderator' | 'support'
  fallback?: React.ReactNode
}

export default function AdminGuard({ 
  children, 
  requiredRole = 'admin',
  fallback 
}: AdminGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [adminData, setAdminData] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loading) return

      if (!user) {
        console.log('🔒 AdminGuard: No user, redirecting to login')
        router.push('/admin/login')
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
          console.log('🔒 AdminGuard: User is not an admin')
          router.push('/admin/login')
          return
        }

        // Check role hierarchy
        const roleHierarchy = {
          'super_admin': 4,
          'admin': 3,
          'moderator': 2,
          'support': 1
        }

        const userLevel = roleHierarchy[admin.role as keyof typeof roleHierarchy] || 0
        const requiredLevel = roleHierarchy[requiredRole] || 0

        if (userLevel < requiredLevel) {
          console.log(`🔒 AdminGuard: Insufficient role level (${admin.role} < ${requiredRole})`)
          router.push('/admin/dashboard')
          return
        }

        setAdminData(admin)
        setIsAuthorized(true)
      } catch (error) {
        console.error('🔒 AdminGuard: Error checking admin status:', error)
        router.push('/admin/login')
      } finally {
        setIsChecking(false)
      }
    }

    checkAdminStatus()
  }, [user, loading, router, requiredRole])

  // Show loading while checking
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Verifying admin privileges...</p>
        </div>
      </div>
    )
  }

  // Show fallback if not authorized
  if (!isAuthorized) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
