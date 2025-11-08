import { createClient } from '@/lib/supabase/client'

// Types for transaction data
export interface Transaction {
  id: string
  user_id: string
  nft_id: string | null
  type: 'mint' | 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'transfer'
  amount_eth: number
  amount_usd: number | null
  from_address: string | null
  to_address: string | null
  tx_hash: string | null
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  gas_fee: number
  platform_fee: number
  admin_note?: string | null
  created_at: string
  updated_at: string
  // Joined data
  nft?: {
    id: string
    title: string
    image_url: string
    price_eth: number | null
  }
}

export interface NFTActivity {
  id: string
  nft_id: string
  from_user_id: string | null
  to_user_id: string | null
  activity_type: 'minted' | 'listed' | 'sold' | 'transferred' | 'bid_placed' | 'bid_accepted' | 'unlisted'
  price_eth: number | null
  transaction_id: string | null
  created_at: string
  // Joined data
  nft?: {
    id: string
    title: string
    image_url: string
  }
  from_user?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  to_user?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CreateTransactionData {
  nft_id?: string
  type: Transaction['type']
  amount_eth: number
  amount_usd?: number
  from_address?: string
  to_address?: string
  tx_hash?: string
  gas_fee?: number
  platform_fee?: number
}

// Client-side transaction queries
export class TransactionQueries {
  private supabase = createClient()

  // Get user's transactions
  async getUserTransactions(userId: string, limit = 20, offset = 0): Promise<{ data: Transaction[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          nft:nfts(id, title, image_url, price_eth)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user transactions:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch transactions' }
    }
  }

  // Get transactions by type
  async getTransactionsByType(userId: string, type: Transaction['type'], limit = 20, offset = 0): Promise<{ data: Transaction[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          nft:nfts(id, title, image_url, price_eth)
        `)
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching transactions by type:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch transactions' }
    }
  }

  // Get NFT transactions
  async getNFTTransactions(nftId: string, limit = 20, offset = 0): Promise<{ data: Transaction[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          nft:nfts(id, title, image_url, price_eth)
        `)
        .eq('nft_id', nftId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching NFT transactions:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFT transactions' }
    }
  }

  // Get single transaction
  async getTransactionById(id: string): Promise<{ data: Transaction | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          nft:nfts(id, title, image_url, price_eth)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching transaction by ID:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch transaction' }
    }
  }

  // Create new transaction
  async createTransaction(userId: string, transactionData: CreateTransactionData): Promise<{ data: Transaction | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert({
          user_id: userId,
          ...transactionData
        })
        .select(`
          *,
          nft:nfts(id, title, image_url, price_eth)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating transaction:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create transaction' }
    }
  }

  // Update transaction status
  async updateTransactionStatus(id: string, userId: string, status: Transaction['status']): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .update({ status })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating transaction status:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update transaction' }
    }
  }

  // Get user's transaction summary
  async getUserTransactionSummary(userId: string): Promise<{ 
    total_spent: number; 
    total_earned: number; 
    total_volume: number; 
    transaction_count: number;
    error: string | null 
  }> {
    try {
      const { data, error } = await this.supabase
        .from('user_stats')
        .select('total_spent_eth, total_earned_eth, total_volume_eth')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If user_stats table doesn't exist yet, return default values
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return {
            total_spent: 0,
            total_earned: 0,
            total_volume: 0,
            transaction_count: 0,
            error: null
          }
        }
        throw error
      }

      const { data: countData, error: countError } = await this.supabase
        .from('transactions')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      if (countError) {
        // If transactions table doesn't exist yet, just use 0 for count
        return {
          total_spent: data?.total_spent_eth || 0,
          total_earned: data?.total_earned_eth || 0,
          total_volume: data?.total_volume_eth || 0,
          transaction_count: 0,
          error: null
        }
      }

      return {
        total_spent: data?.total_spent_eth || 0,
        total_earned: data?.total_earned_eth || 0,
        total_volume: data?.total_volume_eth || 0,
        transaction_count: countData?.length || 0,
        error: null
      }
    } catch (error) {
      console.error('Error fetching transaction summary:', error)
      return {
        total_spent: 0,
        total_earned: 0,
        total_volume: 0,
        transaction_count: 0,
        error: null // Don't show error to user, just use default values
      }
    }
  }

  // Get recent transactions (last 7 days)
  async getRecentTransactions(userId: string, days = 7): Promise<{ data: Transaction[] | null; error: string | null }> {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - days)

      const { data, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          nft:nfts(id, title, image_url, price_eth)
        `)
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch recent transactions' }
    }
  }
}

// NFT Activity queries
export class NFTActivityQueries {
  private supabase = createClient()

  // Get NFT activities
  async getNFTActivities(nftId: string, limit = 20, offset = 0): Promise<{ data: NFTActivity[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nft_activities')
        .select(`
          *,
          nft:nfts(id, title, image_url),
          from_user:Users!nft_activities_from_user_id_fkey(id, username, display_name, avatar_url),
          to_user:Users!nft_activities_to_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('nft_id', nftId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching NFT activities:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFT activities' }
    }
  }

  // Get user's NFT activities
  async getUserNFTActivities(userId: string, limit = 20, offset = 0): Promise<{ data: NFTActivity[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nft_activities')
        .select(`
          *,
          nft:nfts(id, title, image_url),
          from_user:Users!nft_activities_from_user_id_fkey(id, username, display_name, avatar_url),
          to_user:Users!nft_activities_to_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user NFT activities:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch user NFT activities' }
    }
  }

  // Get recent activities (last 24 hours)
  async getRecentActivities(limit = 10): Promise<{ data: NFTActivity[] | null; error: string | null }> {
    try {
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const { data, error } = await this.supabase
        .from('nft_activities')
        .select(`
          *,
          nft:nfts(id, title, image_url),
          from_user:Users!nft_activities_from_user_id_fkey(id, username, display_name, avatar_url),
          to_user:Users!nft_activities_to_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching recent activities:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch recent activities' }
    }
  }
}

// Export singleton instances
export const transactionQueries = new TransactionQueries()
export const nftActivityQueries = new NFTActivityQueries()
