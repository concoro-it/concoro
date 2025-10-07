"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon, Building2, MapPin, Calendar, Users, Scale, ArrowUpIcon, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookmarkIconButton } from "@/components/ui/bookmark-icon-button"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
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
import { formatMetodoValutazione } from '@/lib/utils/date-utils'
import { getEnteUrl } from '@/lib/utils/ente-utils'
import { getLocalitaUrl, splitLocationString } from '@/lib/utils/localita-utils'
// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

interface ConcorsoData {
  id: string;
  Titolo: string;
  Ente: string;
  AreaGeografica?: string;
  DataChiusura?: any;
  DataApertura?: any;
  numero_di_posti?: number;
  Valutazione?: string;
  Descrizione?: string;
  sommario?: string;
  apply_link?: string;
  Link?: string;
  pa_link?: string;
  contatti?: string;
  pdf_links?: string[];
  publication_date?: string;
  concorso_id?: string;
  Stato?: string;
  collocazione_organizzativa?: string;
  ambito_lavorativo?: string;
  settore_professionale?: string;
  regime_impegno?: string;
  tipologia?: string;
  categoria?: string;
  settore?: string;
  regime?: string;
  conoscenze_tecnico_specialistiche?: string | string[];
  capacita_richieste?: string | string[];
  programma_di_esame?: string | string[];
  requisiti_generali?: string | string[];
  area_categoria?: string;
  [key: string]: any;
}

interface ConcorsoClientWrapperProps {
  concorso: ConcorsoData;
}

const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    
    const datePart = dateStr.split(' ').slice(0, 3).join(' ');
    
    const formats = [
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
      (str: string) => {
        const parts = str.split('/');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        
        return new Date(year, month, day);
      }
    ];
    
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

const getDeadlineStatus = (dateStr: any) => {
  if (!dateStr) return null;
  
  if (typeof dateStr === 'object' && 'seconds' in dateStr && 'nanoseconds' in dateStr) {
    try {
      // Convert plain object with seconds to Date (without using Timestamp class)
      const date = new Date(dateStr.seconds * 1000);
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

const renderGroupedRegions = (concorso: ConcorsoData) => {
  const locationText = concorso.AreaGeografica || 'Località non specificata';
  const regions = splitLocationString(locationText);
  
  if (regions.length > 1) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
        <div className="flex flex-wrap gap-1">
          {regions.slice(0, 3).map((region: string, index: number) => (
            <React.Fragment key={region}>
              <Link 
                href={getLocalitaUrl(region)}
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
  
  return (
    <div className="flex items-center">
      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
      <Link 
        href={getLocalitaUrl(locationText)}
        className="hover:text-foreground transition-colors"
      >
        <span>{locationText}</span>
      </Link>
    </div>
  );
};

const formatListItem = (text: string) => {
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

const safeText = (text: any): string => {
  if (text === null || text === undefined) return '';
  if (typeof text === 'string') return text;
  if (['number', 'boolean'].includes(typeof text)) return String(text);
  if (text instanceof Date) {
    return text.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  if (typeof text === 'object' && 'seconds' in text && 'nanoseconds' in text) {
    try {
      return new Date(text.seconds * 1000).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }
  return JSON.stringify(text);
};

export default function ConcorsoClientWrapper({ concorso }: ConcorsoClientWrapperProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { isConcorsoSaved, toggleSaveConcorso } = useSavedConcorsi();
  
  // Chat state
  const [inputValue, setInputValue] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (chatMessages.length > 0 && isDrawerOpen) {
      scrollToBottom()
    }
  }, [chatMessages, isDrawerOpen])

  const handleBack = () => {
    router.push(`/concorsi`)
  }

  const handleSaveJob = async () => {
    if (!concorso) return;
    
    try {
      if (!user) {
        toast.error("Effettua l'accesso per salvare i concorsi");
        return;
      }
      await toggleSaveConcorso(concorso.id);
      toast.success(isConcorsoSaved(concorso.id) ? "Concorso rimosso dai salvati" : "Concorso salvato con successo");
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error("Errore nel salvataggio. Riprova.");
    }
  };

  const handleChatSubmit = async () => {
    if (!inputValue.trim() || !concorso) return;

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
          jobDetails: concorso,
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

  const closingDate = concorso.DataChiusura;
  const deadlineStatus = getDeadlineStatus(closingDate);

  return (
    <main className="container px-3 py-4 md:px-6 md:py-6">
      <div className="mb-4">
        <Button
          variant="default"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100"
          onClick={handleBack}
          aria-label="Torna ai concorsi"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Torna ai concorsi
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
                      {concorso.Stato ? (safeText(concorso.Stato).toLowerCase() === 'open' ? 'Aperto' : 
                        safeText(concorso.Stato).toLowerCase() === 'closed' ? 'Chiuso' : safeText(concorso.Stato)) : 'Aperto'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <BookmarkIconButton 
                    isSaved={isConcorsoSaved(concorso.id)}
                    onClick={handleSaveJob}
                  />
                  <Button variant="default" size="sm" className="h-9 w-9 p-0 bg-transparent border-0 hover:bg-transparent" asChild>
                    <a href={safeText(concorso.Link)} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon className="h-5 w-5 text-gray-500" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Title and Company Section */}
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {toSentenceCase(safeText(concorso.Titolo || ''))}
                </h1>
                <div className="flex items-center text-gray-600 mt-2">
                  <Building2 className="w-4 h-4 mr-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <Link 
                      href={getEnteUrl(safeText(concorso.Ente))}
                      className="truncate hover:text-foreground transition-colors"
                      title={safeText(concorso.Ente)}
                    >
                      {safeText(concorso.Ente)}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Location and Date */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {renderGroupedRegions(concorso)}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Chiusura: {safeText(concorso.DataChiusura || 'Data non specificata')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button asChild className="inline-flex items-center justify-center px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors outline-offset-2 bg-primary text-primary-foreground">
                  <a href={safeText(concorso.apply_link || concorso.Link)} target="_blank" rel="noopener noreferrer">
                    Candidati Ora
                    <ExternalLinkIcon className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                <Button variant="ghost" asChild>
                  <a href={safeText(concorso.Link)} target="_blank" rel="noopener noreferrer">
                    Visualizza su INPA
                    <ExternalLinkIcon className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>

              {/* Summary Section */}
              {concorso.sommario && (
                <div className="rounded-lg p-4 md:p-6" style={{ 
                  backgroundImage: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
                }}>
                  <h2 className="text-lg font-semibold mb-2">Sommario</h2>
                  <div dangerouslySetInnerHTML={{ 
                    __html: safeText(concorso.sommario)
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
              {concorso.Descrizione ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: safeText(concorso.Descrizione)
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
                    <p className="font-medium">{safeText(concorso.DataApertura || 'Non specificata')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Data di Chiusura</p>
                    <p className="font-medium">{safeText(concorso.DataChiusura || 'Non specificata')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Numero di Posti</p>
                    <p className="font-medium">{safeText(concorso.numero_di_posti || 'Non specificato')}</p>
                  </div>
                </div>
              </div>
              {concorso.Valutazione && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Scale className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Metodo di Valutazione</p>
                      <p className="font-medium">{formatMetodoValutazione(concorso.Valutazione)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Organizational Details */}
          {(concorso.collocazione_organizzativa || concorso.ambito_lavorativo || concorso.tipologia || concorso.categoria || 
            concorso.settore || concorso.regime || concorso.settore_professionale || concorso.regime_impegno) && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Dettagli Organizzativi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {concorso.collocazione_organizzativa && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Collocazione Organizzativa</p>
                    <p className="font-medium">{safeText(concorso.collocazione_organizzativa)}</p>
                  </div>
                )}
                {concorso.ambito_lavorativo && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Ambito Lavorativo</p>
                    <p className="font-medium">{safeText(concorso.ambito_lavorativo)}</p>
                  </div>
                )}
                {concorso.settore_professionale && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Settore Professionale</p>
                    <p className="font-medium">{safeText(concorso.settore_professionale)}</p>
                  </div>
                )}
                {concorso.regime_impegno && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Regime di Impegno</p>
                    <p className="font-medium">{safeText(concorso.regime_impegno)}</p>
                  </div>
                )}
                {concorso.tipologia && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Tipologia</p>
                    <p className="font-medium">{safeText(concorso.tipologia)}</p>
                  </div>
                )}
                {concorso.categoria && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Categoria</p>
                    <p className="font-medium">{safeText(concorso.categoria)}</p>
                  </div>
                )}
                {concorso.settore && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Settore</p>
                    <p className="font-medium">{safeText(concorso.settore)}</p>
                  </div>
                )}
                {concorso.regime && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Regime</p>
                    <p className="font-medium">{safeText(concorso.regime)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Requirements */}
          {(hasValidContent(concorso.conoscenze_tecnico_specialistiche) || 
            hasValidContent(concorso.capacita_richieste) || 
            hasValidContent(concorso.programma_di_esame) || 
            hasValidContent(concorso.requisiti_generali)) && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Requisiti e Programma</h2>
              <div className="space-y-6">
                {hasValidContent(concorso.requisiti_generali) && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Requisiti Generali</h3>
                    <ul className="list-disc pl-5">
                      {Array.isArray(concorso.requisiti_generali) 
                        ? concorso.requisiti_generali
                            .filter(item => item.trim() !== 'Non specificato')
                            .map((item: string, index: number) => (
                              <li key={index}>{formatListItem(item)}</li>
                            ))
                        : <li>{formatListItem(String(concorso.requisiti_generali || ''))}</li>
                      }
                    </ul>
                  </div>
                )}
                {hasValidContent(concorso.conoscenze_tecnico_specialistiche) && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Conoscenze Tecnico-Specialistiche</h3>
                    <ul className="list-disc pl-5">
                      {(() => {
                        const knowledge = concorso.conoscenze_tecnico_specialistiche;
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
                {hasValidContent(concorso.capacita_richieste) && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Capacità Richieste</h3>
                    <ul className="list-disc pl-5">
                      {Array.isArray(concorso.capacita_richieste)
                        ? concorso.capacita_richieste
                            .filter((item: string) => item.trim() !== 'Non specificato')
                            .map((item: string, index: number) => (
                              <li key={index}>{formatListItem(item)}</li>
                            ))
                        : <li>{formatListItem(String(concorso.capacita_richieste || ''))}</li>
                      }
                    </ul>
                  </div>
                )}
                {hasValidContent(concorso.programma_di_esame) && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Programma d'Esame</h3>
                    <ul className="list-disc pl-5">
                      {Array.isArray(concorso.programma_di_esame)
                        ? concorso.programma_di_esame
                            .filter(item => item.trim() !== 'Non specificato')
                            .map((item: string, index: number) => (
                              <li key={index}>{formatListItem(item)}</li>
                            ))
                        : <li>{formatListItem(String(concorso.programma_di_esame || ''))}</li>
                      }
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(concorso.contatti || concorso.pa_link) && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Contatti e Link Utili</h2>
              <div className="space-y-4">
                {concorso.contatti && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Contatti</p>
                    <p className="font-medium">{safeText(concorso.contatti)}</p>
                  </div>
                )}
                {concorso.pa_link && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Link PA</p>
                    <Button 
                      variant="ghost" 
                      asChild 
                      className="w-full justify-start p-2 h-auto"
                    >
                      <a 
                        href={safeText(concorso.pa_link)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-left"
                      >
                        <span className="truncate">{safeText(concorso.pa_link)}</span>
                        <ExternalLinkIcon className="w-4 h-4 ml-2 flex-shrink-0" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF Documents */}
          {concorso.pdf_links && concorso.pdf_links.length > 0 && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold">Documenti Aggiuntivi</h2>
              <div className="space-y-2">
                {concorso.pdf_links.map((link, index) => (
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
                Pubblicato il {safeText(concorso.publication_date || 'Data di pubblicazione non disponibile')}
              </div>
              <div>
                ID Concorso: {safeText(concorso.concorso_id || 'Non disponibile')}
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
            
            {/* Check if user is authenticated */}
            {!user ? (
              <div className="p-4 flex flex-col h-[calc(100%-5rem)] items-center justify-center space-y-4">
                <p className="text-center text-gray-600 mb-4">
                  Accedi per chattare con Genio e ottenere risposte personalizzate sui concorsi.
                </p>
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
            ) : (
              <>
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
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-2 text-sm ${
                              message.role === 'user'
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

                  {/* Suggestion Boxes */}
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Chat Interface */}
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
          <div className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${
            isDrawerOpen ? 'max-h-[600px] p-4' : 'max-h-0'
          }`}>
            {!user ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <p className="text-center text-gray-600 mb-4">
                  Accedi per chattare con Genio e ottenere risposte personalizzate sui concorsi.
                </p>
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
            ) : (
              <>
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
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-2 text-sm ${
                            message.role === 'user'
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

                {/* Suggestion Boxes */}
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
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

