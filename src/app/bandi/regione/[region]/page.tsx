import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { getItalianRegions } from '@/lib/utils/region-utils'
import RegionClient from './client-page'

interface RegionPageProps {
  params: {
    region: string
  }
}

// Normalize region slug to proper region name
function normalizeRegionSlug(slug: string): string | null {
  const normalizedSlug = decodeURIComponent(slug).toLowerCase().replace(/-/g, ' ')
  const regions = getItalianRegions()
  
  return regions.find(region => 
    region.toLowerCase() === normalizedSlug ||
    region.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
  ) || null
}

async function getRegionData(regionSlug: string) {
  const region = normalizeRegionSlug(regionSlug)
  
  if (!region) {
    return null
  }

  return await fetchRegionDataFromFirestore(region, regionSlug)
}

async function fetchRegionDataFromFirestore(region: string, regionSlug: string) {
  const startTime = Date.now()
  console.log(`📋 Fetching data for region: ${region} (optimized query)`)
  
  const { getRegionalConcorsi, getRegionalEnti } = await import('@/lib/services/regional-queries')
  
  // Use the composite index for better performance with reduced limit
  const [concorsiResult, enti] = await Promise.all([
    getRegionalConcorsi({
      regione: [region],
      Stato: 'OPEN',
      limit: 100, // Reduced from 300 for better performance
      indexId: 'CICAgOi3kJAJ'
    }),
    getRegionalEnti(region)
  ])
  
  // Direct serialization for better performance
  const concorsi = concorsiResult.concorsi.map(concorso => ({
    id: String(concorso.id),
    Titolo: String(concorso.Titolo || ''),
    Ente: String(concorso.Ente || ''),
    AreaGeografica: String(concorso.AreaGeografica || ''),
    numero_di_posti: Number(concorso.numero_di_posti) || undefined,
    settore_professionale: String(concorso.settore_professionale || ''),
    regime: String(concorso.regime || ''),
    DataChiusura: concorso.DataChiusura ? (concorso.DataChiusura.seconds ? { seconds: concorso.DataChiusura.seconds, nanoseconds: concorso.DataChiusura.nanoseconds } : concorso.DataChiusura) : null,
    riassunto: String(concorso.riassunto || ''),
    publication_date: concorso.publication_date ? (concorso.publication_date.seconds ? { seconds: concorso.publication_date.seconds, nanoseconds: concorso.publication_date.nanoseconds } : concorso.publication_date) : null
  }))
  
  const result = {
    region: String(region),
    concorsi,
    totalCount: concorsi.length,
    enti: enti.map(ente => String(ente))
  }
  
  const duration = Date.now() - startTime
  console.log(`📋 ✅ Optimized query: ${concorsi.length} concorsi for ${region} in ${duration}ms`)
  
  return result
}


export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const region = normalizeRegionSlug(params.region)
  
  if (!region) {
    return {
      title: 'Regione non trovata | Concoro',
      description: 'La regione richiesta non è stata trovata.'
    }
  }

  // Use static text for metadata to avoid slow queries
  return {
    title: `Concorsi Pubblici ${region} - Diverse opportunità | Concoro`,
    description: `Scopri tutti i concorsi pubblici attivi in ${region}. Diverse opportunità di lavoro nel settore pubblico. Candidati subito!`,
    keywords: `concorsi pubblici ${region}, lavoro pubblico ${region}, bandi ${region}`,
    openGraph: {
      title: `Concorsi Pubblici ${region} | Concoro`,
      description: `Concorsi pubblici attivi in ${region}. Trova la tua opportunità nel settore pubblico.`,
      type: 'website',
      url: `https://www.concoro.it/bandi/regione/${params.region}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://www.concoro.it/bandi/regione/${params.region}`,
    }
  }
}

// Generate static params for all Italian regions
export async function generateStaticParams() {
  const regions = getItalianRegions()
  
  return regions.map(region => ({
    region: region.toLowerCase().replace(/\s+/g, '-')
  }))
}

export default async function RegionPage({ params }: RegionPageProps) {
  let data
  
  try {
    data = await getRegionData(params.region)
  } catch (error) {
    console.error('Failed to get region data:', error)
    notFound()
  }
  
  if (!data || !data.region) {
    notFound()
  }

  // Generate structured data for the region page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Concorsi Pubblici ${data.region}`,
    description: `Tutti i concorsi pubblici attivi in ${data.region}`,
    url: `https://www.concoro.it/bandi/regione/${params.region}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.totalCount,
      itemListElement: data.concorsi.slice(0, 10).map((concorso: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'JobPosting',
          title: concorso.Titolo,
          hiringOrganization: {
            '@type': 'Organization',
            name: concorso.Ente
          },
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressRegion: data.region,
              addressCountry: 'IT'
            }
          }
        }
      }))
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <RegionClient 
          region={data.region}
          concorsi={data.concorsi}
          totalCount={data.totalCount}
          enti={data.enti}
          regionSlug={params.region}
        />
      </Suspense>
    </>
  )
}
