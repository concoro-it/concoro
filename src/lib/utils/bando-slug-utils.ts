import { Concorso } from '@/types/concorso'
import { Timestamp } from 'firebase/firestore'

/**
 * Generates SEO-friendly URL slugs for bando pages
 * Format: /bandi/[regione_nome]/[provincia_nome]/[ente]/[titolo_breve]/[publication_date]/[concorso_id]
 */

/**
 * Converts a string to a URL-safe slug
 */
export function toUrlSafeSlug(text: string): string {
  if (!text) return ''
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove accents and special characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Keep only alphanumeric characters and hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-|-$/g, '')
}

/**
 * Normalizes an ente name to match the slug format used in URLs
 * This preserves the full ente name for better matching
 */
export function normalizeEnteForSlug(enteName: string): string {
  if (!enteName) return ''
  
  return enteName
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove accents and special characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Keep only alphanumeric characters and hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-|-$/g, '')
}

/**
 * Checks if an ente name matches a given slug
 * Uses the same normalization logic as slug generation for consistency
 */
export function matchesEnteSlug(enteName: string, slug: string): boolean {
  const normalizedEnte = normalizeEnteForSlug(enteName)
  return normalizedEnte === slug.toLowerCase()
}

/**
 * Extracts regione and provincia from the province array in Firebase
 * Returns { regione_nome, provincia_nome } from the first province entry
 */
export function extractRegioneProvincia(concorso: any): { regione_nome: string, provincia_nome: string } {
  // Check if province array exists and has at least one entry
  if (concorso.province && Array.isArray(concorso.province) && concorso.province.length > 0) {
    const firstProvince = concorso.province[0]
    if (firstProvince && typeof firstProvince === 'object') {
      return {
        regione_nome: firstProvince.regione_nome || 'Italia',
        provincia_nome: firstProvince.provincia_nome || 'Italia'
      }
    }
  }
  
  // Fallback: try to extract from AreaGeografica field (legacy)
  if (concorso.AreaGeografica) {
    const cleaned = concorso.AreaGeografica.replace(/\([^)]*\)/g, '').trim()
    const parts = cleaned.split(/[,;-]/)
    const firstPart = parts[0]?.trim() || 'Italia'
    
    return {
      regione_nome: 'Italia', // Can't determine region from legacy field
      provincia_nome: firstPart
    }
  }
  
  return {
    regione_nome: 'Italia',
    provincia_nome: 'Italia'
  }
}

/**
 * Creates a short descriptive title from the job title
 * Removes common prefixes and shortens to key terms
 */
export function createTitoloBeve(titolo: string): string {
  if (!titolo) return 'Concorso'
  
  // Remove common prefixes
  const cleaned = titolo
    .replace(/^(concorso\s+)?(?:pubblico\s+)?(?:per\s+)?(?:la\s+copertura\s+di\s+)?(?:n\.\s*\d+\s+)?(?:posti?\s+di\s+)?/i, '')
    .replace(/^(selezione\s+)?(?:pubblica\s+)?(?:per\s+)?/i, '')
    .replace(/^(avviso\s+)?(?:pubblico\s+)?(?:di\s+)?(?:selezione\s+)?/i, '')
    .trim()
  
  // Take first 3-4 meaningful words
  const words = cleaned.split(/\s+/)
  const importantWords = words.filter(word => 
    word.length > 2 && 
    !['per', 'di', 'da', 'in', 'con', 'del', 'della', 'dei', 'delle', 'degli'].includes(word.toLowerCase())
  )
  
  // Take up to 4 words, or fall back to first 4 words if no important words found
  const finalWords = importantWords.length > 0 
    ? importantWords.slice(0, 4)
    : words.slice(0, 4)
    
  return finalWords.join(' ') || 'Concorso'
}

/**
 * Formats publication date to YYYY-MM-DD format
 */
export function formatPublicationDate(publicationDate: string | Timestamp | { seconds: number; nanoseconds: number } | undefined): string {
  if (!publicationDate) return new Date().toISOString().split('T')[0]
  
  let date: Date
  
  try {
    if (typeof publicationDate === 'string') {
      date = new Date(publicationDate)
    } else if (publicationDate instanceof Timestamp) {
      date = publicationDate.toDate()
    } else if (typeof publicationDate === 'object' && 'seconds' in publicationDate) {
      date = new Date(publicationDate.seconds * 1000)
    } else {
      date = new Date()
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      date = new Date()
    }
    
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error formatting publication date:', error)
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Generates the complete SEO-friendly URL slug for a bando
 * Format: regione_nome/provincia_nome/ente/titolo_breve/publication_date/concorso_id
 */
export function generateBandoSlug(concorso: any): string {
  // Extract regione and provincia from province array
  const { regione_nome, provincia_nome } = extractRegioneProvincia(concorso)
  const regione = toUrlSafeSlug(regione_nome)
  const provincia = toUrlSafeSlug(provincia_nome)
  
  // Extract ente (remove common prefixes)
  const enteRaw = concorso.Ente || 'Ente-Pubblico'
  const ente = toUrlSafeSlug(enteRaw.replace(/^(comune\s+di\s+|provincia\s+di\s+|regione\s+|asl\s+|azienda\s+|universit[àa]\s+)/i, ''))
  
  // Create short title
  const titolo = concorso.Titolo || concorso.titolo_breve || 'Concorso'
  const titoloBeve = toUrlSafeSlug(createTitoloBeve(titolo))
  
  // Format date
  const dataStr = formatPublicationDate(concorso.publication_date)
  
  // Get full concorso_id
  const concorsoId = concorso.concorso_id || concorso.id || 'unknown'
  
  // Combine parts, ensuring no empty segments
  const parts = [
    regione || 'italia',
    provincia || 'italia',
    ente || 'ente-pubblico',
    titoloBeve || 'concorso',
    dataStr,
    concorsoId
  ].filter(part => part && part !== '')
  
  return parts.join('/')
}

/**
 * Parses a bando slug back into its components
 * New format: regione_nome/provincia_nome/ente/titolo_breve/publication_date/concorso_id
 */
export interface ParsedBandoSlug {
  regione: string
  provincia: string
  ente: string
  titoloBreve: string
  dataPubblicazione: string
  concorsoId: string
}

export function parseBandoSlug(slug: string): ParsedBandoSlug | null {
  if (!slug) return null
  
  const parts = slug.split('/')
  if (parts.length !== 6) return null
  
  return {
    regione: parts[0],
    provincia: parts[1],
    ente: parts[2],
    titoloBreve: parts[3],
    dataPubblicazione: parts[4],
    concorsoId: parts[5]
  }
}

/**
 * Checks if a string looks like a Firestore document ID
 */
export function isFirestoreDocumentId(str: string): boolean {
  if (!str) return false
  
  // Firestore auto-generated IDs are typically 20 characters, alphanumeric
  // Or they can be custom IDs which often look like UUIDs (32 chars with hyphens)
  const autoGenPattern = /^[a-zA-Z0-9]{20}$/
  const uuidPattern = /^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i
  const customPattern = /^[a-f0-9]{32}$/i
  
  return autoGenPattern.test(str) || uuidPattern.test(str) || customPattern.test(str)
}

/**
 * Validates that a slug matches our expected format
 * New format: regione_nome/provincia_nome/ente/titolo_breve/publication_date/concorso_id
 */
export function isValidBandoSlug(slug: string): boolean {
  if (!slug) return false
  
  // Check if it looks like a document ID first
  if (isFirestoreDocumentId(slug)) return false
  
  const parts = slug.split('/')
  
  // Must have exactly 6 parts now
  if (parts.length !== 6) return false
  
  // Each part (except last two) must be a valid URL slug (allow alphanumeric and hyphens)
  const urlSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!parts.slice(0, 4).every(part => urlSlugPattern.test(part))) return false
  
  // Fifth part should be a valid date (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!datePattern.test(parts[4])) return false
  
  // Last part should be a valid concorso_id (Firebase document ID or custom ID)
  const concorsoId = parts[5]
  if (!concorsoId || concorsoId.length < 8) return false
  
  return true
}

/**
 * Generates a URL path for a bando using the new format
 * Format: /bandi/regione_nome/provincia_nome/ente/titolo_breve/publication_date/concorso_id
 */
export function getBandoUrl(concorso: any): string {
  try {
    const slug = generateBandoSlug(concorso)
    if (isValidBandoSlug(slug)) {
      return `/bandi/${slug}`
    }
  } catch (error) {
    console.error('Error generating bando slug:', error)
  }
  
  // Fallback to ID
  return `/bandi/${concorso.concorso_id || concorso.id}`
}

/**
 * Updates an existing concorso document with its generated slug
 * This would be used in a migration script or when creating new concorsi
 */
export function addSlugToConcorso(concorso: any): any & { slug?: string } {
  try {
    const slug = generateBandoSlug(concorso)
    if (isValidBandoSlug(slug)) {
      return { ...concorso, slug }
    }
  } catch (error) {
    console.error('Error adding slug to concorso:', error)
  }
  
  return concorso
}
