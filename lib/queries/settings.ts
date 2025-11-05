import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SiteSetting {
  id: string
  key: string
  value: string | null
  category: 'general' | 'branding' | 'email' | 'wallet' | 'seo'
  type: 'text' | 'textarea' | 'boolean' | 'number' | 'url' | 'email' | 'image' | 'json'
  label: string
  description: string | null
  is_public: boolean
  updated_at: string
  updated_by: string | null
}

export interface DepositWallet {
  id: string
  name: string
  address: string
  network: 'ethereum' | 'polygon' | 'bsc' | 'arbitrum' | 'optimism' | 'base'
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface SettingsByCategory {
  general: SiteSetting[]
  branding: SiteSetting[]
  email: SiteSetting[]
  seo: SiteSetting[]
}

// Client-side settings queries (for public settings)
export class SettingsQueries {
  private supabase = createClient()

  // Get public settings (can be accessed from frontend)
  async getPublicSettings(): Promise<{ data: Record<string, any> | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('site_settings')
        .select('key, value, type')
        .eq('is_public', true)

      if (error) throw error

      // Convert to key-value object with proper type casting
      const settings: Record<string, any> = {}
      data?.forEach(setting => {
        let value = setting.value
        if (setting.type === 'boolean') {
          value = value === 'true'
        } else if (setting.type === 'number') {
          value = parseFloat(value || '0')
        } else if (setting.type === 'json') {
          try {
            value = JSON.parse(value || '{}')
          } catch {
            value = {}
          }
        }
        settings[setting.key] = value
      })

      return { data: settings, error: null }
    } catch (error) {
      console.error('Error fetching public settings:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch settings' 
      }
    }
  }

  // Get a specific public setting
  async getPublicSetting(key: string): Promise<{ data: any; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('site_settings')
        .select('value, type')
        .eq('key', key)
        .eq('is_public', true)
        .single()

      if (error) throw error

      let value = data.value
      if (data.type === 'boolean') {
        value = value === 'true'
      } else if (data.type === 'number') {
        value = parseFloat(value || '0')
      } else if (data.type === 'json') {
        try {
          value = JSON.parse(value || '{}')
        } catch {
          value = {}
        }
      }

      return { data: value, error: null }
    } catch (error) {
      console.error('Error fetching public setting:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch setting' 
      }
    }
  }
}

// Admin settings queries (server-side with service role)
export class AdminSettingsQueries {
  private supabase = createAdminClient()

  // Get all settings
  async getAllSettings(): Promise<{ data: SiteSetting[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('site_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true })

      if (error) throw error
      return { data: data as SiteSetting[], error: null }
    } catch (error) {
      console.error('Error fetching all settings:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch settings' 
      }
    }
  }

  // Get settings by category
  async getSettingsByCategory(category: string): Promise<{ data: SiteSetting[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('site_settings')
        .select('*')
        .eq('category', category)
        .order('key', { ascending: true })

      if (error) throw error
      return { data: data as SiteSetting[], error: null }
    } catch (error) {
      console.error('Error fetching settings by category:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch settings' 
      }
    }
  }

  // Update multiple settings
  async updateSettings(updates: Array<{ key: string; value: string }>, updatedBy: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const promises = updates.map(update => 
        this.supabase
          .from('site_settings')
          .update({ 
            value: update.value,
            updated_by: updatedBy,
            updated_at: new Date().toISOString()
          })
          .eq('key', update.key)
      )

      const results = await Promise.all(promises)
      
      // Check if any update failed
      const hasError = results.some(result => result.error)
      if (hasError) {
        throw new Error('Some settings failed to update')
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating settings:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update settings' 
      }
    }
  }

  // Get all deposit wallets
  async getAllWallets(): Promise<{ data: DepositWallet[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('deposit_wallets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as DepositWallet[], error: null }
    } catch (error) {
      console.error('Error fetching deposit wallets:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch wallets' 
      }
    }
  }

  // Create deposit wallet
  async createWallet(wallet: Omit<DepositWallet, 'id' | 'created_at' | 'updated_at' | 'created_by'>, createdBy: string): Promise<{ data: DepositWallet | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('deposit_wallets')
        .insert({
          ...wallet,
          created_by: createdBy
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as DepositWallet, error: null }
    } catch (error) {
      console.error('Error creating deposit wallet:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create wallet' 
      }
    }
  }

  // Update deposit wallet
  async updateWallet(id: string, updates: Partial<Omit<DepositWallet, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('deposit_wallets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating deposit wallet:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update wallet' 
      }
    }
  }

  // Delete deposit wallet
  async deleteWallet(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('deposit_wallets')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting deposit wallet:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete wallet' 
      }
    }
  }
}

// Export instances
export const settingsQueries = new SettingsQueries()
export const adminSettingsQueries = new AdminSettingsQueries()

