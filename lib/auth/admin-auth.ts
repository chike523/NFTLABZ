import { createClient } from '../supabase/client'

// Types
export interface AdminUser {
  id: string
  user_id: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  status: 'active' | 'inactive'
  permissions: any[]
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface AdminAuthError {
  message: string
  status?: number
}

// Admin Authentication Service - Completely separate from user auth
export class AdminAuthService {
  private supabase = createClient()

  // Admin sign in - Only checks Admin table
  async adminSignIn(email: string, password: string) {
    try {
      // First, authenticate with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Authentication failed')

      // Then verify user is an admin in Admin table
      const { data: adminData, error: adminError } = await this.supabase
        .from('Admin')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('status', 'active')
        .single()

      if (adminError || !adminData) {
        // Not an admin, sign them out
        await this.supabase.auth.signOut()
        throw new Error('Access denied. Admin privileges required.')
      }

      // Update last login
      await this.supabase
        .from('Admin')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', authData.user.id)

      return {
        success: true,
        user: authData.user,
        admin: adminData,
        session: authData.session
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Admin sign in failed'
      }
    }
  }

  // Admin sign out
  async adminSignOut() {
    try {
      // Clear local storage first
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminSession')
        localStorage.removeItem('supabase.auth.token')
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }

      // Sign out from Supabase
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error

      // Force clear any remaining session data
      await this.supabase.auth.signOut({ scope: 'global' })

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Admin sign out failed'
      }
    }
  }

  // Get current admin
  async getCurrentAdmin() {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      
      if (userError) throw userError
      if (!user) return null

      // Get admin data from Admin table
      const { data: adminData, error: adminError } = await this.supabase
        .from('Admin')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (adminError || !adminData) return null

      return {
        ...user,
        admin: adminData
      }
    } catch (error: any) {
      console.error('Get admin error:', error)
      return null
    }
  }

  // Check if user is admin
  async isAdmin(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('Admin')
        .select('role, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error || !data) return false

      return {
        isAdmin: true,
        role: data.role
      }
    } catch (error) {
      return false
    }
  }

  // Listen to auth changes (admin only)
  onAuthStateChange(callback: (user: any) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Verify user is still an admin
        const adminData = await this.isAdmin(session.user.id)
        if (adminData) {
          callback(session.user)
        } else {
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  }
}

// Create singleton instance
export const adminAuthService = new AdminAuthService()

