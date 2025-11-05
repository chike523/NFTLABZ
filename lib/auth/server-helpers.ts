import { createClient } from '../supabase/server'

// Server-side auth helpers (only for use in Server Components and API routes)

export async function getServerUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null

    // Get user profile from Users table
    const { data: profile } = await supabase
      .from('Users')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      ...user,
      profile
    }
  } catch (error) {
    return null
  }
}

export async function getServerAdmin(userId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('Admin')
      .select('role, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) return null

    return {
      isAdmin: true,
      role: data.role
    }
  } catch (error) {
    return null
  }
}
