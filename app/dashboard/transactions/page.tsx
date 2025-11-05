"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import TransactionTable from "@/components/dashboard/transaction-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TransactionSkeleton } from "@/components/skeletons/transaction-skeleton"
import { Filter, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { transactionQueries } from "@/lib/queries"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatEth } from "@/lib/utils/currency"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

export default function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const pagination = usePagination({
    items: transactions,
    itemsPerPage: 10,
  })

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)
        
        // Fetch more transactions for pagination
        const { data, error: fetchError } = await transactionQueries.getUserTransactions(user.id, 1000, 0)
        
        if (fetchError) {
          setError(fetchError)
          return
        }

        setTransactions(data || [])
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user?.id])

  // Mark page as read on mount
  useEffect(() => {
    const markPageRead = async () => {
      try {
        await fetch('/api/dashboard/mark-page-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_name: 'transactions' })
        })
      } catch (error) {
        console.error('Failed to mark page as read:', error)
      }
    }

    markPageRead()
  }, [])

  useEffect(() => {
    const newDeposit = searchParams.get('newDeposit')
    const newWithdrawal = searchParams.get('newWithdrawal')
    
    if (newDeposit === '1') {
      const amount = searchParams.get('amount')
      const symbol = searchParams.get('symbol') || 'ETH'

      const amountDisplay = amount ? `${formatEth(parseFloat(amount))} ${symbol.toUpperCase()}` : `${symbol.toUpperCase()}`

      toast({
        title: 'Pending deposit created',
        description: `Your ${amountDisplay} deposit is pending. Track confirmations here.`
      })
    }
    
    if (newWithdrawal === '1') {
      const amount = searchParams.get('amount')
      const symbol = searchParams.get('symbol') || 'ETH'

      const amountDisplay = amount ? `${formatEth(parseFloat(amount))} ${symbol.toUpperCase()}` : `${symbol.toUpperCase()}`

      toast({
        title: 'Withdrawal request submitted',
        description: `Your ${amountDisplay} withdrawal is pending admin approval.`
      })
    }
    
    router.replace('/dashboard/transactions', { scroll: false })
  }, [searchParams, toast, router])

  if (loading) {
    return (
      <DashboardLayout>
        <TransactionSkeleton rows={10} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-2">View your transaction history</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter by Type
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter by Status
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Transaction Table */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <p className="text-destructive font-medium">Error loading transactions</p>
            <p className="text-destructive/70 text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <TransactionTable 
              transactions={pagination.paginatedItems}
              emptyMessage="No transactions found"
            />
            
            {/* Pagination */}
            {transactions.length > 10 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {pagination.startIndex}-{pagination.endIndex} of {transactions.length} transactions
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={pagination.prevPage}
                        className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => pagination.goToPage(page)}
                          isActive={pagination.currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={pagination.nextPage}
                        className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
