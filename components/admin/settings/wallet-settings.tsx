"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { Loader2, Plus, Edit, Trash2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface WalletSettingsProps {
  wallets: DepositWallet[]
  onRefresh: () => Promise<void>
}

const NETWORK_OPTIONS = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'bsc', label: 'BSC' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'base', label: 'Base' },
]

type FormState = {
  name: string
  address: string
  network: string
  description: string
  isActive: boolean
}

type FormKey = keyof FormState

const INITIAL_FORM_STATE: FormState = {
  name: '',
  address: '',
  network: NETWORK_OPTIONS[0].value,
  description: '',
  isActive: true
}

export function WalletSettings({ wallets, onRefresh }: WalletSettingsProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState<DepositWallet | null>(null)
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE)
  const [formErrors, setFormErrors] = useState<Partial<Record<FormKey, string>>>({})
  const [saving, setSaving] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const closeForm = () => {
    setFormData(INITIAL_FORM_STATE)
    setFormErrors({})
    setEditingWallet(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    setFormData(INITIAL_FORM_STATE)
    setFormErrors({})
    setEditingWallet(null)
    setShowForm(true)
  }

  const handleInputChange = <Key extends FormKey>(key: Key, value: FormState[Key]) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))

    setFormErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleEdit = (wallet: DepositWallet) => {
    setFormData({
      name: wallet.name,
      address: wallet.address,
      network: wallet.network,
      description: wallet.description || '',
      isActive: wallet.is_active
    })
    setFormErrors({})
    setEditingWallet(wallet)
    setShowForm(true)
  }

  const validateForm = () => {
    const errors: Partial<Record<FormKey, string>> = {}

    if (!formData.name.trim()) {
      errors.name = 'Wallet name is required'
    }

    const address = formData.address.trim()
    if (!address) {
      errors.address = 'Wallet address is required'
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      errors.address = 'Enter a valid 42-character address'
    }

    const hasNetwork = NETWORK_OPTIONS.some(option => option.value === formData.network)
    if (!hasNetwork) {
      errors.network = 'Select a valid network'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      
      const url = editingWallet 
        ? `/api/admin/wallets/${editingWallet.id}`
        : '/api/admin/wallets'
      
      const method = editingWallet ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        name: formData.name.trim(),
        address: formData.address.trim(),
        description: formData.description.trim()
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          createdBy: user?.id || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save wallet')
      }

      toast({
        title: editingWallet ? "Wallet updated" : "Wallet added",
        description: `Deposit wallet ${editingWallet ? 'updated' : 'added'} successfully.`,
      })

      closeForm()
      await onRefresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save wallet',
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (walletId: string) => {
    if (!confirm('Are you sure you want to delete this wallet?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/wallets/${walletId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete wallet')
      }

      toast({
        title: "Wallet deleted",
        description: "Deposit wallet has been deleted successfully.",
      })

      await onRefresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete wallet',
        variant: "destructive",
      })
    }
  }

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      })
    }
  }

  const getNetworkColor = (network: string) => {
    const colors: Record<string, string> = {
      ethereum: 'bg-blue-500',
      polygon: 'bg-purple-500',
      bsc: 'bg-yellow-500',
      arbitrum: 'bg-cyan-500',
      optimism: 'bg-red-500',
      base: 'bg-indigo-500'
    }
    return colors[network] || 'bg-gray-500'
  }

  return (
    <Card className="border-gray-800 bg-gray-950/50 backdrop-blur">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Deposit Wallets</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Manage wallet addresses used for receiving customer deposits
            </CardDescription>
          </div>
          <Button
            onClick={openCreateForm}
            variant="secondary"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Wallet
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/70 p-6 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-foreground">
                {editingWallet ? 'Edit Wallet' : 'Add New Wallet'}
              </h4>
              <Button variant="ghost" size="sm" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Wallet details appear in the deposit flow. Be sure to add addresses that you control.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wallet_name" className="text-sm font-medium text-muted-foreground">Wallet Name</Label>
                <Input
                  id="wallet_name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Main Ethereum Wallet"
                  className={cn(
                    'bg-gray-950/80 border-gray-800 text-foreground placeholder:text-muted-foreground',
                    formErrors.name && 'border-red-500/70 focus-visible:ring-red-500/60'
                  )}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-400">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet_network" className="text-sm font-medium text-muted-foreground">Network</Label>
                <Select
                  value={formData.network}
                  onValueChange={(value) => handleInputChange('network', value)}
                >
                  <SelectTrigger
                    id="wallet_network"
                    className={cn(
                      'bg-gray-950/80 border-gray-800 text-foreground',
                      formErrors.network && 'border-red-500/70 focus-visible:ring-red-500/60'
                    )}
                  >
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border border-gray-800 text-foreground">
                    {NETWORK_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.network && (
                  <p className="text-xs text-red-400">{formErrors.network}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="wallet_address" className="text-sm font-medium text-muted-foreground">Wallet Address</Label>
                <Input
                  id="wallet_address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="0x..."
                  className={cn(
                    'bg-gray-950/80 border-gray-800 text-foreground placeholder:text-muted-foreground',
                    formErrors.address && 'border-red-500/70 focus-visible:ring-red-500/60'
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a 42-character checksum address. We’ll validate the format before saving.
                </p>
                {formErrors.address && (
                  <p className="text-xs text-red-400">{formErrors.address}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="wallet_description" className="text-sm font-medium text-muted-foreground">Description (Optional)</Label>
                <Textarea
                  id="wallet_description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add context such as cold storage or treasury wallet."
                  rows={3}
                  className="bg-gray-950/80 border-gray-800 text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Visible only to administrators for internal notes.</p>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 px-4 py-3">
                  <div>
                    <Label htmlFor="wallet_active" className="text-sm font-medium text-muted-foreground">Active</Label>
                    <p className="text-xs text-muted-foreground">Inactive wallets are hidden from the deposit options list.</p>
                  </div>
                  <Switch
                    id="wallet_active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeForm} className="border-gray-700 text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingWallet ? 'Update Wallet' : 'Add Wallet'
                )}
              </Button>
            </div>
          </div>
        )}

        {wallets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No deposit wallets configured</p>
            <p className="text-sm">Add your first wallet to start receiving deposits</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs rounded border border-gray-800 bg-gray-950/70 px-2 py-1 font-mono text-muted-foreground">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAddress(wallet.address)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedAddress === wallet.address ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-white", getNetworkColor(wallet.network))}>
                      {wallet.network}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={wallet.is_active ? "default" : "secondary"}>
                      {wallet.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(wallet.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(wallet)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(wallet.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

