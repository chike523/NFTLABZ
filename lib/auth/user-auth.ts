import { createClient } from '../supabase/client'

// Types
export interface RegularUser {
  id: string
  username: string
  display_name?: string
  email: string
  bio?: string
  avatar_url?: string
  cover_image_url?: string
  status: 'active' | 'suspended' | 'banned'
  created_at: string
  updated_at: string
}

export interface UserAuthError {
  message: string
  status?: number
}

// User Authentication Service - Completely separate from admin auth
export class UserAuthService {
  private supabase = createClient()

  // User sign up - Only creates in Users table, blocks admin emails
  async userSignUp(email: string, password: string, username: string) {
    try {
      // First check if email exists in Admin table (block admin emails)
      const { data: adminCheck } = await this.supabase
        .from('Admin')
        .select('user_id')
        .eq('user_id', email)
        .single()

      if (adminCheck) {
        throw new Error('This email is reserved for administrative use')
      }

      // Create user in Supabase Auth
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

      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: signupOptions
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Manually create profile in Users table (no automatic trigger)
      // Send welcome email asynchronously
      fetch('/api/auth/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username })
      }).catch(err => console.error('[Email] Welcome email request failed:', err))

      return {
        success: true,
        user: authData.user,
        profile: null,
        message: 'Check your email for verification link!'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'User sign up failed'
      }
    }
  }

  // User sign in - Only checks Users table, blocks admin emails
  async userSignIn(email: string, password: string) {
    try {
      // First check if email exists in Admin table (block admins from user login)
      const { data: { user: authUser } } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (!authUser) throw new Error('Invalid credentials')

      // Check if this user is in Admin table
      const { data: adminCheck } = await this.supabase
        .from('Admin')
        .select('user_id')
        .eq('user_id', authUser.id)
        .single()

      if (adminCheck) {
        // This is an admin, sign them out and block
        await this.supabase.auth.signOut()
        throw new Error('Admin users must login at /admin/login')
      }

      // Verify user exists in Users table
      const { data: userData, error: userError } = await this.supabase
        .from('Users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        await this.supabase.auth.signOut()
        throw new Error('User profile not found')
      }

      // Check if user is active
      if (userData.status !== 'active') {
        await this.supabase.auth.signOut()
        throw new Error('Account is suspended or banned')
      }

      return {
        success: true,
        user: authUser,
        profile: userData
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'User sign in failed'
      }
    }
  }

  // User sign out
  async userSignOut() {
    try {
      // Clear local storage first
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userSession')
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
        error: error.message || 'User sign out failed'
      }
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      
      if (userError) throw userError
      if (!user) return null

      // Get user profile from Users table
      const { data: profile, error: profileError } = await this.supabase
        .from('Users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) return null

      return {
        ...user,
        profile
      }
    } catch (error: any) {
      console.error('Get user error:', error)
      return null
    }
  }

  // Update user profile
  async updateProfile(updates: {
    username?: string
    display_name?: string
    bio?: string
    avatar_url?: string
    cover_image_url?: string
  }) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await this.supabase
        .from('Users')
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

  // Listen to auth changes (user only)
  onAuthStateChange(callback: (user: any) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Verify user is not an admin
        const { data: adminCheck } = await this.supabase
          .from('Admin')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single()

        if (adminCheck) {
          // This is an admin, don't allow in user context
          callback(null)
        } else {
          callback(session.user)
        }
      } else {
        callback(null)
      }
    })
  }

  // Reset password
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
}

// Create singleton instance
export const userAuthService = new UserAuthService()

