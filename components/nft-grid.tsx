"use client"

import { useState, memo } from "react"
import { Copy, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface NFTItem {
  id: string
  title: string
  image: string
  price: string
  priceUSD: string
}

interface NFTGridProps {
  items: NFTItem[]
}

function NFTGrid({ items }: NFTGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (e: React.MouseEvent, title: string, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(title)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {items.map((item) => (
          <div key={item.id} className="group relative">
            {/* Copy Icon Overlay */}
            <div 
              onClick={(e) => handleCopy(e, item.title, item.id)}
              className="absolute top-4 right-4 z-10 bg-white/90 p-2 rounded-lg cursor-pointer transition-all"
            >
              {copiedId === item.id ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-700" />
              )}
            </div>

            <Link href={`/nft/${item.id}`} className="block">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden rounded-2xl mb-3 bg-muted">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="space-y-2">
                {/* Title */}
                <h3 className="font-semibold text-lg text-foreground truncate">
                  {item.title}
                </h3>

                {/* Price Section */}
                <div className="flex justify-between items-end pt-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground font-medium">Price</span>
                    <span className="text-xs text-muted-foreground">≈ {item.priceUSD} USDT</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-foreground">{item.price} ETH</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(NFTGrid)

