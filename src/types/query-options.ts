import { ScadenzaFilter, RegimeFilter } from '@/lib/services/regional-queries'
import * as admin from 'firebase-admin'

// Re-export the filter types for external use
export type { ScadenzaFilter, RegimeFilter }

export interface ConcorsiQueryOptions {
  // Search and text filters
  searchQuery?: string
  locationQuery?: string // For location-based text search
  tags?: string[]
  
  // Location filters
  regione?: string[]
  areaGeografica?: string
  
  // Organization filters
  ente?: string
  selectedEnti?: string[] // Multiple enti support
  
  // Category filters
  settore?: string
  selectedSettori?: string[] // Multiple settori support
  regime?: RegimeFilter
  selectedRegimi?: string[] // Multiple regimi support
  
  // Status filters
  Stato?: 'OPEN' | 'CHIUSO' | 'ALL'
  stato?: 'open' | 'closed' | 'all' // API format
  selectedStati?: string[] // Multiple stati support
  scadenza?: ScadenzaFilter
  selectedDeadlines?: string[] // Multiple deadline filters
  
  // Numeric filters
  numeroPostiMin?: number
  numeroPostiMax?: number
  
  // Pagination and sorting
  page?: number
  currentPage?: number
  limit?: number
  startAfterDoc?: admin.firestore.DocumentSnapshot
  orderByField?: 'publication_date' | 'DataChiusura'
  orderDirection?: 'asc' | 'desc'
  sortBy?: string // UI-friendly sort format
  
  // Pagination cursor
  nextCursor?: string
  cursorId?: string
  
  // Optimization options
  indexId?: string // Optional index ID for optimized queries
  
  // UI-specific options
  selectedLocations?: string[] // Multiple location filters
  selectedCategory?: string // Category selection
}

export interface ConcorsiQueryResult {
  concorsi: any[]
  totalCount?: number
  hasMore: boolean
  lastDoc?: admin.firestore.DocumentSnapshot
  nextCursor?: string
  appliedFilters?: Partial<ConcorsiQueryOptions>
}

// Helper type for API response
export interface ConcorsiApiResponse {
  concorsi: any[]
  metadata: {
    totalCount: number
    currentPage: number
    hasMore: boolean
    nextCursor?: string
    appliedFilters: Partial<ConcorsiQueryOptions>
  }
  error?: string
}

// Enhanced filter options interface for UI components
export interface FilterOptions {
  locations: string[]
  enti: string[]
  settori: string[]
  regimi: string[]
  stati: Array<{ label: string; value: string }>
  deadlineOptions: Array<{ label: string; value: string }>
  sortOptions: Array<{ label: string; value: string }>
}
