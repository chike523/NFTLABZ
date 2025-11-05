"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { transactionQueries } from "@/lib/queries"

export default function NFTTransactionsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"sold" | "bought">("sold")
  const [nftTransactions, setNftTransactions] = useState<{
    sold: any[]
    bought: any[]
  }>({
    sold: [],
    bought: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNFTTransactions = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)
        
        // Fetch buy/sell transactions from the API
        const response = await fetch('/api/dashboard/nft-transactions')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch NFT transactions')
        }

        setNftTransactions({
          sold: data.sold || [],
          bought: data.bought || []
        })
      } catch (err) {
        console.error('Error fetching NFT transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load NFT transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchNFTTransactions()
  }, [user?.id])

  // Mark page as read on mount
  useEffect(() => {
    const markPageRead = async () => {
      try {
        await fetch('/api/dashboard/mark-page-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_name: 'nft-transactions' })
        })
      } catch (error) {
        console.error('Failed to mark page as read:', error)
      }
    }

    markPageRead()
  }, [])

  const currentTransactions = nftTransactions[activeTab]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">NFT Transactions</h1>
          <p className="text-muted-foreground mt-2">Track your NFT buying and selling activity</p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "sold" ? "default" : "outline"}
            onClick={() => setActiveTab("sold")}
            className={cn(
              activeTab === "sold" 
                ? "bg-primary text-primary-foreground" 
                : "bg-transparent"
            )}
          >
            Sold
          </Button>
          <Button
            variant={activeTab === "bought" ? "default" : "outline"}
            onClick={() => setActiveTab("bought")}
            className={cn(
              activeTab === "bought" 
                ? "bg-primary text-primary-foreground" 
                : "bg-transparent"
            )}
          >
            Bought
          </Button>
        </div>

        {/* NFT Transaction Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-muted px-4 py-3 border-b border-border">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
              <div>NFT Name</div>
              <div>Amount</div>
              <div>{activeTab === 'sold' ? 'Buyer' : 'Seller'}</div>
              <div>Commission</div>
            </div>
          </div>
          
          {/* Table Body */}
          {loading ? (
            <div className="divide-y divide-border">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="px-4 py-3">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-destructive font-medium">Error loading transactions</p>
              <p className="text-destructive/70 text-sm mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          ) : currentTransactions.length > 0 ? (
            <div className="divide-y divide-border">
              {currentTransactions.map((transaction, index) => (
                <div key={transaction.id || index} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-foreground font-medium">
                      {transaction.nft?.title || `NFT #${transaction.nft_id?.slice(0, 8) || 'Unknown'}`}
                    </div>
                    <div className="text-foreground">
                      {transaction.amount_eth} ETH
                    </div>
                    <div className="text-muted-foreground">
                      {activeTab === 'sold' 
                        ? transaction.buyer?.username || transaction.buyer?.email || 'Unknown Buyer'
                        : transaction.seller?.username || transaction.seller?.email || 'Original Owner'
                      }
                    </div>
                    <div className="text-foreground">
                      {transaction.platform_fee ? `${transaction.platform_fee} ETH` : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-lg font-medium">No {activeTab} transactions</p>
              <p className="text-sm mt-1">Your {activeTab} NFT transactions will appear here</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
