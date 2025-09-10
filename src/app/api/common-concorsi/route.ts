import { NextRequest, NextResponse } from 'next/server'
import { getConcorsiByFilter, CommonFilterOptions } from '@/lib/services/common-concorsi-api'
import { serializeFirestoreData } from '@/lib/utils/serialize-firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filter type and value
    const filterType = searchParams.get('filterType') as 'regime' | 'scadenza' | 'Ente' | 'regione' | 'settore'
    const filterValue = searchParams.get('filterValue')
    
    if (!filterType || !filterValue) {
      return NextResponse.json({ error: 'filterType and filterValue are required' }, { status: 400 })
    }
    
    // Parse filter value (handle arrays)
    let parsedFilterValue: string | string[]
    if (filterValue.includes(',')) {
      parsedFilterValue = filterValue.split(',')
    } else {
      parsedFilterValue = filterValue
    }
    
    // Parse other options
    const Stato = (searchParams.get('Stato') as 'OPEN' | 'CHIUSO' | 'all') || 'OPEN'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const orderByField = (searchParams.get('orderByField') as 'publication_date' | 'DataChiusura') || 'publication_date'
    const orderDirection = (searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc'
    
    // Parse additional filters
    const additionalFilters: any = {}
    
    const additionalRegione = searchParams.get('additionalRegione')
    if (additionalRegione) {
      additionalFilters.regione = additionalRegione.split(',')
    }
    
    const additionalEnte = searchParams.get('additionalEnte')
    if (additionalEnte) {
      additionalFilters.Ente = additionalEnte
    }
    
    const additionalSettore = searchParams.get('additionalSettore')
    if (additionalSettore) {
      additionalFilters.settore = additionalSettore
    }
    
    const additionalScadenza = searchParams.get('additionalScadenza')
    if (additionalScadenza) {
      additionalFilters.scadenza = additionalScadenza as 'oggi' | 'questa-settimana' | 'questo-mese'
    }
    
    const additionalRegime = searchParams.get('additionalRegime')
    if (additionalRegime) {
      additionalFilters.regime = additionalRegime as 'part-time' | 'tempo-determinato' | 'tempo-indeterminato' | 'non-specificato'
    }
    
    // Build options
    const options: CommonFilterOptions = {
      filterType,
      filterValue: parsedFilterValue,
      Stato,
      limit,
      orderByField,
      orderDirection,
      additionalFilters: Object.keys(additionalFilters).length > 0 ? additionalFilters : undefined
    }
    
    console.log('🔍 API: Executing common concorsi query:', options)
    
    // Execute query
    const result = await getConcorsiByFilter(options)
    
    // Serialize Firestore data for client
    const serializedResult = {
      ...result,
      concorsi: result.concorsi.map(concorso => serializeFirestoreData(concorso)),
      lastDoc: result.lastDoc ? serializeFirestoreData(result.lastDoc) : undefined
    }
    
    console.log(`✅ API: Common concorsi query completed: ${result.concorsi.length} docs`)
    
    return NextResponse.json(serializedResult)
    
  } catch (error) {
    console.error('❌ API: Error in common concorsi query:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
