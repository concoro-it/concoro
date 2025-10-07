/**
 * Simplified Client-side ConcorsiService - Only fetches OPEN concorsi
 * 
 * This service provides a simplified interface to fetch only "Stato:OPEN" concorsi
 * from the /api/bandi endpoint.
 */

import { Concorso } from '@/types/concorso'
import { cachedOperation, CacheKeys, CACHE_TTL } from '@/lib/cache/unified-cache'
import { getDeadlineCountdown } from '@/lib/utils/date-utils'

export interface SimpleConcorsiResult {
  concorsi: Concorso[]
  hasMore: boolean
  totalCount?: number
  currentPage?: number
  totalPages?: number
}

export interface ConcorsiQueryParams {
  limit?: number
  page?: number
  sortBy?: string
  settore_professionale?: string
  Stato?: string
}

/**
 * Creates simple API parameters for OPEN concorsi with page pagination
 */
function createSimpleApiParams(params: ConcorsiQueryParams): URLSearchParams {
  const urlParams = new URLSearchParams()
  
  // Always fetch only OPEN concorsi
  urlParams.set('Stato', 'OPEN')
  
  // Sorting
  const sortBy = params.sortBy || 'publication_desc'
  urlParams.set('sort', sortBy)
  
  // Page-based pagination
  if (params.page && params.page > 1) {
    urlParams.set('page', params.page.toString())
  }
  
  // Limit
  if (params.limit) {
    urlParams.set('per_page', params.limit.toString())
  } else {
    urlParams.set('per_page', '20')
  }
  
  // Cache busting
  urlParams.set('_t', Date.now().toString())
  
  return urlParams
}

/**
 * Transform API response to match expected Concorso interface
 */
function transformApiResponseToConcorsi(apiResponse: any): Concorso[] {
  if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
    return []
  }
  
  return apiResponse.data.map((item: any): Concorso => ({
    id: String(item.id || ''),
    Titolo: item.Titolo || item.titolo || '',
    Ente: item.Ente || item.ente || '',
    AreaGeografica: item.AreaGeografica || item.areaGeografica || '',
    province: Array.isArray(item.province) ? item.province : undefined,
    DataChiusura: item.DataChiusura || item.dataChiusura,
    DataApertura: item.DataApertura || item.dataApertura,
    Descrizione: item.Descrizione || item.descrizione || '',
    Stato: item.Stato || item.stato || 'OPEN',
    Link: item.Link || item.link || '',
    Valutazione: item.Valutazione || item.valutazione,
    numero_di_posti: typeof item.numero_di_posti === 'number' ? item.numero_di_posti : 
                     typeof item.numeroPostiDisponibili === 'number' ? item.numeroPostiDisponibili : undefined,
    settore_professionale: item.settore_professionale || item.settoreProfessionale || '',
    regime: item.regime || item.regimeImpegno || '',
    regime_impegno: item.regime_impegno || item.regimeImpegno || '',
    publication_date: item.publication_date || item.publicationDate,
    sommario: item.sommario || item.sommario || '',
    settore: item.settore || '',
    tipologia: item.tipologia || '',
    categoria: item.categoria || '',
    area_categoria: item.area_categoria || item.areaCategoria || '',
    ambito_lavorativo: item.ambito_lavorativo || item.ambitoLavorativo || '',
    collocazione_organizzativa: item.collocazione_organizzativa || item.collocazioneOrganizzativa || '',
    capacita_richieste: item.capacita_richieste || item.capacitaRichieste,
    conoscenze_tecnico_specialistiche: item.conoscenze_tecnico_specialistiche || item.conoscenzeTecnicoSpecialistiche,
    programma_di_esame: item.programma_di_esame || item.programmaDiEsame,
    requisiti_generali: item.requisiti_generali || item.requisitiGenerali,
    pdf_links: Array.isArray(item.pdf_links) ? item.pdf_links : 
               Array.isArray(item.pdfLinks) ? item.pdfLinks : undefined,
    apply_link: item.apply_link || item.applyLink || '',
    pa_link: item.pa_link || item.paLink || '',
    contatti: item.contatti || item.contacts || '',
    titolo_breve: item.titolo_breve || item.titoloBreve || '',
    titolo_originale: item.titolo_originale || item.titoloOriginale || '',
    concorso_id: item.concorso_id || item.concorsoId || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }))
}

/**
 * Simplified Client-side ConcorsiService class - Only fetches OPEN concorsi
 */
export class ConcorsiServiceClient {
  private baseUrl = '/api/bandi'
  
  /**
   * Get OPEN concorsi from API with page-based pagination
   */
  async getOpenConcorsi(params: ConcorsiQueryParams): Promise<SimpleConcorsiResult> {
    const cacheKey = `open-concorsi-${params.limit || 20}-${params.page || 1}-${params.sortBy || 'publication_desc'}`
    
    return cachedOperation(
      cacheKey,
      () => this.executeSimpleApiRequest(params),
      {
        ttl: CACHE_TTL.CONCORSI_LIST,
        skipCache: false // Cache page-based requests
      }
    )
  }
  
  /**
   * Execute the actual API request for OPEN concorsi with page pagination
   */
  private async executeSimpleApiRequest(params: ConcorsiQueryParams): Promise<SimpleConcorsiResult> {
    const startTime = performance.now()
    console.log('🔍 ConcorsiServiceClient: Fetching OPEN concorsi with page pagination:', params)
    
    try {
      const urlParams = createSimpleApiParams(params)
      const url = `${this.baseUrl}?${urlParams.toString()}`
      
      console.log('🔍 API URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      const apiResponse = await response.json()
      
      if (apiResponse.error) {
        throw new Error(apiResponse.error)
      }
      
      // Transform API response to our expected format
      const concorsi = transformApiResponseToConcorsi(apiResponse)
      
      const result: SimpleConcorsiResult = {
        concorsi,
        hasMore: apiResponse.pagination?.has_next || false,
        totalCount: apiResponse.pagination?.total || concorsi.length,
        currentPage: apiResponse.pagination?.page || params.page || 1,
        totalPages: apiResponse.pagination?.total_pages || 1
      }
      
      const endTime = performance.now()
      console.log(`✅ ConcorsiServiceClient: Query completed: ${concorsi.length} OPEN concorsi in ${(endTime - startTime).toFixed(0)}ms`)
      
      return result
      
    } catch (error) {
      console.error('❌ ConcorsiServiceClient: Error in getOpenConcorsi:', error)
      throw error
    }
  }
}

// Export singleton instance
export const concorsiServiceClient = new ConcorsiServiceClient()

// Export simple function for OPEN concorsi
export const getOpenConcorsi = (params: ConcorsiQueryParams) =>
  concorsiServiceClient.getOpenConcorsi(params)

/**
 * Get concorsi by regime
 */
export const getConcorsiByRegime = async (regime: string, params: ConcorsiQueryParams): Promise<SimpleConcorsiResult> => {
  const cacheKey = `concorsi-regime-${regime}-${params.limit || 20}-${params.page || 1}-${params.sortBy || 'publication_desc'}`
  
  return cachedOperation(
    cacheKey,
    async () => {
      const startTime = performance.now()
      console.log(`🔍 Fetching concorsi for regime: ${regime}`)
      
      try {
        const urlParams = new URLSearchParams()
        urlParams.set('Stato', 'OPEN')
        urlParams.set('regime', regime)
        urlParams.set('sort', params.sortBy || 'publication_desc')
        
        if (params.page && params.page > 1) {
          urlParams.set('page', params.page.toString())
        }
        
        if (params.limit) {
          urlParams.set('per_page', params.limit.toString())
        } else {
          urlParams.set('per_page', '20')
        }
        
        urlParams.set('_t', Date.now().toString())
        
        const url = `/api/bandi?${urlParams.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const apiResponse = await response.json()
        
        if (apiResponse.error) {
          throw new Error(apiResponse.error)
        }
        
        const concorsi = transformApiResponseToConcorsi(apiResponse)
        
        const result: SimpleConcorsiResult = {
          concorsi,
          hasMore: apiResponse.pagination?.has_next || false,
          totalCount: apiResponse.pagination?.total || concorsi.length,
          currentPage: apiResponse.pagination?.page || params.page || 1,
          totalPages: apiResponse.pagination?.total_pages || 1
        }
        
        const endTime = performance.now()
        console.log(`✅ Query completed: ${concorsi.length} concorsi for regime ${regime} in ${(endTime - startTime).toFixed(0)}ms`)
        
        return result
        
      } catch (error) {
        console.error('❌ Error in getConcorsiByRegime:', error)
        throw error
      }
    },
    {
      ttl: CACHE_TTL.CONCORSI_LIST,
      skipCache: false
    }
  )
}

/**
 * Get concorsi by location
 */
export const getConcorsiByLocation = async (location: string, params: ConcorsiQueryParams): Promise<SimpleConcorsiResult> => {
  const cacheKey = `concorsi-location-${location}-${params.limit || 20}-${params.page || 1}-${params.sortBy || 'publication_desc'}`
  
  return cachedOperation(
    cacheKey,
    async () => {
      const startTime = performance.now()
      console.log(`🔍 Fetching concorsi for location: ${location}`)
      
      try {
        const urlParams = new URLSearchParams()
        urlParams.set('Stato', 'OPEN')
        urlParams.set('location', location)
        urlParams.set('sort', params.sortBy || 'publication_desc')
        
        if (params.page && params.page > 1) {
          urlParams.set('page', params.page.toString())
        }
        
        if (params.limit) {
          urlParams.set('per_page', params.limit.toString())
        } else {
          urlParams.set('per_page', '20')
        }
        
        urlParams.set('_t', Date.now().toString())
        
        const url = `/api/bandi?${urlParams.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const apiResponse = await response.json()
        
        if (apiResponse.error) {
          throw new Error(apiResponse.error)
        }
        
        const concorsi = transformApiResponseToConcorsi(apiResponse)
        
        const result: SimpleConcorsiResult = {
          concorsi,
          hasMore: apiResponse.pagination?.has_next || false,
          totalCount: apiResponse.pagination?.total || concorsi.length,
          currentPage: apiResponse.pagination?.page || params.page || 1,
          totalPages: apiResponse.pagination?.total_pages || 1
        }
        
        const endTime = performance.now()
        console.log(`✅ Query completed: ${concorsi.length} concorsi for location ${location} in ${(endTime - startTime).toFixed(0)}ms`)
        
        return result
        
      } catch (error) {
        console.error('❌ Error in getConcorsiByLocation:', error)
        throw error
      }
    },
    {
      ttl: CACHE_TTL.CONCORSI_LIST,
      skipCache: false
    }
  )
}

/**
 * Get concorsi by settore (professional sector)
 */
export const getConcorsiBySettore = async (params: ConcorsiQueryParams): Promise<SimpleConcorsiResult> => {
  const cacheKey = `concorsi-settore-${params.settore_professionale}-${params.limit || 20}-${params.page || 1}-${params.sortBy || 'publication_desc'}`
  
  return cachedOperation(
    cacheKey,
    async () => {
      const startTime = performance.now()
      console.log(`🔍 Fetching concorsi for settore: ${params.settore_professionale}`)
      
      try {
        const urlParams = new URLSearchParams()
        urlParams.set('Stato', 'OPEN')
        urlParams.set('settore_professionale', params.settore_professionale || '')
        urlParams.set('sort', params.sortBy || 'publication_desc')
        
        if (params.page && params.page > 1) {
          urlParams.set('page', params.page.toString())
        }
        
        if (params.limit) {
          urlParams.set('per_page', params.limit.toString())
        } else {
          urlParams.set('per_page', '20')
        }
        
        urlParams.set('_t', Date.now().toString())
        
        const url = `/api/bandi?${urlParams.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const apiResponse = await response.json()
        
        if (apiResponse.error) {
          throw new Error(apiResponse.error)
        }
        
        const concorsi = transformApiResponseToConcorsi(apiResponse)
        
        const result: SimpleConcorsiResult = {
          concorsi,
          hasMore: apiResponse.pagination?.has_next || false,
          totalCount: apiResponse.pagination?.total || concorsi.length,
          currentPage: apiResponse.pagination?.page || params.page || 1,
          totalPages: apiResponse.pagination?.total_pages || 1
        }
        
        const endTime = performance.now()
        console.log(`✅ Query completed: ${concorsi.length} concorsi for settore ${params.settore_professionale} in ${(endTime - startTime).toFixed(0)}ms`)
        
        return result
        
      } catch (error) {
        console.error('❌ Error in getConcorsiBySettore:', error)
        throw error
      }
    },
    {
      ttl: CACHE_TTL.CONCORSI_LIST,
      skipCache: false
    }
  )
}

/**
 * Get concorsi by ente
 */
export const getConcorsiByEnte = async (ente: string, params: ConcorsiQueryParams): Promise<SimpleConcorsiResult> => {
  const cacheKey = `concorsi-ente-${ente}-${params.limit || 20}-${params.page || 1}-${params.sortBy || 'publication_desc'}`
  
  return cachedOperation(
    cacheKey,
    async () => {
      const startTime = performance.now()
      console.log(`🔍 Fetching concorsi for ente: ${ente}`)
      
      try {
        const urlParams = new URLSearchParams()
        urlParams.set('Stato', 'OPEN')
        urlParams.set('ente', ente)
        urlParams.set('sort', params.sortBy || 'publication_desc')
        
        if (params.page && params.page > 1) {
          urlParams.set('page', params.page.toString())
        }
        
        if (params.limit) {
          urlParams.set('per_page', params.limit.toString())
        } else {
          urlParams.set('per_page', '20')
        }
        
        urlParams.set('_t', Date.now().toString())
        
        const url = `/api/bandi?${urlParams.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const apiResponse = await response.json()
        
        if (apiResponse.error) {
          throw new Error(apiResponse.error)
        }
        
        const concorsi = transformApiResponseToConcorsi(apiResponse)
        
        const result: SimpleConcorsiResult = {
          concorsi,
          hasMore: apiResponse.pagination?.has_next || false,
          totalCount: apiResponse.pagination?.total || concorsi.length,
          currentPage: apiResponse.pagination?.page || params.page || 1,
          totalPages: apiResponse.pagination?.total_pages || 1
        }
        
        const endTime = performance.now()
        console.log(`✅ Query completed: ${concorsi.length} concorsi for ente ${ente} in ${(endTime - startTime).toFixed(0)}ms`)
        
        return result
        
      } catch (error) {
        console.error('❌ Error in getConcorsiByEnte:', error)
        throw error
      }
    },
    {
      ttl: CACHE_TTL.CONCORSI_LIST,
      skipCache: false
    }
  )
}

/**
 * Get concorso by ID
 */
export const getConcorsoById = async (id: string): Promise<Concorso | null> => {
  const cacheKey = `concorso-${id}`
  
  return cachedOperation(
    cacheKey,
    async () => {
      const startTime = performance.now()
      console.log(`🔍 Fetching concorso by ID: ${id}`)
      
      try {
        const urlParams = new URLSearchParams()
        urlParams.set('id', id)
        urlParams.set('_t', Date.now().toString())
        
        const url = `/api/bandi?${urlParams.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const apiResponse = await response.json()
        
        if (apiResponse.error) {
          throw new Error(apiResponse.error)
        }
        
        if (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
          const concorsi = transformApiResponseToConcorsi(apiResponse)
          const concorso = concorsi[0]
          
          const endTime = performance.now()
          console.log(`✅ Query completed: concorso ${id} fetched in ${(endTime - startTime).toFixed(0)}ms`)
          
          return concorso
        }
        
        return null
        
      } catch (error) {
        console.error('❌ Error in getConcorsoById:', error)
        throw error
      }
    },
    {
      ttl: CACHE_TTL.CONCORSO_DETAIL,
      skipCache: false
    }
  )
}
