"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import AuthFormInput from "@/components/auth-form-input"
import { userAuthService } from "@/lib/auth/user-auth"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    setLoading(true)

    try {
      // Use separate user auth service with admin blocking
      const result = await userAuthService.userSignIn(email, password)
      
      if (result.success) {
        setMessage("Sign in successful! Redirecting...")
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setMessage(result.error || 'Sign in failed')
      }
    } catch (err) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile: Centered Form | Desktop: Left Panel - Sign In Form */}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Sign In</h1>
              <p className="text-sm text-muted-foreground lg:hidden">Welcome back! Please sign in to your account.</p>
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

              <AuthFormInput
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                required
              />

              <div className="flex justify-between items-center">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {message && (
                <div className={`text-sm p-3 rounded-lg ${
                  message.includes('successful') 
                    ? 'text-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'text-red-500 bg-red-50 dark:bg-red-900/20'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-primary hover:text-primary/80 font-medium">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Promotional Content (Desktop Only) */}
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Hello, Friend!</h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
            Enter your personal details and take a journey with us
          </p>
          <Link 
            href="/auth/signup"
            className="inline-block border-2 border-primary text-primary px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors text-sm sm:text-base"
          >
            SIGN UP
          </Link>
        </div>
      </div>
    </div>
  )
}
