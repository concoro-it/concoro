import { NextRequest } from 'next/server'
import { getFirestoreForSSR } from '@/lib/firebase/server-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { ente: string } }
) {
  const { ente } = params

  // Decode the ente parameter to get the exact Ente field value
  const exactEnteName = decodeURIComponent(ente)

  // Basic validation - just check if ente is not empty
  if (!exactEnteName || exactEnteName.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Ente parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const firestore = await getFirestoreForSSR()
    if (!firestore) {
      throw new Error('Firestore not available')
    }

    // Query using correct Stato field
    const snapshot = await firestore.collection('concorsi')
      .where('Ente', '==', exactEnteName)
      .where('Stato', '==', 'OPEN')
      .orderBy('publication_date', 'desc')
      .limit(50)
      .get()

    if (snapshot.empty) {
      return new Response(JSON.stringify({ error: 'Ente not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const concorsi = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Extract additional metadata
    const regions = new Set<string>()
    const settori = new Set<string>()
    
    concorsi.forEach(concorso => {
      if (concorso.AreaGeografica) {
        // Simple region extraction - just take the last part after comma
        const parts = concorso.AreaGeografica.split(',')
        if (parts.length > 1) {
          regions.add(parts[parts.length - 1].trim())
        }
      }
      if (concorso.settore_professionale) {
        settori.add(concorso.settore_professionale)
      }
    })

    const enteData = {
      ente: exactEnteName,
      concorsi,
      totalCount: concorsi.length,
      regions: Array.from(regions),
      settori: Array.from(settori).sort(),
      source: 'direct'
    }

    return new Response(JSON.stringify(enteData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching ente data:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
