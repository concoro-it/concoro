import { NextRequest, NextResponse } from 'next/server'
import { concorsiService } from '@/lib/services/concorsi-service'
import { Concorso } from '@/types/concorso'

export const dynamic = 'force-dynamic'

interface BandiQueryParams {
  Stato?: 'OPEN' | 'CHIUSO'
  sort?: 'deadline_asc' | 'deadline_desc' | 'publication_desc'
  page?: number
  per_page?: number
}

interface BandiResponse {
  data: Concorso[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  filters_applied: BandiQueryParams
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters - simplified with page pagination
    const params: BandiQueryParams = {
      Stato: (searchParams.get('Stato') as 'OPEN' | 'CHIUSO') || 'OPEN',
      sort: (searchParams.get('sort') as 'deadline_asc' | 'deadline_desc' | 'publication_desc') || 'publication_desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      per_page: Math.min(parseInt(searchParams.get('per_page') || '20', 10), 100) // Max 100 items per page
    }

    console.log('🔍 Bandi API Query (Page Pagination):', params)

    // Convert page-based pagination to cursor-based for the service
    // For page-based pagination, we need to calculate the offset and get the appropriate cursor
    let startAfterDoc = undefined
    
    if (params.page! > 1) {
      try {
        // Get the cursor for the previous page by fetching the last item of the previous page
        const previousPageLimit = (params.page! - 1) * params.per_page!
        const firestore = await import('@/lib/firebase/server-config').then(m => m.getFirestoreForSSR())
        
        if (firestore) {
          const orderField = (params.sort === 'deadline_asc' || params.sort === 'deadline_desc'
            ? 'DataChiusura'
            : 'publication_date')
          const orderDirection = (params.sort === 'deadline_asc' ? 'asc' : 'desc')
          
          // Get the last document from the previous page
          const cursorQuery = firestore.collection('concorsi')
            .where('Stato', '==', 'OPEN')
            .orderBy(orderField, orderDirection)
            .limit(previousPageLimit)
          
          const cursorSnapshot = await cursorQuery.get()
          if (!cursorSnapshot.empty) {
            startAfterDoc = cursorSnapshot.docs[cursorSnapshot.docs.length - 1]
            console.log(`📍 Using cursor for page ${params.page}: ${startAfterDoc.id}`)
          }
        }
      } catch (error) {
        console.warn('Failed to get cursor for page pagination:', error)
      }
    }

    // Use the unified service with cursor-based pagination
    const queryOptions = {
      Stato: params.Stato,
      limit: params.per_page!,
      startAfterDoc: startAfterDoc,
      orderByField: (params.sort === 'deadline_asc' || params.sort === 'deadline_desc'
        ? 'DataChiusura'
        : 'publication_date') as 'DataChiusura' | 'publication_date',
      orderDirection: (params.sort === 'deadline_asc' ? 'asc' : 'desc') as 'asc' | 'desc'
    }

    const result = await concorsiService.getFilteredConcorsi(queryOptions)

    // Get total count - for now using a reasonable estimate
    // TODO: Implement proper count query in the backend service
    let totalCount = result.totalCount || result.concorsi.length
    
    // If we got a full page and there might be more, estimate higher
    if (result.concorsi.length === params.per_page! && result.hasMore) {
      // Estimate based on page size and current page
      totalCount = Math.max(1700, params.per_page! * params.page! * 2)
    } else if (result.concorsi.length < params.per_page!) {
      // This is likely the last page
      totalCount = (params.page! - 1) * params.per_page! + result.concorsi.length
    }
    
    console.log(`📊 Estimated total count: ${totalCount} (page ${params.page}, ${result.concorsi.length} items)`)
    
    const totalPages = Math.ceil(totalCount / params.per_page!)
    
    const response: BandiResponse = {
      data: result.concorsi,
      pagination: {
        page: params.page!,
        per_page: params.per_page!,
        total: totalCount,
        total_pages: totalPages,
        has_next: params.page! < totalPages,
        has_prev: params.page! > 1
      },
      filters_applied: params
    }

    console.log(`✅ Bandi API completed (Page Pagination): ${result.concorsi.length} results, page ${params.page}/${totalPages}`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error in bandi API:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch bandi',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}