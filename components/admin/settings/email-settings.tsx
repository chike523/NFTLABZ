"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Mail, TestTube } from 'lucide-react'

interface EmailSettingsProps {
  settings: any[]
  onSave: (updates: Array<{ key: string; value: string }>) => Promise<void>
}

export function EmailSettings({ settings, onSave }: EmailSettingsProps) {
  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: '',
    email_templates: '{}'
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
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

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate required fields
      if (formData.smtp_host && !formData.smtp_username) {
        toast({
          title: "Validation Error",
          description: "SMTP username is required when SMTP host is provided.",
          variant: "destructive",
        })
        return
      }
      
      if (formData.smtp_host && !formData.smtp_password) {
        toast({
          title: "Validation Error",
          description: "SMTP password is required when SMTP host is provided.",
          variant: "destructive",
        })
        return
      }
      
      if (formData.smtp_from_email && !formData.smtp_from_email.includes('@')) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address.",
          variant: "destructive",
        })
        return
      }
      
      const updates = Object.entries(formData).map(([key, value]) => ({
        key,
        value: value || ''
      }))

      await onSave(updates)
      
      toast({
        title: "Settings saved",
        description: "Email settings have been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving email settings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address to test",
        variant: "destructive",
      })
      return
    }

    try {
      setTesting(true)
      
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toEmail: testEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        const detail = typeof data.details === 'string' ? data.details : ''
        const message = data.error || 'Test failed'
        throw new Error(detail ? `${message}: ${detail}` : message)
      }

      toast({
        title: "Test email sent",
        description: data.message || `Test email sent successfully to ${testEmail}`,
      })
    } catch (error) {
      toast({
        title: "Test failed",
        description: error instanceof Error ? error.message : 'Failed to send test email',
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Configuration</CardTitle>
        <CardDescription>
          Configure SMTP settings for sending emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input
              id="smtp_host"
              value={formData.smtp_host}
              onChange={(e) => handleInputChange('smtp_host', e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input
              id="smtp_port"
              type="number"
              value={formData.smtp_port}
              onChange={(e) => handleInputChange('smtp_port', e.target.value)}
              placeholder="587"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="smtp_username">SMTP Username</Label>
            <Input
              id="smtp_username"
              type="email"
              value={formData.smtp_username}
              onChange={(e) => handleInputChange('smtp_username', e.target.value)}
              placeholder="your-email@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_password">SMTP Password</Label>
            <Input
              id="smtp_password"
              type="password"
              value={formData.smtp_password}
              onChange={(e) => handleInputChange('smtp_password', e.target.value)}
              placeholder="Your app password"
            />
            <p className="text-xs text-gray-500">
              For Gmail, use an App Password instead of your regular password
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="smtp_from_email">From Email</Label>
            <Input
              id="smtp_from_email"
              type="email"
              value={formData.smtp_from_email}
              onChange={(e) => handleInputChange('smtp_from_email', e.target.value)}
              placeholder="noreply@yourdomain.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_from_name">From Name</Label>
            <Input
              id="smtp_from_name"
              value={formData.smtp_from_name}
              onChange={(e) => handleInputChange('smtp_from_name', e.target.value)}
              placeholder="Your Site Name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_templates">Email Templates (JSON)</Label>
          <Textarea
            id="email_templates"
            value={formData.email_templates}
            onChange={(e) => handleInputChange('email_templates', e.target.value)}
            placeholder='{"welcome": "Welcome to our platform!", "reset": "Reset your password"}'
            rows={4}
          />
          <p className="text-xs text-gray-500">
            Custom email templates in JSON format
          </p>
        </div>

        {/* Test Email Section */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium mb-4">Test Email Configuration</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Current sender: {formData.smtp_from_name || '—'} {formData.smtp_from_email ? `<${formData.smtp_from_email}>` : ''}
          </p>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter email address to test"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleTestEmail}
              disabled={testing || !testEmail}
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Send Test
                </>
              )}
            </Button>
          </div>
        </div>

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

