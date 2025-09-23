"use client"

import { useDashboardData } from "@/lib/hooks/useDashboardData"
import { ClosingTodaySection } from "./ClosingTodaySection"
import { NuoviConcorsiSection } from "./NuoviConcorsiSection"
import { MaxiConcorsiSection } from "./MaxiConcorsiSection"
import { MatchedConcorsi } from "./MatchedConcorsi"
import { SavedConcorsiSection } from "./SavedConcorsiSection"
import { useAuth } from "@/lib/hooks/useAuth"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"

export function UnifiedConcorsiSections() {
  const { user } = useAuth()
  const { savedConcorsiIds } = useSavedConcorsi()
  const { 
    closingToday, 
    newest, 
    maxi, 
    matched, 
    saved, 
    isLoading, 
    error 
  } = useDashboardData(user?.uid || '')

  if (error) {
    return (
      <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-red-200 bg-red-50 shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-red-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2 text-red-800">Errore di caricamento</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Matched Concorsi Section */}
      {user && (
        <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-foreground">Le opportunità selezionate per te</h2>
          </div>
          <MatchedConcorsi userId={user.uid} limit={3} />
        </div>
      )}

      {/* Saved Concorsi Section - only show if user has saved concorsi */}
      {savedConcorsiIds.length > 0 && (
        <SavedConcorsiSection />
      )}

      {/* Scadono oggi Section */}
      <ClosingTodaySection concorsi={closingToday} isLoading={isLoading} />

      {/* Nuovi concorsi Section */}
      <NuoviConcorsiSection concorsi={newest} isLoading={isLoading} />

      {/* Maxi concorsi Section */}
      <MaxiConcorsiSection concorsi={maxi} isLoading={isLoading} />
    </>
  )
}
