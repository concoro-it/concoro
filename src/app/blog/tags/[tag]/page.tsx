import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticoliByTagServer, getAllTagsServer } from '@/lib/blog/services-server'
import { BlogTagPageClient } from './BlogTagPageClient'
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { serializeArticles } from '@/lib/utils/firestore-serialization'

interface TagPageProps {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ page?: string }>
}

// ✅ SERVER-SIDE METADATA for Tag Pages (Critical SEO)
export async function generateMetadata({ params, searchParams }: TagPageProps): Promise<Metadata> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const decodedTag = decodeURIComponent(resolvedParams.tag)
  const formattedTag = toItalianSentenceCase(decodedTag)
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const title = page > 1
    ? `${formattedTag} - Pagina ${page} | Concoro Blog`
    : `${formattedTag} - Blog Concorsi Pubblici | Concoro`
  const description = `Tutti gli articoli su ${formattedTag.toLowerCase()}. Guide pratiche, consigli e strategie di preparazione per concorsi pubblici in Italia.`
  const baseUrl = `https://www.concoro.it/blog/tags/${resolvedParams.tag}`
  const canonicalUrl = page > 1 ? `${baseUrl}?page=${page}` : baseUrl

  // Calculate total pages for rel=prev/next
  const allArticles = await getArticoliByTagServer(decodedTag, 100)
  const validArticles = allArticles.filter(article =>
    !(article.articolo_title === "Non specificato" && article.articolo_subtitle === "Non specificato")
  )
  const totalPages = Math.ceil(validArticles.length / 9)

  // Build alternates object with prev/next for pagination
  const alternates: any = {
    canonical: canonicalUrl,
    languages: {
      'it-IT': canonicalUrl,
    },
  }

  // Add rel=prev for pages > 1
  if (page > 1) {
    const prevPage = page - 1
    alternates.types = alternates.types || {}
    alternates.types.prev = prevPage === 1 ? baseUrl : `${baseUrl}?page=${prevPage}`
  }

  // Add rel=next for pages < totalPages
  if (page < totalPages) {
    alternates.types = alternates.types || {}
    alternates.types.next = `${baseUrl}?page=${page + 1}`
  }

  return {
    title,
    description,
    keywords: [
      formattedTag.toLowerCase(),
      'concorsi pubblici',
      'preparazione concorsi',
      'guide concorsi',
      'blog concorsi',
      `concorsi ${formattedTag.toLowerCase()}`,
      'pubblica amministrazione'
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
          alt: `${formattedTag} - Concoro Blog`,
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

// ✅ Generate static params for popular tags (improves build time SEO)
export async function generateStaticParams() {
  try {
    // ⚡ OPTIMIZED: Get all tags efficiently without fetching full articles
    const allTags = await getAllTagsServer()

    // Return top 20 tags for static generation
    // Note: This doesn't sort by popularity anymore to avoid fetching all articles
    // Tags are already sorted alphabetically by getAllTagsServer
    const popularTags = allTags
      .slice(0, 20)
      .map(tag => ({
        tag: encodeURIComponent(tag.toLowerCase())
      }))

    return popularTags
  } catch (error) {
    console.error('Error generating static params for tags:', error)
    return []
  }
}

// ✅ SERVER COMPONENT - Fetches data server-side
export default async function TagPage({ params, searchParams }: TagPageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  try {
    const decodedTag = decodeURIComponent(resolvedParams.tag)
    const page = parseInt(resolvedSearchParams.page || '1', 10)
    const articlesPerPage = 9

    // Fetch articles for this tag
    const allArticles = await getArticoliByTagServer(decodedTag, 100)

    // Filter out placeholder articles
    const validArticles = allArticles.filter(article =>
      !(article.articolo_title === "Non specificato" && article.articolo_subtitle === "Non specificato")
    )

    if (validArticles.length === 0) {
      notFound()
    }

    // Calculate pagination
    const totalPages = Math.ceil(validArticles.length / articlesPerPage)
    const startIndex = (page - 1) * articlesPerPage
    const paginatedArticles = validArticles.slice(startIndex, startIndex + articlesPerPage)

    // ✅ FIX: Serialize Firestore Timestamps to plain objects
    const serializedArticles = serializeArticles(paginatedArticles)

    return (
      <BlogTagPageClient
        tag={decodedTag}
        articles={serializedArticles}
        currentPage={page}
        totalPages={totalPages}
        totalArticles={validArticles.length}
      />
    )
  } catch (error) {
    console.error('Error loading tag page:', error)
    notFound()
  }
}

// ✅ DYNAMIC RENDERING with revalidation
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour