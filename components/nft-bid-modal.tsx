"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Info, Gavel } from "lucide-react"
import Image from "next/image"
import { formatEth, formatCurrency } from "@/lib/utils/currency"
import { useAuth } from "@/contexts/auth-context"
import { userQueries } from "@/lib/queries"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface BidModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nft: {
    id: string
    title: string
    image_url: string
    price_eth: number
  }
  onBidPlaced?: () => void
}

export default function BidModal({ open, onOpenChange, nft, onBidPlaced }: BidModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [bidAmount, setBidAmount] = useState("")
  const [balance, setBalance] = useState(0)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usdPreview, setUsdPreview] = useState<string>("0.00")
  const [ethRate, setEthRate] = useState<number | null>(null)

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return
      
      setLoadingBalance(true)
      try {
        const result = await userQueries.getUserWalletBalance(user.id)
        setBalance(result.balance_eth)
      } catch (error) {
        console.error('Error fetching balance:', error)
      } finally {
        setLoadingBalance(false)
      }
    }

    if (open) {
      fetchBalance()
    }
  }, [user?.id, open])

  // Fetch ETH to USD rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('/api/rates/eth-usdt', { cache: 'no-store' })
        const data = await response.json()
        if (data.rate) {
          setEthRate(data.rate)
        }
      } catch (error) {
        console.error('Failed to fetch ETH rate:', error)
      }
    }

    if (open) {
      fetchRate()
    }
  }, [open])

  // Update USD preview
  useEffect(() => {
    const amount = parseFloat(bidAmount)
    if (ethRate && !isNaN(amount) && amount > 0) {
      setUsdPreview(formatCurrency(amount * ethRate))
    } else {
      setUsdPreview("0.00")
    }
  }, [bidAmount, ethRate])

  const validateBid = () => {
    const amount = parseFloat(bidAmount)
    
    if (!bidAmount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount')
      return false
    }

    if (amount < nft.price_eth) {
      setError(`Bid must be at least ${formatEth(nft.price_eth)} ETH (asking price)`)
      return false
    }

    if (amount > balance) {
      setError('Insufficient balance. You do not have enough in your wallet.')
      return false
    }

    setError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateBid()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/nfts/${nft.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(bidAmount),
          amount_usd: ethRate ? parseFloat(bidAmount) * ethRate : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid')
      }

      toast({
        title: 'Bid placed successfully',
        description: `Your bid of ${bidAmount} ETH has been placed and held in escrow.`
      })

      setBidAmount("")
      onOpenChange(false)
      onBidPlaced?.()
      
      // Redirect to My Bids page
      router.push('/dashboard/bids')
    } catch (error) {
      console.error('Bid placement failed:', error)
      toast({
        title: 'Failed to place bid',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setBidAmount("")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <DialogDescription>
            Place a bid on this NFT. Your funds will be held in escrow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NFT Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Image
              src={nft.image_url || '/placeholder.svg'}
              alt={nft.title}
              width={60}
              height={60}
              className="rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{nft.title}</p>
              <p className="text-sm text-muted-foreground">
                Asking Price: {formatEth(nft.price_eth)} ETH
              </p>
            </div>
          </div>

          {/* Balance Display */}
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Available Balance</span>
            <span className="font-semibold">
              {loadingBalance ? '...' : `${formatEth(balance)} ETH`}
            </span>
          </div>

          {/* Bid Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid (ETH)</Label>
            <Input
              id="bidAmount"
              type="number"
              step="0.0001"
              placeholder="0.0000"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className={error ? 'border-red-500' : ''}
              disabled={submitting || loadingBalance}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum: {formatEth(nft.price_eth)} ETH</span>
              <span>≈ ${usdPreview} USD</span>
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Escrow Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your bid will be held in escrow (deducted from your balance) until the seller accepts or rejects it. You can cancel your bid anytime to get an immediate refund.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || loadingBalance || !bidAmount}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Bid...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4 mr-2" />
                  Place Bid
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

