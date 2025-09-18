import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { getItalianRegions } from '@/lib/utils/region-utils'
import LocalitaIndexClient from './client-page'

export const metadata: Metadata = {
  title: 'Concorsi per Località - Tutte le Regioni e Province | Concoro',
  description: 'Esplora i concorsi pubblici per regione e provincia. Trova opportunità di lavoro nel settore pubblico nella tua zona.',
  keywords: 'concorsi pubblici per località, concorsi per regione, concorsi per provincia, lavoro pubblico Italia',
  openGraph: {
    title: 'Concorsi per Località | Concoro',
    description: 'Esplora i concorsi pubblici per regione e provincia. Trova opportunità di lavoro nel settore pubblico nella tua zona.',
    type: 'website',
    url: 'https://www.concoro.it/bandi/localita',
    siteName: 'Concoro',
    locale: 'it_IT',
    images: [
      {
        url: 'https://www.concoro.it/hero-image.webp',
        width: 1200,
        height: 630,
        alt: 'Concorsi per Località'
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
    canonical: 'https://www.concoro.it/bandi/localita',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Concorsi per Località | Concoro',
    description: 'Esplora i concorsi pubblici per regione e provincia. Trova opportunità di lavoro nel settore pubblico nella tua zona.',
    images: ['https://www.concoro.it/hero-image.webp']
  }
}

async function getAllRegionsData() {
  const startTime = Date.now()
  console.log(`🗺️ Fetching data for all regions (index page)`)
  
  try {
    // Get all Italian regions
    const regions = getItalianRegions()
    
    // Use unified ConcorsiService for all regions
    const { concorsiService } = await import('@/lib/services/concorsi-service')
    
    // Fetch data for all regions in parallel using unified service
    const regionDataPromises = regions.map(async (region) => {
      try {
        const regionSlug = region.toLowerCase().replace(/\s+/g, '-')
        const result = await concorsiService.getConcorsiByLocation(regionSlug, {
          Stato: 'OPEN',
          limit: 100 // Limit for index page
        })
        
        return {
          region,
          concorsiCount: result.concorsi.length,
          concorsi: result.concorsi
        }
      } catch (error) {
        console.error(`Error fetching data for region ${region}:`, error)
        return {
          region,
          concorsiCount: 0,
          concorsi: []
        }
      }
    })
    
    const regionsData = await Promise.all(regionDataPromises)
    
    const duration = Date.now() - startTime
    console.log(`🗺️ ✅ Fetched data for ${regionsData.length} regions in ${duration}ms`)
    
    return regionsData
  } catch (error) {
    console.error('Error fetching all regions data:', error)
    return []
  }
}

export default async function LocalitaIndexPage() {
  let regionsData
  
  try {
    regionsData = await getAllRegionsData()
  } catch (error) {
    console.error('Failed to get regions data:', error)
    notFound()
  }
  
  if (!regionsData || regionsData.length === 0) {
    notFound()
  }

  // Generate structured data for the localita index page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Concorsi Pubblici per Località',
    description: 'Esplora i concorsi pubblici per regione e provincia in Italia',
    url: 'https://www.concoro.it/bandi/localita',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: regionsData.length,
      itemListElement: regionsData.map((regionData, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Place',
          name: regionData.region,
          address: {
            '@type': 'PostalAddress',
            addressRegion: regionData.region,
            addressCountry: 'IT'
          },
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'concorsi_count',
            value: regionData.concorsiCount
          }
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
      { '@type': 'ListItem', position: 3, name: 'Località', item: 'https://www.concoro.it/bandi/localita' }
    ]
  }

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Come trovare concorsi pubblici nella mia regione?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Seleziona la tua regione dalla lista e accedi ai concorsi disponibili. Puoi anche esplorare le singole province per risultati più specifici.'
        }
      },
      {
        '@type': 'Question',
        name: 'Quali regioni hanno più concorsi pubblici?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ogni regione mostra il numero di concorsi attivi. Le regioni con più concorsi sono generalmente Lombardia, Lazio, Campania e Emilia-Romagna.'
        }
      },
      {
        '@type': 'Question',
        name: 'Posso filtrare i concorsi per provincia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sì, clicca su una regione per vedere le province disponibili e accedere ai concorsi specifici di quella provincia.'
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
        <LocalitaIndexClient regionsData={regionsData} />
      </Suspense>
    </>
  )
}
