/**
 * Smart Ente Service - Uses cached regional data when available
 * This avoids unnecessary Firebase queries when navigating from region to ente pages
 */

import { getConcorsiByEnte } from './common-concorsi-api'
import { getRegionalConcorsi } from './regional-queries'
import { extractRegionsFromLocalita } from '@/lib/utils/region-utils'
import { normalizeEnteForSlug } from '@/lib/utils/bando-slug-utils'
import { getFirestoreForSSR } from '@/lib/firebase/server-config'

interface SmartEnteResult {
  ente: string
  concorsi: any[]
  totalCount: number
  regions: string[]
  settori: string[]
  source: 'cached' | 'direct' | 'fallback'
}

// CACHING DISABLED for always fresh data
// const enteCache = new Map<string, { result: SmartEnteResult | null; timestamp: number }>()
// const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
// const MAX_CACHE_SIZE = 100

// Request tracking to prevent multiple concurrent requests for the same ente
const ongoingRequests = new Map<string, Promise<SmartEnteResult | null>>()

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now()
  const toDelete: string[] = []
  
  enteCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_DURATION) {
      toDelete.push(key)
    }
  })
  
  toDelete.forEach(key => enteCache.delete(key))
  
  // Limit cache size
  if (enteCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(enteCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE)
    toRemove.forEach(([key]) => enteCache.delete(key))
  }
}

/**
 * Get ente data using smart caching strategy
 * 1. First check cache for existing result
 * 2. Prevent concurrent requests for same ente
 * 3. Use regional data if available
 * 4. Fall back to direct query with optimizations
 */
export async function getSmartEnteData(enteSlug: string, referrerRegion?: string): Promise<SmartEnteResult | null> {
  console.log(`📋 Smart ente search for slug: "${enteSlug}", referrer region: "${referrerRegion}"`)
  
  // Validate input
  if (!enteSlug || enteSlug.length < 2) {
    console.log(`📋 Invalid ente slug: "${enteSlug}"`)
    return null
  }

  // CACHING DISABLED - always fetch fresh data
  // cleanupCache()

  // Create cache key (for request deduplication only)
  const cacheKey = `${enteSlug}-${referrerRegion || 'none'}`

  // NO CACHE CHECK - always get fresh data
  // const cached = enteCache.get(cacheKey)
  // if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
  //   console.log(`📋 💾 Cache hit for ente: ${enteSlug}`)
  //   return cached.result
  // }

  // Check if there's already an ongoing request for this ente
  const ongoingRequest = ongoingRequests.get(cacheKey)
  if (ongoingRequest) {
    console.log(`📋 ⏳ Waiting for ongoing request for ente: ${enteSlug}`)
    return await ongoingRequest
  }

  // Create new request and track it
  const requestPromise = getEnteDataInternal(enteSlug, referrerRegion)
  ongoingRequests.set(cacheKey, requestPromise)

  try {
    const result = await requestPromise
    
    // NO CACHING - always return fresh result
    // enteCache.set(cacheKey, {
    //   result,
    //   timestamp: Date.now()
    // })
    
    console.log(`📋 ✅ Fresh result for ente: ${enteSlug}`)
    return result
  } finally {
    // Remove from ongoing requests
    ongoingRequests.delete(cacheKey)
  }
}

/**
 * Internal function that does the actual ente data fetching
 */
async function getEnteDataInternal(enteSlug: string, referrerRegion?: string): Promise<SmartEnteResult | null> {
  const startTime = Date.now()
  const MAX_EXECUTION_TIME = 10000 // 10 seconds max
  
  const enteName = decodeURIComponent(enteSlug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    
  // Prevent excessively long ente names that might cause issues
  if (enteName.length > 100) {
    console.log(`📋 Ente name too long (${enteName.length} chars), skipping`)
    return null
  }

  // Check execution time before each strategy
  const checkTimeout = () => {
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      throw new Error('Query timeout - taking too long')
    }
  }

  // Strategy 1: Use regional data if referrer region is known
  if (referrerRegion) {
    try {
      checkTimeout()
      
      // Convert region slug back to proper region name
      const regionName = referrerRegion
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      console.log(`📋 Trying regional data approach for region: ${regionName} (from slug: ${referrerRegion})`)
      
      const regionalResult = await getRegionalConcorsi({
        regione: [regionName],
        stato: 'open',
        limit: 300
      })

      // Filter concorsi for this specific ente
      const enteConcorsi = regionalResult.concorsi.filter(concorso => {
        const concorsoEnte = concorso.Ente || ''
        const normalized = normalizeEnteForSlug(concorsoEnte)
        return normalized === enteSlug.toLowerCase() || 
               concorsoEnte.toLowerCase() === enteName.toLowerCase()
      })

      if (enteConcorsi.length > 0) {
        // Extract regions and settori from the filtered data
        const regions = new Set<string>()
        enteConcorsi.forEach(concorso => {
          if (concorso.AreaGeografica) {
            const concorsoRegions = extractRegionsFromLocalita(concorso.AreaGeografica)
            concorsoRegions.forEach(region => regions.add(region))
          }
        })

        const settori = Array.from(new Set(
          enteConcorsi
            .map(c => c.settore_professionale)
            .filter(Boolean)
        )).sort()

        // Use the most common ente name from the results
        const actualEnteName = enteConcorsi[0].Ente || enteName

        console.log(`📋 ✅ Found ${enteConcorsi.length} concorsi using regional data cache`)
        
        return {
          ente: actualEnteName,
          concorsi: enteConcorsi,
          totalCount: enteConcorsi.length,
          regions: Array.from(regions),
          settori,
          source: 'cached'
        }
      }
    } catch (error) {
      console.log(`📋 Regional data approach failed:`, error)
    }
  }

  // Strategy 2: Simplified direct query (avoid complex ente filtering)
  try {
    checkTimeout()
    console.log(`📋 Trying simplified direct query for ente: ${enteName}`)
    
    const db = getFirestoreForSSR()
    if (!db) {
      throw new Error('Database not available')
    }

    // Simple, direct query with exact ente name match
    const snapshot = await db.collection('concorsi')
      .where('Stato', '==', 'OPEN')
      .where('Ente', '==', enteName)
      .orderBy('publication_date', 'desc')
      .limit(50)
      .get()

    if (!snapshot.empty) {
      const concorsi = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]

      const regions = new Set<string>()
      concorsi.forEach(concorso => {
        if (concorso.AreaGeografica) {
          const concorsoRegions = extractRegionsFromLocalita(concorso.AreaGeografica)
          concorsoRegions.forEach(region => regions.add(region))
        }
      })

      const settori = Array.from(new Set(
        concorsi
          .map(c => c.settore_professionale)
          .filter(Boolean)
      )).sort()

      console.log(`📋 ✅ Found ${concorsi.length} concorsi using simplified direct query`)
      
      return {
        ente: enteName,
        concorsi,
        totalCount: concorsi.length,
        regions: Array.from(regions),
        settori,
        source: 'direct'
      }
    }
  } catch (error) {
    console.log(`📋 Simplified direct query failed:`, error)
  }

  // Strategy 3: Optimized fuzzy matching fallback
  try {
    checkTimeout()
    console.log(`📋 Trying fuzzy matching for ente slug: ${enteSlug}`)
    
    const db = getFirestoreForSSR()
    if (!db) {
      throw new Error('Database not available')
    }

    // Try a more targeted approach first - search by common ente prefixes
    const possiblePrefixes = ['comune', 'regione', 'provincia', 'asl', 'azienda', 'università']
    const slugWords = enteSlug.toLowerCase().split('-')
    const hasCommonPrefix = possiblePrefixes.some(prefix => slugWords.includes(prefix))

    let snapshot: any

    if (hasCommonPrefix) {
      // More targeted query for common ente types
      const queries = []
      for (const prefix of possiblePrefixes) {
        if (slugWords.includes(prefix)) {
          queries.push(
            db.collection('concorsi')
              .where('Stato', '==', 'OPEN')
              .where('Ente', '>=', prefix)
              .where('Ente', '<', prefix + '\uf8ff')
              .orderBy('Ente')
              .limit(100)
              .get()
          )
        }
      }
      
      if (queries.length > 0) {
        const results = await Promise.all(queries)
        const allDocs = results.flatMap(result => result.docs)
        snapshot = { empty: allDocs.length === 0, docs: allDocs }
      }
    }

    // Fall back to broader search if targeted search didn't work
    if (!snapshot || snapshot.empty) {
      snapshot = await db.collection('concorsi')
        .where('Stato', '==', 'OPEN')
        .orderBy('publication_date', 'desc')
        .limit(200) // Reduced from 300 for better performance
        .get()
    }

    if (!snapshot.empty) {
      const allConcorsi = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]

      // Optimized fuzzy matching strategies - try each in order until we find matches
      let matchedConcorsi: any[] = []

      // Strategy 1: Exact slug match (fastest)
      matchedConcorsi = allConcorsi.filter(concorso => {
        const ente = concorso.Ente || ''
        const normalizedEnteSlug = normalizeEnteForSlug(ente)
        return normalizedEnteSlug === enteSlug.toLowerCase()
      })

      // Strategy 2: Partial word matching (if no exact matches)
      if (matchedConcorsi.length === 0) {
        const searchWords = enteSlug.toLowerCase().split('-').filter(word => word.length > 2)
        if (searchWords.length > 0) {
          matchedConcorsi = allConcorsi.filter(concorso => {
            const ente = (concorso.Ente || '').toLowerCase()
            const matchingWords = searchWords.filter(word => ente.includes(word))
            return matchingWords.length >= Math.max(1, Math.ceil(searchWords.length * 0.7)) // 70% word match
          })
        }
      }

      // Strategy 3: Contains search term (if still no matches)
      if (matchedConcorsi.length === 0) {
        const cleanSearchTerm = enteName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
        if (cleanSearchTerm.length > 3) { // Only search if term is meaningful
          matchedConcorsi = allConcorsi.filter(concorso => {
            const ente = (concorso.Ente || '').toLowerCase().replace(/[^a-z0-9\s]/g, '')
            return ente.includes(cleanSearchTerm)
          })
        }
      }

      if (matchedConcorsi.length > 0) {
        // Use the most common ente name
        const enteNames = matchedConcorsi.map(c => c.Ente || '').filter(Boolean)
        const mostCommonEnte = enteNames.reduce((a, b) =>
          enteNames.filter(v => v === a).length >= enteNames.filter(v => v === b).length ? a : b
        )

        const regions = new Set<string>()
        matchedConcorsi.forEach(concorso => {
          if (concorso.AreaGeografica) {
            const concorsoRegions = extractRegionsFromLocalita(concorso.AreaGeografica)
            concorsoRegions.forEach(region => regions.add(region))
          }
        })

        const settori = Array.from(new Set(
          matchedConcorsi
            .map(c => c.settore_professionale)
            .filter(Boolean)
        )).sort()

        console.log(`📋 ✅ Found ${matchedConcorsi.length} concorsi using fuzzy matching for "${mostCommonEnte}"`)
        
        return {
          ente: mostCommonEnte,
          concorsi: matchedConcorsi.slice(0, 30),
          totalCount: matchedConcorsi.length,
          regions: Array.from(regions),
          settori,
          source: 'fallback'
        }
      }
    }
  } catch (error) {
    console.log(`📋 Fuzzy matching failed:`, error)
    
    // If it's a timeout error, log it specifically
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log(`📋 ⏰ Query timed out after ${Date.now() - startTime}ms for ente: ${enteName}`)
      return null
    }
  }

  const totalTime = Date.now() - startTime
  console.log(`📋 ❌ All strategies failed for ente: ${enteName} (took ${totalTime}ms)`)
  return null
}

/**
 * Extract region from referrer URL
 */
export function extractRegionFromReferrer(referrer?: string): string | undefined {
  if (!referrer) return undefined
  
  const regionMatch = referrer.match(/\/bandi\/regione\/([^\/\?]+)/)
  return regionMatch ? decodeURIComponent(regionMatch[1]) : undefined
}
