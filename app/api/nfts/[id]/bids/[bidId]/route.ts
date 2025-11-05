import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateSellerPayout } from '@/lib/utils/platform-fee'
import { EmailNotificationService } from '@/lib/email/notification-service'

// PATCH: Accept or Reject a bid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const { id: nftId, bidId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get bid
    const { data: bid, error: bidError } = await supabase
      .from('nft_bids')
      .select('*')
      .eq('id', bidId)
      .eq('nft_id', nftId)
      .single()

    if (bidError || !bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    if (bid.status !== 'pending') {
      return NextResponse.json({ error: 'Bid is no longer pending' }, { status: 400 })
    }

    // Get NFT and verify ownership
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('id', nftId)
      .single()

    if (nftError || !nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
    }

    if (nft.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the NFT owner can accept or reject bids' }, { status: 403 })
    }

    if (action === 'accept') {
      console.log('[Accept Bid] Starting acceptance process...')
      console.log('[Accept Bid] Bid ID:', bidId)
      console.log('[Accept Bid] NFT ID:', nftId)
      console.log('[Accept Bid] Bid Amount:', bid.amount_eth, 'ETH')
      console.log('[Accept Bid] Bidder:', bid.bidder_id)
      console.log('[Accept Bid] Seller:', user.id)
      
      // Calculate platform fee and seller payout
      const payout = calculateSellerPayout(bid.amount_eth)
      console.log('[Accept Bid] Payout calculation:', {
        totalBid: payout.totalBid,
        platformFee: payout.platformFee,
        sellerReceives: payout.sellerReceives
      })

      // Get seller's wallet
      console.log('[Accept Bid] Fetching seller wallet...')
      const { data: sellerWallet, error: sellerWalletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      if (sellerWalletError || !sellerWallet) {
        console.error('[Accept Bid] Seller wallet not found:', sellerWalletError)
        return NextResponse.json({ error: 'Seller wallet not found' }, { status: 404 })
      }
      console.log('[Accept Bid] Seller wallet found:', sellerWallet.id, 'Balance:', sellerWallet.balance_eth ?? sellerWallet.balance)

      // Add payout to seller's wallet
      const sellerBalance = Number(sellerWallet.balance_eth ?? sellerWallet.balance ?? 0)
      const newSellerBalance = sellerBalance + payout.sellerReceives
      console.log('[Accept Bid] Updating seller balance:', sellerBalance, '→', newSellerBalance)

      let walletUpdate = await supabase
        .from('wallets')
        .update({
          balance_eth: newSellerBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', sellerWallet.id)

      if (walletUpdate.error && walletUpdate.error.message?.includes('balance_eth')) {
        console.log('[Accept Bid] Falling back to legacy balance column...')
        walletUpdate = await supabase
          .from('wallets')
          .update({
            balance: newSellerBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', sellerWallet.id)
      }

      if (walletUpdate.error) {
        console.error('[Accept Bid] Seller wallet update FAILED:', walletUpdate.error)
        return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
      }
      console.log('[Accept Bid] ✅ Seller wallet updated successfully')

      // Transfer NFT ownership using admin client (bypasses RLS for stat updates)
      console.log('[Accept Bid] Transferring NFT ownership...')
      console.log('[Accept Bid] Old owner:', nft.owner_id, '→ New owner:', bid.bidder_id)
      
      const adminClient = createAdminClient()
      const { data: updatedNFT, error: nftUpdateError } = await adminClient
        .from('nfts')
        .update({
          owner_id: bid.bidder_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', nftId)
        .select()
        .single()

      if (nftUpdateError) {
        console.error('[Accept Bid] NFT transfer FAILED:', nftUpdateError)
        console.log('[Accept Bid] Rolling back wallet update...')
        // Rollback wallet update
        await supabase.from('wallets').update({ 
          balance_eth: sellerBalance,
          updated_at: new Date().toISOString() 
        }).eq('id', sellerWallet.id)
        console.log('[Accept Bid] Wallet rollback complete')
        return NextResponse.json({ error: 'Failed to transfer NFT: ' + nftUpdateError.message }, { status: 500 })
      }
      console.log('[Accept Bid] ✅ NFT ownership transferred successfully')
      console.log('[Accept Bid] Updated NFT owner:', updatedNFT?.owner_id)

      // Verify NFT transfer worked
      const { data: verifyNFT } = await adminClient
        .from('nfts')
        .select('owner_id')
        .eq('id', nftId)
        .single()
      console.log('[Accept Bid] Verification - NFT owner in database:', verifyNFT?.owner_id, '(expected:', bid.bidder_id, ')')

      // Create transactions for both buyer and seller using admin client (bypass RLS)
      console.log('[Accept Bid] Creating transactions...')
      
      // Transaction for buyer (buy)
      const { error: buyerTxError } = await adminClient.from('transactions').insert({
        user_id: bid.bidder_id,
        nft_id: nftId,
        type: 'buy',
        amount_eth: bid.amount_eth,
        amount_usd: bid.amount_usd,
        status: 'completed',
        platform_fee: 0,
        from_address: null,
        to_address: null
      })
      
      if (buyerTxError) {
        console.error('[Accept Bid] Buyer transaction creation failed:', buyerTxError)
      } else {
        console.log('[Accept Bid] ✅ Buyer transaction created')
      }

      // Transaction for seller (sell)
      const { error: sellerTxError } = await adminClient.from('transactions').insert({
        user_id: nft.owner_id, // Current owner (seller)
        nft_id: nftId,
        type: 'sell',
        amount_eth: payout.sellerReceives,
        amount_usd: payout.sellerReceives * (bid.amount_usd / bid.amount_eth), // Calculate USD for payout
        status: 'completed',
        platform_fee: payout.platformFee,
        from_address: null,
        to_address: null
      })
      
      if (sellerTxError) {
        console.error('[Accept Bid] Seller transaction creation failed:', sellerTxError)
      } else {
        console.log('[Accept Bid] ✅ Seller transaction created')
      }

      // Create wallet transaction for seller (without description field if it doesn't exist)
      console.log('[Accept Bid] Creating wallet transaction record...')
      const { error: walletTxError } = await supabase.from('wallet_transactions').insert({
        wallet_id: sellerWallet.id,
        type: 'credit',
        amount: payout.sellerReceives,
        currency: 'ETH',
        balance_after: newSellerBalance
      })
      
      if (walletTxError && !walletTxError.message?.includes('relation "wallet_transactions" does not exist')) {
        console.error('[Accept Bid] Wallet transaction failed:', walletTxError)
      } else if (!walletTxError) {
        console.log('[Accept Bid] ✅ Wallet transaction recorded')
      }

      // Update bid status using admin client (RLS might block seller from updating)
      console.log('[Accept Bid] Updating bid status to accepted...')
      const { data: updatedBid, error: bidUpdateError } = await adminClient
        .from('nft_bids')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', bidId)
        .select()
        .maybeSingle()

      if (bidUpdateError) {
        console.error('[Accept Bid] Bid status update FAILED:', bidUpdateError)
        console.log('[Accept Bid] CRITICAL: Bid status not updated but NFT transferred!')
      } else if (!updatedBid) {
        console.error('[Accept Bid] Bid status update returned no data')
      } else {
        console.log('[Accept Bid] ✅ Bid status updated to accepted')
        console.log('[Accept Bid] Updated bid:', updatedBid)
      }

      // Verify bid status
      const { data: verifyBid } = await adminClient
        .from('nft_bids')
        .select('status')
        .eq('id', bidId)
        .single()
      console.log('[Accept Bid] Verification - Bid status in database:', verifyBid?.status, '(expected: accepted)')

      // Refund all other pending bids on this NFT
      console.log('[Accept Bid] Fetching other pending bids to refund...')
      const { data: otherBids, error: otherBidsError } = await supabase
        .from('nft_bids')
        .select('*')
        .eq('nft_id', nftId)
        .eq('status', 'pending')
        .neq('id', bidId)

      if (otherBidsError) {
        console.error('[Accept Bid] Failed to fetch other bids:', otherBidsError)
      } else {
        console.log('[Accept Bid] Found', otherBids?.length || 0, 'other bids to refund')
        
        if (otherBids && otherBids.length > 0) {
          for (const otherBid of otherBids) {
            console.log('[Accept Bid] Refunding bid', otherBid.id, 'for', otherBid.amount_eth, 'ETH')
            try {
              await refundBid(supabase, otherBid, 'rejected')
              console.log('[Accept Bid] ✅ Refunded bid', otherBid.id)
            } catch (refundError) {
              console.error('[Accept Bid] Failed to refund bid', otherBid.id, ':', refundError)
            }
          }
        }
      }

      console.log('[Accept Bid] ========================================')
      console.log('[Accept Bid] ACCEPTANCE COMPLETE')
      console.log('[Accept Bid] Summary:')
      console.log('[Accept Bid] - NFT transferred to:', bid.bidder_id)
      console.log('[Accept Bid] - Seller received:', payout.sellerReceives, 'ETH')
      console.log('[Accept Bid] - Platform fee:', payout.platformFee, 'ETH')
      console.log('[Accept Bid] - Bid status:', updatedBid?.status || 'UNKNOWN')
      console.log('[Accept Bid] - Other bids refunded:', otherBids?.length || 0)
      console.log('[Accept Bid] ========================================')

      // Send email notifications
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const siteName = 'Artistrytonal'
      
      // Fetch bidder and seller details
      const adminClient = createAdminClient()
      const [bidderResult, sellerResult] = await Promise.all([
        adminClient.from('Users').select('email, username, display_name').eq('id', bid.bidder_id).maybeSingle(),
        adminClient.from('Users').select('email, username, display_name').eq('id', user.id).maybeSingle()
      ])
      
      // Email to bidder (buyer)
      if (bidderResult.data?.email) {
        EmailNotificationService.sendBidAccepted(bidderResult.data.email, {
          bidderUsername: bidderResult.data.display_name || bidderResult.data.username || bidderResult.data.email,
          sellerUsername: sellerResult.data?.display_name || sellerResult.data?.username || 'Seller',
          nftTitle: nft.title || 'NFT',
          nftId: nft.id,
          nftImage: nft.image_url ? `${siteUrl}${nft.image_url}` : undefined,
          bidAmount: String(bid.amount_eth),
          bidAmountUsd: bid.amount_usd ? String(bid.amount_usd) : undefined,
          platformFee: String(payout.platformFee),
          siteName,
          siteUrl
        }).catch(err => console.error('[Email] Bid accepted notification failed:', err))

        // Also send purchase confirmation to buyer
        EmailNotificationService.sendNftPurchased(bidderResult.data.email, {
          buyerUsername: bidderResult.data.display_name || bidderResult.data.username || bidderResult.data.email,
          sellerUsername: sellerResult.data?.display_name || sellerResult.data?.username || 'Seller',
          nftTitle: nft.title || 'NFT',
          nftId: nft.id,
          nftImage: nft.image_url ? `${siteUrl}${nft.image_url}` : undefined,
          purchaseAmount: String(bid.amount_eth),
          purchaseAmountUsd: bid.amount_usd ? String(bid.amount_usd) : undefined,
          siteName,
          siteUrl
        }).catch(err => console.error('[Email] NFT purchased notification failed:', err))
      }
      
      // Email to seller
      if (sellerResult.data?.email) {
        EmailNotificationService.sendNftSold(sellerResult.data.email, {
          sellerUsername: sellerResult.data.display_name || sellerResult.data.username || sellerResult.data.email,
          buyerUsername: bidderResult.data?.display_name || bidderResult.data?.username || 'Buyer',
          nftTitle: nft.title || 'NFT',
          nftId: nft.id,
          nftImage: nft.image_url ? `${siteUrl}${nft.image_url}` : undefined,
          saleAmount: String(bid.amount_eth),
          saleAmountUsd: bid.amount_usd ? String(bid.amount_usd) : undefined,
          platformFee: String(payout.platformFee),
          netEarnings: String(payout.sellerReceives),
          siteName,
          siteUrl
        }).catch(err => console.error('[Email] NFT sold notification failed:', err))
      }

      return NextResponse.json({ 
        data: updatedBid || bid,
        message: 'Bid accepted successfully. NFT transferred and payment processed.' 
      })
    }

    if (action === 'reject') {
      console.log('[Reject Bid] Starting rejection process...')
      console.log('[Reject Bid] Bid ID:', bidId)
      console.log('[Reject Bid] Amount to refund:', bid.amount_eth, 'ETH')
      
      // Refund the bidder
      try {
        await refundBid(supabase, bid, 'rejected')
        console.log('[Reject Bid] ✅ Bid rejected and refunded')
      } catch (refundError) {
        console.error('[Reject Bid] Refund FAILED:', refundError)
        return NextResponse.json({ error: 'Failed to refund bidder' }, { status: 500 })
      }

      // Send email notification to bidder
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const siteName = 'Artistrytonal'
      
      const adminClient = createAdminClient()
      const [bidderResult, sellerResult] = await Promise.all([
        adminClient.from('Users').select('email, username, display_name').eq('id', bid.bidder_id).maybeSingle(),
        adminClient.from('Users').select('email, username, display_name').eq('id', user.id).maybeSingle()
      ])
      
      if (bidderResult.data?.email) {
        EmailNotificationService.sendBidRejected(bidderResult.data.email, {
          bidderUsername: bidderResult.data.display_name || bidderResult.data.username || bidderResult.data.email,
          sellerUsername: sellerResult.data?.display_name || sellerResult.data?.username || 'Seller',
          nftTitle: nft.title || 'NFT',
          nftId: nft.id,
          bidAmount: String(bid.amount_eth),
          bidAmountUsd: bid.amount_usd ? String(bid.amount_usd) : undefined,
          siteName,
          siteUrl
        }).catch(err => console.error('[Email] Bid rejected notification failed:', err))
      }

      return NextResponse.json({ 
        data: bid,
        message: 'Bid rejected. Funds returned to bidder.' 
      })
    }
  } catch (error) {
    console.error('Bid update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Cancel a bid (bidder only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const { id: nftId, bidId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get bid
    const { data: bid, error: bidError } = await supabase
      .from('nft_bids')
      .select('*')
      .eq('id', bidId)
      .single()

    if (bidError || !bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    if (bid.bidder_id !== user.id) {
      return NextResponse.json({ error: 'You can only cancel your own bids' }, { status: 403 })
    }

    if (bid.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending bids can be cancelled' }, { status: 400 })
    }

    // Refund the bidder
    await refundBid(supabase, bid, 'cancelled')

    return NextResponse.json({ 
      message: 'Bid cancelled. Funds returned to your wallet.' 
    })
  } catch (error) {
    console.error('Bid cancellation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to refund a bid
async function refundBid(supabase: any, bid: any, newStatus: 'rejected' | 'cancelled') {
  console.log(`[Refund Bid] Refunding bid ${bid.id} - Status will be: ${newStatus}`)
  console.log(`[Refund Bid] Bidder ID: ${bid.bidder_id}`)
  
  // Get bidder's wallet using admin client to ensure we can see it
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()
  
  const { data: bidderWallet, error: walletError } = await adminClient
    .from('wallets')
    .select('*')
    .eq('user_id', bid.bidder_id)
    .eq('is_primary', true)
    .maybeSingle()

  if (walletError) {
    console.error('[Refund Bid] Wallet query error:', walletError)
    throw walletError
  }
  
  if (!bidderWallet) {
    console.error('[Refund Bid] No wallet found for bidder:', bid.bidder_id)
    throw new Error(`Bidder wallet not found for user ${bid.bidder_id}`)
  }
  
  console.log('[Refund Bid] Bidder wallet:', bidderWallet.id, 'Current balance:', bidderWallet.balance_eth ?? bidderWallet.balance)

  // Add amount back to bidder's wallet
  const currentBalance = Number(bidderWallet.balance_eth ?? bidderWallet.balance ?? 0)
  const newBalance = currentBalance + Number(bid.amount_eth)
  console.log('[Refund Bid] Refunding:', bid.amount_eth, 'ETH -', currentBalance, '→', newBalance)

  // Use admin client for wallet update to bypass RLS
  let walletUpdate = await adminClient
    .from('wallets')
    .update({
      balance_eth: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', bidderWallet.id)

  if (walletUpdate.error && walletUpdate.error.message?.includes('balance_eth')) {
    console.log('[Refund Bid] Using legacy balance column...')
    walletUpdate = await adminClient
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', bidderWallet.id)
  }

  if (walletUpdate.error) {
    console.error('[Refund Bid] Wallet update FAILED:', walletUpdate.error)
    throw walletUpdate.error
  }
  console.log('[Refund Bid] ✅ Bidder wallet refunded')

  // Create wallet transaction for refund (without description field)
  const { error: walletTxError } = await adminClient.from('wallet_transactions').insert({
    wallet_id: bidderWallet.id,
    type: 'credit',
    amount: bid.amount_eth,
    currency: 'ETH',
    balance_after: newBalance
  })
  
  if (walletTxError && !walletTxError.message?.includes('relation "wallet_transactions" does not exist')) {
    console.error('[Refund Bid] Wallet transaction creation failed:', walletTxError)
  } else if (!walletTxError) {
    console.log('[Refund Bid] ✅ Wallet transaction created')
  }

  // Update bid status (adminClient already imported above)
  console.log('[Refund Bid] Updating bid status to:', newStatus)
  
  const { data: updatedBid, error: bidStatusError } = await adminClient
    .from('nft_bids')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', bid.id)
    .select()
    .maybeSingle()

  if (bidStatusError) {
    console.error('[Refund Bid] Bid status update FAILED:', bidStatusError)
    throw bidStatusError
  }
  console.log('[Refund Bid] ✅ Bid status updated to:', newStatus)
  console.log('[Refund Bid] Updated bid:', updatedBid)
}

