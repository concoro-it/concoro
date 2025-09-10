import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getJobPostingStructuredData } from '@/lib/utils/guest-seo-utils';
import { isFirestoreDocumentId, isValidBandoSlug } from '@/lib/utils/bando-slug-utils';
import { getConcorsoBySlug, getConcorsoById } from '@/lib/services/concorsi/concorso.server';
import { getFirestoreForSSR } from '@/lib/firebase/server-config';
import ClientJobPage from './client-page';
import { cache } from 'react';
import { Concorso } from '@/types/concorso';
import { serializeConcorso } from '@/lib/utils/serialize-firestore';

interface PageProps {
  params: { slug: string[] }
}

// Cache the getConcorsoData function to prevent duplicate SSR calls
const getConcorsoData = cache(async (slug: string[]): Promise<Concorso | null> => {
  const slugPath = slug.join('/');
  console.log('Processing slug path:', slugPath);
  
  try {
    // First, check if this is a valid SEO-friendly slug
    if (isValidBandoSlug(slugPath)) {
      const concorso = await getConcorsoBySlug(slugPath);
      if (concorso) {
        // Check expiration
        const isExpired = checkIfConcorsoExpired(concorso);
        if (isExpired) {
          concorso.Stato = 'Scaduto';
        }
        return concorso;
      }
    }
    
    // Fallback: try to find by concorso_id
    if (isFirestoreDocumentId(slugPath)) {
      const concorso = await getConcorsoById(slugPath);
      if (concorso) {
        const isExpired = checkIfConcorsoExpired(concorso);
        if (isExpired) {
          concorso.Stato = 'Scaduto';
        }
        return concorso;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching concorso:", error);
    return null;
  }
});

function checkIfConcorsoExpired(concorso: Concorso): boolean {
  const closingDate = concorso.DataChiusura;
  if (!closingDate) return false;
  
  try {
    let dateToCheck: Date;
    
    if (typeof closingDate === 'string') {
      dateToCheck = new Date(closingDate);
    } else if ('seconds' in closingDate) {
      dateToCheck = new Date(closingDate.seconds * 1000);
    } else {
      return false;
    }
    
    return dateToCheck < new Date();
  } catch (error) {
    console.error('Error checking concorso expiration:', error);
    return false;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const concorso = await getConcorsoData(params.slug);
  
  if (!concorso) {
    return {
      title: 'Concorso Pubblico | Concoro',
      description: 'Dettagli concorso pubblico su Concoro - La piattaforma leader per trovare lavoro nel settore pubblico.',
      robots: { index: false, follow: true },
    };
  }
  
  const title = concorso.Titolo || 'Concorso Pubblico';
  const ente = concorso.Ente || 'Pubblica Amministrazione';
  const location = concorso.AreaGeografica || '';
  const numeroPosti = concorso.numero_di_posti || 0;
  const profilo = concorso.categoria || concorso.ambito_lavorativo || '';
  const isExpired = concorso.Stato === 'Scaduto';
  
  // Create comprehensive title with entity data
  let seoTitle = title;
  if (isExpired) {
    seoTitle += ' (Scaduto)';
  }
  if (location) {
    seoTitle += ` - ${location}`;
  }
  seoTitle += ` | ${ente} | Concoro`;
  
  // Truncate title if too long for SEO
  if (seoTitle.length > 60) {
    const maxLength = 60 - ' | Concoro'.length;
    seoTitle = seoTitle.substring(0, maxLength).trim() + ' | Concoro';
  }
  
  // Create rich description
  let seoDescription = `${title} presso ${ente}`;
  if (location) {
    seoDescription += ` in ${location}`;
  }
  if (profilo) {
    seoDescription += ` - Profilo: ${profilo}`;
  }
  if (numeroPosti > 0) {
    seoDescription += `. ${numeroPosti} posto${numeroPosti > 1 ? 'i' : ''} disponibile${numeroPosti > 1 ? 'i' : ''}`;
  }
  
  // Add closing date if available
  const closingDate = concorso.DataChiusura;
  if (closingDate) {
    const closeDate = typeof closingDate === 'string' ? closingDate : 
                     'seconds' in closingDate ? new Date(closingDate.seconds * 1000).toLocaleDateString() : '';
    if (closeDate) {
      seoDescription += isExpired ? `. Scaduto il: ${closeDate}` : `. Scadenza: ${closeDate}`;
    }
  }
  
  seoDescription += isExpired 
    ? '. Consulta i dettagli del concorso scaduto su Concoro.'
    : '. Scopri requisiti e come candidarti su Concoro.';
  
  // Ensure description is within limits
  if (seoDescription.length > 160) {
    seoDescription = seoDescription.substring(0, 157) + '...';
  }
  
  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      title.toLowerCase(),
      'concorso pubblico',
      'bando',
      ...(location ? [location.toLowerCase()] : []),
      ente.toLowerCase(),
      ...(profilo ? [profilo.toLowerCase()] : []),
      'candidatura',
      'requisiti',
      'scadenza'
    ].join(', '),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'article',
      title: seoTitle,
      description: seoDescription,
      url: `https://www.concoro.it/bandi/${params.slug.join('/')}`,
      siteName: 'Concoro',
      images: [
        {
          url: 'https://www.concoro.it/concoro-logo-light.png',
          width: 1200,
          height: 630,
          alt: `${title} - ${ente}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: ['https://www.concoro.it/concoro-logo-light.png'],
    },
    alternates: {
      canonical: `https://www.concoro.it/bandi/${params.slug.join('/')}`,
    },
    metadataBase: new URL('https://www.concoro.it'),
  };
}

// DISABLE ISR FOR ALWAYS FRESH DATA
// export const revalidate = 300;

// Generate static params for recent concorsi
export async function generateStaticParams() {
  try {
    const db = getFirestoreForSSR();
    const snapshot = await db.collection('concorsi')
      .orderBy('publication_date', 'desc')
      .limit(50)
      .get();

    return snapshot.docs
      .filter(doc => doc.data().Stato !== 'Scaduto') // Filter out expired ones
      .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        const slugArray = [data.AreaGeografica || '', doc.id].filter(Boolean);
        
        // Only generate static params that don't conflict with specific routes
        // Avoid generating params that start with: regime, scadenza, ente, regione, settore
        const conflictingRoutes = ['regime', 'scadenza', 'ente', 'regione', 'settore'];
        if (slugArray.length > 0 && conflictingRoutes.includes(slugArray[0].toLowerCase())) {
          return null; // Skip this to avoid conflict
        }
        
        return {
          // Use array for catch-all route [...slug]
          slug: slugArray
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Main page component with ISR
export default async function ConcorsoPage({ params }: PageProps) {
  const concorso = await getConcorsoData(params.slug);
  
  if (!concorso) {
    notFound();
  }

  // Serialize the concorso data first
  const serializedConcorso = serializeConcorso(concorso);
  
  // Generate structured data with error handling
  let structuredData = null;
  try {
    structuredData = getJobPostingStructuredData(serializedConcorso);
  } catch (error) {
    console.error('Error generating structured data:', error);
  }
  
  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <ClientJobPage job={serializedConcorso} slug={params.slug} />
    </>
  );
}