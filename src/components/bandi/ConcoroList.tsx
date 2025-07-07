import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Building2, 
  Calendar, 
  CalendarDays,
  Users, 
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { useAuth } from "@/lib/hooks/useAuth"
import React, { useEffect, useState } from "react"
import { Concorso } from "@/types/concorso"
import Image from "next/image"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { normalizeConcorsoCategory } from "@/lib/utils/category-utils"
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'

const getFaviconChain = (domain: string): string[] => [
  `https://faviconkit.com/${domain}/32`,
  `https://besticon-demo.herokuapp.com/icon?url=${domain}&size=32`,
  `https://logo.clearbit.com/${domain}`,
  `https://www.google.com/s2/favicons?sz=192&domain=${domain}`,
  `/placeholder_icon.png`,
];

interface ConcoroListProps {
  jobs: Concorso[];
  isLoading: boolean;
  selectedJobId: string | null;
  onJobSelect: (job: Concorso) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}



const formatStatus = (status: string) => {
  if (!status) return 'Stato non disponibile';
  return status.toLowerCase() === 'open' ? 'Aperto' : 
         status.toLowerCase() === 'closed' ? 'Chiuso' : 
         status;
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

// Function to truncate text to specified length if needed
const truncateIfNeeded = (text: string, maxLength: number, hasDeadline: boolean): string => {
  if (!hasDeadline) return text; // Don't truncate if no deadline badge
  
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

// Function to truncate entity name for mobile
const truncateEnteNameForMobile = (name: string, maxLength: number = 30): string => {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
};

export function ConcoroList({ jobs, isLoading, selectedJobId, onJobSelect, currentPage, onPageChange, itemsPerPage }: ConcoroListProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi();
  const { user } = useAuth();
  const [faviconIndices, setFaviconIndices] = useState<Record<string, number>>({});

  const totalPages = Math.ceil(jobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJobs = jobs.slice(startIndex, endIndex);

  // Scroll to selected card when selection changes
  React.useEffect(() => {
    if (selectedJobId && !isMobile) {
      const timer = setTimeout(() => {
        const selectedCard = document.querySelector(`[data-job-id="${selectedJobId}"]`);
        if (selectedCard) {
          selectedCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedJobId, isMobile]);

  const handleJobClick = (job: Concorso, e?: React.MouseEvent) => {
    // Prevent all possible default behaviors
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isMobile) {
      router.push(`/bandi/${job.id}`);
    } else {
      onJobSelect(job);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      if (!user) {
        toast.error("Effettua l'accesso per salvare i concorsi");
        return;
      }
      await toggleSaveConcorso(jobId);
      toast.success(isConcorsoSaved(jobId) ? "Concorso rimosso dai salvati" : "Concorso salvato con successo");
    } catch (error) {
      console.error('Error saving concorso:', error);
      toast.error("Impossibile salvare il concorso. Riprova.");
    }
  };

  const handleShareJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/concorsi/${jobId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiato negli appunti");
  };

  const handleReportJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Grazie per la segnalazione");
  };

  const toSentenceCase = (str: string | undefined | null) => {
    if (!str) return '';
    return toItalianSentenceCase(str);
  };

  const parseItalianDate = (dateStr: string) => {
    try {
      if (!dateStr) {
        return null;
      }

      const monthMap: { [key: string]: number } = {
        'Gen': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mag': 4, 'Giu': 5,
        'Lug': 6, 'Ago': 7, 'Set': 8, 'Ott': 9, 'Nov': 10, 'Dic': 11
      };

      const parts = dateStr.split(' ');

      if (parts.length < 4) {
        return null;
      }

      const [day, month, year, time] = parts;
      const timeParts = time.split(':');
      
      if (timeParts.length !== 2) {
        return null;
      }
      
      const [hours, minutes] = timeParts;
      const monthNum = monthMap[month];
      
      if (monthNum === undefined) {
        return null;
      }

      const date = new Date(
        parseInt(year),
        monthNum,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error('Error parsing Italian date:', error);
      return null;
    }
  };

  const formatDate = (date: string | { seconds: number; nanoseconds: number } | null | undefined) => {
    try {
      if (!date) {
        return null;
      }
      
      if (typeof date === 'string') {
        if (!date.trim()) {
          return null;
        }
        
        const italianDate = parseItalianDate(date);
        if (italianDate) {
          return italianDate;
        }

        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
      } else if (typeof date === 'object' && date !== null && 'seconds' in date) {
        return new Date(date.seconds * 1000);
      }
      
      return null;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            {isMobile ? (
              // Mobile loading skeleton
              <div className="flex-grow space-y-3 w-full">
                {/* Ente name with favicon skeleton */}
                <div className="flex items-center gap-1 min-w-0">
                  <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                
                {/* Title skeleton */}
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                
                {/* Metadata skeleton in horizontal layout */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-8"></div>
                  </div>
                </div>
                
                {/* Posted time skeleton */}
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              // Desktop loading skeleton
              <div className="flex items-start">
                <div className="flex-grow space-y-3 w-full">
                  {/* Ente name with favicon skeleton */}
                  <div className="flex items-center gap-1 min-w-0">
                    <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  
                  {/* Title skeleton */}
                  <div className="space-y-1">
                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                    <div className="h-5 bg-gray-200 rounded w-4/5"></div>
                  </div>

                  {/* Metadata skeleton */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>

                  {/* Posted time skeleton */}
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        Nessun concorso trovato corrispondente ai tuoi criteri.
      </Card>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-4 w-full">
        {currentJobs.map((job, index) => {
          const timeAgo = job.createdAt?.seconds 
            ? formatDistanceToNow(new Date(job.createdAt.seconds * 1000), { addSuffix: true })
            : '';

          const closingDate = formatDate(job.DataChiusura);
          const deadlineStatus = getDeadlineStatus(job.DataChiusura);
          
          // Get domain for favicon
          const domain = extractDomain(job.pa_link);
          const fallbacks = domain ? getFaviconChain(domain) : ['/placeholder_icon.png'];
          const currentFaviconIndex = faviconIndices[job.id] || 0;
          
          const handleFaviconError = () => {
            const nextIndex = Math.min((faviconIndices[job.id] || 0) + 1, fallbacks.length - 1);
            // Only update if we haven't reached the end of fallbacks
            if (nextIndex < fallbacks.length - 1) {
              setFaviconIndices(prev => ({
                ...prev,
                [job.id]: nextIndex
              }));
            }
          };

          // Get entity name - display as-is without case conversion
          const enteName = cleanEnteName(job.Ente);
          const truncatedEnteName = isMobile ? truncateEnteNameForMobile(enteName) : enteName;

          return (
            <div
              key={`${job.id}-${currentPage}-${index}`}
              data-job-id={job.id}
              role="button"
              tabIndex={0}
              className={`w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl ${
                selectedJobId === job.id ? "ring-2 ring-primary bg-gray-100" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleJobClick(job, e);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleJobClick(job, e as unknown as React.MouseEvent);
                }
              }}
            >
              <Card className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 w-full pointer-events-none">
              {isMobile ? (
                // Mobile layout
                <div className="flex-grow space-y-2 w-full">
                  {/* Ente name with favicon */}
                  <div className="flex items-center gap-1 min-w-0">
                    <div className="relative w-[16px] h-[16px] flex-shrink-0 flex items-center justify-center">
                      <Image 
                        src={fallbacks[currentFaviconIndex]}
                        alt={`Logo of ${job.Ente || 'entity'}`}
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
                      <p className="text-[12px] text-muted-foreground truncate" title={enteName}>
                        {truncatedEnteName}
                      </p>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-semibold line-clamp-2 text-[14px]">
                    {toSentenceCase(job.Titolo || job.titolo_originale)}
                  </h3>
                  
                  {/* Metadata in horizontal layout */}
                  <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 shrink-0" />
                      <span>{formatLocalitaDisplay(job.AreaGeografica || '')}</span>
                    </div>
                    {deadlineStatus && (
                      <div className={`flex items-center gap-1 text-xs ${
                        deadlineStatus.isUrgent 
                          ? 'font-normal' 
                          : 'font-light'
                      }`}
                      style={{ 
                        color: deadlineStatus.color
                      }}>
                        <CalendarDays className="w-3 h-3 shrink-0" />
                        <span>{deadlineStatus.text}</span>
                      </div>
                    )}
                    {job.numero_di_posti && (
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1 shrink-0" />
                        <span>{job.numero_di_posti}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Posted time */}
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span>{timeAgo}</span>
                  </div>
                </div>
              ) : (
                // Desktop layout
                <div className="flex items-start">
                  <div className="flex-grow space-y-2 w-full">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="relative w-[16px] h-[16px] flex-shrink-0 flex items-center justify-center">
                        <Image 
                          src={fallbacks[currentFaviconIndex]}
                          alt={`Logo of ${job.Ente || 'entity'}`}
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
                          {truncatedEnteName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold line-clamp-2 text-sm sm:text-base">{toSentenceCase(job.Titolo || job.titolo_originale)}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 shrink-0" />
                        <span className="line-clamp-1">{formatLocalitaDisplay(job.AreaGeografica || '')}</span>
                      </div>
                      {deadlineStatus && (
                        <div className={`flex items-center gap-1 text-xs sm:text-sm ${
                          deadlineStatus.isUrgent 
                            ? 'font-medium' 
                            : 'font-normal'
                        }`}
                        style={{ 
                          color: deadlineStatus.color
                        }}>
                          <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span>{deadlineStatus.text}</span>
                        </div>
                      )}
                      {job.numero_di_posti && (
                        <div className="flex items-center">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 shrink-0" />
                          <span>{job.numero_di_posti} posti</span>
                        </div>
                      )}

                      {(job.Stato?.toLowerCase() === 'closed' || job.Stato?.toLowerCase() === 'chiuso') && (
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-xs">Chiuso</Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </Card>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPageChange(Math.max(1, currentPage - 1));
            }}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="sm:inline hidden">Precedente</span>
          </Button>
          <span className="text-xs sm:text-sm text-gray-500">
            Pagina {currentPage} di {totalPages}
          </span>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPageChange(Math.min(totalPages, currentPage + 1));
            }}
            disabled={currentPage === totalPages}
          >
            <span className="sm:inline hidden">Successivo</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
} 