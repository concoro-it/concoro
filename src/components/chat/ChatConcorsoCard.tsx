import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ExternalLink, MapPin, Calendar, LogIn, Users } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { useAuth } from "@/lib/hooks/useAuth"
import { useMemo, useState } from "react"
import Image from "next/image"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'

interface ChatConcorsoCardProps {
  concorso: {
    id: string
    Titolo: string
    Ente?: string
    AreaGeografica?: string
    DataChiusura?: Timestamp | any
    numero_di_posti?: string | number
    pa_link?: string
    [key: string]: any
  },
  compact?: boolean
}

// Extract domain from URL
const extractDomain = (url: string | undefined): string => {
  if (!url) return '';
  
  // Basic URL validation
  if (!url.includes('.')) return '';
  
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return domain;
  } catch (error) {
    return '';
  }
};

// Get favicon chain for fallbacks
const getFaviconChain = (domain: string): string[] => [
  `https://www.google.com/s2/favicons?sz=32&domain=${domain}`,
  `/placeholder_icon.png`,
];

// Parse Italian date format or Timestamp
const formatDate = (timestamp: any): string => {
  if (!timestamp) return "Data non disponibile";
  
  try {
    // Convert Firebase timestamp to Date
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds && timestamp.nanoseconds !== undefined) {
      // Handle Firestore timestamp format
      date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
    } else if (typeof timestamp === 'string') {
      // Try standard date parsing
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && timestamp !== null) {
      // Handle various object formats that might contain date info
      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        console.warn('Unknown timestamp format:', timestamp);
        return "Data non disponibile";
      }
    } else {
      console.warn('Unknown timestamp format:', timestamp);
      return "Data non disponibile";
    }
    
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', timestamp);
      return "Data non disponibile";
    }
    
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'for timestamp:', timestamp);
    return "Data non disponibile";
  }
};

export function ChatConcorsoCard({ concorso, compact = false }: ChatConcorsoCardProps) {
  const { user } = useAuth();
  const [faviconIndex, setFaviconIndex] = useState(0);
  
  // Format date to display
  const formattedDate = useMemo(() => {
    return concorso.DataChiusura ? formatDate(concorso.DataChiusura) : "Data non disponibile";
  }, [concorso.DataChiusura]);
  
  // Get domain for favicon
  const domain = useMemo(() => extractDomain(concorso.pa_link), [concorso.pa_link]);
  const faviconUrls = useMemo(() => domain ? getFaviconChain(domain) : ['/placeholder_icon.png'], [domain]);
  
  const handleFaviconError = () => {
    setFaviconIndex(prev => Math.min(prev + 1, faviconUrls.length - 1));
  };
  
  return (
    <div 
      className={`rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className={`${compact ? 'mb-3' : 'mb-4'}`}>
        {/* Ente with favicon */}
        <div className="flex items-center gap-2 mb-2">
          {domain && (
            <div className="relative w-[16px] h-[16px] flex-shrink-0 flex items-center justify-center">
              <Image 
                src={faviconUrls[faviconIndex]}
                alt={`Logo of ${concorso.Ente || 'entity'}`}
                width={16} 
                height={16}
                className="object-contain"
                onError={handleFaviconError}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate font-medium" title={concorso.Ente}>
              {concorso.Ente}
            </p>
          </div>
        </div>
        
        {/* Title */}
        <h4 className={`font-semibold text-gray-900 leading-tight ${compact ? 'text-sm mb-3' : 'text-base mb-4'}`}>
          {toItalianSentenceCase(concorso.Titolo)}
        </h4>
        
        {/* Details */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          {concorso.AreaGeografica && (
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate max-w-[120px]">{concorso.AreaGeografica}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          
          {concorso.numero_di_posti && (
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1 shrink-0" />
              <span>
                {typeof concorso.numero_di_posti === 'string' 
                  ? concorso.numero_di_posti 
                  : concorso.numero_di_posti.toString()
                } posti
              </span>
            </div>
          )}
        </div>
      </div>
      
      <Link href={user ? `/bandi/${concorso.id}` : `/signin?redirect=/bandi/${concorso.id}`}>
        <Button 
          className="gap-2 w-full" 
          size={compact ? "sm" : "default"}
          variant="default"
        >
          {user ? (
            <>
              <ExternalLink size={compact ? 14 : 16} />
              <span className="text-sm">Vedi dettagli</span>
            </>
          ) : (
            <>
              <LogIn size={compact ? 14 : 16} />
              <span className="text-sm">Accedi per dettagli</span>
            </>
          )}
        </Button>
      </Link>
    </div>
  );
} 