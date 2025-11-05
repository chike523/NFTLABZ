"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  CreditCard, 
  FolderOpen, 
  MessageCircle, 
  Settings, 
  LogOut,
  Shield 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSiteName } from "@/hooks/use-settings"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users
  },
  {
    name: "NFTs",
    href: "/admin/nfts",
    icon: Layers
  },
  {
    name: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: FolderOpen
  },
  {
    name: "Support",
    href: "/admin/support",
    icon: MessageCircle
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings
  }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const siteName = useSiteName()

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
      }
      
      // Clear any local storage
      localStorage.removeItem("adminSession")
      
      // Redirect to login page
      window.location.href = "/admin/login"
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if logout fails
      window.location.href = "/admin/login"
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-white">Admin Panel</span>
            <span className="text-xs text-gray-400">{siteName}</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout - Always at bottom */}
      <div className="mt-auto p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
