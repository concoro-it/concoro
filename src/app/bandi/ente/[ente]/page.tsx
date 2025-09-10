import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'
import EnteClient from './client-page'

interface EntePageProps {
  params: {
    ente: string
  }
}

// Normalize ente slug to proper ente name
function normalizeEnteSlug(slug: string): string | null {
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

async function getEnteData(enteSlug: string) {
  const ente = normalizeEnteSlug(enteSlug)
  
  if (!ente) {
    return null
  }

  return await fetchEnteDataFromService(ente)
}

async function fetchEnteDataFromService(ente: string) {
  const startTime = Date.now()
  console.log(`🏢 Fetching data for ente: ${ente} (single service call)`)
  
  try {
    // Single, clean service call using Firebase index
    const { getEnteData } = await import('@/lib/services/ente-service')
    const data = await getEnteData(ente)
    
    const duration = Date.now() - startTime
    console.log(`🏢 ✅ Single service call: ${data?.concorsi?.length || 0} concorsi for ${ente} in ${duration}ms`)
    
    return data
  } catch (error) {
    console.error('Error fetching ente data from service:', error)
    return null
  }
}

export async function generateMetadata({ params }: EntePageProps): Promise<Metadata> {
  const ente = normalizeEnteSlug(params.ente)
  
  if (!ente) {
    return {
      title: 'Ente non trovato | Concoro',
      description: 'L\'ente richiesto non è stato trovato.'
    }
  }

  // Use static text for metadata to avoid slow queries
  return {
    title: `Concorsi Pubblici ${ente} - Diverse opportunità | Concoro`,
    description: `Scopri tutti i concorsi pubblici attivi di ${ente}. Diverse opportunità di lavoro nel settore pubblico. Candidati subito!`,
    keywords: `concorsi pubblici ${ente}, lavoro pubblico ${ente}, bandi ${ente}`,
    openGraph: {
      title: `Concorsi Pubblici ${ente} | Concoro`,
      description: `Concorsi pubblici attivi di ${ente}. Trova la tua opportunità nel settore pubblico.`,
      type: 'website',
      url: `https://www.concoro.it/bandi/ente/${params.ente}`,
      siteName: 'Concoro',
      locale: 'it_IT',
      images: [
        {
          url: 'https://www.concoro.it/hero-image.webp',
          width: 1200,
          height: 630,
          alt: `Concorsi Pubblici ${ente}`
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
      canonical: `https://www.concoro.it/bandi/ente/${params.ente}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Concorsi Pubblici ${ente} | Concoro`,
      description: `Concorsi pubblici attivi di ${ente}. Trova la tua opportunità nel settore pubblico.`,
      images: ['https://www.concoro.it/hero-image.webp']
    }
  }
}

// Generate static params for common enti
export async function generateStaticParams() {
  try {
    // Use the simple ente service
    const { getAvailableEnti } = await import('@/lib/services/ente-service')
    const enti = await getAvailableEnti(50) // Get first 50 enti
    
    return enti.map(ente => ({
      ente: encodeURIComponent(ente)
    }))
  } catch (error) {
    console.error('Error generating static params for enti:', error)
    return []
  }
}

export default async function EntePage({ params }: EntePageProps) {
  let data
  
  try {
    data = await getEnteData(params.ente)
  } catch (error) {
    console.error('Failed to get ente data:', error)
    notFound()
  }
  
  if (!data || !data.ente) {
    notFound()
  }

  // Generate structured data for the ente page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Concorsi Pubblici ${data.ente}`,
    description: `Tutti i concorsi pubblici attivi di ${data.ente}`,
    url: `https://www.concoro.it/bandi/ente/${params.ente}`,
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
      { '@type': 'ListItem', position: 3, name: 'Enti', item: 'https://www.concoro.it/bandi' },
      { '@type': 'ListItem', position: 4, name: `Concorsi Pubblici ${data.ente}`, item: `https://www.concoro.it/bandi/ente/${params.ente}` }
    ]
  }

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Come candidarsi ai concorsi di ${data.ente}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Consulta questa pagina per i concorsi attivi di ${data.ente}, accedi ai dettagli di ogni bando e segui le istruzioni per la candidatura.`
        }
      },
      {
        '@type': 'Question',
        name: `Quali sono le scadenze per i concorsi di ${data.ente}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Ogni scheda concorso riporta la data di scadenza. Aggiorniamo quotidianamente i bandi di ${data.ente}.`
        }
      },
      {
        '@type': 'Question',
        name: `In quali settori assume ${data.ente}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${data.ente} pubblica concorsi in diversi settori professionali. Consulta l'elenco completo dei settori e delle opportunità disponibili.`
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
        <EnteClient 
          ente={data.ente}
          concorsi={data.concorsi}
          totalCount={data.totalCount}
          locations={data.locations}
          settori={data.settori}
          enteSlug={params.ente}
        />
      </Suspense>
    </>
  )
}