"use client";

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  CalendarDays,
  Users
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import React from "react"
import { Concorso } from "@/types/concorso"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
import { FaviconImage } from "@/components/common/FaviconImage"
import { getEnteUrl } from '@/lib/utils/ente-utils'
import { getLocalitaUrl } from '@/lib/utils/localita-utils'
import { generateSEOConcorsoUrl } from '@/lib/utils/concorso-urls'
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

interface ConcorsoCardCompactProps {
  concorso: Concorso;
  showSaveButton?: boolean;
}

export function ConcorsoCardCompact({ concorso, showSaveButton = false }: ConcorsoCardCompactProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const timeAgo = concorso.createdAt?.seconds 
    ? formatDistanceToNow(new Date(concorso.createdAt.seconds * 1000), { addSuffix: true })
    : '';

  const deadlineStatus = getDeadlineStatus(concorso.DataChiusura);
  
  // Get entity name - display as-is without case conversion
  const enteName = cleanEnteName(concorso.Ente);
  const truncatedEnteName = isMobile ? truncateEnteNameForMobile(enteName) : enteName;

  const toSentenceCase = (str: string | undefined | null) => {
    if (!str) return '';
    return toItalianSentenceCase(str);
  };

  const handleJobClick = (job: Concorso, e?: React.MouseEvent) => {
    // Prevent all possible default behaviors
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Use SEO-friendly URL for both mobile and desktop
    const seoUrl = generateSEOConcorsoUrl(job);
    router.push(seoUrl);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleJobClick(concorso, e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleJobClick(concorso, e as unknown as React.MouseEvent);
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
                enteName={concorso.Ente}
                paLink={concorso.pa_link}
                size={16}
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1 overflow-hidden">
                <Link 
                  href={getEnteUrl(concorso.Ente)}
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
              {toSentenceCase(concorso.Titolo || concorso.titolo_originale)}
            </h3>
            
            {/* Metadata in horizontal layout */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
              {renderGroupedRegions(concorso, true)}
              {deadlineStatus && (
                <div className="flex items-center gap-1 text-xs">
                  <CalendarDays className="w-3 h-3 shrink-0" style={{ color: deadlineStatus.textColor }} />
                  <span style={{ color: deadlineStatus.textColor, fontWeight: deadlineStatus.isUrgent ? 600 : 400 }}>
                    {deadlineStatus.text}
                  </span>
                </div>
              )}
              {concorso.numero_di_posti && (
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-1 shrink-0" />
                  <span>{concorso.numero_di_posti}</span>
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
                  enteName={concorso.Ente}
                  paLink={concorso.pa_link}
                  size={16}
                  className="flex-shrink-0"
                />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <Link 
                    href={getEnteUrl(concorso.Ente)}
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
                    <h3 className="font-semibold line-clamp-2 text-sm sm:text-base">{toSentenceCase(concorso.Titolo || concorso.titolo_originale)}</h3>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                {renderGroupedRegions(concorso, false)}
                {deadlineStatus && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" style={{ color: deadlineStatus.textColor }} />
                    <span style={{ color: deadlineStatus.textColor, fontWeight: deadlineStatus.isUrgent ? 600 : 400 }}>
                      {deadlineStatus.text}
                    </span>
                  </div>
                )}
                {concorso.numero_di_posti && (
                  <div className="flex items-center">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 shrink-0" />
                    <span>{concorso.numero_di_posti} posti</span>
                  </div>
                )}

                {(concorso.Stato?.toLowerCase() === 'closed' || concorso.Stato?.toLowerCase() === 'chiuso') && (
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
  );
}
