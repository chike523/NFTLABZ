"use client"

import { useUserSession } from '@/hooks/use-user-session'
import UserGuard from '@/components/auth/user-guard'
import DashboardLayout from './layout'

interface ProtectedDashboardLayoutProps {
  children: React.ReactNode
}

export default function ProtectedDashboardLayout({ children }: ProtectedDashboardLayoutProps) {
  return (
    <UserGuard requireEmailVerification={false} requireActiveStatus={true}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </UserGuard>
  )
}
