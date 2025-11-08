import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'

// Types for NFT data
export interface NFT {
  id: string
  owner_id: string
  creator_id: string
  title: string
  description: string | null
  image_url: string
  category_id: string | null
  collection_id: string | null
  price_eth: number | null
  floor_price_eth: number | null
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'sold' | 'unlisted'
  is_featured: boolean
  view_count: number
  like_count: number
  token_id: string | null
  contract_address: string | null
  metadata_url: string | null
  royalty_percentage: number
  created_at: string
  updated_at: string
  // Joined data
  category?: {
    id: string
    name: string
    slug: string
    icon: string
  }
  collection?: {
    id: string
    name: string
    slug: string
  }
  owner?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  creator?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CreateNFTData {
  title: string
  description?: string
  image_url: string
  category_id?: string
  collection_id?: string
  price_eth?: number
  royalty_percentage?: number
  metadata_url?: string
}

export interface UpdateNFTData {
  title?: string
  description?: string
  price_eth?: number
  status?: NFT['status']
  is_featured?: boolean
}

// Client-side NFT queries
export class NFTQueries {
  private supabase = createClient()

  // Helper function to attach user data to NFTs
  private async attachUserDataToNFTs(nfts: any[]): Promise<any[]> {
    if (!nfts || nfts.length === 0) return nfts

    // Collect all unique user IDs
    const userIds = new Set<string>()
    nfts.forEach(nft => {
      if (nft.owner_id) userIds.add(nft.owner_id)
      if (nft.creator_id) userIds.add(nft.creator_id)
    })

    if (userIds.size === 0) return nfts

    // Fetch all users at once
    const { data: users } = await this.supabase
      .from('Users')
      .select('id, username, display_name, avatar_url')
      .in('id', Array.from(userIds))

    if (!users) return nfts

    // Attach user data to each NFT
    return nfts.map(nft => ({
      ...nft,
      owner: users.find(u => u.id === nft.owner_id) || null,
      creator: users.find(u => u.id === nft.creator_id) || null
    }))
  }

  // Get all approved NFTs (for marketplace)
  async getApprovedNFTs(limit = 20, offset = 0): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      // Attach user data
      const nftsWithUsers = data ? await this.attachUserDataToNFTs(data) : null
      return { data: nftsWithUsers, error: null }
    } catch (error) {
      console.error('Error fetching approved NFTs:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFTs' }
    }
  }

  // Get featured NFTs (for homepage)
  async getFeaturedNFTs(limit = 6): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      // Attach user data
      const nftsWithUsers = data ? await this.attachUserDataToNFTs(data) : null
      return { data: nftsWithUsers, error: null }
    } catch (error) {
      console.error('Error fetching featured NFTs:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch featured NFTs' }
    }
  }

  // Get NFTs by category
  async getNFTsByCategory(categorySlug: string, limit = 20, offset = 0): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories!inner(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('status', 'approved')
        .eq('categories.slug', categorySlug)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching NFTs by category:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFTs by category' }
    }
  }

  // Get single NFT by ID
  async getNFTById(id: string): Promise<{ data: NFT | null; error: string | null }> {
    try {
      // Query NFT with only the relationships that have FK constraints
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      // Manually fetch owner and creator data if needed
      if (data && (data.owner_id || data.creator_id)) {
        const userIds = [data.owner_id, data.creator_id].filter(Boolean)
        const { data: users } = await this.supabase
          .from('Users')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds)
        
        if (users) {
          data.owner = users.find(u => u.id === data.owner_id) || null
          data.creator = users.find(u => u.id === data.creator_id) || null
        }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching NFT by ID:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFT' }
    }
  }

  // Get user's owned NFTs
  async getUserNFTs(userId: string, limit = 20, offset = 0): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching user NFTs:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch user NFTs' }
    }
  }

  // Get user's created NFTs
  async getUserCreatedNFTs(userId: string, limit = 20, offset = 0): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching user created NFTs:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch created NFTs' }
    }
  }

  // Get user's NFTs filtered by status
  async getUserNFTsByStatus(userId: string, status?: NFT['status'], limit = 50, offset = 0): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      let query = this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching user NFTs by status:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFTs by status' }
    }
  }

  // Create new NFT
  async createNFT(
    nftData: CreateNFTData,
  ): Promise<{
    data: NFT | null
    error: string | null
    minting_fee?: number
    wallet?: { balance_before: number; balance_after: number }
  }> {
    try {
      const response = await fetch('/api/dashboard/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nftData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to mint NFT')
      }

      return {
        data: result.data as NFT,
        error: null,
        minting_fee: result.minting_fee ?? 0,
        wallet: result.wallet ?? undefined,
      }
    } catch (error) {
      console.error('Error creating NFT:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create NFT',
      }
    }
  }

  // Update NFT
  async updateNFT(nftId: string, userId: string, updateData: UpdateNFTData): Promise<{ data: NFT | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .update(updateData)
        .eq('id', nftId)
        .eq('creator_id', userId) // Only creator can update
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .single()

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error updating NFT:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update NFT' }
    }
  }

  // Delete NFT
  async deleteNFT(nftId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('nfts')
        .delete()
        .eq('id', nftId)
        .eq('owner_id', userId) // Only owner can delete

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting NFT:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete NFT' }
    }
  }

  // Increment view count
  async incrementViewCount(nftId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('nfts')
        .update({ view_count: this.supabase.raw('view_count + 1') })
        .eq('id', nftId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error incrementing view count:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update view count' }
    }
  }

  // Search NFTs
  async searchNFTs(query: string, limit = 20, offset = 0): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('status', 'approved')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error searching NFTs:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to search NFTs' }
    }
  }
}

// Server-side NFT queries
export class ServerNFTQueries {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  // Get all approved NFTs (server-side)
  async getApprovedNFTs(limit = 20, offset = 0): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching approved NFTs:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFTs' }
    }
  }

  // Get featured NFTs (server-side)
  async getFeaturedNFTs(limit = 6): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching featured NFTs:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch featured NFTs' }
    }
  }

  // Get NFTs by category (server-side)
  async getNFTsByCategory(categorySlug: string, limit = 20, offset = 0): Promise<{ data: NFT[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('status', 'approved')
        .eq('category.slug', categorySlug)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching NFTs by category:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFTs by category' }
    }
  }

  // Get single NFT by ID (server-side)
  async getNFTById(id: string): Promise<{ data: NFT | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          collection:collections(id, name, slug)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      // Attach user data for arrays
      const result = Array.isArray(data) ? await this.attachUserDataToNFTs(data) : data
      return { data: result, error: null }
    } catch (error) {
      console.error('Error fetching NFT by ID:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch NFT' }
    }
  }
}

// Export singleton instances
export const nftQueries = new NFTQueries()
