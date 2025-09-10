import { NextRequest, NextResponse } from 'next/server'
import { getRegionalConcorsi, getDefaultBandiPage, RegionalQueryOptions, ScadenzaFilter, RegimeFilter } from '@/lib/services/regional-queries'
import { getFirestoreForSSR } from '@/lib/firebase/server-config'

// Force dynamic to prevent any caching
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const regione = searchParams.get('regione')?.split(',').filter(Boolean) || undefined
    const ente = searchParams.get('ente') || undefined
    const settore = searchParams.get('settore') || undefined
    const stato = searchParams.get('stato') as 'open' | 'closed' | 'all' || 'open'
    const scadenza = searchParams.get('scadenza') as ScadenzaFilter || undefined
    const regime = searchParams.get('regime') as RegimeFilter || undefined
    const limit = parseInt(searchParams.get('limit') || '25', 10) // Default to 25 items per page
    const orderByField = searchParams.get('orderByField') as 'publication_date' | 'DataChiusura' || 'publication_date'
    const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'desc'
    const cursorId = searchParams.get('cursorId') || undefined
    
    // If cursorId is provided, get the document to use as cursor
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
    
    // Check if this is the default /bandi page query (no filters, just stato=open)
    const isDefaultQuery = !regione && !ente && !settore && !scadenza && !regime && 
                           stato === 'open' && orderByField === 'publication_date' && 
                           orderDirection === 'desc' && !cursorId
    
    let result
    if (isDefaultQuery) {
      // Use the optimized default query with the specific index
      console.log('🚀 Using optimized default bandi page query')
      result = await getDefaultBandiPage(limit)
    } else {
      // Use the general regional query for filtered requests
      const options: RegionalQueryOptions = {
        regione,
        ente,
        settore,
        stato,
        scadenza,
        regime,
        limit,
        orderByField,
        orderDirection,
        startAfterDoc
      }
      
      result = await getRegionalConcorsi(options)
    }
    
    // Remove the last item since it will be the first item in the next page
    const concorsi = result.hasMore ? result.concorsi.slice(0, -1) : result.concorsi
    const lastDoc = result.hasMore ? result.concorsi[result.concorsi.length - 1] : null
    
    const response = NextResponse.json({
      concorsi,
      nextCursor: lastDoc?.id,
      hasMore: result.hasMore
    })
    
    // Ensure fresh data by disabling caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('❌ Error in regional-concorsi API:', error)
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch regional concorsi', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
    
    // Ensure error responses are also not cached
    errorResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    return errorResponse
  }
}
