"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, XCircle, Clock, Ban } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatEth, formatCurrency } from "@/lib/utils/currency"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Bid {
  id: string
  nft_id: string
  amount_eth: number
  amount_usd: number | null
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
  nft: {
    id: string
    title: string
    image_url: string
  }
}

export default function MyBidsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchBids = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      let query = supabase
        .from('nft_bids')
        .select('*, nft:nfts(id, title, image_url)')
        .eq('bidder_id', user.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setBids(data || [])
    } catch (error) {
      console.error('Error fetching bids:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBids()
  }, [user?.id, statusFilter])

  // Mark page as read on mount
  useEffect(() => {
    const markPageRead = async () => {
      try {
        await fetch('/api/dashboard/mark-page-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_name: 'bids' })
        })
      } catch (error) {
        console.error('Failed to mark page as read:', error)
      }
    }

    markPageRead()
  }, [])

  const handleCancelBid = async (bidId: string, nftTitle: string) => {
    setCancelling(bidId)
    try {
      const response = await fetch(`/api/nfts/${bids.find(b => b.id === bidId)?.nft_id}/bids/${bidId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel bid')
      }

      toast({
        title: 'Bid cancelled',
        description: `Your bid on "${nftTitle}" has been cancelled and funds returned.`
      })

      fetchBids()
    } catch (error) {
      toast({
        title: 'Failed to cancel bid',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setCancelling(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            <Ban className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredBids = bids

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Bids</h1>
          <p className="text-muted-foreground mt-2">View and manage your NFT bids</p>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : filteredBids.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    {statusFilter === 'all' ? 'No bids placed yet' : `No ${statusFilter} bids`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBids.map((bid) => (
                  <Card key={bid.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* NFT Image */}
                      <div className="relative aspect-square">
                        <Image
                          src={bid.nft.image_url || '/placeholder.svg'}
                          alt={bid.nft.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Bid Details */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold truncate">{bid.nft.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(bid.status)}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Bid:</span>
                            <span className="font-semibold">{formatEth(bid.amount_eth)} ETH</span>
                          </div>
                          {bid.amount_usd && (
                            <div className="text-xs text-muted-foreground text-right">
                              ≈ ${formatCurrency(bid.amount_usd)}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Placed {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link href={`/nft/${bid.nft_id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              View NFT
                            </Button>
                          </Link>

                          {bid.status === 'pending' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  disabled={cancelling === bid.id}
                                >
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel bid?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Your bid of {formatEth(bid.amount_eth)} ETH will be cancelled and the funds will be returned to your wallet immediately.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Bid</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelBid(bid.id, bid.nft.title)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Cancel Bid
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

