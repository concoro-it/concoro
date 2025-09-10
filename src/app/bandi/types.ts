// Search parameters from URL
export interface SearchParams {
  page?: string
  sort?: string
  q?: string
  regione?: string
  ente?: string
  settore?: string
  regime?: string
  scadenza?: string
  stato?: string
  location?: string
  postiMin?: string
  postiMax?: string
}

// Page props for Next.js
export interface PageProps {
  searchParams: SearchParams
}

// Parsed and validated parameters
export interface ParsedParams {
  page: number
  sort: string
  searchQuery?: string
  regione?: string[]
  ente?: string
  settore?: string
  regime?: string
  scadenza?: string
  stato: 'open' | 'closed' | 'all'
  location?: string
  numeroPostiMin?: number
  numeroPostiMax?: number
}

// Helper function to parse and validate search parameters
export function parseSearchParams(params: SearchParams): ParsedParams {
  return {
    page: Math.max(1, parseInt(params.page || '1', 10)),
    sort: params.sort || 'publication-desc',
    searchQuery: params.q,
    regione: params.regione?.split(',').filter(Boolean),
    ente: params.ente,
    settore: params.settore,
    regime: params.regime as any,
    scadenza: params.scadenza as any,
    stato: (params.stato || 'open') as 'open' | 'closed' | 'all',
    location: params.location,
    numeroPostiMin: params.postiMin ? parseInt(params.postiMin, 10) : undefined,
    numeroPostiMax: params.postiMax ? parseInt(params.postiMax, 10) : undefined
  }
}