import type { Metadata } from 'next'
import { getAllArticoliServer, getAllTagsServer } from '@/lib/blog/services-server'
import { BlogPageClient } from './BlogPageClient'
import { serializeArticles } from '@/lib/utils/firestore-serialization'

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string }>
}

// ✅ SERVER-SIDE METADATA for Blog Listing (Critical SEO)
export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const tag = resolvedSearchParams.tag

  // If tag is present, redirect will handle it - but provide metadata anyway
  if (tag) {
    return {
      title: 'Blog Concorsi Pubblici - Reindirizzamento | Concoro',
      description: 'Guide pratiche per concorsi pubblici: strategie, consigli e aggiornamenti. Preparati al meglio con gli esperti di Concoro.',
      robots: {
        index: false,
        follow: true,
      }
    }
  }

  const title = 'Blog Concorsi Pubblici - Guide e Consigli | Concoro'
  const description = 'Guide pratiche per concorsi pubblici: strategie, consigli e aggiornamenti. Preparati al meglio con gli esperti di Concoro.'
  const baseUrl = 'https://www.concoro.it/blog'
  const canonicalUrl = baseUrl

  // Build alternates - simple canonical for Load More approach
  const alternates: any = {
    canonical: canonicalUrl,
    languages: {
      'it-IT': canonicalUrl,
    },
  }

  return {
    title,
    description,
    keywords: [
      'blog concorsi pubblici',
      'guide concorsi',
      'preparazione concorsi',
      'consigli concorsi pubblici',
      'strategie concorsi',
      'concorsi italia',
      'pubblica amministrazione',
      'come prepararsi concorsi'
    ].join(', '),

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

    openGraph: {
      type: 'website',
      locale: 'it_IT',
      url: canonicalUrl,
      title,
      description,
      siteName: 'Concoro',
      images: [
        {
          url: 'https://www.concoro.it/banner.png',
          width: 1200,
          height: 630,
          alt: 'Concoro Blog - Guide per Concorsi Pubblici',
        }
      ],
    },

    twitter: {
      card: 'summary_large_image',
      site: '@concoro_it',
      creator: '@concoro_it',
      title,
      description,
      images: ['https://www.concoro.it/banner.png'],
    },

    alternates,
  }
}

// ✅ SERVER COMPONENT - Fetches data server-side for optimal SEO
export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedSearchParams = await searchParams;
  try {
    // ⚡ OPTIMIZED: Only fetch initial batch of articles (10 articles)
    // Client will use "Load More" for additional articles
    const initialLimit = 10

    const articles = await getAllArticoliServer(initialLimit)
    const tags = await getAllTagsServer()

    // Filter out placeholder articles
    const validArticles = articles.filter(article =>
      !(article.articolo_title === "Non specificato" && article.articolo_subtitle === "Non specificato")
    )

    // ✅ FIX: Serialize Firestore Timestamps to plain objects
    const serializedArticles = serializeArticles(validArticles)

    return (
      <BlogPageClient
        initialArticles={serializedArticles}
        tags={tags}
        searchParams={resolvedSearchParams}
      />
    )
  } catch (error) {
    console.error('Error loading blog page:', error)
    return (
      <div className="container mx-auto py-12 px-4 md:px-8">
        <h1 className="text-3xl font-bold mb-8">Blog</h1>
        <p className="text-red-500">Si è verificato un errore nel caricamento degli articoli.</p>
      </div>
    )
  }
}

// ✅ DYNAMIC RENDERING with revalidation
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour