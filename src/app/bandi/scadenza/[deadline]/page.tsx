import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'
import ScadenzaClient from './client-page'

interface ScadenzaPageProps {
  params: {
    deadline: string
  }
}

// Normalize deadline slug to proper deadline name
function normalizeDeadlineSlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') {
    return null
  }
  
  // Decode and clean the slug
  const decoded = decodeURIComponent(slug).toLowerCase()
  
  // Basic validation - ensure it doesn't contain invalid characters
  if (!/^[a-z0-9\s-]+$/.test(decoded)) {
    return null
  }
  
  // Map common deadline variations
  const deadlineMap: Record<string, string> = {
    'questa-settimana': 'Questa settimana',
    'prossima-settimana': 'Prossima settimana',
    'questo-mese': 'Questo mese',
    'prossimo-mese': 'Prossimo mese',
    'entro-30-giorni': 'Entro 30 giorni',
    'entro-60-giorni': 'Entro 60 giorni',
    'entro-90-giorni': 'Entro 90 giorni'
  }
  
  return deadlineMap[decoded] || decoded.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

async function getScadenzaData(deadlineSlug: string) {
  const scadenza = normalizeDeadlineSlug(deadlineSlug)
  
  if (!scadenza) {
    return null
  }

  return await fetchScadenzaDataFromFirestore(scadenza, deadlineSlug)
}

async function fetchScadenzaDataFromFirestore(scadenza: string, deadlineSlug: string) {
  const startTime = Date.now()
  console.log(`📅 Fetching data for scadenza: ${scadenza} (optimized query)`)
  
  const { concorsiService } = await import('@/lib/services/concorsi-service')
  
  try {
    // Map deadline display names to API values
    const scadenzaApiMap: Record<string, string> = {
      'Questa settimana': 'questa-settimana',
      'Prossima settimana': 'prossima-settimana',
      'Questo mese': 'questo-mese',
      'Prossimo mese': 'prossimo-mese',
      'Entro 30 giorni': 'entro-30-giorni',
      'Entro 60 giorni': 'entro-60-giorni',
      'Entro 90 giorni': 'entro-90-giorni'
    }
    
    const apiScadenza = scadenzaApiMap[scadenza] || deadlineSlug

    // Use the scadenza service with optimized query
    const result = await concorsiService.getConcorsiByScadenza(apiScadenza, {
      Stato: 'OPEN',
      limit: 500, // Get more concorsi for scadenza pages
      orderByField: 'DataChiusura',
      orderDirection: 'asc' // Closest deadlines first
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
      scadenza: String(scadenza),
      concorsi,
      totalCount: concorsi.length,
      enti: Array.from(uniqueEnti).sort(),
      locations: Array.from(uniqueLocations).sort(),
      settori: Array.from(uniqueSettori).sort()
    }
    
    const duration = Date.now() - startTime
    console.log(`📅 ✅ Optimized query: ${concorsi.length} concorsi for ${scadenza} in ${duration}ms`)
    
    return resultData
  } catch (error) {
    console.error('Error fetching scadenza data:', error)
    return null
  }
}

export async function generateMetadata({ params }: ScadenzaPageProps): Promise<Metadata> {
  const scadenza = normalizeDeadlineSlug(params.deadline)
  
  if (!scadenza) {
    return {
      title: 'Scadenza non trovata | Concoro',
      description: 'La scadenza richiesta non è stata trovata.'
    }
  }

  // Use static text for metadata to avoid slow queries
  return {
    title: `Concorsi Pubblici in scadenza ${scadenza} - Diverse opportunità | Concoro`,
    description: `Scopri tutti i concorsi pubblici in scadenza ${scadenza}. Diverse opportunità di lavoro nel settore pubblico. Candidati subito prima che scadano!`,
    keywords: `concorsi pubblici ${scadenza}, bandi in scadenza, concorsi scadenza ${scadenza}`,
    openGraph: {
      title: `Concorsi Pubblici in scadenza ${scadenza} | Concoro`,
      description: `Concorsi pubblici in scadenza ${scadenza}. Non perdere le opportunità nel settore pubblico.`,
      type: 'website',
      url: `https://www.concoro.it/bandi/scadenza/${params.deadline}`,
      siteName: 'Concoro',
      locale: 'it_IT',
      images: [
        {
          url: 'https://www.concoro.it/hero-image.webp',
          width: 1200,
          height: 630,
          alt: `Concorsi Pubblici in scadenza ${scadenza}`
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
      canonical: `https://www.concoro.it/bandi/scadenza/${params.deadline}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Concorsi Pubblici in scadenza ${scadenza} | Concoro`,
      description: `Concorsi pubblici in scadenza ${scadenza}. Non perdere le opportunità nel settore pubblico.`,
      images: ['https://www.concoro.it/hero-image.webp']
    }
  }
}

// Generate static params for common deadlines
export async function generateStaticParams() {
  try {
    // Common deadline types for static generation
    const commonDeadlines = [
      'questa-settimana',
      'prossima-settimana',
      'questo-mese',
      'prossimo-mese',
      'entro-30-giorni',
      'entro-60-giorni',
      'entro-90-giorni'
    ]
    
    return commonDeadlines.map(deadline => ({
      deadline: deadline
    }))
  } catch (error) {
    console.error('Error generating static params for deadlines:', error)
    return []
  }
}

export default async function ScadenzaPage({ params }: ScadenzaPageProps) {
  let data
  
  try {
    data = await getScadenzaData(params.deadline)
  } catch (error) {
    console.error('Failed to get scadenza data:', error)
    notFound()
  }
  
  if (!data || !data.scadenza) {
    notFound()
  }

  // Generate structured data for the scadenza page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Concorsi Pubblici in scadenza ${data.scadenza}`,
    description: `Tutti i concorsi pubblici in scadenza ${data.scadenza}`,
    url: `https://www.concoro.it/bandi/scadenza/${params.deadline}`,
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
      { '@type': 'ListItem', position: 3, name: 'Scadenza', item: 'https://www.concoro.it/bandi' },
      { '@type': 'ListItem', position: 4, name: `Concorsi in scadenza ${data.scadenza}`, item: `https://www.concoro.it/bandi/scadenza/${params.deadline}` }
    ]
  }

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Come candidarsi ai concorsi in scadenza ${data.scadenza}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Consulta questa pagina per i concorsi in scadenza ${data.scadenza}, accedi ai dettagli di ogni bando e candidati prima della scadenza.`
        }
      },
      {
        '@type': 'Question',
        name: `Quando scadono esattamente i concorsi?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Ogni scheda concorso riporta la data di scadenza esatta. Ti consigliamo di candidarti il prima possibile per evitare di perdere l'opportunità.`
        }
      },
      {
        '@type': 'Question',
        name: `Come restare aggiornati sui concorsi in scadenza?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Visita regolarmente questa pagina o attiva le notifiche per essere informato sui nuovi concorsi e sulle scadenze imminenti.`
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
        <ScadenzaClient 
          scadenza={data.scadenza}
          concorsi={data.concorsi}
          totalCount={data.totalCount}
          enti={data.enti}
          locations={data.locations}
          settori={data.settori}
          deadlineSlug={params.deadline}
        />
      </Suspense>
    </>
  )
}