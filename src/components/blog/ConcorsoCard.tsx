import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ExternalLink, Building2, MapPin, Calendar, LogIn, Users } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { useAuth } from "@/lib/hooks/useAuth"
import { useMemo } from "react"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import Image from 'next/image'
import { generateSEOConcorsoUrl } from '@/lib/utils/concorso-urls'
import { useBandoUrl } from '@/lib/hooks/useBandoUrl'
import { Concorso } from "@/types/concorso"


interface ConcorsoCardProps {
  concorso: {
    id: string
    Titolo?: string
    Ente?: string
    AreaGeografica?: string
    DataChiusura?: Timestamp | any
    numero_di_posti?: string | number
    pa_link?: string
    Link?: string;
  }
}

// Function to convert string to Italian Sentence Case
const toSentenceCase = (str: string): string => {
  if (!str) return '';
  return toItalianSentenceCase(str);
};

// Function to get first part of Ente name (before the first dash)
const getFirstPartOfEnte = (ente: string): string => {
  if (!ente) return '';
  const dashIndex = ente.indexOf('-');
  return dashIndex > 0 ? ente.substring(0, dashIndex).trim() : ente;
};

// Simple favicon - just use favicon.png

// Parse Italian date format
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

export function ConcorsoCard({ concorso }: ConcorsoCardProps) {
  const { user } = useAuth();
  
  // Format date to display
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Data non disponibile";
    
    try {
      // Convert Firebase timestamp to Date
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds && timestamp.nanoseconds) {
        // Handle Firestore timestamp format
        date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
      } else if (typeof timestamp === 'string') {
        // Try to parse Italian date format
        const italianDate = parseItalianDate(timestamp);
        if (italianDate) {
          date = italianDate;
        } else {
          // Fall back to standard date parsing
          date = new Date(timestamp);
        }
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return "Data non disponibile";
      }
      
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return "Data non disponibile";
      }
      
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data non disponibile";
    }
  }
  
  // Memoize the formatted date to avoid recalculation on each render
  const formattedDate = useMemo(() => {
    return concorso.DataChiusura ? formatDate(concorso.DataChiusura) : "Data non disponibile";
  }, [concorso.DataChiusura]);
  
  // Process the title and ente name
  const titleInSentenceCase = useMemo(() => toSentenceCase(concorso.Titolo || ''), [concorso.Titolo]);
  const enteFirstPart = useMemo(() => getFirstPartOfEnte(toSentenceCase(concorso.Ente || '')), [concorso.Ente]);
  
  // Simple favicon - just use favicon.png
  
  return (
    <div 
      className="rounded-lg p-6" 
      style={{ 
        background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), #c2e9fb)'
      }}
    >
      <div className="mb-6">
        {/* Ente with favicon */}
        <div className="flex items-center gap-1 mb-2">
          <div className="relative w-[16px] h-[16px] flex-shrink-0 flex items-center justify-center">
            <Image 
              src="/favicon.png"
              alt={`Logo of ${concorso.Ente || 'entity'}`}
              width={16} 
              height={16}
              className="object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground truncate" title={concorso.Ente}>
              {enteFirstPart}
            </p>
          </div>
        </div>
        
        {/* Title */}
        <div className="font-semibold mb-3">{titleInSentenceCase || 'Titolo non disponibile'}</div>
        
        {/* Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {concorso.AreaGeografica && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 shrink-0" />
              <span>{concorso.AreaGeografica}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1 shrink-0" />
            <span>Scadenza: {formattedDate}</span>
          </div>
          
          {concorso.numero_di_posti && (
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1 shrink-0" />
              <span>{concorso.numero_di_posti} posti</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Link href={user ? generateSEOConcorsoUrl(concorso as any) : `/signin?redirect=${encodeURIComponent(generateSEOConcorsoUrl(concorso as any))}`}>
          <Button className="gap-2 w-full sm:w-auto">
            {user ? (
              <>
                <ExternalLink size={16} />
                Vedi dettagli concorso
              </>
            ) : (
              <>
                <LogIn size={16} />
                Accedi per dettagli
              </>
            )}
          </Button>
        </Link>
        
        {concorso.Link && (
          <Link href={concorso.Link} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" className="gap-2 w-full sm:w-auto">
              <ExternalLink size={16} />
              Vedi su InPA
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
} 