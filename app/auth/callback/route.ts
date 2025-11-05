import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if this is an admin login
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user is admin
        const { data: adminData } = await supabase
          .from('Admin')
          .select('role, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (adminData) {
          // Redirect to admin dashboard
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        }
      }
      
      // Redirect to regular dashboard or home
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
