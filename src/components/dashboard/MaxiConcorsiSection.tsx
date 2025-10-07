"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { getFirebaseFirestore } from "@/lib/firebase/config"
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
<<<<<<< Updated upstream
import { useBandoUrl } from '@/lib/hooks/useBandoUrl'
import Image from "next/image"

const getFaviconChain = (domain: string): string[] => [
  `https://faviconkit.com/${domain}/32`,
  `https://besticon-demo.herokuapp.com/icon?url=${domain}&size=32`,
  `https://logo.clearbit.com/${domain}`,
  `https://www.google.com/s2/favicons?sz=192&domain=${domain}`,
  `/placeholder_icon.png`,
];

// Function to extract domain from URL
const extractDomain = (url: string | undefined): string => {
  if (!url) return '';
  
  // Check if the URL is just "N/A" or similar placeholder
  if (url === 'N/A' || url === 'n/a' || url === 'NA') return '';
  
  // Basic URL validation before trying to parse
  if (!url.includes('.') || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//'))) {
    // Try to fix common URL issues by adding protocol
    url = url.startsWith('www.') ? `https://${url}` : url;
    
    // If it still doesn't look like a URL, return empty
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
      return '';
    }
  }
  
  try {
    const domain = new URL(url).hostname;
    return domain;
  } catch (error) {
    console.error('Invalid URL:', url);
    return '';
  }
};
=======
import { FaviconImage } from "@/components/common/FaviconImage"
import { toast } from "sonner"
import { generateSEOConcorsoUrl } from '@/lib/utils/concorso-urls'
>>>>>>> Stashed changes

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

export function MaxiConcorsiSection() {
  const [concorsi, setConcorsi] = useState<Concorso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [faviconIndices, setFaviconIndices] = useState<Record<string, number>>({})
  const router = useRouter()
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi()
  const { generateUrl } = useBandoUrl()

  // Fetch 5 concorsi with the highest number of posts
  useEffect(() => {
    async function fetchMaxiConcorsi() {
      try {
        setIsLoading(true)
        
        // Try optimized query first
        try {
          const { getMaxiConcorsiClient } = await import('@/lib/services/concorsi-service-client')
          
          const concorsiData = await getMaxiConcorsiClient(5)
          
          console.log(`📋 ✅ Optimized maxi concorsi query: ${concorsiData.length} concorsi`)
          
          setConcorsi(concorsiData as Concorso[])
          return
          
        } catch (optimizedError) {
          console.log('📋 ⚠️ Optimized maxi concorsi query failed, falling back to legacy:', optimizedError)
        }
        
        // Fallback to legacy query
        const db = getFirebaseFirestore()
        const concorsiCollection = collection(db, "concorsi")

        const concorsiQuery = query(
          concorsiCollection,
          orderBy("numero_di_posti", "desc"),
          limit(10)
        )

        const snapshot = await getDocs(concorsiQuery)
        
        if (snapshot.empty) {
          setConcorsi([])
          return
        }

        let concorsiData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Concorso[]
        
        concorsiData = concorsiData
          .filter(concorso => concorso.numero_di_posti && concorso.numero_di_posti > 0)
          .sort((a, b) => (b.numero_di_posti || 0) - (a.numero_di_posti || 0))
          .slice(0, 5)
        
        console.log(`📋 🐌 Legacy maxi concorsi query: ${concorsiData.length} concorsi`)
        setConcorsi(concorsiData)
      } catch (error) {
        console.error('Error fetching maxi concorsi:', error)
        // Try alternative query if numero_di_posti field doesn't exist or has issues
        try {
          const db = getFirebaseFirestore()
          const concorsiCollection = collection(db, "concorsi")
          
          // Fallback: get all concorsi and sort client-side
          const snapshot = await getDocs(concorsiCollection)
          
          let concorsiData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Concorso[]
          
          // Filter and sort client-side
          concorsiData = concorsiData
            .filter(concorso => concorso.numero_di_posti && concorso.numero_di_posti > 0)
            .sort((a, b) => (b.numero_di_posti || 0) - (a.numero_di_posti || 0))
            .slice(0, 5)
          
          setConcorsi(concorsiData)
        } catch (fallbackError) {
          console.error('Error with fallback query:', fallbackError)
          toast.error('Impossibile caricare i maxi concorsi')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaxiConcorsi()
  }, [])

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
    // Navigate to /bandi with posts sort pre-applied
    router.push('/bandi?sort=posts-desc')
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
          <h3 className="text-lg font-medium mb-2">Caricamento maxi concorsi...</h3>
        </div>
      </div>
    )
  }

  if (!concorsi || concorsi.length === 0) {
    return (
      <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-foreground">Maxi concorsi</h2>
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
          <h3 className="text-lg font-medium mb-2">Nessun maxi concorso trovato</h3>
          <p className="text-gray-500 mb-4">
            Non sono disponibili concorsi con molti posti.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-6 px-2 md:px-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-xl mobile-title-medium font-semibold text-foreground">Maxi concorsi</h2>
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
          
          // Get domain for favicon
          const domain = extractDomain(concorso.pa_link);
          const fallbacks = domain ? getFaviconChain(domain) : ['/placeholder_icon.png'];
          const currentFaviconIndex = faviconIndices[concorso.id] || 0;
          
          const handleFaviconError = () => {
            setFaviconIndices(prev => ({
              ...prev,
              [concorso.id]: Math.min((prev[concorso.id] || 0) + 1, fallbacks.length - 1)
            }));
          };

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
                    <Image 
                      src={fallbacks[currentFaviconIndex]}
                      alt={`Logo of ${concorso.Ente || 'entity'}`}
                      width={16} 
                      height={16}
                      className="object-contain"
                      style={{ 
                        imageRendering: 'crisp-edges'
                      }}
                      onError={handleFaviconError}
                    />
                  </div>
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