/**
 * Client-side wrapper for common-concorsi-api
 * Provides client-safe access to the optimized common concorsi API
 */

export interface ClientFilterOptions {
  filterType: 'regime' | 'scadenza' | 'Ente' | 'regione' | 'settore'
  filterValue: string | string[]
  Stato?: 'OPEN' | 'CHIUSO' | 'all'
  limit?: number
  orderByField?: 'publication_date' | 'DataChiusura'
  orderDirection?: 'asc' | 'desc'
  additionalFilters?: {
    regione?: string[]
    Ente?: string
    settore?: string
    scadenza?: 'oggi' | 'questa-settimana' | 'questo-mese'
    regime?: 'part-time' | 'tempo-determinato' | 'tempo-indeterminato' | 'non-specificato'
  }
}

export interface ClientQueryResult {
  concorsi: any[]
  hasMore: boolean
  totalCount: number
  metadata: {
    filterType: string
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
 * Client-safe query for concorsi using the common API
 */
export const getConcorsiByFilterClient = async (options: ClientFilterOptions): Promise<ClientQueryResult> => {
  const startTime = performance.now()
  console.log('🔍 Starting client common concorsi query:', options)

  try {
    // Build query parameters
    const params = new URLSearchParams()
    
    params.set('filterType', options.filterType)
    
    if (Array.isArray(options.filterValue)) {
      params.set('filterValue', options.filterValue.join(','))
    } else {
      params.set('filterValue', options.filterValue)
    }
    
    if (options.Stato && options.Stato !== 'OPEN') {
      params.set('Stato', options.Stato)
    }
    
    if (options.limit && options.limit !== 50) {
      params.set('limit', options.limit.toString())
    }
    
    if (options.orderByField && options.orderByField !== 'publication_date') {
      params.set('orderByField', options.orderByField)
    }
    
    if (options.orderDirection && options.orderDirection !== 'desc') {
      params.set('orderDirection', options.orderDirection)
    }
    
    if (options.additionalFilters) {
      const { regione, Ente, settore, scadenza, regime } = options.additionalFilters
      
      if (regione && regione.length > 0) {
        params.set('additionalRegione', regione.join(','))
      }
      
      if (Ente) {
        params.set('additionalEnte', Ente)
      }
      
      if (settore) {
        params.set('additionalSettore', settore)
      }
      
      if (scadenza) {
        params.set('additionalScadenza', scadenza)
      }
      
      if (regime) {
        params.set('additionalRegime', regime)
      }
    }

    // Call API route with cache-busting timestamp
    params.set('_t', Date.now().toString())
    const response = await fetch(`/api/common-concorsi?${params.toString()}`, {
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
    console.log(`✅ Client common concorsi query completed: ${result.concorsi?.length || 0} docs in ${(endTime - startTime).toFixed(0)}ms`)
    
    return result

  } catch (error) {
    console.error('❌ Error in client common concorsi query:', error)
    throw error
  }
}

/**
 * Convenience functions for specific filter types
 */
export const getConcorsiByRegimeClient = (regime: string, options: Partial<ClientFilterOptions> = {}) =>
  getConcorsiByFilterClient({ ...options, filterType: 'regime', filterValue: regime })

export const getConcorsiByScadenzaClient = (scadenza: string, options: Partial<ClientFilterOptions> = {}) =>
  getConcorsiByFilterClient({ ...options, filterType: 'scadenza', filterValue: scadenza })

export const getConcorsiByEnteClient = (ente: string, options: Partial<ClientFilterOptions> = {}) =>
  getConcorsiByFilterClient({ ...options, filterType: 'Ente', filterValue: ente })

export const getConcorsiByRegioneClient = (regione: string | string[], options: Partial<ClientFilterOptions> = {}) =>
  getConcorsiByFilterClient({ ...options, filterType: 'regione', filterValue: regione })

export const getConcorsiBySettoreClient = (settore: string, options: Partial<ClientFilterOptions> = {}) =>
  getConcorsiByFilterClient({ ...options, filterType: 'settore', filterValue: settore })

/**
 * Get latest concorsi (optimized for dashboard)
 */
export const getLatestConcorsiClient = async (limit = 5): Promise<any[]> => {
  try {
    const result = await getConcorsiByFilterClient({
      filterType: 'regione',
      filterValue: 'all', // Get all regions
      limit,
      orderByField: 'publication_date',
      orderDirection: 'desc'
    })
    
    return result.concorsi
  } catch (error) {
    console.error('❌ Error getting latest concorsi:', error)
    return []
  }
}

/**
 * Get maxi concorsi (with most posts)
 */
export const getMaxiConcorsiClient = async (limit = 5): Promise<any[]> => {
  try {
    // Get more concorsi to filter by posts client-side
    const result = await getConcorsiByFilterClient({
      filterType: 'regione',
      filterValue: 'all',
      limit: 100, // Get more to filter by posts
      orderByField: 'publication_date',
      orderDirection: 'desc'
    })
    
    // Filter and sort by numero_di_posti client-side
    const maxiConcorsi = result.concorsi
      .filter((concorso: any) => concorso.numero_di_posti && concorso.numero_di_posti > 0)
      .sort((a: any, b: any) => (b.numero_di_posti || 0) - (a.numero_di_posti || 0))
      .slice(0, limit)
    
    return maxiConcorsi
  } catch (error) {
    console.error('❌ Error getting maxi concorsi:', error)
    return []
  }
}

/**
 * Get concorsi closing soon
 */
export const getClosingSoonConcorsiClient = async (limit = 5): Promise<any[]> => {
  try {
    // Get concorsi with scadenza filter for this week
    const result = await getConcorsiByFilterClient({
      filterType: 'scadenza',
      filterValue: 'questa-settimana',
      limit: 50, // Get more to sort by deadline
      orderByField: 'DataChiusura',
      orderDirection: 'asc'
    })
    
    // Sort by closest deadline and take first N
    const closingConcorsi = result.concorsi
      .sort((a: any, b: any) => {
        const dateA = new Date(a.DataChiusura?.seconds ? a.DataChiusura.seconds * 1000 : a.DataChiusura)
        const dateB = new Date(b.DataChiusura?.seconds ? b.DataChiusura.seconds * 1000 : b.DataChiusura)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, limit)
    
    return closingConcorsi
  } catch (error) {
    console.error('❌ Error getting closing soon concorsi:', error)
    return []
  }
}
