import { createClient } from '@/lib/supabase/client'

// Types for user data
export interface UserProfile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  status: 'active' | 'suspended' | 'banned'
  created_at: string
  updated_at: string
}

export interface UserStats {
  user_id: string
  nfts_owned: number
  nfts_created: number
  total_spent_eth: number
  total_earned_eth: number
  total_volume_eth: number
  followers_count: number
  following_count: number
  favorites_count: number
  updated_at: string
}

export interface UpdateProfileData {
  display_name?: string
  bio?: string
  avatar_url?: string
  cover_image_url?: string
}

export interface UserWithStats extends UserProfile {
  stats: UserStats
}

// Client-side user queries
export class UserQueries {
  private supabase = createClient()

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('Users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch user profile' }
    }
  }

  // Get user profile by username
  async getUserProfileByUsername(username: string): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('Users')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user profile by username:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch user profile' }
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updateData: UpdateProfileData): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('Users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating user profile:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update user profile' }
    }
  }

  // Get user stats
  async getUserStats(userId: string): Promise<{ data: UserStats | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch user stats' }
    }
  }

  // Get user with stats
  async getUserWithStats(userId: string): Promise<{ data: UserWithStats | null; error: string | null }> {
    try {
      const { data: profile, error: profileError } = await this.getUserProfile(userId)
      if (profileError) throw profileError

      const { data: stats, error: statsError } = await this.getUserStats(userId)
      if (statsError) throw statsError

      return {
        data: {
          ...profile!,
          stats: stats!
        },
        error: null
      }
    } catch (error) {
      console.error('Error fetching user with stats:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch user with stats' }
    }
  }

  // Search users
  async searchUsers(query: string, limit = 20, offset = 0): Promise<{ data: UserProfile[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('Users')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error searching users:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to search users' }
    }
  }

  // Get top users by volume
  async getTopUsers(limit = 10): Promise<{ data: UserWithStats[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_stats')
        .select(`
          *,
          user:Users!user_stats_user_id_fkey(*)
        `)
        .order('total_volume_eth', { ascending: false })
        .limit(limit)

      if (error) throw error

      const usersWithStats = data?.map(item => ({
        ...item.user,
        stats: {
          user_id: item.user_id,
          nfts_owned: item.nfts_owned,
          nfts_created: item.nfts_created,
          total_spent_eth: item.total_spent_eth,
          total_earned_eth: item.total_earned_eth,
          total_volume_eth: item.total_volume_eth,
          followers_count: item.followers_count,
          following_count: item.following_count,
          favorites_count: item.favorites_count,
          updated_at: item.updated_at
        }
      })) || []

      return { data: usersWithStats, error: null }
    } catch (error) {
      console.error('Error fetching top users:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch top users' }
    }
  }

  // Check if username is available
  async isUsernameAvailable(username: string): Promise<{ available: boolean; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('Users')
        .select('id')
        .eq('username', username)
        .single()

      if (error && error.code === 'PGRST116') {
        // No rows found - username is available
        return { available: true, error: null }
      }

      if (error) throw error

      // Username exists
      return { available: false, error: null }
    } catch (error) {
      console.error('Error checking username availability:', error)
      return { available: false, error: error instanceof Error ? error.message : 'Failed to check username' }
    }
  }

  // Get user's wallet balance
  async getUserWalletBalance(userId: string): Promise<{ 
    balance_eth: number; 
    error: string | null 
  }> {
    try {
      console.log('[getUserWalletBalance] Fetching balance for user:', userId)
      
      let { data, error } = await this.supabase
        .from('wallets')
        .select('balance_eth, balance, id, is_primary')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle()

      console.log('[getUserWalletBalance] Initial query result:', { data, error: error?.message })

      if (error && error.message?.includes('balance_eth')) {
        console.log('[getUserWalletBalance] balance_eth column missing, using fallback...')
        const fallback = await this.supabase
          .from('wallets')
          .select('balance, id')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .maybeSingle()

        data = fallback.data
        error = fallback.error
        console.log('[getUserWalletBalance] Fallback query result:', { data, error: error?.message })
      }

      if (error) {
        console.error('[getUserWalletBalance] Query error:', error)
        throw error
      }

      if (!data) {
        console.warn('[getUserWalletBalance] No wallet found for user:', userId)
        return {
          balance_eth: 0,
          error: null
        }
      }

      const balanceEth = (data as any)?.balance_eth ?? (data as any)?.balance ?? 0

      console.log('[getUserWalletBalance] Returning balance:', { balance_eth: balanceEth })

      return {
        balance_eth: balanceEth,
        error: null
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      return {
        balance_eth: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch wallet balance'
      }
    }
  }

  // Get user's recent activity summary
  async getUserActivitySummary(userId: string): Promise<{
    recent_nfts: number;
    recent_transactions: number;
    recent_favorites: number;
    error: string | null;
  }> {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Get recent NFTs created
      const { count: nftCount } = await this.supabase
        .from('nfts')
        .select('*', { count: 'exact' })
        .eq('creator_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())

      // Get recent transactions
      const { count: transactionCount } = await this.supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())

      // Get recent favorites
      const { count: favoriteCount } = await this.supabase
        .from('favorites')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())

      return {
        recent_nfts: nftCount || 0,
        recent_transactions: transactionCount || 0,
        recent_favorites: favoriteCount || 0,
        error: null
      }
    } catch (error) {
      console.error('Error fetching user activity summary:', error)
      return {
        recent_nfts: 0,
        recent_transactions: 0,
        recent_favorites: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch activity summary'
      }
    }
  }
}

// Following/Favorites queries
export class SocialQueries {
  private supabase = createClient()

  // Follow a user
  async followUser(followerId: string, followingId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (followerId === followingId) {
        return { success: false, error: 'Cannot follow yourself' }
      }

      const { error } = await this.supabase
        .from('following')
        .insert({
          follower_id: followerId,
          following_id: followingId
        })

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error following user:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to follow user' }
    }
  }

  // Unfollow a user
  async unfollowUser(followerId: string, followingId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('following')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error unfollowing user:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to unfollow user' }
    }
  }

  // Check if user is following another user
  async isFollowing(followerId: string, followingId: string): Promise<{ following: boolean; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('following')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single()

      if (error && error.code === 'PGRST116') {
        return { following: false, error: null }
      }

      if (error) throw error
      return { following: !!data, error: null }
    } catch (error) {
      console.error('Error checking follow status:', error)
      return { following: false, error: error instanceof Error ? error.message : 'Failed to check follow status' }
    }
  }

  // Get user's followers
  async getUserFollowers(userId: string, limit = 20, offset = 0): Promise<{ data: UserProfile[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('following')
        .select(`
          follower:Users!following_follower_id_fkey(*)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      const followers = data?.map(item => item.follower).filter(Boolean) || []
      return { data: followers, error: null }
    } catch (error) {
      console.error('Error fetching followers:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch followers' }
    }
  }

  // Get users that user is following
  async getUserFollowing(userId: string, limit = 20, offset = 0): Promise<{ data: UserProfile[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('following')
        .select(`
          following:Users!following_following_id_fkey(*)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      const following = data?.map(item => item.following).filter(Boolean) || []
      return { data: following, error: null }
    } catch (error) {
      console.error('Error fetching following:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch following' }
    }
  }

  // Favorite an NFT
  async favoriteNFT(userId: string, nftId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('favorites')
        .insert({
          user_id: userId,
          nft_id: nftId
        })

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error favoriting NFT:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to favorite NFT' }
    }
  }

  // Unfavorite an NFT
  async unfavoriteNFT(userId: string, nftId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('nft_id', nftId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error unfavoriting NFT:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to unfavorite NFT' }
    }
  }

  // Check if NFT is favorited
  async isNFTFavorited(userId: string, nftId: string): Promise<{ favorited: boolean; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('nft_id', nftId)
        .single()

      if (error && error.code === 'PGRST116') {
        return { favorited: false, error: null }
      }

      if (error) throw error
      return { favorited: !!data, error: null }
    } catch (error) {
      console.error('Error checking favorite status:', error)
      return { favorited: false, error: error instanceof Error ? error.message : 'Failed to check favorite status' }
    }
  }

  // Get user's favorite NFTs
  async getUserFavorites(userId: string, limit = 20, offset = 0): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('favorites')
        .select(`
          nft:nfts(
            *,
            category:categories(id, name, slug, icon),
            collection:collections(id, name, slug),
            owner:Users!nfts_owner_id_fkey(id, username, display_name, avatar_url),
            creator:Users!nfts_creator_id_fkey(id, username, display_name, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      const favorites = data?.map(item => item.nft).filter(Boolean) || []
      return { data: favorites, error: null }
    } catch (error) {
      console.error('Error fetching user favorites:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch favorites' }
    }
  }
}

// Export singleton instances
export const userQueries = new UserQueries()
export const socialQueries = new SocialQueries()
