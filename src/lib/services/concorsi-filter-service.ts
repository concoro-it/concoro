/**
 * Service for API-based concorsi filtering that bridges ConcorsiSearch component 
 * with server-side filtering capabilities while maintaining type safety with Concorso interface
 */

import { Concorso } from '@/types/concorso'

export interface ConcorsiFilterParams {
  // Text search
  searchQuery?: string
  locationQuery?: string
  
  // Multi-select filters (arrays)
  selectedLocations?: string[]
  selectedDeadlines?: string[]
  selectedEnti?: string[]
  selectedSettori?: string[]
  selectedRegimi?: string[]
  selectedStati?: string[]
  
  // Sorting and pagination
  sortBy?: string
  currentPage?: number
  limit?: number
  
  // Cursor for pagination
  nextCursor?: string
}

export interface ConcorsiFilterResult {
  concorsi: Concorso[]
  hasMore: boolean
  nextCursor?: string
  totalCount?: number
  metadata?: {
    currentPage: number
    appliedFilters: Partial<ConcorsiFilterParams>
  }
}

export interface AvailableFilterOptions {
  locations: string[]
  enti: string[]
  settori: string[]
  regimi: string[]
}

/**
 * Maps ConcorsiSearch component filter params to API query parameters
 */
function mapFiltersToApiParams(filters: ConcorsiFilterParams): URLSearchParams {
  const params = new URLSearchParams()
  
  // Text search
  if (filters.searchQuery?.trim()) {
    params.set('q', filters.searchQuery.trim())
  }
  
  if (filters.locationQuery?.trim()) {
    params.set('location', filters.locationQuery.trim())
  }
  
  // Location filters (province.regione_nome in API)
  if (filters.selectedLocations && filters.selectedLocations.length > 0) {
    // The API should use 'province' parameter for the province array with regione_nome
    params.set('province', filters.selectedLocations.join(','))
  }
  
  // Ente filter (single ente for now, API limitation)
  if (filters.selectedEnti && filters.selectedEnti.length > 0) {
    params.set('ente', filters.selectedEnti[0])
  }
  
  // Settore filter (single settore for now, API limitation)
  if (filters.selectedSettori && filters.selectedSettori.length > 0) {
    params.set('settore', filters.selectedSettori[0])
  }
  
  // Regime filter
  if (filters.selectedRegimi && filters.selectedRegimi.length > 0) {
    // Map Italian regime names to API values
    const regimeMap: Record<string, string> = {
      'Tempo pieno': 'full-time',
      'Part-time': 'part-time',
      'Non specificato': 'unspecified'
    }
    const mappedRegime = regimeMap[filters.selectedRegimi[0]] || filters.selectedRegimi[0]
    params.set('regime', mappedRegime)
  }
  
  // Status filter
  if (filters.selectedStati && filters.selectedStati.length > 0) {
    const statusMap: Record<string, string> = {
      'aperto': 'open',
      'chiuso': 'closed'
    }
    const mappedStatus = statusMap[filters.selectedStati[0]] || 'open'
    params.set('stato', mappedStatus)
  } else {
    // Default to open if no status selected
    params.set('stato', 'open')
  }
  
  // Deadline filters - convert to scadenza API param
  if (filters.selectedDeadlines && filters.selectedDeadlines.length > 0) {
    const deadlineMap: Record<string, string> = {
      'today': 'today',
      'week': 'this-week',
      'month': 'this-month',
      'next-month': 'next-month'
    }
    // Use first deadline filter
    const mappedDeadline = deadlineMap[filters.selectedDeadlines[0]]
    if (mappedDeadline) {
      params.set('scadenza', mappedDeadline)
    }
  }
  
  // Sorting
  if (filters.sortBy) {
    const sortMap: Record<string, { field: string; direction: string }> = {
      'publication-desc': { field: 'publication_date', direction: 'desc' },
      'deadline-asc': { field: 'DataChiusura', direction: 'asc' },
      'posts-desc': { field: 'publication_date', direction: 'desc' } // Fallback for posts sorting
    }
    
    const sortConfig = sortMap[filters.sortBy]
    if (sortConfig) {
      params.set('orderByField', sortConfig.field)
      params.set('orderDirection', sortConfig.direction)
    }
  }
  
  // Pagination
  if (filters.limit) {
    params.set('limit', filters.limit.toString())
  }
  
  if (filters.nextCursor) {
    params.set('cursorId', filters.nextCursor)
  }
  
  if (filters.currentPage && filters.currentPage > 1) {
    params.set('page', filters.currentPage.toString())
  }
  
  // Cache busting with more aggressive timestamp
  params.set('_t', Date.now().toString())
  params.set('_r', Math.random().toString(36).substring(7))
  
  return params
}

/**
 * Transforms API response to match expected Concorso interface
 */
function transformApiResponseToConcorsi(apiResponse: any): Concorso[] {
  if (!apiResponse.concorsi || !Array.isArray(apiResponse.concorsi)) {
    return []
  }
  
  return apiResponse.concorsi.map((item: any): Concorso => ({
    id: String(item.id || ''),
    Titolo: item.Titolo || item.titolo || '',
    Ente: item.Ente || item.ente || '',
    AreaGeografica: item.AreaGeografica || item.areaGeografica || '',
    province: Array.isArray(item.province) ? item.province : undefined,
    DataChiusura: item.DataChiusura || item.dataChiusura,
    DataApertura: item.DataApertura || item.dataApertura,
    Descrizione: item.Descrizione || item.descrizione || '',
    Stato: item.Stato || item.stato || 'open',
    Link: item.Link || item.link || '',
    Valutazione: item.Valutazione || item.valutazione,
    numero_di_posti: typeof item.numero_di_posti === 'number' ? item.numero_di_posti : 
                     typeof item.numeroPostiDisponibili === 'number' ? item.numeroPostiDisponibili : undefined,
    settore_professionale: item.settore_professionale || item.settoreProfessionale || '',
    regime: item.regime || item.regimeImpegno || '',
    regime_impegno: item.regime_impegno || item.regimeImpegno || '',
    publication_date: item.publication_date || item.publicationDate,
    riassunto: item.riassunto || item.sommario || '',
    sommario: item.sommario || item.riassunto || '',
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
 * Main service class for API-based concorsi filtering
 */
export class ConcorsiFilterService {
  private baseUrl = '/api/concorsi'
  
  /**
   * Fetch filtered concorsi from API based on search component filters
   */
  async getFilteredConcorsi(filters: ConcorsiFilterParams): Promise<ConcorsiFilterResult> {
    const startTime = performance.now()
    console.log('🔍 ConcorsiFilterService: Starting API-based filter query:', filters)
    
    try {
      const params = mapFiltersToApiParams(filters)
      const url = `${this.baseUrl}?${params.toString()}`
      
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
      
      const result: ConcorsiFilterResult = {
        concorsi,
        hasMore: apiResponse.metadata?.hasMore || false,
        nextCursor: apiResponse.metadata?.nextCursor,
        totalCount: apiResponse.metadata?.totalCount,
        metadata: {
          currentPage: filters.currentPage || 1,
          appliedFilters: filters
        }
      }
      
      const endTime = performance.now()
      console.log(`✅ ConcorsiFilterService: Query completed: ${concorsi.length} concorsi in ${(endTime - startTime).toFixed(0)}ms`)
      
      return result
      
    } catch (error) {
      console.error('❌ ConcorsiFilterService: Error in getFilteredConcorsi:', error)
      throw error
    }
  }
  
  /**
   * Get available filter options for dropdowns/autocomplete
   * This will initially use the loaded data but can be extended to use API
   */
  async getAvailableFilterOptions(loadedConcorsi: Concorso[]): Promise<AvailableFilterOptions> {
    console.log('📋 ConcorsiFilterService: Extracting filter options from', loadedConcorsi.length, 'concorsi')
    
    // Extract unique values from loaded data
    const locations = new Set<string>()
    const enti = new Set<string>()
    const settori = new Set<string>()
    const regimi = new Set<string>()
    
    loadedConcorsi.forEach(concorso => {
      // Extract regions from province.regione_nome (new field structure)
      if (concorso.province && Array.isArray(concorso.province)) {
        concorso.province.forEach((provincia: any) => {
          if (provincia && provincia.regione_nome) {
            const region = provincia.regione_nome.trim()
            if (region && region !== 'N/A' && !region.toLowerCase().includes('non specificato')) {
              locations.add(region)
            }
          }
        })
      } else if (concorso.AreaGeografica) {
        // Fallback: Extract regions from AreaGeografica for legacy data
        const parts = concorso.AreaGeografica.split(',')
        if (parts.length > 0) {
          const region = parts[parts.length - 1].trim()
          if (region && region !== 'N/A' && !region.toLowerCase().includes('non specificato')) {
            locations.add(region)
          }
        }
      }
      
      // Extract enti
      if (concorso.Ente && concorso.Ente.trim() !== '' && !concorso.Ente.toLowerCase().includes('non specificato')) {
        enti.add(concorso.Ente)
      }
      
      // Extract settori
      if (concorso.settore_professionale && concorso.settore_professionale.trim() !== '' && 
          !concorso.settore_professionale.toLowerCase().includes('non specificato')) {
        settori.add(concorso.settore_professionale)
      }
      
      // Extract regimi
      const regime = concorso.regime || concorso.regime_impegno
      if (regime && regime.trim() !== '' && !regime.toLowerCase().includes('non specificato')) {
        regimi.add(regime)
      }
    })
    
    return {
      locations: Array.from(locations).sort(),
      enti: Array.from(enti).sort(),
      settori: Array.from(settori).sort(),
      regimi: Array.from(regimi).sort()
    }
  }
  
  /**
   * Load more concorsi (pagination)
   */
  async loadMoreConcorsi(filters: ConcorsiFilterParams, nextCursor: string): Promise<ConcorsiFilterResult> {
    return this.getFilteredConcorsi({
      ...filters,
      nextCursor
    })
  }
}

// Export singleton instance
export const concorsiFilterService = new ConcorsiFilterService()
