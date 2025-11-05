import { createClient } from '@/lib/supabase/client'

// Types for notification data
export interface Notification {
  id: string
  user_id: string
  type: 'sale' | 'purchase' | 'offer' | 'follow' | 'like' | 'comment' | 'system'
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface CreateNotificationData {
  user_id: string
  type: Notification['type']
  title: string
  message: string
  link?: string
}

// Client-side notification queries
export class NotificationQueries {
  private supabase = createClient()

  // Get user's notifications
  async getUserNotifications(userId: string, limit = 20, offset = 0): Promise<{ data: Notification[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user notifications:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch notifications' }
    }
  }

  // Get unread notifications
  async getUnreadNotifications(userId: string, limit = 10): Promise<{ data: Notification[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching unread notifications:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch unread notifications' }
    }
  }

  // Get notification count
  async getNotificationCount(userId: string): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return { count: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching notification count:', error)
      return { count: 0, error: error instanceof Error ? error.message : 'Failed to fetch notification count' }
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark notification as read' }
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark all notifications as read' }
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete notification' }
    }
  }

  // Delete all notifications
  async deleteAllNotifications(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete all notifications' }
    }
  }

  // Create notification (system/admin use)
  async createNotification(notificationData: CreateNotificationData): Promise<{ data: Notification | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create notification' }
    }
  }

  // Get notifications by type
  async getNotificationsByType(userId: string, type: Notification['type'], limit = 20, offset = 0): Promise<{ data: Notification[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching notifications by type:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch notifications by type' }
    }
  }

  // Get recent notifications (last 24 hours)
  async getRecentNotifications(userId: string, hours = 24, limit = 10): Promise<{ data: Notification[] | null; error: string | null }> {
    try {
      const hoursAgo = new Date()
      hoursAgo.setHours(hoursAgo.getHours() - hours)

      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', hoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching recent notifications:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch recent notifications' }
    }
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    by_type: Record<string, number>;
    error: string | null;
  }> {
    try {
      // Get total count
      const { count: total } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Get unread count
      const { count: unread } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false)

      // Get count by type
      const { data: typeData } = await this.supabase
        .from('notifications')
        .select('type')
        .eq('user_id', userId)

      const byType = typeData?.reduce((acc, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      return {
        total: total || 0,
        unread: unread || 0,
        by_type: byType,
        error: null
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error)
      return {
        total: 0,
        unread: 0,
        by_type: {},
        error: error instanceof Error ? error.message : 'Failed to fetch notification stats'
      }
    }
  }
}

// Notification helper functions
export class NotificationHelpers {
  private supabase = createClient()

  // Create NFT sale notification
  async createNFTSaleNotification(nftId: string, buyerId: string, sellerId: string, price: number): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get NFT details
      const { data: nft, error: nftError } = await this.supabase
        .from('nfts')
        .select('title, owner:Users!nfts_owner_id_fkey(username)')
        .eq('id', nftId)
        .single()

      if (nftError) throw nftError

      // Notify seller
      await this.supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          type: 'sale',
          title: 'NFT Sold!',
          message: `Your NFT "${nft.title}" was sold for ${price} ETH`,
          link: `/nft/${nftId}`
        })

      // Notify buyer
      await this.supabase
        .from('notifications')
        .insert({
          user_id: buyerId,
          type: 'purchase',
          title: 'NFT Purchased!',
          message: `You purchased "${nft.title}" for ${price} ETH`,
          link: `/nft/${nftId}`
        })

      return { success: true, error: null }
    } catch (error) {
      console.error('Error creating NFT sale notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create sale notification' }
    }
  }

  // Create follow notification
  async createFollowNotification(followerId: string, followingId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get follower details
      const { data: follower, error: followerError } = await this.supabase
        .from('Users')
        .select('username, display_name')
        .eq('id', followerId)
        .single()

      if (followerError) throw followerError

      const displayName = follower.display_name || follower.username

      await this.supabase
        .from('notifications')
        .insert({
          user_id: followingId,
          type: 'follow',
          title: 'New Follower',
          message: `${displayName} started following you`,
          link: `/user/${followerId}`
        })

      return { success: true, error: null }
    } catch (error) {
      console.error('Error creating follow notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create follow notification' }
    }
  }

  // Create offer notification
  async createOfferNotification(nftId: string, offererId: string, ownerId: string, amount: number): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get NFT and offerer details
      const { data: nft, error: nftError } = await this.supabase
        .from('nfts')
        .select('title')
        .eq('id', nftId)
        .single()

      if (nftError) throw nftError

      const { data: offerer, error: offererError } = await this.supabase
        .from('Users')
        .select('username, display_name')
        .eq('id', offererId)
        .single()

      if (offererError) throw offererError

      const displayName = offerer.display_name || offerer.username

      await this.supabase
        .from('notifications')
        .insert({
          user_id: ownerId,
          type: 'offer',
          title: 'New Offer',
          message: `${displayName} made an offer of ${amount} ETH on "${nft.title}"`,
          link: `/nft/${nftId}`
        })

      return { success: true, error: null }
    } catch (error) {
      console.error('Error creating offer notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create offer notification' }
    }
  }

  // Create like notification
  async createLikeNotification(nftId: string, likerId: string, ownerId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Don't notify if user likes their own NFT
      if (likerId === ownerId) {
        return { success: true, error: null }
      }

      // Get NFT and liker details
      const { data: nft, error: nftError } = await this.supabase
        .from('nfts')
        .select('title')
        .eq('id', nftId)
        .single()

      if (nftError) throw nftError

      const { data: liker, error: likerError } = await this.supabase
        .from('Users')
        .select('username, display_name')
        .eq('id', likerId)
        .single()

      if (likerError) throw likerError

      const displayName = liker.display_name || liker.username

      await this.supabase
        .from('notifications')
        .insert({
          user_id: ownerId,
          type: 'like',
          title: 'NFT Liked',
          message: `${displayName} liked your NFT "${nft.title}"`,
          link: `/nft/${nftId}`
        })

      return { success: true, error: null }
    } catch (error) {
      console.error('Error creating like notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create like notification' }
    }
  }
}

// Export singleton instances
export const notificationQueries = new NotificationQueries()
export const notificationHelpers = new NotificationHelpers()
