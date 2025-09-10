import { Metadata } from 'next'

// Base site configuration
export const SITE_CONFIG = {
  name: 'Concoro',
  url: 'https://www.concoro.it',
  description: 'La piattaforma leader per trovare e candidarsi ai concorsi pubblici in Italia',
  keywords: [
    'concorsi pubblici',
    'bandi pubblici', 
    'lavoro pubblico',
    'concorsi italia',
    'bandi di concorso',
    'pubblica amministrazione',
    'inpa',
    'gazzetta ufficiale'
  ]
}

// SEO metadata interfaces
export interface SEOPageData {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  openGraph?: {
    title?: string
    description?: string
    type?: 'website' | 'article'
    images?: string[]
  }
  twitter?: {
    card?: 'summary' | 'summary_large_image'
    title?: string
    description?: string
    images?: string[]
  }
}

/**
 * Generate SEO-optimized metadata for guest pages
 */
export function generateGuestPageMetadata(pageData: SEOPageData): Metadata {
  const baseUrl = SITE_CONFIG.url
  
  return {
    title: pageData.title,
    description: pageData.description,
    keywords: pageData.keywords?.join(', '),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageData.canonical || baseUrl,
    },
    openGraph: {
      type: pageData.openGraph?.type || 'website',
      title: pageData.openGraph?.title || pageData.title,
      description: pageData.openGraph?.description || pageData.description,
      url: pageData.canonical || baseUrl,
      siteName: SITE_CONFIG.name,
      locale: 'it_IT',
      images: pageData.openGraph?.images || [`${baseUrl}/hero-image.webp`],
    },
    twitter: {
      card: pageData.twitter?.card || 'summary_large_image',
      title: pageData.twitter?.title || pageData.title,
      description: pageData.twitter?.description || pageData.description,
      images: pageData.twitter?.images || [`${baseUrl}/hero-image.webp`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * Homepage SEO metadata
 */
export function getHomepageMetadata(): Metadata {
  const pageData: SEOPageData = {
    title: 'Concoro - Cerca Concorsi Pubblici e Bandi di Lavoro | Piattaforma #1 in Italia',
    description: 'Trova e candidati ai migliori concorsi pubblici in Italia. Database aggiornato giornalmente con +1600 bandi attivi. Registrazione gratuita.',
    keywords: [
      ...SITE_CONFIG.keywords,
      'ricerca lavoro pubblico',
      'candidatura concorsi',
      'notifiche bandi',
      'piattaforma concorsi'
    ],
    canonical: SITE_CONFIG.url,
    openGraph: {
      type: 'website',
      images: [`${SITE_CONFIG.url}/hero-image.webp`],
    }
  }
  
  return generateGuestPageMetadata(pageData)
}

/**
 * Bandi listing page SEO metadata
 */
export function getBandiListingMetadata(): Metadata {
  const currentYear = new Date().getFullYear();
  const pageData: SEOPageData = {
    title: `Cerca Concorsi Pubblici ${currentYear} | +1600 Bandi Attivi | Concoro`,
    description: 'Scopri +1600 concorsi pubblici attivi. Filtra per regione, categoria e scadenza. Candidati subito alle migliori opportunità nel settore pubblico.',
    keywords: [
      `concorsi pubblici ${currentYear}`,
      'bandi attivi',
      'ricerca concorsi',
      'filtri concorsi',
      'scadenze bandi',
      'opportunità pubbliche'
    ],
    canonical: `${SITE_CONFIG.url}/bandi`,
    openGraph: {
      type: 'website',
      title: 'Cerca Concorsi Pubblici Attivi | Concoro',
      description: 'Database completo dei concorsi pubblici in Italia. Oltre 1600 bandi attivi aggiornati quotidianamente.',
    }
  }
  
  return generateGuestPageMetadata(pageData)
}

/**
 * Individual job page SEO metadata for guests
 */
export function getJobPageMetadata(job: {
  Titolo?: string
  Title?: string
  Ente?: string
  AreaGeografica?: string
  DataChiusura?: string | any
  Descrizione?: string
  riassunto?: string
  id: string
}): Metadata {
  // Extract job details
  const title = job.Titolo || job.Title || 'Concorso Pubblico'
  const ente = job.Ente || 'Pubblica Amministrazione'
  const location = job.AreaGeografica || ''
  const description = job.Descrizione || job.riassunto || ''
  
  // Generate SEO-friendly title
  let seoTitle = title
  if (location) {
    seoTitle += ` ${location}`
  }
  seoTitle += ' - Concorso Pubblico | Concoro'
  
  // Truncate title if too long
  if (seoTitle.length > 60) {
    const maxLength = 60 - ' | Concoro'.length
    seoTitle = seoTitle.substring(0, maxLength).trim() + ' | Concoro'
  }
  
  // Generate description
  let seoDescription = `${title} presso ${ente}`
  if (location) {
    seoDescription += ` a ${location}`
  }
  seoDescription += '. Scopri requisiti, scadenze e come candidarti. Tutte le informazioni su Concoro.'
  
  // Ensure description is within limits
  if (seoDescription.length > 160) {
    seoDescription = seoDescription.substring(0, 157) + '...'
  }
  
  const pageData: SEOPageData = {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      title.toLowerCase(),
      'concorso pubblico',
      'bando',
      ...(location ? [location.toLowerCase()] : []),
      ente.toLowerCase(),
      'candidatura',
      'requisiti'
    ],
    canonical: `${SITE_CONFIG.url}/bandi/${job.id}`,
    openGraph: {
      type: 'article',
      title: seoTitle,
      description: seoDescription,
    }
  }
  
  return generateGuestPageMetadata(pageData)
}

/**
 * Blog page SEO metadata
 */
export function getBlogPageMetadata(selectedTag?: string): Metadata {
  let title = 'Blog Concorsi Pubblici - Guide e Consigli | Concoro'
  let description = 'Guide pratiche per concorsi pubblici: strategie, consigli e aggiornamenti. Preparati al meglio con gli esperti di Concoro.'
  
  if (selectedTag) {
    title = `${selectedTag} - Blog Concorsi Pubblici | Concoro`
    description = `Articoli e guide su ${selectedTag.toLowerCase()} per concorsi pubblici. Consigli pratici e strategie di preparazione.`
  }
  
  const pageData: SEOPageData = {
    title,
    description,
    keywords: [
      'blog concorsi pubblici',
      'guide concorsi',
      'preparazione concorsi',
      'consigli bandi',
      'strategie concorsi',
      ...(selectedTag ? [selectedTag.toLowerCase()] : [])
    ],
    canonical: selectedTag ? `${SITE_CONFIG.url}/blog?tag=${selectedTag}` : `${SITE_CONFIG.url}/blog`,
    openGraph: {
      type: 'website',
      title: `Blog Concorsi Pubblici | Concoro`,
      description: 'Guide e consigli per prepararsi ai concorsi pubblici in Italia.',
    }
  }
  
  return generateGuestPageMetadata(pageData)
}

/**
 * About page SEO metadata
 */
export function getAboutPageMetadata(): Metadata {
  const pageData: SEOPageData = {
    title: 'Chi Siamo - Concoro | La Piattaforma Leader per Concorsi Pubblici',
    description: 'Scopri la missione di Concoro: semplificare l\'accesso ai concorsi pubblici in Italia. Aiutiamo migliaia di cittadini a trovare lavoro nel settore pubblico.',
    keywords: [
      'chi siamo concoro',
      'missione concoro',
      'piattaforma concorsi',
      'team concoro',
      'storia concoro',
      'obiettivi concoro'
    ],
    canonical: `${SITE_CONFIG.url}/chi-siamo`,
    openGraph: {
      type: 'website',
      title: 'Chi Siamo | Concoro',
      description: 'La piattaforma leader che aiuta migliaia di cittadini a trovare lavoro nel settore pubblico.',
    }
  }
  
  return generateGuestPageMetadata(pageData)
}

/**
 * Pricing page SEO metadata  
 */
export function getPricingPageMetadata(): Metadata {
  const pageData: SEOPageData = {
    title: 'Prezzi e Piani Concoro | Trova Concorsi Pubblici Gratis o Premium',
    description: 'Scopri i piani di Concoro: dal piano gratuito a quello premium con AI personalizzata. Trova il piano perfetto per la tua ricerca nel settore pubblico.',
    keywords: [
      'prezzi concoro',
      'piani concoro',
      'abbonamento concorsi',
      'piano gratuito',
      'piano premium',
      'costi concoro'
    ],
    canonical: `${SITE_CONFIG.url}/prezzi`,
    openGraph: {
      type: 'website',
      title: 'Prezzi e Piani | Concoro',
      description: 'Scegli il piano perfetto per la tua ricerca di lavoro nel settore pubblico. Dal piano gratuito al premium con AI.',
    }
  }
  
  return generateGuestPageMetadata(pageData)
}

/**
 * Contact page SEO metadata
 */
export function getContactPageMetadata(): Metadata {
  const pageData: SEOPageData = {
    title: 'Contatti Concoro | Assistenza e Supporto Clienti',
    description: 'Contatta il team di Concoro per assistenza, domande o suggerimenti. Siamo qui per supportarti nella ricerca di concorsi pubblici.',
    keywords: [
      'contatti concoro',
      'assistenza concoro',
      'supporto clienti',
      'help concoro',
      'info concoro'
    ],
    canonical: `${SITE_CONFIG.url}/contatti`,
    openGraph: {
      type: 'website',
      title: 'Contatti | Concoro',
      description: 'Il team di Concoro è qui per supportarti. Contattaci per assistenza o domande.',
    }
  }
  
  return generateGuestPageMetadata(pageData)
}

/**
 * Generate JSON-LD structured data for Organization
 */
export function getOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/concoro-logo-light.svg`,
    description: SITE_CONFIG.description,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+39-000-000-0000',
      contactType: 'customer service',
      availableLanguage: 'Italian'
    },
    sameAs: [
      // Add social media URLs when available
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IT',
      addressLocality: 'Italia'
    }
  }
}

/**
 * Generate JSON-LD structured data for WebSite with search action
 */
export function getWebSiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/bandi?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

/**
 * Generate JSON-LD structured data for JobPosting (guest view)
 */
export function getJobPostingStructuredData(job: {
  Titolo?: string
  Title?: string
  Ente?: string
  AreaGeografica?: string
  DataChiusura?: string | any
  DataApertura?: string | any
  Descrizione?: string
  riassunto?: string
  numero_di_posti?: number
  id: string
}) {
  const title = job.Titolo || job.Title || 'Concorso Pubblico'
  const ente = job.Ente || 'Pubblica Amministrazione'
  const location = job.AreaGeografica || 'Italia'
  const description = job.Descrizione || job.riassunto || title
  
  // Parse dates safely
  let validThrough: string | undefined
  let datePosted: string | undefined
  
  try {
    if (job.DataChiusura) {
      if (typeof job.DataChiusura === 'object' && 'seconds' in job.DataChiusura) {
        validThrough = new Date(job.DataChiusura.seconds * 1000).toISOString()
      } else if (typeof job.DataChiusura === 'string') {
        validThrough = new Date(job.DataChiusura).toISOString()
      }
    }
    
    if (job.DataApertura) {
      if (typeof job.DataApertura === 'object' && 'seconds' in job.DataApertura) {
        datePosted = new Date(job.DataApertura.seconds * 1000).toISOString()
      } else if (typeof job.DataApertura === 'string') {
        datePosted = new Date(job.DataApertura).toISOString()
      }
    }
  } catch (error) {
    console.warn('Error parsing job dates for structured data:', error)
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: title,
    description: description,
    identifier: {
      '@type': 'PropertyValue',
      name: ente,
      value: job.id
    },
    datePosted: datePosted || new Date().toISOString(),
    validThrough: validThrough,
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: ente,
      sameAs: SITE_CONFIG.url
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
        addressCountry: 'IT'
      }
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'EUR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 999999,
        unitText: 'YEAR'
      }
    },
    ...(job.numero_di_posti && {
      totalJobOpenings: job.numero_di_posti
    })
  }
}

