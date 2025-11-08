"use client"

/**
 * Supabase setup: ensure `https://artistichubworldwide.com/auth/reset-password`
 * is listed under Authentication → URL Configuration → Redirect URLs so reset links
 * sent via email are accepted across devices.
 */

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import AuthFormInput from "@/components/auth-form-input"
import { createClient } from "@/lib/supabase/client"

type ViewState = "verifying" | "form" | "success" | "error"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewState, setViewState] = useState<ViewState>("verifying")
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const code = searchParams.get("code")

    if (!code) {
      setMessage("Invalid or expired reset link. Please request a new password reset.")
      setViewState("error")
      return
    }

    const verifyLink = async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Password reset verification failed:", error)
        setMessage("Invalid or expired reset link. Please request a new password reset.")
        setViewState("error")
        return
      }

      setViewState("form")
    }

    verifyLink()
  }, [searchParams])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage("")

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.")
      return
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setMessage("Password must include uppercase, lowercase, and numeric characters.")
      return
    }

    setSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error("Password update failed:", error)
      setMessage(error.message || "Failed to update password.")
      setSubmitting(false)
      return
    }

    setViewState("success")
    setMessage("Password updated successfully! Redirecting to sign in...")
    setSubmitting(false)
    setTimeout(() => router.push("/auth/signin"), 3000)
  }

  if (viewState === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">Verifying reset link…</h1>
          <p className="text-sm text-muted-foreground">
            Hang tight while we confirm this password reset request.
          </p>
        </div>
      </div>
    )
  }

  if (viewState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
          <h1 className="text-2xl font-bold text-foreground">Password Updated!</h1>
          <p className="text-muted-foreground">
            {message || "Your password has been updated successfully."}
          </p>
          <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
          <Link
            href="/auth/signin"
            className="inline-block bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (viewState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <XCircle className="h-16 w-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
          <p className="text-muted-foreground">
            {message || "The password reset link may have expired or is invalid."}
          </p>
          <div className="space-y-3">
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
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
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
            <p className="text-muted-foreground">Enter your new password below.</p>
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

            {message && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Updating..." : "Update Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
