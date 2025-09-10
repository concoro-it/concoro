import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { slugToLocationDisplay } from '@/lib/utils/region-utils'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'
import LocationClient from './client-page'

interface LocationPageProps {
  params: {
    location: string
  }
}

// Normalize location slug to proper location name
function normalizeLocationSlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') {
    return null
  }
  
  // Decode and clean the slug
  const decoded = decodeURIComponent(slug).toLowerCase()
  
  // Basic validation - ensure it doesn't contain invalid characters
  if (!/^[a-z0-9\s-]+$/.test(decoded)) {
    return null
  }
  
  return slugToLocationDisplay(decoded)
}

async function getLocationData(locationSlug: string) {
  const location = normalizeLocationSlug(locationSlug)
  
  if (!location) {
    return null
  }

  return await fetchLocationDataFromFirestore(location, locationSlug)
}

async function fetchLocationDataFromFirestore(location: string, locationSlug: string) {
  const startTime = Date.now()
  console.log(`📋 Fetching data for location: ${location} (optimized query)`)
  
  const { getLocationConcorsi, getLocationEnti } = await import('@/lib/services/location-queries')
  
  // Use the location service with optimized query
  // Get concorsi for this location
  const concorsiResult = await getLocationConcorsi({
    location: locationSlug,
    Stato: 'OPEN',
    limit: 500 // Increased limit to get more concorsi
  })
  
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
    publication_date: concorso.publication_date ? (concorso.publication_date.seconds ? { seconds: concorso.publication_date.seconds, nanoseconds: concorso.publication_date.nanoseconds } : concorso.publication_date) : null,
    province: concorso.province || []
  }))
  
  // Extract unique enti and provinces from the filtered concorsi
  const uniqueEnti = new Set<string>()
  const uniqueProvinces = new Set<string>()
  
  concorsi.forEach(concorso => {
    if (concorso.Ente && concorso.Ente.trim()) {
      uniqueEnti.add(concorso.Ente.trim())
    }
    // Extract provinces from the province array
    if (Array.isArray(concorso.province)) {
      concorso.province.forEach(p => {
        if (p.provincia_nome && p.provincia_nome.trim()) {
          uniqueProvinces.add(p.provincia_nome.trim())
        }
      })
    }
  })
  
  // Log the provinces we found
  const sortedProvinces = Array.from(uniqueProvinces).sort()
  console.log(`Found ${sortedProvinces.length} provinces:`, sortedProvinces)

  const result = {
    location: String(location),
    concorsi,
    totalCount: concorsi.length,
    enti: Array.from(uniqueEnti).sort(),
    provinces: sortedProvinces
  }
  
  const duration = Date.now() - startTime
  console.log(`📋 ✅ Optimized query: ${concorsi.length} concorsi for ${location} in ${duration}ms`)
  
  return result
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const location = normalizeLocationSlug(params.location)
  
  if (!location) {
    return {
      title: 'Località non trovata | Concoro',
      description: 'La località richiesta non è stata trovata.'
    }
  }

  // Use static text for metadata to avoid slow queries
  return {
    title: `Concorsi Pubblici ${location} - Diverse opportunità | Concoro`,
    description: `Scopri tutti i concorsi pubblici attivi in ${location}. Diverse opportunità di lavoro nel settore pubblico. Candidati subito!`,
    keywords: `concorsi pubblici ${location}, lavoro pubblico ${location}, bandi ${location}`,
    openGraph: {
      title: `Concorsi Pubblici ${location} | Concoro`,
      description: `Concorsi pubblici attivi in ${location}. Trova la tua opportunità nel settore pubblico.`,
      type: 'website',
      url: `https://www.concoro.it/bandi/localita/${params.location}`,
      siteName: 'Concoro',
      locale: 'it_IT',
      images: [
        {
          url: 'https://www.concoro.it/hero-image.webp',
          width: 1200,
          height: 630,
          alt: `Concorsi Pubblici ${location}`
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
      canonical: `https://www.concoro.it/bandi/localita/${params.location}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Concorsi Pubblici ${location} | Concoro`,
      description: `Concorsi pubblici attivi in ${location}. Trova la tua opportunità nel settore pubblico.`,
      images: ['https://www.concoro.it/hero-image.webp']
    }
  }
}

// Generate static params for common locations
export async function generateStaticParams() {
  try {
    // Get available locations from our service
    const { getAvailableLocations } = await import('@/lib/services/location-queries')
    const locations = await getAvailableLocations()
    
    // Limit to most common locations for static generation
    const commonLocations = locations.slice(0, 50) // Take first 50 locations
    
    return commonLocations.map(location => ({
      location: location
    }))
  } catch (error) {
    console.error('Error generating static params for locations:', error)
    return []
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  let data
  
  try {
    data = await getLocationData(params.location)
  } catch (error) {
    console.error('Failed to get location data:', error)
    notFound()
  }
  
  if (!data || !data.location) {
    notFound()
  }

  // Generate structured data for the location page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Concorsi Pubblici ${data.location}`,
    description: `Tutti i concorsi pubblici attivi in ${data.location}`,
    url: `https://www.concoro.it/bandi/localita/${params.location}`,
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
              addressLocality: data.location,
              addressCountry: 'IT'
            }
          },
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
      { '@type': 'ListItem', position: 3, name: 'Località', item: 'https://www.concoro.it/bandi' },
      { '@type': 'ListItem', position: 4, name: `Concorsi Pubblici ${data.location}`, item: `https://www.concoro.it/bandi/localita/${params.location}` }
    ]
  }

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Come trovare concorsi pubblici in ${data.location}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Consulta questa pagina per i concorsi attivi in ${data.location}, filtra per ente o provincia e accedi ai dettagli per candidarti.`
        }
      },
      {
        '@type': 'Question',
        name: `Quali sono le scadenze per i concorsi a ${data.location}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Ogni scheda concorso riporta la data di scadenza. Aggiorniamo quotidianamente i bandi in ${data.location}.`
        }
      },
      {
        '@type': 'Question',
        name: `Quali enti pubblicano bandi in ${data.location}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Troverai bandi da Comuni, Province, ASL, Università e altri enti in ${data.location}. Usa l'elenco enti per navigare rapidamente.`
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
        <LocationClient 
          location={data.location}
          concorsi={data.concorsi}
          totalCount={data.totalCount}
          enti={data.enti}
          locationSlug={params.location}
          provinces={data.provinces}
        />
      </Suspense>
    </>
  )
}
