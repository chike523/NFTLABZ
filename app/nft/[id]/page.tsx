"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import ArtCard from "@/components/art-card"
import Footer from "@/components/footer"
import { nftQueries } from "@/lib/queries"
import { Badge } from "@/components/ui/badge"
import { convertEthToUsdt, formatCurrency, formatEth } from "@/lib/utils/currency"
import { useAuth } from "@/contexts/auth-context"
import BidModal from "@/components/nft-bid-modal"

interface NFTDetailPageProps {
  params: Promise<{ id: string }>
}

export default function NFTDetailPage({ params }: NFTDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [nft, setNft] = useState<any | null>(null)
  const [relatedNFTs, setRelatedNFTs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ethToUsdtRate, setEthToUsdtRate] = useState<number | null>(null)
  const [bidModalOpen, setBidModalOpen] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const id = resolvedParams.id
        const { data, error } = await nftQueries.getNFTById(id)
        if (error || !data) {
          setError(error || 'NFT not found')
          setNft(null)
          return
        }
        setNft(data)
        // Fetch related NFTs by category slug if available
        const slug = data.category?.slug
        if (slug) {
          const { data: related } = await nftQueries.getNFTsByCategory(slug, 5, 0)
          setRelatedNFTs((related || []).filter((r: any) => r.id !== id))
        }
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [resolvedParams.id])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const loadRate = async () => {
      try {
        const response = await fetch('/api/rates/eth-usdt', {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error(`Rate request failed: ${response.status}`)
        }

        const data = await response.json()

        if (isMounted && typeof data.rate === 'number') {
          setEthToUsdtRate(data.rate)
        }
      } catch (rateError) {
        if (rateError instanceof DOMException && rateError.name === 'AbortError') {
          return
        }
        console.error('Failed to load ETH→USDT rate:', rateError)
      }
    }

    loadRate()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const primaryPriceValue = typeof nft?.price_eth === 'number'
    ? nft?.price_eth
    : typeof nft?.floor_price_eth === 'number'
    ? nft?.floor_price_eth
    : null

  const primaryPriceEthDisplay = primaryPriceValue !== null
    ? `${formatEth(primaryPriceValue)} ETH`
    : '-'

  const primaryPriceUsdtDisplay = primaryPriceValue !== null && typeof ethToUsdtRate === 'number'
    ? `≈ ${formatCurrency(convertEthToUsdt(primaryPriceValue, ethToUsdtRate) ?? 0)} USDT`
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading NFT...</div>
      </div>
    )
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">NFT Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The NFT you're looking for doesn't exist."}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground truncate">{nft.title}</h1>
                {nft.status && nft.status !== 'approved' && (
                  <Badge variant="outline" className={
                    nft.status === 'pending'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }>
                    {nft.status === 'pending' ? 'Pending' : 'Rejected'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{nft.category?.name || 'Uncategorized'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              <img src={nft.image_url || '/placeholder.svg'} alt={nft.title} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{nft.title}</h1>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-muted-foreground">Owned by:</span>
                <span className="font-medium text-foreground">{nft.owner?.display_name || nft.owner?.username || 'Unknown'}</span>
                {/* Optional verified icon if we add it later */}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Description</h3>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{nft.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Price</h3>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-2xl font-bold text-foreground">{primaryPriceEthDisplay}</div>
                {primaryPriceUsdtDisplay && (
                  <div className="text-sm text-muted-foreground mt-1">{primaryPriceUsdtDisplay}</div>
                )}
              </div>
            </div>

            {/* Make Offer Button - Only for non-owners */}
            {user && user.id !== nft.owner_id && nft.status === 'approved' && (
              <Button 
                onClick={() => setBidModalOpen(true)}
                className="w-full"
                size="lg"
              >
                Make Offer
              </Button>
            )}
          </div>
        </div>

        {relatedNFTs.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">More From {nft.category?.name}</h2>
              {nft.category?.slug && (
                <Link href={`/category/${nft.category.slug}`}>
                  <Button variant="ghost" className="text-primary hover:text-primary/80">view all</Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {relatedNFTs.map((r) => (
                <ArtCard
                  key={r.id}
                  id={r.id}
                  title={r.title}
                  image={r.image_url}
                  floorPrice={formatEth(r.price_eth ?? r.floor_price_eth ?? 0)}
                  usdtPrice={typeof ethToUsdtRate === 'number'
                    ? formatCurrency(convertEthToUsdt(r.price_eth ?? r.floor_price_eth ?? 0, ethToUsdtRate) ?? 0)
                    : '--'}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Bid Modal */}
      {user && primaryPriceValue !== null && (
        <BidModal
          open={bidModalOpen}
          onOpenChange={setBidModalOpen}
          nft={{
            id: nft.id,
            title: nft.title,
            image_url: nft.image_url,
            price_eth: primaryPriceValue
          }}
          onBidPlaced={() => {
            // Optional: Refresh NFT data or show success message
          }}
        />
      )}
    </div>
  )
}
