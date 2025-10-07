import React from 'react'
import { generateJobPostingStructuredData, validateJobPostingData } from '@/lib/utils/jobposting-utils'
import { generateSocialImage } from '@/lib/utils/seo-utils'
import { handleArticoloRedirect } from './redirect-handler'
import { getArticoloCanonicalUrl } from '@/lib/utils/articolo-canonical-utils'
import { preserveDateFormat } from '@/lib/utils/concorsi-utils'
import { getDeadlineCountdown } from '@/lib/utils/date-utils'

type Props = {
  children: React.ReactNode
  params: { slugOrId: string }
}

function toISOStringSafe(timestamp: unknown): string {
  if (!timestamp) return new Date().toISOString();
  
  try {
    // Handle Firestore Timestamp objects with toDate method
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof (timestamp as any).toDate === 'function') {
      return (timestamp as any).toDate().toISOString();
    }
    
    // Handle Firestore timestamp objects with seconds/nanoseconds
    if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      const ts = timestamp as { seconds: number; nanoseconds: number };
      return new Date(ts.seconds * 1000).toISOString();
    }
    
    // Handle Firestore timestamp objects with _seconds/_nanoseconds
    if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp && '_nanoseconds' in timestamp) {
      const ts = timestamp as { _seconds: number; _nanoseconds: number };
      return new Date(ts._seconds * 1000).toISOString();
    }
    
    // Handle Date objects
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    // Handle string dates
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    }
    
    return new Date().toISOString();
  } catch (error) {
    console.error('Error converting timestamp to ISO string:', error);
    return new Date().toISOString();
  }
}

export default async function ArticoloDetailLayout({ children, params }: Props) {
  const baseUrl = 'https://www.concoro.it'

  // Handle server-side redirects and fetch article + concorso
  const article = await handleArticoloRedirect(params.slugOrId)

  // If not found, render children as-is (client page will handle 404 UI)
  if (!article) {
    return <>{children}</>
  }

  // Always canonical to slug URL if available, otherwise ID
  const canonicalUrl = getArticoloCanonicalUrl(article)
  const pageUrl = canonicalUrl
  const location = article.AreaGeografica || article.concorso?.AreaGeografica
  const role = article.concorso?.Titolo
    ? ['Istruttore', 'Dirigente', 'Funzionario', 'Assistente', 'Operatore', 'Tecnico'].find(r =>
        article.concorso?.Titolo?.includes(r)
      )
    : undefined

  const socialImageUrl = generateSocialImage(
    article.articolo_title,
    role,
    location,
    `${baseUrl}/blog/default-article-image.png`
  )

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.articolo_title,
    description: article.articolo_meta_description || article.articolo_subtitle,
    datePublished: toISOStringSafe(article.publication_date),
    dateModified: toISOStringSafe(article.updatedAt) || toISOStringSafe(article.publication_date),
    url: pageUrl,
    image: [socialImageUrl],
    author: {
      '@type': 'Organization',
      name: 'Concoro',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Concoro',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/concoro-favicon-light.jpg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  }

  // Generate JobPosting JSON-LD only if still active
  let jobPostingJsonLd: Record<string, unknown> | null = null
  try {
    if (article.concorso) {
      const dc = (article.concorso as { DataChiusura: unknown }).DataChiusura
      let closing: Date | null = null
      
      // Handle different date formats safely
      if (typeof dc === 'object' && dc !== null) {
        // Handle Firestore Timestamp objects with toDate method
        if ('toDate' in dc && typeof (dc as any).toDate === 'function') {
          closing = (dc as any).toDate()
        }
        // Handle Firestore timestamp objects with seconds/nanoseconds
        else if ('seconds' in dc && 'nanoseconds' in dc) {
          const ts = dc as { seconds: number; nanoseconds: number };
          closing = new Date(ts.seconds * 1000)
        }
        // Handle Firestore timestamp objects with _seconds/_nanoseconds
        else if ('_seconds' in dc && '_nanoseconds' in dc) {
          const ts = dc as { _seconds: number; _nanoseconds: number };
          closing = new Date(ts._seconds * 1000)
        }
      }
      // Handle string dates
      else if (typeof dc === 'string') {
        closing = new Date(dc)
      }

      const isActive = !closing || (closing instanceof Date && !isNaN(closing.getTime()) && closing > new Date())
      if (isActive) {
        const jobPostingData = generateJobPostingStructuredData(article, baseUrl)
        if (jobPostingData && validateJobPostingData(jobPostingData as any)) {
          jobPostingJsonLd = jobPostingData as unknown as Record<string, unknown>
        }
      }
    }
  } catch (error) {
    console.error('Error generating JobPosting JSON-LD:', error)
    jobPostingJsonLd = null
  }

  return (
    <>
      {/* Server-side canonical link - critical for duplicate content resolution */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Server-side robots meta based on URL type */}
      <meta 
        name="robots" 
        content={params.slugOrId === (article.slug || article.id) ? "index,follow" : "noindex,follow"} 
      />

      {/* SSR JSON-LD for Article */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* SSR JSON-LD for JobPosting, only if active */}
      {jobPostingJsonLd && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
        />
      )}

      {children}
    </>
  )
}

