"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArticleCard } from "@/components/blog/ArticleCard"
import { Pagination } from "@/components/blog/Pagination"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { CTASection } from "@/components/ui/cta-section"
import { MainFooter } from "@/components/ui/main-footer"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Articolo } from "@/types"
import { useRouter } from "next/navigation"

interface BlogTagPageClientProps {
  tag: string
  articles: Articolo[]
  currentPage: number
  totalPages: number
  totalArticles: number
}

export function BlogTagPageClient({ 
  tag, 
  articles, 
  currentPage, 
  totalPages,
  totalArticles 
}: BlogTagPageClientProps) {
  const router = useRouter()
  const formattedTag = toItalianSentenceCase(tag)

  const handlePageChange = (page: number) => {
    router.push(`/blog/tags/${encodeURIComponent(tag.toLowerCase())}?page=${page}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="container mx-auto py-12 px-4 md:px-8">
        {/* Back button */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Torna al blog
            </Button>
          </Link>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {formattedTag}
          </h1>
          <p className="text-gray-600 text-lg">
            {totalArticles} {totalArticles === 1 ? 'articolo' : 'articoli'} su {formattedTag.toLowerCase()}
          </p>
        </div>

        {/* Articles count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Mostrando {((currentPage - 1) * 9) + 1}-{Math.min(currentPage * 9, totalArticles)} di {totalArticles} articoli
          </p>
        </div>

        {/* Articles grid */}
        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <Card className="p-8">
            <p className="text-center text-gray-500">
              Nessun articolo trovato per questo tag
            </p>
          </Card>
        )}

        <CTASection />
        <MainFooter />
      </div>
    </>
  )
}
