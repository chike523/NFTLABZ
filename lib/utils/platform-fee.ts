/**
 * Platform Fee Utilities
 * 2.5% fee on NFT sales via bid acceptance
 */

export const PLATFORM_FEE_RATE = 0.025 // 2.5%

/**
 * Calculate platform fee for a given amount
 */
export function calculatePlatformFee(amount: number): number {
  return Number((amount * PLATFORM_FEE_RATE).toFixed(8))
}

/**
 * Calculate seller payout after platform fee
 */
export function calculateSellerPayout(bidAmount: number) {
  const fee = calculatePlatformFee(bidAmount)
  const sellerReceives = Number((bidAmount - fee).toFixed(8))
  
  return {
    totalBid: bidAmount,
    platformFee: fee,
    sellerReceives: sellerReceives,
    feePercentage: PLATFORM_FEE_RATE * 100 // For display: 2.5
  }
}

/**
 * Format fee breakdown for display in UI
 */
export function formatFeeBreakdown(bidAmount: number) {
  const payout = calculateSellerPayout(bidAmount)
  
  return {
    bidAmountDisplay: `${payout.totalBid.toFixed(4)} ETH`,
    feeDisplay: `${payout.platformFee.toFixed(4)} ETH`,
    sellerDisplay: `${payout.sellerReceives.toFixed(4)} ETH`,
    feePercentageDisplay: `${payout.feePercentage}%`
  }
}

