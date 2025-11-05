"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { user, isAdmin, loading } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!loading) {
      if (user) {
        setStatus('success')
        
        // Redirect based on user type
        setTimeout(() => {
          if (isAdmin) {
            router.push('/admin/dashboard')
          } else {
            router.push('/dashboard')
          }
        }, 2000)
      } else {
        setStatus('error')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      }
    }
  }, [user, isAdmin, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
              <h1 className="text-2xl font-bold text-foreground">Verifying...</h1>
              <p className="text-muted-foreground">
                Please wait while we verify your account.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h1 className="text-2xl font-bold text-foreground">Success!</h1>
              <p className="text-muted-foreground">
                Your account has been verified successfully.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-500" />
              <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
              <p className="text-muted-foreground">
                There was an error verifying your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to sign in...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
