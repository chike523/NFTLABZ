"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import AdminGuard from "@/components/admin/admin-guard"

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [isLoginPage, setIsLoginPage] = useState(false)

  useEffect(() => {
    setIsLoginPage(pathname === "/admin/login")
  }, [pathname])

  // If it's the login page, show it without protection
  if (isLoginPage) {
    return <>{children}</>
  }

  // For all other admin pages, wrap with AdminGuard
  return (
    <AdminGuard requiredRole="admin">
      {children}
    </AdminGuard>
  )
}
