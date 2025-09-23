import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  CalendarDays,
  Users, 
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import React, { useEffect } from "react"
import { Concorso } from "@/types/concorso"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
import { FaviconImage } from "@/components/common/FaviconImage"
import { getEnteUrl } from '@/lib/utils/ente-utils'
import { getLocalitaUrl } from '@/lib/utils/localita-utils'
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
                href={getLocalitaUrl(region)}
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
        href={getLocalitaUrl(job.AreaGeografica || '')}
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
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}




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


// Function to clean Ente names - display as-is without case conversion
const cleanEnteName = (str: string | undefined): string => {
  if (!str) return '';
  // Remove any dash truncation - display full name as stored
  return str.trim();
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



  const toSentenceCase = (str: string | undefined | null) => {
    if (!str) return '';
    return toItalianSentenceCase(str);
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

          const deadlineStatus = getDeadlineStatus(job.DataChiusura);
          

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
              <Card className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 w-full pointer-events-none overflow-hidden">
              {isMobile ? (
                // Mobile layout
                <div className="flex-grow space-y-2 w-full">
                  {/* Ente name with favicon */}
                  <div className="flex items-center gap-1 min-w-0 w-full">
                    <FaviconImage 
                      enteName={job.Ente}
                      paLink={job.pa_link}
                      size={16}
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <Link 
                        href={getEnteUrl(job.Ente)}
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
                    {renderGroupedRegions(job, true)}
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
                      <FaviconImage 
                        enteName={job.Ente}
                        paLink={job.pa_link}
                        size={16}
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <Link 
                          href={getEnteUrl(job.Ente)}
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
                      {renderGroupedRegions(job, false)}
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