/**
 * Common API service for concorsi filtering across all route types
 * Provides a unified interface for all bandi pages (regime, scadenza, ente, regione)
 */

import { getFirestoreForSSR } from '@/lib/firebase/server-config'
import { cache } from 'react'
import * as admin from 'firebase-admin'
import { memoryCache, getCacheKey, withCache } from '@/lib/cache/memory-cache'
import { serializeTimestamp } from '@/lib/utils/serialize-firestore'

// Common types for filtering
export type FilterType = 'regime' | 'scadenza' | 'ente' | 'regione' | 'settore'
export type ScadenzaFilter = 'oggi' | 'questa-settimana' | 'questo-mese' | undefined
export type RegimeFilter = 'part-time' | 'tempo-determinato' | 'tempo-indeterminato' | 'non-specificato' | undefined

export interface CommonFilterOptions {
  filterType: FilterType
  filterValue: string | string[]
  Stato?: 'OPEN' | 'CHIUSO' | 'all'
  limit?: number
  startAfterDoc?: admin.firestore.DocumentSnapshot
  orderByField?: 'publication_date' | 'DataChiusura'
  orderDirection?: 'asc' | 'desc'
  additionalFilters?: {
    regione?: string[]
    ente?: string
    settore?: string
    scadenza?: ScadenzaFilter
    regime?: RegimeFilter
  }
}

export interface CommonQueryResult {
  concorsi: any[]
  lastDoc?: admin.firestore.DocumentSnapshot
  hasMore: boolean
  totalCount: number
  metadata: {
    filterType: FilterType
    filterValue: string | string[]
    displayName: string
    uniqueValues: {
      enti?: string[]
      settori?: string[]
      regimi?: string[]
      regioni?: string[]
    }
  }
}

/**
 * Get scadenza date range helper
 */
function getScadenzaDateRange(scadenza: ScadenzaFilter): { start: Date; end: Date } | null {
  if (!scadenza) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (scadenza) {
    case 'oggi':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    case 'questa-settimana': {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
      return {
        start: today,
        end: new Date(endOfWeek.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    }
    case 'questo-mese': {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return {
        start: today,
        end: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    }
    default:
      return null
  }
}

/**
 * Normalize filter values based on type
 */
function normalizeFilterValue(filterType: FilterType, value: string | string[]): any {
  switch (filterType) {
    case 'regime':
      if (typeof value === 'string') {
        const regimeMap: Record<string, string> = {
          'tempo-determinato': 'tempo-determinato',
          'tempo-indeterminato': 'tempo-indeterminato', 
          'part-time': 'part-time',
          'full-time': 'full-time',
          'non-specificato': 'non-specificato'
        }
        return regimeMap[value.toLowerCase()] || value
      }
      return value

    case 'scadenza':
      if (typeof value === 'string') {
        const scadenzaMap: Record<string, ScadenzaFilter> = {
          'oggi': 'oggi',
          'questa-settimana': 'questa-settimana',
          'questo-mese': 'questo-mese'
        }
        return scadenzaMap[value] || undefined
      }
      return undefined

    case 'regione':
      return Array.isArray(value) ? value.map(v => v.toLowerCase()) : [value.toLowerCase()]

    case 'ente':
    case 'settore':
      return value

    default:
      return value
  }
}

/**
 * Build Firestore query based on filter type and value
 */
function buildQuery(
  firestore: admin.firestore.Firestore,
  options: CommonFilterOptions
): admin.firestore.Query {
  let query: admin.firestore.Query = firestore.collection('concorsi')
  const { filterType, filterValue, Stato = 'OPEN', orderByField = 'publication_date', orderDirection = 'desc' } = options

  // Apply main filter based on type
  const normalizedValue = normalizeFilterValue(filterType, filterValue)

  switch (filterType) {
    case 'regione':
      const regioni = Array.isArray(normalizedValue) ? normalizedValue : [normalizedValue]
      if (regioni.length === 1) {
        query = query.where('regione', 'array-contains', regioni[0])
      } else {
        query = query.where('regione', 'array-contains-any', regioni)
      }
      break

    case 'ente':
      // For ente, skip Firestore filtering and do everything client-side
      // This avoids complex index requirements and handles name variations better
      console.log(`📋 Ente filter: skipping Firestore where clause, will filter client-side`)
      break

    case 'settore':
      query = query.where('settori', '==', normalizedValue)
      break

    case 'regime':
      query = query.where('regime_impegno', '==', normalizedValue)
      break

    case 'scadenza':
      const dateRange = getScadenzaDateRange(normalizedValue as ScadenzaFilter)
      if (dateRange) {
        query = query
          .where('DataChiusura', '>=', dateRange.start)
          .where('DataChiusura', '<=', dateRange.end)
      }
      break
  }

  // Apply additional filters
  if (options.additionalFilters) {
    const { regione, ente, settore, scadenza, regime } = options.additionalFilters

    if (regione && regione.length > 0 && filterType !== 'regione') {
      if (regione.length === 1) {
        query = query.where('regione', 'array-contains', regione[0].toLowerCase())
      } else {
        query = query.where('regione', 'array-contains-any', regione.map(r => r.toLowerCase()))
      }
    }

    if (ente && filterType !== 'ente') {
      query = query.where('Ente', '==', ente)
    }

    if (settore && filterType !== 'settore') {
      query = query.where('settori', '==', settore)
    }

    if (regime && filterType !== 'regime') {
      query = query.where('regime_impegno', '==', regime)
    }

    if (scadenza && filterType !== 'scadenza') {
      const dateRange = getScadenzaDateRange(scadenza)
      if (dateRange) {
        query = query
          .where('DataChiusura', '>=', dateRange.start)
          .where('DataChiusura', '<=', dateRange.end)
      }
    }
  }

  // Apply status filter
  if (Stato !== 'all') {
    const statusValue = Stato === 'OPEN' ? 'OPEN' : 'CHIUSO'
    const firestoreStatusValue = statusValue === 'OPEN' ? 'OPEN' : 'CHIUSO'
    query = query.where('Stato', '==', firestoreStatusValue)
  }

  // Apply ordering
  query = query.orderBy(orderByField, orderDirection)

  return query
}

/**
 * Process and serialize concorsi data with optional client-side filtering
 */
function processAndSerializeConcorsi(docs: admin.firestore.QueryDocumentSnapshot[], filterOptions?: CommonFilterOptions): any[] {
  let processedDocs = docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      concorso_id: String(data.concorso_id || doc.id),
      Titolo: String(data.Titolo || ''),
      Ente: String(data.Ente || ''),
      AreaGeografica: String(data.AreaGeografica || ''),
      numero_di_posti: Number(data.numero_di_posti) || null,
      settore_professionale: String(data.settore_professionale || ''),
      settori: String(data.settori || ''),
      regime: String(data.regime || ''),
      regime_impegno: String(data.regime_impegno || ''),
      DataChiusura: serializeTimestamp(data.DataChiusura),
      riassunto: String(data.riassunto || ''),
      publication_date: serializeTimestamp(data.publication_date),
      stato: String(data.Stato || 'OPEN'),
      regione: Array.isArray(data.regione) ? data.regione : []
    }
  })

  // Apply client-side filtering for ente if needed
  if (filterOptions?.filterType === 'ente' && typeof filterOptions.filterValue === 'string') {
    const searchEnte = filterOptions.filterValue
    processedDocs = processedDocs.filter(doc => {
      const ente = doc.Ente || ''
      
      // Multiple matching strategies
      // 1. Exact match
      if (ente === searchEnte) return true
      
      // 2. Case-insensitive match
      if (ente.toLowerCase() === searchEnte.toLowerCase()) return true
      
      // 3. Slug-based matching (convert ente to slug and compare)
      const enteSlug = ente
        .toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      const searchSlug = searchEnte
        .toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      if (enteSlug === searchSlug) return true
      
      // 4. Partial word matching
      const enteWords = ente.toLowerCase().split(/\s+/)
      const searchWords = searchEnte.toLowerCase().split(/[\s-]+/)
      const matchingWords = searchWords.filter(word => 
        word.length > 2 && enteWords.some(enteWord => enteWord.includes(word))
      )
      
      return matchingWords.length >= Math.max(1, searchWords.length - 1)
    })
  }

  return processedDocs
}

/**
 * Extract unique values for filters
 */
function extractUniqueValues(concorsi: any[], filterType: FilterType) {
  const result: any = {}

  if (filterType !== 'ente') {
    result.enti = Array.from(new Set(
      concorsi.map(c => c.Ente).filter(Boolean)
    )).sort()
  }

  if (filterType !== 'settore') {
    result.settori = Array.from(new Set(
      concorsi.map(c => c.settore_professionale || c.settori).filter(Boolean)
    )).sort()
  }

  if (filterType !== 'regime') {
    result.regimi = Array.from(new Set(
      concorsi.map(c => c.regime_impegno || c.regime).filter(Boolean)
    )).sort()
  }

  if (filterType !== 'regione') {
    const allRegions = new Set<string>()
    concorsi.forEach(c => {
      if (Array.isArray(c.regione)) {
        c.regione.forEach((r: string) => allRegions.add(r))
      }
    })
    result.regioni = Array.from(allRegions).sort()
  }

  return result
}

/**
 * Get display name for filter value
 */
function getDisplayName(filterType: FilterType, filterValue: string | string[]): string {
  switch (filterType) {
    case 'regime':
      if (typeof filterValue === 'string') {
        const displayMap: Record<string, string> = {
          'tempo-determinato': 'Tempo Determinato',
          'tempo-indeterminato': 'Tempo Indeterminato',
          'part-time': 'Part Time',
          'full-time': 'Full Time',
          'non-specificato': 'Non Specificato'
        }
        return displayMap[filterValue] || filterValue
      }
      return String(filterValue)

    case 'scadenza':
      if (typeof filterValue === 'string') {
        const displayMap: Record<string, string> = {
          'oggi': 'Oggi',
          'questa-settimana': 'Questa Settimana',
          'questo-mese': 'Questo Mese'
        }
        return displayMap[filterValue] || filterValue
      }
      return String(filterValue)

    case 'regione':
      return Array.isArray(filterValue) ? filterValue.join(', ') : String(filterValue)

    case 'ente':
    case 'settore':
      return String(filterValue)

    default:
      return String(filterValue)
  }
}

/**
 * Main query function - cached for performance
 */
export const getConcorsiByFilter = cache(async (options: CommonFilterOptions): Promise<CommonQueryResult> => {
  const { filterType, filterValue, limit = 50 } = options
  const cacheKey = getCacheKey(`concorsi-${filterType}`, Array.isArray(filterValue) ? filterValue.join(',') : filterValue, options.Stato || 'open', limit)

  return withCache(cacheKey, async () => {
    const startTime = performance.now()
    console.log(`🔍 Starting ${filterType} query:`, filterValue)

    try {
      const firestore = await getFirestoreForSSR()
      if (!firestore) {
        throw new Error('Firestore not available')
      }

      // Build the query
      let query = buildQuery(firestore, options)

      // Add pagination if specified
      if (options.startAfterDoc) {
        query = query.startAfter(options.startAfterDoc)
      }

      // Add limit - for ente filtering, get more docs since we filter client-side
      if (limit) {
        const effectiveLimit = filterType === 'ente' ? Math.max(limit * 5, 500) : limit + 1
        query = query.limit(effectiveLimit)
      }

      // Execute query with timeout
      const queryPromise = query.get()
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`${filterType} query timeout after 30 seconds`)), 30000)
      )
      
      const snapshot = await Promise.race([queryPromise, timeoutPromise])

      // Process results with filtering options
      const concorsi = processAndSerializeConcorsi(snapshot.docs, options)
      
      // Calculate hasMore - for ente filtering, we need to check differently since we filter client-side
      let hasMore = false
      let lastDoc = null
      
      if (filterType === 'ente') {
        hasMore = concorsi.length > limit
        lastDoc = hasMore ? snapshot.docs[snapshot.docs.length - 1] : null
      } else {
        hasMore = limit ? snapshot.docs.length > limit : false
        lastDoc = hasMore ? snapshot.docs[limit - 1] : snapshot.docs[snapshot.docs.length - 1]
      }

      // Extract unique values for secondary filters
      const uniqueValues = extractUniqueValues(concorsi, filterType)

      // Get display name
      const displayName = getDisplayName(filterType, filterValue)

      const endTime = performance.now()
      console.log(`✅ ${filterType} query completed: ${concorsi.length} docs in ${(endTime - startTime).toFixed(0)}ms`)

      // Prepare final results
      let finalConcorsi = concorsi
      let finalTotalCount = concorsi.length
      
      if (filterType === 'ente') {
        // For ente, slice to the requested limit
        finalConcorsi = concorsi.slice(0, limit)
        finalTotalCount = concorsi.length
      } else {
        // For other types, use the existing logic
        finalConcorsi = hasMore ? concorsi.slice(0, -1) : concorsi
        finalTotalCount = hasMore ? concorsi.length - 1 : concorsi.length
      }

      return {
        concorsi: finalConcorsi,
        lastDoc: lastDoc || undefined,
        hasMore,
        totalCount: finalTotalCount,
        metadata: {
          filterType,
          filterValue,
          displayName,
          uniqueValues
        }
      }

    } catch (error) {
      console.error(`❌ Error in ${filterType} query:`, error)
      throw error
    }
  }, 120) // Cache for 2 minutes
})

/**
 * Get count for a specific filter
 */
export const getFilteredCount = cache(async (filterType: FilterType, filterValue: string | string[]): Promise<number> => {
  try {
    const firestore = await getFirestoreForSSR()
    if (!firestore) {
      throw new Error('Firestore not available')
    }

    const query = buildQuery(firestore, { filterType, filterValue, Stato: 'OPEN' })
    const snapshot = await query.get()
    
    return snapshot.size
  } catch (error) {
    console.error(`❌ Error getting ${filterType} count:`, error)
    return 0
  }
})

/**
 * Convenience functions for specific filter types
 */
export const getConcorsiByRegime = (regime: string, options: Partial<CommonFilterOptions> = {}) =>
  getConcorsiByFilter({ ...options, filterType: 'regime', filterValue: regime })

export const getConcorsiByScadenza = (scadenza: string, options: Partial<CommonFilterOptions> = {}) =>
  getConcorsiByFilter({ ...options, filterType: 'scadenza', filterValue: scadenza })

export const getConcorsiByEnte = (ente: string, options: Partial<CommonFilterOptions> = {}) =>
  getConcorsiByFilter({ ...options, filterType: 'ente', filterValue: ente })

export const getConcorsiByRegione = (regione: string | string[], options: Partial<CommonFilterOptions> = {}) =>
  getConcorsiByFilter({ ...options, filterType: 'regione', filterValue: regione })

export const getConcorsiBySettore = (settore: string, options: Partial<CommonFilterOptions> = {}) =>
  getConcorsiByFilter({ ...options, filterType: 'settore', filterValue: settore })
