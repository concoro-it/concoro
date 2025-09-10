import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { Concorso } from '@/types/concorso';

/**
 * Server-side concorsi services using Firebase Admin SDK
 * Use these functions for server-side operations like sitemap generation
 */

/**
 * Fetches all active concorsi using Firebase Admin (server-side)
 * Only includes concorsi that are open/active for sitemap
 */
export const getAllActiveConcorsiServer = async (limitCount?: number): Promise<Concorso[]> => {
  try {
    const firestore = initializeFirebaseAdmin();
    const concorsiRef = firestore.collection('concorsi');
    
    let query = concorsiRef.orderBy('publication_date', 'desc');
    if (limitCount) {
      query = query.limit(limitCount);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }
    
    // Filter to only include active/open concorsi
    const concorsi = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Concorso))
      .filter(concorso => {
        const status = concorso.Stato?.toLowerCase();
        return status === 'open' || status === 'aperto' || status === 'aperti' || !status;
      });
    
    return concorsi;
  } catch (error) {
    console.error('Error fetching active concorsi (server):', error);
    throw error;
  }
};

/**
 * Fetches a concorso by its ID using Firebase Admin (server-side)
 */
export const getConcorsoByIdServer = async (concorsoId: string): Promise<Concorso | null> => {
  try {
    const firestore = initializeFirebaseAdmin();
    const concorsoRef = firestore.collection('concorsi').doc(concorsoId);
    const concorsoSnap = await concorsoRef.get();
    
    if (!concorsoSnap.exists) {
      return null;
    }
    
    return {
      id: concorsoSnap.id,
      ...concorsoSnap.data(),
    } as Concorso;
  } catch (error) {
    console.error('Error fetching concorso by ID (server):', error);
    throw error;
  }
};
