/**
 * Optimized Firestore query service for regional data
 * Uses direct field queries instead of client-side filtering
 */

import { getFirestoreForSSR } from '@/lib/firebase/server-config'
import * as admin from 'firebase-admin'

function getScadenzaDateRange(scadenza: ScadenzaFilter): { start: Date; end: Date } | null {
  if (!scadenza) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (scadenza) {
    case 'oggi':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // End of today
      }
    case 'questa-settimana': {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
      return {
        start: today,
        end: new Date(endOfWeek.getTime() + 24 * 60 * 60 * 1000 - 1) // End of Sunday
      }
    }
    case 'questo-mese': {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return {
        start: today,
        end: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000 - 1) // End of last day of month
      }
    }
    default:
      return null
  }
}

export type ScadenzaFilter = 'oggi' | 'questa-settimana' | 'questo-mese' | undefined
export type RegimeFilter = 'part-time' | 'tempo-determinato' | 'tempo-indeterminato' | 'non-specificato' | undefined

/**
 * Interface for regional query options mapping to Firestore fields:
 * - regione -> 'regione' field (array)
 * - ente -> 'ente' field
 * - settore -> 'settori' field
 * - scadenza -> 'DataChiusura' field (date range)
 * - regime -> 'regime_impegno' field
 */
export interface RegionalQueryOptions {
  regione?: string[]
  ente?: string
  settore?: string
  Stato?: 'OPEN' | 'CHIUSO' | 'all'
  scadenza?: ScadenzaFilter
  regime?: RegimeFilter
  limit?: number
  startAfterDoc?: admin.firestore.DocumentSnapshot
  orderByField?: 'publication_date' | 'DataChiusura'
  orderDirection?: 'asc' | 'desc'
  indexId?: string // Optional index ID for optimized queries
  searchQuery?: string
  numeroPostiMin?: number
  numeroPostiMax?: number
  areaGeografica?: string
  tags?: string[]
  page?: number
}

export interface RegionalQueryResult {
  concorsi: any[]
  lastDoc?: admin.firestore.DocumentSnapshot
  hasMore: boolean
  totalCount?: number
}

/**
 * Optimized query for regional concorsi using direct Firestore field queries.
 * This is MUCH faster than fetching all docs and filtering client-side.
 * 
 * Field mappings to Firestore:
 * - regione -> 'regione' (array field)
 * - ente -> 'ente' field
 * - settore -> 'settori' field
 * - stato -> 'Stato' field (values: 'OPEN', 'CLOSED')
 * - scadenza -> 'DataChiusura' field (date range)
 * - regime -> 'regime_impegno' field
 */
export const getRegionalConcorsi = async (options: RegionalQueryOptions): Promise<RegionalQueryResult> => {
      const {
    regione,
    ente,
    settore,
    Stato = 'OPEN',
    scadenza,
    regime,
    limit: queryLimit = 20,
    startAfterDoc,
    orderByField = 'publication_date',
    orderDirection = 'desc'
  } = options

  const startTime = performance.now()
  console.log('🔍 Starting optimized regional query:', options)

  try {
    const firestore = await getFirestoreForSSR()
    if (!firestore) {
      throw new Error('Firestore not available')
    }

    let firestoreQuery: admin.firestore.Query = firestore.collection('concorsi')
    let useModernFields = true // Track whether we're using new normalized fields

    // Add region filter using province.regione_nome
    // Note: Firestore doesn't support array-contains with partial object matching,
    // so we need to query for documents where any province in the array has the matching regione_nome
    if (regione && regione.length > 0) {
      console.log('🔍 Filtering by regione using province.regione_nome:', regione)
      
      // For Firestore, we need to use array-contains-any with the full province objects
      // But since we don't know the full province objects, we'll need to do client-side filtering
      // or use a different approach. For now, let's use a compound query approach:
      
      // Fetch all documents and filter client-side for province.regione_nome
      // This is less efficient but necessary given Firestore's limitations with nested array queries
      
      // We'll add the regione parameter to options and handle filtering after the query
      console.log('📋 Note: Province filtering will be done client-side due to Firestore limitations')
      
      // Add field selection for regional queries to improve performance
      firestoreQuery = firestoreQuery.select(
        'Titolo', 'Ente', 'AreaGeografica', 'numero_di_posti', 
        'DataChiusura', 'settore_professionale', 'regime',
        'riassunto', 'publication_date', 'Stato', 'province'
      )
    }

    // Add ente filter (direct field query - FAST!)
    if (ente) {
      firestoreQuery = firestoreQuery.where('Ente', '==', ente)
    }

    // Add settore filter (using 'settori' field - FAST!)
    if (settore) {
      firestoreQuery = firestoreQuery.where('settori', '==', settore)
    }

    // Add status filter (direct field query - FAST!)
    if (Stato !== 'all') {
      // Use the correct Stato field with proper case
      const firestoreStatusValue = Stato === 'OPEN' ? 'OPEN' : 'CHIUSO'
      firestoreQuery = firestoreQuery.where('Stato', '==', firestoreStatusValue)
    }

    // Add scadenza (expiration) filter using 'DataChiusura' field
    if (scadenza) {
      const dateRange = getScadenzaDateRange(scadenza)
      if (dateRange) {
        firestoreQuery = firestoreQuery
          .where('DataChiusura', '>=', dateRange.start)
          .where('DataChiusura', '<=', dateRange.end)
      }
    }

    // Add regime (work arrangement) filter using 'regime_impegno' field
    if (regime) {
      firestoreQuery = firestoreQuery.where('regime_impegno', '==', regime)
    }

    // Add ordering and use index if provided
    if (options.indexId) {
      // When using a specific index, we follow its field order
      firestoreQuery = firestoreQuery
        .orderBy('regione', 'asc')
        .orderBy('Stato', 'asc')
        .orderBy('publication_date', orderDirection)
    } else {
      // Use the optimized index for Stato + publication_date queries
      if (Stato !== 'all' && !regione && !ente && !settore && !scadenza && !regime && orderByField === 'publication_date') {
        // This is the default /bandi page query - use the specific optimized index
        console.log('🚀 Using optimized index for Stato + publication_date query')
        // The index will be automatically used by Firestore when the query matches
      }
      firestoreQuery = firestoreQuery.orderBy(orderByField, orderDirection)
    }

    // Add pagination
    if (startAfterDoc) {
      firestoreQuery = firestoreQuery.startAfter(startAfterDoc)
    }

    // Add limit only if specified
    if (queryLimit) {
      firestoreQuery = firestoreQuery.limit(queryLimit + 1) // +1 to check if there are more
    }

    // Execute the optimized query with error handling for missing indexes
    let snapshot: admin.firestore.QuerySnapshot
    try {
      // Add timeout for query execution to prevent hanging
      const queryPromise = firestoreQuery.get()
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 30 seconds')), 30000)
      )
      
      snapshot = await Promise.race([queryPromise, timeoutPromise])
    } catch (error: any) {
      // Check if it's an index-related error
      if (error?.message?.includes('index') || error?.code === 9) {
        console.warn('⚠️ Index error detected, retrying with legacy fields:', error.message)
        
        // Rebuild query with legacy fields
        let fallbackQuery: admin.firestore.Query = firestore.collection('concorsi')
        
        // Re-apply filters with correct field names
        if (regione && regione.length > 0) {
          if (regione.length === 1) {
            fallbackQuery = fallbackQuery.where('regione', 'array-contains', regione[0].toLowerCase())
          } else {
            fallbackQuery = fallbackQuery.where('regione', 'array-contains-any', regione.map(r => r.toLowerCase()))
          }
        }
        
        if (ente) {
          fallbackQuery = fallbackQuery.where('Ente', '==', ente)
        }
        
        if (settore) {
          fallbackQuery = fallbackQuery.where('settori', '==', settore)
        }
        
        if (Stato !== 'all') {
          const firestoreStatusValue = Stato === 'OPEN' ? 'OPEN' : 'CHIUSO'
          fallbackQuery = fallbackQuery.where('Stato', '==', firestoreStatusValue)
        }
        
        if (scadenza) {
          const dateRange = getScadenzaDateRange(scadenza)
          if (dateRange) {
            fallbackQuery = fallbackQuery
              .where('DataChiusura', '>=', dateRange.start)
              .where('DataChiusura', '<=', dateRange.end)
          }
        }
        
        if (regime) {
          fallbackQuery = fallbackQuery.where('regime_impegno', '==', regime)
        }
        
        fallbackQuery = fallbackQuery.orderBy(orderByField, orderDirection)
        
        if (startAfterDoc) {
          fallbackQuery = fallbackQuery.startAfter(startAfterDoc)
        }
        
        if (queryLimit) {
          fallbackQuery = fallbackQuery.limit(queryLimit + 1)
        }
        
        snapshot = await fallbackQuery.get()
        console.log('🔄 Fallback query executed successfully')
      } else {
        throw error
      }
    }

    let concorsi = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Apply client-side filtering for province.regione_nome if regione filter is specified
    if (regione && regione.length > 0) {
      console.log('🔍 Applying client-side province.regione_nome filtering for:', regione)
      concorsi = concorsi.filter((concorso: any) => {
        if (!concorso.province || !Array.isArray(concorso.province)) {
          return false
        }
        
        // Check if any province in the array has a matching regione_nome
        return concorso.province.some((provincia: any) => 
          provincia && 
          provincia.regione_nome && 
          regione.includes(provincia.regione_nome)
        )
      })
      console.log(`📋 Province filtering: ${concorsi.length} results after filtering`)
    }

    const hasMore = queryLimit ? snapshot.docs.length > queryLimit : false
    const lastDoc = queryLimit && hasMore ? snapshot.docs[queryLimit - 1] : snapshot.docs[snapshot.docs.length - 1]

    const endTime = performance.now()
    console.log(`✅ Regional query completed: ${concorsi.length} docs in ${(endTime - startTime).toFixed(0)}ms`)

    return {
      concorsi,
      lastDoc,
      hasMore
    }

  } catch (error) {
    console.error('❌ Error in regional query:', error)
    throw error
  }
}

/**
 * Get count of concorsi for a region (cached)
 */
export const getRegionalCount = async (regione: string): Promise<number> => {
  try {
    const firestore = await getFirestoreForSSR()
    if (!firestore) {
      throw new Error('Firestore not available')
    }

    const snapshot = await firestore
      .collection('concorsi')
      .where('regione', 'array-contains', regione.toLowerCase())
      .where('Stato', '==', 'OPEN')
      .get()
      
    return snapshot.size

  } catch (error) {
    console.error('❌ Error getting regional count:', error)
    return 0
  }
}

/**
 * Get available enti for a region (cached)
 */
export const getRegionalEnti = async (regione: string): Promise<string[]> => {
  try {
    // Use the same query as the main concorsi query to avoid duplicates
    const result = await getRegionalConcorsi({
      regione: [regione],
      Stato: 'OPEN',
      limit: 300,
      indexId: 'CICAgPig2YMK'
    })

    const entiSet = new Set<string>()
    result.concorsi.forEach(concorso => {
      if (concorso.Ente) {
        entiSet.add(concorso.Ente)
      }
    })

    return Array.from(entiSet).sort()

  } catch (error) {
    console.error('❌ Error getting regional enti:', error)
    return []
  }
}

/**
 * Optimized query for ente-specific concorsi
 */
export const getEnteConcorsi = async (ente: string, limit = 2000): Promise<any[]> => {
  try {
    const result = await getRegionalConcorsi({
      ente,
      limit:2000,
      indexId: 'CICAgNiav4AK',
    })

    return result.concorsi

  } catch (error) {
    console.error('❌ Error getting ente concorsi:', error)
    return []
  }
}

/**
 * Optimized query for the default /bandi page
 * Uses the specific index for (Stato + publication_date)
 * Performance optimizations:
 * 1. Field selection to reduce data transfer
 * 2. Proper index usage
 * 3. Minimal data processing
 */
export const getDefaultBandiPage = async (limit = 25): Promise<RegionalQueryResult> => {
    const startTime = performance.now()
    console.log('🚀 Starting optimized default bandi query with index CICAgLjy8IAK', {
      limit,
      timestamp: new Date().toISOString()
    })

    try {
      const firestore = await getFirestoreForSSR()
      if (!firestore) {
        throw new Error('Firestore not available')
      }

      // Build the query to get latest open concorsi using correct Stato field
      const firestoreQuery = firestore.collection('concorsi')
        .where('Stato', '==', 'OPEN')
        .orderBy('publication_date', 'desc')
        .select(
          'Titolo', 'Ente', 'AreaGeografica', 'numero_di_posti', 
          'DataChiusura', 'settore_professionale', 'regime',
          'riassunto', 'publication_date', 'Stato'
        )
        .limit(limit + 1) // +1 to check if there are more

      // Execute query with timeout
      const queryPromise = firestoreQuery.get()
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Default bandi query timeout after 20 seconds')), 20000)
      )
      
      const snapshot = await Promise.race([queryPromise, timeoutPromise])

      const concorsi = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Debug: log publication dates and status of first few results
      console.log('📅 First 5 concorsi details:', 
        concorsi.slice(0, 5).map((c: any) => ({
          id: c.id,
          title: c.Titolo?.substring(0, 40),
          publication_date: c.publication_date,
          date_type: typeof c.publication_date,
          formatted_date: c.publication_date?.seconds ? 
            new Date(c.publication_date.seconds * 1000).toISOString() : 
            c.publication_date,
          Stato: c.Stato,
          days_ago: c.publication_date?.seconds ? 
            Math.floor((Date.now() - c.publication_date.seconds * 1000) / (1000 * 60 * 60 * 24)) : 
            'unknown'
        }))
      )
      
      const firstDoc = snapshot.docs[0]?.data()
      console.log('🔍 Query used field:', snapshot.empty ? 'none (empty result)' : 
        'Stato (OPEN/CLOSED)')

      const hasMore = snapshot.docs.length > limit
      const lastDoc = hasMore ? snapshot.docs[limit - 1] : snapshot.docs[snapshot.docs.length - 1]

      const endTime = performance.now()
      console.log(`✅ Default bandi query completed: ${concorsi.length} docs in ${(endTime - startTime).toFixed(0)}ms`)


      return {
        concorsi: hasMore ? concorsi.slice(0, -1) : concorsi,
        lastDoc,
        hasMore
      }

    } catch (error) {
      console.error('❌ Error in default bandi query:', error)
      throw error
    }
}

/**
 * Real-time subscription for regional updates (use sparingly)
 */
export function subscribeToRegionalUpdates(
  regione: string,
  callback: (concorsi: any[]) => void,
  limit = 10
) {
  // Implementation for real-time updates
  // This should be used only for critical real-time features
  console.log('🔔 Setting up real-time subscription for:', regione)
  
  // Return unsubscribe function
  return () => {
    console.log('🔇 Unsubscribed from regional updates')
  }
}
