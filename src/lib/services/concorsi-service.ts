/**
 * Unified ConcorsiService - Consolidates all concorsi-related operations
 * 
 * Replaces and consolidates:
 * - concorsi-filter-service.ts
 * - common-concorsi-api.ts  
 * - regional-queries.ts
 * - location-queries.ts
 * 
 * Provides a single, consistent interface for all concorsi operations
 * with unified caching, error handling, and query optimization.
 */

import { getFirestoreForSSR } from '@/lib/firebase/server-config'
import * as admin from 'firebase-admin'
import { Concorso } from '@/types/concorso'
import { 
  preserveDateFormat, 
  serializeToPlainObject, 
  getScadenzaDateRange, 
  processAndSerializeConcorsi,
  extractUniqueValues,
  getDisplayName,
  type ScadenzaFilter
} from '@/lib/utils/concorsi-utils'
import { cachedOperation, CacheKeys, CACHE_TTL } from '@/lib/cache/unified-cache'
import { cache } from 'react'

// Types for the unified service
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

export type FilterType = 'regime' | 'scadenza' | 'Ente' | 'regione' | 'settore'
export type RegimeFilter = 'part-time' | 'tempo-determinato' | 'tempo-indeterminato' | 'non-specificato' | undefined

export interface QueryOptions {
  filterType?: FilterType
  filterValue?: string | string[]
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
  searchQuery?: string
  numeroPostiMin?: number
  numeroPostiMax?: number
  areaGeografica?: string
  tags?: string[]
  page?: number
  nextCursor?: string  // Add for backward compatibility
}

export interface QueryResult {
  concorsi: Concorso[]
  lastDoc?: admin.firestore.DocumentSnapshot
  hasMore: boolean
  totalCount?: number
  nextCursor?: string  // Add for backward compatibility
  metadata?: {
    filterType?: FilterType
    filterValue?: string | string[]
    displayName?: string
    uniqueValues?: {
      enti?: string[]
      settori?: string[]
      regimi?: string[]
      regioni?: string[]
    }
  }
}

/**
 * Unified ConcorsiService class
 */
export class ConcorsiService {
  private baseUrl = '/api/bandi'

  /**
   * Build optimized Firestore query based on options
   */
  private async buildQuery(
    firestore: admin.firestore.Firestore,
    options: QueryOptions
  ): Promise<admin.firestore.Query> {
    let query: admin.firestore.Query = firestore.collection('concorsi')
    const { filterType, filterValue, Stato = 'OPEN', orderByField = 'publication_date', orderDirection = 'desc' } = options

    // Apply main filter based on type
    if (filterType && filterValue) {
      const normalizedValue = this.normalizeFilterValue(filterType, filterValue)

      switch (filterType) {
        case 'regione':
          const regioni = Array.isArray(normalizedValue) ? normalizedValue : [normalizedValue]
          if (regioni.length === 1) {
            query = query.where('province.regione_nome', '==', regioni[0])
          } else {
            query = query.where('province.regione_nome', 'in', regioni)
          }
          break

        case 'settore':
          query = query.where('settore_professionale', '==', normalizedValue)
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
    }

    // Apply additional filters
    if (options.regione && options.regione.length > 0 && filterType !== 'regione') {
      if (options.regione.length === 1) {
        query = query.where('province.regione_nome', '==', options.regione[0])
      } else {
        query = query.where('province.regione_nome', 'in', options.regione)
      }
    }

    if (options.ente && filterType !== 'Ente') {
      query = query.where('Ente', '==', options.ente)
    }

    if (options.settore && filterType !== 'settore') {
      query = query.where('settore_professionale', '==', options.settore)
    }

    if (options.regime && filterType !== 'regime') {
      query = query.where('regime_impegno', '==', options.regime)
    }

    if (options.scadenza && filterType !== 'scadenza') {
      const dateRange = getScadenzaDateRange(options.scadenza)
      if (dateRange) {
        query = query
          .where('DataChiusura', '>=', dateRange.start)
          .where('DataChiusura', '<=', dateRange.end)
      }
    }

    // Apply status filter
    if (Stato !== 'all') {
      const statusValue = Stato === 'OPEN' ? 'OPEN' : 'CHIUSO'
      query = query.where('Stato', '==', statusValue)
    }

    // Apply ordering
    query = query.orderBy(orderByField, orderDirection)

    return query
  }

  /**
   * Normalize filter values based on type
   */
  private normalizeFilterValue(filterType: FilterType, value: string | string[]): any {
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

      case 'Ente':
      case 'settore':
        return value

      default:
        return value
    }
  }

  /**
   * Execute query with timeout and error handling
   */
  private async executeQuery(
    query: admin.firestore.Query,
    options: QueryOptions
  ): Promise<QueryResult> {
    const limit = options.limit || 25
    
    // Add pagination
    if (options.startAfterDoc) {
      query = query.startAfter(options.startAfterDoc)
    }
    query = query.limit(limit + 1)

    // Execute query with timeout
    const queryPromise = query.get()
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 30 seconds')), 30000)
    )
    
    const snapshot = await Promise.race([queryPromise, timeoutPromise])
    const hasMore = snapshot.docs.length > limit
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs

    // Process and serialize the data
    const concorsi = processAndSerializeConcorsi(docs, options)

    // Extract unique values for secondary filters
    const uniqueValues = extractUniqueValues(concorsi, options.filterType || '')

    // Get display name
    const displayName = options.filterType && options.filterValue 
      ? getDisplayName(options.filterType, options.filterValue)
      : ''

    return {
      concorsi,
      hasMore,
      lastDoc: docs[docs.length - 1],
      totalCount: concorsi.length,
      nextCursor: hasMore ? docs[docs.length - 1]?.id : undefined, // Add cursor for pagination
      metadata: {
        filterType: options.filterType,
        filterValue: options.filterValue,
        displayName,
        uniqueValues
      }
    }
  }

  /**
   * Get concorsi with filters (main query method)
   */
  async getFilteredConcorsi(options: QueryOptions): Promise<QueryResult> {
    const cacheKey = CacheKeys.concorsiList(options);
    
    return cachedOperation(
      cacheKey,
      async () => {
        const firestore = await getFirestoreForSSR()
        if (!firestore) {
          throw new Error('Firestore not available')
        }

        // Handle nextCursor by converting to startAfterDoc
        if (options.nextCursor && !options.startAfterDoc) {
          try {
            const cursorDoc = await firestore.collection('concorsi').doc(options.nextCursor).get()
            if (cursorDoc.exists) {
              options.startAfterDoc = cursorDoc
            }
          } catch (error) {
            console.warn('Failed to resolve nextCursor:', error)
          }
        }

        const query = await this.buildQuery(firestore, options)
        return this.executeQuery(query, options)
      },
      {
        ttl: CACHE_TTL.CONCORSI_LIST,
        skipCache: !!(options.startAfterDoc || options.nextCursor) // Skip cache for paginated requests
      }
    )
  }

  /**
   * Get concorsi by regime (work arrangement)
   */
  async getConcorsiByRegime(regime: string, options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    return this.getFilteredConcorsi({ ...options, filterType: 'regime', filterValue: regime })
  }

  /**
   * Get concorsi by scadenza (deadline)
   */
  async getConcorsiByScadenza(scadenza: string, options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    return this.getFilteredConcorsi({ ...options, filterType: 'scadenza', filterValue: scadenza })
  }

  /**
   * Get concorsi by ente (organization)
   */
  async getConcorsiByEnte(ente: string, options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    return this.getFilteredConcorsi({ ...options, filterType: 'Ente', filterValue: ente })
  }

  /**
   * Get concorsi by regione (region)
   */
  async getConcorsiByRegione(regione: string | string[], options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    return this.getFilteredConcorsi({ ...options, filterType: 'regione', filterValue: regione })
  }

  /**
   * Get concorsi by settore (professional sector)
   */
  async getConcorsiBySettore(settore: string, options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    return this.getFilteredConcorsi({ ...options, filterType: 'settore', filterValue: settore })
  }

  /**
   * Get default concorsi list (for main /bandi page)
   */
  async getDefaultConcorsi(limit = 25): Promise<QueryResult> {
    const cacheKey = CacheKeys.concorsiList({ default: true, limit });
    
    return cachedOperation(
      cacheKey,
      async () => {
        const firestore = await getFirestoreForSSR()
        if (!firestore) {
          throw new Error('Firestore not available')
        }

        // Optimized query for default page
        const query = firestore.collection('concorsi')
          .where('Stato', '==', 'OPEN')
          .orderBy('publication_date', 'desc')
          .limit(limit + 1)

        const snapshot = await query.get()
        const hasMore = snapshot.docs.length > limit
        const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs

        const concorsi = processAndSerializeConcorsi(docs)

        return {
          concorsi,
          hasMore,
          lastDoc: docs[docs.length - 1],
          totalCount: concorsi.length,
          nextCursor: hasMore ? docs[docs.length - 1]?.id : undefined
        }
      },
      { ttl: CACHE_TTL.CONCORSI_LIST }
    )
  }

  /**
   * Get available filter options for dropdowns
   */
  async getFilterOptions(
    filter: 'settori' | 'regimi' | 'enti' | 'regioni',
    options: Partial<QueryOptions> = {}
  ): Promise<string[]> {
    const cacheKey = CacheKeys.filterOptions(filter, options);
    
    return cachedOperation(
      cacheKey,
      async () => {
        const firestore = await getFirestoreForSSR()
        if (!firestore) {
          throw new Error('Firestore not available')
        }

        const query = await this.buildQuery(firestore, { ...options, Stato: 'OPEN' })
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
      },
      { ttl: CACHE_TTL.FILTER_OPTIONS }
    )
  }

  /**
   * Search concorsi by text query
   */
  async searchConcorsi(searchQuery: string, options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    return this.getFilteredConcorsi({ ...options, searchQuery })
  }

  /**
   * Get available filter options for dropdowns/autocomplete (backward compatibility)
   */
  async getAvailableFilterOptions(loadedConcorsi: Concorso[]): Promise<any> {
    console.log('📋 ConcorsiService: Extracting filter options from', loadedConcorsi.length, 'concorsi')
    
    // Extract unique values from loaded data
    const locations = new Set<string>()
    const enti = new Set<string>()
    const settori = new Set<string>()
    const regimi = new Set<string>()
    
    loadedConcorsi.forEach(concorso => {
      // Extract regions from province.regione_nome
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
      const regime = concorso.regime || (concorso as any).regime_impegno
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
   * Load more concorsi (pagination) - backward compatibility
   */
  async loadMoreConcorsi(filters: any, nextCursor: string): Promise<QueryResult> {
    return this.getFilteredConcorsi({
      ...filters,
      startAfterDoc: nextCursor as any // Handle cursor properly
    })
  }

  /**
   * Get concorsi by location (city/area) with intelligent location matching
   * Uses AreaGeografica field and client-side filtering for better location matching
   */
  async getConcorsiByLocation(location: string, options: Partial<QueryOptions> = {}): Promise<QueryResult> {
    const cacheKey = CacheKeys.concorsiList({ location, ...options });
    
    return cachedOperation(
      cacheKey,
      async () => {
        const firestore = await getFirestoreForSSR()
        if (!firestore) {
          throw new Error('Firestore not available')
        }

        // Build base query with other filters
        let query = await this.buildQuery(firestore, { ...options, Stato: options.Stato || 'OPEN' })
        
        // Use a larger limit since we'll filter client-side for location
        const bufferLimit = Math.min((options.limit || 100) * 3, 1000)
        query = query.limit(bufferLimit)

        const snapshot = await query.get()
        const allConcorsi = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Import and use the location filtering utility
        const { filterConcorsiByLocation } = await import('@/lib/utils/region-utils')
        const filteredConcorsi = filterConcorsiByLocation(allConcorsi, location)
        
        // Apply final limit
        const finalConcorsi = filteredConcorsi.slice(0, options.limit || 100)
        
        // Process and serialize the data
        const concorsi = processAndSerializeConcorsi(finalConcorsi.map(c => ({ data: () => c, id: c.id })))

        return {
          concorsi,
          hasMore: filteredConcorsi.length > (options.limit || 100),
          totalCount: finalConcorsi.length,
          metadata: {
            filterType: 'location' as any,
            filterValue: location,
            displayName: location,
            uniqueValues: extractUniqueValues(finalConcorsi, 'location')
          }
        }
      },
      { ttl: CACHE_TTL.CONCORSI_LIST }
    )
  }
}

// Export singleton instance
export const concorsiService = new ConcorsiService()

// Export cached convenience functions for backward compatibility
export const getConcorsiByRegime = cache((regime: string, options: Partial<QueryOptions> = {}) =>
  concorsiService.getConcorsiByRegime(regime, options)
)

export const getConcorsiByScadenza = cache((scadenza: string, options: Partial<QueryOptions> = {}) =>
  concorsiService.getConcorsiByScadenza(scadenza, options)
)

export const getConcorsiByEnte = cache((ente: string, options: Partial<QueryOptions> = {}) =>
  concorsiService.getConcorsiByEnte(ente, options)
)

export const getConcorsiByRegione = cache((regione: string | string[], options: Partial<QueryOptions> = {}) =>
  concorsiService.getConcorsiByRegione(regione, options)
)

export const getConcorsiBySettore = cache((settore: string, options: Partial<QueryOptions> = {}) =>
  concorsiService.getConcorsiBySettore(settore, options)
)

export const getDefaultConcorsi = cache((limit = 25) =>
  concorsiService.getDefaultConcorsi(limit)
)

export const getFilterOptions = cache((
  filter: 'settori' | 'regimi' | 'enti' | 'regioni',
  options: Partial<QueryOptions> = {}
) =>
  concorsiService.getFilterOptions(filter, options)
)

export const searchConcorsi = cache((searchQuery: string, options: Partial<QueryOptions> = {}) =>
  concorsiService.searchConcorsi(searchQuery, options)
)

export const getConcorsiByLocation = cache((location: string, options: Partial<QueryOptions> = {}) =>
  concorsiService.getConcorsiByLocation(location, options)
)
