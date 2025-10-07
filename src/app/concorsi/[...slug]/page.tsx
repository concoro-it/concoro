import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { headers } from 'next/headers';
import { getFirestoreForSEO } from '@/lib/firebase-admin';
import { Concorso } from '@/types/concorso';
import { 
  generateConcorsoBreadcrumbs, 
  parseConcorsoSlug, 
  findConcorsoBySlug,
  isFirebaseDocumentId,
  generateSEOConcorsoUrl,
  generateConcorsoSlug
} from '@/lib/utils/concorso-urls';
import ConcorsoClientWrapper from '@/components/concorsi/ConcorsoClientWrapper';
import { generateConcorsoJobPostingStructuredData } from '@/lib/utils/jobposting-utils';
import { Breadcrumbs } from '@/components/concorsi/Breadcrumbs';
import { ExpiredConcorso } from '@/components/concorsi/ExpiredConcorso';

// Request deduplication to prevent concurrent requests for the same slug
const activeRequests = new Map<string, Promise<{ concorso: Concorso | null; shouldRedirect?: string; isExpired?: boolean }>>();

interface ConcorsoPageProps {
  params: {
    slug: string[];
  };
}

// Helper function to serialize Firestore data for client components
function serializeForClient(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeForClient(item));
  }

  // Handle Firestore Timestamp objects
  if (typeof data === 'object' && data !== null) {
    // Check if it's a Timestamp-like object (has seconds and nanoseconds)
    if ('seconds' in data && 'nanoseconds' in data && typeof data.seconds === 'number') {
      // Convert to Italian date format string for consistent hydration
      const date = new Date(data.seconds * 1000);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    // Handle Date objects
    if (data instanceof Date) {
      return data.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    // Handle regular objects recursively
    const serialized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        serialized[key] = serializeForClient(data[key]);
      }
    }
    return serialized;
  }

  // Return primitives as-is
  return data;
}

// Server-side data fetching with Next.js caching
const getConcorsoDataCached = unstable_cache(
  async (slugKey: string): Promise<{ concorso: Concorso | null; shouldRedirect?: string; isExpired?: boolean }> => {
    try {
      const slugArray = slugKey.split('/');
      
      const db = getFirestoreForSEO();
    
    // Handle different URL formats
    if (slugArray.length === 5) {
      // NEW FORMAT: /concorsi/[localita]/[ente]/[title]/[date]/[id]
      const fullSlug = slugArray.join('/');
      const slugComponents = parseConcorsoSlug(fullSlug);
      
      // If we have an ID, fetch directly
      if (slugComponents.id) {
        const doc = await db.collection('concorsi').doc(slugComponents.id).get();
        
        if (!doc.exists) {
          return { concorso: null };
        }
        
        const concorso = {
          id: doc.id,
          ...doc.data()
        } as Concorso;
        
        // Check if concorso is open
        const validStates = ['open', 'aperto', 'OPEN', 'APERTO'];
        if (!concorso.Stato || !validStates.includes(concorso.Stato)) {
          // Concorso exists but is expired/closed - return 410
          return { concorso, isExpired: true };
        }
        
        return { concorso };
      } else {
        return { concorso: null };
      }
    } else if (slugArray.length === 1) {
      // Legacy format: single ID or old slug format
      const fullSlug = slugArray[0];
      
      // If it's a legacy Firebase ID without the full slug
      if (isFirebaseDocumentId(fullSlug)) {
        const doc = await db.collection('concorsi').doc(fullSlug).get();
        
        if (!doc.exists) {
          return { concorso: null };
        }
        
        const concorso = {
          id: doc.id,
          ...doc.data()
        } as Concorso;
        
        // Check if concorso is open
        const validStates = ['open', 'aperto', 'OPEN', 'APERTO'];
        if (!concorso.Stato || !validStates.includes(concorso.Stato)) {
          // Concorso exists but is expired/closed - return 410
          return { concorso, isExpired: true };
        }
        
        // Generate SEO-friendly URL and suggest redirect
        const seoUrl = generateSEOConcorsoUrl(concorso);
        
        return { 
          concorso, 
          shouldRedirect: seoUrl 
        };
      }
    } else if (slugArray.length === 4) {
      // OLD FORMAT: /concorsi/[localita]/[ente]/[title]/[date] - Try to match by components
      const slugComponents = parseConcorsoSlug(slugArray.join('/'));
      
      // Fetch concorsi that might match
      let query = db.collection('concorsi')
        .where('Stato', 'in', ['open', 'aperto', 'OPEN', 'APERTO'])
        .limit(100);
        
      const snapshot = await query.get();
      const concorsi = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Concorso[];
      
      // Find matching concorso by slug components
      const concorso = findConcorsoBySlug(concorsi, slugComponents);
      
      if (concorso) {
        // Redirect to new format with ID
        const seoUrl = generateSEOConcorsoUrl(concorso);
        return { 
          concorso,
          shouldRedirect: seoUrl
        };
      }
      
      return { concorso: null };
    }
    
    return { concorso: null };
    
  } catch (error) {
    return { concorso: null };
  }
  },
  ['concorso-data-by-slug'], // Cache key prefix
  {
    revalidate: 7200, // 2 hours
    tags: ['concorso']
  }
);

// Wrapper function with request deduplication
async function getConcorsoData(slugArray: string[]): Promise<{ concorso: Concorso | null; shouldRedirect?: string; isExpired?: boolean }> {
  const slugKey = slugArray.join('/');
  
  // Check if there's already an active request for this slug
  if (activeRequests.has(slugKey)) {
    return activeRequests.get(slugKey)!;
  }
  
  // Start new request and store the promise
  const requestPromise = getConcorsoDataCached(slugKey);
  activeRequests.set(slugKey, requestPromise);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up the active request
    activeRequests.delete(slugKey);
  }
}

// Metadata generation
export async function generateMetadata({ params }: ConcorsoPageProps): Promise<Metadata> {
  const { concorso, isExpired } = await getConcorsoData(params.slug);
  
  if (!concorso) {
    return {
      title: 'Concorso Non Trovato - Concoro',
      description: 'Il concorso richiesto non è stato trovato o non è più disponibile.',
    };
  }
  
  // Special metadata for expired concorsi
  if (isExpired) {
    return {
      title: `Concorso Scaduto: ${concorso.Titolo} - ${concorso.Ente} | Concoro`,
      description: `Questo concorso presso ${concorso.Ente} è scaduto e non accetta più candidature. Scopri altri concorsi attivi simili.`,
      robots: {
        index: false, // Don't index expired pages
        follow: true,  // But follow links
      },
    };
  }
  
  const title = `${concorso.Titolo} - ${concorso.Ente} | Concoro`;
  const description = concorso.Descrizione 
    ? `${concorso.Descrizione.substring(0, 160)}...`
    : `Concorso pubblico presso ${concorso.Ente}. Scopri i dettagli e candidati online.`;
  
  // Generate canonical URL
  const canonicalUrl = `https://concoro.it${generateSEOConcorsoUrl(concorso)}`;
    
  return {
    title,
    description,
    keywords: `concorso pubblico, ${concorso.Ente}, ${concorso.AreaGeografica}, lavoro pa, ${concorso.settore_professionale}`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ConcorsoSlugPage({ params }: ConcorsoPageProps) {
  const { concorso, shouldRedirect, isExpired } = await getConcorsoData(params.slug);
  
  if (!concorso) {
    notFound();
  }
  
  // Handle redirect from legacy ID URL to SEO URL
  if (shouldRedirect && !isExpired) {
    redirect(shouldRedirect);
  }
  
  // Handle expired concorso - show special page
  if (isExpired) {
    // Note: The 410 Gone status is communicated via:
    // 1. robots: noindex (in generateMetadata) - prevents indexing
    // 2. Custom ExpiredConcorso component - provides user value
    // 3. For infrastructure-level 410 headers, check for x-concorso-status in middleware
    
    // Serialize concorso data for the expired component
    const serializedConcorso = serializeForClient(concorso);
    
    return <ExpiredConcorso concorso={serializedConcorso} />;
  }
  
  // Serialize Firestore data (including nested Timestamps) for client component
  const serializedConcorso = serializeForClient(concorso);
  
  // Generate the full concorso URL for structured data
  const concorsoUrl = `https://concoro.it${generateSEOConcorsoUrl(concorso)}`;
  
  // Generate JobPosting structured data for Google Job Search
  const jobPostingStructuredData = generateConcorsoJobPostingStructuredData(
    concorso,
    concorsoUrl,
    'https://concoro.it'
  );
  
  // Generate breadcrumbs
  const breadcrumbItems = generateConcorsoBreadcrumbs(concorso);
  
  // Generate BreadcrumbList structured data
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://concoro.it${item.href}`
    }))
  };
  
  // Render the client wrapper with the serialized concorso data
  return (
    <>
      {/* JobPosting Structured Data for Rich Snippets */}
      {jobPostingStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jobPostingStructuredData)
          }}
        />
      )}
      
      {/* BreadcrumbList Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>
      
      <ConcorsoClientWrapper concorso={serializedConcorso} />
    </>
  );
}
