import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { 
  MapPin, 
  CalendarDays,
  Users, 
  ChevronRight
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { useAuth } from "@/lib/hooks/useAuth"
import React, { useState, memo, useCallback } from "react"
import { Concorso } from "@/types/concorso"
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
import Image from "next/image"
import { getEnteUrl } from '@/lib/utils/ente-utils'
import { getLocalitaUrl } from '@/lib/utils/localita-utils'
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import Link from "next/link"

// Helper function to render grouped regions
const renderGroupedRegions = (job: any, isMobile: boolean = false) => {
  if (job.isGrouped && job.regions && job.regions.length > 1) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <MapPin className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'} mr-1 shrink-0`} />
        <div className="flex flex-wrap gap-1">
          {job.regions.slice(0, isMobile ? 2 : 4).map((region: string, index: number) => (
            <React.Fragment key={region}>
              <Link 
                href={getLocalitaUrl(region, 'bandi')}
                onClick={(e) => e.stopPropagation()}
                className={`hover:text-foreground transition-colors text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md`}
              >
                {formatLocalitaDisplay(region)}
              </Link>
              {index < Math.min(job.regions.length - 1, isMobile ? 1 : 3) && (
                <span className="text-xs text-gray-400">•</span>
              )}
            </React.Fragment>
          ))}
          {job.regions.length > (isMobile ? 2 : 4) && (
            <span className="text-xs text-gray-500">
              +{job.regions.length - (isMobile ? 2 : 4)} altre
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 ml-1">
          ({job.regionCount} regioni)
        </span>
      </div>
    );
  }
  
  // Single region display
  return (
    <div className="flex items-center">
      <MapPin className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'} mr-1 shrink-0`} />
      <Link 
        href={getLocalitaUrl(job.AreaGeografica || '', 'bandi')}
        onClick={(e) => e.stopPropagation()}
        className="hover:text-foreground transition-colors"
      >
        <span className="line-clamp-1">{formatLocalitaDisplay(job.AreaGeografica || '')}</span>
      </Link>
    </div>
  );
};

interface ConcoroListProps {
  jobs: Concorso[];
  isLoading: boolean;
  selectedJobId: string | null;
  onJobSelect: (job: Concorso) => void;
  // Pagination props (optional - for paginated views)
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  // Infinite scroll props (optional - for infinite scroll views)
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
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

// Simple favicon - just use favicon.png

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

function ConcoroListComponent({ 
  jobs, 
  isLoading, 
  selectedJobId, 
  onJobSelect, 
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  isLoadingMore,
  hasMore,
  onLoadMore
}: ConcoroListProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi();
  const { user } = useAuth();

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
      // For protected pages, use simple ID-based URLs
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

  if (!jobs || jobs.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        Nessun concorso trovato corrispondente ai tuoi criteri.
      </Card>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-4 w-full">
        {(jobs || []).map((job, index) => {
          const timeAgo = job.createdAt?.seconds 
            ? formatDistanceToNow(new Date(job.createdAt.seconds * 1000), { addSuffix: true })
            : '';

          const closingDate = formatDate(job.DataChiusura);
          const deadlineStatus = getDeadlineStatus(job.DataChiusura);
          
          // Simple favicon - just use favicon.png

          // Get entity name - display as-is without case conversion
          const enteName = cleanEnteName(job.Ente);
          const truncatedEnteName = isMobile ? truncateEnteNameForMobile(enteName) : enteName;

          return (
            <div
              key={`${job.id}-${index}`}
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
              <Card className="relative p-4 cursor-pointer hover:shadow-md transition-all duration-200 w-full pointer-events-none overflow-hidden">
                <div className="absolute inset-0">
                  <GlowingEffect 
                    disabled={false}
                    glow={true}
                    blur={10}
                    spread={60}
                    movementDuration={1}
                    inactiveZone={0.2}
                    proximity={100}
                  />
                </div>
                <div className="relative z-10">
              {isMobile ? (
                // Mobile layout
                <div className="flex-grow space-y-2 w-full">
                  {/* Ente name with favicon */}
                  <div className="flex items-center gap-1 min-w-0 w-full">
                    <div className="relative w-[16px] h-[16px] flex-shrink-0 flex items-center justify-center">
                      <Image 
                        src="/favicon.png"
                        alt={`Logo of ${enteName || 'entity'}`}
                        width={16} 
                        height={16}
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <Link 
                        href={getEnteUrl(job.Ente || '', 'bandi')}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[12px] text-muted-foreground hover:text-foreground transition-colors block truncate"
                        title={enteName}
                      >
                        {truncatedEnteName}
                      </Link>
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
                    <div className="flex items-center gap-1 min-w-0 w-full">
                      <div className="relative w-[16px] h-[16px] flex-shrink-0 flex items-center justify-center">
                        <Image 
                          src="/favicon.png"
                          alt={`Logo of ${enteName || 'entity'}`}
                          width={16} 
                          height={16}
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <Link 
                          href={getEnteUrl(job.Ente || '', 'bandi')}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors block truncate"
                          title={enteName}
                        >
                          {truncatedEnteName}
                        </Link>
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
                </div>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Pagination or Infinite Scroll */}
      {totalPages !== undefined && totalPages > 1 && currentPage !== undefined && totalCount !== undefined && itemsPerPage !== undefined && onPageChange && (
        <div className="mt-8 space-y-4 border-t pt-6">
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
            className="text-center"
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              onPageChange(page)
              // Scroll to top when changing pages
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="justify-center"
          />
        </div>
      )}
      
      {/* Infinite Scroll Load More Button */}
      {hasMore && onLoadMore && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isLoadingMore ? 'Caricamento...' : 'Carica altri'}
          </Button>
        </div>
      )}
    </div>
  )
}

// Memoized export with optimized comparison
export const ConcoroList = memo(ConcoroListComponent, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isLoadingMore === nextProps.isLoadingMore &&
    prevProps.hasMore === nextProps.hasMore &&
    prevProps.selectedJobId === nextProps.selectedJobId &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.totalCount === nextProps.totalCount &&
    prevProps.itemsPerPage === nextProps.itemsPerPage &&
    prevProps.jobs.length === nextProps.jobs.length &&
    // Check if the first few jobs are the same (efficient shallow comparison)
    prevProps.jobs.slice(0, 5).every((job, index) => 
      nextProps.jobs[index]?.id === job.id
    )
  )
}) 