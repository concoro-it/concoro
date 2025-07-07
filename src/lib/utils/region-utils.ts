// Italian regions list for validation and extraction
const ITALIAN_REGIONS = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Emilia Romagna',
  'Friuli-Venezia Giulia',
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