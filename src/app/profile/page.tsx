"use client"

import { useEffect } from "react"
import Navbar from "@/components/ui/navbar"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ExperienceSection } from "@/components/profile/ExperienceSection"
import { EducationSection } from "@/components/profile/EducationSection"
import { SkillsSection } from "@/components/profile/SkillsSection"
import { LanguagesSection } from "@/components/profile/LanguagesSection"
import { useProfile } from "@/lib/hooks/useProfile"
import { toast } from "sonner"
import type { UserProfile } from "@/types"
import { Spinner } from "@/components/ui/spinner"

export default function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile();

  
  if (profile) {
    console.log('Profile loaded successfully:', profile.uid);
  }

  useEffect(() => {
    if (error) {
      console.error('Profile error:', error);
      toast.error(error);
    }
  }, [error]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-8 pt-8 px-2 xs:px-3 sm:px-6 mx-auto flex flex-col items-center justify-center">
          <Spinner variant="infinite" size={48} className="mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-8 pt-8 px-2 xs:px-3 sm:px-6 mx-auto">
          Please sign in to view your profile.
        </div>
      </main>
    );
  }

  const handleUpdate = async (updates: Partial<UserProfile>) => {
    console.log('ProfilePage - Attempting to update profile with:', updates);
    
    // Debug city, postalCode and volunteering updates specifically
    if ('city' in updates || 'postalCode' in updates) {
      console.log('ProfilePage - Updating location fields:', { 
        city: updates.city, 
        postalCode: updates.postalCode 
      });
    }
    
    if ('volunteering' in updates) {
      console.log('ProfilePage - Updating volunteering:', updates.volunteering);
    }
    
    try {
      const result = await updateProfile(updates);
      
      if (result) {
        console.log('ProfilePage - Update successful');
        toast.success('Profile updated successfully');
      } else {
        console.error('ProfilePage - Update failed');
        toast.error('Failed to update profile');
      }
    } catch (err) {
      console.error('ProfilePage - Failed to update profile:', err);
      toast.error('Failed to update profile');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 pt-8 px-2 xs:px-3 sm:px-6 md:px-8 mx-auto max-w-[calc(100%-8px)] xs:max-w-[calc(100%-16px)] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">
        <div className="space-y-6">
          <ProfileHeader profile={profile} onUpdate={handleUpdate} />
          
          <div className="grid gap-6">
            <ExperienceSection 
              experience={profile.experience} 
              onUpdate={(experiences) => handleUpdate({ experience: experiences })} 
            />
            
            <EducationSection 
              education={profile.education} 
              onUpdate={(education) => handleUpdate({ education })} 
            />
            
            <SkillsSection 
              skills={profile.skills} 
              onUpdate={(skills) => handleUpdate({ skills })} 
            />
            
            <LanguagesSection 
              languages={profile.languages} 
              onUpdate={(languages) => handleUpdate({ languages })} 
            />
          </div>
        </div>
      </div>
    </main>
  );
} 