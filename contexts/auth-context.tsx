"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { authService } from '@/lib/auth/helpers'

interface AuthContextType {
  user: User | null
  profile: any | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
  updatePassword: (password: string) => Promise<any>
  updateProfile: (updates: any) => Promise<any>
  addWallet: (walletAddress: string) => Promise<any>
  isAdmin: boolean
  adminRole: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminRole, setAdminRole] = useState<string | null>(null)

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const userData = await authService.getCurrentUser()
        if (userData) {
          setUser(userData)
          setProfile(userData.profile)
          
          // Check admin status
          const adminData = await authService.isAdmin(userData.id)
          if (adminData) {
            setIsAdmin(true)
            setAdminRole(adminData.role)
          }
        }
      } catch (error) {
        console.error('Error getting initial user:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user)
      
      if (user) {
        // Get fresh profile data
        const userData = await authService.getCurrentUser()
        if (userData) {
          setProfile(userData.profile)
          
          // Check admin status
          const adminData = await authService.isAdmin(user.id)
          if (adminData) {
            setIsAdmin(true)
            setAdminRole(adminData.role)
          } else {
            setIsAdmin(false)
            setAdminRole(null)
          }
        }
      } else {
        setProfile(null)
        setIsAdmin(false)
        setAdminRole(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true)
    try {
      const result = await authService.signUp(email, password, username)
      return result
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await authService.signIn(email, password)
      return result
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    
    try {
      // First, sign out from Supabase
      const result = await authService.signOut()
      
      if (result.success) {
        // Only clear state after successful logout
        setUser(null)
        setProfile(null)
        setIsAdmin(false)
        setAdminRole(null)
        
        console.log('🔒 Auth context: Logout successful, state cleared')
      } else {
        console.error('🔒 Auth context: Logout failed:', result.error)
        // Clear state even if logout fails to prevent stuck state
        setUser(null)
        setProfile(null)
        setIsAdmin(false)
        setAdminRole(null)
      }
      
      return result
    } catch (error) {
      console.error('🔒 Auth context: Logout error:', error)
      // Clear state even if logout fails to prevent stuck state
      setUser(null)
      setProfile(null)
      setIsAdmin(false)
      setAdminRole(null)
      
      return {
        success: false,
        error: error.message || 'Logout failed'
      }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      const result = await authService.resetPassword(email)
      return result
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (password: string) => {
    setLoading(true)
    try {
      const result = await authService.updatePassword(password)
      return result
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: any) => {
    setLoading(true)
    try {
      const result = await authService.updateProfile(updates)
      if (result.success) {
        setProfile(result.profile)
      }
      return result
    } finally {
      setLoading(false)
    }
  }

  const refreshUserData = async () => {
    await fetchUserData()
  }

  const addWallet = async (walletAddress: string) => {
    setLoading(true)
    try {
      const result = await authService.addWallet(walletAddress)
      return result
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    addWallet,
    refreshUserData,
    isAdmin,
    adminRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  return {
    user,
    loading,
    isAuthenticated: !!user
  }
}

// Hook for admin routes
export function useRequireAdmin() {
  const { user, isAdmin, adminRole, loading } = useAuth()
  
  return {
    user,
    isAdmin,
    adminRole,
    loading,
    isAuthenticated: !!user,
    canAccess: !!user && isAdmin
  }
}
