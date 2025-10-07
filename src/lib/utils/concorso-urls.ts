import { Concorso } from '@/types/concorso';

/**
 * Generate SEO-friendly URL slug for a concorso
 * Format: /concorsi/[localita]/[ente]/[title]/[date]/[id]
 * This ensures unique URLs while maintaining SEO benefits with ID at the end
 */
export function generateConcorsoSlug(concorso: Concorso): string {
  // Extract location (city/region)
  const localita = extractLocalitaSlug(concorso.AreaGeografica || '');
  
  // Extract ente slug
  const ente = extractEnteSlug(concorso.Ente || '');
  
  // Extract title keywords (first 3-4 meaningful words)
  const title = extractTitleSlug(concorso.Titolo || concorso.titolo_breve || '');
  
  // Extract date
  const date = extractDateSlug(concorso.publication_date || concorso.createdAt);
  
  // ID at the end to ensure uniqueness
  return `${localita}/${ente}/${title}/${date}/${concorso.id}`;
}

/**
 * Generate complete SEO URL for a concorso
 */
export function generateSEOConcorsoUrl(concorso: Concorso): string {
  const slug = generateConcorsoSlug(concorso);
  return `/concorsi/${slug}`;
}

/**
 * Generate simple concorso URL for current structure
 * Format: /concorsi/[id]
 */
export function generateConcorsoUrl(concorso: Concorso, useSlug = true): string {
  if (useSlug) {
    const slug = generateConcorsoSlug(concorso);
    return `/concorsi/${slug}`;
  }
  return `/concorsi/${concorso.id}`;
}

/**
 * Extract location slug from AreaGeografica
 */
function extractLocalitaSlug(areaGeografica: string): string {
  if (!areaGeografica) return 'italia';
  
  // Split by common separators and take first meaningful location
  const parts = areaGeografica.split(/[,;\/\-\s]+/).map(part => part.trim());
  
  // Priority order: city names, then regions
  const cityKeywords = ['roma', 'milano', 'napoli', 'torino', 'palermo', 'genova', 'bologna', 'firenze', 'venezia', 'bari', 'catania', 'verona', 'messina', 'padova', 'trieste', 'brescia', 'parma', 'modena', 'reggio calabria', 'reggio emilia', 'perugia', 'livorno', 'cagliari', 'foggia', 'rimini', 'salerno', 'ferrara', 'sassari', 'monza', 'siracusa', 'pescara', 'bergamo', 'forlì', 'trento', 'vicenza', 'terni', 'bolzano', 'novara', 'piacenza', 'ancona', 'andria', 'arezzo', 'udine', 'cesena', 'lecce', 'pesaro', 'barletta', 'alessandria', 'la spezia', 'pistoia', 'como', 'prato', 'ravenna', 'latina', 'brindisi', 'giugliano in campania', 'taranto'];
  
  const regionKeywords = ['lazio', 'lombardia', 'campania', 'piemonte', 'sicilia', 'liguria', 'emilia-romagna', 'toscana', 'veneto', 'puglia', 'calabria', 'sardegna', 'abruzzo', 'marche', 'umbria', 'friuli-venezia giulia', 'trentino-alto adige', 'basilicata', 'molise', 'valle d\'aosta'];
  
  // First try to find major cities
  for (const part of parts) {
    const normalizedPart = part.toLowerCase();
    const foundCity = cityKeywords.find(city => normalizedPart.includes(city));
    if (foundCity) {
      return slugify(foundCity);
    }
  }
  
  // Then try regions
  for (const part of parts) {
    const normalizedPart = part.toLowerCase();
    const foundRegion = regionKeywords.find(region => normalizedPart.includes(region));
    if (foundRegion) {
      return slugify(foundRegion);
    }
  }
  
  // Fallback to first meaningful part
  const meaningfulPart = parts.find(part => part.length > 2);
  return meaningfulPart ? slugify(meaningfulPart) : 'italia';
}

/**
 * Extract ente slug from ente name
 */
function extractEnteSlug(ente: string): string {
  if (!ente) return 'ente-pubblico';
  
  // Common ente types and their shortened forms
  const enteReplacements: Record<string, string> = {
    'comune di': 'comune',
    'città di': 'comune',
    'città metropolitana di': 'citta-metropolitana',
    'provincia di': 'provincia',
    'regione': 'regione',
    'università degli studi di': 'universita',
    'università': 'universita',
    'azienda sanitaria locale': 'asl',
    'azienda ospedaliera': 'ao',
    'azienda ospedaliero universitaria': 'aou',
    'istituto di ricovero e cura a carattere scientifico': 'irccs',
    'agenzia': 'agenzia',
    'istituto': 'istituto',
    'ministero': 'ministero',
    'soprintendenza': 'soprintendenza',
    'consiglio': 'consiglio',
    'tribunale': 'tribunale',
    'questura': 'questura',
    'prefettura': 'prefettura',
    'camera di commercio': 'cciaa',
    'unione dei comuni': 'unione-comuni'
  };
  
  let cleanEnte = ente.toLowerCase();
  
  // Apply replacements
  for (const [full, short] of Object.entries(enteReplacements)) {
    if (cleanEnte.includes(full)) {
      // Extract the location/specific name after the ente type
      const parts = cleanEnte.split(full);
      if (parts.length > 1 && parts[1].trim()) {
        return `${short}-${slugify(parts[1].trim())}`;
      } else {
        return short;
      }
    }
  }
  
  // Fallback: use first 3 words
  const words = cleanEnte.split(/\s+/).slice(0, 3);
  return slugify(words.join(' '));
}

/**
 * Extract title slug from concorso title
 */
function extractTitleSlug(title: string): string {
  // Remove common words and extract meaningful keywords
  const stopWords = ['per', 'di', 'da', 'del', 'della', 'dei', 'delle', 'con', 'presso', 'categoria', 'concorso', 'selezione', 'procedura'];
  
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  // Take first 3-4 meaningful words
  const meaningfulWords = words.slice(0, 4);
  
  return meaningfulWords.length > 0 
    ? meaningfulWords.join('-') 
    : slugify(title.substring(0, 50));
}

/**
 * Extract date slug from timestamp
 */
function extractDateSlug(timestamp: any): string {
  let date: Date;
  
  if (timestamp?.seconds) {
    // Firebase Timestamp
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    date = new Date();
  }
  
  return date.getFullYear().toString();
}

/**
 * Basic slugify function
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Parse concorso slug back to components
 * Format: [localita]/[ente]/[title]/[date]/[id]
 */
export function parseConcorsoSlug(slug: string): {
  id?: string;
  localita?: string;
  ente?: string;
  title?: string;
  date?: string;
} {
  if (!slug) return {};
  
  // Check if it's just an ID (20 char alphanumeric)
  if (isFirebaseDocumentId(slug)) {
    return { id: slug };
  }
  
  // Parse new format with slashes: localita/ente/title/date/id
  if (slug.includes('/')) {
    const parts = slug.split('/').filter(Boolean);
    
    // New format: 5 parts with ID at the end
    if (parts.length === 5 && isFirebaseDocumentId(parts[4])) {
      return {
        localita: parts[0],
        ente: parts[1],
        title: parts[2],
        date: parts[3],
        id: parts[4]
      };
    }
    
    // Fallback: old format without ID (4 parts)
    if (parts.length === 4) {
      return {
        localita: parts[0],
        ente: parts[1],
        title: parts[2],
        date: parts[3]
      };
    }
  }
  
  return {};
}

/**
 * Find concorso by SEO slug components
 * This function can be used to lookup concorsi by their slug parts
 */
export function findConcorsoBySlug(
  concorsi: Concorso[], 
  slugComponents: { id?: string; localita?: string; ente?: string; title?: string; date?: string }
): Concorso | null {
  
  const { id, localita, ente, title, date } = slugComponents;
  
  // If ID is provided, use it for exact match (most reliable)
  if (id) {
    const exactMatch = concorsi.find(c => c.id === id);
    if (exactMatch) {
      return exactMatch;
    }
  }
  
  // Try exact match first
  const exactMatches = concorsi.filter(concorso => {
    // Check localita match
    if (localita) {
      const concorsoLocalita = extractLocalitaSlug(concorso.AreaGeografica || '');
      if (concorsoLocalita !== localita) return false;
    }
    
    // Check ente match  
    if (ente) {
      const concorsoEnte = extractEnteSlug(concorso.Ente || '');
      if (concorsoEnte !== ente) return false;
    }
    
    // Check title match (more flexible)
    if (title) {
      const concorsoTitle = extractTitleSlug(concorso.Titolo || concorso.titolo_breve || '');
      if (!concorsoTitle.includes(title) && !title.includes(concorsoTitle)) return false;
    }
    
    // Check date match
    if (date) {
      const concorsoDate = extractDateSlug(concorso.publication_date || concorso.createdAt);
      if (concorsoDate !== date) return false;
    }
    
    return true;
  });
  
  // If exact match found, return it
  if (exactMatches.length > 0) {
    return exactMatches[0];
  }
  
  // Try more flexible matching - prioritize ente and title matches
  const flexibleMatches = concorsi.filter(concorso => {
    let score = 0;
    
    // Check ente match (most important)
    if (ente) {
      const concorsoEnte = extractEnteSlug(concorso.Ente || '');
      if (concorsoEnte === ente) {
        score += 3;
      } else if (concorsoEnte.includes(ente) || ente.includes(concorsoEnte)) {
        score += 2;
      } else if (concorso.Ente?.toLowerCase().includes(ente.replace(/-/g, ' '))) {
        score += 1;
      }
    }
    
    // Check title match (very important)
    if (title) {
      const concorsoTitle = extractTitleSlug(concorso.Titolo || concorso.titolo_breve || '');
      if (concorsoTitle === title) {
        score += 3;
      } else if (concorsoTitle.includes(title) || title.includes(concorsoTitle)) {
        score += 2;
      } else {
        // Try partial word matching
        const titleWords = title.split('-');
        const concorsoTitleWords = concorsoTitle.split('-');
        const matchingWords = titleWords.filter(word => 
          concorsoTitleWords.some(cWord => cWord.includes(word) || word.includes(cWord))
        );
        if (matchingWords.length >= Math.min(2, titleWords.length)) {
          score += 1;
        }
      }
    }
    
    // Check localita match (less important)
    if (localita) {
      const concorsoLocalita = extractLocalitaSlug(concorso.AreaGeografica || '');
      if (concorsoLocalita === localita) {
        score += 2;
      } else if (concorsoLocalita.includes(localita) || localita.includes(concorsoLocalita)) {
        score += 1;
      }
    }
    
    // Check date match (least important for flexibility)
    if (date) {
      const concorsoDate = extractDateSlug(concorso.publication_date || concorso.createdAt);
      if (concorsoDate === date) {
        score += 1;
      }
    }
    
    return score >= 2; // Require at least some matching
  });
  
  // Sort by score and return best match
  if (flexibleMatches.length > 0) {
    return flexibleMatches[0]; // For now, just return the first flexible match
  }
  
  return null;
}

/**
 * Check if a string looks like a Firebase document ID
 */
export function isFirebaseDocumentId(id: string): boolean {
  // Firebase auto-generated IDs are 20 characters long
  // Custom IDs can be different lengths (e.g., 32-char hex strings)
  // Accept alphanumeric IDs between 16 and 40 characters
  return /^[a-zA-Z0-9]{16,40}$/.test(id);
}

/**
 * Determine if a URL segment is an ID or slug component
 */
export function isIdOrSlug(segment: string): 'id' | 'slug' {
  return isFirebaseDocumentId(segment) ? 'id' : 'slug';
}

/**
 * Generate breadcrumb items for concorso page
 */
export function generateConcorsoBreadcrumbs(concorso: Concorso): Array<{
  label: string;
  href: string;
}> {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Concorsi', href: '/concorsi' }
  ];
  
  if (concorso.AreaGeografica) {
    const localita = concorso.AreaGeografica.split(',')[0]?.trim() || concorso.AreaGeografica;
    breadcrumbs.push({
      label: localita,
      href: `/concorsi?localita=${encodeURIComponent(localita)}`
    });
  }
  
  if (concorso.Ente) {
    breadcrumbs.push({
      label: concorso.Ente,
      href: `/concorsi?ente=${encodeURIComponent(concorso.Ente)}`
    });
  }
  
  return breadcrumbs;
}
