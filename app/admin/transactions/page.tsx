"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Search, Eye, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { adminQueries, AdminTransaction } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { formatCurrency, formatEth } from "@/lib/utils/currency"

export default function TransactionsListPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const { data, error, count } = await adminQueries.getAllTransactions(100, 0, {
          search: search || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        })
        
        if (error) {
          console.error('Error fetching transactions:', error)
          setTransactions([])
          setTotalCount(0)
          return
        }
        
        setTransactions(data || [])
        setTotalCount(count || 0)
      } catch (error) {
        console.error('Error fetching transactions:', error)
        setTransactions([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [search, typeFilter, statusFilter])

  const pagination = usePagination({
    items: transactions,
    itemsPerPage: 10,
  })

  return (
    <AdminLayout>
      <AdminHeader title="Transactions" />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="mint">Mint</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-600/10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Transactions Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">NFT</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedItems.map((transaction) => {
                  const symbol = (transaction.token_symbol || 'ETH').toUpperCase()
                  const amount = `${formatEth(transaction.amount_eth)} ${symbol}`
                  const usd = formatCurrency(transaction.amount_usd, 2)
                  const dateLabel = new Date(transaction.created_at).toLocaleString()

                  return (
                    <tr key={transaction.id} className="text-sm text-gray-300 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{transaction.id}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs capitalize",
                          transaction.type === 'deposit' && "bg-green-500/10 text-green-400",
                          transaction.type === 'withdrawal' && "bg-red-500/10 text-red-400",
                          transaction.type !== 'deposit' && transaction.type !== 'withdrawal' && "bg-blue-500/10 text-blue-400"
                        )}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{transaction.user?.username || transaction.user?.display_name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        {transaction.nft?.id ? (
                          <Link href={`/admin/nfts/${transaction.nft.id}`} className="text-blue-400 hover:text-blue-300">
                            {transaction.nft.title}
                          </Link>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{amount}</div>
                        <div className="text-xs text-gray-400">${usd}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{dateLabel}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium capitalize",
                          transaction.status === "completed" && "bg-green-500/10 text-green-400",
                          transaction.status === "pending" && "bg-yellow-500/10 text-yellow-400",
                          transaction.status === "failed" && "bg-red-500/10 text-red-400",
                          transaction.status === "cancelled" && "bg-gray-500/10 text-gray-300"
                        )}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/transactions/${transaction.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Showing {pagination.startIndex}-{pagination.endIndex} of {totalCount} transactions</span>
            <Select value={pagination.itemsPerPage.toString()} onValueChange={(value) => pagination.setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-[80px] h-8 bg-gray-700 border-gray-600 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={pagination.prevPage}
                  className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Page Numbers */}
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
      </div>
    </AdminLayout>
  )
}
