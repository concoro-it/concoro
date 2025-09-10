import React from 'react'
import { generateJobPostingStructuredData, validateJobPostingData } from '@/lib/utils/jobposting-utils'
import { generateSocialImage } from '@/lib/utils/seo-utils'
import { handleArticoloRedirect } from './redirect-handler'
import { getArticoloCanonicalUrl } from '@/lib/utils/articolo-canonical-utils'

type Props = {
  children: React.ReactNode
  params: { slugOrId: string }
}

function toISOStringSafe(timestamp: unknown): string {
  if (!timestamp) return new Date().toISOString();
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (timestamp.seconds && timestamp.nanoseconds) {
      return new Date(timestamp.seconds * 1000).toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    }
    return new Date().toISOString();
  } catch {
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
        article.concorso!.Titolo.includes(r)
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
      if (dc?.toDate && typeof dc.toDate === 'function') closing = dc.toDate()
      else if (dc?.seconds && dc?.nanoseconds) closing = new Date(dc.seconds * 1000)
      else if (typeof dc === 'string') closing = new Date(dc)

      const isActive = !closing || (closing instanceof Date && !isNaN(closing.getTime()) && closing > new Date())
      if (isActive) {
        jobPostingJsonLd = generateJobPostingStructuredData(article, baseUrl)
        if (jobPostingJsonLd && !validateJobPostingData(jobPostingJsonLd)) {
          jobPostingJsonLd = null
        }
      }
    }
  } catch {
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

