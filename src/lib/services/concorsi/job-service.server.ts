import { cache } from 'react';
import { getFirestoreForSSR } from '@/lib/firebase/server-config';
import { Concorso } from '@/types/concorso';

// Type alias for consistency with existing code - flexible data structure for serialized jobs
type Job = {
  id: string;
  Titolo?: string;
  Ente?: string;
  AreaGeografica?: string;
  numero_di_posti?: number;
  DataApertura?: string | any;
  DataChiusura?: string | any;
  Stato?: string;
  publication_date?: string;
  categoria?: string;
  settore_professionale?: string;
  regime?: string;
  riassunto?: string;
  requisiti_generali?: any[];
  pdf_links?: any[];
};
import { parseBandoSlug, getBandoUrl } from '@/lib/utils/bando-slug-utils';
import { kv } from '@vercel/kv';

const CACHE_TTL = {
  JOB_PAGE: 300, // 5 minutes
  JOB_LIST: 120, // 2 minutes
};

// Use Vercel KV (Redis) for caching with fallback to memory cache
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
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.JOB_PAGE * 1000) {
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

// Cached job finder with proper error handling
export const findJobBySlug = cache(async (slug: string): Promise<Job | null> => {
  const cacheKey = `job:${slug}`;
  
  try {
    // Try cache first
    const cached = await getCachedData<Job>(cacheKey);
    if (cached) {
      console.log('Cache hit for job:', slug);
      return cached;
    }

    const db = getFirestoreForSSR();
    if (!db) throw new Error('Firestore not initialized');

    const parsed = parseBandoSlug(slug);
    if (!parsed) return null;

    const concorsoId = parsed.concorsoId;
    if (!concorsoId) return null;

    // Use transaction for consistent reads
    const job = await db.runTransaction(async (transaction) => {
      const docRef = db.collection('concorsi').doc(concorsoId);
      const doc = await transaction.get(docRef);
      
      if (!doc.exists) return null;

      const data = doc.data();
      const job = { ...data, id: doc.id } as Job;

      // Verify slug match
      const jobUrl = getBandoUrl(job);
      const jobSlug = jobUrl.replace('/bandi/', '');
      
      return jobSlug === slug ? serializeJobData(job) : null;
    });

    if (job) {
      await setCachedData(cacheKey, job, CACHE_TTL.JOB_PAGE);
      return job;
    }

    return null;
  } catch (error) {
    console.error('Error finding job by slug:', error);
    return null;
  }
});

// Optimized data serialization
function serializeJobData(job: any): Job {
  try {
    return {
      id: String(job.id || ''),
      Titolo: String(job.Titolo || job.Title || ''),
      Ente: String(job.Ente || job["Ente di riferimento"] || ''),
      AreaGeografica: String(job.AreaGeografica || ''),
      numero_di_posti: Number(job["Numero di posti"] || job.numero_di_posti || 0),
      DataApertura: serializeDate(job["Data apertura candidature"] || job.DataApertura),
      DataChiusura: serializeDate(job["Data chiusura candidature"] || job.DataChiusura),
      Stato: String(job.Stato || ''),
      publication_date: serializeDate(job.publication_date),
      categoria: String(job.categoria || job.Categoria || ''),
      settore_professionale: String(job.settore_professionale || job.Settore || ''),
      regime: String(job.regime || job.Regime || ''),
      riassunto: String(job.riassunto || job.summary || ''),
      requisiti_generali: Array.isArray(job.requisiti_generali) ? job.requisiti_generali : [],
      pdf_links: Array.isArray(job.pdf_links) ? job.pdf_links : [],
    };
  } catch (error) {
    console.error('Error serializing job data:', error);
    throw error;
  }
}

function serializeDate(date: any): string {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') return date;
    if (typeof date === 'object') {
      if ('seconds' in date) {
        return new Date(date.seconds * 1000).toISOString();
      }
      if ('_seconds' in date) {
        return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) {
        return date.toISOString();
      }
    }
    return '';
  } catch (error) {
    console.error('Error serializing date:', error);
    return '';
  }
}

// Efficient batch fetching
export const batchGetJobs = cache(async (ids: string[]): Promise<Job[]> => {
  if (!ids.length) return [];
  
  try {
    const db = getFirestoreForSSR();
    if (!db) throw new Error('Firestore not initialized');

    const jobs: Job[] = [];
    
    // Process in batches of 10
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10);
      const refs = batch.map(id => db.collection('concorsi').doc(id));
      
      const snapshots = await Promise.all(refs.map(ref => ref.get()));
      
      snapshots.forEach(snap => {
        if (snap.exists) {
          const data = snap.data();
          jobs.push(serializeJobData({ ...data, id: snap.id }));
        }
      });
    }
    
    return jobs;
  } catch (error) {
    console.error('Error batch fetching jobs:', error);
    return [];
  }
});
