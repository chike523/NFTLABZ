"use client"

import { useFavicon } from "@/hooks/use-settings"
import { useEffect } from "react"

export function DynamicFavicon() {
  const favicon = useFavicon()

  useEffect(() => {
    if (!favicon) {
      return
    }

    const setFavicon = (rel: string, type?: string, sizes?: string) => {
      const selector = `link[data-dynamic-favicon="${rel}"]`
      let link = document.querySelector(selector) as HTMLLinkElement | null

      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        link.dataset.dynamicFavicon = rel
        if (type) link.type = type
        if (sizes) link.sizes = sizes
        document.head.appendChild(link)
      }

      link.href = favicon
    }

    // Update or create dynamic favicon links
    setFavicon('icon', 'image/svg+xml')
    setFavicon('icon', 'image/png')
    setFavicon('shortcut icon')
    setFavicon('apple-touch-icon', undefined, '180x180')

  }, [favicon])

  return null
}
