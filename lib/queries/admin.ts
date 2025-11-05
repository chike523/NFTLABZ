import { createClient } from '@/lib/supabase/client'

// Types for admin queries
export interface AdminUser {
  id: string
  username: string
  display_name: string | null
  email?: string
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  status: 'active' | 'suspended' | 'banned'
  created_at: string
  updated_at: string
  wallets?: {
    wallet_address: string
  }[]
  user_stats?: {
    nfts_owned: number
    nfts_created: number
    total_spent_eth: number
    total_earned_eth: number
  }[]
}

export interface AdminNFT {
  id: string
  title: string
  description: string | null
  image_url: string
  price_eth: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  creator_id: string
  owner_id: string
  category_id: string
  collection_id: string | null
  creator?: {
    username: string
    display_name: string | null
  }
  owner?: {
    username: string
    display_name: string | null
  }
  category?: {
    name: string
    slug: string
  }
}

export interface AdminTransaction {
  id: string
  type: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  amount_eth: number
  amount_usd: number | null
  token_symbol?: string | null
  created_at: string
  updated_at: string
  user_id: string
  nft_id: string | null
  from_address: string | null
  to_address: string | null
  admin_note?: string | null
  user?: {
    id: string
    username: string
    display_name: string | null
    email?: string | null
  }
  nft?: {
    id: string
    title: string
  } | null
}

export interface AdminDashboardStats {
  totalUsers: number
  totalNFTs: number
  totalTransactions: number
  platformRevenue: string
  recentUsers: number
  recentNFTs: number
  recentTransactions: number
}

// Client-side admin queries
export class AdminQueries {
  private supabase = createClient()

  // Get all users with pagination and filtering
  async getAllUsers(limit = 50, offset = 0, filters?: {
    search?: string
    status?: string
  }): Promise<{ data: AdminUser[] | null; error: string | null; count: number }> {
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      if (filters?.search) params.set('search', filters.search)
      if (filters?.status) params.set('status', filters.status)

      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch users')
      }

      return { 
        data: json.data as AdminUser[], 
        error: null, 
        count: json.count as number 
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch users', 
        count: 0 
      }
    }
  }

  // Get single user by ID with all related data
  async getUserById(userId: string): Promise<{ data: AdminUser | null; error: string | null }> {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { cache: 'no-store' })
      const json = await res.json()
      
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch user')
      }

      return { data: json.data as AdminUser, error: null }
    } catch (error) {
      console.error('Error fetching user:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch user' 
      }
    }
  }

  // Get all NFTs with creator/owner info (via service-backed API to bypass RLS)
  async getAllNFTs(limit = 50, offset = 0, filters?: {
    search?: string
    category?: string
    status?: string
  }): Promise<{ data: AdminNFT[] | null; error: string | null; count: number }> {
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      if (filters?.search) params.set('search', filters.search)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.category) params.set('category', filters.category)

      const res = await fetch(`/api/admin/nfts?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch NFTs')
      return { data: json.data as AdminNFT[], error: null, count: json.count as number }
    } catch (error) {
      console.error('Error fetching NFTs:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch NFTs', 
        count: 0 
      }
    }
  }

  // Get single NFT by ID (via service-backed API)
  async getNFTById(nftId: string): Promise<{ data: AdminNFT | null; error: string | null }> {
    try {
      const res = await fetch(`/api/admin/nfts/${nftId}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch NFT')
      return { data: json.data as AdminNFT, error: null }
    } catch (error) {
      console.error('Error fetching NFT:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch NFT' 
      }
    }
  }

  // Get all transactions
  async getAllTransactions(limit = 50, offset = 0, filters?: {
    type?: string
    status?: string
    search?: string
  }): Promise<{ data: AdminTransaction[] | null; error: string | null; count: number }> {
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      if (filters?.type) params.set('type', filters.type)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)

      const res = await fetch(`/api/admin/transactions?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch transactions')
      }

      return { data: json.data as AdminTransaction[], error: null, count: json.count as number }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        count: 0
      }
    }
  }

  // Get single transaction by ID
  async getTransactionById(transactionId: string): Promise<{ data: AdminTransaction | null; error: string | null }> {
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}`, { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch transaction')
      }

      return { data: json.data as AdminTransaction, error: null }
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch transaction'
      }
    }
  }

  async updateTransaction(transactionId: string, payload: { status: string; adminNote?: string }): Promise<{ data: AdminTransaction | null; error: string | null }> {
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to update transaction')
      }

      return { data: json.data as AdminTransaction, error: null }
    } catch (error) {
      console.error('Error updating transaction:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update transaction'
      }
    }
  }

  async deleteTransaction(transactionId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}`, {
        method: 'DELETE'
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete transaction')
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete transaction' }
    }
  }

  // Update user status (admin only)
  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('Users')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating user status:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user status' 
      }
    }
  }

  // Update NFT status (admin only via API)
  async updateNFTStatus(nftId: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; error: string | null }> {
    try {
      const res = await fetch(`/api/admin/nfts/${nftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update NFT status')
      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating NFT status:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update NFT status' 
      }
    }
  }

  // Get admin dashboard stats
  async getDashboardStats(): Promise<{ data: AdminDashboardStats | null; error: string | null }> {
    try {
      // Get total counts
      const [usersResult, nftsResult, transactionsResult] = await Promise.all([
        this.supabase.from('Users').select('id', { count: 'exact', head: true }),
        this.supabase.from('nfts').select('id', { count: 'exact', head: true }),
        this.supabase.from('transactions').select('id', { count: 'exact', head: true })
      ])

      // Get recent counts (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoISO = sevenDaysAgo.toISOString()

      const [recentUsersResult, recentNFTsResult, recentTransactionsResult] = await Promise.all([
        this.supabase.from('Users').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgoISO),
        this.supabase.from('nfts').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgoISO),
        this.supabase.from('transactions').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgoISO)
      ])

      // Calculate platform revenue (sum of platform fees from transactions)
      const { data: revenueData } = await this.supabase
        .from('transactions')
        .select('platform_fee')
        .eq('status', 'completed')

      const totalRevenue = revenueData?.reduce((sum, tx) => sum + (tx.platform_fee || 0), 0) || 0

      const stats: AdminDashboardStats = {
        totalUsers: usersResult.count || 0,
        totalNFTs: nftsResult.count || 0,
        totalTransactions: transactionsResult.count || 0,
        platformRevenue: `${totalRevenue.toFixed(4)} ETH`,
        recentUsers: recentUsersResult.count || 0,
        recentNFTs: recentNFTsResult.count || 0,
        recentTransactions: recentTransactionsResult.count || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' 
      }
    }
  }

  // Delete user (admin only - soft delete by setting status to banned)
  async deleteUser(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Soft delete by setting status to banned
      const { error } = await this.supabase
        .from('Users')
        .update({ status: 'banned', updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete user' 
      }
    }
  }

  // Delete NFT (admin only via API)
  async deleteNFT(nftId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const res = await fetch(`/api/admin/nfts/${nftId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete NFT')
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting NFT:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete NFT' 
      }
    }
  }

  // Get user's NFT count
  async getUserNFTCount(userId: string): Promise<{ data: number; error: string | null }> {
    try {
      const { count, error } = await this.supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)

      if (error) {
        if (error.message.includes('relation "nfts" does not exist') || 
            error.message.includes('relation "public.nfts" does not exist')) {
          return { data: 0, error: null }
        }
        throw error
      }
      return { data: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching user NFT count:', error)
      return { 
        data: 0, 
        error: null
      }
    }
  }

  // Get user's transactions
  async getUserTransactions(userId: string, limit = 10): Promise<{ data: AdminTransaction[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        if (error.message.includes('relation "transactions" does not exist') || 
            error.message.includes('relation "public.transactions" does not exist')) {
          return { data: [], error: null }
        }
        throw error
      }
      return { data: data as AdminTransaction[], error: null }
    } catch (error) {
      console.error('Error fetching user transactions:', error)
      return { 
        data: [], 
        error: null
      }
    }
  }
}

export const adminQueries = new AdminQueries()

