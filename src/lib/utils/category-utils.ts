// Category mapping for normalization
const CATEGORY_MAPPING: Record<string, string> = {
  // Amministrativo variations
  'amministrativo': 'Amministrativo',
  'Amministrativa': 'Amministrativo',
  'Amministrativo contabile': 'Amministrativo',
  'Amministrativo/Contabile': 'Amministrativo',
  'Amministrativo-Contabile': 'Amministrativo',
  
  // Tecnico variations
  'tecnico': 'Tecnico',
  'Tecnico': 'Tecnico',
  
  // Informatico variations
  'tecnico-informatico': 'Informatico',
  'Tecnico Informatico': 'Informatico',
  'Tecnico-Informatico': 'Informatico',
  
  // Insegnamento/Docenza variations
  'Docente': 'Insegnamento/Docenza',
  'docente': 'Insegnamento/Docenza',
  'docenza': 'Insegnamento/Docenza',
  
  // Socio-Sanitario variations
  'Socio Sanitario': 'Socio-Sanitario',
  'Socio-sanitario': 'Socio-Sanitario',
  
  // Assistenziale/Educativo variations
  'Animazione esperta per bambini e adulti': 'Assistenziale/Educativo',
  'Servizi Educativi Scuola dell\'Infanzia': 'Assistenziale/Educativo',
  'Educativo': 'Assistenziale/Educativo',
  
  // Polizia Locale/Vigilanza variations
  'Polizia Locale': 'Polizia Locale/Vigilanza',
  'Vigilanza': 'Polizia Locale/Vigilanza',
  
  // Dirigenziale
  'Dirigenziale': 'Dirigenziale',
  
  // Ricerca variations
  'Ricerca scientifica': 'Ricerca',
  'Supporto tecnico e amministrativo alle attività di ricerca': 'Ricerca',
  
  // Comunicazione/Marketing variations
  'Comunicazione Istituzionale': 'Comunicazione/Marketing',
  
  // Servizi Generali variations
  'Bibliotecario': 'Servizi Generali',
  'Centralinista': 'Servizi Generali',
  
  // Contabile variations
  'Contabile': 'Contabile',
  'contabile': 'Contabile',
  
  // Altro variations
  'Prestazione d\'opera intellettuale': 'Altro',
};

// Standardized categories list
export const STANDARD_CATEGORIES = [
  'Amministrativo',
  'Tecnico',
  'Informatico',
  'Insegnamento/Docenza',
  'Socio-Sanitario',
  'Assistenziale/Educativo',
  'Polizia Locale/Vigilanza',
  'Dirigenziale',
  'Ricerca',
  'Comunicazione/Marketing',
  'Servizi Generali',
  'Contabile',
  'Altro'
];

/**
 * Normalizes a category string to a standardized category
 * @param category - The original category string
 * @returns The normalized category or "Altro" if no match found
 */
export function normalizeCategory(category: string | null | undefined): string {
  if (!category || typeof category !== 'string') {
    return 'Altro';
  }

  // Trim whitespace
  const trimmedCategory = category.trim();
  
  // Check for exact match in mapping (case-sensitive)
  if (CATEGORY_MAPPING[trimmedCategory]) {
    return CATEGORY_MAPPING[trimmedCategory];
  }
  
  // Check for case-insensitive match
  const lowerCategory = trimmedCategory.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
    if (key.toLowerCase() === lowerCategory) {
      return value;
    }
  }
  
  // If no match found, return "Altro"
  return 'Altro';
}

/**
 * Normalizes multiple category fields from a concorso object
 * @param concorso - The concorso object with potential category fields
 * @returns The normalized category
 */
export function normalizeConcorsoCategory(concorso: any): string {
  // Check various category field names that might exist, in priority order
  const categoryFields = [
    concorso.ambito_lavorativo,  // Highest priority
    concorso.categoria,
    concorso.tipologia,
    concorso.area_categoria      // Lowest priority
  ];
  
  // Find the first non-empty category field and normalize it
  for (const field of categoryFields) {
    if (field && typeof field === 'string' && field.trim()) {
      return normalizeCategory(field);
    }
  }
  
  return 'Altro';
}

/**
 * Gets the list of all standard categories
 */
export function getStandardCategories(): string[] {
  return [...STANDARD_CATEGORIES];
}

/**
 * Checks if a category is a standard category
 */
export function isStandardCategory(category: string): boolean {
  return STANDARD_CATEGORIES.includes(category);
} 