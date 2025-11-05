"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Mail, CheckCircle } from "lucide-react"
import AuthFormInput from "@/components/auth-form-input"
import { useAuth } from "@/contexts/auth-context"

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    setLoading(true)

    try {
      const result = await resetPassword(email)
      
      if (result.success) {
        setIsSubmitted(true)
        setMessage(result.message || 'Password reset email sent!')
      } else {
        setMessage(result.error || 'Failed to send reset email')
      }
    } catch (err) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          {/* Close Button */}
          <div className="flex justify-end mb-8">
            <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="h-6 w-6 text-muted-foreground" />
            </Link>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Check Your Email</h1>
              <p className="text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>

            <div className="space-y-4">
            <button
              onClick={() => {
                setIsSubmitted(false)
                setMessage("")
              }}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Send Another Email
            </button>
              
              <Link 
                href="/auth/signin"
                className="block text-center text-primary hover:text-primary/80 font-medium"
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
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        {/* Close Button */}
        <div className="flex justify-end mb-8">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-6 w-6 text-muted-foreground" />
          </Link>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AuthFormInput
              label="Email"
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={setEmail}
              required
            />

            {message && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-muted-foreground">
              Remember your password?{" "}
              <Link href="/auth/signin" className="text-primary hover:text-primary/80 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
