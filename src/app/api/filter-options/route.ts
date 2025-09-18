import { NextRequest, NextResponse } from 'next/server'
import { concorsiService } from '@/lib/services/concorsi-service'
import { cachedOperation, CACHE_TTL } from '@/lib/cache/unified-cache'

export const dynamic = 'force-dynamic'

interface FilterOptionsResponse {
  locations: string[]
  enti: string[]
  settori: string[]
  regimi: string[]
  stati: Array<{ label: string; value: string }>
  deadlineOptions: Array<{ label: string; value: string }>
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Filter Options API: Fetching global filter options')
    
    const filterOptions = await cachedOperation(
      'global-filter-options',
      async (): Promise<FilterOptionsResponse> => {
        // Get unique values from the database
        const [locations, enti, settori, regimi] = await Promise.all([
          getUniqueFieldValues('province.regione_nome'),
          getUniqueFieldValues('Ente'),
          getUniqueFieldValues('settore_professionale'),
          getUniqueFieldValues('regime_impegno')
        ])

        return {
          locations: locations.filter(loc => loc && loc.trim() !== '' && !loc.toLowerCase().includes('non specificato')),
          enti: enti.filter(ente => ente && ente.trim() !== '' && !ente.toLowerCase().includes('non specificato')),
          settori: settori.filter(settore => settore && settore.trim() !== '' && !settore.toLowerCase().includes('non specificato')),
          regimi: regimi.filter(regime => regime && regime.trim() !== '' && !regime.toLowerCase().includes('non specificato')),
          stati: [
            { label: "Aperto", value: "aperto" },
            { label: "Chiuso", value: "chiuso" }
          ],
          deadlineOptions: [
            { label: "Oggi", value: "today" },
            { label: "Questa Settimana", value: "week" },
            { label: "Questo Mese", value: "month" }
          ]
        }
      },
      {
        ttl: CACHE_TTL.FILTER_OPTIONS
      }
    )

    console.log(`✅ Filter Options API: Retrieved ${filterOptions.locations.length} locations, ${filterOptions.enti.length} enti, ${filterOptions.settori.length} settori, ${filterOptions.regimi.length} regimi`)

    return NextResponse.json(filterOptions)

  } catch (error) {
    console.error('❌ Error in filter options API:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch filter options',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Get unique values for a specific field from the database
 */
async function getUniqueFieldValues(fieldPath: string): Promise<string[]> {
  try {
    // Use the existing service to get a sample of concorsi
    const result = await concorsiService.getDefaultConcorsi(500) // Get more for better coverage
    const uniqueValues = new Set<string>()
    
    result.concorsi.forEach((concorso: any) => {
      let value: any
      
      switch (fieldPath) {
        case 'province.regione_nome':
          if (concorso.province && Array.isArray(concorso.province)) {
            concorso.province.forEach((provincia: any) => {
              if (provincia && provincia.regione_nome) {
                uniqueValues.add(provincia.regione_nome.trim())
              }
            })
          } else if (concorso.AreaGeografica) {
            // Fallback: Extract region from AreaGeografica
            const parts = concorso.AreaGeografica.split(',')
            if (parts.length > 0) {
              const region = parts[parts.length - 1].trim()
              if (region) uniqueValues.add(region)
            }
          }
          break
          
        case 'Ente':
          value = concorso.Ente
          break
          
        case 'settore_professionale':
          value = concorso.settore_professionale
          break
          
        case 'regime_impegno':
          value = concorso.regime || concorso.regime_impegno
          break
      }
      
      if (value && typeof value === 'string' && value.trim() !== '') {
        uniqueValues.add(value.trim())
      }
    })
    
    return Array.from(uniqueValues).sort()
    
  } catch (error) {
    console.error(`Error getting unique values for ${fieldPath}:`, error)
    return []
  }
}
