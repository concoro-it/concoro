import { NextResponse } from 'next/server';
import { getFirestoreForSEO } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getFirestoreForSEO();
    
    // Count all open concorsi
    const openQuery = db.collection('concorsi').where('Stato', 'in', ['open', 'aperto', 'OPEN', 'APERTO']);
    const openSnapshot = await openQuery.get();
    
    // Count all concorsi
    const allQuery = db.collection('concorsi');
    const allSnapshot = await allQuery.get();
    
    return NextResponse.json({
      success: true,
      totalConcorsi: allSnapshot.docs.length,
      openConcorsi: openSnapshot.docs.length,
      closedConcorsi: allSnapshot.docs.length - openSnapshot.docs.length
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


