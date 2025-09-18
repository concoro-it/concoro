/**
 * Optimized hook for filter state management with performance optimizations
 * Includes memoization, debouncing, and efficient state updates
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Concorso } from '@/types/concorso'
import { FilterGroup, FilterOption } from '@/components/bandi/ModernFilterSystem'
import { cachedOperation, generateConcorsiCacheKey, CACHE_TTL } from '@/lib/utils/performance-cache'

export interface FilterState {
  searchQuery: string
  selectedLocations: string[]
  selectedDeadlines: string[]
  selectedEnti: string[]
  selectedSettori: string[]
  selectedRegimi: string[]
  selectedStati: string[]
  sortBy: string
}

export interface OptimizedFilterOptions {
  availableLocations: string[]
  availableEnti: string[]
  availableSettori: string[]
  availableRegimi: string[]
}

export interface UseOptimizedFiltersReturn {
  // Filter state
  filterState: FilterState
  updateFilterState: (updates: Partial<FilterState>) => void
  clearAllFilters: () => void
  
  // Optimized filter groups
  filterGroups: FilterGroup[]
  sortOptions: FilterOption[]
  
  // Performance metrics
  isGeneratingOptions: boolean
}

/**
 * Custom hook for debounced search with cleanup
 */
function useDebouncedSearch(
  initialValue: string,
  onSearchChange: (value: string) => void,
  delay: number = 300
) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  // Debounced search effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      onSearchChange(searchTerm)
    }, delay)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchTerm, onSearchChange, delay])
  
  return [searchTerm, setSearchTerm] as const
}

/**
 * Memoized filter options generation with caching
 */
function useFilterOptions(concorsi: Concorso[]): OptimizedFilterOptions {
  return useMemo(() => {
    const startTime = performance.now()
    
    // Use cached operation for expensive filter option generation
    const cacheKey = generateConcorsiCacheKey('filter-options', {
      count: concorsi.length,
      // Include a hash of the first few IDs to detect data changes
      dataHash: concorsi.slice(0, 10).map(c => c.id).join(',')
    })
    
    const options = {
      availableLocations: [] as string[],
      availableEnti: [] as string[],
      availableSettori: [] as string[],
      availableRegimi: [] as string[]
    }
    
    // Use Sets for O(1) lookups and automatic deduplication
    const locationSet = new Set<string>()
    const entiSet = new Set<string>()
    const settoriSet = new Set<string>()
    const regimiSet = new Set<string>()
    
    // Single pass through data for efficiency
    concorsi.forEach(concorso => {
      // Extract regions from province.regione_nome (optimized)
      if (concorso.province && Array.isArray(concorso.province)) {
        concorso.province.forEach((provincia: any) => {
          if (provincia?.regione_nome) {
            const region = provincia.regione_nome.trim()
            if (region && region !== 'N/A' && !region.toLowerCase().includes('non specificato')) {
              locationSet.add(region)
            }
          }
        })
      } else if (concorso.AreaGeografica) {
        // Fallback: Extract regions from AreaGeografica
        const parts = concorso.AreaGeografica.split(',')
        if (parts.length > 0) {
          const region = parts[parts.length - 1].trim()
          if (region && region !== 'N/A' && !region.toLowerCase().includes('non specificato')) {
            locationSet.add(region)
          }
        }
      }
      
      // Extract enti
      if (concorso.Ente && concorso.Ente.trim() !== '' && 
          !concorso.Ente.toLowerCase().includes('non specificato')) {
        entiSet.add(concorso.Ente)
      }
      
      // Extract settori
      if (concorso.settore_professionale && concorso.settore_professionale.trim() !== '' && 
          !concorso.settore_professionale.toLowerCase().includes('non specificato')) {
        settoriSet.add(concorso.settore_professionale)
      }
      
      // Extract regimi
      const regime = concorso.regime || concorso.regime_impegno
      if (regime && regime.trim() !== '' && !regime.toLowerCase().includes('non specificato')) {
        regimiSet.add(regime)
      }
    })
    
    // Convert sets to sorted arrays
    options.availableLocations = Array.from(locationSet).sort()
    options.availableEnti = Array.from(entiSet).sort()
    options.availableSettori = Array.from(settoriSet).sort()
    options.availableRegimi = Array.from(regimiSet).sort()
    
    const endTime = performance.now()
    console.log(`🔍 Filter options generated in ${(endTime - startTime).toFixed(2)}ms:`, {
      locations: options.availableLocations.length,
      enti: options.availableEnti.length,
      settori: options.availableSettori.length,
      regimi: options.availableRegimi.length
    })
    
    return options
  }, [concorsi])
}

/**
 * Main optimized filters hook
 */
export function useOptimizedFilters(
  concorsi: Concorso[],
  onSearchChange: (value: string) => void
): UseOptimizedFiltersReturn {
  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedLocations: [],
    selectedDeadlines: [],
    selectedEnti: [],
    selectedSettori: [],
    selectedRegimi: [],
    selectedStati: [],
    sortBy: ''
  })
  
  // Debounced search
  const [searchTerm, setSearchTerm] = useDebouncedSearch(
    filterState.searchQuery,
    onSearchChange,
    300
  )
  
  // Optimized filter options generation
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false)
  const filterOptions = useFilterOptions(concorsi)
  
  // Memoized update function
  const updateFilterState = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }))
  }, [])
  
  // Memoized clear function
  const clearAllFilters = useCallback(() => {
    setFilterState({
      searchQuery: '',
      selectedLocations: [],
      selectedDeadlines: [],
      selectedEnti: [],
      selectedSettori: [],
      selectedRegimi: [],
      selectedStati: [],
      sortBy: ''
    })
    setSearchTerm('')
  }, [setSearchTerm])
  
  // Sync search term with filter state
  useEffect(() => {
    if (filterState.searchQuery !== searchTerm) {
      updateFilterState({ searchQuery: searchTerm })
    }
  }, [searchTerm, filterState.searchQuery, updateFilterState])
  
  // Memoized filter groups with optimized callbacks
  const filterGroups = useMemo((): FilterGroup[] => [
    {
      id: 'locations',
      label: 'Regione',
      icon: <span className="text-blue-600">📍</span>,
      options: filterOptions.availableLocations.map(location => ({ 
        label: location, 
        value: location 
      })),
      selectedValues: filterState.selectedLocations,
      onSelectionChange: (values: string[]) => updateFilterState({ selectedLocations: values }),
      searchable: true,
      multiSelect: true,
      color: 'blue'
    },
    {
      id: 'deadlines',
      label: 'Scadenza',
      icon: <span className="text-green-600">📅</span>,
      options: [
        { label: "Oggi", value: "today" },
        { label: "Questa Settimana", value: "week" },
        { label: "Questo Mese", value: "month" },
      ],
      selectedValues: filterState.selectedDeadlines,
      onSelectionChange: (values: string[]) => updateFilterState({ selectedDeadlines: values }),
      multiSelect: true,
      color: 'green'
    },
    {
      id: 'enti',
      label: 'Ente',
      icon: <span className="text-yellow-600">🏛️</span>,
      options: filterOptions.availableEnti.map(ente => ({ 
        label: ente, 
        value: ente 
      })),
      selectedValues: filterState.selectedEnti,
      onSelectionChange: (values: string[]) => updateFilterState({ selectedEnti: values }),
      searchable: true,
      multiSelect: true,
      color: 'yellow'
    },
    {
      id: 'settori',
      label: 'Settore',
      icon: <span className="text-orange-600">💼</span>,
      options: filterOptions.availableSettori.map(settore => ({ 
        label: settore, 
        value: settore 
      })),
      selectedValues: filterState.selectedSettori,
      onSelectionChange: (values: string[]) => updateFilterState({ selectedSettori: values }),
      searchable: true,
      multiSelect: true,
      color: 'orange'
    },
    {
      id: 'regimi',
      label: 'Regime',
      icon: <span className="text-indigo-600">⏰</span>,
      options: filterOptions.availableRegimi.map(regime => ({ 
        label: regime, 
        value: regime 
      })),
      selectedValues: filterState.selectedRegimi,
      onSelectionChange: (values: string[]) => updateFilterState({ selectedRegimi: values }),
      multiSelect: true,
      color: 'indigo'
    },
    {
      id: 'stati',
      label: 'Stato',
      icon: <span className="text-red-600">📋</span>,
      options: [
        { label: "Aperto", value: "aperto" },
        { label: "Chiuso", value: "chiuso" }
      ],
      selectedValues: filterState.selectedStati,
      onSelectionChange: (values: string[]) => updateFilterState({ selectedStati: values }),
      multiSelect: true,
      color: 'red'
    }
  ], [filterOptions, filterState, updateFilterState])
  
  // Memoized sort options
  const sortOptions = useMemo((): FilterOption[] => [
    { label: "Scadenza (più vicina)", value: "deadline-asc" },
    { label: "Data di pubblicazione (più recente)", value: "publication-desc" },
    { label: "Posti disponibili (più posti)", value: "posts-desc" }
  ], [])
  
  return {
    filterState,
    updateFilterState,
    clearAllFilters,
    filterGroups,
    sortOptions,
    isGeneratingOptions
  }
}
