import { getFirestoreForSSR } from '@/lib/firebase/server-config';
import { getCachedData, setCachedData, CACHE_TTL, generateCacheKey } from '@/lib/cache/redis-client';
import { Concorso } from '@/types/concorso';
import { parseBandoSlug, getBandoUrl } from '@/lib/utils/bando-slug-utils';

// Cache the findJobBySlug function to prevent redundant parsing and DB calls
export async function findJobBySlug(slug: string): Promise<Concorso | null> {
  // Try cache first
  const cacheKey = generateCacheKey('job', slug);
  const cachedJob = await getCachedData<Concorso>(cacheKey);
  if (cachedJob) {
    console.log('Cache hit for job:', slug);
    return cachedJob;
  }

  try {
    const db = getFirestoreForSSR();
    console.log('Processing slug:', slug);
    
    const parsed = parseBandoSlug(slug);
    if (!parsed) {
      console.log('Failed to parse slug');
      return null;
    }

    // With new format, concorso_id is a separate component
    const concorsoId = parsed.concorsoId;
    
    if (concorsoId) {
      // Use a transaction for consistent reads
      const job = await db.runTransaction(async (transaction) => {
        const docRef = db.collection('concorsi').doc(concorsoId);
        const docSnapshot = await transaction.get(docRef);
        
        if (docSnapshot.exists) {
          console.log('Document found by direct lookup');
          const data = docSnapshot.data() as any;
          const job = { ...data, id: docSnapshot.id } as Concorso;
          
          // Verify slug match
          const jobUrl = getBandoUrl(job as any);
          const jobSlug = jobUrl.replace('/bandi/', '');
          
          if (jobSlug === slug) {
            return serializeJobData(job);
          }
        }
        return null;
      });

      if (job) {
        // Cache the result
        await setCachedData(cacheKey, job, CACHE_TTL.JOB_PAGE);
        return job;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding job by slug:', error);
    return null;
  }
}

// Optimize data serialization
function serializeJobData(job: any): Concorso {
  const serialized = {
    id: String(job.id),
    AreaGeografica: String(job.AreaGeografica || ''),
    DataApertura: job.DataApertura || job["Data apertura candidature"] || '',
    DataChiusura: job.DataChiusura || job["Data chiusura candidature"],
    Descrizione: String(job.Descrizione || job.riassunto || job.summary || ''),
    Ente: String(job.Ente || job["Ente di riferimento"] || ''),
    Link: String(job.Link || ''),
    Stato: String(job.Stato || ''),
    Titolo: String(job.Titolo || job.Title || ''),
    titolo_breve: String(job.titolo_breve || ''),
    Valutazione: String(job.Valutazione || ''),
    ambito_lavorativo: job.ambito_lavorativo,
    apply_link: String(job.apply_link || ''),
    capacita_richieste: job.capacita_richieste,
    categoria: String(job.categoria || job.Categoria || ''),
    area_categoria: job.area_categoria,
    collocazione_organizzativa: job.collocazione_organizzativa,
    concorso_id: String(job.concorso_id || job.id || ''),
    conoscenze_tecnico_specialistiche: job.conoscenze_tecnico_specialistiche,
    contatti: job.contatti,
    numero_di_posti: Number(job["Numero di posti"] || job.numero_di_posti || 0),
    pa_link: job.pa_link,
    pdf_links: Array.isArray(job.pdf_links) ? job.pdf_links : [],
    programma_di_esame: job.programma_di_esame,
    publication_date: job.publication_date,
    regime: String(job.regime || job.Regime || ''),
    regime_impegno: job.regime_impegno,
    settore: job.settore,
    settore_professionale: String(job.settore_professionale || job.Settore || ''),
    sommario: String(job.sommario || job.riassunto || job.summary || ''),
    tipologia: job.tipologia,
    titolo_originale: String(job.titolo_originale || job.Titolo || job.Title || ''),
    createdAt: job.createdAt || { seconds: 0, nanoseconds: 0 },
    updatedAt: job.updatedAt || { seconds: 0, nanoseconds: 0 }
  };

  return serialized as Concorso;
}

function serializeDate(date: any): string {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      return date;
    }
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

// Batch fetch multiple jobs efficiently
export async function batchGetJobs(ids: string[]): Promise<Concorso[]> {
  if (!ids.length) return [];
  
  const db = getFirestoreForSSR();
  const jobs: Concorso[] = [];
  
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
}
