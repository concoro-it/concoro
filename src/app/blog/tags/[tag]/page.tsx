"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getArticoliByTag } from "@/lib/blog/services"
import { Articolo } from "@/types"
import { ArticleCard } from "@/components/blog/ArticleCard"
import { Pagination } from "@/components/blog/Pagination"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'

const ARTICLES_PER_PAGE = 9

export default function TagPage({ params }: { params: { tag: string } }) {
  const [articles, setArticles] = useState<Articolo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { tag } = params
  
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const articoliData = await getArticoliByTag(decodeURIComponent(tag))
        setArticles(articoliData)
      } catch (err) {
        console.error("Error fetching articles by tag:", err)
        setError("Impossibile caricare gli articoli. Riprova più tardi.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchArticles()
  }, [tag])

  // Calculate pagination
  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE)
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE
    const endIndex = startIndex + ARTICLES_PER_PAGE
    return articles.slice(startIndex, endIndex)
  }, [articles, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-8">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Torna al blog
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Tag: {toItalianSentenceCase(decodeURIComponent(tag))}</h1>
        <p className="text-gray-500 mb-8">Caricamento articoli...</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => (
            <Card key={index} className="animate-pulse h-96">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mt-auto"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-8">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Torna al blog
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">Tag: {toItalianSentenceCase(decodeURIComponent(tag))}</h1>
        
        <Card className="p-8">
          <p className="text-center text-red-500">{error}</p>
          <div className="flex justify-center mt-4">
            <Button onClick={() => window.location.reload()}>
              Riprova
            </Button>
          </div>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-12 px-4 md:px-8">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft size={16} />
            Torna al blog
          </Button>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Tag: {toItalianSentenceCase(decodeURIComponent(tag))}</h1>
      <p className="text-gray-500 mb-8">
        {articles.length} {articles.length === 1 ? 'articolo trovato' : 'articoli trovati'}
      </p>

      {/* Articles count and pagination info */}
      {articles.length > 0 && (
        <div className="mb-6 text-sm text-gray-600">
          Mostrando {((currentPage - 1) * ARTICLES_PER_PAGE) + 1}-{Math.min(currentPage * ARTICLES_PER_PAGE, articles.length)} di {articles.length} articoli
        </div>
      )}
      
      {articles.length === 0 ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">
            Nessun articolo trovato per il tag "{toItalianSentenceCase(decodeURIComponent(tag))}"
          </p>
          <div className="flex justify-center mt-4">
            <Link href="/blog">
              <Button>
                Torna al blog
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
} 