import { NextRequest, NextResponse } from 'next/server'
import { getRegionalConcorsi, RegionalQueryOptions, ScadenzaFilter, RegimeFilter } from '@/lib/services/regional-queries'
import { getFirestoreForSSR } from '@/lib/firebase/server-config'
import { serializeFirestoreData } from '@/lib/utils/serialize-firestore'

export const dynamic = 'force-dynamic' // Ensure the route is always dynamic

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters with proper type handling
    const searchQuery = searchParams.get('q') || undefined
    const regione = searchParams.get('regione')?.split(',').filter(Boolean) || undefined
    const province = searchParams.get('province')?.split(',').filter(Boolean) || undefined
    const ente = searchParams.get('ente') || undefined
    const settore = searchParams.get('settore') || undefined
    const stato = searchParams.get('stato') as 'open' | 'closed' | 'all' || 'open'
    const scadenza = searchParams.get('scadenza') as ScadenzaFilter || undefined
    const regime = searchParams.get('regime') as RegimeFilter || undefined
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    const orderByField = searchParams.get('orderByField') as 'publication_date' | 'DataChiusura' || 'publication_date'
    const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'desc'
    const cursorId = searchParams.get('cursorId') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)

    // Additional filters
    const numeroPostiMin = searchParams.get('postiMin') ? parseInt(searchParams.get('postiMin')!, 10) : undefined
    const numeroPostiMax = searchParams.get('postiMax') ? parseInt(searchParams.get('postiMax')!, 10) : undefined
    const areaGeografica = searchParams.get('location') || undefined
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined

    // Get cursor document if provided
    let startAfterDoc
    if (cursorId) {
      const firestore = await getFirestoreForSSR()
      if (!firestore) {
        throw new Error('Firestore not available')
      }
      const docRef = await firestore.collection('concorsi').doc(cursorId).get()
      if (docRef.exists) {
        startAfterDoc = docRef
      }
    }
    
    // Build query options
    const options: RegionalQueryOptions = {
      searchQuery,
      regione: province || regione, // Use province parameter if provided, fallback to regione for compatibility
      ente,
      settore,
      stato,
      scadenza,
      regime,
      limit,
      orderByField,
      orderDirection,
      startAfterDoc,
      numeroPostiMin,
      numeroPostiMax,
      areaGeografica,
      tags,
      page
    }
    
    // Execute query
    const result = await getRegionalConcorsi(options)
    
    // Process results
    const concorsi = result.hasMore ? result.concorsi.slice(0, -1) : result.concorsi
    const lastDoc = result.hasMore ? result.concorsi[result.concorsi.length - 1] : null

    // Serialize the response
    const serializedConcorsi = concorsi.map(concorso => ({
      id: String(concorso.id),
      Titolo: String(concorso.Titolo || ''),
      Ente: String(concorso.Ente || ''),
      AreaGeografica: String(concorso.AreaGeografica || ''),
      province: Array.isArray(concorso.province) ? concorso.province : [],
      numero_di_posti: Number(concorso.numero_di_posti) || null,
      settore_professionale: String(concorso.settore_professionale || ''),
      regime: String(concorso.regime || ''),
      DataChiusura: serializeFirestoreData(concorso.DataChiusura),
      riassunto: String(concorso.riassunto || ''),
      publication_date: serializeFirestoreData(concorso.publication_date),
      stato: String(concorso.stato || concorso.Stato || ''),
      tags: Array.isArray(concorso.tags) ? concorso.tags : []
    }))
    
    // Return response with metadata
    return NextResponse.json({
      concorsi: serializedConcorsi,
      metadata: {
        totalCount: result.totalCount || concorsi.length,
        currentPage: page,
        hasMore: result.hasMore,
        nextCursor: lastDoc?.id,
        appliedFilters: {
          searchQuery,
          regione: province || regione,
          province,
          ente,
          settore,
          stato,
          scadenza,
          regime,
          numeroPostiMin,
          numeroPostiMax,
          areaGeografica,
          tags
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in concorsi API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch concorsi', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
