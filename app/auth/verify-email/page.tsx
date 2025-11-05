"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<'checking' | 'verified' | 'error'>('checking')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const emailParam = searchParams.get('email')

    if (emailParam) {
      setEmail(emailParam)
    }

    if (token && type === 'signup') {
      // Email verification is handled by Supabase automatically
      // This page is just for user feedback
      setStatus('verified')
    } else if (user?.email_confirmed_at) {
      setStatus('verified')
    } else {
      setStatus('error')
    }
  }, [searchParams, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Back Button */}
        <div className="flex justify-start">
          <Link 
            href="/auth/signin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>

        <div className="text-center space-y-6">
          {status === 'checking' && (
            <>
              <Mail className="h-16 w-16 mx-auto text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
              <p className="text-muted-foreground">
                We've sent a verification link to your email address.
              </p>
              {email && (
                <p className="text-sm text-muted-foreground">
                  <strong>{email}</strong>
                </p>
              )}
            </>
          )}

          {status === 'verified' && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h1 className="text-2xl font-bold text-foreground">Email Verified!</h1>
              <p className="text-muted-foreground">
                Your email has been successfully verified. You can now access all features.
              </p>
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  className="inline-block w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/"
                  className="inline-block w-full border border-input bg-background text-foreground py-3 px-4 rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-500" />
              <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
              <p className="text-muted-foreground">
                The verification link may have expired or is invalid.
              </p>
              <div className="space-y-4">
                <Link
                  href="/auth/signin"
                  className="inline-block w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Sign In Again
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-block w-full border border-input bg-background text-foreground py-3 px-4 rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  Create New Account
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Didn't receive the email?</p>
          <p>Check your spam folder or try signing in again.</p>
        </div>
      </div>
    </div>
  )
}
