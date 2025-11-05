"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin/layout"
import AdminHeader from "@/components/admin/header"
import { ArrowLeft, CheckCircle, XCircle, Star, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import Link from "next/link"
import { cn } from "@/lib/utils"
import { adminQueries } from "@/lib/queries/admin"
import { toast } from "@/components/ui/use-toast"

export default function NFTDetailPage() {
  const params = useParams()
  const router = useRouter()
  const nftId = params.id as string
  
  const [nft, setNft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const fetchNFT = async () => {
      try {
        setLoading(true)
        const { data, error } = await adminQueries.getNFTById(nftId)
        
        if (error || !data) {
          toast({
            title: "Error",
            description: error || "NFT not found",
            variant: "destructive"
          })
          return
        }
        
        setNft(data)
      } catch (error) {
        console.error('Error fetching NFT:', error)
        toast({
          title: "Error",
          description: "Failed to load NFT details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (nftId) {
      fetchNFT()
    }
  }, [nftId])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const { success, error } = await adminQueries.updateNFTStatus(nftId, 'approved')
      
      if (success) {
        toast({
          title: "Success",
          description: "NFT has been approved and is now live on the marketplace"
        })
        setNft((prev: any) => ({ ...prev, status: 'approved' }))
        setShowApproveDialog(false)
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

  const handleReject = async () => {
    setActionLoading(true)
    try {
      const { success, error } = await adminQueries.updateNFTStatus(nftId, 'rejected')
      
      if (success) {
        toast({
          title: "Success",
          description: "NFT has been rejected"
        })
        setNft((prev: any) => ({ ...prev, status: 'rejected' }))
        setShowRejectDialog(false)
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

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const { success, error } = await adminQueries.deleteNFT(nftId)
      
      if (success) {
        toast({
          title: "Success",
          description: "NFT has been permanently deleted"
        })
        setTimeout(() => {
          router.push('/admin/nfts')
        }, 1000)
      } else {
        throw new Error(error || 'Failed to delete NFT')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete NFT",
        variant: "destructive"
      })
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="NFT Details" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96 w-full rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!nft) {
    return (
      <AdminLayout>
        <AdminHeader title="NFT Not Found" />
        <div className="p-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">NFT not found.</p>
            <Link href="/admin/nfts">
              <Button className="mt-4" variant="outline">
                Back to NFTs
              </Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <AdminHeader title="NFT Details" />
      
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Link href="/admin/nfts">
          <Button variant="ghost" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to NFTs
          </Button>
        </Link>

        {/* NFT Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NFT Image */}
            <div className="bg-gray-700/50 rounded-lg overflow-hidden">
              <img 
                src={nft.image_url} 
                alt={nft.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg'
                }}
              />
            </div>

            {/* NFT Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold text-white">{nft.title}</h2>
                  {nft.is_featured && (
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Category: {nft.category?.name || 'N/A'}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  nft.status === "approved" && "bg-green-500/10 text-green-400",
                  nft.status === "pending" && "bg-yellow-500/10 text-yellow-400",
                  nft.status === "rejected" && "bg-red-500/10 text-red-400",
                  nft.status === "draft" && "bg-gray-500/10 text-gray-400"
                )}>
                  {nft.status.charAt(0).toUpperCase() + nft.status.slice(1)}
                </span>
              </div>

              {/* Description */}
              {nft.description && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-white">{nft.description}</p>
                </div>
              )}

              {/* Price Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Price</p>
                  <p className="text-2xl font-bold text-white">
                    {nft.price_eth ? `${nft.price_eth} ETH` : 'Not set'}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Royalty</p>
                  <p className="text-lg font-semibold text-white">
                    {nft.royalty_percentage || 0}%
                  </p>
                </div>
              </div>

              {/* Owner & Creator Info */}
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Creator</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {nft.creator?.display_name || nft.creator?.username || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Owner</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {nft.owner?.display_name || nft.owner?.username || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Created</p>
                  <p className="text-sm text-white">
                    {new Date(nft.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {nft.status !== 'approved' && (
                  <Button
                    onClick={() => setShowApproveDialog(true)}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve NFT
                  </Button>
                )}
                
                {nft.status !== 'rejected' && (
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject NFT
                  </Button>
                )}
                
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full border-red-600 text-red-400 hover:bg-red-600/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete NFT
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve NFT?</AlertDialogTitle>
            <AlertDialogDescription>
              This NFT will be approved and made visible on the marketplace. The creator will be able to list it for sale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject NFT?</AlertDialogTitle>
            <AlertDialogDescription>
              This NFT will be rejected and will not be visible on the marketplace. The creator will still be able to see it in their profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={actionLoading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete NFT?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the NFT and remove it from the database.
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
