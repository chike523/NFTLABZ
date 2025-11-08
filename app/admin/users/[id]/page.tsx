"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { ArrowLeft, CheckCircle2, Ban, Trash2, LogIn, Loader2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminQueries } from "@/lib/queries/admin"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export default function UserDetailPage() {
  const params = useParams();
  const userIdParam = params?.id as string | string[] | undefined;
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)
  const [adjustmentMode, setAdjustmentMode] = useState<"credit" | "debit">("credit")
  const [adjustmentForm, setAdjustmentForm] = useState({
    amount: "",
    note: "",
    silent: false,
  })
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setError('User ID not found in route.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Fetch user data (includes wallets, NFT count, and transactions)
      const { data: userData, error: userError } = await adminQueries.getUserById(userId)
      if (userError || !userData) {
        setError(userError || 'User not found')
        return
      }
      setUser(userData)
    } catch (err) {
      setError('Failed to fetch user data')
      console.error('Error fetching user data:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const handleLoginAsUser = async () => {
    if (!user) return
    
    const confirmed = window.confirm(`Login as ${user.username || user.email}?\n\nYou will be logged in as this user. To return to admin, logout and login again at /admin/login.`)
    if (!confirmed) return

    try {
      setLoggingIn(true)
      
      console.log('🔐 Step 1: Getting login credentials for user:', user.id)
      
      // Get temporary credentials from API
      const response = await fetch(`/api/admin/users/${user.id}/login-as`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare login')
      }

      console.log('🔐 Step 2: Logging in with temporary credentials...')
      
      // Import Supabase client
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // Sign in as the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (signInError) {
        throw new Error('Failed to sign in as user: ' + signInError.message)
      }

      console.log('✅ Successfully logged in as user, redirecting...')
      
      // Redirect to user dashboard
      window.location.href = '/dashboard'

    } catch (error) {
      console.error('❌ Error logging in as user:', error)
      alert(error instanceof Error ? error.message : 'Failed to login as user')
      setLoggingIn(false)
    }
  }

  const openAdjustmentModal = (mode: "credit" | "debit") => {
    setAdjustmentMode(mode)
    setAdjustmentForm({
      amount: "",
      note: "",
      silent: false,
    })
    setIsAdjustmentModalOpen(true)
  }

  const handleModalOpenChange = (open: boolean) => {
    if (!open && adjustmentSubmitting) {
      return
    }
    setIsAdjustmentModalOpen(open)
  }

  const closeAdjustmentModal = () => {
    if (adjustmentSubmitting) return
    setIsAdjustmentModalOpen(false)
  }

  const parseTransactionMeta = (transaction: any): { label: string; note?: string | null } => {
    const label = transaction?.type || 'transaction'

    if (!transaction?.admin_note) {
      return { label }
    }

    try {
      const parsed = JSON.parse(transaction.admin_note)
      if (parsed && typeof parsed === 'object') {
        const note =
          typeof parsed.note === 'string' && parsed.note.trim() ? parsed.note.trim() : null
        return { label, note }
      }
    } catch (error) {
      console.warn('Failed to parse transaction admin_note metadata:', error)
    }

    if (typeof transaction.admin_note === 'string' && transaction.admin_note.trim()) {
      return { label, note: transaction.admin_note.trim() }
    }

    return { label }
  }

  const handleAdjustmentInputChange = (field: "amount" | "note") => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value
    setAdjustmentForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAdjustmentSilentToggle = (checked: boolean) => {
    setAdjustmentForm((prev) => ({
      ...prev,
      silent: checked,
    }))
  }

  const handleAdjustmentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user?.id) {
      toast({
        title: "User not loaded",
        description: "Please wait for the user data to finish loading.",
        variant: "destructive",
      })
      return
    }

    const amountValue = Number.parseFloat(adjustmentForm.amount)
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter an amount greater than 0.",
        variant: "destructive",
      })
      return
    }

    const noteValue = adjustmentForm.note.trim()

    const submitAdjustment = async () => {
      try {
        setAdjustmentSubmitting(true)

        const response = await fetch(`/api/admin/users/${user.id}/wallet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: adjustmentMode,
            amount: amountValue,
            note: noteValue || undefined,
            silent: adjustmentForm.silent,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to apply wallet adjustment.")
        }

        toast({
          title: adjustmentMode === "credit" ? "Wallet credited" : "Wallet debited",
          description: adjustmentMode === "credit"
            ? `${amountValue} ETH added to the user’s wallet.`
            : `${amountValue} ETH removed from the user’s wallet.`,
        })

        closeAdjustmentModal()
        await fetchUserData()
      } catch (err) {
        console.error("Wallet adjustment failed:", err)
        toast({
          title: "Adjustment failed",
          description: err instanceof Error ? err.message : "Unable to adjust the wallet. Please try again.",
          variant: "destructive",
        })
      } finally {
        setAdjustmentSubmitting(false)
      }
    }

    void submitAdjustment()
  }

  const handleSuspend = async () => {
    if (!user?.id) return

    const isSuspended = user.status === 'suspended'
    const confirmed = window.confirm(
      isSuspended
        ? 'Unsuspend this user and restore their access?'
        : 'Suspend this user? They will lose access until reactivated.'
    )
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: isSuspended ? 'active' : 'suspended' }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${isSuspended ? 'unsuspend' : 'suspend'} user.`)
      }

      toast({
        title: isSuspended ? 'User unsuspended' : 'User suspended',
        description: `${user.display_name || user.username || 'User'} has been ${
          isSuspended ? 're-activated' : 'suspended'
        }.`,
      })

      await fetchUserData()
    } catch (err) {
      console.error('Suspend/unsuspend user failed:', err)
      toast({
        title: isSuspended ? 'Unsuspend failed' : 'Suspend failed',
        description:
          err instanceof Error ? err.message : 'Unable to suspend user. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="Loading User..." />
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <span className="ml-2 text-gray-400">Loading user data...</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <AdminHeader title="User Not Found" />
        <div className="p-6">
          <p className="text-gray-400">{error || 'User not found.'}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <AdminHeader title="User Details" />
      
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Link href="/admin/users">
          <Button variant="ghost" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>

        {/* User Profile */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar_url} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-semibold text-white">{user.display_name || user.username}</h2>
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-gray-400">{user.email || 'N/A'}</p>
              <p className="text-sm text-gray-500 font-mono">
                {user.wallets && user.wallets.length > 0 
                  ? user.wallets[0].wallet_address 
                  : 'No wallet connected'
                }
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                onClick={() => openAdjustmentModal("credit")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Credit User
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-600/10"
                onClick={() => openAdjustmentModal("debit")}
              >
                <Minus className="h-4 w-4 mr-2" />
                Debit User
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                onClick={handleLoginAsUser}
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login as User
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10" onClick={handleSuspend}>
                <Ban className="h-4 w-4 mr-2" />
                {user.status === 'suspended' ? 'Unsuspend User' : 'Suspend User'}
              </Button>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">NFTs Owned</p>
              <p className="text-2xl font-bold text-white">{user.nftCount || 0}</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-white">-</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-white">-</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Join Date</p>
              <p className="text-lg font-semibold text-white">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.status === "active" ? "bg-green-500/10 text-green-400" :
              user.status === "suspended" ? "bg-yellow-500/10 text-yellow-400" :
              "bg-red-500/10 text-red-400"
            }`}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {user.transactions && user.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  (user.transactions || []).map((transaction: any) => {
                    const transactionMeta = parseTransactionMeta(transaction)
                    return (
                      <tr
                        key={transaction.id}
                        className="text-sm text-gray-300 border-b border-gray-700/50"
                      >
                        <td className="px-6 py-4 font-mono text-xs">{transaction.id}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 capitalize">
                              {transactionMeta.label}
                            </span>
                            {transactionMeta.note && (
                              <p className="text-[11px] text-gray-500">
                                {transactionMeta.note}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{transaction.amount_eth} ETH</td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              transaction.status === "completed"
                                ? "bg-green-500/10 text-green-400"
                                : transaction.status === "pending"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isAdjustmentModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentMode === "credit" ? "Credit User Wallet" : "Debit User Wallet"}
            </DialogTitle>
            <DialogDescription>
              {adjustmentMode === "credit"
                ? "Add funds to the user’s wallet. Visible adjustments can notify the user and appear in their transaction history."
                : "Remove funds from the user’s wallet. Ensure sufficient balance before debiting. Visible adjustments can notify the user and appear in their transaction history."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleAdjustmentSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adjustment-amount">Amount (ETH)</Label>
                <Input
                  id="adjustment-amount"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={adjustmentForm.amount}
                  onChange={handleAdjustmentInputChange("amount")}
                  placeholder="0.0000"
                  required
                  disabled={adjustmentSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-note">Note (optional)</Label>
                <Textarea
                  id="transaction-note"
                  value={adjustmentForm.note}
                  onChange={handleAdjustmentInputChange("note")}
                  placeholder="Provide additional context for this adjustment"
                  rows={3}
                  disabled={adjustmentSubmitting}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Silent adjustment</p>
                  <p className="text-xs text-muted-foreground">
                    When enabled, the user will not receive notifications and no transaction record will be created.
                  </p>
                </div>
                <Switch
                  checked={adjustmentForm.silent}
                  onCheckedChange={handleAdjustmentSilentToggle}
                  disabled={adjustmentSubmitting}
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeAdjustmentModal} disabled={adjustmentSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjustmentSubmitting}>
                {adjustmentSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  adjustmentMode === "credit" ? "Credit Wallet" : "Debit Wallet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
