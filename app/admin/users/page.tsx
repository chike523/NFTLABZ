"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Search, MoreVertical, Eye, Ban, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { adminQueries } from "@/lib/queries/admin"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

export default function UsersManagementPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const { data, error, count } = await adminQueries.getAllUsers(100, 0, {
          search: search,
          status: statusFilter !== 'all' ? statusFilter : undefined
        })
        
        if (error) {
          console.error('Error fetching users:', error)
          setUsers([])
          return
        }
        
        setUsers(data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [search, statusFilter])

  const pagination = usePagination({
    items: users,
    itemsPerPage: 10,
  })

  return (
    <AdminLayout>
      <AdminHeader title="Users Management" />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Wallet</th>
                  <th className="px-6 py-3 font-medium">Join Date</th>
                  <th className="px-6 py-3 font-medium">NFTs</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-3"></div>
                        <p className="text-gray-400">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : pagination.paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagination.paginatedItems.map((user) => (
                    <tr key={user.id} className="text-sm text-gray-300 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.avatar_url || '/placeholder-user.jpg'} 
                            alt={user.username} 
                            className="w-10 h-10 rounded-full object-cover" 
                          />
                          <div>
                            <div className="font-medium text-white">{user.display_name || user.username}</div>
                            <div className="text-xs text-gray-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {user.wallets && user.wallets.length > 0 && user.wallets[0].wallet_address
                          ? user.wallets[0].wallet_address.slice(0, 6) + '...' + user.wallets[0].wallet_address.slice(-4)
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{user.nftCount || 0}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          user.status === "active" && "bg-green-500/10 text-green-400",
                          user.status === "suspended" && "bg-yellow-500/10 text-yellow-400",
                          user.status === "banned" && "bg-red-500/10 text-red-400"
                        )}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Showing {pagination.startIndex}-{pagination.endIndex} of {pagination.totalItems} users</span>
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
