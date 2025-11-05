import { createClient } from '../supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('🔒 User middleware: No authenticated user')
      redirect('/auth/signin')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('🔒 User middleware: Profile not found, creating...')
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0],
          display_name: user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split('@')[0],
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
          status: 'active'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        redirect('/auth/signin')
      }

      return {
        user,
        profile: newProfile,
        isAuthenticated: true
      }
    }

    // Return user data for use in components
    return {
      user,
      profile,
      isAuthenticated: true
    }
  } catch (error) {
    console.error('🔒 User middleware error:', error)
    redirect('/auth/signin')
  }
}

export async function requireVerifiedEmail() {
  const authData = await requireAuth()
  
  if (!authData.user.email_confirmed_at) {
    console.log('🔒 User middleware: Email not verified')
    redirect('/auth/verify-email')
  }

  return authData
}

export async function requireActiveUser() {
  const authData = await requireAuth()
  
  if (authData.profile.status !== 'active') {
    console.log('🔒 User middleware: User account is not active')
    redirect('/auth/signin?error=account_inactive')
  }

  return authData
}
