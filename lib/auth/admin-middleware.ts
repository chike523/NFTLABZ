import { createClient } from '../supabase/server'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('🔒 Admin middleware: No authenticated user')
      redirect('/admin/login')
    }

    // Check if user has admin privileges
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('role, status, user_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (adminError || !adminData) {
      console.log('🔒 Admin middleware: User is not an admin')
      redirect('/admin/login')
    }

    // Return admin data for use in components
    return {
      user,
      admin: adminData,
      isAdmin: true
    }
  } catch (error) {
    console.error('🔒 Admin middleware error:', error)
    redirect('/admin/login')
  }
}

export async function requireSuperAdmin() {
  const adminData = await requireAdmin()
  
  if (adminData.admin.role !== 'super_admin') {
    console.log('🔒 Admin middleware: User is not a super admin')
    redirect('/admin/dashboard')
  }

  return adminData
}

export async function requireAdminRole(requiredRole: string) {
  const adminData = await requireAdmin()
  
  const roleHierarchy = {
    'super_admin': 4,
    'admin': 3,
    'moderator': 2,
    'support': 1
  }

  const userLevel = roleHierarchy[adminData.admin.role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  if (userLevel < requiredLevel) {
    console.log(`🔒 Admin middleware: User role ${adminData.admin.role} insufficient for ${requiredRole}`)
    redirect('/admin/dashboard')
  }

  return adminData
}
