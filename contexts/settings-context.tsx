"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

interface SettingsContextType {
  settings: Record<string, any> | null
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
  getSetting: (key: string) => any
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use API route instead of direct database access
      const response = await fetch('/api/admin/settings?public=true')
      const data = await response.json()
      
      if (!response.ok) {
        // If settings table doesn't exist, use default values
        if (response.status === 500 && data.error?.includes('relation "site_settings" does not exist')) {
          console.warn('Settings table does not exist yet. Using default values.')
          setSettings({
            site_name: 'Artistrytonal',
            site_tagline: 'Discover and trade unique digital art',
            email: 'contact@artistrytonal.com',
            maintenance_mode: false,
            meta_title: 'NFT Marketplace - Digital Art Platform',
            meta_description: 'Discover, create, and trade unique digital art on our NFT marketplace',
            meta_keywords: 'nft, digital art, blockchain, ethereum, marketplace, collectibles'
          })
          return
        }
        throw new Error(data.error || 'Failed to fetch settings')
      }
      
      // Convert settings array to key-value object
      const settingsObj: Record<string, any> = {}
      data.data?.forEach((setting: any) => {
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
        settingsObj[setting.key] = value
      })
      
      setSettings(settingsObj)
    } catch (err) {
      console.error('Error loading settings:', err)
      // Use default values as fallback
      setSettings({
        site_name: 'Artistrytonal',
        site_tagline: 'Discover and trade unique digital art',
        email: 'contact@artistrytonal.com',
        maintenance_mode: false,
        meta_title: 'NFT Marketplace - Digital Art Platform',
        meta_description: 'Discover, create, and trade unique digital art on our NFT marketplace',
        meta_keywords: 'nft, digital art, blockchain, ethereum, marketplace, collectibles'
      })
    } finally {
      setLoading(false)
    }
  }

  const getSetting = (key: string) => {
    return settings?.[key] ?? null
  }

  useEffect(() => {
    refreshSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      error,
      refreshSettings,
      getSetting
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

