"use client"

import Image from "next/image"
import { ImageIcon } from "lucide-react"

interface WalletCardProps {
  type: "ETH" | "NFT"
  balance: string
  usdValue: string
  label: string
}

export default function WalletCard({ type, balance, usdValue, label }: WalletCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {type === "ETH" ? (
            <Image 
              src="https://assets.coingecko.com/coins/images/279/small/ethereum.png?1696501628" 
              alt="ETH" 
              width={20} 
              height={20}
              className="rounded-full"
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-primary" />
          )}
          <span className="font-medium text-foreground">{type}</span>
        </div>
        <span className="text-sm text-muted-foreground">({label})</span>
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">{balance}</div>
        <div className="text-sm text-muted-foreground">${usdValue} USDT</div>
      </div>
    </div>
  )
}
