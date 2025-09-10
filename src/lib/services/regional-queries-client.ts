/**
 * Client-safe version of regional queries service
 * Uses API routes instead of direct Firebase Admin access
 */

export interface RegionalQueryOptions {
  regione?: string[]
  ente?: string
  settore?: string
  stato?: 'open' | 'closed' | 'all'
  limit?: number
  orderByField?: 'publication_date' | 'DataChiusura'
  orderDirection?: 'asc' | 'desc'
  cursorId?: string
}

export interface RegionalQueryResult {
  concorsi: any[]
  lastDoc?: any
  hasMore: boolean
  totalCount?: number
  nextCursor?: string
}

/**
 * Client-safe query for regional concorsi using API routes
 */
export const getRegionalConcorsi = async (options: RegionalQueryOptions): Promise<RegionalQueryResult> => {
  const {
    regione,
    ente,
    settore,
    stato = 'open',
    limit = 20,
    orderByField = 'publication_date',
    orderDirection = 'desc'
  } = options

  const startTime = performance.now()
  console.log('🔍 Starting client regional query via API:', options)

  try {
    // Build query parameters
    const params = new URLSearchParams()
    
    if (regione && regione.length > 0) {
      params.set('regione', regione.join(','))
    }
    
    if (ente) {
      params.set('ente', ente)
    }
    
    if (settore) {
      params.set('settore', settore)
    }
    
    if (stato !== 'open') {
      params.set('stato', stato)
    }
    
    if (limit !== 20) {
      params.set('limit', limit.toString())
    }
    
    if (orderByField !== 'publication_date') {
      params.set('orderByField', orderByField)
    }
    
    if (orderDirection !== 'desc') {
      params.set('orderDirection', orderDirection)
    }
    
    if (options.cursorId) {
      params.set('cursorId', options.cursorId)
    }

    // Call API route with cache-busting timestamp
    params.set('_t', Date.now().toString())
    const response = await fetch(`/api/regional-concorsi?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    const endTime = performance.now()
    console.log(`✅ Client regional query completed: ${result.concorsi?.length || 0} docs in ${(endTime - startTime).toFixed(0)}ms`)
    
    return result

  } catch (error) {
    console.error('❌ Error in client regional query:', error)
    throw error
  }
}

/**
 * Get count of concorsi for a region (client-safe)
 */
export const getRegionalCount = async (regione: string): Promise<number> => {
  try {
    const result = await getRegionalConcorsi({
      regione: [regione],
      stato: 'open',
      limit: 1 // We only need count, not data
    })
    
    return result.totalCount || result.concorsi.length

  } catch (error) {
    console.error('❌ Error getting regional count via API:', error)
    return 0
  }
}

/**
 * Get available enti for a region (client-safe)
 */
export const getRegionalEnti = async (regione: string): Promise<string[]> => {
  try {
    const result = await getRegionalConcorsi({
      regione: [regione],
      limit: 2000 // Get more docs to extract unique enti
    })

    const entiSet = new Set<string>()
    result.concorsi.forEach(concorso => {
      if (concorso.Ente) {
        entiSet.add(concorso.Ente)
      }
    })

    return Array.from(entiSet).sort()

  } catch (error) {
    console.error('❌ Error getting regional enti via API:', error)
    return []
  }
}

/**
 * Client-safe query for ente-specific concorsi
 */
export const getEnteConcorsi = async (ente: string, limit = 20): Promise<any[]> => {
  try {
    const result = await getRegionalConcorsi({
      ente,
      limit
    })

    return result.concorsi

  } catch (error) {
    console.error('❌ Error getting ente concorsi via API:', error)
    return []
  }
}
