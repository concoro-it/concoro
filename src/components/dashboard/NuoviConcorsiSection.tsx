"use client"

import { useState } from "react"
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
import { toast } from "sonner"

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

interface NuoviConcorsiSectionProps {
  concorsi?: Concorso[];
  isLoading?: boolean;
}

export function NuoviConcorsiSection({ concorsi = [], isLoading = false }: NuoviConcorsiSectionProps) {
  const router = useRouter()
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi()

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
    // Navigate to /bandi with publication date sort pre-applied
    router.push('/bandi?sort=publication-desc')
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-blue-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Caricamento nuovi concorsi...</h3>
        </div>
      </div>
    )
  }

  if (!concorsi || concorsi.length === 0) {
    return (
      <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-foreground">Nuovi concorsi</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/90 font-medium mobile-button-compact mobile-text-compact"
            onClick={handleVediTuttoClick}
          >
            Vedi tutto
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-blue-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Nessun nuovo concorso trovato</h3>
          <p className="text-gray-500 mb-4">
            Non sono ancora disponibili nuovi concorsi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-foreground">Nuovi concorsi</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/90 font-medium mobile-button-compact mobile-text-compact"
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

          // Get entity name - display as-is without case conversion
          const enteName = cleanEnteName(concorso.Ente);
          
          return (
            <Link 
              key={concorso.id} 
              href={`/bandi/${concorso.id}`}
              className="block"
            >
              <div 
                className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
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
                
                {/* Ente name with favicon */}
                <div className="flex items-center gap-1 min-w-0 mb-2 pr-12">
                  <FaviconImage 
                    enteName={concorso.Ente}
                    paLink={concorso.pa_link}
                    size={16}
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground truncate" title={enteName}>
                      {enteName}
                    </p>
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="font-semibold line-clamp-2 text-sm sm:text-base mb-3">
                  {toItalianSentenceCase(safeText(concorso.Titolo))}
                </h3>
                
                {/* Details */}
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(getLocalitaUrl(concorso.AreaGeografica || ''))
                      }}
                      className="hover:text-foreground transition-colors text-left"
                    >
                      <span>{formatLocalitaDisplay(concorso.AreaGeografica || '')}</span>
                    </button>
                  </div>
                  {deadlineStatus && (
                    <div className={`flex items-center gap-1 text-sm ${
                      deadlineStatus.isUrgent 
                        ? 'font-medium' 
                        : 'font-normal'
                    }`}
                    style={{ 
                      color: deadlineStatus.color
                    }}>
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
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