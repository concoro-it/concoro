"use client";

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ExternalLinkIcon, 
  MapPin, 
  Calendar, 
  Users, 
  Scale,
  ChevronUp,
  ChevronDown,
  LogIn,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/lib/hooks/useAuth"
import React, { useEffect, useState } from "react"
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { ArrowUpIcon } from "lucide-react"
import { marked } from 'marked'
import { Spinner } from "@/components/ui/spinner"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { formatMetodoValutazione, getDeadlineCountdown } from '@/lib/utils/date-utils'
import { getEnteUrl } from '@/lib/utils/ente-utils'
import { getLocalitaUrl } from '@/lib/utils/localita-utils'
import { normalizeConcorsoCategory } from "@/lib/utils/category-utils"
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
import Link from "next/link"
import { FaviconImage } from "@/components/common/FaviconImage"
import { Concorso } from "@/types/concorso"

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

interface ConcorsoDetailsPublicProps {
  job: Concorso | null;
  isLoading: boolean;
}

const toSentenceCase = (str: string) => {
  return toItalianSentenceCase(str);
};

const formatListItem = (text: string | undefined): string => {
  if (!text) return '';
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
  
  if (deadlineCountdown === "Scade oggi") {
    return { text: deadlineCountdown, color: "#dc2626", textColor: "#dc2626" };
  } else if (deadlineCountdown === "Scade domani") {
    return { text: deadlineCountdown, color: "#d97706", textColor: "#d97706" };
  } else if (deadlineCountdown.includes("Scade in")) {
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

const cleanHtmlContent = (html: string | undefined): string => {
  if (!html) return '';
  
  let clean = html.replace(/&nbsp;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'");
  
  clean = clean.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  clean = clean.replace(/<br\s*\/?>/gi, '\n');
  clean = clean.replace(/<[^>]*>/g, '');
  clean = clean.replace(/\s+/g, ' ');
  clean = clean.replace(/\n\s+/g, '\n');
  
  return clean.trim();
};

const formatTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      const truncatedUrl = part.length > 50 ? `${part.substring(0, 47)}...` : part;
      return (
        <span key={index} className="inline-flex items-center gap-1 break-all">
          <a 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
            title={part}
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

export function ConcorsoDetailsPublic({ job, isLoading }: ConcorsoDetailsPublicProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    if (chatMessages.length > 0 && isDrawerOpen) {
      scrollToBottom()
    }
  }, [chatMessages, isDrawerOpen])

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
      
      if (parts.length >= 3) {
        const yearPart = parts[2];
        if (/^\d{4}$/.test(yearPart)) {
          year = parseInt(yearPart, 10);
        }
      }
      
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
      return null;
    }
  };

  const handleChatSubmit = async () => {
    if (!inputValue.trim() || !job || !user) {
      // Redirect to sign in if not authenticated
      if (!user) {
        router.push('/signin');
        return;
      }
      return;
    }

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
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Si è verificato un errore. Riprova più tardi.' }]);
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
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="h-full">
        <div className="p-6 flex items-center justify-center h-full text-gray-500">
          Seleziona un concorso per visualizzare i dettagli
        </div>
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
                </div>

                {/* Title and Company Section */}
                <div>
                  <h1 className="text-2xl font-bold">{toSentenceCase(job.Titolo || job.titolo_originale || '')}</h1>
                  <div className="flex items-center text-gray-600 mt-2">
                    <FaviconImage 
                      enteName={job.Ente || ''}
                      paLink={job.pa_link}
                      size={16}
                      className="mr-2 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <Link 
                        href={getEnteUrl(job.Ente || '')}
                        className="truncate hover:text-foreground transition-colors"
                        title={job.Ente}
                      >
                        {job.Ente || ''}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <Link 
                      href={getLocalitaUrl(job.AreaGeografica || '')}
                      className="hover:text-foreground transition-colors"
                    >
                      <span>{formatLocalitaDisplay(job.AreaGeografica || '')}</span>
                    </Link>
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
                  <Button asChild className="inline-flex items-center justify-center px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors outline-offset-2 bg-primary text-primary-foreground">
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

                {/* Summary Section with blur for signed-out users */}
                {job.sommario && (
                  <div className="relative rounded-lg p-6" style={{ 
                    backgroundImage: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
                  }}>
                    <h2 className="text-lg font-semibold mb-2">Sommario</h2>
                    <div 
                      className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:space-y-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_li]:mb-1 [&_strong]:font-semibold ${
                        !user ? 'filter blur-sm select-none pointer-events-none' : ''
                      }`}
                      dangerouslySetInnerHTML={{ __html: marked(job.sommario) }}
                    />
                    
                    {/* Overlay with sign-in buttons for signed-out users */}
                    {!user && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                        <div className="text-center space-y-4 p-6 max-w-md">
                          <LogIn className="w-12 h-12 mx-auto text-blue-600" />
                          <h3 className="font-semibold text-lg">Accedi per vedere il sommario completo</h3>
                          <p className="text-sm text-gray-600">
                            Registrati gratuitamente per leggere il riassunto dettagliato e chattare con Genio AI.
                          </p>
                          <div className="space-y-2">
                            <Button 
                              className="w-full flex items-center justify-center gap-2"
                              onClick={() => router.push('/signin')}
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                              Accedi con Google
                            </Button>
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => router.push('/signin')}
                            >
                              Accedi
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                          : job.sommario || 'Nessuna descrizione disponibile';
                        return formatTextWithLinks(content);
                      })()}
                    </div>
                  ) : (
                    <div className="break-words">
                      {job.sommario ? formatTextWithLinks(job.sommario) : 'Nessuna descrizione disponibile'}
                    </div>
                  )}
                </div>
              </div>

              {/* Organizational Details */}
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
                  ID Concorso: {job.concorso_id || 'Non disponibile'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface with blur for signed-out users */}
      <div className="sticky bottom-0 left-0 right-0 relative" style={{
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
        background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), #c2e9fb)',
        backdropFilter: 'blur(8px)'
      }}>
        {!user && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-t-lg">
            <div className="text-center space-y-3 p-6 max-w-md">
              <h3 className="font-semibold text-lg">Chatta con Genio AI</h3>
              <p className="text-sm text-gray-600">
                Accedi per chattare con Genio e ottenere risposte personalizzate sui concorsi.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => router.push('/signin')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Accedi con Google
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/signin')}
                >
                  Accedi
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className={`max-w-4xl mx-auto ${!user ? 'filter blur-sm pointer-events-none' : ''}`}>
          {/* Header with Chevron */}
          <div 
            className="flex justify-between items-center p-4 cursor-pointer"
            onClick={() => user && setIsDrawerOpen(!isDrawerOpen)}
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
            {user && (
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
            )}
          </div>

          {/* Expandable Content - Only visible for signed-in users */}
          {user && (
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
          )}
        </div>
      </div>
    </div>
  );
}

