"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, X, User } from "lucide-react"
import DashboardLayout from "@/components/dashboard/layout"
import ImageUpload from "@/components/dashboard/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { userQueries } from "@/lib/queries"
import { uploadFile } from "@/lib/utils/file-upload"
import { useSupportEmail } from '@/hooks/use-settings'

interface UserProfile {
  username: string
  display_name: string
  email: string
  bio: string
  avatar: string | File | null
  bannerImage: string | File | null
}

export default function EditProfilePage() {
  const { user: authUser } = useAuth()
  const supportEmail = useSupportEmail()
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    display_name: "",
    email: "",
    bio: "",
    avatar: null,
    bannerImage: null
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser?.id) return

      try {
        setIsLoading(true)
        const { data: userProfile, error } = await userQueries.getUserProfile(authUser.id)
        
        if (error) {
          console.error('Error fetching user profile:', error)
          setMessage({ type: 'error', text: 'Failed to load profile data' })
          return
        }

        if (userProfile) {
          setProfile({
            username: userProfile.username || "",
            display_name: userProfile.display_name || "",
            email: authUser.email || "",
            bio: userProfile.bio || "",
            avatar: userProfile.avatar_url || null,
            bannerImage: userProfile.cover_image_url || null
          })
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setMessage({ type: 'error', text: 'Failed to load profile data' })
      } finally {
        setIsLoading(false)
        setInitialLoad(false)
      }
    }

    fetchUserProfile()
  }, [authUser?.id])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setMessage(null)
  }

  const handleImageChange = (field: 'avatar' | 'bannerImage', file: File | null) => {
    setProfile(prev => ({ ...prev, [field]: file }))
    setMessage(null)
  }

  const handleSave = async () => {
    if (!authUser?.id) {
      setMessage({ type: 'error', text: 'User not authenticated' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // Validate required fields
      if (!profile.username.trim()) {
        setMessage({ type: 'error', text: 'Username is required' })
        return
      }
      if (!profile.display_name.trim()) {
        setMessage({ type: 'error', text: 'Display name is required' })
        return
      }

      // Prepare update data
      const updateData: any = {
        username: profile.username.trim(),
        display_name: profile.display_name.trim(),
        bio: profile.bio.trim()
      }

      // Handle image uploads
      if (profile.avatar instanceof File) {
        const avatarResult = await uploadFile(profile.avatar, 'avatars')
        if (!avatarResult.success) {
          setMessage({ type: 'error', text: `Avatar upload failed: ${avatarResult.error}` })
          return
        }
        updateData.avatar_url = avatarResult.url
      } else if (typeof profile.avatar === 'string') {
        updateData.avatar_url = profile.avatar
      }

      if (profile.bannerImage instanceof File) {
        const bannerResult = await uploadFile(profile.bannerImage, 'banners')
        if (!bannerResult.success) {
          setMessage({ type: 'error', text: `Banner upload failed: ${bannerResult.error}` })
          return
        }
        updateData.cover_image_url = bannerResult.url
      } else if (typeof profile.bannerImage === 'string') {
        updateData.cover_image_url = profile.bannerImage
      }

      // Update user profile in database
      const { data, error } = await userQueries.updateUserProfile(authUser.id, updateData)
      
      if (error) {
        throw new Error(error)
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Update local state with the returned data
      if (data) {
        setProfile(prev => ({
          ...prev,
          username: data.username || prev.username,
          display_name: data.display_name || prev.display_name,
          bio: data.bio || prev.bio,
          avatar: data.avatar_url || prev.avatar,
          bannerImage: data.cover_image_url || prev.bannerImage
        }))
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile. Please try again.' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to current database values
    if (authUser?.id) {
      const fetchUserProfile = async () => {
        try {
          const { data: userProfile } = await userQueries.getUserProfile(authUser.id)
          if (userProfile) {
            setProfile({
              username: userProfile.username || "",
              display_name: userProfile.display_name || "",
              email: authUser.email || "",
              bio: userProfile.bio || "",
              avatar: userProfile.avatar_url || null,
              bannerImage: userProfile.cover_image_url || null
            })
          }
        } catch (error) {
          console.error('Error fetching user profile for cancel:', error)
        }
      }
      fetchUserProfile()
    }
    setMessage(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Update your personal information and profile settings
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          {initialLoad ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-32 rounded-full mx-auto" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          ) : (
            <form className="space-y-6">
            {/* Banner Image */}
            <ImageUpload
              label="Banner Image"
              currentImage={typeof profile.bannerImage === 'string' ? profile.bannerImage : undefined}
              onImageChange={(file) => handleImageChange('bannerImage', file)}
              aspectRatio="16/9"
            />

            {/* Avatar */}
            <ImageUpload
              label="Profile Picture"
              currentImage={typeof profile.avatar === 'string' ? profile.avatar : undefined}
              onImageChange={(file) => handleImageChange('avatar', file)}
              aspectRatio="1/1"
            />

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Username *
              </label>
              <Input
                value={profile.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                className="text-sm sm:text-base"
                disabled={isSaving}
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Display Name *
              </label>
              <Input
                value={profile.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Enter your display name"
                className="text-sm sm:text-base"
                disabled={isSaving}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                type="email"
                value={profile.email}
                placeholder="Email (read-only)"
                className="text-sm sm:text-base bg-muted cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support at {supportEmail} if needed.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Bio
              </label>
              <Textarea
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="text-sm sm:text-base resize-none"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                {profile.bio.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || initialLoad}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving || initialLoad}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
