import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'
import SettoreClient from './client-page'

interface SettorePageProps {
  params: {
    sector: string
  }
}

// Normalize settore slug to proper settore name
function normalizeSettoreSlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') {
    return null
  }
  
  // Decode and clean the slug
  const decoded = decodeURIComponent(slug)
  
  // Basic validation - ensure it doesn't contain invalid characters
  if (decoded.trim().length === 0) {
    return null
  }
  
  return decoded.trim()
}

async function getSettoreData(settoreSlug: string) {
  const settore = normalizeSettoreSlug(settoreSlug)
  
  if (!settore) {
    return null
  }

  return await fetchSettoreDataFromFirestore(settore, settoreSlug)
}

async function fetchSettoreDataFromFirestore(settore: string, settoreSlug: string) {
  const startTime = Date.now()
  console.log(`🏛️ Fetching data for settore: ${settore} (optimized query)`)
  
  const { getConcorsiBySettore } = await import('@/lib/services/common-concorsi-api')
  
  try {
    // Use the settore service with optimized query
    const result = await getConcorsiBySettore(settore, {
      Stato: 'OPEN',
      limit: 500, // Get more concorsi for settore pages
      orderByField: 'publication_date',
      orderDirection: 'desc'
    })

    if (!result || result.concorsi.length === 0) {
      return null
    }

    // Direct serialization for better performance
    const concorsi = result.concorsi.map(concorso => ({
      id: String(concorso.id),
      Titolo: String(concorso.Titolo || ''),
      Ente: String(concorso.Ente || ''),
      AreaGeografica: String(concorso.AreaGeografica || ''),
      numero_di_posti: Number(concorso.numero_di_posti) || undefined,
      settore_professionale: String(concorso.settore_professionale || ''),
      regime: String(concorso.regime || ''),
      DataChiusura: concorso.DataChiusura ? (concorso.DataChiusura.seconds ? { seconds: concorso.DataChiusura.seconds, nanoseconds: concorso.DataChiusura.nanoseconds } : concorso.DataChiusura) : null,
      riassunto: String(concorso.riassunto || ''),
      publication_date: concorso.publication_date ? (concorso.publication_date.seconds ? { seconds: concorso.publication_date.seconds, nanoseconds: concorso.publication_date.nanoseconds } : concorso.publication_date) : null,
      province: concorso.province || []
    }))
    
    // Extract unique enti, locations and regimes from the filtered concorsi
    const uniqueEnti = new Set<string>()
    const uniqueLocations = new Set<string>()
    const uniqueRegimes = new Set<string>()
    
    concorsi.forEach(concorso => {
      if (concorso.Ente && concorso.Ente.trim()) {
        uniqueEnti.add(concorso.Ente.trim())
      }
      if (concorso.AreaGeografica && concorso.AreaGeografica.trim()) {
        uniqueLocations.add(concorso.AreaGeografica.trim())
      }
      if (concorso.regime && concorso.regime.trim()) {
        uniqueRegimes.add(concorso.regime.trim())
      }
    })

    const resultData = {
      settore: String(settore),
      concorsi,
      totalCount: concorsi.length,
      enti: Array.from(uniqueEnti).sort(),
      locations: Array.from(uniqueLocations).sort(),
      regimes: Array.from(uniqueRegimes).sort()
    }
    
    const duration = Date.now() - startTime
    console.log(`🏛️ ✅ Optimized query: ${concorsi.length} concorsi for ${settore} in ${duration}ms`)
    
    return resultData
  } catch (error) {
    console.error('Error fetching settore data:', error)
    return null
  }
}

export async function generateMetadata({ params }: SettorePageProps): Promise<Metadata> {
  const settore = normalizeSettoreSlug(params.sector)
  
  if (!settore) {
    return {
      title: 'Settore non trovato | Concoro',
      description: 'Il settore richiesto non è stato trovato.'
    }
  }

  // Use static text for metadata to avoid slow queries
  return {
    title: `Concorsi Pubblici ${settore} - Diverse opportunità | Concoro`,
    description: `Scopri tutti i concorsi pubblici nel settore ${settore}. Diverse opportunità di lavoro nel settore pubblico. Candidati subito!`,
    keywords: `concorsi pubblici ${settore}, lavoro ${settore}, bandi ${settore}, opportunità ${settore}`,
    openGraph: {
      title: `Concorsi Pubblici ${settore} | Concoro`,
      description: `Concorsi pubblici attivi nel settore ${settore}. Trova la tua opportunità nel settore pubblico.`,
      type: 'website',
      url: `https://www.concoro.it/bandi/settore/${params.sector}`,
      siteName: 'Concoro',
      locale: 'it_IT',
      images: [
        {
          url: 'https://www.concoro.it/hero-image.webp',
          width: 1200,
          height: 630,
          alt: `Concorsi Pubblici ${settore}`
        }
      ]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1
      }
    },
    alternates: {
      canonical: `https://www.concoro.it/bandi/settore/${params.sector}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Concorsi Pubblici ${settore} | Concoro`,
      description: `Concorsi pubblici attivi nel settore ${settore}. Trova la tua opportunità nel settore pubblico.`,
      images: ['https://www.concoro.it/hero-image.webp']
    }
  }
}

// Generate static params for common settori
export async function generateStaticParams() {
  try {
    // Get available settori from our service
    const { getFilterOptions } = await import('@/lib/services/concorsi/query-service')
    const settori = await getFilterOptions('settori')
    
    // Limit to most common settori for static generation
    const commonSettori = settori.slice(0, 50) // Take first 50 settori
    
    return commonSettori.map(settore => ({
      sector: encodeURIComponent(settore)
    }))
  } catch (error) {
    console.error('Error generating static params for settori:', error)
    return []
  }
}

export default async function SettorePage({ params }: SettorePageProps) {
  let data
  
  try {
    data = await getSettoreData(params.sector)
  } catch (error) {
    console.error('Failed to get settore data:', error)
    notFound()
  }
  
  if (!data || !data.settore) {
    notFound()
  }

  // Generate structured data for the settore page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Concorsi Pubblici nel settore ${data.settore}`,
    description: `Tutti i concorsi pubblici attivi nel settore ${data.settore}`,
    url: `https://www.concoro.it/bandi/settore/${params.sector}`,
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
          industry: data.settore,
          jobLocation: concorso.AreaGeografica ? {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: concorso.AreaGeografica,
              addressCountry: 'IT'
            }
          } : undefined,
          url: `https://www.concoro.it${getBandoUrl(concorso)}`,
          validThrough: concorso?.DataChiusura?.seconds ? new Date(concorso.DataChiusura.seconds * 1000).toISOString() : undefined,
          datePosted: concorso?.publication_date?.seconds ? new Date(concorso.publication_date.seconds * 1000).toISOString() : undefined,
          description: concorso.riassunto || undefined
        }
      }))
    }
  }

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.concoro.it' },
      { '@type': 'ListItem', position: 2, name: 'Concorsi', item: 'https://www.concoro.it/bandi' },
      { '@type': 'ListItem', position: 3, name: 'Settori', item: 'https://www.concoro.it/bandi' },
      { '@type': 'ListItem', position: 4, name: `Concorsi ${data.settore}`, item: `https://www.concoro.it/bandi/settore/${params.sector}` }
    ]
  }

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Quali requisiti servono per lavorare nel settore ${data.settore}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `I requisiti per lavorare nel settore ${data.settore} variano per ogni concorso. Consulta ogni bando per i requisiti specifici.`
        }
      },
      {
        '@type': 'Question',
        name: `Come trovare concorsi nel settore ${data.settore}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Questa pagina elenca tutti i concorsi pubblici attivi nel settore ${data.settore}. Filtra per ente o località per risultati più specifici.`
        }
      },
      {
        '@type': 'Question',
        name: `Quali enti assumono nel settore ${data.settore}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Diversi enti pubblici assumono nel settore ${data.settore}. Consulta l'elenco degli enti per esplorare le opportunità disponibili.`
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <SettoreClient 
          settore={data.settore}
          concorsi={data.concorsi}
          totalCount={data.totalCount}
          enti={data.enti}
          locations={data.locations}
          regimes={data.regimes}
          settoreSlug={params.sector}
        />
      </Suspense>
    </>
  )
}