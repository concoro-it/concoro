import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { Articolo, ArticoloWithConcorso } from '@/types';
import { isDocumentId, isSlug } from '@/lib/utils/slug-utils';

/**
 * Server-side blog services using Firebase Admin SDK
 * Use these functions for server-side operations like static generation
 */

/**
 * Fetches all articles using Firebase Admin (server-side)
 */
export const getAllArticoliServer = async (limitCount?: number): Promise<Articolo[]> => {
  try {
    const firestore = initializeFirebaseAdmin();
    const articoliRef = firestore.collection('articoli');
    
    let query = articoliRef.orderBy('publication_date', 'desc');
    if (limitCount) {
      query = query.limit(limitCount);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Articolo));
  } catch (error) {
    console.error('Error fetching articoli (server):', error);
    throw error;
  }
};

/**
 * Fetches all articles with their concorso data for sitemap generation (server-side)
 * This is optimized for sitemap generation by fetching concorsi in batch
 */
export const getAllArticoliWithConcorsoForSitemapServer = async (): Promise<ArticoloWithConcorso[]> => {
  try {
    const firestore = initializeFirebaseAdmin();
    
    // Fetch all articles
    const articoliRef = firestore.collection('articoli');
    const articoliSnapshot = await articoliRef.orderBy('publication_date', 'desc').get();
    
    if (articoliSnapshot.empty) {
      return [];
    }
    
    const articoli = articoliSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Articolo));
    
    // Extract unique concorso IDs
    const concorsoIds = Array.from(new Set(
      articoli.map(a => a.concorso_id).filter(Boolean)
    ));
    
    // Fetch concorsi in batches (Firestore 'in' query supports max 10 items)
    const concorsiMap = new Map();
    const batchSize = 10;
    
    for (let i = 0; i < concorsoIds.length; i += batchSize) {
      const batch = concorsoIds.slice(i, i + batchSize);
      const concorsiSnapshot = await firestore
        .collection('concorsi')
        .where('__name__', 'in', batch)
        .get();
      
      concorsiSnapshot.docs.forEach(doc => {
        concorsiMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    }
    
    // Combine articles with their concorso data
    return articoli.map(articolo => ({
      ...articolo,
      concorso: concorsiMap.get(articolo.concorso_id) || undefined,
    } as ArticoloWithConcorso));
    
  } catch (error) {
    console.error('Error fetching articoli with concorso for sitemap (server):', error);
    throw error;
  }
};

/**
 * Fetches an article by its ID using Firebase Admin (server-side)
 */
export const getArticoloByIdServer = async (articoloId: string): Promise<Articolo | null> => {
  try {
    const firestore = initializeFirebaseAdmin();
    const articoloRef = firestore.collection('articoli').doc(articoloId);
    const articoloSnap = await articoloRef.get();
    
    if (!articoloSnap.exists) {
      return null;
    }
    
    return {
      id: articoloSnap.id,
      ...articoloSnap.data(),
    } as Articolo;
  } catch (error) {
    console.error('Error fetching articolo by ID (server):', error);
    throw error;
  }
};

/**
 * Fetches an article by its slug using Firebase Admin (server-side)
 */
export const getArticoloBySlugServer = async (slug: string): Promise<Articolo | null> => {
  try {
    const firestore = initializeFirebaseAdmin();
    const articoliRef = firestore.collection('articoli');
    const snapshot = await articoliRef.where('slug', '==', slug).limit(1).get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Articolo;
  } catch (error) {
    console.error('Error fetching articolo by slug (server):', error);
    throw error;
  }
};

/**
 * Fetch an article by slug or ID and include its concorso (server-side)
 */
export const getArticoloWithConcorsoBySlugOrIdServer = async (
  slugOrId: string
): Promise<ArticoloWithConcorso | null> => {
  try {
    const firestore = initializeFirebaseAdmin();

    // Resolve article by slug or id
    let articolo: Articolo | null = null;
    if (isSlug(slugOrId)) {
      articolo = await getArticoloBySlugServer(slugOrId);
    }
    if (!articolo && isDocumentId(slugOrId)) {
      articolo = await getArticoloByIdServer(slugOrId);
    }
    if (!articolo) {
      // final fallback: try both
      articolo = (await getArticoloBySlugServer(slugOrId)) || (await getArticoloByIdServer(slugOrId));
    }
    if (!articolo) return null;

    // Fetch concorso by concorso_id
    const concorsoRef = firestore.collection('concorsi').doc(articolo.concorso_id);
    const concorsoSnap = await concorsoRef.get();

    if (!concorsoSnap.exists) {
      return { ...articolo, concorso: undefined } as ArticoloWithConcorso;
    }

    return {
      ...articolo,
      concorso: { id: concorsoSnap.id, ...concorsoSnap.data() } as any,
    } as ArticoloWithConcorso;
  } catch (error) {
    console.error('Error fetching articolo with concorso (server):', error);
    throw error;
  }
};

/**
 * Fetches articles by tag using Firebase Admin (server-side)
 */
export const getArticoliByTagServer = async (tag: string, limitCount = 50): Promise<Articolo[]> => {
  try {
    const firestore = initializeFirebaseAdmin();
    const articoliRef = firestore.collection('articoli');
    const snapshot = await articoliRef
      .where('articolo_tags', 'array-contains', tag)
      .orderBy('publication_date', 'desc')
      .limit(limitCount)
      .get();
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Articolo));
  } catch (error) {
    console.error('Error fetching articoli by tag (server):', error);
    throw error;
  }
};

/**
 * Get approximate article count (efficient - doesn't fetch all documents)
 * Returns a cached/estimated count for performance
 * Note: For exact count, this would require aggregation query or counter document
 */
export const getArticleCountServer = async (): Promise<number> => {
  try {
    // For now, return estimated count to avoid fetching all docs
    // In production, you'd maintain a counter document that gets updated via Cloud Functions
    // For the Load More approach, we don't need exact count anyway
    return 1000; // Estimated count - doesn't need to be exact for Load More
  } catch (error) {
    console.error('Error getting article count (server):', error);
    return 0;
  }
};

/**
 * Get all unique tags from articles efficiently
 * Fetches tags from first N articles only for performance
 */
export const getAllTagsServer = async (): Promise<string[]> => {
  try {
    const firestore = initializeFirebaseAdmin();
    const articoliRef = firestore.collection('articoli');
    
    // Only fetch tags from first 100 articles for performance
    // This gives us most common tags without loading all 825 articles
    const snapshot = await articoliRef
      .select('articolo_tags')
      .limit(100)
      .get();
    
    const allTags = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.articolo_tags && Array.isArray(data.articolo_tags)) {
        data.articolo_tags.forEach((tag: string) => allTags.add(tag));
      }
    });
    
    return Array.from(allTags).sort();
  } catch (error) {
    console.error('Error fetching tags (server):', error);
    return [];
  }
}; 