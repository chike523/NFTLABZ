"use client"

import { useState } from "react"
import { X, CheckCircle2, AlertCircle, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { NFT } from "@/lib/nft-data" // Removed - using real data now

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  nft: NFT
}

export default function PurchaseModal({ isOpen, onClose, nft }: PurchaseModalProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock wallet balance
  const walletBalance = "12.5 ETH"
  const gasFee = "0.005"
  const gasFeeUSD = "19.77"
  
  const nftPrice = parseFloat(nft.floorPrice)
  const nftPriceUSD = parseFloat(nft.usdPrice)
  const totalPrice = nftPrice + parseFloat(gasFee)
  const totalPriceUSD = nftPriceUSD + parseFloat(gasFeeUSD)

  const handlePurchase = async () => {
    setIsPurchasing(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate success/failure (90% success rate)
      if (Math.random() > 0.1) {
        setPurchaseSuccess(true)
        // Auto close after 3 seconds
        setTimeout(() => {
          onClose()
          setPurchaseSuccess(false)
        }, 3000)
      } else {
        setError("Transaction failed. Please try again.")
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleClose = () => {
    if (!isPurchasing) {
      setPurchaseSuccess(false)
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {purchaseSuccess ? "Purchase Successful!" : "Confirm Purchase"}
          </DialogTitle>
        </DialogHeader>

        {purchaseSuccess ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              NFT Purchased Successfully!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your new NFT "{nft.title}" has been added to your collection.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* NFT Info */}
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={nft.image}
                  alt={nft.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{nft.title}</h3>
                <p className="text-sm text-muted-foreground">by {nft.owner}</p>
                <p className="text-sm text-muted-foreground">{nft.category}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Price Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NFT Price</span>
                  <span className="text-foreground">{nft.floorPrice} ETH (${nft.usdPrice})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas Fee</span>
                  <span className="text-foreground">{gasFee} ETH (${gasFeeUSD})</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{totalPrice.toFixed(3)} ETH (${totalPriceUSD.toFixed(2)})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Wallet Balance</span>
                <span className="text-foreground">{walletBalance}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-500">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isPurchasing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Confirm Purchase
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
