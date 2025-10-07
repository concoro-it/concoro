"use client";

import { Clock, MapPin, Users, Building2, ExternalLink, Calendar, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Concorso } from '@/types/concorso';
import { generateSEOConcorsoUrl } from '@/lib/utils/concorso-urls';
import { getDeadlineCountdown } from '@/lib/utils/date-utils';

interface ConcorsoCardProps {
  concorso: Concorso;
  showSaveButton?: boolean;
  onSave?: (concorsoId: string) => void;
  isSaved?: boolean;
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

export function ConcorsoCard({ 
  concorso, 
  showSaveButton = false, 
  onSave,
  isSaved = false 
}: ConcorsoCardProps) {
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    
    let date: Date;
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: it 
    });
  };

  const formatDeadline = (timestamp: any) => {
    if (!timestamp) return null;
    
    let date: Date;
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const concorsoUrl = generateSEOConcorsoUrl(concorso); // Use SEO-friendly URL
  const pubblicatoText = formatDate(concorso.publication_date || concorso.createdAt);
  const scadenzaText = formatDeadline(concorso.DataChiusura);
  const deadlineStatus = getDeadlineStatus(concorso.DataChiusura);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link 
              href={concorsoUrl}
              className="block group"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {concorso.Titolo || concorso.titolo_breve}
              </h3>
            </Link>
            
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{concorso.Ente}</span>
              </div>
              
              {concorso.AreaGeografica && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{concorso.AreaGeografica}</span>
                </div>
              )}
              
              {concorso.numero_di_posti && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{concorso.numero_di_posti} posti</span>
                </div>
              )}
            </div>
          </div>
          
          {showSaveButton && onSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSave(concorso.id)}
              className={`ml-2 ${isSaved ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Description */}
        {concorso.Descrizione && (
          <p className="text-gray-700 mb-4 line-clamp-3">
            {concorso.Descrizione}
          </p>
        )}
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {concorso.settore_professionale && (
            <Badge variant="secondary" className="text-xs">
              {concorso.settore_professionale}
            </Badge>
          )}
          
          {concorso.categoria && (
            <Badge variant="outline" className="text-xs">
              {concorso.categoria}
            </Badge>
          )}
          
          {concorso.regime && (
            <Badge variant="outline" className="text-xs">
              {concorso.regime}
            </Badge>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {pubblicatoText && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Pubblicato {pubblicatoText}</span>
              </div>
            )}
            
            {deadlineStatus && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" style={{ color: deadlineStatus.textColor }} />
                <span style={{ color: deadlineStatus.textColor, fontWeight: deadlineStatus.isUrgent ? 600 : 400 }}>
                  {deadlineStatus.text}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {concorso.apply_link && (
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <a 
                  href={concorso.apply_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  Candidati
                </a>
              </Button>
            )}
            
            <Button 
              variant="default" 
              size="sm"
              asChild
            >
              <Link href={concorsoUrl}>
                Dettagli
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
