import { Articolo } from '@/types/articolo';

/**
 * Generate SEO-friendly URL slug for an articolo
 * Format: /articolo/[category]/[title]/[year]/[id]
 * This ensures unique URLs while maintaining SEO benefits with ID at the end
 */
export function generateArticoloSlug(articolo: Articolo): string {
  // Extract primary category/tag
  const category = extractCategorySlug(articolo.articolo_tags || [], articolo.categoria);
  
  // Extract title keywords (first 3-4 meaningful words)
  const title = extractTitleSlug(articolo.articolo_title || '');
  
  // Extract year
  const year = extractYearSlug(articolo.publication_date || articolo.createdAt);
  
  // ID at the end to ensure uniqueness
  return `${category}/${title}/${year}/${articolo.id}`;
}

/**
 * Generate complete SEO URL for an articolo
 */
export function generateSEOArticoloUrl(articolo: Articolo): string {
  const slug = generateArticoloSlug(articolo);
  return `/articolo/${slug}`;
}

/**
 * Generate simple articolo URL for current structure
 * Format: /articolo/[id] or /articolo/[slug]
 */
export function generateArticoloUrl(articolo: Articolo, useSEOSlug = true): string {
  if (useSEOSlug) {
    const slug = generateArticoloSlug(articolo);
    return `/articolo/${slug}`;
  }
  return `/articolo/${articolo.slug || articolo.id}`;
}

/**
 * Extract category slug from tags and categoria field
 */
function extractCategorySlug(tags: string[], categoria?: string): string {
  // Priority: most relevant tag or categoria field
  const categoryMap: Record<string, string> = {
    // Main categories
    'concorsi pubblici': 'concorsi-pubblici',
    'bandi': 'bandi',
    'enti locali': 'enti-locali',
    'sanità': 'sanita',
    'scuola': 'scuola',
    'università': 'universita',
    'forze armate': 'forze-armate',
    'pubblica amministrazione': 'pubblica-amministrazione',
    
    // Specific roles
    'istruttore amministrativo': 'istruttore-amministrativo',
    'funzionario': 'funzionario',
    'dirigente': 'dirigente',
    'assistente': 'assistente',
    'tecnico': 'tecnico',
    'operatore': 'operatore',
    
    // Location-based
    'comune': 'comune',
    'regione': 'regione',
    'ministero': 'ministero',
    'agenzia': 'agenzia',
    
    // Topics
    'guida': 'guida',
    'news': 'news',
    'scadenze': 'scadenze',
    'requisiti': 'requisiti',
    'come partecipare': 'come-partecipare',
  };
  
  // First, check if categoria matches our map
  if (categoria) {
    const lowerCategoria = categoria.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerCategoria.includes(key)) {
        return value;
      }
    }
  }
  
  // Then check tags
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerTag.includes(key)) {
        return value;
      }
    }
  }
  
  // If we have any tag, use the first one
  if (tags.length > 0) {
    return slugify(tags[0]);
  }
  
  // Fallback
  return 'concorsi';
}

/**
 * Extract title slug from article title
 */
function extractTitleSlug(title: string): string {
  // Remove common words and extract meaningful keywords
  const stopWords = [
    'per', 'di', 'da', 'del', 'della', 'dei', 'delle', 'degli', 'con', 'presso', 
    'come', 'cosa', 'quando', 'dove', 'chi', 'che', 'una', 'uno', 'il', 'la', 'lo',
    'i', 'gli', 'le', 'al', 'allo', 'alla', 'agli', 'alle', 'sul', 'sullo', 'sulla',
    'nel', 'nello', 'nella', 'nei', 'negli', 'nelle'
  ];
  
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\d+/g, '') // Remove numbers
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  // Take first 4 meaningful words
  const meaningfulWords = words.slice(0, 4);
  
  return meaningfulWords.length > 0 
    ? meaningfulWords.join('-') 
    : slugify(title.substring(0, 50));
}

/**
 * Extract year slug from timestamp
 */
function extractYearSlug(timestamp: any): string {
  let date: Date;
  
  if (timestamp?.seconds) {
    // Firebase Timestamp
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp?._seconds) {
    // Serialized Firebase Timestamp
    date = new Date(timestamp._seconds * 1000);
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
 * Parse articolo slug back to components
 * Format: [category]/[title]/[year]/[id]
 */
export function parseArticoloSlug(slug: string): {
  id?: string;
  category?: string;
  title?: string;
  year?: string;
} {
  if (!slug) return {};
  
  // Check if it's just an ID (20+ char alphanumeric)
  if (isFirebaseDocumentId(slug)) {
    return { id: slug };
  }
  
  // Parse new format with slashes: category/title/year/id
  if (slug.includes('/')) {
    const parts = slug.split('/').filter(Boolean);
    
    // New format: 4 parts with ID at the end
    if (parts.length === 4 && isFirebaseDocumentId(parts[3])) {
      return {
        category: parts[0],
        title: parts[1],
        year: parts[2],
        id: parts[3]
      };
    }
    
    // Fallback: old format without ID (3 parts)
    if (parts.length === 3) {
      return {
        category: parts[0],
        title: parts[1],
        year: parts[2]
      };
    }
  }
  
  return {};
}

/**
 * Find articolo by SEO slug components
 * This function can be used to lookup articoli by their slug parts
 */
export function findArticoloBySlug(
  articoli: Articolo[], 
  slugComponents: { id?: string; category?: string; title?: string; year?: string }
): Articolo | null {
  
  const { id, category, title, year } = slugComponents;
  
  // If ID is provided, use it for exact match (most reliable)
  if (id) {
    const exactMatch = articoli.find(a => a.id === id);
    if (exactMatch) {
      return exactMatch;
    }
  }
  
  // Try exact match first
  const exactMatches = articoli.filter(articolo => {
    // Check category match
    if (category) {
      const articoloCategory = extractCategorySlug(articolo.articolo_tags || [], articolo.categoria);
      if (articoloCategory !== category) return false;
    }
    
    // Check title match (more flexible)
    if (title) {
      const articoloTitle = extractTitleSlug(articolo.articolo_title || '');
      if (!articoloTitle.includes(title) && !title.includes(articoloTitle)) return false;
    }
    
    // Check year match
    if (year) {
      const articoloYear = extractYearSlug(articolo.publication_date || articolo.createdAt);
      if (articoloYear !== year) return false;
    }
    
    return true;
  });
  
  // If exact match found, return it
  if (exactMatches.length > 0) {
    return exactMatches[0];
  }
  
  // Try more flexible matching - prioritize title matches
  const flexibleMatches = articoli.filter(articolo => {
    let score = 0;
    
    // Check title match (most important)
    if (title) {
      const articoloTitle = extractTitleSlug(articolo.articolo_title || '');
      if (articoloTitle === title) {
        score += 3;
      } else if (articoloTitle.includes(title) || title.includes(articoloTitle)) {
        score += 2;
      } else {
        // Try partial word matching
        const titleWords = title.split('-');
        const articoloTitleWords = articoloTitle.split('-');
        const matchingWords = titleWords.filter(word => 
          articoloTitleWords.some(aWord => aWord.includes(word) || word.includes(aWord))
        );
        if (matchingWords.length >= Math.min(2, titleWords.length)) {
          score += 1;
        }
      }
    }
    
    // Check category match
    if (category) {
      const articoloCategory = extractCategorySlug(articolo.articolo_tags || [], articolo.categoria);
      if (articoloCategory === category) {
        score += 2;
      } else if (articoloCategory.includes(category) || category.includes(articoloCategory)) {
        score += 1;
      }
    }
    
    // Check year match (least important for flexibility)
    if (year) {
      const articoloYear = extractYearSlug(articolo.publication_date || articolo.createdAt);
      if (articoloYear === year) {
        score += 1;
      }
    }
    
    return score >= 2; // Require at least some matching
  });
  
  // Return best match
  if (flexibleMatches.length > 0) {
    return flexibleMatches[0];
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
 * Generate breadcrumb items for articolo page
 */
export function generateArticoloBreadcrumbs(articolo: Articolo): Array<{
  label: string;
  href: string;
}> {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' }
  ];
  
  // Add primary tag as category
  if (articolo.articolo_tags && articolo.articolo_tags.length > 0) {
    const primaryTag = articolo.articolo_tags[0];
    breadcrumbs.push({
      label: primaryTag,
      href: `/blog/tags/${encodeURIComponent(primaryTag)}`
    });
  }
  
  return breadcrumbs;
}

