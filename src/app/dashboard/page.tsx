"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, limit, where, and } from "firebase/firestore"
import { getFirebaseFirestore } from "@/lib/firebase/config"
import { JobAlertBanner } from "@/components/ui/JobAlertBanner"
import LeftSidebar from "@/components/layout/LeftSidebar"
import { useAuth } from "@/lib/hooks/useAuth"
import { useUserPreferences } from "@/lib/hooks/useUserPreferences"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { hasFilledPreferences } from "@/lib/utils/preferences-utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Concorso } from "@/types/concorso"
import { ConcoroList } from "@/components/bandi/ConcoroList"
import { FilterPopover } from "@/components/jobs/FilterPopover"
import { MapPin, Briefcase, Clock, ArrowRight, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MatchedConcorsi } from "@/components/dashboard/MatchedConcorsi"
import { NuoviConcorsiSection } from "@/components/dashboard/NuoviConcorsiSection"
import { MaxiConcorsiSection } from "@/components/dashboard/MaxiConcorsiSection"
import { ClosingTodaySection } from "@/components/dashboard/ClosingTodaySection"
import { SavedConcorsiSection } from "@/components/dashboard/SavedConcorsiSection"
import Link from "next/link"
import { color } from "framer-motion"
import { Spinner } from '@/components/ui/spinner'
import { extractAllRegions, localitaContainsRegions } from "@/lib/utils/region-utils"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { getAvailableRegimes, normalizeConcorsoRegime, filterByRegime } from "@/lib/utils/regime-utils"

export default function DashboardPage() {
  const [concorsi, setConcorsi] = useState<Concorso[]>([])
  const [allConcorsi, setAllConcorsi] = useState<Concorso[]>([]) // Store all concorsi for client-side filtering
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { user, loading: authLoading, initialized: authInitialized } = useAuth()
  const { preferences, loading: preferencesLoading } = useUserPreferences()
  const { savedConcorsiIds } = useSavedConcorsi()
  const router = useRouter()

  // Filter states - now using regions instead of full locations
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedRegime, setSelectedRegime] = useState<string[]>([])
  const [selectedSettore, setSelectedSettore] = useState<string[]>([])
  const [availableRegions, setAvailableRegions] = useState<string[]>([])
  const [availableRegimi, setAvailableRegimi] = useState<string[]>([])
  const [availableSettori, setAvailableSettori] = useState<string[]>([])
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>("")

  // Redirect to sign-in if user is not authenticated
  useEffect(() => {
    if (authInitialized && !authLoading && !user) {
      router.replace('/signin')
    }
  }, [authInitialized, authLoading, user, router])

  // Fetch available filter options
  useEffect(() => {
    async function fetchFilterOptions() {
      if (!authInitialized) return

      try {
        const db = getFirebaseFirestore()
        const snapshot = await getDocs(collection(db, "concorsi"))
        
        const localitaStrings: string[] = []
        const concorsiData: any[] = []
        const settori = new Set<string>()

        snapshot.docs.forEach(doc => {
          const data = doc.data()
          concorsiData.push(data)
          if (data.AreaGeografica) localitaStrings.push(data.AreaGeografica)
          if (data.settore_professionale) settori.add(data.settore_professionale)
        })

        // Extract regions from all località strings
        const regions = extractAllRegions(localitaStrings)

        // Get normalized regimes using the new utility
        const regimi = getAvailableRegimes(concorsiData)

        setAvailableRegions(regions)
        setAvailableRegimi(regimi)
        setAvailableSettori(Array.from(settori));
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [authInitialized])

  // Fetch all concorsi (we'll filter client-side for regions)
  useEffect(() => {
    async function fetchConcorsi() {
      if (typeof window === 'undefined' || !authInitialized) {
        return
      }

      try {
        setIsLoading(true)
        const db = getFirebaseFirestore()
        const concorsiCollection = collection(db, "concorsi")

        // Build query conditions (excluding region and regime filtering since we'll do that client-side)
        const conditions = []
        if (selectedSettore.length > 0) {
          conditions.push(where('settore_professionale', 'in', selectedSettore))
        }

        // Create query with conditions
        const concorsiQuery = conditions.length > 0
          ? query(concorsiCollection, and(...conditions), limit(50))
          : query(concorsiCollection, limit(50))

        const snapshot = await getDocs(concorsiQuery)
        
        if (snapshot.empty) {
          setAllConcorsi([])
          setConcorsi([])
          return
        }

        const concorsiData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Concorso[]
        
        setAllConcorsi(concorsiData)
      } catch (error) {
        console.error('Error fetching concorsi:', error)
        if (error instanceof Error) {
          toast.error(`Impossibile caricare i concorsi: ${error.message}`)
        } else {
          toast.error('Impossibile caricare i concorsi')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchConcorsi()
  }, [authInitialized, selectedSettore])

  // Apply client-side region filtering
  useEffect(() => {
    let filtered = [...allConcorsi]

    // Apply region filter
    if (selectedRegions.length > 0) {
      filtered = filtered.filter(job => 
        job.AreaGeografica && localitaContainsRegions(job.AreaGeografica, selectedRegions)
      )
    }

    // Apply regime filter
    if (selectedRegime.length > 0) {
      filtered = filterByRegime(filtered, selectedRegime);
    }

    // Apply sorting
    if (sortBy === "deadline-asc") {
      // Sort by soonest closing date
      filtered.sort((a, b) => {
        const getDateFromTimestamp = (timestamp: any): Date => {
          if (!timestamp) return new Date(0);
          if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
          return new Date(timestamp);
        };
        
        const dateA = getDateFromTimestamp(a.DataChiusura);
        const dateB = getDateFromTimestamp(b.DataChiusura);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sortBy === "publication-desc") {
      // Sort by most recent publication
      filtered.sort((a, b) => {
        const getDateFromTimestamp = (timestamp: any): Date => {
          if (!timestamp) return new Date(0);
          
          // Handle Firestore timestamp objects
          if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
          
          // Handle string dates
          if (typeof timestamp === 'string') {
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? new Date(0) : date;
          }
          
          // Handle Date objects
          if (timestamp instanceof Date) return timestamp;
          
          // Fallback
          return new Date(timestamp);
        };
        
        // Use publication_date first, fallback to DataApertura, then createdAt
        const dateA = getDateFromTimestamp(a.publication_date || a.DataApertura || a.createdAt);
        const dateB = getDateFromTimestamp(b.publication_date || b.DataApertura || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === "posts-desc") {
      // Sort by highest number of available posts
      filtered.sort((a, b) => {
        const postsA = a.numero_di_posti || 0;
        const postsB = b.numero_di_posti || 0;
        return postsB - postsA;
      });
    }

    setConcorsi(filtered)
  }, [allConcorsi, selectedRegions, selectedRegime, sortBy])

  const handleJobSelect = (job: Concorso) => {
    router.push(`/bandi/${job.id}`)
  }

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

          {/* Matched Concorsi Section */}
          {user && (
  <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-foreground">Le opportunità selezionate per te</h2>
      <Button
        variant="ghost"
        size="sm"
        className="text-primary hover:text-primary/90 font-medium mobile-button-compact mobile-text-compact"
        asChild
      >
        <Link href="/dashboard/matched-concorsi">
          Vedi tutti
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
    <MatchedConcorsi userId={user.uid} limit={3} />
  </div>
)}

          {/* Saved Concorsi Section - only show if user has saved concorsi */}
          {savedConcorsiIds.length > 0 && (
            <SavedConcorsiSection />
          )}

          {/* Scadono oggi Section */}
          <ClosingTodaySection />

          {/* Nuovi concorsi Section */}
          <NuoviConcorsiSection />

          {/* Maxi concorsi Section */}
          <MaxiConcorsiSection />


      </div>
    </div>
    </div>
  )
} 