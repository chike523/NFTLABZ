import { createClient } from '@/lib/supabase/client'

// Types for category data
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  icon: string | null
  nft_count: number
  status: 'enabled' | 'disabled'
  display_order: number
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export interface CreateCategoryData {
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  display_order?: number
  seo_title?: string
  seo_description?: string
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  description?: string
  image?: string
  icon?: string
  status?: 'enabled' | 'disabled'
  display_order?: number
  seo_title?: string
  seo_description?: string
}

// Client-side category queries
export class CategoryQueries {
  private supabase = createClient()

  // Get all enabled categories
  async getEnabledCategories(): Promise<{ data: Category[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('status', 'enabled')
        .order('display_order', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching enabled categories:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch categories' }
    }
  }

  // Get all categories (admin)
  async getAllCategories(): Promise<{ data: Category[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching all categories:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch categories' }
    }
  }

  // Get category by slug
  async getCategoryBySlug(slug: string): Promise<{ data: Category | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'enabled')
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching category by slug:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch category' }
    }
  }

  // Get category by ID
  async getCategoryById(id: string): Promise<{ data: Category | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching category by ID:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch category' }
    }
  }

  // Create category (admin)
  async createCategory(categoryData: CreateCategoryData): Promise<{ data: Category | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating category:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create category' }
    }
  }

  // Update category (admin)
  async updateCategory(id: string, updateData: UpdateCategoryData): Promise<{ data: Category | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating category:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update category' }
    }
  }

  // Delete category (admin)
  async deleteCategory(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete category' }
    }
  }

  // Check if slug is available
  async isSlugAvailable(slug: string, excludeId?: string): Promise<{ available: boolean; error: string | null }> {
    try {
      let query = this.supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query.single()

      if (error && error.code === 'PGRST116') {
        // No rows found - slug is available
        return { available: true, error: null }
      }

      if (error) throw error

      // Slug exists
      return { available: false, error: null }
    } catch (error) {
      console.error('Error checking slug availability:', error)
      return { available: false, error: error instanceof Error ? error.message : 'Failed to check slug' }
    }
  }

  // Get category statistics
  async getCategoryStats(): Promise<{ 
    total_categories: number; 
    enabled_categories: number; 
    total_nfts: number;
    error: string | null 
  }> {
    try {
      const { count: totalCategories } = await this.supabase
        .from('categories')
        .select('*', { count: 'exact' })

      const { count: enabledCategories } = await this.supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .eq('status', 'enabled')

      const { data: nftCounts } = await this.supabase
        .from('categories')
        .select('nft_count')

      const totalNfts = nftCounts?.reduce((sum, cat) => sum + (cat.nft_count || 0), 0) || 0

      return {
        total_categories: totalCategories || 0,
        enabled_categories: enabledCategories || 0,
        total_nfts: totalNfts,
        error: null
      }
    } catch (error) {
      console.error('Error fetching category stats:', error)
      return {
        total_categories: 0,
        enabled_categories: 0,
        total_nfts: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch category stats'
      }
    }
  }
}

// Collections queries
export interface Collection {
  id: string
  owner_id: string
  name: string
  description: string | null
  banner_image: string | null
  logo_image: string | null
  slug: string
  floor_price: number
  total_volume: number
  nft_count: number
  created_at: string
  updated_at: string
  // Joined data
  owner?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CreateCollectionData {
  name: string
  description?: string
  banner_image?: string
  logo_image?: string
  slug: string
}

export interface UpdateCollectionData {
  name?: string
  description?: string
  banner_image?: string
  logo_image?: string
  slug?: string
}

export class CollectionQueries {
  private supabase = createClient()

  // Get all collections
  async getAllCollections(limit = 20, offset = 0): Promise<{ data: Collection[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('collections')
        .select(`
          *,
          owner:Users!collections_owner_id_fkey(id, username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching collections:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch collections' }
    }
  }

  // Get collection by slug
  async getCollectionBySlug(slug: string): Promise<{ data: Collection | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('collections')
        .select(`
          *,
          owner:Users!collections_owner_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('slug', slug)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching collection by slug:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch collection' }
    }
  }

  // Get collection by ID
  async getCollectionById(id: string): Promise<{ data: Collection | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('collections')
        .select(`
          *,
          owner:Users!collections_owner_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching collection by ID:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch collection' }
    }
  }

  // Get user's collections
  async getUserCollections(userId: string, limit = 20, offset = 0): Promise<{ data: Collection[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('collections')
        .select(`
          *,
          owner:Users!collections_owner_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user collections:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch user collections' }
    }
  }

  // Create collection
  async createCollection(userId: string, collectionData: CreateCollectionData): Promise<{ data: Collection | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('collections')
        .insert({
          owner_id: userId,
          ...collectionData
        })
        .select(`
          *,
          owner:Users!collections_owner_id_fkey(id, username, display_name, avatar_url)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating collection:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create collection' }
    }
  }

  // Update collection
  async updateCollection(id: string, userId: string, updateData: UpdateCollectionData): Promise<{ data: Collection | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('collections')
        .update(updateData)
        .eq('id', id)
        .eq('owner_id', userId)
        .select(`
          *,
          owner:Users!collections_owner_id_fkey(id, username, display_name, avatar_url)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating collection:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update collection' }
    }
  }

  // Delete collection
  async deleteCollection(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('owner_id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting collection:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete collection' }
    }
  }

  // Check if collection slug is available
  async isCollectionSlugAvailable(slug: string, excludeId?: string): Promise<{ available: boolean; error: string | null }> {
    try {
      let query = this.supabase
        .from('collections')
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query.single()

      if (error && error.code === 'PGRST116') {
        // No rows found - slug is available
        return { available: true, error: null }
      }

      if (error) throw error

      // Slug exists
      return { available: false, error: null }
    } catch (error) {
      console.error('Error checking collection slug availability:', error)
      return { available: false, error: error instanceof Error ? error.message : 'Failed to check slug' }
    }
  }

  // Get collection statistics
  async getCollectionStats(): Promise<{ 
    total_collections: number; 
    total_nfts: number; 
    total_volume: number;
    error: string | null 
  }> {
    try {
      const { count: totalCollections } = await this.supabase
        .from('collections')
        .select('*', { count: 'exact' })

      const { data: collectionData } = await this.supabase
        .from('collections')
        .select('nft_count, total_volume')

      const totalNfts = collectionData?.reduce((sum, col) => sum + (col.nft_count || 0), 0) || 0
      const totalVolume = collectionData?.reduce((sum, col) => sum + (col.total_volume || 0), 0) || 0

      return {
        total_collections: totalCollections || 0,
        total_nfts: totalNfts,
        total_volume: totalVolume,
        error: null
      }
    } catch (error) {
      console.error('Error fetching collection stats:', error)
      return {
        total_collections: 0,
        total_nfts: 0,
        total_volume: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch collection stats'
      }
    }
  }
}

// Export singleton instances
export const categoryQueries = new CategoryQueries()
export const collectionQueries = new CollectionQueries()
