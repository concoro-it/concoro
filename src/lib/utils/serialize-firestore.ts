import { Timestamp } from 'firebase/firestore';
import { Concorso } from '@/types/concorso';

export function serializeTimestamp(timestamp: Timestamp | { seconds: number; nanoseconds: number } | string | undefined | null): string {
  if (!timestamp) return '';

  try {
    if (typeof timestamp === 'string') {
      return timestamp;
    }

    if (typeof timestamp === 'object' && timestamp !== null) {
      if ('seconds' in timestamp) {
        return new Date(timestamp.seconds * 1000).toISOString();
      }
      if ('_seconds' in timestamp) {
        return new Date((timestamp as any)._seconds * 1000).toISOString();
      }
      if (Object.prototype.toString.call(timestamp) === '[object Date]') {
        return (timestamp as Date).toISOString();
      }
    }

    return '';
  } catch (error) {
    console.error('Error serializing timestamp:', error);
    return '';
  }
}

export function serializeConcorso(concorso: Concorso | null): Concorso {
  if (!concorso) return {} as Concorso;

  // Helper to preserve date formats - keep original if it's a string or timestamp object
  const preserveDateFormat = (value: any) => {
    if (!value) return undefined;
    
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

  // Helper to handle arrays that might contain strings
  const handleArrayField = (value: any): string[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') return [value];
    return undefined;
  };

  // Convert to plain object but preserve date formats
  const plainObject = JSON.parse(JSON.stringify(concorso, (key, value) => {
    if (value === null || value === undefined) return undefined;
    
    // Preserve date fields in their original format
    if (['DataChiusura', 'DataApertura', 'publication_date', 'createdAt', 'updatedAt'].includes(key)) {
      return preserveDateFormat(value);
    }
    
    return value;
  }));

  // Return with proper types, preserving date formats
  return {
    id: String(plainObject.id || ''),
    concorso_id: plainObject.concorso_id || undefined,
    Titolo: plainObject.Titolo || undefined,
    titolo_originale: plainObject.titolo_originale || undefined,
    Ente: plainObject.Ente || undefined,
    AreaGeografica: plainObject.AreaGeografica || undefined,
    numero_di_posti: plainObject.numero_di_posti ? Number(plainObject.numero_di_posti) : undefined,
    
    // Preserve date formats
    DataApertura: preserveDateFormat(plainObject.DataApertura),
    DataChiusura: preserveDateFormat(plainObject.DataChiusura),
    publication_date: preserveDateFormat(plainObject.publication_date),
    createdAt: preserveDateFormat(plainObject.createdAt),
    updatedAt: preserveDateFormat(plainObject.updatedAt),
    
    Stato: plainObject.Stato || undefined,
    categoria: plainObject.categoria || undefined,
    settore_professionale: plainObject.settore_professionale || undefined,
    regime: plainObject.regime || undefined,
    regime_impegno: plainObject.regime_impegno || undefined,
    sommario: plainObject.sommario || undefined,
    Descrizione: plainObject.Descrizione || undefined,
    Link: plainObject.Link || undefined,
    apply_link: plainObject.apply_link || undefined,
    
    // Handle array fields
    pdf_links: handleArrayField(plainObject.pdf_links),
    capacita_richieste: plainObject.capacita_richieste ? 
      (Array.isArray(plainObject.capacita_richieste) ? plainObject.capacita_richieste : [String(plainObject.capacita_richieste)]) : undefined,
    conoscenze_tecnico_specialistiche: plainObject.conoscenze_tecnico_specialistiche ? 
      (Array.isArray(plainObject.conoscenze_tecnico_specialistiche) ? plainObject.conoscenze_tecnico_specialistiche : [String(plainObject.conoscenze_tecnico_specialistiche)]) : undefined,
    programma_di_esame: plainObject.programma_di_esame ? 
      (Array.isArray(plainObject.programma_di_esame) ? plainObject.programma_di_esame : [String(plainObject.programma_di_esame)]) : undefined,
    requisiti_generali: plainObject.requisiti_generali ? 
      (Array.isArray(plainObject.requisiti_generali) ? plainObject.requisiti_generali : [String(plainObject.requisiti_generali)]) : undefined,
    
    // Other string fields
    ambito_lavorativo: plainObject.ambito_lavorativo || undefined,
    collocazione_organizzativa: plainObject.collocazione_organizzativa || undefined,
    contatti: plainObject.contatti || undefined,
    pa_link: plainObject.pa_link || undefined,
    settore: plainObject.settore || undefined,
    tipologia: plainObject.tipologia || undefined,
    Valutazione: plainObject.Valutazione || undefined,
    area_categoria: plainObject.area_categoria || undefined,
    titolo_breve: plainObject.titolo_breve || undefined,
  };
}

export function serializeFirestoreData(value: any): any {
  if (!value) return '';
  
  try {
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if ('seconds' in value) {
        return new Date(value.seconds * 1000).toISOString();
      }
      if ('_seconds' in value) {
        return new Date(value._seconds * 1000).toISOString();
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
    }
    return String(value);
  } catch (error) {
    console.error('Error serializing Firestore data:', error);
    return '';
  }
}