"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function PageLoaderInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    
    // Minimum 500ms duration for perceived smoothness
    const timer = setTimeout(() => setLoading(false), 500)
    
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div className="h-full bg-primary/20">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out page-loader-progress"
        />
      </div>
    </div>
  )
}

export default function PageLoader() {
  return (
    <Suspense fallback={null}>
      <PageLoaderInner />
    </Suspense>
  )
}

