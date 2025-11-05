"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { Search, Eye, CheckCircle, XCircle, Star, StarOff, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { adminQueries } from "@/lib/queries/admin"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function NFTsManagementPage() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [nfts, setNfts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true)
        const { data, error, count } = await adminQueries.getAllNFTs(100, 0, {
          search: search,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined
        })
        
        if (error) {
          console.error('Error fetching NFTs:', error)
          setNfts([])
          return
        }
        
        setNfts(data || [])
      } catch (error) {
        console.error('Error fetching NFTs:', error)
        setNfts([])
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [search, categoryFilter, statusFilter])

  const pagination = usePagination({
    items: nfts,
    itemsPerPage: 10,
  })

  const handleQuickApprove = async (nft: any) => {
    setActionLoading(true)
    try {
      const { success, error } = await adminQueries.updateNFTStatus(nft.id, 'approved')
      
      if (success) {
        toast({
          title: "Success",
          description: `NFT "${nft.title}" has been approved`
        })
        // Update local state
        setNfts(prev => prev.map(n => n.id === nft.id ? { ...n, status: 'approved' } : n))
      } else {
        throw new Error(error || 'Failed to approve NFT')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve NFT",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleQuickReject = async (nft: any) => {
    setActionLoading(true)
    try {
      const { success, error } = await adminQueries.updateNFTStatus(nft.id, 'rejected')
      
      if (success) {
        toast({
          title: "Success",
          description: `NFT "${nft.title}" has been rejected`
        })
        // Update local state
        setNfts(prev => prev.map(n => n.id === nft.id ? { ...n, status: 'rejected' } : n))
      } else {
        throw new Error(error || 'Failed to reject NFT')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject NFT",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteClick = (nft: any) => {
    setSelectedNFT(nft)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!selectedNFT) return
    
    setActionLoading(true)
    try {
      const { success, error } = await adminQueries.deleteNFT(selectedNFT.id)
      
      if (success) {
        toast({
          title: "Success",
          description: `NFT "${selectedNFT.title}" has been deleted`
        })
        // Remove from local state
        setNfts(prev => prev.filter(n => n.id !== selectedNFT.id))
        setShowDeleteDialog(false)
        setSelectedNFT(null)
      } else {
        throw new Error(error || 'Failed to delete NFT')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete NFT",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AdminLayout>
      <AdminHeader title="NFTs Management" />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search NFTs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
              <SelectItem value="Membership">Membership</SelectItem>
              <SelectItem value="PFPs">PFPs</SelectItem>
              <SelectItem value="Photography">Photography</SelectItem>
              <SelectItem value="Exhibition">Exhibition</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* NFTs Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="px-6 py-3 font-medium">NFT</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Featured</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-3"></div>
                        <p className="text-gray-400">Loading NFTs...</p>
                      </div>
                    </td>
                  </tr>
                ) : pagination.paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <p className="text-lg font-medium">No NFTs found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagination.paginatedItems.map((nft) => (
                    <tr key={nft.id} className="text-sm text-gray-300 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={nft.image_url || '/placeholder.svg'} 
                            alt={nft.title} 
                            className="w-12 h-12 rounded-lg object-cover" 
                          />
                          <div>
                            <div className="font-medium text-white">{nft.title}</div>
                            <div className="text-xs text-gray-500">ID: {nft.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{nft.owner?.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{nft.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{nft.price_eth} ETH</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          nft.status === "approved" && "bg-green-500/10 text-green-400",
                          nft.status === "pending" && "bg-yellow-500/10 text-yellow-400",
                          nft.status === "rejected" && "bg-red-500/10 text-red-400"
                        )}>
                          {nft.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {nft.is_featured ? (
                          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        ) : (
                          <StarOff className="h-5 w-5 text-gray-500" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Quick Approve Button */}
                          {nft.status !== 'approved' && (
                            <Button
                              onClick={() => handleQuickApprove(nft)}
                              disabled={actionLoading}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              title="Approve NFT"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Quick Reject Button */}
                          {nft.status !== 'rejected' && (
                            <Button
                              onClick={() => handleQuickReject(nft)}
                              disabled={actionLoading}
                              size="sm"
                              variant="outline"
                              className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                              title="Reject NFT"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Delete Button */}
                          <Button
                            onClick={() => handleDeleteClick(nft)}
                            disabled={actionLoading}
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600/10"
                            title="Delete NFT"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          {/* View Details Button */}
                          <Link href={`/admin/nfts/${nft.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
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
            <span>Showing {pagination.startIndex}-{pagination.endIndex} of {pagination.totalItems} NFTs</span>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete NFT?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedNFT?.title}"? This action cannot be undone and will permanently remove the NFT from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
