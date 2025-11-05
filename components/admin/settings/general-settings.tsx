"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'

interface GeneralSettingsProps {
  settings: any[]
  onSave: (updates: Array<{ key: string; value: string }>) => Promise<void>
}

export function GeneralSettings({ settings, onSave }: GeneralSettingsProps) {
  const [formData, setFormData] = useState({
    site_name: '',
    site_tagline: '',
    site_url: '',
    email: '',
    timezone: 'UTC',
    allowed_file_formats: '["jpg", "jpeg", "png", "gif", "webp", "svg", "mp4", "mov", "webm"]',
    maintenance_mode: false
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Initialize form data from settings
  useEffect(() => {
    const initialData: any = {}
    settings.forEach(setting => {
      if (setting.type === 'boolean') {
        initialData[setting.key] = setting.value === 'true'
      } else {
        initialData[setting.key] = setting.value || ''
      }
    })
    setFormData(initialData)
  }, [settings])

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleFileFormatsChange = (value: string) => {
    try {
      const formats = JSON.parse(value)
      if (Array.isArray(formats)) {
        setFormData(prev => ({
          ...prev,
          allowed_file_formats: value
        }))
      }
    } catch {
      // Invalid JSON, don't update
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate required fields
      if (!formData.site_name.trim()) {
        toast({
          title: "Validation Error",
          description: "Site name is required.",
          variant: "destructive",
        })
        return
      }
      
      if (!formData.site_url.trim()) {
        toast({
          title: "Validation Error", 
          description: "Site URL is required.",
          variant: "destructive",
        })
        return
      }
      
      if (!formData.email.trim()) {
        toast({
          title: "Validation Error", 
          description: "Contact email is required.",
          variant: "destructive",
        })
        return
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Validation Error", 
          description: "Please enter a valid email address.",
          variant: "destructive",
        })
        return
      }
      
      const updates = Object.entries(formData).map(([key, value]) => ({
        key,
        value: typeof value === 'boolean' ? value.toString() : value
      }))

      await onSave(updates)
      
      toast({
        title: "Settings saved",
        description: "General settings have been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving general settings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure basic site information and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="site_name">Site Name</Label>
            <Input
              id="site_name"
              value={formData.site_name}
              onChange={(e) => handleInputChange('site_name', e.target.value)}
              placeholder="Enter site name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_url">Site URL</Label>
            <Input
              id="site_url"
              type="url"
              value={formData.site_url}
              onChange={(e) => handleInputChange('site_url', e.target.value)}
              placeholder="https://yourdomain.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              This email will be used for all contact, support, legal, and privacy inquiries
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="site_tagline">Site Tagline</Label>
          <Textarea
            id="site_tagline"
            value={formData.site_tagline}
            onChange={(e) => handleInputChange('site_tagline', e.target.value)}
            placeholder="Enter site tagline or description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleInputChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="maintenance_mode"
                checked={formData.maintenance_mode}
                onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
              />
              <Label htmlFor="maintenance_mode" className="text-sm">
                {formData.maintenance_mode ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, the site will show a maintenance page to visitors
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="allowed_file_formats">Allowed File Formats</Label>
          <Textarea
            id="allowed_file_formats"
            value={formData.allowed_file_formats}
            onChange={(e) => handleFileFormatsChange(e.target.value)}
            placeholder='["jpg", "jpeg", "png", "gif", "webp", "svg", "mp4", "mov", "webm"]'
            rows={2}
          />
          <p className="text-xs text-gray-500">
            Enter as a JSON array of file extensions (without dots)
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !formData.site_name.trim() || !formData.site_url.trim() || !formData.email.trim()}>
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

