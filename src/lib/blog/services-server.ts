import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { Articolo } from '@/types';

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