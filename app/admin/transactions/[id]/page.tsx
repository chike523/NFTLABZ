"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Trash2, CheckCircle2, XCircle } from "lucide-react"
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Button } from "@/components/ui/button"
import { adminQueries, AdminTransaction } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"
import { formatCurrency, formatEth } from "@/lib/utils/currency"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const transactionId = params.id as string

  const [transaction, setTransaction] = useState<AdminTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refreshTransaction = async () => {
    try {
      setLoading(true)
      const { data, error } = await adminQueries.getTransactionById(transactionId)
      if (error) {
        throw new Error(error)
      }
      setTransaction(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load transaction', err)
      setTransaction(null)
      setError(err instanceof Error ? err.message : 'Failed to load transaction')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshTransaction()
  }, [transactionId])

  const handleStatusChange = async (status: 'completed' | 'failed', adminNote?: string) => {
    if (!transaction) return
    try {
      setSubmitting(true)
      const { data, error } = await adminQueries.updateTransaction(transaction.id, {
        status,
        adminNote
      })
      if (error) {
        throw new Error(error)
      }
      setTransaction(data)
      
      const actionType = transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'
      toast({
        title: status === 'completed' ? `${actionType} approved` : `${actionType} rejected`,
        description: status === 'completed'
          ? transaction.type === 'deposit' 
            ? 'The user balance has been credited.'
            : 'The user balance has been debited and withdrawal processed.'
          : `The ${transaction.type} has been marked as failed.`
      })
      setRejectDialogOpen(false)
      setRejectNote('')
    } catch (err) {
      console.error('Failed to update transaction', err)
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Unable to update transaction',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction) return
    try {
      setSubmitting(true)
      const { success, error } = await adminQueries.deleteTransaction(transaction.id)
      if (!success) {
        throw new Error(error || 'Unable to delete transaction')
      }
      toast({ title: 'Transaction deleted', description: 'The transaction record has been removed.' })
      router.push('/admin/transactions')
    } catch (err) {
      console.error('Failed to delete transaction', err)
      toast({
        title: 'Deletion failed',
        description: err instanceof Error ? err.message : 'Unable to delete transaction',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isDeposit = transaction?.type === 'deposit'
  const isWithdrawal = transaction?.type === 'withdrawal'
  const isPendingDeposit = isDeposit && transaction?.status === 'pending'
  const isPendingWithdrawal = isWithdrawal && transaction?.status === 'pending'
  const isPending = isPendingDeposit || isPendingWithdrawal
  const symbol = (transaction?.token_symbol || 'ETH').toUpperCase()
  const amountDisplay = transaction ? `${formatEth(transaction.amount_eth)} ${symbol}` : '—'
  const usdDisplay = transaction ? formatCurrency(transaction.amount_usd, 2) : '0.00'

  return (
    <AdminLayout>
      <AdminHeader title="Transaction Details" />

      <div className="p-6 space-y-6">
        <Link href="/admin/transactions">
          <Button variant="ghost" className="text-gray-400 hover:text-white" disabled={submitting}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Button>
        </Link>

        {loading ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400">Loading transaction...</p>
          </div>
        ) : error || !transaction ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-red-400">{error || 'Transaction not found.'}</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Transaction {transaction.id}</h2>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium capitalize',
                    transaction.status === 'completed' && 'bg-green-500/10 text-green-400',
                    transaction.status === 'pending' && 'bg-yellow-500/10 text-yellow-400',
                    transaction.status === 'failed' && 'bg-red-500/10 text-red-400',
                    transaction.status === 'cancelled' && 'bg-gray-500/10 text-gray-300'
                  )}>
                    {transaction.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Created</p>
                  <p className="text-lg font-semibold text-white">{new Date(transaction.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Type</p>
                  <p className="text-lg font-semibold text-white capitalize">{transaction.type}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Amount</p>
                  <p className="text-lg font-semibold text-white">{amountDisplay}</p>
                  <p className="text-xs text-gray-400">${usdDisplay} USD</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Destination</p>
                  <p className="text-sm text-white break-all">{transaction.to_address || '—'}</p>
                </div>
              </div>

              {transaction.admin_note && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Admin Note</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{transaction.admin_note}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {isPending && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('completed')}
                      className="bg-emerald-600 hover:bg-emerald-500"
                      disabled={submitting}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve {isDeposit ? 'Deposit' : 'Withdrawal'}
                    </Button>

                    <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/10" disabled={submitting}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject {isDeposit ? 'Deposit' : 'Withdrawal'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject {isDeposit ? 'deposit' : 'withdrawal'}</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          Optionally provide a reason for rejecting this {isDeposit ? 'deposit' : 'withdrawal'}. The note will be visible to other admins.
                        </p>
                        <Textarea
                          value={rejectNote}
                          onChange={(event) => setRejectNote(event.target.value)}
                          placeholder="Reason for rejection (optional)"
                          className="mt-3"
                        />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={submitting}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleStatusChange('failed', rejectNote.trim() || undefined)}
                            disabled={submitting}
                          >
                            Reject {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/10" disabled={submitting}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Transaction
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The transaction record will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-500">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {transaction.user && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">User</h3>
                  <div className="space-y-1">
                    <p className="text-white font-medium">{transaction.user.display_name || transaction.user.username}</p>
                    <p className="text-sm text-gray-400">@{transaction.user.username}</p>
                    {transaction.user.email && <p className="text-sm text-gray-500">{transaction.user.email}</p>}
                    <Link href={`/admin/users/${transaction.user.id}`} className="text-xs text-blue-400 hover:text-blue-300">
                      View user profile
                    </Link>
                  </div>
                </div>
              )}

              {transaction.nft && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Associated NFT</h3>
                  <Link href={`/admin/nfts/${transaction.nft.id}`} className="text-blue-400 hover:text-blue-300">
                    {transaction.nft.title}
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
