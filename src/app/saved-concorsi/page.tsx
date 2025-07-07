"use client"

import { useEffect, useState, MouseEvent } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building2, Calendar, Users, CalendarDays, ChevronDown, ChevronUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { BookmarkIconButton } from "@/components/ui/bookmark-icon-button"
import type { Concorso } from "@/types/concorso"
import LeftSidebar from "@/components/layout/LeftSidebar"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
import Image from "next/image"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"

const getFaviconChain = (domain: string): string[] => [
  `https://faviconkit.com/${domain}/32`,
  `https://besticon-demo.herokuapp.com/icon?url=${domain}&size=32`,
  `https://logo.clearbit.com/${domain}`,
  `https://www.google.com/s2/favicons?sz=192&domain=${domain}`,
  `/placeholder_icon.png`,
];

const extractDomain = (url: string | undefined): string => {
  if (!url) return '';
  try {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
};

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

export default function SavedConcorsiPage() {
  const { user, loading: authLoading, initialized: authInitialized } = useAuth()
  const { fetchSavedConcorsi, isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi()
  const [savedConcorsi, setSavedConcorsi] = useState<Concorso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)
  const [faviconIndices, setFaviconIndices] = useState<Record<string, number>>({})
  const [minLoadingTime, setMinLoadingTime] = useState(true)
  const [showExpired, setShowExpired] = useState(false)
  const router = useRouter()

  // Minimum loading time to prevent flashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false)
    }, 800) // Show spinner for at least 800ms

    return () => clearTimeout(timer)
  }, [])

  // Redirect to sign-in if user is not authenticated
  useEffect(() => {
    if (authInitialized && !authLoading && !user) {
      router.replace('/signin')
    }
  }, [authInitialized, authLoading, user, router])

  useEffect(() => {
    async function loadSavedConcorsi() {
      // Skip on server-side
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      
      // Wait for auth to be initialized
      if (!authInitialized) {
        return
      }
      
      if (!user) {
        setIsLoading(false)
        setHasAttemptedLoad(true)
        return
      }

      try {
        setIsLoading(true)
        const concorsi = await fetchSavedConcorsi()
        setSavedConcorsi(concorsi.filter((job): job is Concorso => job !== null))
        setHasAttemptedLoad(true)
      } catch (error) {
        console.error('Error loading saved concorsi:', error)
        toast.error('Impossibile caricare i concorsi salvati')
        setHasAttemptedLoad(true)
      } finally {
        setIsLoading(false)
      }
    }

    // Only run on client-side when auth is initialized
    if (typeof window !== 'undefined' && authInitialized) {
      loadSavedConcorsi()
    }
  }, [user, fetchSavedConcorsi, authInitialized])

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

  const handleSaveJob = async (jobId: string) => {
    try {
      if (!user) {
        toast.error("Effettua l'accesso per salvare i concorsi")
        return
      }
      await toggleSaveConcorso(jobId)
      toast.success(isConcorsoSaved(jobId) ? "Concorso rimosso dai salvati" : "Concorso salvato con successo")
      
      // Refresh the list
      const concorsi = await fetchSavedConcorsi()
      setSavedConcorsi(concorsi.filter((job): job is Concorso => job !== null))
    } catch (error) {
      console.error('Error saving concorso:', error)
      toast.error("Impossibile salvare il concorso. Riprova.")
    }
  }

  // Show loading state while auth is being initialized or data is loading or minimum time hasn't passed
  if (authLoading || !authInitialized || isLoading || minLoadingTime) {
    return (
      <div className="container py-8 pt-24">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Spinner size={48} className="mb-4" />
          <h3 className="text-lg font-medium mb-2">Caricamento concorsi salvati...</h3>
          <p className="text-gray-500">
            Stiamo recuperando i tuoi concorsi salvati.
          </p>
        </div>
      </div>
    )
  }

  // Only show "access required" after auth is fully initialized and no user is found
  if (!user) {
    return (
      <div className="container py-8 pt-24">
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

  // Only show "no saved concorsi" after we've actually attempted to load them
  if (hasAttemptedLoad && savedConcorsi.length === 0) {
    return (
      <div className="container py-8 pt-8 flex gap-8">
        <div className="hidden md:block w-1/4">
          <LeftSidebar />
        </div>
        <div className="flex-1">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Concorsi salvati</h1>
              <span className="text-sm text-gray-500">0 concorsi</span>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 p-4 bg-blue-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Nessun concorso salvato</h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Non hai ancora salvato nessun concorso. Esplora i bandi disponibili e salva quelli di tuo interesse per trovarli facilmente qui.
              </p>
              <Button onClick={() => router.push('/bandi')} size="lg">
                Esplora i concorsi
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Separate expired and active concorsi
  const activeConcorsi = savedConcorsi.filter(concorso => {
    const deadlineStatus = getDeadlineStatus(concorso.DataChiusura);
    return !deadlineStatus || deadlineStatus.text !== "Scaduto";
  });

  const expiredConcorsi = savedConcorsi.filter(concorso => {
    const deadlineStatus = getDeadlineStatus(concorso.DataChiusura);
    return deadlineStatus && deadlineStatus.text === "Scaduto";
  });

  const renderConcorso = (concorso: Concorso) => {
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
        href={`/bandi/${concorso.id}`}
        className="block"
      >
        <div 
          className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
        >
          {/* Top right bookmark button */}
          <div className="absolute top-3 right-3 z-10">
            <div onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSaveJob(concorso.id);
            }}>
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
              <p className="text-sm text-muted-foreground truncate" title={concorso.Ente}>
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
              <span>{formatLocalitaDisplay(concorso.AreaGeografica || '')}</span>
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
    );
  };

  return (
    <div className="container py-8 pt-8 flex gap-8">
      <div className="hidden md:block w-1/4">
        <LeftSidebar />
      </div>
      <div className="flex-1">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Concorsi salvati</h1>
            <span className="text-sm text-gray-500">{savedConcorsi.length} concorsi</span>
          </div>
          
          {/* Active concorsi */}
          {activeConcorsi.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Concorsi aperti ({activeConcorsi.length})</h2>
              {activeConcorsi.map(renderConcorso)}
            </div>
          )}

          {/* Expired concorsi dropdown */}
          {expiredConcorsi.length > 0 && (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setShowExpired(!showExpired)}
                className="w-full justify-between"
              >
                <span>Concorsi scaduti ({expiredConcorsi.length})</span>
                {showExpired ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showExpired && (
                <div className="space-y-4">
                  {expiredConcorsi.map(renderConcorso)}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
} 