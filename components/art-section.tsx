"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import ArtCard from "@/components/art-card"

interface ArtItem {
  id: number
  title: string
  image: string
  floorPrice: string
  usdtPrice: string
}

interface ArtSectionProps {
  title: string
  items: ArtItem[]
  categoryPath?: string
}

export default function ArtSection({ title, items, categoryPath }: ArtSectionProps) {
  const getCategoryPath = (title: string) => {
    const categoryMap: { [key: string]: string } = {
      "Arts": "/category/arts",
      "Gaming": "/category/gaming", 
      "Membership": "/category/membership",
      "Pfps": "/category/pfps",
      "Photography": "/category/photography",
      "Exhibition": "/category/exhibition"
    }
    return categoryMap[title] || categoryPath || "#"
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={getCategoryPath(title)} className="text-2xl sm:text-3xl font-bold hover:text-primary transition-colors">
          {title}
        </Link>
        <Link href={getCategoryPath(title)}>
          <Button variant="ghost" className="rounded-lg bg-muted px-6 hover:bg-muted/80">
            view all
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ArtCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  )
}
