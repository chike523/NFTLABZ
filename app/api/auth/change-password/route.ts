import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5 // 5 attempts per window

// Password validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
})

// Common passwords to reject
const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
  'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1',
  'iloveyou', 'sunshine', 'princess', 'football', 'charlie', 'aa123456'
]

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(identifier)

  if (!userLimit) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (now > userLimit.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false
  }

  userLimit.count++
  return true
}

function isCommonPassword(password: string): boolean {
  return commonPasswords.includes(password.toLowerCase())
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password change request received')
    
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    
    console.log(`📍 Client IP: ${ip}`)
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      console.log('❌ Rate limit exceeded for IP:', ip)
      return NextResponse.json(
        { error: 'Too many password change attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    console.log('📝 Parsing request body...')
    const body = await request.json()
    const validation = changePasswordSchema.safeParse(body)

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors[0].message)
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data
    console.log('✅ Request validation passed')

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Check if new password is not a common password
    if (isCommonPassword(newPassword)) {
      return NextResponse.json(
        { error: 'Password is too common. Please choose a more unique password.' },
        { status: 400 }
      )
    }

    // Get Supabase client
    console.log('🔌 Creating Supabase client...')
    const supabase = await createClient()

    // Get current user
    console.log('👤 Getting current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ User authentication failed:', userError?.message)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.log('✅ User authenticated:', user.id)

    // Verify current password by attempting to sign in
    console.log('🔍 Verifying current password...')
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (verifyError) {
      console.log('❌ Current password verification failed:', verifyError.message)
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }
    
    console.log('✅ Current password verified')

    // Update password
    console.log('🔄 Updating password...')
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('❌ Password update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }
    
    console.log('✅ Password updated successfully')

    // Log successful password change (in production, use proper logging)
    console.log(`Password changed successfully for user: ${user.id}`)

    // Clear rate limit for successful change
    rateLimitStore.delete(ip)

    return NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully' 
    })

  } catch (error) {
    console.error('❌ Change password error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Clean up rate limit store periodically (in production, use a proper job scheduler)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW)
