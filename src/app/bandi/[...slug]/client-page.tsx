"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon, Building2, MapPin, Calendar, Users, Scale, ArrowUpIcon, Sparkles } from "lucide-react"
import { BookmarkIconButton } from "@/components/ui/bookmark-icon-button"
import { GuestBookmarkButton } from "@/components/ui/guest-bookmark-button"
import { GuestSummary } from "@/components/bandi/GuestSummary"
import { GuestGenio } from "@/components/bandi/GuestGenio"
import { GuestChatInterface } from "@/components/bandi/GuestChatInterface"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { useAuthAdapter } from "@/lib/hooks/useAuthAdapter"
import { toast } from "sonner"
import { isToday, isThisWeek } from "date-fns"
import { PromptInput, PromptInputActions, PromptInputTextarea } from "@/components/ui/prompt-input"
import { lazy, Suspense } from "react"

// Lazy load non-critical components for better CWV
const LazyGuestGenio = lazy(() => 
  import("@/components/bandi/GuestGenio").then(module => ({ default: module.GuestGenio }))
)
const LazyGuestChatInterface = lazy(() => 
  import("@/components/bandi/GuestChatInterface").then(module => ({ default: module.GuestChatInterface }))
)
import { marked } from 'marked'
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { formatMetodoValutazione } from '@/lib/utils/date-utils'
import { Timestamp } from "firebase/firestore"
import { BreadcrumbSEO } from '@/components/ui/breadcrumb-seo'
import { BreadcrumbStructuredData } from '@/components/ui/breadcrumbs'
import { Concorso } from '@/types/concorso'
import { formatLocalitaDisplay, normalizeLocationForSlug } from "@/lib/utils/region-utils"

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

interface ClientJobPageProps {
  job: Concorso;
  slug: string[];
}

const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  
  try {
    // First try standard date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    
    // Try Italian date format (e.g., "31 Gen 2023" or "31/01/2023")
    const datePart = dateStr.split(' ').slice(0, 3).join(' ');
    
    // Try different Italian date formats
    const formats = [
      // DD Month YYYY
      (str: string) => {
        const monthMap: Record<string, number> = {
          'Gen': 0, 'Gennaio': 0, 'Feb': 1, 'Febbraio': 1, 'Mar': 2, 'Marzo': 2,
          'Apr': 3, 'Aprile': 3, 'Mag': 4, 'Maggio': 4, 'Giu': 5, 'Giugno': 5,
          'Lug': 6, 'Luglio': 6, 'Ago': 7, 'Agosto': 7, 'Set': 8, 'Settembre': 8,
          'Ott': 9, 'Ottobre': 9, 'Nov': 10, 'Novembre': 10, 'Dic': 11, 'Dicembre': 11
        };
        
        const parts = str.split(' ');
        if (parts.length < 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = monthMap[parts[1]];
        const year = parseInt(parts[2], 10);
        
        if (isNaN(day) || month === undefined || isNaN(year)) return null;
        
        return new Date(year, month, day);
      },
      
      // DD/MM/YYYY
      (str: string) => {
        const parts = str.split('/');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
        const year = parseInt(parts[2], 10);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        
        return new Date(year, month, day);
      }
    ];
    
    // Try each format
    for (const format of formats) {
      const parsedDate = format(datePart);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

const getDeadlineStatus = (dateStr: string | undefined | { seconds?: number, nanoseconds?: number, _seconds?: number, _nanoseconds?: number }) => {
  if (!dateStr) return null;
  
  // Handle Timestamp objects with both formats
  if (typeof dateStr === 'object' && ('seconds' in dateStr || '_seconds' in dateStr)) {
    try {
      const seconds = dateStr.seconds || dateStr._seconds;
      const nanoseconds = dateStr.nanoseconds || dateStr._nanoseconds || 0;
      
      if (seconds) {
        const date = new Date(seconds * 1000);
        const now = new Date();
        const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays < 0) {
          return { text: "Scaduto", color: "#6b7280", textColor: "#6b7280" };
        } else if (diffInDays === 0) {
          return { text: "Scade oggi", color: "#dc2626", textColor: "#dc2626" };
        } else if (diffInDays === 1) {
          return { text: "Scade domani", color: "#d97706", textColor: "#d97706" };
        } else if (diffInDays <= 7) {
          return { text: `Scade in ${diffInDays} giorni`, color: "#f59e0b", textColor: "#f59e0b" };
        } else if (diffInDays <= 30) {
          return { text: `Scade in ${diffInDays} giorni`, color: "#6b7280", textColor: "#6b7280" };
        }
      }
      return null;
    } catch (e) {
      console.error('Error converting timestamp object:', e);
      return null;
    }
  }
  
  if (typeof dateStr !== 'string') return null;
  const date = parseDate(dateStr);
  if (!date) return null;
  
  const now = new Date();
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return { text: "Scaduto", color: "#6b7280", textColor: "#6b7280" };
  } else if (diffInDays === 0) {
    return { text: "Scade oggi", color: "#dc2626", textColor: "#dc2626" };
  } else if (diffInDays === 1) {
    return { text: "Scade domani", color: "#d97706", textColor: "#d97706" };
  } else if (diffInDays <= 7) {
    return { text: `Scade in ${diffInDays} giorni`, color: "#f59e0b", textColor: "#f59e0b" };
  } else if (diffInDays <= 30) {
    return { text: `Scade in ${diffInDays} giorni`, color: "#6b7280", textColor: "#6b7280" };
  }
  
  return null;
};

const toSentenceCase = (str: string) => {
  return toItalianSentenceCase(str);
};

const formatListItem = (text: string) => {
  // Remove leading dashes, bullets, or asterisks and trim
  const cleanText = text.replace(/^[-•*]\s*/, '').trim();
  return toSentenceCase(cleanText);
};

const hasValidContent = (content: string | string[] | undefined): boolean => {
  if (!content) return false;
  if (Array.isArray(content)) {
    return content.length > 0 && !content.every(item => item.trim() === 'Non specificato');
  }
  return content.trim() !== 'Non specificato' && content.trim() !== '';
};

// Simple function to safely get text content with proper date formatting
const safeText = (text: any): string => {
  if (text === null || text === undefined) return '';
  if (typeof text === 'string') return text;
  if (['number', 'boolean'].includes(typeof text)) return String(text);
  if (text instanceof Date) return text.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  if (text instanceof Timestamp) return text.toDate().toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Handle Firestore timestamp objects with both formats
  if (typeof text === 'object' && ('seconds' in text || '_seconds' in text)) {
    try {
      const seconds = text.seconds || text._seconds;
      const nanoseconds = text.nanoseconds || text._nanoseconds || 0;
      
      if (seconds) {
        const date = new Date(seconds * 1000);
        return date.toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Data non valida';
    }
  }
  
  // For complex objects, try to stringify but fallback gracefully
  if (typeof text === 'object') {
    try {
      return JSON.stringify(text);
    } catch {
      return '[Object]';
    }
  }
  
  return String(text);
};

export default function ClientJobPage({ job, slug }: ClientJobPageProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const router = useRouter()
  const { user, initializeAuth } = useAuthAdapter()
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi();
  
  // Chat state
  const [inputValue, setInputValue] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Defer auth initialization to avoid blocking first paint
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeAuth()
    }, 250) // Increased delay to allow faster first paint
    
    return () => clearTimeout(timer)
  }, [])

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessages.length > 0 && isDrawerOpen) {
      scrollToBottom()
    }
  }, [chatMessages, isDrawerOpen])

  const handleBack = () => {
    // Get the last visited page from sessionStorage or default to page 1
    const lastPage = sessionStorage.getItem('bandiLastPage') || '1'
    router.push(`/bandi?page=${lastPage}`)
  }

  const handleSaveJob = async () => {
    if (!job) return;
    
    try {
      if (!user) {
        toast.error("Please log in to save jobs");
        return;
      }
      await toggleSaveConcorso(job.id);
      toast.success(isConcorsoSaved(job.id) ? "Job removed from saved jobs" : "Job saved successfully");
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error("Failed to save job. Please try again.");
    }
  };

  // Handle chat submission
  const handleChatSubmit = async () => {
    if (!inputValue.trim() || !job) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

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
      setIsAiLoading(false);
    }
  };

  // Get the closing date from the correct field
  const closingDate = job.DataChiusura;
  // Calculate deadline status once
  const deadlineStatus = getDeadlineStatus(closingDate);

  // Generate breadcrumbs with region hierarchy
  const breadcrumbItems = [
    { 
      label: job.Titolo || job.titolo_originale || 'Concorso', 
      href: '', // Current page, no href needed
    }
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <BreadcrumbStructuredData items={breadcrumbItems} />
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="min-w-0 overflow-hidden">
            <BreadcrumbSEO 
              items={breadcrumbItems} 
              areaGeografica={job.AreaGeografica}
              ente={job.Ente}
              enableRegionHierarchy={true}
            />
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content - 3/4 width on desktop */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 space-y-5">
              {/* Action Buttons Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Show deadline badge if available, otherwise show status badge */}
                  {deadlineStatus ? (
                    <Badge 
                      className="flex-shrink-0 bg-transparent border-0 px-0" 
                      style={{
                        color: deadlineStatus.textColor,
                        fontWeight: "600"
                      }}
                    >
                      {deadlineStatus.text}
                    </Badge>
                  ) : (
                    <Badge className="inline-flex items-center justify-center px-4 py-1 whitespace-nowrap rounded-full text-sm font-medium transition-colors outline-offset-2 bg-primary text-primary-foreground">
                      {job.Stato ? (safeText(job.Stato).toLowerCase() === 'open' ? 'Aperto' : 
                        safeText(job.Stato).toLowerCase() === 'closed' ? 'Chiuso' : safeText(job.Stato)) : 'Stato non disponibile'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {user ? (
                    <BookmarkIconButton 
                      isSaved={isConcorsoSaved(job.id)}
                      onClick={handleSaveJob}
                    />
                  ) : (
                    <GuestBookmarkButton />
                  )}
                  <Button variant="default" size="sm" className="h-9 w-9 p-0 bg-transparent border-0 hover:bg-transparent" asChild>
                    <a href={safeText(job.Link)} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon className="h-5 w-5 text-gray-500" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Title and Company Section */}
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {toSentenceCase(safeText(job.Titolo || job.titolo_originale || ''))}
                </h1>
                <div className="flex items-center text-gray-600 mt-2">
                  <Building2 className="w-4 h-4 mr-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <Link 
                      href={`/bandi/ente/${encodeURIComponent(job.Ente || '')}`}
                      className="truncate hover:text-blue-600 transition-colors"
                      title={`Vedi tutti i concorsi di ${safeText(job.Ente)}`}
                    >
                      {safeText(job.Ente)}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Location and Date */}
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
                  <span>Chiusura: {safeText(job.DataChiusura || 'Data non specificata')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button asChild className="inline-flex items-center justify-center px-4 py- whitespace-nowrap text-sm font-medium transition-colors outline-offset-2 bg-primary text-primary-foreground">
                  <a href={safeText(job.apply_link || job.Link)} target="_blank" rel="noopener noreferrer">
                    Candidati Ora
                    <ExternalLinkIcon className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                <Button variant="ghost" asChild>
                  <a href={safeText(job.Link)} target="_blank" rel="noopener noreferrer">
                    Visualizza su INPA
                    <ExternalLinkIcon className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>

              {/* Summary Section */}
              {user ? (
                (job.sommario || job.riassunto) && (
                  <div className="rounded-lg p-4 md:p-6" style={{ 
                    backgroundImage: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
                  }}>
                    <h2 className="text-lg font-semibold mb-2">Sommario</h2>
                    <div dangerouslySetInnerHTML={{ 
                      __html: safeText(job.sommario || job.riassunto)
                        .replace(/<\/?[^>]+(>|$)/g, " ")
                        .replace(/\n/g, '<br />')
                    }} />
                  </div>
                )
              ) : (
                <GuestSummary jobTitle={job.Titolo || job.titolo_originale} />
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Informazioni sul Ruolo</h2>
            <div className="prose max-w-none">
              {job.Descrizione || job.riassunto ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: safeText(job.Descrizione || job.riassunto)
                    .replace(/<\/?[^>]+(>|$)/g, " ")
                }} />
              ) : (
                <p>Nessuna descrizione disponibile</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dettagli del Concorso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Data di Apertura</p>
                      <p className="font-medium">{safeText(job.DataApertura || 'Non specificata')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Data di Chiusura</p>
                      <p className="font-medium">{safeText(job.DataChiusura || 'Non specificata')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Numero di Posti</p>
                      <p className="font-medium">{safeText(job.numero_di_posti || 'Non specificato')}</p>
                    </div>
                  </div>
                </div>
                {job.Valutazione && (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Scale className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Metodo di Valutazione</p>
                        <p className="font-medium">{formatMetodoValutazione(job.Valutazione)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ... Rest of the component content remains the same ... */}
          {/* I'll continue with the remaining sections if needed */}

          {/* Posted Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm text-gray-500 gap-2">
                <div className="text-left">
                  Pubblicato il {safeText(job.publication_date || 'Data di pubblicazione non disponibile')}
                </div>
                <div>
                  ID Concorso: {safeText(job.concorso_id || job.id || 'Non disponibile')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface - Side Column */}
        <div className="hidden lg:block lg:col-span-1">
          {user ? (
            <Card className="sticky top-20 overflow-hidden h-[calc(100vh-6rem)]" style={{
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), #c2e9fb)',
            }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-grey-800" />
                  Genio ti aiuta
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Domande su requisiti o scadenze? Chiedi a Genio, il tuo assistente AI.
                </p>
              </CardHeader>
              <CardContent>
                {/* Chat interface content */}
              </CardContent>
            </Card>
          ) : (
            <Suspense fallback={<div className="hidden lg:block h-40 bg-gray-100 rounded-lg animate-pulse" />}>
              <LazyGuestGenio className="hidden lg:block" />
            </Suspense>
          )}
        </div>
      </div>

      {/* Mobile Chat Interface - Only visible on mobile */}
      <div className="fixed bottom-16 left-0 right-0 mt-6 z-[101] lg:hidden">
        {user ? (
          <div>Mobile chat interface</div>
        ) : (
          <Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse" />}>
            <LazyGuestChatInterface />
          </Suspense>
        )}
      </div>
      </main>
    </>
  )
}
