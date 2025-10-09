import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getArticoloWithConcorsoBySlugOrIdServer, getAllArticoliServer } from "@/lib/blog/services-server"
import { generateArticleSEO, generateAltText, generateSocialImage } from '@/lib/utils/seo-utils'
import { getArticoloCanonicalUrl, getArticoloCanonicalPath } from '@/lib/utils/articolo-canonical-utils'
import { removeEmojis } from '@/lib/utils/text-utils'
import { parseArticoloSlug, isFirebaseDocumentId, findArticoloBySlug } from '@/lib/utils/articolo-urls'
import { ArticlePageClient } from './ArticlePageClient'
import { serializeArticle } from '@/lib/utils/firestore-serialization'
import { ArticoloWithConcorso } from '@/types'

interface ArticoloPageProps {
  params: { slug: string[] }
}

// ✅ SERVER-SIDE METADATA GENERATION (Critical SEO Fix)
export async function generateMetadata({ params }: ArticoloPageProps): Promise<Metadata> {
  try {
    // Parse the URL slug segments
    const slugPath = params.slug.join('/')
    const slugComponents = parseArticoloSlug(slugPath)
    
    let article: ArticoloWithConcorso | null = null

    // Try to fetch by ID first (most reliable)
    if (slugComponents.id) {
      article = await getArticoloWithConcorsoBySlugOrIdServer(slugComponents.id)
    }
    
    // If not found by ID, try fuzzy matching with slug components
    if (!article && (slugComponents.category || slugComponents.title || slugComponents.year)) {
      const allArticles = await getAllArticoliServer()
      const foundArticle = findArticoloBySlug(allArticles, slugComponents)
      if (foundArticle) {
        // Fetch the full article with concorso data
        article = await getArticoloWithConcorsoBySlugOrIdServer(foundArticle.id)
      }
    }
    
    // Fallback: try treating the full path as a slug or ID
    if (!article && params.slug.length === 1) {
      article = await getArticoloWithConcorsoBySlugOrIdServer(params.slug[0])
    }
    
    if (!article) {
      return {
        title: 'Articolo non trovato | Concoro',
        description: 'L\'articolo che stai cercando non esiste o è stato rimosso.',
        robots: {
          index: false,
          follow: true,
        }
      }
    }

    // Extract role and location for SEO
    const role = article.concorso?.Titolo?.includes('Istruttore') ? 'Istruttore' : 
                 article.concorso?.Titolo?.includes('Dirigente') ? 'Dirigente' :
                 article.concorso?.Titolo?.includes('Funzionario') ? 'Funzionario' :
                 article.concorso?.Titolo?.includes('Assistente') ? 'Assistente' :
                 article.concorso?.Titolo?.includes('Operatore') ? 'Operatore' :
                 article.concorso?.Titolo?.includes('Tecnico') ? 'Tecnico' :
                 undefined;

    const location = article.AreaGeografica || article.concorso?.AreaGeografica;
    const region = (article.concorso as any)?.Regione;
    const articleTags = article.articolo_tags || [];

    // Clean emojis for SEO-critical fields
    const cleanTitle = removeEmojis(article.articolo_title) || article.articolo_title;
    const cleanSubtitle = article.articolo_subtitle ? removeEmojis(article.articolo_subtitle) : undefined;
    const cleanMetaDescription = article.articolo_meta_description ? removeEmojis(article.articolo_meta_description) : undefined;

    // Generate SEO-optimized metadata
    const seoData = generateArticleSEO(
      cleanTitle,
      cleanSubtitle,
      articleTags,
      role,
      location,
      region,
      cleanMetaDescription
    );

    // Generate canonical URL
    const canonicalUrl = getArticoloCanonicalUrl(article);

    // Get image URL - use fallback logic for deterministic image selection
    const concorsoIdHash = article.concorso_id ? 
      (article.concorso_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 12 + 1) : 
      1;
    const imageSrc = article.image_meta?.mediaLink || `/blog/${concorsoIdHash}.png`;
    const socialImageUrl = generateSocialImage(
      article.articolo_title,
      role,
      location,
      imageSrc.startsWith('/') ? `https://www.concoro.it${imageSrc}` : imageSrc
    );

    // Helper to convert Firestore timestamp to ISO string
    const toISOString = (timestamp: any): string => {
      if (!timestamp) return new Date().toISOString();
      
      try {
        if (timestamp._seconds !== undefined) {
          return new Date(timestamp._seconds * 1000).toISOString();
        }
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().toISOString();
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
    };

    // ✅ FRESHNESS SIGNAL: Check if concorso deadline has passed
    const isConcorsoExpired = article.concorso?.DataChiusura ? (() => {
      const deadline: any = article.concorso.DataChiusura
      let deadlineDate: Date | null = null
      
      try {
        if (deadline._seconds) {
          deadlineDate = new Date(deadline._seconds * 1000)
        } else if (deadline.seconds) {
          deadlineDate = new Date(deadline.seconds * 1000)
        } else if (typeof deadline === 'string') {
          deadlineDate = new Date(deadline)
        }
        
        if (deadlineDate && !isNaN(deadlineDate.getTime())) {
          return deadlineDate < new Date()
        }
      } catch {}
      return false
    })() : false

    return {
      title: seoData.title,
      description: seoData.description,
      keywords: seoData.keywords.join(', '),
      authors: [{ name: 'Concoro' }],
      creator: 'Concoro',
      publisher: 'Concoro',
      
      // ✅ FRESHNESS: Robots directives - reduce indexing priority for expired articles
      robots: {
        index: !isConcorsoExpired, // Don't index expired concorsi
        follow: true, // Still follow links for link equity
        googleBot: {
          index: !isConcorsoExpired,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': isConcorsoExpired ? 160 : -1, // Limit snippet for expired
        },
      },

      // Open Graph
      openGraph: {
        type: 'article',
        locale: 'it_IT',
        url: canonicalUrl,
        title: seoData.title,
        description: seoData.description,
        siteName: 'Concoro',
        publishedTime: toISOString(article.publication_date),
        modifiedTime: toISOString((article as any).updatedAt) || toISOString(article.publication_date),
        authors: ['Concoro'],
        section: article.categoria || 'Concorsi Pubblici',
        tags: seoData.keywords,
        images: [
          {
            url: socialImageUrl,
            width: 1200,
            height: 630,
            alt: generateAltText(imageSrc, article.articolo_title, role, location),
          }
        ],
      },

      // Twitter Card
      twitter: {
        card: 'summary_large_image',
        site: '@concoro_it',
        creator: '@concoro_it',
        title: seoData.title,
        description: seoData.description,
        images: [socialImageUrl],
      },

      // Canonical URL & Alternates
      alternates: {
        canonical: canonicalUrl,
        languages: {
          'it-IT': canonicalUrl,
        },
      },

      // Additional metadata
      other: {
        'article:author': 'Concoro',
        'article:published_time': toISOString(article.publication_date),
        'article:modified_time': toISOString((article as any).updatedAt) || toISOString(article.publication_date),
        'article:section': article.categoria || 'Concorsi Pubblici',
        'article:tag': seoData.keywords.join(', '),
      },
    }
  } catch (error) {
    console.error('Error generating article metadata:', error);
    return {
      title: 'Articolo | Concoro',
      description: 'Articoli e approfondimenti sui concorsi pubblici in Italia.',
    }
  }
}

// ✅ SERVER COMPONENT - Fetches data server-side for optimal SEO
export default async function ArticoloPage({ params }: ArticoloPageProps) {
  try {
    // Parse the URL slug segments
    const slugPath = params.slug.join('/')
    const slugComponents = parseArticoloSlug(slugPath)
    
    let article: ArticoloWithConcorso | null = null

    // Try to fetch by ID first (most reliable)
    if (slugComponents.id) {
      article = await getArticoloWithConcorsoBySlugOrIdServer(slugComponents.id)
    }
    
    // If not found by ID, try fuzzy matching with slug components
    if (!article && (slugComponents.category || slugComponents.title || slugComponents.year)) {
      const allArticles = await getAllArticoliServer()
      const foundArticle = findArticoloBySlug(allArticles, slugComponents)
      if (foundArticle) {
        // Fetch the full article with concorso data
        article = await getArticoloWithConcorsoBySlugOrIdServer(foundArticle.id)
      }
    }
    
    // Fallback: try treating the full path or single segment as a slug or ID
    if (!article) {
      if (params.slug.length === 1) {
        // Single segment - could be old-style slug or ID
        article = await getArticoloWithConcorsoBySlugOrIdServer(params.slug[0])
      }
    }
    
    if (!article) {
      notFound()
    }

    // ✅ SEO FIX: If accessing by old URL format, redirect to new SEO-friendly URL
    const canonicalPath = getArticoloCanonicalPath(article)
    const currentPath = `/articolo/${slugPath}`
    
    // Only redirect if:
    // 1. Paths are different
    // 2. Either: accessing by ONLY the ID (needs full slug), OR accessing by old slug format
    // 3. Prevent redirect loop: if URL already has ID at end with multiple segments, assume it's canonical
    const isIdOnly = slugPath === article.id
    const hasMultipleSegmentsWithId = slugPath.includes('/') && slugPath.endsWith(article.id)
    
    const shouldPerformRedirect = 
      currentPath !== canonicalPath && 
      !hasMultipleSegmentsWithId  // Don't redirect if already using multi-segment URL with ID
    
    if (shouldPerformRedirect) {
      console.log(`Redirecting from ${currentPath} to ${canonicalPath}`)
      redirect(canonicalPath)
    }

    // ✅ FIX: Deep serialize ALL Firestore Timestamps to plain objects
    const serializedArticle = serializeArticle(article)

    // Pass serialized data to client component for interactivity
    return <ArticlePageClient article={serializedArticle} slugPath={slugPath} />
    
  } catch (error) {
    console.error('Error loading article page:', error)
    notFound()
  }
}

// ✅ DYNAMIC RENDERING: Tell Next.js this is a dynamic route
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

