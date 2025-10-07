/**
 * Shared utilities for concorsi services
 * Consolidates common functions used across multiple services
 */

/**
 * Helper to preserve date formats - keep original if it's a string or timestamp object
 * Used across: ente-service.ts, common-concorsi-api.ts
 */
export const preserveDateFormat = (value: any) => {
  if (!value) return null;
  
  // If it's already a string (Italian date format), keep it
  if (typeof value === 'string') return value;
  
  // If it's a Firestore timestamp object, normalize it to use 'seconds' and 'nanoseconds'
  if (typeof value === 'object' && ('seconds' in value || '_seconds' in value)) {
    // Normalize to standard format without underscores
    return {
      seconds: value.seconds || value._seconds,
      nanoseconds: value.nanoseconds || value._nanoseconds || 0
    };
  }
  
  return value;
};

/**
 * Helper to serialize any object to plain object
 * Used across: ente-service.ts, common-concorsi-api.ts
 */
export const serializeToPlainObject = (value: any): any => {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(serializeToPlainObject);
  }
  
  if (typeof value === 'object') {
    const plainObject: any = {};
    for (const [key, val] of Object.entries(value)) {
      plainObject[key] = serializeToPlainObject(val);
    }
    return plainObject;
  }
  
  return value;
};

/**
 * Common date serialization for consistent date handling
 * Used across multiple services for date formatting
 */
export const serializeDate = (date: any): string => {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') return date;
    if (typeof date === 'object') {
      if ('seconds' in date) {
        return new Date(date.seconds * 1000).toISOString();
      }
      if ('_seconds' in date) {
        return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) {
        return date.toISOString();
      }
    }
    return '';
  } catch (error) {
    console.error('Error serializing date:', error);
    return '';
  }
};

/**
 * Get scadenza date range helper
 * Used across: regional-queries.ts, common-concorsi-api.ts
 */
export type ScadenzaFilter = 'oggi' | 'questa-settimana' | 'questo-mese' | undefined;

export function getScadenzaDateRange(scadenza: ScadenzaFilter): { start: Date; end: Date } | null {
  if (!scadenza) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (scadenza) {
    case 'oggi':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'questa-settimana': {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
      return {
        start: today,
        end: new Date(endOfWeek.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    case 'questo-mese': {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: today,
        end: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    default:
      return null;
  }
}

/**
 * Common concorso data processing with optional client-side filtering
 * Standardizes the data structure across all services
 */
export function processAndSerializeConcorsi(docs: any[], options?: any): any[] {
  return docs.map(doc => {
    const data = typeof doc.data === 'function' ? doc.data() : doc;
    return {
      id: doc.id || data.id,
      concorso_id: String(data.concorso_id || doc.id || data.id),
      Titolo: String(data.Titolo || ''),
      Ente: String(data.Ente || ''),
      AreaGeografica: String(data.AreaGeografica || ''),
      numero_di_posti: Number(data.numero_di_posti) || null,
      settore_professionale: String(data.settore_professionale || ''),
      settori: String(data.settori || ''),
      regime: String(data.regime || ''),
      regime_impegno: String(data.regime_impegno || ''),
      DataChiusura: preserveDateFormat(data.DataChiusura),
      sommario: String(data.sommario || ''),
      publication_date: preserveDateFormat(data.publication_date),
      stato: String(data.Stato || 'OPEN'),
      regione: Array.isArray(data.regione) ? data.regione : [],
      province: Array.isArray(data.province) ? data.province : []
    };
  });
}

/**
 * Extract unique values for filters from concorsi data
 * Used for generating filter options in dropdowns
 */
export function extractUniqueValues(concorsi: any[], filterType: string) {
  const result: any = {};

  if (filterType !== 'Ente') {
    result.enti = Array.from(new Set(
      concorsi.map(c => c.Ente).filter(Boolean)
    )).sort();
  }

  if (filterType !== 'settore') {
    result.settori = Array.from(new Set(
      concorsi.map(c => c.settore_professionale || c.settori).filter(Boolean)
    )).sort();
  }

  if (filterType !== 'regime') {
    result.regimi = Array.from(new Set(
      concorsi.map(c => c.regime_impegno || c.regime).filter(Boolean)
    )).sort();
  }

  if (filterType !== 'regione') {
    const allRegions = new Set<string>();
    concorsi.forEach(c => {
      if (Array.isArray(c.regione)) {
        c.regione.forEach((r: string) => allRegions.add(r));
      }
    });
    result.regioni = Array.from(allRegions).sort();
  }

  return result;
}

/**
 * Get display name for filter value
 * Provides user-friendly names for filter values
 */
export function getDisplayName(filterType: string, filterValue: string | string[]): string {
  switch (filterType) {
    case 'regime':
      if (typeof filterValue === 'string') {
        const displayMap: Record<string, string> = {
          'tempo-determinato': 'Tempo Determinato',
          'tempo-indeterminato': 'Tempo Indeterminato',
          'part-time': 'Part Time',
          'full-time': 'Full Time',
          'non-specificato': 'Non Specificato'
        };
        return displayMap[filterValue] || filterValue;
      }
      return String(filterValue);

    case 'scadenza':
      if (typeof filterValue === 'string') {
        const displayMap: Record<string, string> = {
          'oggi': 'Oggi',
          'questa-settimana': 'Questa Settimana',
          'questo-mese': 'Questo Mese'
        };
        return displayMap[filterValue] || filterValue;
      }
      return String(filterValue);

    case 'regione':
      return Array.isArray(filterValue) ? filterValue.join(', ') : String(filterValue);

    case 'Ente':
    case 'settore':
      return String(filterValue);

    default:
      return String(filterValue);
  }
}

