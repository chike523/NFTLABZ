import { requireAdmin } from '@/lib/auth/admin-middleware'
import { ReactNode } from 'react'

interface ProtectedAdminPageProps {
  children: ReactNode
  requiredRole?: 'super_admin' | 'admin' | 'moderator' | 'support'
}

export default async function ProtectedAdminPage({ 
  children, 
  requiredRole = 'admin' 
}: ProtectedAdminPageProps) {
  // This will redirect if not admin
  const adminData = await requireAdmin()
  
  // If we get here, user is authenticated and has admin privileges
  return <>{children}</>
}
