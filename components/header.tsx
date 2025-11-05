"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Menu, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import UserNav from "@/components/user/user-nav"
import { useSiteName, useLogo } from "@/hooks/use-settings"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const siteName = useSiteName()
  const { light: lightLogo, dark: darkLogo } = useLogo()

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.data) {
        setSearchResults(data.data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  const closeSearch = () => {
    setIsSearchOpen(false)
    setSearchQuery("")
    setSearchResults([])
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {lightLogo || darkLogo ? (
              <div className="flex items-center gap-2">
                {/* Light logo for light mode */}
                {lightLogo && (
                  <Image
                    src={lightLogo}
                    alt={siteName}
                    width={32}
                    height={32}
                    className="h-8 w-auto dark:hidden"
                  />
                )}
                {/* Dark logo for dark mode */}
                {darkLogo && (
                  <Image
                    src={darkLogo}
                    alt={siteName}
                    width={32}
                    height={32}
                    className="h-8 w-auto hidden dark:block"
                  />
                )}
                {/* Fallback if no dark logo */}
                {lightLogo && !darkLogo && (
                  <Image
                    src={lightLogo}
                    alt={siteName}
                    width={32}
                    height={32}
                    className="h-8 w-auto"
                  />
                )}
                <span className="text-lg sm:text-xl font-semibold">{siteName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-primary-foreground"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-lg sm:text-xl font-semibold">{siteName}</span>
              </div>
            )}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {/* Expandable Search Bar */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search NFTs..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-64 pr-10"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={closeSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-lg hover:bg-accent"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            )}

            {/* Search Results Dropdown */}
            {isSearchOpen && (searchQuery.trim().length >= 2 || searching) && (
              <div className="absolute top-full mt-2 right-0 w-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-muted-foreground">No NFTs found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try different keywords</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((nft) => (
                      <Link
                        key={nft.id}
                        href={`/nft/${nft.id}`}
                        onClick={closeSearch}
                        className="flex gap-3 p-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                      >
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={nft.image_url || '/placeholder.svg'}
                            alt={nft.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{nft.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {nft.creator_name || 'Unknown Artist'}
                          </p>
                          {nft.price_eth && (
                            <p className="text-sm font-medium mt-1">{nft.price_eth} ETH</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <UserNav />
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 rounded-lg hover:bg-accent"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pr-10"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={closeSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Search Results */}
            {(searchQuery.trim().length >= 2 || searching) && (
              <div className="mt-3 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-muted-foreground">No NFTs found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try different keywords</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((nft) => (
                      <Link
                        key={nft.id}
                        href={`/nft/${nft.id}`}
                        onClick={closeSearch}
                        className="flex gap-3 p-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                      >
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={nft.image_url || '/placeholder.svg'}
                            alt={nft.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{nft.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {nft.creator_name || 'Unknown Artist'}
                          </p>
                          {nft.price_eth && (
                            <p className="text-sm font-medium mt-1">{nft.price_eth} ETH</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <button 
              className="flex items-center gap-4 w-full text-left hover:bg-accent rounded-lg p-2 transition-colors"
              onClick={() => {
                setIsSearchOpen(true)
                setIsMenuOpen(false)
              }}
            >
              <div className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center">
                <Search className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">Search NFTs</span>
            </button>
            
            <div onClick={() => setIsMenuOpen(false)}>
              <UserNav />
            </div>
          </div>
        </div>
      )}

    </header>
  )
}
