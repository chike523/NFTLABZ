"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from './image-upload'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'

interface SEOSettingsProps {
  settings: any[]
  onSave: (updates: Array<{ key: string; value: string }>) => Promise<void>
}

export function SEOSettings({ settings, onSave }: SEOSettingsProps) {
  const [formData, setFormData] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    social_preview_image: ''
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

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleImageChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      social_preview_image: url
    }))
  }

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      social_preview_image: ''
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
        description: "SEO settings have been updated successfully.",
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
        <CardTitle>SEO & Meta Settings</CardTitle>
        <CardDescription>
          Configure search engine optimization and social media previews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => handleInputChange('meta_title', e.target.value)}
            placeholder="Your Site Name - Brief Description"
            maxLength={60}
          />
          <p className="text-xs text-gray-500">
            {formData.meta_title.length}/60 characters (recommended: 50-60)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description">Meta Description</Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => handleInputChange('meta_description', e.target.value)}
            placeholder="A compelling description of your NFT marketplace that will appear in search results"
            rows={3}
            maxLength={160}
          />
          <p className="text-xs text-gray-500">
            {formData.meta_description.length}/160 characters (recommended: 150-160)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_keywords">Meta Keywords</Label>
          <Input
            id="meta_keywords"
            value={formData.meta_keywords}
            onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
            placeholder="nft, digital art, blockchain, ethereum, marketplace, collectibles"
          />
          <p className="text-xs text-gray-500">
            Comma-separated keywords relevant to your site
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Social Preview Image</Label>
            <p className="text-sm text-gray-500 mb-2">
              Image shown when your site is shared on social media (recommended: 1200x630px)
            </p>
            <ImageUpload
              value={formData.social_preview_image}
              onChange={handleImageChange}
              onRemove={handleImageRemove}
              placeholder="Upload social preview image"
              maxSize={5}
              folder="settings"
            />
          </div>
        </div>

        {/* Preview Section */}
        {(formData.meta_title || formData.meta_description || formData.social_preview_image) && (
          <div className="space-y-4">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="space-y-3">
                {/* Social Media Preview */}
                <div className="border rounded bg-white dark:bg-gray-900 p-3 max-w-md">
                  {formData.social_preview_image && (
                    <img 
                      src={formData.social_preview_image} 
                      alt="Social preview" 
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                    {formData.meta_title || 'Meta Title'}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formData.meta_description || 'Meta description will appear here'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    yourdomain.com
                  </p>
                </div>

                {/* Search Engine Preview */}
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Engine Result:</h4>
                  <div className="text-sm">
                    <div className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      {formData.meta_title || 'Your Site Title'}
                    </div>
                    <div className="text-green-600 dark:text-green-400 text-xs">
                      https://yourdomain.com
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">
                      {formData.meta_description || 'Your meta description will appear here in search results...'}
                    </div>
                  </div>
                </div>
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

