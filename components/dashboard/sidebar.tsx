"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useSiteName } from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useCallback } from "react"
import { 
  FileText, 
  Edit, 
  User, 
  CreditCard, 
  Building, 
  Layers, 
  LogOut,
  ArrowDownCircle,
  ArrowUpCircle,
  HelpCircle,
  Tag
} from "lucide-react"

const navigationItems = [
  {
    name: "Account Overview",
    href: "/dashboard",
    icon: FileText,
    badgeKey: null
  },
  {
    name: "Deposit",
    href: "/dashboard/deposit",
    icon: ArrowDownCircle,
    badgeKey: null
  },
  {
    name: "Mint NFT",
    href: "/dashboard/mint",
    icon: Edit,
    badgeKey: null
  },
  {
    name: "My NFT Profile",
    href: "/dashboard/profile",
    icon: User,
    badgeKey: "profile"
  },
  {
    name: "My Bids",
    href: "/dashboard/bids",
    icon: Tag,
    badgeKey: "bids"
  },
  {
    name: "Transaction",
    href: "/dashboard/transactions",
    icon: CreditCard,
    badgeKey: "transactions"
  },
  {
    name: "Withdraw",
    href: "/dashboard/withdraw",
    icon: ArrowUpCircle,
    badgeKey: null
  },
  {
    name: "Marketplace",
    href: "/",
    icon: Building,
    badgeKey: null
  },
  {
    name: "NFT Transactions",
    href: "/dashboard/nft-transactions",
    icon: Layers,
    badgeKey: "nft-transactions"
  },
  {
    name: "Support",
    href: "/dashboard/support",
    icon: HelpCircle,
    badgeKey: "support"
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, user } = useAuth()
  const siteName = useSiteName()
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({})

  const fetchBadgeCounts = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/dashboard/badge-counts')
      const data = await response.json()
      
      if (response.ok && data.counts) {
        setBadgeCounts(data.counts)
      }
    } catch (error) {
      console.error('Failed to fetch badge counts:', error)
    }
  }, [user?.id])

  // Fetch badge counts on mount and when user changes
  useEffect(() => {
    fetchBadgeCounts()

    // Refresh badge counts every 30 seconds
    const interval = setInterval(fetchBadgeCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchBadgeCounts])

  useEffect(() => {
    if (!user?.id) return

    const handleRefresh = () => {
      fetchBadgeCounts()
    }

    window.addEventListener('dashboard:refresh-badges', handleRefresh)
    return () => {
      window.removeEventListener('dashboard:refresh-badges', handleRefresh)
    }
  }, [fetchBadgeCounts, user?.id])

  const handleNavClick = async (item: typeof navigationItems[0], e: React.MouseEvent) => {
    // Mark page as read when navigating
    if (item.badgeKey) {
      try {
        await fetch('/api/dashboard/mark-page-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_name: item.badgeKey })
        })
        
        // Clear the badge count immediately for better UX
        setBadgeCounts(prev => ({ ...prev, [item.badgeKey as string]: 0 }))
      } catch (error) {
        console.error('Failed to mark page as read:', error)
      }
    }
  }

  const handleLogout = async () => {
    try {
      console.log('🔒 User Dashboard: Starting logout process...')
      
      // Direct logout without complex state management
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
      
      console.log('🔒 User Dashboard: Logout successful, redirecting to signin...')
      
      // Immediate redirect to avoid React state issues
      window.location.href = '/auth/signin'
      
    } catch (error) {
      console.error('🔒 User Dashboard: Logout error:', error)
      // Force redirect even if logout fails
      window.location.href = '/auth/signin'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
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
          <span className="text-xl font-semibold text-foreground">{siteName}</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && item.href !== "/" && pathname.startsWith(item.href))
          const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(item, e)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {badgeCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-auto h-5 min-w-[20px] px-1.5 text-xs font-semibold"
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out - Always at bottom */}
      <div className="mt-auto p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
