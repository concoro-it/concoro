import { getFirestoreForSSR } from '@/lib/firebase/server-config'
import { slugToLocationDisplay, filterConcorsiByLocation } from '@/lib/utils/region-utils'
import { deduplicateAsyncWithCleanup } from '@/lib/utils/request-deduplication'
import admin from 'firebase-admin'

export interface LocationQueryOptions {
  location: string
  ente?: string
  settore?: string
  Stato?: 'OPEN' | 'CHIUSO' 
  scadenza?: string
  regime?: string
  limit?: number
  startAfterDoc?: admin.firestore.DocumentSnapshot
  orderByField?: 'publication_date' | 'DataChiusura'
  orderDirection?: 'asc' | 'desc'
  indexId?: string
}

export interface LocationQueryResult {
  concorsi: any[]
  location: string
  totalCount?: number
}

/**
 * Internal function that performs the actual location query
 */
const getLocationConcorsiInternal = async (options: LocationQueryOptions): Promise<LocationQueryResult> => {
  const {
    location,
    ente,
    settore,
    Stato = 'OPEN',
    scadenza,
    regime,
    limit: queryLimit = 100,
    startAfterDoc,
    orderByField = 'publication_date',
    orderDirection = 'desc',
    indexId
  } = options

  console.log('🔍 Starting optimized location query:', options)

  try {
    const firestore = await getFirestoreForSSR()
    if (!firestore) {
      throw new Error('Firestore not available')
    }

    let firestoreQuery: admin.firestore.Query = firestore.collection('concorsi')

    // Add field selection for location queries to improve performance
    firestoreQuery = firestoreQuery.select(
      'Titolo', 'Ente', 'AreaGeografica', 'numero_di_posti', 
      'DataChiusura', 'settore_professionale', 'regime',
      'riassunto', 'publication_date', 'Stato', 'province'
    )

    // Add ente filter (direct field query - FAST!)
    if (ente) {
      firestoreQuery = firestoreQuery.where('Ente', '==', ente)
    }

    // Add settore filter (using 'settore_professionale' field - FAST!)
    if (settore) {
      firestoreQuery = firestoreQuery.where('settore_professionale', '==', settore)
    }


    // Add regime filter (direct field query - FAST!)
    if (regime) {
      firestoreQuery = firestoreQuery.where('regime_impegno', '==', regime)
    }

    // Add scadenza filter (date range query - FAST!)
    if (scadenza) {
      const now = new Date()
      let startDate = new Date()
      let endDate = new Date()

      switch (scadenza) {
        case 'oggi':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case 'settimana':
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case 'mese':
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          break
        case 'tre-mesi':
          endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
          break
        default:
          // No date filter
          break
      }

      if (scadenza !== 'default') {
        firestoreQuery = firestoreQuery
          .where('DataChiusura', '>=', admin.firestore.Timestamp.fromDate(startDate))
          .where('DataChiusura', '<=', admin.firestore.Timestamp.fromDate(endDate))
      }
    }

    // Add ordering and pagination
    firestoreQuery = firestoreQuery.orderBy(orderByField, orderDirection)

    if (startAfterDoc) {
      firestoreQuery = firestoreQuery.startAfter(startAfterDoc)
    }

    // Apply limit with buffer for location filtering
    // Use a larger buffer for location filtering since we need to account for filtering
    const queryLimitWithBuffer = Math.min(queryLimit * 3, 1000) // Increased buffer and max limit
    firestoreQuery = firestoreQuery.limit(queryLimitWithBuffer)

    console.log(`📋 Executing Firestore query with limit ${queryLimitWithBuffer}`)
    const startTime = Date.now()
    const snapshot = await firestoreQuery.get()
    const firestoreTime = Date.now() - startTime

    console.log(`📋 Firestore query returned ${snapshot.docs.length} docs in ${firestoreTime}ms`)

    // Convert documents to plain objects and filter by location
    const startFilterTime = Date.now()
    const allConcorsi = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Filter by location using our utility function
    const filteredConcorsi = filterConcorsiByLocation(allConcorsi, location)
    
    // Apply final limit
    const finalConcorsi = filteredConcorsi.slice(0, queryLimit)
    const filterTime = Date.now() - startFilterTime

    console.log(`📋 Client-side location filtering: ${allConcorsi.length} -> ${filteredConcorsi.length} -> ${finalConcorsi.length} in ${filterTime}ms`)
    console.log(`📋 Location slug: "${location}", decoded: "${decodeURIComponent(location)}"`)
    
    // Debug: Show sample AreaGeografica values
    if (allConcorsi.length > 0) {
      const sampleAreas = allConcorsi.slice(0, 5).map((c: any) => c.AreaGeografica).filter(Boolean);
      console.log(`📋 Sample AreaGeografica values:`, sampleAreas);
    }

    // Direct serialization for better performance
    const concorsi = finalConcorsi.map(concorso => ({
      id: String(concorso.id),
      Titolo: String(concorso.Titolo || ''),
      Ente: String(concorso.Ente || ''),
      AreaGeografica: String(concorso.AreaGeografica || ''),
      numero_di_posti: Number(concorso.numero_di_posti) || undefined,
      settore_professionale: String(concorso.settore_professionale || ''),
      regime: String(concorso.regime || ''),
      DataChiusura: concorso.DataChiusura ? (concorso.DataChiusura.seconds ? { seconds: concorso.DataChiusura.seconds, nanoseconds: concorso.DataChiusura.nanoseconds } : concorso.DataChiusura) : null,
      riassunto: String(concorso.riassunto || ''),
      publication_date: concorso.publication_date ? (concorso.publication_date.seconds ? { seconds: concorso.publication_date.seconds, nanoseconds: concorso.publication_date.nanoseconds } : concorso.publication_date) : null
    }))

    const result = {
      location: slugToLocationDisplay(location),
      concorsi,
      totalCount: concorsi.length
    }

    const totalTime = Date.now() - startTime
    console.log(`📋 ✅ Location query complete: ${concorsi.length} concorsi for "${location}" in ${totalTime}ms`)

    return result

  } catch (error) {
    console.error('📋 ❌ Location query failed:', error)
    throw error
  }
}

/**
 * Optimized query for location-based concorsi using AreaGeografica field.
 * Since Firestore doesn't efficiently support partial string matching,
 * we'll fetch a broader set and filter client-side for location matching.
 * 
 * This function includes request deduplication to prevent duplicate queries
 * during React Strict Mode or concurrent requests.
 */
export const getLocationConcorsi = async (options: LocationQueryOptions): Promise<LocationQueryResult> => {
  // Create a unique cache key based on all query parameters
  const cacheKey = `location:${options.location}:${options.ente || 'all'}:${options.settore || 'all'}:${options.Stato || 'OPEN'}:${options.scadenza || 'all'}:${options.regime || 'all'}:${options.limit || 100}:${options.orderByField || 'publication_date'}:${options.orderDirection || 'desc'}`
  
  return deduplicateAsyncWithCleanup(
    cacheKey,
    () => getLocationConcorsiInternal(options),
    2 * 60 * 1000 // 2 minutes cleanup delay for location queries
  )
}

/**
 * Internal function that gets unique enti for a specific location
 */
const getLocationEntiInternal = async (location: string): Promise<string[]> => {
  try {
    const firestore = await getFirestoreForSSR()
    if (!firestore) {
      throw new Error('Firestore not available')
    }

    // Get a broader set of concorsi and filter client-side
    const snapshot = await firestore.collection('concorsi')
      .where('Stato', '==', 'OPEN')
      .select('Ente', 'AreaGeografica')
      .limit(500)
      .get()

    const allConcorsi = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Filter by location
    const locationConcorsi = filterConcorsiByLocation(allConcorsi, location)

    // Extract unique enti
    const enti = Array.from(new Set(
      locationConcorsi
        .map(concorso => concorso.Ente)
        .filter(Boolean)
    )).sort()

    console.log(`📋 Found ${enti.length} unique enti for location "${location}"`)
    return enti

  } catch (error) {
    console.error('📋 ❌ Failed to get location enti:', error)
    return []
  }
}

/**
 * Get unique enti for a specific location with request deduplication
 */
export const getLocationEnti = async (location: string): Promise<string[]> => {
  const cacheKey = `location-enti:${location}`
  
  return deduplicateAsyncWithCleanup(
    cacheKey,
    () => getLocationEntiInternal(location),
    5 * 60 * 1000 // 5 minutes cleanup delay for enti queries (they change less frequently)
  )
}

/**
 * Internal function that gets available locations from concorsi data
 */
const getAvailableLocationsInternal = async (): Promise<string[]> => {
  try {
    const firestore = await getFirestoreForSSR()
    if (!firestore) {
      throw new Error('Firestore not available')
    }

    const snapshot = await firestore.collection('concorsi')
      .where('Stato', '==', 'OPEN')
      .select('AreaGeografica')
      .limit(1000)
      .get()

    const allConcorsi = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Extract unique locations using our utility function
    const { extractUniqueLocations } = await import('@/lib/utils/region-utils')
    const locations = extractUniqueLocations(allConcorsi)

    console.log(`📋 Found ${locations.length} unique locations`)
    return locations

  } catch (error) {
    console.error('📋 ❌ Failed to get available locations:', error)
    return []
  }
}

/**
 * Get available locations from concorsi data with request deduplication
 * This can be used for static generation and validation
 */
export const getAvailableLocations = async (): Promise<string[]> => {
  const cacheKey = 'available-locations:all'
  
  return deduplicateAsyncWithCleanup(
    cacheKey,
    () => getAvailableLocationsInternal(),
    10 * 60 * 1000 // 10 minutes cleanup delay for available locations (they change very infrequently)
  )
}
