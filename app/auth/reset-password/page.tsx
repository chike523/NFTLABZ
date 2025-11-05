"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import AuthFormInput from '@/components/auth-form-input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form')
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if we have the necessary tokens in URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      setStatus('error')
      setError('Invalid or expired reset link. Please request a new password reset.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(password)
      
      if (result.success) {
        setStatus('success')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        setError(result.error || 'Failed to update password')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-6">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h1 className="text-2xl font-bold text-foreground">Password Updated!</h1>
            <p className="text-muted-foreground">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to sign in...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-6">
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
            <p className="text-muted-foreground">
              {error}
            </p>
            <div className="space-y-4">
              <Link
                href="/auth/forgot-password"
                className="inline-block w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/auth/signin"
                className="inline-block w-full border border-input bg-background text-foreground py-3 px-4 rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
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

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <AuthFormInput
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <AuthFormInput
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Password requirements:</p>
            <ul className="text-xs space-y-1 mt-2">
              <li>• At least 8 characters</li>
              <li>• One uppercase letter</li>
              <li>• One lowercase letter</li>
              <li>• One number</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
