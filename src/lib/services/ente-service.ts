/**
 * Simple, clean ente service using Firebase index
 * Replaces multiple complex service calls with a single optimized query
 */

import { getFirestoreForSSR } from '@/lib/firebase/server-config'
import { cache } from 'react'

// Helper to preserve date formats - keep original if it's a string or timestamp object
const preserveDateFormat = (value: any) => {
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

// Helper to serialize any object to plain object
const serializeToPlainObject = (value: any): any => {
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

export interface EnteData {
  ente: string
  concorsi: any[]
  totalCount: number
  locations: string[]
  settori: string[]
  regimes: string[]
}

/**
 * Get ente data using optimized Firebase index
 * Uses the composite index: Ente + Stato + publication_date
 */
export const getEnteData = cache(async (enteName: string): Promise<EnteData | null> => {
  const firestore = await getFirestoreForSSR()
  if (!firestore) {
    throw new Error('Firestore not available')
  }

  // Use the optimized Firebase index: Ente + Stato
  const snapshot = await firestore.collection('concorsi')
    .where('Ente', '==', enteName)
    .where('Stato', '==', 'OPEN')
    .limit(500)
    .get()

  if (snapshot.empty) {
    return null
  }

  const concorsi = snapshot.docs.map(doc => {
    const data = doc.data()
    const concorso = {
      id: doc.id,
      Titolo: data.Titolo || '',
      Ente: data.Ente || '',
      AreaGeografica: data.AreaGeografica || '',
      numero_di_posti: data.numero_di_posti || null,
      settore_professionale: data.settore_professionale || '',
      regime: data.regime || '',
      DataChiusura: preserveDateFormat(data.DataChiusura),
      riassunto: data.riassunto || '',
      publication_date: preserveDateFormat(data.publication_date),
      province: data.province || []
    }
    
    // Ensure all objects are plain objects (no classes)
    return serializeToPlainObject(concorso)
  })

  // Sort by publication_date descending (client-side)
  concorsi.sort((a, b) => {
    const dateA = a.publication_date?.seconds || 0
    const dateB = b.publication_date?.seconds || 0
    return dateB - dateA
  })

  // Extract metadata efficiently
  const locations = new Set<string>()
  const settori = new Set<string>()
  const regimes = new Set<string>()
  
  concorsi.forEach(concorso => {
    if (concorso.AreaGeografica?.trim()) {
      locations.add(concorso.AreaGeografica.trim())
    }
    if (concorso.settore_professionale?.trim()) {
      settori.add(concorso.settore_professionale.trim())
    }
    if (concorso.regime?.trim()) {
      regimes.add(concorso.regime.trim())
    }
  })

  return {
    ente: enteName,
    concorsi,
    totalCount: concorsi.length,
    locations: Array.from(locations).sort(),
    settori: Array.from(settori).sort(),
    regimes: Array.from(regimes).sort()
  }
})

/**
 * Get list of available enti for static generation
 */
export const getAvailableEnti = cache(async (limit: number = 50): Promise<string[]> => {
  const firestore = await getFirestoreForSSR()
  if (!firestore) {
    return []
  }

  // Simple query to get unique enti
  const snapshot = await firestore.collection('concorsi')
    .where('Stato', '==', 'OPEN')
    .select('Ente')
    .limit(2000) // Get enough docs to find unique enti
    .get()

  const entiSet = new Set<string>()
  snapshot.docs.forEach(doc => {
    const ente = doc.data().Ente
    if (ente && entiSet.size < limit) {
      entiSet.add(ente)
    }
  })
  
  return Array.from(entiSet)
})
