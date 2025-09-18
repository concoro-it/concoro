import { getItalianRegions } from './region-utils'

export interface ProvinceWithRegion {
  provincia_nome: string
  regione_nome: string
  concorsiCount: number
}

export interface RegionWithProvinces {
  regione_nome: string
  provinces: ProvinceWithRegion[]
  totalConcorsi: number
}

/**
 * Categorize provinces by their regions
 */
export function categorizeProvincesByRegion(
  concorsi: Array<{ province?: Array<{ regione_nome: string; provincia_nome?: string }> }>
): RegionWithProvinces[] {
  const regionMap = new Map<string, Map<string, ProvinceWithRegion>>()
  
  // Extract all province data from concorsi
  concorsi.forEach(concorso => {
    if (Array.isArray(concorso.province)) {
      concorso.province.forEach(p => {
        if (p.regione_nome && p.provincia_nome) {
          const regione = p.regione_nome.trim()
          const provincia = p.provincia_nome.trim()
          
          if (!regionMap.has(regione)) {
            regionMap.set(regione, new Map())
          }
          
          const provinceMap = regionMap.get(regione)!
          if (!provinceMap.has(provincia)) {
            provinceMap.set(provincia, {
              provincia_nome: provincia,
              regione_nome: regione,
              concorsiCount: 0
            })
          }
          
          // Count concorsi for this province
          const provinceData = provinceMap.get(provincia)!
          provinceData.concorsiCount++
        }
      })
    }
  })
  
  // Convert to array format and sort
  const regions: RegionWithProvinces[] = []
  
  regionMap.forEach((provinceMap, regione_nome) => {
    const provinces = Array.from(provinceMap.values())
      .sort((a, b) => a.provincia_nome.localeCompare(b.provincia_nome))
    
    const totalConcorsi = provinces.reduce((sum, p) => sum + p.concorsiCount, 0)
    
    regions.push({
      regione_nome,
      provinces,
      totalConcorsi
    })
  })
  
  // Sort regions alphabetically
  regions.sort((a, b) => a.regione_nome.localeCompare(b.regione_nome))
  
  return regions
}

/**
 * Get a slug-friendly version of a region name for URLs
 */
export function getRegionSlug(regione_nome: string): string {
  return regione_nome
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Get a slug-friendly version of a province name for URLs
 */
export function getProvinceSlug(provincia_nome: string): string {
  return provincia_nome
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Check if a string is a valid Italian region name
 */
export function isValidRegion(regionName: string): boolean {
  const regions = getItalianRegions()
  return regions.some(region => 
    region.toLowerCase() === regionName.toLowerCase()
  )
}
