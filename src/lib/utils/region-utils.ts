// Italian regions list for validation and extraction
const ITALIAN_REGIONS = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia Romagna',
  'Friuli Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino Alto Adige',
  'Umbria',
  'Valle d\'Aosta',
  'Veneto'
];

/**
 * Extracts region names from a località string
 * Handles various formats:
 * - Single region: "Calabria"
 * - Region + city: "Lombardia, Milano"
 * - Multiple regions: "Emilia Romagna, Umbria, Piemonte, Veneto, Lombardia, Sardegna"
 * - Messy combinations: "Lombardia, Milano, Lombardia"
 */
export function extractRegionsFromLocalita(localita: string): string[] {
  if (!localita || typeof localita !== 'string') {
    return [];
  }

  // Split by comma and clean up each part
  const parts = localita.split(',').map(part => part.trim());
  const regions = new Set<string>();

  for (const part of parts) {
    // Check if this part matches any Italian region (case-insensitive)
    const matchedRegion = ITALIAN_REGIONS.find(region => 
      region.toLowerCase() === part.toLowerCase()
    );
    
    if (matchedRegion) {
      // Use the properly capitalized version from our list
      regions.add(matchedRegion);
    }
  }

  return Array.from(regions).sort();
}

/**
 * Extracts all unique regions from an array of località strings
 */
export function extractAllRegions(localitaArray: string[]): string[] {
  const allRegions = new Set<string>();
  
  for (const localita of localitaArray) {
    const regions = extractRegionsFromLocalita(localita);
    regions.forEach(region => allRegions.add(region));
  }
  
  return Array.from(allRegions).sort();
}

/**
 * Checks if a località string contains any of the specified regions
 */
export function localitaContainsRegions(localita: string, targetRegions: string[]): boolean {
  if (!localita || !targetRegions.length) {
    return false;
  }
  
  const regions = extractRegionsFromLocalita(localita);
  return targetRegions.some(targetRegion => 
    regions.some(region => region.toLowerCase() === targetRegion.toLowerCase())
  );
}

/**
 * Gets the list of all Italian regions
 */
export function getItalianRegions(): string[] {
  return [...ITALIAN_REGIONS].sort();
}

/**
 * Formats a località string according to specific display rules:
 * - If more than one region, display "Friuli Venezia Giulia e altri 15"
 * - If "Regione + City", e.g. "Sicilia, Catania", display "Catania, Sicilia"
 * - If two regions, e.g. "Lazio, Abruzzo", display "Lazio e un altro"
 */
export function formatLocalitaDisplay(localita: string): string {
  if (!localita || typeof localita !== 'string') {
    return '';
  }

  // Split by comma and clean up each part
  const parts = localita.split(',').map(part => part.trim());
  const regions: string[] = [];
  const cities: string[] = [];

  // Separate regions from cities
  for (const part of parts) {
    const matchedRegion = ITALIAN_REGIONS.find(region => 
      region.toLowerCase() === part.toLowerCase()
    );
    
    if (matchedRegion) {
      if (!regions.includes(matchedRegion)) {
        regions.push(matchedRegion);
      }
    } else {
      // Assume it's a city if it's not a region
      if (!cities.includes(part)) {
        cities.push(part);
      }
    }
  }

  // If we have cities and exactly one region, format as "City, Region"
  if (cities.length > 0 && regions.length === 1) {
    return `${cities[0]}, ${regions[0]}`;
  }

  // If we have exactly two regions, format as "Region e un altro"
  if (regions.length === 2) {
    return `${regions[0]} e un altro`;
  }

  // If we have more than two regions, format as "Region e altri X"
  if (regions.length > 2) {
    const otherCount = regions.length - 1;
    return `${regions[0]} e altri ${otherCount}`;
  }

  // If we have only one region, return it as is
  if (regions.length === 1) {
    return regions[0];
  }

  // Fallback: return the original string
  return localita;
}

/**
 * Extracts unique locations from AreaGeografica field
 * Returns normalized location strings suitable for URL slugs
 */
export function extractUniqueLocations(concorsi: any[]): string[] {
  const locations = new Set<string>();
  
  concorsi.forEach(concorso => {
    if (concorso.AreaGeografica) {
      const normalizedLocation = normalizeLocationForSlug(concorso.AreaGeografica);
      if (normalizedLocation) {
        locations.add(normalizedLocation);
      }
    }
  });
  
  return Array.from(locations).sort();
}

/**
 * Normalizes a location string for use in URL slugs
 * Handles regions, cities, and combined formats
 */
export function normalizeLocationForSlug(areaGeografica: string): string | null {
  if (!areaGeografica || typeof areaGeografica !== 'string') {
    return null;
  }

  // Clean up the string
  let cleaned = areaGeografica.trim()
    .replace(/\([^)]*\)/g, '') // Remove parentheses content
    .replace(/[^\w\s,.-]/g, '') // Remove special characters except comma, period, dash
    .trim();

  if (!cleaned) return null;

  // Split by comma and take the most significant part
  const parts = cleaned.split(',').map(part => part.trim()).filter(Boolean);
  
  if (parts.length === 0) return null;

  // If it's a single part, use it directly
  if (parts.length === 1) {
    return parts[0].toLowerCase().replace(/\s+/g, '-');
  }

  // For multiple parts, prioritize regions first, then cities
  for (const part of parts) {
    const matchedRegion = ITALIAN_REGIONS.find(region => 
      region.toLowerCase() === part.toLowerCase()
    );
    
    if (matchedRegion) {
      return matchedRegion.toLowerCase().replace(/\s+/g, '-');
    }
  }

  // If no region found, use the first significant part
  return parts[0].toLowerCase().replace(/\s+/g, '-');
}

/**
 * Converts a location slug back to display format
 */
export function slugToLocationDisplay(slug: string): string {
  if (!slug) return '';
  
  // Convert slug back to readable format
  const readable = slug.replace(/-/g, ' ');
  
  // Check if it matches a region
  const matchedRegion = ITALIAN_REGIONS.find(region => 
    region.toLowerCase() === readable.toLowerCase()
  );
  
  if (matchedRegion) {
    return matchedRegion;
  }
  
  // Otherwise, return capitalized version
  return readable.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Checks if a location slug is valid (exists in our location data)
 */
export function isValidLocationSlug(slug: string, availableLocations: string[]): boolean {
  return availableLocations.includes(slug);
}

/**
 * Filters concorsi by location based on AreaGeografica field
 */
export function filterConcorsiByLocation(concorsi: any[], locationSlug: string): any[] {
  // Decode URL-encoded slug if needed
  const decodedSlug = decodeURIComponent(locationSlug);
  const locationDisplay = slugToLocationDisplay(decodedSlug);
  
  console.log(`🔍 Filtering ${concorsi.length} concorsi for location: "${locationSlug}" (decoded: "${decodedSlug}", display: "${locationDisplay}")`);
  
  const filtered = concorsi.filter(concorso => {
    if (!concorso.AreaGeografica) return false;
    
    const normalizedLocation = normalizeLocationForSlug(concorso.AreaGeografica);
    
    // Check exact match with both encoded and decoded slugs
    if (normalizedLocation === locationSlug || normalizedLocation === decodedSlug) {
      console.log(`✅ Exact match found: "${concorso.AreaGeografica}" -> "${normalizedLocation}"`);
      return true;
    }
    
    // Check if the location display name is contained in AreaGeografica
    if (concorso.AreaGeografica.toLowerCase().includes(locationDisplay.toLowerCase())) {
      console.log(`✅ Contains match found: "${concorso.AreaGeografica}" contains "${locationDisplay}"`);
      return true;
    }
    
    // For combined locations like "Veneto, Treviso", check if any part matches
    if (decodedSlug.includes(',')) {
      const parts = decodedSlug.split(',').map(part => part.trim().toLowerCase());
      const hasMatch = parts.some(part => 
        concorso.AreaGeografica.toLowerCase().includes(part)
      );
      if (hasMatch) {
        console.log(`✅ Part match found: "${concorso.AreaGeografica}" contains one of [${parts.join(', ')}]`);
      }
      return hasMatch;
    }
    
    return false;
  });
  
  console.log(`🔍 Filtered ${concorsi.length} -> ${filtered.length} concorsi`);
  return filtered;
} 