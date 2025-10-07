"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Concorso } from "@/types/concorso"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Calendar, Users, CalendarDays } from "lucide-react"
import Link from "next/link"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { BookmarkIconButton } from "@/components/ui/bookmark-icon-button"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/hooks/useAuth"
import { FaviconImage } from '@/components/common/FaviconImage'
<<<<<<< Updated upstream
import { useBandoUrl } from '@/lib/hooks/useBandoUrl'
=======
import { getEnteUrl } from '@/lib/utils/ente-utils'
import { getLocalitaUrl } from '@/lib/utils/localita-utils'
import { generateSEOConcorsoUrl } from '@/lib/utils/concorso-urls'
>>>>>>> Stashed changes

// Note: Favicon logic moved to /lib/services/faviconCache.ts

const cleanEnteName = (str: string | undefined): string => {
  if (!str) return '';
  return str.length > 50 ? str.substring(0, 50) + '...' : str;
};

const getDeadlineStatus = (deadline: any) => {
  if (!deadline) return null;
  
  try {
    let deadlineDate: Date;
    
    if (typeof deadline === 'object' && deadline.seconds) {
      deadlineDate = new Date(deadline.seconds * 1000);
    } else if (typeof deadline === 'string') {
      deadlineDate = new Date(deadline);
    } else {
      deadlineDate = new Date(deadline);
    }
    
    if (isNaN(deadlineDate.getTime())) return null;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineOnly = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    
    const diffTime = deadlineOnly.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: "Scaduto", color: "#dc2626", isUrgent: true };
    } else if (diffDays === 0) {
      return { text: "Scade oggi", color: "#dc2626", isUrgent: true };
    } else if (diffDays === 1) {
      return { text: "Scade domani", color: "#ea580c", isUrgent: true };
    } else if (diffDays <= 7) {
      return { text: `Scade in ${diffDays} giorni`, color: "#d97706", isUrgent: true };
    } else if (diffDays <= 30) {
      return { text: `Scade in ${diffDays} giorni`, color: "#059669", isUrgent: false };
    } else {
      return { text: `Scade in ${diffDays} giorni`, color: "#6b7280", isUrgent: false };
    }
  } catch {
    return null;
  }
};

export function SavedConcorsiSection() {
  const [concorsi, setConcorsi] = useState<Concorso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()
  const { fetchSavedConcorsi, isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi()
  const { generateUrl } = useBandoUrl()

  // Fetch saved concorsi
  useEffect(() => {
    async function loadSavedConcorsi() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const savedConcorsi = await fetchSavedConcorsi()
        // Filter out expired concorsi and show first 5 active ones
        const validConcorsi = savedConcorsi.filter((concorso): concorso is Concorso => concorso !== null);
        const activeConcorsi = validConcorsi.filter(concorso => {
          const deadlineStatus = getDeadlineStatus(concorso.DataChiusura);
          return !deadlineStatus || deadlineStatus.text !== "Scaduto";
        });
        setConcorsi(activeConcorsi.slice(0, 5))
      } catch (error) {
        console.error('Error loading saved concorsi:', error)
        toast.error('Impossibile caricare i concorsi salvati')
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedConcorsi()
  }, [user, fetchSavedConcorsi])

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
      
      // Refresh the list after removing (filter out expired)
      const savedConcorsi = await fetchSavedConcorsi()
      const validConcorsi = savedConcorsi.filter((concorso): concorso is Concorso => concorso !== null);
      const activeConcorsi = validConcorsi.filter(concorso => {
        const deadlineStatus = getDeadlineStatus(concorso.DataChiusura);
        return !deadlineStatus || deadlineStatus.text !== "Scaduto";
      });
      setConcorsi(activeConcorsi.slice(0, 5))
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast.error("Si è verificato un errore. Riprova.")
    }
  }

  const handleVediTuttoClick = () => {
    router.push('/saved-concorsi')
  }

  // Don't show section if user is not logged in
  if (!user) {
    return null
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
          <h3 className="text-lg font-medium mb-2">Caricamento concorsi salvati...</h3>
        </div>
      </div>
    )
  }

  if (!concorsi || concorsi.length === 0) {
    return (
      <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-foreground">Concorsi salvati</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-blue-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Nessun concorso salvato</h3>
          <p className="text-gray-500 mb-4">
            Non hai ancora salvato nessun concorso. Esplora i bandi e salva quelli di tuo interesse.
          </p>
          <Button asChild>
            <Link href="/bandi">
              Esplora i concorsi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-foreground">Concorsi salvati</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/90 font-medium mobile-button-compact mobile-text-compact"
          onClick={handleVediTuttoClick}
        >
          Vedi tutti
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {concorsi.map((concorso) => {
          const timeAgo = concorso.createdAt?.seconds 
            ? formatDistanceToNow(new Date(concorso.createdAt.seconds * 1000), { addSuffix: true })
            : '';

          const deadlineStatus = getDeadlineStatus(concorso.DataChiusura);
          
          // Note: Favicon logic now handled by FaviconImage component

          // Get entity name - display as-is without case conversion
          const enteName = cleanEnteName(concorso.Ente);
          
          return (
            <Link 
              key={concorso.id} 
<<<<<<< Updated upstream
              href={generateUrl(concorso)}
=======
              href={generateSEOConcorsoUrl(concorso)}
>>>>>>> Stashed changes
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
                  <div className="relative w-[16px] h-[16px] flex-shrink-0 flex items-center justify-center">
                    <FaviconImage 
                      enteName={concorso.Ente || ''}
                      paLink={concorso.pa_link}
                      size={16}
                      alt={`Logo of ${concorso.Ente || 'entity'}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
<<<<<<< Updated upstream
                    <p className="text-sm text-muted-foreground truncate" title={enteName}>
=======
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(getEnteUrl(concorso.Ente || '', 'bandi'))
                      }}
                      className="text-sm text-muted-foreground truncate hover:text-foreground transition-colors text-left"
                      title={enteName}
                    >
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                    <span>{formatLocalitaDisplay(concorso.AreaGeografica || '')}</span>
=======
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(getLocalitaUrl(concorso.AreaGeografica || '', 'bandi'))
                      }}
                      className="hover:text-foreground transition-colors text-left"
                    >
                      <span>{formatLocalitaDisplay(concorso.AreaGeografica || '')}</span>
                    </button>
>>>>>>> Stashed changes
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