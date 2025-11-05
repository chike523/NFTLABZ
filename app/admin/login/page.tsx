"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthFormInput from "@/components/auth-form-input"
import { adminAuthService } from "@/lib/auth/admin-auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Check if already logged in as admin
    const checkAdminSession = async () => {
      const admin = await adminAuthService.getCurrentAdmin()
      if (admin) {
        router.push("/admin/dashboard")
      }
    }
    checkAdminSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      // Use separate admin auth service
      const result = await adminAuthService.adminSignIn(email, password)
      
      if (result.success) {
        setMessage("Admin login successful! Redirecting...")
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 1000)
      } else {
        setMessage(result.error || 'Sign in failed')
        setLoading(false)
      }
    } catch (err) {
      setMessage('An unexpected error occurred')
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <Link href="/" className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <X className="h-6 w-6 text-gray-400" />
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-2">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-gray-400 mt-1">Sign in to manage the platform</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AuthFormInput
              label="Email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={setEmail}
              required
            />

            <AuthFormInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Remember me</span>
              </label>
              <Link 
                href="/admin/forgot-password" 
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Forgot password?
              </Link>
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-lg ${
                message.includes('successful') 
                  ? 'text-green-400 bg-green-500/10' 
                  : 'text-red-400 bg-red-500/10'
              }`}>
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Only authorized administrators can access this panel
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
