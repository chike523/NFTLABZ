"use client"

import { useState, useEffect, useRef, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ArtCardProps {
  id?: number
  title: string
  image: string
  floorPrice: string
  usdtPrice: string
}

function ArtCard({ id, title, image, floorPrice, usdtPrice }: ArtCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(title)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  useEffect(() => {
    // Check if image is already loaded (cached)
    if (imgRef.current?.complete) {
      setImageLoaded(true)
    }

    // Fallback timeout to ensure images show even if onLoad doesn't fire
    const timeout = setTimeout(() => {
      setImageLoaded(true)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  const cardContent = (
    <div
      className="group relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {/* Copy Icon Overlay */}
        <div 
          onClick={handleCopy}
          className="absolute top-4 right-4 z-10 bg-white/90 p-2 rounded-lg cursor-pointer transition-all"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-700" />
          )}
        </div>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground" />
          </div>
        )}
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-cover transition-all duration-500",
            isHovered ? "scale-110" : "scale-100",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-lg font-medium text-card-foreground">{title}</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-sm font-semibold">{floorPrice} ETH</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            ≈ {usdtPrice} USDT
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute inset-0 rounded-xl ring-2 ring-primary/50 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  )

  // If ID is provided, wrap with Link, otherwise return as div
  if (id) {
    return (
      <Link href={`/nft/${id}`}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

export default memo(ArtCard)
