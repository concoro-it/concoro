"use client"

import { useState } from "react"
import { MapPin, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import type { UserProfile } from "@/types"
import { uploadImage } from "@/lib/firebase/services"
import { useAuth } from "@/lib/hooks/useAuth"
import { EditProfileDialog } from "./EditProfileDialog"
import { updateProfile } from "firebase/auth"

interface ProfileHeaderProps {
  profile: UserProfile
  onUpdate: (updates: Partial<UserProfile>) => void
}

export function ProfileHeader({ profile, onUpdate }: ProfileHeaderProps) {
  const { user } = useAuth()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  
  // Use firstName and lastName directly from profile
  const firstName = profile.firstName || ''
  const lastName = profile.lastName || ''


  
  // Ensure these values are treated as strings
  const locationInfo = {
    country: 'Italia',
    region: profile.region ? String(profile.region) : '',
    city: profile.city ? String(profile.city) : '',
    postalCode: profile.postalCode ? String(profile.postalCode) : ''
  }

  // Create a horizontal location string without labels
  const locationParts = [
    locationInfo.city,
    locationInfo.region,
    locationInfo.postalCode,
    'Italia'
  ].filter(Boolean);
  
  const locationText = locationParts.join(', ');
  
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      const imageUrl = await uploadImage(user.uid, file, `profile/profile-picture-${Date.now()}`)
      
      // Update profile in Firestore with the correct field name
      await onUpdate({ 
        profilePicture: imageUrl,
      })
      
      // Update Firebase Auth user photoURL to keep avatar in sync
      try {
        await updateProfile(user, {
          photoURL: imageUrl
        })
        } catch (authError) {
        console.error("Error updating Firebase Auth photoURL:", authError)
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Geometric Texture Background */}
        <div className="relative h-36 xs:h-48">
          <Image
            src="/images/geometric-texture.jpg"
            alt="Profile background"
            className="object-cover"
            fill
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
        </div>

        <div className="relative px-3 xs:px-6 pb-4 xs:pb-6">
          {/* Profile Picture */}
          <div className="relative -mt-16 xs:-mt-20 inline-block">
            <div className="relative h-32 w-32 xs:h-40 xs:w-40 overflow-hidden rounded-full border-4 border-background bg-gray-100">
              {profile.profilePicture ? (
                <Image
                  src={profile.profilePicture}
                  alt={profile.displayName || ''}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl xs:text-4xl font-semibold text-gray-400">
                  {firstName[0] || ''}
                  {lastName[0] || ''}
                </div>
              )}
            </div>
            <label
              htmlFor="profile-upload"
              className="absolute bottom-1 xs:bottom-2 right-1 xs:right-2 cursor-pointer"
            >
              <div className="rounded-full bg-primary p-1.5 xs:p-2 text-primary-foreground hover:bg-primary/90">
                <Pencil className="h-3 w-3 xs:h-4 xs:w-4" />
              </div>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureUpload}
              />
            </label>
          </div>

          {/* Profile Info */}
          <div className="mt-3 xs:mt-4 space-y-1">
            <div className="flex justify-between items-center">
              <h1 className="text-xl xs:text-2xl font-bold truncate">
                {firstName} {lastName}
              </h1>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 px-2 xs:px-3"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="mr-1 xs:mr-2 h-3 w-3 xs:h-4 xs:w-4" />
                Modifica
              </Button>
            </div>
            
            <div className="flex items-center text-xs xs:text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 xs:h-4 xs:w-4 shrink-0 mr-1" />
              <span className="truncate">{locationText}</span>
            </div>
          </div>
        </div>
      </Card>

      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        profile={profile}
        onUpdate={onUpdate}
      />
    </>
  )
} 