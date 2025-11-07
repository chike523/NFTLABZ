import { createClient } from '../supabase/client'

// Types
export interface User {
  id: string
  email: string
  username?: string
  display_name?: string
  avatar_url?: string
  status?: string
  email_verified?: boolean
}

export interface AuthError {
  message: string
  status?: number
}

// Client-side auth helpers
export class AuthService {
  private supabase = createClient()

  // Sign up with email and password
  async signUp(email: string, password: string, username: string) {
    try {
      const signupOptions: {
        data: {
          username: string
          display_name: string
        }
        emailRedirectTo?: string
      } = {
        data: {
          username,
          display_name: username
        }
      }

      const emailRedirectTo =
        process.env.NEXT_PUBLIC_EMAIL_SIGNUP_REDIRECT ??
        process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ??
        (typeof window !== 'undefined' ? `${window.location.origin}/auth/verify-email` : undefined)

      if (emailRedirectTo) {
        signupOptions.emailRedirectTo = emailRedirectTo
      }

      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: signupOptions
      })

      if (error) throw error

      return {
        success: true,
        user: data.user,
        message: 'Check your email for verification link!'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign up failed'
      }
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign in failed'
      }
    }
  }

  // Sign out
  async signOut() {
    try {
      // Clear any local storage items FIRST
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminSession')
        localStorage.removeItem('userSession')
        localStorage.removeItem('supabase.auth.token')
        // Clear any other auth-related storage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }

      // Sign out from Supabase (destroys server-side session)
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error

      // Force clear any remaining session data
      await this.supabase.auth.signOut({ scope: 'global' })

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign out failed'
      }
    }
  }

  // Request password reset
  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      })

      if (error) throw error

      return {
        success: true,
        message: 'Password reset email sent!'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Password reset failed'
      }
    }
  }

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return {
        success: true,
        message: 'Password updated successfully!'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Password update failed'
      }
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error) throw error
      if (!user) return null

      // Get user profile
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return {
        ...user,
        profile
      }
    } catch (error: any) {
      console.error('Get user error:', error)
      return null
    }
  }

  // Check if user is admin
  async isAdmin(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('admin_users')
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

  // Update user profile
  async updateProfile(updates: {
    username?: string
    display_name?: string
    bio?: string
    avatar_url?: string
  }) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        profile: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Profile update failed'
      }
    }
  }

  // Add wallet address
  async addWallet(walletAddress: string) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await this.supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        wallet: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Wallet addition failed'
      }
    }
  }

  // Listen to auth changes
  onAuthStateChange(callback: (user: any) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }
}


// Create singleton instance
export const authService = new AuthService()
