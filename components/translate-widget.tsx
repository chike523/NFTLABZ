"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function TranslateWidget() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't load translate widget on admin pages
    if (pathname?.startsWith("/admin")) {
      return
    }

    // Check if scripts are already loaded
    if (document.querySelector('script[src*="gtranslate"]')) {
      return
    }

    // Set up GTranslate settings
    if (typeof window !== "undefined") {
      ;(window as any).gtranslateSettings = {
        default_language: "en",
        wrapper_selector: ".gtranslate_wrapper",
        horizontal_position: "left",
        vertical_position: "bottom",
      }
    }

    // Load the GTranslate script
    const script = document.createElement("script")
    script.src = "https://cdn.gtranslate.net/widgets/latest/dropdown.js"
    script.defer = true
    document.body.appendChild(script)

    return () => {
      // Cleanup: remove script on unmount or when pathname changes to admin
      const existingScript = document.querySelector('script[src*="gtranslate"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [pathname])

  // Don't render the wrapper div on admin pages
  if (pathname?.startsWith("/admin")) {
    return null
  }

  return <div className="gtranslate_wrapper"></div>
}

