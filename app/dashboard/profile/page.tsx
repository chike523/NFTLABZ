"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton"
import { Grid, List, User, Eye, Heart, AlertCircle, CheckCircle2, XCircle, Clock, Tag, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { userQueries, nftQueries } from "@/lib/queries"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { formatEth, formatCurrency } from "@/lib/utils/currency"
import { formatDistanceToNow } from "date-fns"
import { calculateSellerPayout } from "@/lib/utils/platform-fee"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'offers'

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [nftValue, setNftValue] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [offers, setOffers] = useState<any[]>([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [expandedNft, setExpandedNft] = useState<string | null>(null)
  const [processingBid, setProcessingBid] = useState<string | null>(null)
  const [offersCount, setOffersCount] = useState<number>(0)

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Fetch user profile
        const { data: profile, error: profileError } = await userQueries.getUserProfile(user.id)
        if (!profileError && profile) {
          setUserProfile(profile)
        }

        // Fetch user stats
        const { data: stats, error: statsError } = await userQueries.getUserStats(user.id)
        if (!statsError && stats) {
          setUserStats(stats)
        }

        // Fetch user's NFTs based on status filter (skip for offers tab)
        if (statusFilter !== 'offers') {
          const statusValue = statusFilter === 'all' ? undefined : statusFilter as 'pending' | 'approved' | 'rejected' | undefined
          const { data: nfts, error: nftsError } = await nftQueries.getUserNFTsByStatus(user.id, statusValue, 50, 0)
          if (!nftsError && nfts) {
            setUserNFTs(nfts)
          }
        }

        // Fetch all user's NFTs to calculate total NFT value
        const { data: allNFTs, error: allNFTsError } = await nftQueries.getUserNFTs(user.id, 1000, 0)
        if (!allNFTsError && allNFTs) {
          // Calculate total NFT value in ETH
          const totalEthValue = allNFTs.reduce((sum: number, nft: any) => {
            const price = nft.price_eth ?? nft.floor_price_eth ?? 0
            return sum + (typeof price === 'number' ? price : 0)
          }, 0)
          setNftValue(totalEthValue)
        }

      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [user?.id, statusFilter])

  // Mark page as read on mount
  useEffect(() => {
    const markPageRead = async () => {
      try {
        await fetch('/api/dashboard/mark-page-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_name: 'profile' })
        })
      } catch (error) {
        console.error('Failed to mark page as read:', error)
      }
    }

    markPageRead()
  }, [])

  // Fetch offers count on mount for badge display
  const fetchOffersCount = async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/dashboard/offers')
      const data = await response.json()
      
      if (!data.error && data.data) {
        const totalCount = data.data.reduce((sum: number, offer: any) => sum + (offer.bidCount || 0), 0)
        setOffersCount(totalCount)
      }
    } catch (error) {
      console.error('Error fetching offers count:', error)
    }
  }

  useEffect(() => {
    fetchOffersCount()
  }, [user?.id])

  // Fetch offers when Offers tab is active
  const fetchOffers = async () => {
    if (!user?.id) return

    try {
      setLoadingOffers(true)
      const response = await fetch('/api/dashboard/offers')
      const data = await response.json()
      
      if (data.error) throw new Error(data.error)
      const offersData = data.data || []
      setOffers(offersData)
      
      // Calculate total pending offers count
      const totalCount = offersData.reduce((sum: number, offer: any) => sum + (offer.bidCount || 0), 0)
      setOffersCount(totalCount)
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoadingOffers(false)
    }
  }

  const handleBidAction = async (bidId: string, nftId: string, action: 'accept' | 'reject', bidAmount: number, nftTitle: string) => {
    setProcessingBid(bidId)
    try {
      const response = await fetch(`/api/nfts/${nftId}/bids/${bidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} bid`)
      }

      toast({
        title: action === 'accept' ? 'Bid accepted' : 'Bid rejected',
        description: action === 'accept' 
          ? `NFT "${nftTitle}" sold for ${formatEth(bidAmount)} ETH` 
          : `Bid rejected. Funds returned to bidder.`
      })

      // Refresh offers
      await fetchOffers()
      
      // Refresh NFT list to update ownership
      const fetchProfileData = async () => {
        if (!user?.id) return
        try {
          if (statusFilter !== 'offers') {
            const statusValue = statusFilter === 'all' ? undefined : statusFilter as 'pending' | 'approved' | 'rejected' | undefined
            const { data: nfts } = await nftQueries.getUserNFTsByStatus(user.id, statusValue, 50, 0)
            if (nfts) setUserNFTs(nfts)
          }
        } catch (error) {
          console.error('Error refreshing NFTs:', error)
        }
      }
      await fetchProfileData()
    } catch (error) {
      toast({
        title: `Failed to ${action} bid`,
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setProcessingBid(null)
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
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const getEmptyStateMessage = () => {
    switch (statusFilter) {
      case 'pending':
        return {
          title: "No pending NFTs",
          description: "You don't have any NFTs awaiting approval"
        }
      case 'approved':
        return {
          title: "No approved NFTs",
          description: "You don't have any approved NFTs yet"
        }
      case 'rejected':
        return {
          title: "No rejected NFTs",
          description: "You don't have any rejected NFTs"
        }
      default:
        return {
          title: "No NFTs in your collection",
          description: "Start by minting your first NFT!"
        }
    }
  }

  const emptyState = getEmptyStateMessage()

  if (loading) {
    return (
      <DashboardLayout>
        <ProfileSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My NFT Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">Manage your NFT collection</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0">
              {loading ? (
                <Skeleton className="h-20 w-20 rounded-full" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.display_name || userProfile.username}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-foreground">
                    {userProfile?.display_name || userProfile?.username || 'Unknown User'}
                  </h2>
                  <p className="text-sm text-muted-foreground">@{userProfile?.username}</p>
                  {userProfile?.bio && (
                    <p className="text-sm text-muted-foreground mt-1">{userProfile.bio}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-6 w-12 mx-auto mb-1" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
              ))}
            </div>
          ) : userStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{userStats.nfts_owned || 0}</div>
                <div className="text-sm text-muted-foreground">NFTs Owned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{userStats.nfts_created || 0}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{userStats.followers_count || 0}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{nftValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                <div className="text-sm text-muted-foreground">NFT Value (ETH)</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value as StatusFilter)
          if (value === 'offers') {
            fetchOffers()
          }
        }} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All NFTs</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                Pending
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs sm:text-sm">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                Rejected
              </TabsTrigger>
              <TabsTrigger value="offers" className="text-xs sm:text-sm">
                <Tag className="h-3 w-3 mr-1" />
                Offers
                {offersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 min-w-[20px] px-1.5 text-xs font-semibold"
                  >
                    {offersCount > 99 ? '99+' : offersCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {statusFilter !== 'offers' && (
              <div className="flex items-center gap-3">
                <div className="flex border border-border rounded-lg">
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {loading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${userNFTs.length} NFTs`
                  )}
                </div>
              </div>
            )}
          </div>

          {/* NFT Collection Tabs */}
          {statusFilter !== 'offers' && (
            <TabsContent value={statusFilter} className="mt-6">
              <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-48 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : userNFTs.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-4"
                }>
                  {userNFTs.map((nft) => (
                    <Link key={nft.id} href={`/nft/${nft.id}`} className="group">
                      <div className={`bg-muted/50 rounded-lg overflow-hidden transition-all group-hover:shadow-md ${
                        viewMode === 'list' ? 'flex items-center space-x-4 p-4' : ''
                      }`}>
                        <div className={`${viewMode === 'list' ? 'w-20 h-20' : 'aspect-square'} relative overflow-hidden`}>
                          <img
                            src={nft.image_url}
                            alt={nft.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {/* Status Badge Overlay */}
                          {nft.status !== 'approved' && (
                            <div className="absolute top-2 right-2">
                              {getStatusBadge(nft.status)}
                            </div>
                          )}
                        </div>
                        <div className={viewMode === 'list' ? 'flex-1' : 'p-3'}>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-sm truncate flex-1">{nft.title}</h3>
                            {viewMode !== 'list' && nft.status !== 'approved' && (
                              <div>{getStatusBadge(nft.status)}</div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {nft.price_eth ? `${nft.price_eth} ETH` : 'Not for sale'}
                          </p>
                          {nft.status === 'pending' && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Awaiting approval
                            </p>
                          )}
                          {nft.status === 'rejected' && (
                            <p className="text-xs text-red-600 dark:text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Rejected by admin
                            </p>
                          )}
                          {viewMode === 'list' && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {nft.view_count}
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {nft.like_count}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                    {statusFilter === 'pending' ? (
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    ) : statusFilter === 'approved' ? (
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    ) : statusFilter === 'rejected' ? (
                      <XCircle className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-base sm:text-lg font-medium">{emptyState.title}</p>
                  <p className="text-xs sm:text-sm mt-2">{emptyState.description}</p>
                  {statusFilter === 'all' && (
                    <Link href="/dashboard/mint">
                      <Button className="mt-3 sm:mt-4" variant="outline" size="sm">
                        Mint NFT
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
            </TabsContent>
          )}

          {/* Offers Tab Content */}
          <TabsContent value="offers" className="mt-6">
            <div className="space-y-4">
              {/* Platform Fee Notice */}
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-blue-400">
                    <strong>Platform fee:</strong> A 2.5% fee is deducted from the bid amount when you accept an offer. The amount shown as "You'll receive" already accounts for this fee.
                  </p>
                </CardContent>
              </Card>

              {loadingOffers ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              ) : offers.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No bids on your NFTs yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => {
                    const isExpanded = expandedNft === offer.nft.id
                    
                    return (
                      <Card key={offer.nft.id}>
                        <CardHeader 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedNft(isExpanded ? null : offer.nft.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Image
                              src={offer.nft.image_url || '/placeholder.svg'}
                              alt={offer.nft.title}
                              width={80}
                              height={80}
                              className="rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="truncate">{offer.nft.title}</CardTitle>
                              <CardDescription>
                                {offer.bidCount} {offer.bidCount === 1 ? 'bid' : 'bids'} • Highest: {formatEth(offer.highestBid)} ETH
                              </CardDescription>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </CardHeader>

                        {isExpanded && (
                          <CardContent className="pt-0 space-y-3">
                            {offer.bids.map((bid: any) => {
                              const payout = calculateSellerPayout(bid.amount_eth)
                              
                              return (
                                <div key={bid.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{bid.bidder.display_name || bid.bidder.username}</span>
                                      <span className="text-xs text-muted-foreground">{bid.bidder.email}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">Bid: </span>
                                        <span className="font-semibold">{formatEth(bid.amount_eth)} ETH</span>
                                        {bid.amount_usd && (
                                          <span className="text-xs text-muted-foreground ml-2">
                                            (${formatCurrency(bid.amount_usd)})
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-green-500">
                                        You'll receive: {formatEth(payout.sellerReceives)} ETH (after 2.5% fee)
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Placed {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 ml-4">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          disabled={processingBid === bid.id}
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-1" />
                                          Accept
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Accept this bid?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            You are about to sell "{offer.nft.title}" to {bid.bidder.display_name || bid.bidder.username}.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="space-y-3">
                                          <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                                            <div className="flex justify-between">
                                              <span>Bid Amount:</span>
                                              <span className="font-semibold">{formatEth(bid.amount_eth)} ETH</span>
                                            </div>
                                            <div className="flex justify-between text-red-500">
                                              <span>Platform Fee (2.5%):</span>
                                              <span>-{formatEth(payout.platformFee)} ETH</span>
                                            </div>
                                            <div className="flex justify-between border-t border-border pt-1 font-semibold text-green-500">
                                              <span>You Receive:</span>
                                              <span>{formatEth(payout.sellerReceives)} ETH</span>
                                            </div>
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            The NFT will be transferred to the buyer and all other bids will be automatically refunded.
                                          </p>
                                        </div>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleBidAction(bid.id, offer.nft.id, 'accept', bid.amount_eth, offer.nft.title)}
                                            className="bg-green-600 hover:bg-green-500"
                                          >
                                            Accept Bid
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>

                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleBidAction(bid.id, offer.nft.id, 'reject', bid.amount_eth, offer.nft.title)}
                                      disabled={processingBid === bid.id}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
