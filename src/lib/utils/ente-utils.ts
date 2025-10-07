/**
 * Utility functions for handling ente (organization) data
 */

import { splitLocationString } from './localita-utils';

/**
 * Generates a URL-friendly slug from an ente name
 * @param enteName - The name of the ente
 * @returns A URL-friendly slug
 */
export function generateEnteSlug(enteName: string): string {
  if (!enteName) return '';
  
  return encodeURIComponent(enteName.trim());
}

/**
 * Generates the URL path for an ente page
 * @param enteName - The name of the ente
 * @param basePath - Base path for the URL ('concorsi' for public, 'bandi' for protected). Defaults to 'concorsi'
 * @returns The URL path for the ente page
 */
export function getEnteUrl(enteName: string, basePath: 'concorsi' | 'bandi' = 'concorsi'): string {
  if (!enteName) return '';
  
  const slug = generateEnteSlug(enteName);
  
  // Public concorsi pages use query parameters, protected bandi pages use path segments
  if (basePath === 'concorsi') {
    return `/concorsi?ente=${slug}`;
  }
  
  return `/${basePath}/ente/${slug}`;
}

/**
 * Decodes an ente slug back to the original ente name
 * @param slug - The URL slug
 * @returns The original ente name
 */
export function decodeEnteSlug(slug: string): string {
  if (!slug) return '';
  
  try {
    return decodeURIComponent(slug);
  } catch (error) {
    console.error('Error decoding ente slug:', error);
    return slug;
  }
}

/**
 * Normalizes an ente name for consistent comparison
 * @param enteName - The ente name to normalize
 * @returns Normalized ente name
 */
export function normalizeEnteName(enteName: string): string {
  if (!enteName) return '';
  
  return enteName.trim().toLowerCase();
}

/**
 * Checks if two ente names are the same (case-insensitive)
 * @param ente1 - First ente name
 * @param ente2 - Second ente name
 * @returns True if the ente names are the same
 */
export function isSameEnte(ente1: string, ente2: string): boolean {
  return normalizeEnteName(ente1) === normalizeEnteName(ente2);
}

/**
 * Groups concorsi by their concorso_id to handle multiple regions
 * @param concorsi - Array of concorsi
 * @returns Object with concorso_id as key and array of concorsi as value
 */
export function groupConcorsiByConcorsoId(concorsi: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  concorsi.forEach(concorso => {
    const concorsoId = concorso.concorso_id || concorso.id;
    if (!grouped[concorsoId]) {
      grouped[concorsoId] = [];
    }
    grouped[concorsoId].push(concorso);
  });
  
  return grouped;
}

/**
 * Creates a grouped concorso object with all regions combined
 * @param concorsiGroup - Array of concorsi with the same concorso_id
 * @returns A single concorso object with combined regions information
 */
export function createGroupedConcorso(concorsiGroup: any[]): any {
  if (concorsiGroup.length === 0) return null;
  if (concorsiGroup.length === 1) return concorsiGroup[0];
  
  // Use the first concorso as base
  const baseConcorso = concorsiGroup[0];
  
  // Extract all unique regions and split combined strings
  const regions = Array.from(new Set(
    concorsiGroup
      .flatMap(c => {
        const areaGeografica = c.AreaGeografica;
        if (!areaGeografica) return [];
        
        // Use the utility function to split location strings
        return splitLocationString(areaGeografica);
      })
      .filter(Boolean)
  ));
  
  // Calculate total positions across all regions
  const totalPositions = concorsiGroup.reduce((total, c) => 
    total + (c.numero_di_posti || 1), 0
  );
  
  return {
    ...baseConcorso,
    // Use the first concorso's ID for navigation
    id: baseConcorso.id,
    concorso_id: baseConcorso.concorso_id,
    // Combine all regions
    AreaGeografica: regions.join(', '),
    // Store individual regions for display
    regions: regions,
    // Store all concorsi for this concorso_id
    allConcorsi: concorsiGroup,
    // Update total positions
    numero_di_posti: totalPositions,
    // Mark as grouped
    isGrouped: true,
    // Count of regions
    regionCount: regions.length
  };
}
