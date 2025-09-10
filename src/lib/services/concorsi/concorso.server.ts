import { cache } from 'react';
import { getFirestoreForSSR } from '@/lib/firebase/server-config';
import { Concorso } from '@/types/concorso';
import { parseBandoSlug } from '@/lib/utils/bando-slug-utils';
import { kv } from '@vercel/kv';
import { serializeConcorso } from '@/lib/utils/serialize-firestore';

const CACHE_TTL = {
  CONCORSO: 300, // 5 minutes
  LIST: 120, // 2 minutes
};

// Memory cache fallback
const memoryCache = new Map<string, { data: any; timestamp: number }>();

async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    // Try Vercel KV first
    if (process.env.VERCEL_ENV) {
      const data = await kv.get(key);
      if (data) return data as T;
    }

    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.CONCORSO * 1000) {
      return cached.data as T;
    }
    
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

async function setCachedData(key: string, data: any, ttl: number): Promise<void> {
  try {
    // Set in Vercel KV if available
    if (process.env.VERCEL_ENV) {
      await kv.set(key, data, { ex: ttl });
    }

    // Also set in memory cache
    memoryCache.set(key, { data, timestamp: Date.now() });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

// Get concorso by slug - uses concorso_id from the slug
export const getConcorsoBySlug = cache(async (slug: string): Promise<Concorso | null> => {
  const cacheKey = `concorso:${slug}`;
  
  try {
    // Try cache first
    const cached = await getCachedData<Concorso>(cacheKey);
    if (cached) {
      console.log('Cache hit for concorso:', slug);
      return cached;
    }

    const db = getFirestoreForSSR();
    if (!db) throw new Error('Firestore not initialized');

    const parsed = parseBandoSlug(slug);
    if (!parsed?.concorsoId) return null;

    // Direct lookup by concorso_id
    const docRef = db.collection('concorsi').doc(parsed.concorsoId);
    const doc = await docRef.get();
    
    if (!doc.exists) return null;

    const concorso = serializeConcorso({
      ...doc.data(),
      id: doc.id,
      concorso_id: doc.id
    } as Concorso);

    // Cache the result
    await setCachedData(cacheKey, concorso, CACHE_TTL.CONCORSO);
    return concorso;
  } catch (error) {
    console.error('Error finding concorso by slug:', error);
    return null;
  }
});

// Get concorso directly by ID
export const getConcorsoById = cache(async (concorsoId: string): Promise<Concorso | null> => {
  const cacheKey = `concorso:${concorsoId}`;
  
  try {
    // Try cache first
    const cached = await getCachedData<Concorso>(cacheKey);
    if (cached) {
      console.log('Cache hit for concorso:', concorsoId);
      return cached;
    }

    const db = getFirestoreForSSR();
    if (!db) throw new Error('Firestore not initialized');

    const doc = await db.collection('concorsi').doc(concorsoId).get();
    
    if (!doc.exists) return null;

    const concorso = serializeConcorso({
      ...doc.data(),
      id: doc.id,
      concorso_id: doc.id
    } as Concorso);

    // Cache the result
    await setCachedData(cacheKey, concorso, CACHE_TTL.CONCORSO);
    return concorso;
  } catch (error) {
    console.error('Error finding concorso by ID:', error);
    return null;
  }
});

// Batch get multiple concorsi
export const batchGetConcorsi = cache(async (ids: string[]): Promise<Concorso[]> => {
  if (!ids.length) return [];
  
  try {
    const db = getFirestoreForSSR();
    if (!db) throw new Error('Firestore not initialized');

    const concorsi: Concorso[] = [];
    
    // Process in batches of 10
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10);
      const refs = batch.map(id => db.collection('concorsi').doc(id));
      
      const snapshots = await Promise.all(refs.map(ref => ref.get()));
      
      snapshots.forEach(doc => {
        if (doc.exists) {
          concorsi.push({
            ...doc.data(),
            id: doc.id,
            concorso_id: doc.id
          } as Concorso);
        }
      });
    }
    
    return concorsi;
  } catch (error) {
    console.error('Error batch fetching concorsi:', error);
    return [];
  }
});
