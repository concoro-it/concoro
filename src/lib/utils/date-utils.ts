import { ScadenzaFilter } from '@/types/query-options'
import { parseISO, isValid, differenceInDays } from 'date-fns'
import { Timestamp } from 'firebase/firestore'

/**
 * Get date range for scadenza filter
 */
export function getScadenzaDateRange(scadenza: ScadenzaFilter): { start: Date; end: Date } | null {
  if (!scadenza) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (scadenza) {
    case 'oggi':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // End of today
      }
    case 'questa-settimana': {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
      return {
        start: today,
        end: new Date(endOfWeek.getTime() + 24 * 60 * 60 * 1000 - 1) // End of Sunday
      }
    }
    case 'questo-mese': {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return {
        start: today,
        end: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000 - 1) // End of last day of month
      }
    }
    default:
      return null
  }
}

/**
 * Format a date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  
  const startStr = start.toLocaleDateString('it-IT', options)
  const endStr = end.toLocaleDateString('it-IT', options)
  
  return `${startStr} - ${endStr}`
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end
}

/**
 * Get relative time string for a date
 */
export function getRelativeTimeString(date: Date): string {
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Oggi'
  if (diffDays === 1) return 'Domani'
  if (diffDays === -1) return 'Ieri'
  
  if (diffDays > 0) {
    if (diffDays <= 7) return `Tra ${diffDays} giorni`
    if (diffDays <= 30) return `Tra ${Math.ceil(diffDays / 7)} settimane`
    return `Tra ${Math.ceil(diffDays / 30)} mesi`
  } else {
    const absDiffDays = Math.abs(diffDays)
    if (absDiffDays <= 7) return `${absDiffDays} giorni fa`
    if (absDiffDays <= 30) return `${Math.ceil(absDiffDays / 7)} settimane fa`
    return `${Math.ceil(absDiffDays / 30)} mesi fa`
  }
}

/**
 * Get countdown string for a deadline
 */
export function getDeadlineCountdown(deadline: string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | null | undefined): string | null {
  if (!deadline) return null;

  let deadlineDate: Date;

  try {
    // Handle Firestore Timestamp (only available server-side or with full Firestore SDK)
    if (deadline instanceof Timestamp) {
      deadlineDate = deadline.toDate();
    }
    // Handle Firestore-like object (serialized timestamp from server)
    else if (typeof deadline === 'object' && deadline !== null) {
      // Check for both formats: with and without underscores
      if ('seconds' in deadline && 'nanoseconds' in deadline && deadline.seconds !== undefined) {
        deadlineDate = new Date(deadline.seconds * 1000);
      } else if ('_seconds' in deadline && '_nanoseconds' in deadline) {
        deadlineDate = new Date((deadline as any)._seconds * 1000);
      } else {
        return null;
      }
    }
    // Handle ISO string
    else if (typeof deadline === 'string') {
      // Handle Italian date format first
      if (deadline.includes(' ')) {
        const parsedDate = parseItalianDate(deadline);
        if (parsedDate) {
          deadlineDate = parsedDate;
        } else {
          deadlineDate = parseISO(deadline);
        }
      } else {
        deadlineDate = parseISO(deadline);
      }
    }
    // Handle Date object
    else if (deadline && typeof deadline === 'object' && 'getTime' in deadline) {
      deadlineDate = deadline as Date;
    } else {
      return null;
    }

    if (!deadlineDate || !isValid(deadlineDate)) {
      return null;
    }

    const today = new Date();
    const daysUntilDeadline = differenceInDays(deadlineDate, today);

    // If deadline has passed
    if (daysUntilDeadline < 0) {
      return "Scaduto";
    }

    // Format the countdown message
    if (daysUntilDeadline === 0) {
      return "Scade oggi";
    } else if (daysUntilDeadline === 1) {
      return "Scade domani";
    } else {
      return `Scade in ${daysUntilDeadline} giorni`;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Parse Italian date format (e.g., "31 Gen 2024 23:59")
 */
function parseItalianDate(dateStr: string): Date | null {
  try {
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
}

/**
 * Format metodo di valutazione
 */
export function formatMetodoValutazione(valutazione: string | undefined): string {
  if (!valutazione) return 'Non specificato';
  
  // Common replacements
  const replacements: { [key: string]: string } = {
    'titoli': 'Valutazione dei titoli',
    'colloquio': 'Colloquio',
    'esami': 'Esami',
    'prova scritta': 'Prova scritta',
    'prova orale': 'Prova orale',
    'test': 'Test',
  };

  // Convert to lowercase for case-insensitive matching
  const lowerVal = valutazione.toLowerCase();

  // Replace known patterns
  for (const [key, value] of Object.entries(replacements)) {
    if (lowerVal.includes(key)) {
      return value;
    }
  }

  // If no matches found, return the original value with first letter capitalized
  return valutazione.charAt(0).toUpperCase() + valutazione.slice(1);
}