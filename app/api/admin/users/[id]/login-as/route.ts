import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const adminClient = createAdminClient()
    
    console.log('🔐 Admin Login-as: Setting up auto-login for user:', id)
    
    // Get target user
    const { data: targetUser, error: targetError } = await adminClient.auth.admin.getUserById(id)
    
    if (targetError || !targetUser?.user?.email) {
      console.error('❌ User not found:', targetError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userEmail = targetUser.user.email
    console.log('✅ Found user:', userEmail)

    // Generate a temporary random password
    const tempPassword = `temp_${Math.random().toString(36).substring(2, 15)}${Date.now()}`
    
    // Update user's password temporarily
    const { error: updateError } = await adminClient.auth.admin.updateUserById(id, {
      password: tempPassword
    })
    
    if (updateError) {
      console.error('❌ Error setting temp password:', updateError)
      return NextResponse.json(
        { error: 'Failed to prepare user login' },
        { status: 500 }
      )
    }

    console.log('✅ Temporary login credentials created')

    // Return credentials for auto-login
    return NextResponse.json({ 
      email: userEmail,
      password: tempPassword
    })

  } catch (error) {
    console.error('Error in login-as endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

