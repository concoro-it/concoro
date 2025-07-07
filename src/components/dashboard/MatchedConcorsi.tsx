"use client";

import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, ArrowRight, Info, X, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useMatchedConcorsi } from "@/lib/hooks/useMatchedConcorsi";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState, useMemo } from "react";
import { BookmarkIconButton } from "@/components/ui/bookmark-icon-button";
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi";
import { toast } from "sonner";
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization';
import { Pagination } from "@/components/blog/Pagination";
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
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

interface MatchedConcorsiProps {
  userId: string;
  limit?: number;
  showPagination?: boolean;
}

const CONCORSI_PER_PAGE = 10;

export function MatchedConcorsi({ userId, limit, showPagination = false }: MatchedConcorsiProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);
  const [faviconIndices, setFaviconIndices] = useState<Record<string, number>>({});
  
  // Calculate offset for pagination
  const offset = showPagination ? (currentPage - 1) * CONCORSI_PER_PAGE : undefined;
  const effectiveLimit = showPagination ? CONCORSI_PER_PAGE : limit;
  
  const { concorsi, totalCount, isLoading, error } = useMatchedConcorsi(userId, effectiveLimit, offset);
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi();

  // Calculate total pages for pagination
  const totalPages = useMemo(() => {
    if (!showPagination) return 1;
    return Math.ceil(totalCount / CONCORSI_PER_PAGE);
  }, [totalCount, showPagination]);

  useEffect(() => {
    console.log("MatchedConcorsi component - userId:", userId);
    console.log("MatchedConcorsi component - concorsi:", concorsi);
    console.log("MatchedConcorsi component - totalCount:", totalCount);
    console.log("MatchedConcorsi component - isLoading:", isLoading);
    console.log("MatchedConcorsi component - error:", error);
  }, [userId, concorsi, totalCount, isLoading, error]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedExplanation(null); // Reset expanded explanation when changing pages
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (date: any) => {
    try {
      if (!date) return 'Data non disponibile';

      let parsedDate: Date | null = null;

      // Firestore Timestamp instance
      if (date instanceof Timestamp) {
        parsedDate = date.toDate();
      }
      // Firestore-like object
      else if (typeof date === 'object' && date !== null && 'seconds' in date && 'nanoseconds' in date) {
        parsedDate = new Timestamp(date.seconds, date.nanoseconds).toDate();
      }
      // ISO string
      else if (typeof date === 'string') {
        parsedDate = parseISO(date);
      }
      // Already a Date object
      else if (date instanceof Date) {
        parsedDate = date;
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        return 'Data non valida';
      }

      return formatDistanceToNow(parsedDate, {
        addSuffix: true,
        locale: it,
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data non disponibile';
    }
  };
  
  // Function to determine text color based on match percentage
  const getMatchTextColor = (percentage: number) => {
    if (percentage < 30) return "text-gray-800"; // Dark text for low percentages
    return "text-white"; // White text for higher percentages
  };

  // Safely get text content, handling any potential objects
  const safeText = (text: any): string => {
    if (text === null || text === undefined) {
      return '';
    }
    
    if (typeof text === 'string') {
      return text;
    }
    
    if (typeof text === 'number' || typeof text === 'boolean') {
      return String(text);
    }
    
    if (text instanceof Date) {
      return text.toLocaleDateString();
    }
    
    if (text instanceof Timestamp) {
      return text.toDate().toLocaleDateString();
    }
    
    // Handle Firestore timestamp-like objects
    if (typeof text === 'object' && 'seconds' in text && 'nanoseconds' in text) {
      try {
        return new Timestamp(text.seconds, text.nanoseconds).toDate().toLocaleDateString();
      } catch (e) {
        console.error('Error converting timestamp-like object:', e);
        return 'Invalid date';
      }
    }
    
    // For other objects, return a placeholder
    return JSON.stringify(text);
  };

  // Handle bookmark click
  const handleBookmarkClick = async (e: React.MouseEvent, concorsoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await toggleSaveConcorso(concorsoId);
      toast.success(
        isConcorsoSaved(concorsoId) 
          ? "Concorso rimosso dai salvati" 
          : "Concorso salvato con successo"
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error("Si è verificato un errore. Riprova.");
    }
  };

  if (error) {
    return (
      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-red-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Errore di caricamento</h3>
          <p className="text-gray-500">{safeText(error)}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-blue-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Caricamento concorsi...</h3>
          <p className="text-gray-500 mb-4">
            Stiamo analizzando il tuo profilo per trovare i concorsi più adatti a te.
          </p>
        </div>
      </div>
    );
  }
  
  if (!concorsi || concorsi.length === 0) {
    return (
      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 bg-blue-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Nessun concorso trovato</h3>
          <p className="text-gray-500 mb-4">
            Non abbiamo ancora trovato concorsi che corrispondono al tuo profilo. Torna più tardi per vedere nuovi risultati.
          </p>
          <Button asChild>
            <Link href="/bandi">
              Esplora tutti i concorsi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show pagination info if pagination is enabled */}
      {showPagination && totalCount > 0 && (
        <div className="mb-6 text-sm text-gray-600">
          Mostrando {((currentPage - 1) * CONCORSI_PER_PAGE) + 1}-{Math.min(currentPage * CONCORSI_PER_PAGE, totalCount)} di {totalCount} concorsi consigliati
        </div>
      )}

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
            href={`/bandi/${concorso.id}`}
            className="block"
          >
            <div 
              className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
            >
              {/* Top right buttons */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  title="Perché questo concorso corrisponde al tuo profilo"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpandedExplanation(expandedExplanation === concorso.id ? null : concorso.id);
                  }}
                >
                  <Info className="h-4 w-4" />
                </Button>

                <div onClick={(e) => handleBookmarkClick(e, concorso.id)}>
                  <BookmarkIconButton 
                    isSaved={isConcorsoSaved(concorso.id)} 
                    onClick={() => {}}
                  />
                </div>
              </div>
              
              {/* Ente name with favicon and match percentage */}
              <div className="flex justify-between items-center mb-2 pr-20">
                <div className="flex items-center gap-1 min-w-0">
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
                <div className="relative h-6 w-24 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.round(concorso.match_score)}%` }}
                  ></div>
                  <div 
                    className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${getMatchTextColor(concorso.match_score)}`}
                  >
                    <span className="drop-shadow-sm">{Math.round(concorso.match_score)}% match</span>
                  </div>
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span>{timeAgo}</span>
                </div>
              )}

              {/* Match explanation */}
              {expandedExplanation === concorso.id && concorso.match_explanation && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Perché questo concorso corrisponde al tuo profilo:</h4>
                      <p className="text-sm text-gray-600">{concorso.match_explanation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Link>
        )
      })}

      {/* Add pagination if enabled and there are multiple pages */}
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
} 