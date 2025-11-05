"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const categories = [
  { name: "All", path: "/" },
  { name: "Arts", path: "/category/arts" },
  { name: "Gaming", path: "/category/gaming" },
  { name: "Membership", path: "/category/membership" },
  { name: "PFPS", path: "/category/pfps" },
  { name: "Photography", path: "/category/photography" },
  { name: "Exhibition", path: "/category/exhibition" },
]

export default function CategoryNav() {
  const pathname = usePathname()
  const [activeCategory, setActiveCategory] = useState("All")

  return (
    <nav className="sticky top-16 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide scroll-smooth">
          {categories.map((category) => {
            const isActive = pathname === category.path || 
              (category.name !== "All" && pathname.startsWith(category.path))
            
            return (
              <Link
                key={category.name}
                href={category.path}
                onClick={() => setActiveCategory(category.name)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 sm:px-4 py-2 text-sm font-medium transition-all duration-200 min-w-fit",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              >
                {category.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
