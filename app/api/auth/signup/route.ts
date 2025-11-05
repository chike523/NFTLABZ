import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmailNotificationService } from '@/lib/email/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username } = body

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, password, and username are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check if email is an admin email
    const { data: adminCheck } = await adminClient
      .from('Admin')
      .select('user_id')
      .eq('user_id', email)
      .maybeSingle()

    if (adminCheck) {
      return NextResponse.json({ error: 'This email is reserved for administrative use' }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username
        }
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
    }

    // Create profile in Users table
    const { error: userError } = await adminClient
      .from('Users')
      .insert({
        id: authData.user.id,
        username,
        display_name: username,
        email,
        status: 'active'
      })

    if (userError) {
      // Rollback: delete auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Send welcome email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const siteName = 'Artistrytonal'
    
    EmailNotificationService.sendWelcome(email, {
      username,
      email,
      siteName,
      siteUrl
    }).catch(err => console.error('[Email] Welcome email failed:', err))

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Check your email for verification link.',
      user: authData.user
    }, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

