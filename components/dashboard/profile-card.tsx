"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Lock, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { userQueries } from "@/lib/queries"

export default function ProfileCard() {
  const { user: authUser } = useAuth()
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bio, setBio] = useState("")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser?.id) return

      try {
        setLoading(true)
        const { data: profile, error } = await userQueries.getUserProfile(authUser.id)
        if (!error && profile) {
          setUserProfile(profile)
          setBio(profile.bio || "")
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [authUser?.id])

  const handleSaveBio = async () => {
    if (!authUser?.id) return

    try {
      const { error } = await userQueries.updateUserProfile(authUser.id, { bio })
      if (!error) {
        setIsEditingBio(false)
        // Update local state
        setUserProfile(prev => prev ? { ...prev, bio } : null)
      }
    } catch (error) {
      console.error('Error updating bio:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
        </div>
        <div className="pt-6 text-center space-y-2">
          <Skeleton className="h-5 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Banner Image with Avatar */}
      <div className="relative">
        <div 
          className="h-24 w-full rounded-lg bg-cover bg-center"
          style={{ 
            backgroundImage: userProfile?.cover_image_url 
              ? `url('${userProfile.cover_image_url}')` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        />
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="w-12 h-12 rounded-full bg-card border-2 border-background overflow-hidden">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile.username || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="pt-6 text-center space-y-2">
        <h3 className="font-semibold text-foreground">
          {userProfile?.display_name || userProfile?.username || 'Unknown User'}
        </h3>
        <p className="text-sm text-muted-foreground">@{userProfile?.username || 'username'}</p>
        {authUser?.email && (
          <p className="text-xs text-muted-foreground">{authUser.email}</p>
        )}
      </div>

      {/* Bio Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Bio</label>
        {isEditingBio ? (
          <div className="space-y-2">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="min-h-[80px] resize-none"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSaveBio}
                className="flex-1"
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setIsEditingBio(false)
                  setBio(userProfile?.bio || "")
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="min-h-[80px] p-3 bg-muted rounded-lg text-sm text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => setIsEditingBio(true)}
          >
            {bio || "Click to add a bio..."}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Link href="/dashboard/settings/profile">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
        <Link href="/dashboard/settings/password">
          <Button variant="outline" className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </Link>
          </div>
        </div>
      )
    }
