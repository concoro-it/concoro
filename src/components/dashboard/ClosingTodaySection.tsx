"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { getFirebaseFirestore } from "@/lib/firebase/config"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Concorso } from "@/types/concorso"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Calendar, Users, CalendarDays } from "lucide-react"
import Link from "next/link"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { BookmarkIconButton } from "@/components/ui/bookmark-icon-button"
import { getLocalitaUrl } from '@/lib/utils/localita-utils'
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
import { formatDistanceToNow } from "date-fns"
import { FaviconImage } from "@/components/common/FaviconImage"

// Function to clean Ente names - display as-is without case conversion
const cleanEnteName = (str: string | undefined): string => {
  if (!str) return '';
  // Remove any dash truncation - display full name as stored
  return str.trim();
};

const getDeadlineStatus = (deadline: any) => {
  const deadlineCountdown = getDeadlineCountdown(deadline);
  if (!deadlineCountdown) return null;
  
  // Style the countdown message based on urgency - only text color, no background or border
  if (deadlineCountdown === "Scade oggi") {
    return { 
      text: deadlineCountdown, 
      color: "#dc2626", // red-700 for highest urgency
      textColor: "#dc2626",
      isUrgent: true
    };
  } else if (deadlineCountdown === "Scade domani") {
    return { 
      text: deadlineCountdown, 
      color: "#d97706", // amber-600 for high urgency
      textColor: "#d97706",
      isUrgent: true
    };
  } else if (deadlineCountdown.includes("Scade in")) {
    // Extract days and apply color based on urgency
    const daysMatch = deadlineCountdown.match(/Scade in (\d+) giorni?/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      if (days >= 2 && days <= 7) {
        // 2-7 days: amber
        return { 
          text: deadlineCountdown, 
          color: "#f59e0b", // amber-500 for medium urgency
          textColor: "#f59e0b",
          isUrgent: true
        };
      } else {
        // More than 7 days: gray
        return { 
          text: deadlineCountdown, 
          color: "#6b7280", // gray-500 for low urgency
          textColor: "#6b7280",
          isUrgent: false
        };
      }
    }
  }
  
  return { 
    text: deadlineCountdown, 
    color: "#6b7280", // gray-500 for default
    textColor: "#6b7280",
    isUrgent: false
  };
};

export function ClosingTodaySection() {
  const [concorsi, setConcorsi] = useState<Concorso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi()

  // Fetch concorsi closing today or with the most imminent deadlines
  useEffect(() => {
    async function fetchClosingTodayConcorsi() {
      try {
        setIsLoading(true)
        const db = getFirebaseFirestore()
        const concorsiCollection = collection(db, "concorsi")

        // Get all concorsi and filter/sort client-side for more precise date handling
        const snapshot = await getDocs(concorsiCollection)
        
        if (snapshot.empty) {
          setConcorsi([])
          return
        }

        const allConcorsiData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Concorso[]

        // Get today's date (start of day for accurate comparison)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)

        // Helper function to parse dates consistently
        const parseDate = (dateValue: any): Date | null => {
          if (!dateValue) return null
          
          if (typeof dateValue === 'object' && dateValue.seconds) {
            return new Date(dateValue.seconds * 1000)
          }
          
          if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue)
            return isNaN(parsed.getTime()) ? null : parsed
          }
          
          if (dateValue instanceof Date) {
            return dateValue
          }
          
          return null
        }

        // Filter concorsi with valid closing dates and not already closed
        const validConcorsi = allConcorsiData.filter(concorso => {
          const closingDate = parseDate(concorso.DataChiusura)
          if (!closingDate) return false
          
          // Only include concorsi that haven't closed yet (closing date >= today)
          return closingDate >= today
        })

        // Sort by closing date (ascending - soonest first)
        const sortedConcorsi = validConcorsi.sort((a, b) => {
          const dateA = parseDate(a.DataChiusura)!
          const dateB = parseDate(b.DataChiusura)!
          return dateA.getTime() - dateB.getTime()
        })

        // Get first 5 concorsi (prioritizing those closing today, then soonest)
        const selectedConcorsi = sortedConcorsi.slice(0, 5)
        
        setConcorsi(selectedConcorsi)
      } catch (error) {
        console.error('Error fetching closing today concorsi:', error)
        toast.error('Impossibile caricare i concorsi in scadenza')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClosingTodayConcorsi()
  }, [])

  const formatDate = (date: any) => {
    try {
      if (!date) return 'Data non disponibile'
      
      let parsedDate: Date
      
      if (typeof date === 'object' && date.seconds) {
        parsedDate = new Date(date.seconds * 1000)
      } else if (typeof date === 'string') {
        parsedDate = new Date(date)
      } else {
        parsedDate = new Date(date)
      }
      
      if (isNaN(parsedDate.getTime())) {
        return 'Data non valida'
      }
      
      return parsedDate.toLocaleDateString('it-IT')
    } catch (error) {
      return 'Data non valida'
    }
  }

  const getDeadlineUrgency = (date: any) => {
    try {
      if (!date) return null
      
      let parsedDate: Date
      
      if (typeof date === 'object' && date.seconds) {
        parsedDate = new Date(date.seconds * 1000)
      } else if (typeof date === 'string') {
        parsedDate = new Date(date)
      } else {
        parsedDate = new Date(date)
      }
      
      if (isNaN(parsedDate.getTime())) {
        return null
      }
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      
      const closingDate = new Date(parsedDate)
      closingDate.setHours(0, 0, 0, 0)
      
      if (closingDate.getTime() === today.getTime()) {
        return { text: 'Scade oggi', color: 'text-red-600', bgColor: 'bg-red-50' }
      } else if (closingDate.getTime() === tomorrow.getTime()) {
        return { text: 'Scade domani', color: 'text-orange-600', bgColor: 'bg-orange-50' }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  const safeText = (text: any): string => {
    if (typeof text === 'string') {
      return text
    }
    
    if (text === null || text === undefined) {
      return ''
    }
    
    if (typeof text === 'number') {
      return text.toString()
    }
    
    if (typeof text === 'object' && text.seconds) {
      try {
        return new Date(text.seconds * 1000).toLocaleDateString('it-IT')
      } catch (e) {
        return 'Invalid date'
      }
    }
    
    return JSON.stringify(text)
  }

  const handleBookmarkClick = async (e: React.MouseEvent, concorsoId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await toggleSaveConcorso(concorsoId)
      toast.success(
        isConcorsoSaved(concorsoId) 
          ? "Concorso rimosso dai salvati" 
          : "Concorso salvato con successo"
      )
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast.error("Si è verificato un errore. Riprova.")
    }
  }

  const handleVediTuttoClick = () => {
    // Navigate to /bandi with deadline-asc sort pre-applied
    router.push('/bandi?sort=deadline-asc')
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 shadow-sm bg-gradient-to-br from-[#FCE3E9] via-[#FCE3E9] to-[#c2e9fb]">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-white/20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2 text-black">Caricamento concorsi in scadenza...</h3>
        </div>
      </div>
    )
  }

  if (!concorsi || concorsi.length === 0) {
    return (
      <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 shadow-sm bg-gradient-to-br from-[#c2e9fb] via-[#c779d0] to-[#4bc0c8]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-white">Scadono oggi</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:text-white/90 hover:bg-white/10 font-medium mobile-button-compact mobile-text-compact"
            onClick={handleVediTuttoClick}
          >
            Vedi tutto
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-white/20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2 text-white">Nessun concorso in scadenza</h3>
          <p className="text-white/80 mb-4">
            Non ci sono concorsi con scadenze imminenti.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 shadow-sm bg-gradient-to-br from-[#FCE3E9] via-[#FCE3E9] to-[#c2e9fb]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-xl mobile-title-medium font-semibold">Scadono oggi</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-black hover:text-black/90 hover:bg-black/10 font-medium mobile-button-compact mobile-text-compact"
          onClick={handleVediTuttoClick}
        >
          Vedi tutto
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {concorsi.map((concorso) => {
          const timeAgo = concorso.createdAt?.seconds 
            ? formatDistanceToNow(new Date(concorso.createdAt.seconds * 1000), { addSuffix: true })
            : '';

          const deadlineStatus = getDeadlineStatus(concorso.DataChiusura);
          const urgency = getDeadlineUrgency(concorso.DataChiusura)

          // Get entity name - display as-is without case conversion
          const enteName = cleanEnteName(concorso.Ente);
          
          return (
            <Link 
              key={concorso.id} 
              href={`/bandi/${concorso.id}`}
              className="block"
            >
              <div 
                className="p-4 border border-white rounded-lg bg-white/10 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/15 transition-all cursor-pointer relative"
              >
                {/* Top right bookmark button */}
                <div className="absolute top-3 right-3 z-10">
                  <div onClick={(e) => handleBookmarkClick(e, concorso.id)}>
                    <BookmarkIconButton 
                      isSaved={isConcorsoSaved(concorso.id)} 
                      onClick={() => {}}
                    />
                  </div>
                </div>
                
                {/* Ente name with favicon and urgency badge */}
                <div className="flex justify-between items-center mb-2 pr-12">
                  <div className="flex items-center gap-1 min-w-0">
                    <FaviconImage 
                      enteName={concorso.Ente}
                      paLink={concorso.pa_link}
                      size={16}
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-black/80 truncate" title={enteName}>
                        {enteName}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="font-semibold line-clamp-2 text-sm sm:text-base mb-3 text-black">
                  {toItalianSentenceCase(safeText(concorso.Titolo))}
                </h3>
                
                {/* Details */}
                <div className="flex flex-wrap gap-3 text-sm text-black/70 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <Link 
                      href={getLocalitaUrl(concorso.AreaGeografica || '')}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-foreground transition-colors"
                    >
                      <span>{formatLocalitaDisplay(concorso.AreaGeografica || '')}</span>
                    </Link>
                  </div>
                  {deadlineStatus && (
                    <div className={`flex items-center gap-1 text-sm ${
                      deadlineStatus.text === "Scade oggi" 
                        ? 'font-medium text-red-600' 
                        : deadlineStatus.text === "Scade domani"
                        ? 'font-medium text-orange-600'
                        : deadlineStatus.isUrgent && deadlineStatus.text.includes("Scade in")
                        ? 'font-medium text-amber-600'
                        : 'font-normal text-black/70'
                    }`}>
                      <CalendarDays className="w-3 h-3 shrink-0" />
                      <span>{deadlineStatus.text}</span>
                    </div>
                  )}
                  {concorso.numero_di_posti && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{safeText(concorso.numero_di_posti)} {concorso.numero_di_posti === 1 ? 'posto' : 'posti'}</span>
                    </div>
                  )}
                </div>

                {/* Posted time */}
                {timeAgo && (
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span>{timeAgo}</span>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 