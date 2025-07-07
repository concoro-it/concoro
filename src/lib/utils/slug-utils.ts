import slugify from 'slugify';
import { Timestamp } from 'firebase/firestore';

interface SlugGenerationData {
  articolo_tags: string[];
  publication_date: any; // Accept various date formats
  articolo_title?: string;
}

/**
 * Generates a SEO-friendly slug from article data
 * Prioritizes role, location, and region tags for better SEO
 * Falls back to article title if essential tags are missing
 */
export function generateSlug({ articolo_tags, publication_date, articolo_title }: SlugGenerationData): string {
  try {
    // Helper function to safely extract year from various date formats
    const getYearFromDate = (timestamp: any): string => {
      if (!timestamp) return new Date().getFullYear().toString();
      
      try {
        // Handle Firestore Timestamp
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().getFullYear().toString();
        }
        // Handle Firestore timestamp format from Admin SDK
        if (timestamp.seconds && timestamp.nanoseconds) {
          return new Date(timestamp.seconds * 1000).getFullYear().toString();
        }
        // Handle JavaScript Date
        if (timestamp instanceof Date) {
          return timestamp.getFullYear().toString();
        }
        // Handle string date
        if (typeof timestamp === 'string') {
          return new Date(timestamp).getFullYear().toString();
        }
        // Handle Admin SDK timestamp object
        if (typeof timestamp === 'object' && 'seconds' in timestamp) {
          return new Date(timestamp.seconds * 1000).getFullYear().toString();
        }
        // Fallback
        return new Date().getFullYear().toString();
      } catch (error) {
        console.error('Error extracting year from date:', error);
        return new Date().getFullYear().toString();
      }
    };

    // Get year from publication date
    const year = getYearFromDate(publication_date);
    
    // Define priority keywords for better slug generation
    const roleKeywords = ['istruttore', 'dirigente', 'funzionario', 'assistente', 'operatore', 'tecnico', 'amministrativo', 'contabile', 'informatico', 'ingegnere', 'medico', 'infermiere', 'vigile', 'polizia', 'carabiniere', 'ispettore', 'commissario'];
    const locationKeywords = ['roma', 'milano', 'napoli', 'torino', 'palermo', 'genova', 'bologna', 'firenze', 'bari', 'catania', 'venezia', 'verona', 'messina', 'padova', 'trieste', 'brescia', 'parma', 'taranto', 'prato', 'reggio', 'modena', 'rieti', 'viterbo', 'frosinone', 'latina', 'bergamo', 'pescara', 'vicenza', 'terni', 'forlì', 'trento', 'ferrara', 'sassari', 'monza', 'siracusa', 'udine', 'foggia', 'salerno', 'ravenna', 'rimini', 'novara', 'piacenza', 'ancona', 'andria', 'arezzo', 'cesena', 'lecce', 'pesaro'];
    const regionKeywords = ['lazio', 'lombardia', 'campania', 'sicilia', 'veneto', 'emilia-romagna', 'piemonte', 'puglia', 'liguria', 'toscana', 'calabria', 'sardegna', 'abruzzo', 'marche', 'friuli', 'trentino', 'umbria', 'basilicata', 'molise', 'valle-aosta'];
    
    if (!articolo_tags || !Array.isArray(articolo_tags) || articolo_tags.length === 0) {
      // Fallback to article title if no tags available
      if (articolo_title) {
        const titleSlug = slugify(articolo_title, { lower: true, strict: true });
        return `${titleSlug}-${year}`;
      }
      return `articolo-${year}`;
    }
    
    // Normalize tags for comparison
    const normalizedTags = articolo_tags.map(tag => 
      slugify(tag.toLowerCase().trim(), { lower: true, strict: true })
    );
    
    // Find relevant tags by priority
    const foundRoles = normalizedTags.filter(tag => 
      roleKeywords.some(keyword => tag.includes(keyword))
    );
    
    const foundLocations = normalizedTags.filter(tag => 
      locationKeywords.some(keyword => tag.includes(keyword))
    );
    
    const foundRegions = normalizedTags.filter(tag => 
      regionKeywords.some(keyword => tag.includes(keyword))
    );
    
    // Build slug components in order of priority
    const slugComponents: string[] = [];
    
    // Add the most relevant role (take first match)
    if (foundRoles.length > 0) {
      slugComponents.push(foundRoles[0]);
    }
    
    // Add location if available
    if (foundLocations.length > 0) {
      slugComponents.push(foundLocations[0]);
    }
    
    // Add region if available and different from location
    if (foundRegions.length > 0 && !slugComponents.includes(foundRegions[0])) {
      slugComponents.push(foundRegions[0]);
    }
    
    // If we don't have enough components, add other relevant tags
    if (slugComponents.length < 3) {
      const otherTags = normalizedTags.filter(tag => 
        !slugComponents.includes(tag) && 
        tag.length > 2 && // Avoid very short tags
        !['concorso', 'pubblico', 'bando', 'selezione'].includes(tag) // Skip generic terms
      );
      
      // Add up to 2 more tags to reach a reasonable slug length
      const additionalTags = otherTags.slice(0, 3 - slugComponents.length);
      slugComponents.push(...additionalTags);
    }
    
    // If still no components, fallback to first few tags
    if (slugComponents.length === 0) {
      const fallbackTags = normalizedTags.slice(0, 3).filter(tag => tag.length > 2);
      slugComponents.push(...fallbackTags);
    }
    
    // Add year
    slugComponents.push(year);
    
    // Create final slug
    const slug = slugComponents.join('-');
    
    // Ensure slug is not too long (max 100 characters for good SEO)
    if (slug.length > 100) {
      const truncatedComponents = [...slugComponents];
      truncatedComponents.pop(); // Remove year temporarily
      
      // Truncate components until we're under 95 chars (leaving room for year)
      while (truncatedComponents.join('-').length > 95 && truncatedComponents.length > 1) {
        truncatedComponents.pop();
      }
      
      return `${truncatedComponents.join('-')}-${year}`;
    }
    
    return slug;
    
  } catch (error) {
    console.error('Error generating slug:', error);
    // Fallback slug
    const year = new Date().getFullYear();
    if (articolo_title) {
      const titleSlug = slugify(articolo_title, { lower: true, strict: true });
      return `${titleSlug.substring(0, 50)}-${year}`;
    }
    return `articolo-${year}`;
  }
}

/**
 * Validates if a string could be a document ID (not a slug)
 * Document IDs are typically alphanumeric with no hyphens
 */
export function isDocumentId(identifier: string): boolean {
  // Document IDs are usually 20+ characters, alphanumeric, no hyphens
  return /^[a-zA-Z0-9]{20,}$/.test(identifier);
}

/**
 * Validates if a string looks like a slug
 */
export function isSlug(identifier: string): boolean {
  // Slugs contain hyphens and are lowercase
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(identifier) && identifier.includes('-');
} 