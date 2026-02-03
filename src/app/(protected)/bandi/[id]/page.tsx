"use client"

import React, { useEffect, useState, useRef, use } from "react"
import { doc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon, Building2, MapPin, Calendar, Users, Scale, ArrowUpIcon, Sparkles } from "lucide-react"
import { BookmarkIconButton } from "@/components/ui/bookmark-icon-button"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSavedConcorsi } from "@/lib/hooks/useSavedConcorsi"
import { useAuth } from "@/lib/hooks/useAuth"
import { toast } from "sonner"
import { isToday, isThisWeek } from "date-fns"
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { marked } from 'marked'
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { formatMetodoValutazione, formatItalianDate } from '@/lib/utils/date-utils'
import { getEnteUrl } from '@/lib/utils/ente-utils'
import { getLocalitaUrl, splitLocationString } from '@/lib/utils/localita-utils'

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

interface Job {
  id: string;
  job_id: string;
  Title: string;
  summary: string;
  job_location: string;
  category_by_ente: string;
  category_by_occupazione: string;
  "Ente di riferimento": string;
  Ente?: string;
  AreaGeografica?: string;
  requisitions: string;
  skills: string;
  titolo_di_studio: string;
  "Numero di posti": number;
  "Apply Link": string;
  Link: string;
  "Link al sito della PA": string;
  "Data apertura candidature": string;
  "Data chiusura candidature": string;
  "Job Details": string;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
  Stato?: string;
  Titolo?: string;
  TitoloOriginale?: string;
  DataChiusura?: string;
  DataApertura?: string;
  numero_di_posti?: number;
  apply_link?: string;
  LinkOriginale?: string;
  LinkPA?: string;
  riassunto?: string;
  Descrizione?: string;
  AmbitoLavorativo?: string;
  Categoria?: string;
  Settore?: string;
  Regime?: string;
  Valutazione?: string;
  publication_date?: string;
  concorso_id?: string;
  pdf_links?: string[];
  collocazioneOrganizzativa?: string;
  tipologia?: string;
  ambitoLavorativo?: string;
  categoria?: string;
  settore?: string;
  regime?: string;
  conoscenzeTecnicoSpecialistiche?: string | string[];
  capacitaRichieste?: string | string[];
  programma_di_esame?: string | string[];
  contatti?: string;
  pa_link?: string;
  collocazione_organizzativa?: string;
  ambito_lavorativo?: string;
  settore_professionale?: string;
  regime_impegno?: string;
  conoscenze_tecnico_specialistiche?: string | string[];
  requisiti_generali?: string | string[];
  // New fields for grouped regions functionality
  isGrouped?: boolean;
  regions?: string[];
  regionCount?: number;
  allConcorsi?: unknown[];
}

const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;

  try {
    // First try standard date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Try Italian date format (e.g., "31 Gen 2023" or "31/01/2023")
    // Remove any time part
    const datePart = dateStr.split(' ').slice(0, 3).join(' ');

    // Try different Italian date formats
    const formats = [
      // DD Month YYYY
      (str: string) => {
        const monthMap: Record<string, number> = {
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

const getDeadlineStatus = (dateStr: string | undefined | { seconds: number, nanoseconds: number }) => {
  if (!dateStr) return null;

  // Handle Timestamp objects
  if (typeof dateStr === 'object' && 'seconds' in dateStr && 'nanoseconds' in dateStr) {
    try {
      const date = new Timestamp(dateStr.seconds, dateStr.nanoseconds).toDate();
      if (isToday(date)) {
        return { text: "Scade oggi", color: "#dc2626", textColor: "#dc2626" };
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        return { text: "Scade questa settimana", color: "#f59e0b", textColor: "#f59e0b" };
      }
      return null;
    } catch (e) {
      console.error('Error converting timestamp object:', e);
      return null;
    }
  }

  const date = parseDate(dateStr);
  if (!date) return null;

  if (isToday(date)) {
    return { text: "Scade oggi", color: "#dc2626", textColor: "#dc2626" };
  } else if (isThisWeek(date, { weekStartsOn: 1 })) {
    return { text: "Scade questa settimana", color: "#f59e0b", textColor: "#f59e0b" };
  }

  return null;
};

const toSentenceCase = (str: string) => {
  return toItalianSentenceCase(str);
};

// Helper function to render grouped regions
const renderGroupedRegions = (job: Job) => {
  if (job.isGrouped && job.regions && job.regions.length > 1) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
        <div className="flex flex-wrap gap-1">
          {job.regions.slice(0, 3).map((region: string, index: number) => (
            <React.Fragment key={region}>
              <Link
                href={getLocalitaUrl(region, 'bandi')}
                className="hover:text-foreground transition-colors text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md"
              >
                {region}
              </Link>
              {index < Math.min((job.regions?.length || 0) - 1, 2) && (
                <span className="text-xs text-gray-400">•</span>
              )}
            </React.Fragment>
          ))}
          {(job.regions?.length || 0) > 3 && (
            <span className="text-xs text-gray-500">
              +{(job.regions?.length || 0) - 3} altre
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 ml-1">
          ({job.regionCount || job.regions?.length || 0} regioni)
        </span>
      </div>
    );
  }

  // Single region display or split combined regions
  const locationText = job.job_location || job.AreaGeografica || 'Località non specificata';
  const regions = splitLocationString(locationText);

  if (regions.length > 1) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
        <div className="flex flex-wrap gap-1">
          {regions.slice(0, 3).map((region: string, index: number) => (
            <React.Fragment key={region}>
              <Link
                href={getLocalitaUrl(region, 'bandi')}
                className="hover:text-foreground transition-colors text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md"
              >
                {region}
              </Link>
              {index < Math.min(regions.length - 1, 2) && (
                <span className="text-xs text-gray-400">•</span>
              )}
            </React.Fragment>
          ))}
          {regions.length > 3 && (
            <span className="text-xs text-gray-500">
              +{regions.length - 3} altre
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 ml-1">
          ({regions.length} regioni)
        </span>
      </div>
    );
  }

  // Single region display
  return (
    <div className="flex items-center">
      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
      <Link
        href={getLocalitaUrl(locationText, 'bandi')}
        className="hover:text-foreground transition-colors"
      >
        <span>{locationText}</span>
      </Link>
    </div>
  );
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

// Simple function to safely get text content
// Simple function to safely get text content
const safeText = (text: unknown): string => {
  if (text === null || text === undefined) return '';
  if (typeof text === 'string') return text;
  if (['number', 'boolean'].includes(typeof text)) return String(text);

  // Try to format as date first
  if (text instanceof Date || text instanceof Timestamp || (typeof text === 'object' && ('seconds' in text || '_seconds' in text))) {
    const formatted = formatItalianDate(text);
    if (formatted) return formatted;
  }

  return JSON.stringify(text);
};

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi();

  // Chat state
  const [inputValue, setInputValue] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Desktop detection and redirect
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024
    if (isDesktop) {
      // Redirect to main page with ID parameter on desktop
      router.replace(`/bandi?id=${id}`)
      return
    }
  }, [id, router])

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

  useEffect(() => {
    async function fetchJob() {
      try {
        setIsLoading(true)
        // Debug log

        if (!db) {
          console.error('Firestore instance not available');
          throw new Error('Firestore instance not available');
        }

        const jobDoc = await getDoc(doc(db, "concorsi", id))
        // Debug log
        if (jobDoc.exists()) {
          const data = jobDoc.data();
          // Debug log

          // Convert Firestore timestamps to strings
          const openingDate = data["Data apertura candidature"] instanceof Timestamp
            ? data["Data apertura candidature"].toDate().toLocaleDateString()
            : data["Data apertura candidature"];
          const closingDate = data["Data chiusura candidature"] instanceof Timestamp
            ? data["Data chiusura candidature"].toDate().toLocaleDateString()
            : data["Data chiusura candidature"];

          // Ensure numero di posti is a number
          const numeroDiPosti = data["Numero di posti"] || data["numero di posti"] || 0;

          setJob({
            id: jobDoc.id,
            ...data,
            "Data apertura candidature": openingDate,
            "Data chiusura candidature": closingDate,
            "Numero di posti": numeroDiPosti,
          } as Job);
        }
      } catch (error) {
        console.error("Error fetching job:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJob()
  }, [id])

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

  if (isLoading) {
    return (
      <>
        <div className="container py-8 pt-24">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </>
    )
  }

  if (!job) {
    return (
      <>
        <div className="container py-8 pt-24">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Job not found</h1>
            <Button
              variant="default"
              className="flex items-center text-brand hover:text-brand/80"
              onClick={handleBack}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Torna ai bandi
            </Button>
          </div>
        </div>
      </>
    )
  }

  // Get the closing date from either field
  const closingDate = job["Data chiusura candidature"] || job.DataChiusura;
  // Calculate deadline status once
  const deadlineStatus = getDeadlineStatus(closingDate);

  return (
    <main className="container px-3 py-4 md:px-6 md:py-6">
      <div className="mb-4">
        <Button
          variant="default"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100"
          onClick={handleBack}
          aria-label="Torna ai bandi"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Torna ai bandi
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3/4 width on desktop */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 md:p-6 space-y-5">
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
                  <BookmarkIconButton
                    isSaved={isConcorsoSaved(job.id)}
                    onClick={handleSaveJob}
                  />
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
                  {toSentenceCase(safeText(job.Title || job.Titolo || job.TitoloOriginale || ''))}
                </h1>
                <div className="flex items-center text-gray-600 mt-2">
                  <Building2 className="w-4 h-4 mr-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={getEnteUrl(safeText(job["Ente di riferimento"] || job.Ente), 'bandi')}
                      className="truncate hover:text-foreground transition-colors"
                      title={safeText(job["Ente di riferimento"] || job.Ente)}
                    >
                      {safeText(job["Ente di riferimento"] || job.Ente)}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Location and Date */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {renderGroupedRegions(job)}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Chiusura: {safeText(job["Data chiusura candidature"] || job.DataChiusura || 'Data non specificata')}</span>
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
              {(job.summary || job.riassunto) && (
                <div className="rounded-lg p-4 md:p-6" style={{
                  backgroundImage: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
                }}>
                  <h2 className="text-lg font-semibold mb-2">Sommario</h2>
                  <div dangerouslySetInnerHTML={{
                    __html: safeText(job.summary || job.riassunto)
                      .replace(/<\/?[^>]+(>|$)/g, " ")
                      .replace(/\n/g, '<br />')
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Informazioni sul Ruolo</h2>
            <div className="prose max-w-none">
              {job["Job Details"] || job.Descrizione || job.riassunto ? (
                <div dangerouslySetInnerHTML={{
                  __html: safeText(job["Job Details"] || job.Descrizione || job.riassunto)
                    .replace(/<\/?[^>]+(>|$)/g, " ")

                }} />
              ) : (
                <p>Nessuna descrizione disponibile</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Dettagli del Concorso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Data di Apertura</p>
                    <p className="font-medium">{safeText(job["Data apertura candidature"] || job.DataApertura || 'Non specificata')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Data di Chiusura</p>
                    <p className="font-medium">{safeText(job["Data chiusura candidature"] || job.DataChiusura || 'Non specificata')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Numero di Posti</p>
                    <p className="font-medium">{safeText(job["Numero di posti"] || job.numero_di_posti || 'Non specificato')}</p>
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
          </div>

          {/* Organizational Details */}
          {(job.collocazione_organizzativa || job.ambito_lavorativo || job.tipologia || job.categoria ||
            job.settore || job.regime || job.settore_professionale || job.regime_impegno ||
            job.collocazione_organizzativa || job.ambito_lavorativo) && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                <h2 className="text-lg font-semibold">Dettagli Organizzativi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.collocazione_organizzativa && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Collocazione Organizzativa</p>
                      <p className="font-medium">{safeText(job.collocazione_organizzativa)}</p>
                    </div>
                  )}
                  {job.ambito_lavorativo && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Ambito Lavorativo</p>
                      <p className="font-medium">{safeText(job.ambito_lavorativo)}</p>
                    </div>
                  )}
                  {job.settore_professionale && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Settore Professionale</p>
                      <p className="font-medium">{safeText(job.settore_professionale)}</p>
                    </div>
                  )}
                  {job.regime_impegno && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Regime di Impegno</p>
                      <p className="font-medium">{safeText(job.regime_impegno)}</p>
                    </div>
                  )}
                  {job.tipologia && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Tipologia</p>
                      <p className="font-medium">{safeText(job.tipologia)}</p>
                    </div>
                  )}
                  {job.categoria && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Categoria</p>
                      <p className="font-medium">{safeText(job.categoria)}</p>
                    </div>
                  )}
                  {job.settore && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Settore</p>
                      <p className="font-medium">{safeText(job.settore)}</p>
                    </div>
                  )}
                  {job.regime && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Regime</p>
                      <p className="font-medium">{safeText(job.regime)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Technical Requirements */}
          {(hasValidContent(job.conoscenzeTecnicoSpecialistiche) ||
            hasValidContent(job.conoscenze_tecnico_specialistiche) ||
            hasValidContent(job.capacitaRichieste) ||
            hasValidContent(job.programma_di_esame) ||
            hasValidContent(job.requisiti_generali)) && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
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
                          : <li>{formatListItem(String(job.requisiti_generali || ''))}</li>
                        }
                      </ul>
                    </div>
                  )}
                  {(hasValidContent(job.conoscenzeTecnicoSpecialistiche) || hasValidContent(job.conoscenze_tecnico_specialistiche)) && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Conoscenze Tecnico-Specialistiche</h3>
                      <ul className="list-disc pl-5">
                        {(() => {
                          const knowledge = job.conoscenzeTecnicoSpecialistiche || job.conoscenze_tecnico_specialistiche;
                          if (Array.isArray(knowledge)) {
                            return knowledge
                              .filter(item => item.trim() !== 'Non specificato')
                              .map((item: string, index: number) => (
                                <li key={index}>{formatListItem(item)}</li>
                              ));
                          }
                          return knowledge && knowledge.trim() !== 'Non specificato'
                            ? <li>{formatListItem(String(knowledge))}</li>
                            : null;
                        })()}
                      </ul>
                    </div>
                  )}
                  {hasValidContent(job.capacitaRichieste) && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Capacità Richieste</h3>
                      <ul className="list-disc pl-5">
                        {Array.isArray(job.capacitaRichieste)
                          ? job.capacitaRichieste
                            .filter((item: string) => item.trim() !== 'Non specificato')
                            .map((item: string, index: number) => (
                              <li key={index}>{formatListItem(item)}</li>
                            ))
                          : <li>{formatListItem(String(job.capacitaRichieste || ''))}</li>
                        }
                      </ul>
                    </div>
                  )}
                  {hasValidContent(job.programma_di_esame) && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Programma d&apos;Esame</h3>
                      <ul className="list-disc pl-5">
                        {Array.isArray(job.programma_di_esame)
                          ? job.programma_di_esame
                            .filter(item => item.trim() !== 'Non specificato')
                            .map((item: string, index: number) => (
                              <li key={index}>{formatListItem(item)}</li>
                            ))
                          : <li>{formatListItem(String(job.programma_di_esame || ''))}</li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Contact Information */}
          {(job.contatti || job.pa_link || job["Link al sito della PA"]) && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Contatti e Link Utili</h2>
              <div className="space-y-4">
                {job.contatti && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Contatti</p>
                    <p className="font-medium">{safeText(job.contatti)}</p>
                  </div>
                )}
                {(job.pa_link || job["Link al sito della PA"]) && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Link PA</p>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start p-2 h-auto"
                    >
                      <a
                        href={safeText(job.pa_link || job["Link al sito della PA"])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-left"
                      >
                        <span className="truncate">{safeText(job.pa_link || job["Link al sito della PA"])}</span>
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
            <div className="bg-white rounded-lg border p-6 space-y-4">
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
          <div className="bg-white rounded-lg border p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm text-gray-500 gap-2">
              <div className="text-left">
                Pubblicato il {safeText(job.publication_date || 'Data di pubblicazione non disponibile')}
              </div>
              <div>
                ID Concorso: {safeText(job.concorso_id || 'Non disponibile')}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface - Side Column on Desktop (1/4 width) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-20 rounded-lg border bg-white overflow-hidden h-[calc(100vh-6rem)]" style={{
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), #c2e9fb)',
          }}>
            <div className="p-4 border-b">
              <h3 className="font-medium flex items-center gap-1">
                <Sparkles className="h-4 w-4 m-1 text-grey-800" />
                Genio ti aiuta a fare chiarezza
              </h3>
              <p className="text-sm text-muted-foreground">
                Domande su requisiti o scadenze? Chiedi a Genio, il tuo assistente AI.
              </p>
            </div>

            {/* Chat Messages */}
            <div className="p-4 flex flex-col h-[calc(100%-5rem)]">
              {chatMessages.length > 0 ? (
                <div
                  className="space-y-4 mb-4 overflow-y-auto flex-grow pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                  style={{
                    scrollbarWidth: 'thin',
                    msOverflowStyle: 'none',
                  }}
                >
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2 text-sm ${message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.content.startsWith('Error:')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {message.role === 'assistant' ? (
                          <div
                            className="prose prose-xs max-w-none prose-p:leading-relaxed prose-p:text-sm prose-pre:p-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_li]:mb-1 [&_li]:text-sm [&_strong]:font-semibold"
                            dangerouslySetInnerHTML={{ __html: marked(message.content) }}
                          />
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
                        <Spinner size={16} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="text-center flex flex-col justify-center items-center flex-grow text-sm">
                  <p className="text-gray-500">Nessun messaggio. Inizia una conversazione!</p>
                  {isAiLoading && (
                    <div className="mt-4">
                      <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
                        <Spinner size={16} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Suggestion Boxes - Only show when no messages exist */}
              {chatMessages.length === 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Domande suggerite:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setInputValue("Quali sono i requisiti principali?");
                        handleChatSubmit();
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs rounded-full transition-colors"
                    >
                      Quali sono i requisiti principali?
                    </button>
                    <button
                      onClick={() => {
                        setInputValue("Quando scade il bando?");
                        handleChatSubmit();
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs rounded-full transition-colors"
                    >
                      Quando scade il bando?
                    </button>
                    <button
                      onClick={() => {
                        setInputValue("Come prepararsi per il concorso?");
                        handleChatSubmit();
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
                className="border-input mb-4 bg-background/80 border shadow-sm mt-auto"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                onSubmit={handleChatSubmit}
              >
                <PromptInputTextarea
                  placeholder="Fai una domanda su questo concorso..."
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                  className="text-sm"
                />
                <PromptInputActions className="justify-end">
                  <Button
                    size="sm"
                    className="size-9 cursor-pointer rounded-full"
                    onClick={handleChatSubmit}
                    disabled={!inputValue.trim() || isAiLoading}
                    aria-label="Invia"
                  >
                    {isAiLoading ? (
                      <Spinner size={16} className="text-white" />
                    ) : (
                      <ArrowUpIcon className="h-4 min-h-4 min-w-4 w-4" />
                    )}
                  </Button>
                </PromptInputActions>
              </PromptInput>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Chat Interface - Only visible on mobile */}
      <div className="fixed bottom-16 left-0 right-0 mt-6 z-[101] lg:hidden" style={{
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
        background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), #c2e9fb)',
        backdropFilter: 'blur(8px)'
      }}>
        <div className="max-w-4xl mx-auto">
          {/* Header with Chevron */}
          <div
            className="flex justify-between items-start p-4 cursor-pointer relative"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          >
            <div className="space-y-1 pr-8">
              <h3 className="font-medium flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Genio ti aiuta a fare chiarezza
              </h3>
              <p className="text-sm text-muted-foreground">
                Domande su requisiti o scadenze? Chiedi a Genio, il tuo assistente AI.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 absolute top-3 right-3 hover:bg-gray-200 hover:rounded-full transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawerOpen(!isDrawerOpen);
              }}
            >
              {isDrawerOpen ? (
                <ChevronDownIcon className="h-6 w-6" />
              ) : (
                <ChevronUpIcon className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Expandable Content */}
          <div className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${isDrawerOpen ? 'max-h-[600px] p-4' : 'max-h-0'
            }`}>
            {/* Chat Messages */}
            {chatMessages.length > 0 ? (
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
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-2 text-sm ${message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.content.startsWith('Error:')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {message.role === 'assistant' ? (
                        <div
                          className="prose prose-xs max-w-none prose-p:leading-relaxed prose-p:text-sm prose-pre:p-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_li]:mb-1 [&_li]:text-sm [&_strong]:font-semibold"
                          dangerouslySetInnerHTML={{ __html: marked(message.content) }}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
                      <Spinner size={16} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="text-center flex flex-col justify-center items-center h-[200px] text-sm">
                <p className="text-gray-500">Nessun messaggio. Inizia una conversazione!</p>
                {isAiLoading && (
                  <div className="mt-4">
                    <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
                      <Spinner size={16} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Suggestion Boxes - Only show when no messages exist */}
            {chatMessages.length === 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500 mb-1">Domande suggerite:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setInputValue("Quali sono i requisiti principali?");
                      handleChatSubmit();
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs rounded-full transition-colors"
                  >
                    Quali sono i requisiti principali?
                  </button>
                  <button
                    onClick={() => {
                      setInputValue("Quando scade il bando?");
                      handleChatSubmit();
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs rounded-full transition-colors"
                  >
                    Quando scade il bando?
                  </button>
                  <button
                    onClick={() => {
                      setInputValue("Come prepararsi per il concorso?");
                      handleChatSubmit();
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
                className="text-sm"
              />
              <PromptInputActions className="justify-end">
                <Button
                  size="sm"
                  className="size-9 cursor-pointer rounded-full"
                  onClick={handleChatSubmit}
                  disabled={!inputValue.trim() || isAiLoading}
                  aria-label="Invia"
                >
                  {isAiLoading ? (
                    <Spinner size={16} className="text-white" />
                  ) : (
                    <ArrowUpIcon className="h-4 min-h-4 min-w-4 w-4" />
                  )}
                </Button>
              </PromptInputActions>
            </PromptInput>
          </div>
        </div>
      </div>
    </main>
  )
} 