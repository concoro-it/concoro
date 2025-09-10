import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ExternalLinkIcon, 
  MapPin, 
  Calendar, 
  Users, 
  MoreVertical,
  Flag,
  Scale,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { useAuthAdapter } from "@/lib/hooks/useAuthAdapter"
import { GuestSummary } from "@/components/bandi/GuestSummary"
import { GuestBookmarkButton } from "@/components/ui/guest-bookmark-button"
import { GuestChatInterface } from "@/components/bandi/GuestChatInterface"
import React, { useEffect, useState } from "react"
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { ArrowUpIcon } from "lucide-react"
import { marked } from 'marked'
import { BookmarkIconButton } from "@/components/ui/bookmark-icon-button"
import { Spinner } from "@/components/ui/spinner"
import { ReportModal } from "@/components/ui/report-modal"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { getEnteUrl } from '@/lib/utils/ente-slug-utils'
import { formatMetodoValutazione, getDeadlineCountdown } from '@/lib/utils/date-utils'
import { normalizeConcorsoCategory } from "@/lib/utils/category-utils"
import { formatLocalitaDisplay, normalizeLocationForSlug } from '@/lib/utils/region-utils'
import { Concorso } from '@/types/concorso'

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})



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

interface ConcoroDetailsProps {
  job: Concorso | null;
  isLoading: boolean;
}

const toSentenceCase = (str: string) => {
  return toItalianSentenceCase(str);
};

const formatListItem = (text: string | undefined): string => {
  if (!text) return '';
  // Remove leading dashes, bullets, or asterisks and trim
  const cleanText = text.replace(/^[-•*]\s*/, '').trim();
  return toSentenceCase(cleanText);
};

const formatStatus = (status: string | undefined) => {
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
    return { text: deadlineCountdown, color: "#dc2626", textColor: "#dc2626" };
  } else if (deadlineCountdown === "Scade domani") {
    return { text: deadlineCountdown, color: "#d97706", textColor: "#d97706" };
  } else if (deadlineCountdown.includes("Scade in")) {
    // Extract days and apply color based on urgency
    const daysMatch = deadlineCountdown.match(/Scade in (\d+) giorni/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      if (days >= 2 && days <= 7) {
        return { text: deadlineCountdown, color: "#f59e0b", textColor: "#f59e0b" };
      } else {
        return { text: deadlineCountdown, color: "#6b7280", textColor: "#6b7280" };
      }
    }
  }
  
  return { text: deadlineCountdown, color: "#6b7280", textColor: "#6b7280" };
};

const hasValidContent = (content: string | string[] | undefined): boolean => {
  if (!content) return false;
  if (Array.isArray(content)) {
    return content.length > 0 && !content.every(item => item.trim() === 'Non specificato');
  }
  return content.trim() !== 'Non specificato' && content.trim() !== '';
};

// Function to clean HTML content
const cleanHtmlContent = (html: string | undefined): string => {
  if (!html) return '';
  
  // First replace common HTML entities
  let clean = html.replace(/&nbsp;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'");
  
  // Replace paragraph tags with newlines before removing all HTML
  clean = clean.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  clean = clean.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove all HTML tags
  clean = clean.replace(/<[^>]*>/g, '');
  
  // Normalize whitespace but preserve paragraph breaks
  clean = clean.replace(/\s+/g, ' ');
  
  // Restore paragraph breaks
  clean = clean.replace(/\n\s+/g, '\n');
  
  return clean.trim();
};

// Function to detect URLs in text and format them with truncation and external link icons
const formatTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // This is a URL
      const truncatedUrl = part.length > 50 ? `${part.substring(0, 47)}...` : part;
      return (
        <span key={index} className="inline-flex items-center gap-1 break-all">
          <a 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
            title={part} // Show full URL on hover
          >
            {truncatedUrl}
          </a>
          <ExternalLinkIcon className="w-3 h-3 text-blue-600 flex-shrink-0" />
        </span>
      );
    }
    return part;
  });
};

export function ConcoroDetails({ job, isLoading }: ConcoroDetailsProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const { user, initializeAuth } = useAuthAdapter();
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi();
  const [inputValue, setInputValue] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [faviconIndex, setFaviconIndex] = useState(0)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-initialize auth for logged-in users
  useEffect(() => {
    initializeAuth()
  }, [])

  React.useEffect(() => {
    if (chatMessages.length > 0 && isDrawerOpen) {
      scrollToBottom()
    }
  }, [chatMessages, isDrawerOpen])

  useEffect(() => {
    if (job) {
      setIsSaved(isConcorsoSaved(job.id))
    }
  }, [job, isConcorsoSaved])

  const parseItalianDate = (dateStr: string) => {
    try {
      if (!dateStr || typeof dateStr !== 'string') {
        return null;
      }

      const monthMap: { [key: string]: number } = {
        'Gen': 0, 'Gennaio': 0,
        'Feb': 1, 'Febbraio': 1,
        'Mar': 2, 'Marzo': 2,
        'Apr': 3, 'Aprile': 3,
        'Mag': 4, 'Maggio': 4,
        'Giu': 5, 'Giugno': 5,
        'Lug': 6, 'Luglio': 6,
        'Ago': 7, 'Agosto': 7,
        'Set': 8, 'Settembre': 8,
        'Ott': 9, 'Ottobre': 9,
        'Nov': 10, 'Novembre': 10,
        'Dic': 11, 'Dicembre': 11
      };

      // Split parts: day, month, year, time
      const parts = dateStr.trim().split(' ');
      
      if (parts.length < 3) {
        return null;
      }

      const day = parseInt(parts[0], 10);
      const monthName = parts[1];
      const monthNum = monthMap[monthName];
      
      if (isNaN(day) || monthNum === undefined) {
        return null;
      }

      let year = new Date().getFullYear();
      let hours = 0;
      let minutes = 0;
      
      // Parse year and time if available
      if (parts.length >= 3) {
        const yearPart = parts[2];
        if (/^\d{4}$/.test(yearPart)) {
          year = parseInt(yearPart, 10);
        }
      }
      
      // Parse time if available
      if (parts.length >= 4) {
        const timePart = parts[3];
        const timeParts = timePart.split(':');
        if (timeParts.length >= 2) {
          hours = parseInt(timeParts[0], 10) || 0;
          minutes = parseInt(timeParts[1], 10) || 0;
        }
      }
      
      const date = new Date(year, monthNum, day, hours, minutes);
      
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  };

  const formatDate = (date: string | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | null | undefined) => {
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
      } else if (typeof date === 'object' && date !== null && ('seconds' in date || '_seconds' in date)) {
        // Handle both formats: seconds/_seconds
        const seconds = date.seconds || date._seconds;
        if (seconds) {
          return new Date(seconds * 1000);
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleSave = async () => {
    if (!job) return;
    setIsSaving(true);
    try {
      await toggleSaveConcorso(job.id);
      setIsSaved(isConcorsoSaved(job.id));
      toast.success(isSaved ? "Concorso rimosso dai preferiti" : "Concorso salvato nei preferiti");
    } catch (error) {
      console.error("Error saving concorso:", error);
      toast.error("Si è verificato un errore durante il salvataggio del concorso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareJob = () => {
    if (!job) return;
    const url = `${window.location.origin}/concorsi/${job.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiato negli appunti");
  };

  const handleApplyJob = () => {
    if (!job) return;
    window.open(job.apply_link || job.Link, "_blank");
  };

  const handleReportJob = () => {
    setIsReportModalOpen(true);
  };

  const handleChatSubmit = async () => {
    if (!inputValue.trim() || !job) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoadingResponse(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          jobDetails: job,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Si è verificato un errore durante l'invio del messaggio");
    } finally {
      setIsLoadingResponse(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white rounded-xl border animate-pulse">
            <div className="p-6 space-y-6">
              <div className="space-y-6">
                {/* Header Section Skeleton */}
                <div className="space-y-4">
                  {/* Action Buttons Row Skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 bg-gray-200 rounded"></div>
                      <div className="h-9 w-9 bg-gray-200 rounded"></div>
                    </div>
                  </div>

                  {/* Title and Company Section Skeleton */}
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </div>
                  </div>

                  {/* Location and Date Skeleton */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                    <div className="h-10 bg-gray-200 rounded w-40"></div>
                  </div>

                  {/* Summary Section Skeleton */}
                  <div className="rounded-lg p-6 bg-gradient-to-r from-blue-100 to-blue-50">
                    <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Skeleton */}
                <div className="space-y-4 border rounded-lg p-8">
                  <div className="h-5 bg-gray-200 rounded w-48"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div>
                            <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Job Description Skeleton */}
                <div className="space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-48"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>

                {/* Requirements Section Skeleton */}
                <div className="space-y-4 border rounded-lg p-8">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Information Skeleton */}
                <div className="space-y-4 border rounded-lg p-8">
                  <div className="h-5 bg-gray-200 rounded w-40"></div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-64"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                      <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface Skeleton */}
        <div className="sticky bottom-0 left-0 right-0 border-t bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm rounded-t-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center p-4">
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-64"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center h-full text-gray-500">
          Seleziona un concorso per visualizzare i dettagli
        </CardContent>
      </Card>
    );
  }

  const timeAgo = job.createdAt?.seconds 
    ? formatDistanceToNow(new Date(job.createdAt.seconds * 1000), { addSuffix: true })
    : 'Recently';

  const closingDate = formatDate(job.DataChiusura);
  const deadlineStatus = getDeadlineStatus(job.DataChiusura);

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white rounded-xl border">
          <div className="p-6 space-y-6">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="space-y-4">
                {/* Action Buttons Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className={`inline-flex items-center justify-center px-4 py-1 whitespace-nowrap rounded-full text-sm font-medium transition-colors outline-offset-2 ${
                      formatStatus(job.Stato) === 'Chiuso' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {formatStatus(job.Stato)}
                    </Badge>
                    {deadlineStatus && (
                      <Badge 
                        className="ml-2 bg-transparent border-0 px-0"
                        style={{
                          color: deadlineStatus.textColor,
                          fontWeight: "600"
                        }}
                      >
                        {deadlineStatus.text}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {user ? (
                      <BookmarkIconButton 
                        isSaved={isConcorsoSaved(job.id)} 
                        onClick={handleSave}
                        className="h-9 w-9 p-0 bg-transparent border-0 hover:bg-transparent"
                      />
                    ) : (
                      <GuestBookmarkButton className="h-9 w-9 p-0 bg-transparent border-0 hover:bg-transparent" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="default" size="sm" className="h-9 w-9 p-0 bg-transparent border-0 hover:bg-transparent">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleReportJob}>
                          <Flag className="w-4 h-4 mr-2 text-gray-500" />
                          Segnala
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Title and Company Section */}
                <div>
                  <h1 className="text-2xl font-bold">{toSentenceCase(job.Titolo || job.titolo_originale || '')}</h1>
                  <div className="flex items-center text-gray-600 mt-2">
                    {(() => {
                      const domain = extractDomain(job.pa_link);
                      const faviconUrls =  ['/placeholder_icon.png'];
                      
                      const handleFaviconError = () => {
                        setFaviconIndex(prev => Math.min(prev + 1, faviconUrls.length - 1));
                      };

                      return (
                        <>
                          <div className="relative w-4 h-4 mr-2 flex items-center justify-center">
                            <Image 
                              src={faviconUrls[faviconIndex]}
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
                            <Link 
                              href={getEnteUrl(job.Ente)}
                              className="hover:text-blue-600 hover:underline transition-colors"
                              title={`Vedi tutti i concorsi di ${job.Ente}`}
                            >
                              <span className="truncate">{job.Ente || ''}</span>
                            </Link>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {(() => {
                      const locationDisplay = formatLocalitaDisplay(job.AreaGeografica || '');
                      const locationSlug = normalizeLocationForSlug(job.AreaGeografica || '');
                      
                      if (locationSlug && locationDisplay) {
                        return (
                          <Link 
                            href={`/bandi/localita/${locationSlug}`}
                            className="hover:text-blue-600 hover:underline transition-colors"
                            title={`Vedi tutti i concorsi in ${locationDisplay}`}
                          >
                            {locationDisplay}
                          </Link>
                        );
                      } else {
                        return <span>{locationDisplay}</span>;
                      }
                    })()}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatStatus(job.Stato) === 'Chiuso' ? 'Chiuso il' : 'Chiusura'} {closingDate ? closingDate.toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Data non specificata'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="inline-flex items-center justify-center px-4 py- whitespace-nowrap text-sm font-medium transition-colors outline-offset-2 bg-primary text-primary-foreground">
                    <a href={job.apply_link || job.Link} target="_blank" rel="noopener noreferrer">
                      Candidati Ora
                      <ExternalLinkIcon className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button variant="ghost" asChild>
                    <a href={job.Link} target="_blank" rel="noopener noreferrer">
                      Visualizza su INPA
                      <ExternalLinkIcon className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>

                {/* Summary Section */}
                {user ? (
                  job.riassunto && (
                    <div className="rounded-lg p-6" style={{ 
                      backgroundImage: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
                    }}>
                      <h2 className="text-lg font-semibold mb-2">Sommario</h2>
                      <div 
                        className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:space-y-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_li]:mb-1 [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: marked(job.riassunto) }}
                      />
                    </div>
                  )
                ) : (
                  <GuestSummary jobTitle={job.Titolo || job.titolo_originale} />
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-4 border rounded-lg p-8">
                <h2 className="text-lg font-semibold">Dettagli del Concorso</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Data di Apertura</p>
                        <p className="font-medium">
                          {formatDate(job.DataApertura)?.toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) || 'Non specificata'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Data di Chiusura</p>
                        <p className="font-medium">
                          {closingDate?.toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) || 'Non specificata'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Numero di Posti</p>
                        <p className="font-medium">{job.numero_di_posti || 'Non specificato'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Scale className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Metodo di Valutazione</p>
                        <p className="font-medium">{formatMetodoValutazione(job.Valutazione)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Informazioni sul Ruolo</h2>
                <div className="prose max-w-none">
                  {job.Descrizione ? (
                    <div className="whitespace-pre-line break-words">
                      {(() => {
                        const content = typeof job.Descrizione === 'string' 
                          ? cleanHtmlContent(job.Descrizione) 
                          : job.riassunto || 'Nessuna descrizione disponibile';
                        return formatTextWithLinks(content);
                      })()}
                    </div>
                  ) : (
                    <div className="break-words">
                      {job.riassunto ? formatTextWithLinks(job.riassunto) : 'Nessuna descrizione disponibile'}
                    </div>
                  )}
                </div>
              </div>

              {/* Organizational Details - Only show if there's data */}
              {(() => {
                const normalizedCategory = normalizeConcorsoCategory(job);
                const hasOrgDetails = job.collocazione_organizzativa || 
                  job.settore_professionale || 
                  job.settore || 
                  job.regime_impegno || 
                  job.regime ||
                  normalizedCategory !== 'Altro';
                
                return hasOrgDetails && (
                  <div className="space-y-4 border rounded-lg p-8">
                    <h2 className="text-lg font-semibold">Dettagli Organizzativi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.collocazione_organizzativa && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">Collocazione Organizzativa</p>
                          <p className="font-medium">{job.collocazione_organizzativa}</p>
                        </div>
                      )}
                      {normalizedCategory !== 'Altro' && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">Categoria</p>
                          <p className="font-medium">{normalizedCategory}</p>
                        </div>
                      )}
                      {(job.settore_professionale || job.settore) && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">Settore Professionale</p>
                          <p className="font-medium">{toSentenceCase(job.settore_professionale || job.settore || '')}</p>
                        </div>
                      )}
                      {(job.regime_impegno || job.regime) && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">Regime di Impegno</p>
                          <p className="font-medium">{toSentenceCase(job.regime_impegno || job.regime || '')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Technical Requirements */}
              {(hasValidContent(job.conoscenze_tecnico_specialistiche) || 
                hasValidContent(job.capacita_richieste) || 
                hasValidContent(job.programma_di_esame) || 
                hasValidContent(job.requisiti_generali)) && (
                <div className="space-y-4 border rounded-lg p-8">
                  <h2 className="text-lg font-semibold">Requisiti e Programma</h2>
                  <div className="space-y-6">
                    {hasValidContent(job.requisiti_generali) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Requisiti Generali</h3>
                        <ul className="list-disc pl-5">
                          {Array.isArray(job.requisiti_generali) 
                            ? job.requisiti_generali
                                .filter(item => item.trim() !== 'Non specificato')
                                .map((item: string, index: number) => (
                                  <li key={index}>{formatListItem(item)}</li>
                                ))
                            : <li>{formatListItem(job.requisiti_generali || '')}</li>
                          }
                        </ul>
                      </div>
                    )}
                    {hasValidContent(job.conoscenze_tecnico_specialistiche) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Conoscenze Tecnico-Specialistiche</h3>
                        <ul className="list-disc pl-5">
                          {Array.isArray(job.conoscenze_tecnico_specialistiche) 
                            ? job.conoscenze_tecnico_specialistiche
                                .filter(item => item.trim() !== 'Non specificato')
                                .map((item: string, index: number) => (
                                  <li key={index}>{formatListItem(item)}</li>
                                ))
                            : <li>{formatListItem(String(job.conoscenze_tecnico_specialistiche || ''))}</li>
                          }
                        </ul>
                      </div>
                    )}
                    {hasValidContent(job.capacita_richieste) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Capacità Richieste</h3>
                        <ul className="list-disc pl-5">
                          {Array.isArray(job.capacita_richieste)
                            ? job.capacita_richieste
                                .filter(item => item.trim() !== 'Non specificato')
                                .map((item: string, index: number) => (
                                  <li key={index}>{formatListItem(item)}</li>
                                ))
                            : <li>{formatListItem(job.capacita_richieste)}</li>
                          }
                        </ul>
                      </div>
                    )}
                    {hasValidContent(job.programma_di_esame) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Programma d'Esame</h3>
                        <ul className="list-disc pl-5">
                          {Array.isArray(job.programma_di_esame)
                            ? job.programma_di_esame
                                .filter(item => item.trim() !== 'Non specificato')
                                .map((item: string, index: number) => (
                                  <li key={index}>{formatListItem(item)}</li>
                                ))
                            : <li>{formatListItem(job.programma_di_esame)}</li>
                          }
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(job.contatti || job.pa_link) && (
                <div className="space-y-4 border rounded-lg p-8">
                  <h2 className="text-lg font-semibold">Contatti e Link Utili</h2>
                  <div className="space-y-4">
                    {job.contatti && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Contatti</p>
                        <p className="font-medium">{job.contatti}</p>
                      </div>
                    )}
                    {job.pa_link && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Link PA</p>
                        <Button 
                          variant="ghost" 
                          asChild 
                          className="w-full justify-start p-2 h-auto"
                        >
                          <a 
                            href={job.pa_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-left"
                          >
                            <span className="truncate">{job.pa_link}</span>
                            <ExternalLinkIcon className="w-4 h-4 ml-2 flex-shrink-0" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PDF Documents */}
              {job.pdf_links && job.pdf_links.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Documenti Aggiuntivi</h2>
                  <div className="space-y-2">
                    {job.pdf_links.map((link, index) => (
                      <Button 
                        key={index} 
                        variant="ghost" 
                        asChild 
                        className="w-full justify-start"
                      >
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          Documento {index + 1}
                          <ExternalLinkIcon className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Posted Information */}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  Pubblicato il {formatDate(job.publication_date)?.toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) || 'Data di pubblicazione non disponibile'}
                </div>
                <div>
                  ID Concorso: {job.concorso_id || job.id || 'Non disponibile'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface - Conditional based on user authentication */}
      {user ? (
        /* Authenticated User Chat Interface */
        <div className="flex-shrink-0 border-t bg-white" style={{
          borderTopRightRadius: 8,
          borderTopLeftRadius: 8,
          background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), #c2e9fb)',
        }}>
          <div className="max-w-4xl mx-auto">
            {/* Header with Chevron */}
            <div 
              className="flex justify-between items-center p-4 cursor-pointer"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Genio ti aiuta a fare chiarezza</h3>
                  <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 h-5">
                    Beta
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Domande su requisiti o scadenze? Chiedi a Genio, il tuo assistente AI.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDrawerOpen(!isDrawerOpen);
                }}
              >
                {isDrawerOpen ? (
                  <ChevronDown className="h-6 w-6" />
                ) : (
                  <ChevronUp className="h-6 w-6" />
                )}
              </Button>
            </div>

            {/* Expandable Content */}
            <div className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${
              isDrawerOpen ? 'max-h-[600px] p-4' : 'max-h-0'
            }`}>
              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div 
                  className="space-y-4 mb-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" 
                  style={{
                    scrollbarWidth: 'thin',
                    msOverflowStyle: 'none',
                  }}
                >
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : message.content.startsWith('Error:')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div 
                            className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:space-y-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_li]:mb-1 [&_strong]:font-semibold"
                            dangerouslySetInnerHTML={{ __html: marked(message.content) }}
                          />
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoadingResponse && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-800 flex items-center">
                        <Spinner size={16} className="mr-2" />
                        <span>Genio sta pensando...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Show loading indicator if it's the first message */}
              {chatMessages.length === 0 && isLoadingResponse && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-800 flex items-center">
                    <Spinner size={16} className="mr-2" />
                    <span>Genio sta pensando...</span>
                  </div>
                </div>
              )}

              {/* Suggestion Boxes - Only show when no messages exist */}
              {chatMessages.length === 0 && !isLoadingResponse && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Domande suggerite:</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setInputValue("Quali sono i requisiti principali?");
                        setTimeout(() => handleChatSubmit(), 100);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs rounded-full transition-colors"
                    >
                      Quali sono i requisiti principali?
                    </button>
                    <button 
                      onClick={() => {
                        setInputValue("Quando scade il bando?");
                        setTimeout(() => handleChatSubmit(), 100);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs rounded-full transition-colors"
                    >
                      Quando scade il bando?
                    </button>
                    <button 
                      onClick={() => {
                        setInputValue("Come prepararsi per il concorso?");
                        setTimeout(() => handleChatSubmit(), 100);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs rounded-full transition-colors"
                    >
                      Come prepararsi per il concorso?
                    </button>
                  </div>
                </div>
              )}

              {/* Input Section */}
              <PromptInput
                className="border-input bg-background/80 border shadow-sm"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                onSubmit={handleChatSubmit}
              >
                <PromptInputTextarea 
                  placeholder="Fai una domanda su questo concorso..." 
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                />
                <PromptInputActions className="justify-end">
                  <Button
                    size="sm"
                    className="size-9 cursor-pointer rounded-full"
                    onClick={handleChatSubmit}
                    disabled={!inputValue.trim() || isLoadingResponse}
                    aria-label="Invia"
                  >
                    {isLoadingResponse ? (
                      <Spinner size={16} />
                    ) : (
                      <ArrowUpIcon className="h-4 min-h-4 min-w-4 w-4" />
                    )}
                  </Button>
                </PromptInputActions>
              </PromptInput>
            </div>
          </div>
        </div>
      ) : (
        /* Guest Chat Interface */
        <GuestChatInterface />
      )}

      {/* Report Modal */}
      {job && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          concorsoId={job.id}
          concorsoTitle={job.Titolo || job.titolo_originale || 'Titolo non disponibile'}
          concorsoEnte={job.Ente || 'Ente non specificato'}
        />
      )}
    </div>
  );
} 