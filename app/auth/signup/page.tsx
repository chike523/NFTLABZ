"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, CheckCircle, XCircle } from "lucide-react"
import AuthFormInput from "@/components/auth-form-input"
import { userAuthService } from "@/lib/auth/user-auth"

export default function SignUpPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form')
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    // Validation
    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long")
      return
    }

    if (!/[A-Z]/.test(password)) {
      setMessage("Password must contain at least one uppercase letter")
      return
    }

    if (!/[a-z]/.test(password)) {
      setMessage("Password must contain at least one lowercase letter")
      return
    }

    if (!/[0-9]/.test(password)) {
      setMessage("Password must contain at least one number")
      return
    }

    setLoading(true)

    try {
      // Use separate user auth service with admin email blocking
      const result = await userAuthService.userSignUp(email, password, username)
      
      if (result.success) {
        setStatus('success')
        setMessage(result.message || 'Account created successfully!')
      } else {
        setStatus('error')
        setMessage(result.error || 'Sign up failed')
      }
    } catch (err) {
      setStatus('error')
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Promotional Content (Desktop Only) */}
      <div className="hidden lg:flex w-1/3 relative bg-card items-center justify-center p-8">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/auth-img.png')" }}
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content with relative positioning to stay on top */}
        <div className="relative z-10 text-center text-card-foreground">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
            To stay connected with us, please login with your personal info
          </p>
          <Link 
            href="/auth/signin"
            className="inline-block border-2 border-primary text-primary px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors text-sm sm:text-base"
          >
            SIGN IN
          </Link>
        </div>
      </div>

      {/* Mobile: Centered Form | Desktop: Right Panel - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md lg:max-w-md">
          {/* Close Button */}
          <div className="flex justify-end mb-6 lg:mb-8">
            <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="h-6 w-6 text-muted-foreground" />
            </Link>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create Account</h1>
              <p className="text-sm text-muted-foreground lg:hidden">Join us today! Create your account to get started.</p>
            </div>

            {status === 'success' ? (
              <div className="text-center space-y-6">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                <h2 className="text-xl font-semibold text-foreground">Check Your Email!</h2>
                <p className="text-muted-foreground">{message}</p>
                <div className="space-y-4">
                  <Link
                    href="/auth/verify-email"
                    className="inline-block w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Verify Email
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="inline-block w-full border border-input bg-background text-foreground py-3 px-4 rounded-lg font-medium hover:bg-accent transition-colors"
                  >
                    Sign In Instead
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <AuthFormInput
                  label="Username"
                  type="text"
                  placeholder="johnson-art"
                  value={username}
                  onChange={setUsername}
                  required
                />

                <AuthFormInput
                  label="Email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={setEmail}
                  required
                />

                <AuthFormInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required
                />

                <AuthFormInput
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  required
                />

                {message && (
                  <div className={`text-sm p-3 rounded-lg ${
                    status === 'error' 
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'text-green-500 bg-green-50 dark:bg-green-900/20'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            )}

            <div className="text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:text-primary/80 font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
