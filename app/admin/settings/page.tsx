"use client"

import React, { useState, useEffect } from 'react'
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "@/components/admin/settings/general-settings"
import { BrandingSettings } from "@/components/admin/settings/branding-settings"
import { EmailSettings } from "@/components/admin/settings/email-settings"
import { WalletSettings } from "@/components/admin/settings/wallet-settings"
import { SEOSettings } from "@/components/admin/settings/seo-settings"
import { SupportChatSettings } from "@/components/admin/settings/support-chat-settings"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useSettings } from "@/contexts/settings-context"
import { Loader2 } from "lucide-react"

interface SiteSetting {
  id: string
  key: string
  value: string | null
  category: string
  type: string
  label: string
  description: string | null
  is_public: boolean
  updated_at: string
  updated_by: string | null
}

interface DepositWallet {
  id: string
  name: string
  address: string
  network: string
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [wallets, setWallets] = useState<DepositWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const { refreshSettings } = useSettings()

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings')
      }
      
      setSettings(data.data || [])
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    }
  }

  const fetchWallets = async () => {
    try {
      const response = await fetch('/api/admin/wallets')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallets')
      }
      
      setWallets(data.data || [])
    } catch (error) {
      console.error('Error fetching wallets:', error)
      toast({
        title: "Error",
        description: "Failed to load wallets",
        variant: "destructive",
      })
    }
  }

  const handleSaveSettings = async (updates: Array<{ key: string; value: string }>) => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates,
          updatedBy: user?.id || null // Use actual user ID or null
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      // Refresh settings after save
      await fetchSettings()
      // Also refresh the global settings context
      await refreshSettings()
    } catch (error) {
      throw error // Re-throw to let individual components handle the error
    } finally {
      setSaving(false)
    }
  }

  const handleRefreshWallets = async () => {
    await fetchWallets()
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSettings(), fetchWallets()])
      setLoading(false)
    }
    
    loadData()
  }, [])

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category)
  }

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="Platform Settings" />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-400">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <AdminHeader title="Platform Settings" />
      
      <div className="p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="chat">Support Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettings 
              settings={getSettingsByCategory('general')} 
              onSave={handleSaveSettings}
            />
          </TabsContent>

          <TabsContent value="branding">
            <BrandingSettings 
              settings={getSettingsByCategory('branding')} 
              onSave={handleSaveSettings}
            />
          </TabsContent>

          <TabsContent value="email">
            <EmailSettings 
              settings={getSettingsByCategory('email')} 
              onSave={handleSaveSettings}
            />
          </TabsContent>

          <TabsContent value="wallets">
            <WalletSettings 
              wallets={wallets} 
              onRefresh={handleRefreshWallets}
            />
          </TabsContent>

          <TabsContent value="seo">
            <SEOSettings 
              settings={getSettingsByCategory('seo')} 
              onSave={handleSaveSettings}
            />
          </TabsContent>

          <TabsContent value="chat">
            <SupportChatSettings 
              settings={settings} 
              onSave={handleSaveSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
