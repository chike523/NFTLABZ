"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from './image-upload'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'

interface BrandingSettingsProps {
  settings: any[]
  onSave: (updates: Array<{ key: string; value: string }>) => Promise<void>
}

export function BrandingSettings({ settings, onSave }: BrandingSettingsProps) {
  const [formData, setFormData] = useState({
    logo_light: '',
    logo_dark: '',
    favicon: ''
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Initialize form data from settings
  useEffect(() => {
    const initialData: any = {}
    settings.forEach(setting => {
      initialData[setting.key] = setting.value || ''
    })
    setFormData(initialData)
  }, [settings])

  const handleImageChange = (key: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: url
    }))
  }

  const handleImageRemove = (key: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: ''
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const updates = Object.entries(formData).map(([key, value]) => ({
        key,
        value: value || ''
      }))

      await onSave(updates)
      
      toast({
        title: "Settings saved",
        description: "Branding settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo & Branding</CardTitle>
        <CardDescription>
          Upload and manage your site logos and favicon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <Label>Light Mode Logo</Label>
              <p className="text-sm text-gray-500 mb-2">
                Logo displayed on light backgrounds (recommended: 200x60px)
              </p>
              <ImageUpload
                value={formData.logo_light}
                onChange={(url) => handleImageChange('logo_light', url)}
                onRemove={() => handleImageRemove('logo_light')}
                placeholder="Upload light mode logo"
                maxSize={2}
                folder="settings"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Dark Mode Logo</Label>
              <p className="text-sm text-gray-500 mb-2">
                Logo displayed on dark backgrounds (recommended: 200x60px)
              </p>
              <ImageUpload
                value={formData.logo_dark}
                onChange={(url) => handleImageChange('logo_dark', url)}
                onRemove={() => handleImageRemove('logo_dark')}
                placeholder="Upload dark mode logo"
                maxSize={2}
                folder="settings"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Favicon</Label>
            <p className="text-sm text-gray-500 mb-2">
              Small icon displayed in browser tabs (recommended: 32x32px or 16x16px)
            </p>
            <ImageUpload
              value={formData.favicon}
              onChange={(url) => handleImageChange('favicon', url)}
              onRemove={() => handleImageRemove('favicon')}
              placeholder="Upload favicon"
              maxSize={1}
              accept="image/png,image/x-icon,image/vnd.microsoft.icon"
              folder="settings"
            />
          </div>
        </div>

        {/* Preview Section */}
        {(formData.logo_light || formData.logo_dark || formData.favicon) && (
          <div className="space-y-4">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="space-y-4">
                {formData.favicon && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Favicon:</span>
                    <img src={formData.favicon} alt="Favicon" className="w-4 h-4" />
                  </div>
                )}
                
                {formData.logo_light && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Light Logo:</span>
                    <img src={formData.logo_light} alt="Light logo" className="h-8" />
                  </div>
                )}
                
                {formData.logo_dark && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Dark Logo:</span>
                    <img src={formData.logo_dark} alt="Dark logo" className="h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

