// Regime mapping for normalization
const REGIME_MAPPING: Record<string, string> = {
  // Tempo Indeterminato variations (includes both full-time and part-time)
  'tempo indeterminato': 'Tempo Indeterminato',
  'Tempo indeterminato': 'Tempo Indeterminato',
  'tempo indeterminato o determinato': 'Tempo Indeterminato',
  'Tempo indeterminato o determinato': 'Tempo Indeterminato',
  'tempo pieno indeterminato': 'Tempo Indeterminato',
  'Tempo pieno indeterminato': 'Tempo Indeterminato',
  
  // Tempo Determinato variations (includes both full-time and part-time)
  'tempo determinato': 'Tempo Determinato',
  'Tempo determinato': 'Tempo Determinato',
  'tempo determinato e indeterminato': 'Tempo Determinato',
  'Tempo determinato e indeterminato': 'Tempo Determinato',
  'tempo pieno a tempo determinato': 'Tempo Determinato',
  'Tempo pieno a tempo determinato': 'Tempo Determinato',
  'tempo pieno determinato': 'Tempo Determinato',
  'Tempo pieno determinato': 'Tempo Determinato',
  'tempo pieno o parziale e determinato': 'Tempo Determinato',
  'Tempo pieno o parziale e determinato': 'Tempo Determinato',
  
  // Part-time variations (all part-time work grouped together)
  'part-time a tempo determinato': 'Part-time',
  'Part-time a tempo determinato': 'Part-time',
  'part-time a tempo indeterminato': 'Part-time',
  'Part-time a tempo indeterminato': 'Part-time',
  'part-time indeterminato': 'Part-time',
  'Part-time indeterminato': 'Part-time',
  'tempo indeterminato part-time': 'Part-time',
  'Tempo indeterminato part-time': 'Part-time',
  'tempo parziale a tempo indeterminato': 'Part-time',
  'Tempo parziale a tempo indeterminato': 'Part-time',
  'tempo parziale indeterminato': 'Part-time',
  'Tempo parziale indeterminato': 'Part-time',
  
  // Libero professionale variations (merge into Non Specificato)
  'libero professionale': 'Non Specificato',
  'Libero professionale': 'Non Specificato',
  
  // Lavoro autonomo (merge into Non Specificato)
  'lavoro autonomo': 'Non Specificato',
  'Lavoro autonomo': 'Non Specificato',
  
  // Non specificato
  'non specificato': 'Non Specificato',
  'Non specificato': 'Non Specificato',
};

// Standardized regime categories list
export const STANDARD_REGIMES = [
  'Tempo Indeterminato',
  'Tempo Determinato', 
  'Part-time',
  'Non Specificato'
];

/**
 * Normalizes a regime string to a standardized regime category
 * @param regime - The original regime string
 * @returns The normalized regime or "Non Specificato" if no match found
 */
export function normalizeRegime(regime: string | null | undefined): string {
  if (!regime || typeof regime !== 'string') {
    return 'Non Specificato';
  }

  // Trim whitespace
  const trimmedRegime = regime.trim();
  
  // Check for exact match in mapping (case-sensitive)
  if (REGIME_MAPPING[trimmedRegime]) {
    return REGIME_MAPPING[trimmedRegime];
  }
  
  // Check for case-insensitive match
  const lowerRegime = trimmedRegime.toLowerCase();
  for (const [key, value] of Object.entries(REGIME_MAPPING)) {
    if (key.toLowerCase() === lowerRegime) {
      return value;
    }
  }
  
  // If no match found, return "Non Specificato"
  return 'Non Specificato';
}

/**
 * Normalizes multiple regime fields from a concorso object
 * @param concorso - The concorso object with potential regime fields
 * @returns The normalized regime
 */
export function normalizeConcorsoRegime(concorso: any): string {
  // Check various regime field names that might exist, in priority order
  const regimeFields = [
    concorso.regime_impegno,  // Highest priority
    concorso.regime           // Lower priority
  ];
  
  // Find the first non-empty regime field and normalize it
  for (const field of regimeFields) {
    if (field && typeof field === 'string' && field.trim()) {
      return normalizeRegime(field);
    }
  }
  
  return 'Non Specificato';
}

/**
 * Gets all available normalized regimes from a list of concorsi
 * @param concorsi - Array of concorso objects
 * @returns Array of unique normalized regime values
 */
export function getAvailableRegimes(concorsi: any[]): string[] {
  const regimeSet = new Set<string>();
  
  concorsi.forEach(concorso => {
    const normalizedRegime = normalizeConcorsoRegime(concorso);
    regimeSet.add(normalizedRegime);
  });
  
  return Array.from(regimeSet)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Checks if a concorso has part-time regime, regardless of determinato/indeterminato
 * @param concorso - The concorso object with potential regime fields
 * @returns True if the job is part-time in any form
 */
export function isPartTimeRegime(concorso: any): boolean {
  const regimeFields = [
    concorso.regime_impegno,
    concorso.regime
  ];
  
  for (const field of regimeFields) {
    if (field && typeof field === 'string') {
      const lowerField = field.toLowerCase();
      if (lowerField.includes('part-time') || 
          lowerField.includes('tempo parziale') || 
          lowerField.includes('parziale')) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Filters concorsi based on selected regime values, with special handling for Part-time
 * @param concorsi - Array of concorso objects to filter
 * @param selectedRegimes - Array of selected regime filter values
 * @returns Filtered array of concorsi
 */
export function filterByRegime(concorsi: any[], selectedRegimes: string[]): any[] {
  if (selectedRegimes.length === 0) {
    return concorsi;
  }
  
  return concorsi.filter(concorso => {
    // If Part-time is selected, check for any part-time indicators
    if (selectedRegimes.includes('Part-time') && isPartTimeRegime(concorso)) {
      return true;
    }
    
    // For other regime types, use normalized matching
    const normalizedRegime = normalizeConcorsoRegime(concorso);
    return selectedRegimes.some(selected => {
      // Don't double-count part-time jobs for other categories
      if (selected !== 'Part-time' && isPartTimeRegime(concorso)) {
        return false;
      }
      return selected === normalizedRegime;
    });
  });
} 