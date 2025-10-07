import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreForSEO } from '@/lib/firebase-admin';
import { Concorso } from '@/types/concorso';

interface ConcorsoDetailResponse {
  concorso: Concorso | null;
  relatedConcorsi?: Concorso[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Concorso ID is required' },
        { status: 400 }
      );
    }

    const db = getFirestoreForSEO();
    
    // Fetch the specific concorso
    const concorsoDoc = await db.collection('concorsi').doc(id).get();
    
    if (!concorsoDoc.exists) {
      return NextResponse.json(
        { error: 'Concorso not found' },
        { status: 404 }
      );
    }

    const concorso = {
      id: concorsoDoc.id,
      ...concorsoDoc.data()
    } as Concorso;

    // Only return if concorso is open/active for SEO purposes
    const validStates = ['open', 'aperto', 'OPEN', 'APERTO'];
    if (!concorso.Stato || !validStates.includes(concorso.Stato)) {
      return NextResponse.json(
        { error: 'Concorso not available' },
        { status: 404 }
      );
    }

    // Fetch related concorsi (same ente or settore)
    let relatedConcorsi: Concorso[] = [];
    
    try {
      const relatedQuery = db.collection('concorsi')
        .where('Stato', 'in', validStates)
        .orderBy('publication_date', 'desc')
        .limit(6);

      const relatedSnapshot = await relatedQuery.get();
      
      relatedConcorsi = relatedSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Concorso)
        .filter(related => 
          related.id !== id && (
            related.Ente === concorso.Ente ||
            related.settore_professionale === concorso.settore_professionale
          )
        )
        .slice(0, 3);
        
    } catch (error) {
      console.warn('Failed to fetch related concorsi:', error);
      // Continue without related concorsi
    }

    const response: ConcorsoDetailResponse = {
      concorso,
      relatedConcorsi: relatedConcorsi.length > 0 ? relatedConcorsi : undefined,
    };

    // Set cache headers for SEO optimization
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800', // 10min cache, 30min stale
    });

    return new NextResponse(JSON.stringify(response), { headers });
    
  } catch (error) {
    console.error('Error fetching concorso details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concorso details' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60'
    }
  });
}
