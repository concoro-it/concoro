/**
 * Utility functions for handling località (location) data
 */

/**
 * Generates a URL-friendly slug from a location name
 * @param locationName - The name of the location
 * @returns A URL-friendly slug
 */
export function generateLocalitaSlug(locationName: string): string {
  if (!locationName) return '';
  
  return encodeURIComponent(locationName.trim());
}

/**
 * Generates the URL path for a località page
 * @param locationName - The name of the location
 * @param basePath - Base path for the URL ('concorsi' for public, 'bandi' for protected). Defaults to 'concorsi'
 * @returns The URL path for the località page
 */
export function getLocalitaUrl(locationName: string, basePath: 'concorsi' | 'bandi' = 'concorsi'): string {
  if (!locationName) return '';
  
  const slug = generateLocalitaSlug(locationName);
  
  // Public concorsi pages use query parameters, protected bandi pages use path segments
  if (basePath === 'concorsi') {
    return `/concorsi?localita=${slug}`;
  }
  
  return `/${basePath}/localita/${slug}`;
}

/**
 * Decodes a località slug back to the original location name
 * @param slug - The URL slug
 * @returns The original location name
 */
export function decodeLocalitaSlug(slug: string): string {
  if (!slug) return '';
  
  try {
    return decodeURIComponent(slug);
  } catch (error) {
    console.error('Error decoding località slug:', error);
    return slug;
  }
}

/**
 * Normalizes a location name for consistent comparison
 * @param locationName - The location name to normalize
 * @returns Normalized location name
 */
export function normalizeLocationName(locationName: string): string {
  if (!locationName) return '';
  
  return locationName.trim().toLowerCase();
}

/**
 * Checks if two location names are the same (case-insensitive)
 * @param location1 - First location name
 * @param location2 - Second location name
 * @returns True if the location names are the same
 */
export function isSameLocation(location1: string, location2: string): boolean {
  return normalizeLocationName(location1) === normalizeLocationName(location2);
}

/**
 * Extracts province from a location string
 * @param location - The full location string
 * @returns The province name if found
 */
export function extractProvince(location: string): string | null {
  if (!location) return null;
  
  // Common patterns for Italian locations
  const patterns = [
    /,\s*([^,]+)$/, // "City, Province" format
    /-\s*([^,]+)$/, // "City - Province" format
    /\s+([A-Z][a-z]+)$/, // "City Province" format
  ];
  
  for (const pattern of patterns) {
    const match = location.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Extracts city from a location string
 * @param location - The full location string
 * @returns The city name if found
 */
export function extractCity(location: string): string | null {
  if (!location) return null;
  
  // Remove province part to get city
  const province = extractProvince(location);
  if (province) {
    return location.replace(new RegExp(`[,\\s-]*${province.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '').trim();
  }
  
  return location.trim();
}

/**
 * Checks if a location contains a specific province
 * @param location - The location string to check
 * @param province - The province to look for
 * @returns True if the location contains the province
 */
export function locationContainsProvince(location: string, province: string): boolean {
  if (!location || !province) return false;
  
  const normalizedLocation = normalizeLocationName(location);
  const normalizedProvince = normalizeLocationName(province);
  
  return normalizedLocation.includes(normalizedProvince);
}

/**
 * Groups locations by province
 * @param locations - Array of location strings
 * @returns Object with province as key and array of locations as value
 */
export function groupLocationsByProvince(locations: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  locations.forEach(location => {
    const province = extractProvince(location) || 'Altre';
    if (!grouped[province]) {
      grouped[province] = [];
    }
    grouped[province].push(location);
  });
  
  return grouped;
}

/**
 * Checks if a location matches a search term (case-insensitive partial match)
 * @param location - The location string to check
 * @param searchTerm - The search term to match against
 * @returns True if the location contains the search term
 */
export function locationMatchesSearch(location: string, searchTerm: string): boolean {
  if (!location || !searchTerm) return false;
  
  const normalizedLocation = normalizeLocationName(location);
  const normalizedSearchTerm = normalizeLocationName(searchTerm);
  
  return normalizedLocation.includes(normalizedSearchTerm);
}

/**
 * Extracts region from a location string
 * @param location - The full location string
 * @returns The region name if found
 */
export function extractRegion(location: string): string | null {
  if (!location) return null;
  
  // Common Italian regions
  const regions = [
    'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
    'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'
  ];
  
  const normalizedLocation = normalizeLocationName(location);
  
  for (const region of regions) {
    const normalizedRegion = normalizeLocationName(region);
    if (normalizedLocation.includes(normalizedRegion)) {
      return region;
    }
  }
  
  return null;
}

/**
 * Groups locations by region
 * @param locations - Array of location strings
 * @returns Object with region as key and array of locations as value
 */
export function groupLocationsByRegion(locations: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  locations.forEach(location => {
    const region = extractRegion(location) || 'Altre';
    if (!grouped[region]) {
      grouped[region] = [];
    }
    grouped[region].push(location);
  });
  
  return grouped;
}

/**
 * Splits a combined location string into individual regions
 * @param locationString - The combined location string (e.g., "Liguria, Trentino Alto Adige, Sicilia")
 * @returns Array of individual region strings
 */
export function splitLocationString(locationString: string): string[] {
  if (!locationString) return [];
  
  // Split by common delimiters and clean up
  const splitRegions = locationString
    .split(/[,;|]/) // Split by comma, semicolon, or pipe
    .map((region: string) => region.trim())
    .filter((region: string) => region.length > 0);
  
  // If no splitting occurred, return the original string
  return splitRegions.length > 0 ? splitRegions : [locationString.trim()];
}
