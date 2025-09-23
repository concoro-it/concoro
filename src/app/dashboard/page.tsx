"use client"

import { useEffect } from "react"
import { JobAlertBanner } from "@/components/ui/JobAlertBanner"
import LeftSidebar from "@/components/layout/LeftSidebar"
import { useAuth } from "@/lib/hooks/useAuth"
import { useUserPreferences } from "@/lib/hooks/useUserPreferences"
import { hasFilledPreferences } from "@/lib/utils/preferences-utils"
import { useRouter } from "next/navigation"
import { UnifiedConcorsiSections } from "@/components/dashboard/UnifiedConcorsiSections"
import { Spinner } from '@/components/ui/spinner'

export default function DashboardPage() {
  const { user, loading: authLoading, initialized: authInitialized } = useAuth()
  const { preferences, loading: preferencesLoading } = useUserPreferences()
  const router = useRouter()

  // Redirect to sign-in if user is not authenticated
  useEffect(() => {
    if (authInitialized && !authLoading && !user) {
      router.replace('/signin')
    }
  }, [authInitialized, authLoading, user, router])

  if (authLoading || !authInitialized) {
    return (
      <div className="container py-8 pt-8 min-h-screen bg-background">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          <LeftSidebar />
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Spinner variant="infinite" size={48} className="mx-auto" />
              <p className="mt-4 text-gray-600">Initializing...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show redirect message if user is not authenticated
  if (!user) {
    return (
      <div className="container py-8 pt-8 min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Spinner size={48} className="mb-4" />
          <h3 className="text-lg font-medium mb-2">Redirecting to sign in...</h3>
          <p className="text-gray-500">
            Please wait while we redirect you to the sign-in page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 pt-8 min-h-screen bg-background mobile-box-padding">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <LeftSidebar />
        <div className="space-y-8">
          {/* Show JobAlertBanner only if user has not filled any preferences */}
          {!preferencesLoading && !hasFilledPreferences(preferences) && (
            <JobAlertBanner />
          )}

          {/* Unified Concorsi Sections */}
          <UnifiedConcorsiSections />
        </div>
      </div>
    </div>
  )
} 