"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordValidation {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
  noCommonPasswords: boolean
}

export default function ChangePasswordPage() {
  const { user: authUser } = useAuth()
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    noCommonPasswords: false
  })

  // Common passwords to avoid
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
    'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1'
  ]

  // Validate password strength
  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommonPasswords: !commonPasswords.includes(password.toLowerCase())
    }
  }

  // Check if password is strong enough
  const isPasswordStrong = (validation: PasswordValidation): boolean => {
    return Object.values(validation).every(Boolean)
  }

  // Handle input changes
  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setMessage(null)

    // Validate new password in real-time
    if (field === 'newPassword') {
      setValidation(validatePassword(value))
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!authUser?.id) {
      setMessage({ type: 'error', text: 'User not authenticated' })
      return
    }

    // Validate form
    if (!form.currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Current password is required' })
      return
    }

    if (!form.newPassword.trim()) {
      setMessage({ type: 'error', text: 'New password is required' })
      return
    }

    if (!form.confirmPassword.trim()) {
      setMessage({ type: 'error', text: 'Please confirm your new password' })
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (form.currentPassword === form.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' })
      return
    }

    if (!isPasswordStrong(validation)) {
      setMessage({ type: 'error', text: 'Password does not meet security requirements' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password')
      }

      setMessage({ type: 'success', text: 'Password changed successfully!' })
      
      // Reset form
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      setValidation({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noCommonPasswords: false
      })

    } catch (error) {
      console.error('Password change error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to change password. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/settings/profile"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Change Password
            </h1>
            <p className="text-muted-foreground mt-1">
              Update your account password for better security
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <Alert className={message.type === 'error' ? 'border-destructive' : 'border-green-500'}>
            <div className="flex items-center gap-2">
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Password Form */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                Current Password *
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                New Password *
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {form.newPassword && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm font-medium text-foreground">Password Requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className={`flex items-center gap-2 ${validation.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="h-4 w-4" />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${validation.hasUppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="h-4 w-4" />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${validation.hasLowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="h-4 w-4" />
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${validation.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="h-4 w-4" />
                      One number
                    </div>
                    <div className={`flex items-center gap-2 ${validation.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="h-4 w-4" />
                      One special character
                    </div>
                    <div className={`flex items-center gap-2 ${validation.noCommonPasswords ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="h-4 w-4" />
                      Not a common password
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm New Password *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !isPasswordStrong(validation) || form.newPassword !== form.confirmPassword}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
              
              <Link href="/dashboard/settings/profile">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use a unique password that you don't use elsewhere</li>
            <li>• Consider using a password manager to generate and store strong passwords</li>
            <li>• Never share your password with anyone</li>
            <li>• Change your password regularly, especially if you suspect it may have been compromised</li>
            <li>• Enable two-factor authentication for additional security</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}