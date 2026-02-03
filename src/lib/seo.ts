import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: any;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = '/og-image.jpg',
    ogType = 'website',
    noIndex = false,
  } = config;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it';
  const fullTitle = title.includes('Concoro') ? title : `${title} | Concoro`;
  const fullDescription = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: keywords.join(', '),
    authors: [{ name: 'Concoro Team' }],
    creator: 'Concoro',
    publisher: 'Concoro',
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: ogType,
      locale: 'it_IT',
      url: canonical ? `${siteUrl}${canonical}` : undefined,
      title: fullTitle,
      description: fullDescription,
      siteName: 'Concoro',
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@concoro_it',
      creator: '@concoro_it',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`],
    },
    alternates: {
      canonical: canonical ? `${siteUrl}${canonical}` : undefined,
    },
    other: {
      'application-name': 'Concoro',
      'apple-mobile-web-app-title': 'Concoro',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': '#0A1F44',
      'theme-color': '#0A1F44',
    },
  };
}

// Predefined SEO configurations for common pages
export const seoConfigs = {
  home: {
    title: 'Concoro - Trova la tua prossima opportunità nel settore pubblico',
    description: 'Scopri tutti i concorsi pubblici in Italia. Concoro semplifica la ricerca di lavoro nella pubblica amministrazione con filtri intelligenti, notifiche personalizzate e riassunti chiari dei bandi.',
    keywords: [
      'concorsi pubblici',
      'lavoro pubblico',
      'pubblica amministrazione',
      'bandi concorsi',
      'concorsi 2025',
      'gazzetta ufficiale',
      'inpa',
      'lavoro pa',
      'concorsi statali',
      'concorsi regionali',
      'concorsi comunali'
    ],
    canonical: '/',
  },

  concorsi: {
    title: 'Concorsi Pubblici 2026 - Trova il Tuo Lavoro nella Pubblica Amministrazione',
    description: 'Scopri tutti i concorsi pubblici aperti in Italia. Filtra per ente, località e settore professionale. Candidati oggi per il tuo futuro nella PA.',
    keywords: [
      'Concorsi Pubblici 2026',
      'bandi aperti',
      'concorsi statali',
      'concorsi regionali',
      'concorsi comunali',
      'lavoro pubblico',
      'pubblica amministrazione'
    ],
    canonical: '/concorsi',
  },

  concorsiByLocation: (location: string) => ({
    title: `Concorsi Pubblici ${location} 2025 - Lavoro nella PA`,
    description: `Concorsi pubblici aperti a ${location}. Trova opportunità di lavoro nella pubblica amministrazione nella tua zona.`,
    keywords: [
      `concorsi ${location}`,
      `lavoro pubblico ${location}`,
      `bandi ${location}`,
      'Concorsi Pubblici 2026',
      'pubblica amministrazione'
    ],
    canonical: `/concorsi?localita=${encodeURIComponent(location)}`,
  }),

  concorsiByOrganization: (organization: string) => ({
    title: `Concorsi ${organization} 2025 - Opportunità di Lavoro`,
    description: `Tutti i concorsi pubblici aperti presso ${organization}. Scopri le posizioni disponibili e candidati online.`,
    keywords: [
      `concorsi ${organization}`,
      `lavoro ${organization}`,
      'Concorsi Pubblici 2026',
      'bandi aperti',
      'pubblica amministrazione'
    ],
    canonical: `/concorsi?ente=${encodeURIComponent(organization)}`,
  }),

  concorsiBySector: (sector: string) => ({
    title: `Concorsi ${sector} 2025 - Opportunità Professionali`,
    description: `Concorsi pubblici nel settore ${sector}. Scopri le posizioni aperte e avvia la tua carriera nella PA.`,
    keywords: [
      `concorsi ${sector}`,
      `lavoro ${sector}`,
      'Concorsi Pubblici 2026',
      'bandi aperti',
      'pubblica amministrazione'
    ],
    canonical: `/concorsi?settore=${encodeURIComponent(sector)}`,
  }),

  concorsiBySearch: (searchTerm: string) => ({
    title: `Concorsi ${searchTerm} 2025 - Trova Opportunità di Lavoro Pubblico`,
    description: `Cerca concorsi pubblici per ${searchTerm}. Scopri tutte le opportunità disponibili nella pubblica amministrazione italiana. Candidati oggi per il tuo futuro nella PA.`,
    keywords: [
      `concorsi ${searchTerm}`,
      `lavoro ${searchTerm}`,
      `bandi ${searchTerm}`,
      'Concorsi Pubblici 2026',
      'pubblica amministrazione',
      'lavoro pubblico',
      `${searchTerm} pa`,
      `${searchTerm} concorso pubblico`
    ],
    canonical: `/concorsi?search=${encodeURIComponent(searchTerm)}`,
  }),

  blog: {
    title: 'Blog Concoro - Guide e Consigli per i Concorsi Pubblici',
    description: 'Scopri guide, consigli e approfondimenti sui concorsi pubblici. Tutto quello che devi sapere per affrontare con successo i bandi di concorso.',
    keywords: [
      'guide concorsi pubblici',
      'consigli concorsi',
      'come partecipare concorsi',
      'preparazione concorsi',
      'blog concorsi pubblici'
    ],
    canonical: '/blog',
  },

  about: {
    title: 'Chi Siamo - Concoro',
    description: 'Scopri la missione di Concoro: semplificare la ricerca di lavoro nella pubblica amministrazione italiana attraverso tecnologia e trasparenza.',
    keywords: [
      'chi siamo concoro',
      'missione concoro',
      'team concoro',
      'storia concoro'
    ],
    canonical: '/chi-siamo',
  },

  contact: {
    title: 'Contatti - Concoro',
    description: 'Contatta il team di Concoro per supporto, partnership o informazioni sui nostri servizi per i concorsi pubblici.',
    keywords: [
      'contatti concoro',
      'supporto concoro',
      'aiuto concorsi',
      'partnership concoro'
    ],
    canonical: '/contatti',
  },
};

// Generate structured data for different page types
export function generateStructuredData(type: string, data: any) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it';

  switch (type) {
    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Concoro',
        url: baseUrl,
        description: 'Piattaforma per la ricerca di concorsi pubblici in Italia',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/concorsi?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Concoro',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/concoro-logo-light.svg`,
          },
        },
      };

    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Concoro',
        url: baseUrl,
        logo: `${baseUrl}/concoro-logo-light.svg`,
        description: 'Piattaforma per la ricerca di concorsi pubblici in Italia',
        sameAs: [
          'https://twitter.com/concoro_it',
          'https://linkedin.com/company/concoro',
        ],
      };

    case 'jobPosting':
      return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: data.title,
        description: data.description,
        datePosted: data.datePosted,
        validThrough: data.validThrough,
        employmentType: 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: data.organization,
        },
        jobLocation: {
          '@type': 'Place',
          address: data.location,
        },
        url: `${baseUrl}/concorsi/${data.id}`,
      };

    case 'breadcrumbList':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${baseUrl}${item.url}`,
        })),
      };

    default:
      return null;
  }
}

