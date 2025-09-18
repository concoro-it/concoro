import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'
import RegimeClient from './client-page'

interface RegimePageProps {
  params: {
    regime: string
  }
}

// Normalize regime slug to proper regime name
function normalizeRegimeSlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') {
    return null
  }
  
  // Decode and clean the slug
  const decoded = decodeURIComponent(slug).toLowerCase()
  
  // Basic validation - ensure it doesn't contain invalid characters
  if (!/^[a-z0-9\s-]+$/.test(decoded)) {
    return null
  }
  
  // Map common regime variations
  const regimeMap: Record<string, string> = {
    'tempo-pieno': 'Tempo pieno',
    'part-time': 'Part-time',
    'tempo-determinato': 'Tempo determinato',
    'tempo-indeterminato': 'Tempo indeterminato',
    'contratto': 'Contratto',
    'stage': 'Stage',
    'tirocinio': 'Tirocinio'
  }
  
  return regimeMap[decoded] || decoded.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

async function getRegimeData(regimeSlug: string) {
  const regime = normalizeRegimeSlug(regimeSlug)
  
  if (!regime) {
    return null
  }

  return await fetchRegimeDataFromFirestore(regime, regimeSlug)
}

async function fetchRegimeDataFromFirestore(regime: string, regimeSlug: string) {
  const startTime = Date.now()
  console.log(`⚙️ Fetching data for regime: ${regime} (optimized query)`)
  
  const { concorsiService } = await import('@/lib/services/concorsi-service')
  
  try {
    // Use the unified service with optimized query
    const result = await concorsiService.getConcorsiByRegime(regime, {
      Stato: 'OPEN',
      limit: 500, // Get more concorsi for regime pages
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
    
    // Extract unique enti, locations and settori from the filtered concorsi
    const uniqueEnti = new Set<string>()
    const uniqueLocations = new Set<string>()
    const uniqueSettori = new Set<string>()
    
    concorsi.forEach(concorso => {
      if (concorso.Ente && concorso.Ente.trim()) {
        uniqueEnti.add(concorso.Ente.trim())
      }
      if (concorso.AreaGeografica && concorso.AreaGeografica.trim()) {
        uniqueLocations.add(concorso.AreaGeografica.trim())
      }
      if (concorso.settore_professionale && concorso.settore_professionale.trim()) {
        uniqueSettori.add(concorso.settore_professionale.trim())
      }
    })

    const resultData = {
      regime: String(regime),
      concorsi,
      totalCount: concorsi.length,
      enti: Array.from(uniqueEnti).sort(),
      locations: Array.from(uniqueLocations).sort(),
      settori: Array.from(uniqueSettori).sort()
    }
    
    const duration = Date.now() - startTime
    console.log(`⚙️ ✅ Optimized query: ${concorsi.length} concorsi for ${regime} in ${duration}ms`)
    
    return resultData
  } catch (error) {
    console.error('Error fetching regime data:', error)
    return null
  }
}

export async function generateMetadata({ params }: RegimePageProps): Promise<Metadata> {
  const regime = normalizeRegimeSlug(params.regime)
  
  if (!regime) {
    return {
      title: 'Regime non trovato | Concoro',
      description: 'Il regime richiesto non è stato trovato.'
    }
  }

  // Use static text for metadata to avoid slow queries
  return {
    title: `Concorsi Pubblici ${regime} - Diverse opportunità | Concoro`,
    description: `Scopri tutti i concorsi pubblici con contratto ${regime}. Diverse opportunità di lavoro nel settore pubblico. Candidati subito!`,
    keywords: `concorsi pubblici ${regime}, lavoro ${regime}, bandi ${regime}, contratto ${regime}`,
    openGraph: {
      title: `Concorsi Pubblici ${regime} | Concoro`,
      description: `Concorsi pubblici attivi con contratto ${regime}. Trova la tua opportunità nel settore pubblico.`,
      type: 'website',
      url: `https://www.concoro.it/bandi/regime/${params.regime}`,
      siteName: 'Concoro',
      locale: 'it_IT',
      images: [
        {
          url: 'https://www.concoro.it/hero-image.webp',
          width: 1200,
          height: 630,
          alt: `Concorsi Pubblici ${regime}`
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
      canonical: `https://www.concoro.it/bandi/regime/${params.regime}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Concorsi Pubblici ${regime} | Concoro`,
      description: `Concorsi pubblici attivi con contratto ${regime}. Trova la tua opportunità nel settore pubblico.`,
      images: ['https://www.concoro.it/hero-image.webp']
    }
  }
}

// Generate static params for common regimes
export async function generateStaticParams() {
  try {
    // Common regime types for static generation
    const commonRegimes = [
      'tempo-pieno',
      'part-time',
      'tempo-determinato',
      'tempo-indeterminato',
      'contratto',
      'stage',
      'tirocinio'
    ]
    
    return commonRegimes.map(regime => ({
      regime: regime
    }))
  } catch (error) {
    console.error('Error generating static params for regimes:', error)
    return []
  }
}

export default async function RegimePage({ params }: RegimePageProps) {
  let data
  
  try {
    data = await getRegimeData(params.regime)
  } catch (error) {
    console.error('Failed to get regime data:', error)
    notFound()
  }
  
  if (!data || !data.regime) {
    notFound()
  }

  // Generate structured data for the regime page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Concorsi Pubblici con contratto ${data.regime}`,
    description: `Tutti i concorsi pubblici attivi con contratto ${data.regime}`,
    url: `https://www.concoro.it/bandi/regime/${params.regime}`,
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
          employmentType: data.regime,
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
      { '@type': 'ListItem', position: 3, name: 'Regime', item: 'https://www.concoro.it/bandi' },
      { '@type': 'ListItem', position: 4, name: `Concorsi ${data.regime}`, item: `https://www.concoro.it/bandi/regime/${params.regime}` }
    ]
  }

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Cosa significa contratto ${data.regime}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `I concorsi con contratto ${data.regime} offrono specifiche modalità di impiego. Consulta ogni bando per i dettagli contrattuali specifici.`
        }
      },
      {
        '@type': 'Question',
        name: `Come trovare concorsi con contratto ${data.regime}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Questa pagina elenca tutti i concorsi pubblici attivi con contratto ${data.regime}. Filtra per ente o località per risultati più specifici.`
        }
      },
      {
        '@type': 'Question',
        name: `Quali enti offrono contratti ${data.regime}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Diversi enti pubblici offrono contratti ${data.regime}. Consulta l'elenco degli enti per esplorare le opportunità disponibili.`
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
        <RegimeClient 
          regime={data.regime}
          concorsi={data.concorsi}
          totalCount={data.totalCount}
          enti={data.enti}
          locations={data.locations}
          settori={data.settori}
          regimeSlug={params.regime}
        />
      </Suspense>
    </>
  )
}