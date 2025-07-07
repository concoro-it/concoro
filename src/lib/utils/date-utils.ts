import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

/**
 * Calculate the number of days until a deadline and return a countdown message
 * @param deadline - The deadline date (can be string, Date, Timestamp, or Firestore timestamp object)
 * @returns A countdown message like "Scade in 5 giorni" or null if invalid/past
 */
export function getDeadlineCountdown(deadline: any): string | null {
  if (!deadline) return null;

  let deadlineDate: Date | null = null;

  try {
    // Handle Firestore Timestamp
    if (deadline instanceof Timestamp) {
      deadlineDate = deadline.toDate();
    }
    // Handle Firestore-like object
    else if (typeof deadline === 'object' && deadline !== null && 'seconds' in deadline && 'nanoseconds' in deadline) {
      deadlineDate = new Timestamp(deadline.seconds, deadline.nanoseconds).toDate();
    }
    // Handle ISO string
    else if (typeof deadline === 'string') {
      deadlineDate = parseISO(deadline);
    }
    // Handle Date object
    else if (deadline instanceof Date) {
      deadlineDate = deadline;
    }

    if (!deadlineDate || !isValid(deadlineDate)) {
      return null;
    }

    const today = new Date();
    const daysUntilDeadline = differenceInDays(deadlineDate, today);

    // If deadline has passed, don't show countdown
    if (daysUntilDeadline < 0) {
      return null;
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
    console.error('Error calculating deadline countdown:', error);
    return null;
  }
}

/**
 * Format Metodo di Valutazione to sentence case and clean formatting
 * @param valutazione - The evaluation method string
 * @returns Formatted string in sentence case
 */
export function formatMetodoValutazione(valutazione: string | undefined): string {
  if (!valutazione) return 'Non specificato';
  
  // Convert to lowercase first
  let formatted = valutazione.toLowerCase();
  
  // Replace underscores with spaces
  formatted = formatted.replace(/_/g, ' ');
  
  // Capitalize first letter (sentence case)
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  
  return formatted;
} 