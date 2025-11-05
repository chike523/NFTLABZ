"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import DashboardLayout from "@/components/dashboard/layout"
import WalletCard from "@/components/dashboard/wallet-card"
import TransactionTable from "@/components/dashboard/transaction-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"
import Link from "next/link"
import { Wallet } from "lucide-react"
import { userQueries, transactionQueries, nftQueries } from "@/lib/queries"

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [walletBalance, setWalletBalance] = useState({ eth: 0, usd: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [nftValue, setNftValue] = useState({ eth: 0, usd: 0 })
  const [transactionSummary, setTransactionSummary] = useState({
    total_spent: 0,
    total_earned: 0,
    total_volume: 0,
    transaction_count: 0
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Fetch wallet balance
        const balanceResult = await userQueries.getUserWalletBalance(user.id)
        if (!balanceResult.error) {
          // Fetch live ETH rate and calculate USD dynamically
          try {
            const rateResponse = await fetch('/api/rates/eth-usdt?symbol=ETH')
            if (rateResponse.ok) {
              const rateData = await rateResponse.json()
              const currentEthRate = rateData.rate
              const dynamicUsd = balanceResult.balance_eth * currentEthRate
              
              setWalletBalance({ 
                eth: balanceResult.balance_eth, 
                usd: dynamicUsd  // Use calculated value based on live rate
              })
            } else {
              console.error('Failed to fetch ETH rate for wallet:', rateResponse.statusText)
              setWalletBalance({ 
                eth: balanceResult.balance_eth, 
                usd: 0 
              })
            }
          } catch (rateError) {
            console.error('Failed to fetch ETH rate for wallet:', rateError)
            setWalletBalance({ 
              eth: balanceResult.balance_eth, 
              usd: 0 
            })
          }
        }

        // Fetch recent transactions
        const { data: recentTransactions, error: transactionsError } = await transactionQueries.getUserTransactions(user.id, 5, 0)
        if (!transactionsError && recentTransactions) {
          setTransactions(recentTransactions)
        }

        // Fetch user's NFTs for display
        const { data: nfts, error: nftsError } = await nftQueries.getUserNFTs(user.id, 3, 0)
        if (!nftsError && nfts) {
          setUserNFTs(nfts)
        }

        // Fetch all user's NFTs to calculate total value
        const { data: allNFTs, error: allNFTsError } = await nftQueries.getUserNFTs(user.id, 1000, 0)
        if (!allNFTsError && allNFTs) {
          // Calculate total NFT value in ETH
          const totalEthValue = allNFTs.reduce((sum: number, nft: any) => {
            const price = nft.price_eth ?? nft.floor_price_eth ?? 0
            return sum + (typeof price === 'number' ? price : 0)
          }, 0)
          
          // Get ETH to USDT rate and convert using API route
          try {
            const rateResponse = await fetch('/api/rates/eth-usdt?symbol=ETH')
            if (rateResponse.ok) {
              const rateData = await rateResponse.json()
              const ethRate = rateData.rate
              const totalUsdValue = totalEthValue * ethRate
              setNftValue({ eth: totalEthValue, usd: totalUsdValue })
            } else {
              console.error('Failed to fetch ETH rate for NFT value:', rateResponse.statusText)
              setNftValue({ eth: totalEthValue, usd: 0 })
            }
          } catch (rateError) {
            console.error('Failed to fetch ETH rate for NFT value:', rateError)
            setNftValue({ eth: totalEthValue, usd: 0 })
          }
        }

        // Fetch transaction summary
        const summaryResult = await transactionQueries.getUserTransactionSummary(user.id)
        if (!summaryResult.error) {
          setTransactionSummary({
            total_spent: summaryResult.total_spent,
            total_earned: summaryResult.total_earned,
            total_volume: summaryResult.total_volume,
            transaction_count: summaryResult.transaction_count
          })
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  const accountBalance = useMemo(
    () => `$${walletBalance.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [walletBalance.usd]
  )
  
  const walletBalances = useMemo(
    () => ({
      eth: { 
        balance: walletBalance.eth.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }), 
        usdValue: walletBalance.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
        label: "Primary wallet" 
      },
      nft: { 
        balance: nftValue.eth.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }), 
        usdValue: nftValue.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
        label: "Owned NFTs" 
      }
    }),
    [walletBalance.eth, walletBalance.usd, nftValue.eth, nftValue.usd]
  )

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Overview</h1>
          <p className="text-muted-foreground mt-2">Manage your NFTs, transactions, and account settings</p>
        </div>

        {/* Account Balance Card */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Account Balance</h2>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{accountBalance}</div>
          )}
        </div>

        {/* Cryptocurrency Wallets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {loading ? (
            <>
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </>
          ) : (
            <>
              <WalletCard
                type="ETH"
                balance={walletBalances.eth.balance}
                usdValue={walletBalances.eth.usdValue}
                label={walletBalances.eth.label}
              />
              <WalletCard
                type="NFT"
                balance={walletBalances.nft.balance}
                usdValue={walletBalances.nft.usdValue}
                label={walletBalances.nft.label}
              />
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/dashboard/deposit">
            <Button variant="outline" className="flex-1 sm:flex-none">
              Deposit
            </Button>
          </Link>
          <Link href="/dashboard/mint">
            <Button variant="outline" className="flex-1 sm:flex-none">
              Mint
            </Button>
          </Link>
          <Link href="/dashboard/withdraw">
            <Button variant="outline" className="flex-1 sm:flex-none">
              Withdraw
            </Button>
          </Link>
        </div>

        {/* NFT Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">My NFTs ({userNFTs.length})</h2>
            <Link href="/dashboard/profile">
              <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm sm:text-base">
                view all
              </Button>
            </Link>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : userNFTs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNFTs.map((nft) => (
                  <Link key={nft.id} href={`/nft/${nft.id}`} className="group">
                    <div className="bg-muted/50 rounded-lg overflow-hidden transition-all group-hover:shadow-md">
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={nft.image_url}
                          alt={nft.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm truncate">{nft.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {nft.price_eth ? `${nft.price_eth} ETH` : 'Not for sale'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-base sm:text-lg font-medium">No NFTs yet</p>
                <p className="text-sm mt-1">Create your first NFT to get started</p>
                <Link href="/dashboard/mint">
                  <Button className="mt-4">Mint NFT</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Section */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Recent Transactions</h2>
          {loading ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <TransactionTable 
              transactions={transactions}
              emptyMessage="No transactions yet"
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
