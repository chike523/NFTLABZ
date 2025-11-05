"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface SupportChatSettingsProps {
  settings: any[]
  onSave: (updates: Array<{ key: string; value: string }>) => Promise<void>
}

export function SupportChatSettings({ settings, onSave }: SupportChatSettingsProps) {
  const [chatCode, setChatCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  // Load current settings
  useEffect(() => {
    const chatSetting = settings.find(s => s.key === 'support_chat_code')
    if (chatSetting) {
      setChatCode(chatSetting.value || '')
    }
  }, [settings])

  const handleChatCodeChange = (value: string) => {
    setChatCode(value)
    const chatSetting = settings.find(s => s.key === 'support_chat_code')
    setHasChanges(value !== (chatSetting?.value || ''))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const updates = [
        { key: 'support_chat_code', value: chatCode.trim() }
      ]

      await onSave(updates)

      toast({
        title: 'Settings saved',
        description: 'Support chat widget settings have been updated successfully.'
      })
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const isScriptValid = chatCode.trim().length > 0 && chatCode.includes('<script')
  const isActive = chatCode.trim().length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Chat Widget
          </CardTitle>
          <CardDescription>
            Add a live chat widget to your site by pasting the embed code from your chat provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {isActive ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Chat widget is active</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">No chat widget configured</span>
              </>
            )}
          </div>

          {/* Chat Code Input */}
          <div className="space-y-2">
            <Label htmlFor="chat_code">Chat Widget Script Code</Label>
            <Textarea
              id="chat_code"
              value={chatCode}
              onChange={(e) => handleChatCodeChange(e.target.value)}
              placeholder="Paste your chat widget script code here (e.g., from Tawk.to, Intercom, Crisp)..."
              className="font-mono text-xs min-h-[200px]"
              disabled={saving}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{chatCode.length} characters</span>
              {chatCode.trim() && !isScriptValid && (
                <span className="text-yellow-500">⚠ Code should contain &lt;script&gt; tags</span>
              )}
            </div>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> Only paste code from trusted chat providers. The script will be executed on your website.
              The chat widget will appear on all public pages and user dashboard (not admin pages).
            </AlertDescription>
          </Alert>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Example Scripts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Popular Chat Providers</CardTitle>
          <CardDescription>
            Examples of supported chat widget providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Tawk.to</p>
                <p className="text-xs text-muted-foreground">Free live chat software</p>
              </div>
              <a 
                href="https://www.tawk.to/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs"
              >
                Get Script →
              </a>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Intercom</p>
                <p className="text-xs text-muted-foreground">Customer messaging platform</p>
              </div>
              <a 
                href="https://www.intercom.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs"
              >
                Get Script →
              </a>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Crisp</p>
                <p className="text-xs text-muted-foreground">Multichannel messaging</p>
              </div>
              <a 
                href="https://crisp.chat/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs"
              >
                Get Script →
              </a>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">LiveChat</p>
                <p className="text-xs text-muted-foreground">Customer service software</p>
              </div>
              <a 
                href="https://www.livechat.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs"
              >
                Get Script →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

