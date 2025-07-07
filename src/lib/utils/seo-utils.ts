import { toItalianSentenceCase } from './italian-capitalization';

interface SEOMetaData {
  title: string;
  description: string;
  keywords: string[];
}

/**
 * Generates SEO-optimized title tag
 * Requirements: ≤ 60 chars, begins with primary keyword, ends with "| Concoro"
 */
export function generateSEOTitle(
  articleTitle: string, 
  role?: string, 
  location?: string,
  region?: string
): string {
  // Extract primary keyword (role or first significant word from title)
  const primaryKeyword = role || extractPrimaryKeyword(articleTitle);
  
  // Build title components
  let title = primaryKeyword;
  
  // Add location if available and space permits
  if (location && (title.length + location.length + 2) < 45) {
    title += ` ${toItalianSentenceCase(location)}`;
  }
  
  // Always end with "| Concoro" (10 chars including space)
  title += ' | Concoro';
  
  // Ensure it's under 60 chars
  if (title.length > 60) {
    const maxBaseLength = 60 - 10; // Reserve 10 chars for " | Concoro"
    title = title.substring(0, maxBaseLength).trim() + ' | Concoro';
  }
  
  return toItalianSentenceCase(title);
}

/**
 * Generates SEO-optimized meta description
 * Requirements: 140-160 chars, unique, contains role + location + CTA
 */
export function generateSEODescription(
  articleTitle: string,
  articleSubtitle?: string,
  role?: string,
  location?: string,
  region?: string,
  customDescription?: string
): string {
  // Use custom description if provided and within limits
  if (customDescription && customDescription.length >= 140 && customDescription.length <= 160) {
    return customDescription;
  }
  
  // Build description components
  const roleText = role ? toItalianSentenceCase(role) : 'Concorso pubblico';
  const locationText = location ? ` a ${toItalianSentenceCase(location)}` : '';
  const regionText = region && region !== location ? ` (${toItalianSentenceCase(region)})` : '';
  
  // CTA options
  const ctas = [
    'Scopri come candidarti su Concoro.',
    'Leggi tutti i dettagli su Concoro.',
    'Trova la tua opportunità su Concoro.',
    'Candidati ora tramite Concoro.',
    'Tutte le info su Concoro.'
  ];
  
  // Build base description
  let description = `${roleText}${locationText}${regionText}: `;
  
  // Add article subtitle or title if available
  if (articleSubtitle) {
    description += articleSubtitle;
  } else {
    // Extract meaningful content from article title
    const cleanTitle = articleTitle
      .replace(/concorso/gi, '')
      .replace(/bando/gi, '')
      .replace(/selezione/gi, '')
      .trim();
    description += cleanTitle;
  }
  
  // Choose appropriate CTA based on remaining space
  const targetLength = 150; // Aim for middle of 140-160 range
  let bestCTA = ctas[ctas.length - 1]; // Start with shortest
  
  for (const cta of ctas) {
    const testLength = description.length + 1 + cta.length;
    if (testLength <= 160 && testLength >= 140) {
      bestCTA = cta;
      break;
    }
  }
  
  description += ` ${bestCTA}`;
  
  // Adjust if too long
  if (description.length > 160) {
    const maxLength = 160 - bestCTA.length - 1;
    const trimmedBase = description.substring(0, maxLength).trim();
    description = `${trimmedBase} ${bestCTA}`;
  }
  
  // Adjust if too short
  if (description.length < 140) {
    const longerCTA = 'Scopri requisiti, scadenze e come candidarti. Tutte le informazioni su Concoro.';
    const newLength = description.length - bestCTA.length + longerCTA.length;
    if (newLength <= 160) {
      description = description.replace(bestCTA, longerCTA);
    }
  }
  
  return description;
}

/**
 * Generates SEO keywords from article data
 */
export function generateSEOKeywords(
  articleTags: string[],
  role?: string,
  location?: string,
  region?: string
): string[] {
  const keywords = new Set<string>();
  
  // Add main keywords
  if (role) keywords.add(role.toLowerCase());
  if (location) keywords.add(location.toLowerCase());
  if (region) keywords.add(region.toLowerCase());
  
  // Add standard keywords
  keywords.add('concorso pubblico');
  keywords.add('bando');
  keywords.add('candidatura');
  keywords.add('lavoro pubblico');
  
  // Add article tags (up to 5 most relevant)
  articleTags.slice(0, 5).forEach(tag => {
    keywords.add(tag.toLowerCase());
  });
  
  return Array.from(keywords);
}

/**
 * Extracts primary keyword from article title
 */
function extractPrimaryKeyword(title: string): string {
  const keywords = [
    'istruttore', 'dirigente', 'funzionario', 'assistente', 'operatore',
    'tecnico', 'amministrativo', 'contabile', 'informatico', 'ingegnere',
    'medico', 'infermiere', 'vigile', 'polizia', 'ispettore', 'commissario'
  ];
  
  const titleLower = title.toLowerCase();
  const found = keywords.find(keyword => titleLower.includes(keyword));
  
  return found || title.split(' ')[0] || 'concorso';
}

/**
 * Generates complete SEO meta data for an article
 */
export function generateArticleSEO(
  articleTitle: string,
  articleSubtitle?: string,
  articleTags: string[] = [],
  role?: string,
  location?: string,
  region?: string,
  customDescription?: string
): SEOMetaData {
  return {
    title: generateSEOTitle(articleTitle, role, location, region),
    description: generateSEODescription(
      articleTitle, 
      articleSubtitle, 
      role, 
      location, 
      region, 
      customDescription
    ),
    keywords: generateSEOKeywords(articleTags, role, location, region)
  };
}

/**
 * Content analysis and validation utilities for SEO compliance
 */

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate keyword density for a given keyword in text
 */
export function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0;
  
  const words = text.toLowerCase().trim().split(/\s+/);
  const keywordLower = keyword.toLowerCase();
  const keywordOccurrences = words.filter(word => 
    word.includes(keywordLower) || keywordLower.includes(word)
  ).length;
  
  return words.length > 0 ? (keywordOccurrences / words.length) * 100 : 0;
}

/**
 * Extract first paragraph and validate intro requirements
 */
export function validateIntroRequirements(
  content: string, 
  primaryKeyword: string
): {
  isValid: boolean;
  wordCount: number;
  hasKeywordInFirst80Chars: boolean;
  firstParagraph: string;
} {
  if (!content) {
    return {
      isValid: false,
      wordCount: 0,
      hasKeywordInFirst80Chars: false,
      firstParagraph: ''
    };
  }

  // Extract first paragraph
  const paragraphs = content.split('\n\n');
  const firstParagraph = paragraphs[0] || '';
  
  // Count words in first paragraph
  const wordCount = countWords(firstParagraph);
  
  // Check if primary keyword appears in first 80 characters
  const first80Chars = firstParagraph.substring(0, 80).toLowerCase();
  const hasKeywordInFirst80Chars = first80Chars.includes(primaryKeyword.toLowerCase());
  
  return {
    isValid: wordCount <= 120 && hasKeywordInFirst80Chars,
    wordCount,
    hasKeywordInFirst80Chars,
    firstParagraph
  };
}

/**
 * Generate optimized alt text for images in Italian
 */
export function generateAltText(
  imagePath: string,
  articleTitle: string,
  role?: string,
  location?: string
): string {
  // Extract image type/context from path
  const fileName = imagePath.split('/').pop() || '';
  
  if (fileName.includes('default-article-image') || fileName.includes('placeholder')) {
    return `Immagine illustrativa per ${articleTitle}`;
  }
  
  if (fileName.includes('logo') || fileName.includes('ente')) {
    return `Logo dell'ente per ${role || 'concorso'} ${location ? `a ${location}` : ''}`.trim();
  }
  
  if (fileName.includes('author') || fileName.includes('profile')) {
    return `Foto profilo autore articolo`;
  }
  
  // Default descriptive alt text
  let altText = 'Illustrazione per';
  if (role) altText += ` ${role.toLowerCase()}`;
  if (location) altText += ` a ${location}`;
  altText += ` - ${articleTitle}`;
  
  return toItalianSentenceCase(altText);
}

/**
 * Validate content structure for SEO compliance
 */
export function validateContentStructure(content: string): {
  hasH1: boolean;
  h1Count: number;
  hasH2: boolean;
  hierarchyValid: boolean;
  wordCount: number;
  headingStructure: string[];
} {
  if (!content) {
    return {
      hasH1: false,
      h1Count: 0,
      hasH2: false,
      hierarchyValid: false,
      wordCount: 0,
      headingStructure: []
    };
  }

  // Extract headings using regex
  const headingMatches = content.match(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi) || [];
  const headingStructure: string[] = [];
  let h1Count = 0;
  let hasH2 = false;
  let hierarchyValid = true;
  let lastLevel = 0;

  headingMatches.forEach(heading => {
    const levelMatch = heading.match(/<h([1-6])/);
    if (levelMatch) {
      const level = parseInt(levelMatch[1]);
      headingStructure.push(`H${level}`);
      
      if (level === 1) h1Count++;
      if (level === 2) hasH2 = true;
      
      // Check hierarchy (no skipped levels)
      if (level > lastLevel + 1) {
        hierarchyValid = false;
      }
      lastLevel = Math.max(lastLevel, level);
    }
  });

  return {
    hasH1: h1Count > 0,
    h1Count,
    hasH2,
    hierarchyValid,
    wordCount: countWords(content.replace(/<[^>]*>/g, '')), // Strip HTML for word count
    headingStructure
  };
}

/**
 * Generate social sharing image URL with proper dimensions
 * Returns optimized image URL for 1200x630 social sharing
 */
export function generateSocialImage(
  articleTitle: string,
  role?: string,
  location?: string,
  baseImageUrl?: string
): string {
  // For now, return the base image URL or default
  // In production, this could generate dynamic social images
  if (baseImageUrl && baseImageUrl.includes('concoro.it')) {
    return baseImageUrl;
  }
  
  // Default social sharing image that should be 1200x630
  return 'https://concoro.it/blog/default-article-image.png';
} 