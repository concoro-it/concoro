import { getFirestoreForSSR } from '@/lib/firebase/server-config'
import { cache } from 'react'
import * as admin from 'firebase-admin'
import { ConcorsiQueryOptions, ConcorsiQueryResult } from '@/types/query-options'
import { getScadenzaDateRange } from '@/lib/utils/date-utils'
import { normalizeConcorsoRegime } from '@/lib/utils/regime-utils'

/**
 * Base query builder for concorsi
 * Handles common query construction and execution
 */
async function buildBaseQuery(
  options: ConcorsiQueryOptions,
  firestore: admin.firestore.Firestore
): Promise<admin.firestore.Query> {
  let query: admin.firestore.Query = firestore.collection('concorsi')

  // Status filter (default to open)
  if (options.stato !== 'all') {
    const statusValue = options.stato === 'open' ? 'OPEN' : 'CHIUSO'
    query = query.where('Stato', '==', statusValue)
  }

  // Add ordering
  const orderField = options.orderByField || 'publication_date'
  const orderDir = options.orderDirection || 'desc'
  query = query.orderBy(orderField, orderDir)

  return query
}

/**
 * Execute query with pagination and return formatted results
 */
async function executeQuery(
  query: admin.firestore.Query,
  options: ConcorsiQueryOptions
): Promise<ConcorsiQueryResult> {
  const limit = options.limit || 25
  
  // Add pagination
  if (options.startAfterDoc) {
    query = query.startAfter(options.startAfterDoc)
  }
  query = query.limit(limit + 1)

  const snapshot = await query.get()
  const hasMore = snapshot.docs.length > limit
  const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs

  return {
    concorsi: docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })),
    hasMore,
    lastDoc: docs[docs.length - 1],
    totalCount: docs.length
  }
}

/**
 * Get concorsi by settore (professional sector)
 */
export const getSettoreConcorsi = cache(async (
  settore: string,
  options: Partial<ConcorsiQueryOptions> = {}
): Promise<ConcorsiQueryResult> => {
  const firestore = await getFirestoreForSSR()
  if (!firestore) throw new Error('Firestore not available')

  let query = await buildBaseQuery({ ...options, stato: 'open' }, firestore)
  query = query.where('settore_professionale', '==', settore)

  return executeQuery(query, options)
})

/**
 * Get concorsi by regime (work arrangement)
 */
export const getRegimeConcorsi = cache(async (
  regime: string,
  options: Partial<ConcorsiQueryOptions> = {}
): Promise<ConcorsiQueryResult> => {
  const firestore = await getFirestoreForSSR()
  if (!firestore) throw new Error('Firestore not available')

  const normalizedRegime = normalizeConcorsoRegime(regime)
  let query = await buildBaseQuery({ ...options, stato: 'open' }, firestore)
  query = query.where('regime_impegno', '==', normalizedRegime)

  return executeQuery(query, options)
})

/**
 * Get concorsi by scadenza (deadline)
 */
export const getScadenzaConcorsi = cache(async (
  scadenza: string,
  options: Partial<ConcorsiQueryOptions> = {}
): Promise<ConcorsiQueryResult> => {
  const firestore = await getFirestoreForSSR()
  if (!firestore) throw new Error('Firestore not available')

  const dateRange = getScadenzaDateRange(scadenza as any)
  if (!dateRange) throw new Error('Invalid scadenza filter')

  let query = await buildBaseQuery({ ...options, stato: 'open' }, firestore)
  query = query
    .where('DataChiusura', '>=', dateRange.start)
    .where('DataChiusura', '<=', dateRange.end)
    .orderBy('DataChiusura', 'asc') // Override default ordering for deadline queries

  return executeQuery(query, options)
})

/**
 * Get concorsi by text search
 */
export const searchConcorsi = cache(async (
  searchQuery: string,
  options: Partial<ConcorsiQueryOptions> = {}
): Promise<ConcorsiQueryResult> => {
  const firestore = await getFirestoreForSSR()
  if (!firestore) throw new Error('Firestore not available')

  let query = await buildBaseQuery({ ...options, stato: 'open' }, firestore)
  
  // Convert search query to lowercase for case-insensitive search
  const searchLower = searchQuery.toLowerCase()
  
  // Use compound queries for text search
  query = query.where('search_terms', 'array-contains', searchLower)

  return executeQuery(query, options)
})

/**
 * Get concorsi with multiple filters
 */
export const getFilteredConcorsi = cache(async (
  options: ConcorsiQueryOptions
): Promise<ConcorsiQueryResult> => {
  const firestore = await getFirestoreForSSR()
  if (!firestore) throw new Error('Firestore not available')

  let query = await buildBaseQuery(options, firestore)

  // Apply filters in order of selectivity
  if (options.ente) {
    query = query.where('Ente', '==', options.ente)
  }

  if (options.settore) {
    query = query.where('settore_professionale', '==', options.settore)
  }

  if (options.regime) {
    query = query.where('regime_impegno', '==', normalizeConcorsoRegime(options.regime))
  }

  if (options.regione && options.regione.length === 1) {
    query = query.where('province.regione_nome', '==', options.regione[0])
  } else if (options.regione && options.regione.length > 1) {
    query = query.where('province.regione_nome', 'in', options.regione)
  }

  if (options.scadenza) {
    const dateRange = getScadenzaDateRange(options.scadenza)
    if (dateRange) {
      query = query
        .where('DataChiusura', '>=', dateRange.start)
        .where('DataChiusura', '<=', dateRange.end)
    }
  }

  if (options.numeroPostiMin !== undefined) {
    query = query.where('numero_di_posti', '>=', options.numeroPostiMin)
  }

  if (options.numeroPostiMax !== undefined) {
    query = query.where('numero_di_posti', '<=', options.numeroPostiMax)
  }

  return executeQuery(query, options)
})

/**
 * Get available filter options (for dropdowns/selects)
 */
export const getFilterOptions = cache(async (
  filter: 'settori' | 'regimi' | 'enti' | 'regioni',
  options: Partial<ConcorsiQueryOptions> = {}
): Promise<string[]> => {
  const firestore = await getFirestoreForSSR()
  if (!firestore) throw new Error('Firestore not available')

  let query = await buildBaseQuery({ ...options, stato: 'open' }, firestore)
  const snapshot = await query.limit(300).get()

  const uniqueValues = new Set<string>()
  snapshot.docs.forEach(doc => {
    const data = doc.data()
    switch (filter) {
      case 'settori':
        if (data.settore_professionale) uniqueValues.add(data.settore_professionale)
        break
      case 'regimi':
        if (data.regime_impegno) uniqueValues.add(data.regime_impegno)
        break
      case 'enti':
        if (data.Ente) uniqueValues.add(data.Ente)
        break
      case 'regioni':
        if (data.regione) data.regione.forEach((r: string) => uniqueValues.add(r))
        break
    }
  })

  return Array.from(uniqueValues).sort()
})
