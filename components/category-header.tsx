"use client"

import { useState } from "react"

interface CategoryHeaderProps {
  category: {
    name: string
    items: number
    chain: string
    totalVolume: string
    listed: string
    owners: number
    uniqueOwners: string
    description: string
  }
  backgroundImage?: string
  floatingImage?: string
}

export default function CategoryHeader({ category, backgroundImage = "/pics1.jpg", floatingImage = "/elegant-portrait-woman-artistic.jpg" }: CategoryHeaderProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  return (
    <div className="relative w-full bg-gradient-to-b from-background to-background/50" style={{ backgroundImage: `url('${backgroundImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80"></div>
      
      {/* Floating Image */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block z-10">
        <img src={floatingImage} alt="Featured" className="w-64 h-64 object-contain animate-float" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-3xl">
          {/* Category Title and Stats */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium capitalize text-white mb-2 sm:mb-4">
              {category.name}
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-white/90">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm">Items</span>
                <span className="text-lg sm:text-xl font-semibold">{category.items.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm">Chain</span>
                <span className="text-lg sm:text-xl font-semibold">{category.chain}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4 sm:mb-6">
            <p className={`text-white/80 text-sm sm:text-base md:text-lg leading-relaxed ${!showFullDescription ? 'line-clamp-3' : ''}`}>
              {category.description}
            </p>
            <button 
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-white font-semibold mt-2 hover:underline cursor-pointer text-sm sm:text-base"
            >
              {showFullDescription ? 'See less' : 'See more'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl md:text-2xl font-semibold text-white">{category.totalVolume}</span>
              <span className="text-white/70 text-xs sm:text-sm mt-1">Total volume</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl md:text-2xl font-semibold text-white">{category.listed}</span>
              <span className="text-white/70 text-xs sm:text-sm mt-1">Listed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

