"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAllArticoli, getAllArticoloTags } from "@/lib/blog/services"
import { Articolo } from "@/types"
import { ArticleCard } from "@/components/blog/ArticleCard"
import { HeroArticleCard } from "@/components/blog/HeroArticleCard"
import { TagFilter } from "@/components/blog/TagFilter"
import { Pagination } from "@/components/blog/Pagination"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { CTASection } from "@/components/ui/cta-section"
import { MainFooter } from "@/components/ui/main-footer"
import { useSearchParams } from "next/navigation"

const ARTICLES_PER_PAGE = 9

export default function BlogPage() {
  const [articles, setArticles] = useState<Articolo[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Articolo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const searchParams = useSearchParams()
  
  // Set initial tag from URL parameter
  useEffect(() => {
    const tagParam = searchParams.get('tag')
    if (tagParam) {
      setSelectedTag(tagParam)
    }
  }, [searchParams])
  
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const articoliData = await getAllArticoli() // No limit - fetch all articles
        setArticles(articoliData)
        setFilteredArticles(articoliData)
        
        const tagsData = await getAllArticoloTags()
        setTags(tagsData)
      } catch (err) {
        console.error("Error fetching articles:", err)
        setError("Impossibile caricare gli articoli. Riprova più tardi.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchArticles()
  }, [])
  
  // Filter articles by tag and remove placeholder articles
  useEffect(() => {
    // First filter out placeholder articles
    const validArticles = articles.filter(article => 
      !(article.articolo_title === "Non specificato" && article.articolo_subtitle === "Non specificato")
    )
    
    if (selectedTag) {
      const filtered = validArticles.filter(article => 
        article.articolo_tags && article.articolo_tags.includes(selectedTag)
      )
      setFilteredArticles(filtered)
    } else {
      setFilteredArticles(validArticles)
    }
    // Reset to first page when filtering changes
    setCurrentPage(1)
  }, [selectedTag, articles])

  // Separate hero post and grid posts
  const heroPost = filteredArticles.length > 0 ? filteredArticles[0] : null
  const gridArticles = filteredArticles.slice(1) // Skip the first article (hero post)
  
  // Calculate pagination for grid articles (9 per page)
  const totalPages = Math.ceil(gridArticles.length / ARTICLES_PER_PAGE)
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE
    const endIndex = startIndex + ARTICLES_PER_PAGE
    return gridArticles.slice(startIndex, endIndex)
  }, [gridArticles, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-8">
        <h1 className="text-3xl font-bold mb-8">Blog</h1>
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
        <h1 className="text-3xl font-bold mb-8">Blog</h1>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog</h1>
        
        {tags.length > 0 && (
          <TagFilter 
            tags={tags} 
            selectedTag={selectedTag} 
            onSelectTag={setSelectedTag} 
          />
        )}
      </div>

      {/* Hero Post */}
      {heroPost && !selectedTag && (
        <div className="mb-16">
          <HeroArticleCard article={heroPost} />
        </div>
      )}

      {/* Section Title */}
      {filteredArticles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Ultimi articoli</h2>
          <div className="text-sm text-gray-600">
            {selectedTag ? (
              <>
                Mostrando {((currentPage - 1) * ARTICLES_PER_PAGE) + 1}-{Math.min(currentPage * ARTICLES_PER_PAGE, gridArticles.length)} di {gridArticles.length} articoli per il tag "{toItalianSentenceCase(selectedTag)}"
              </>
            ) : (
              <>
                Mostrando {((currentPage - 1) * ARTICLES_PER_PAGE) + 1}-{Math.min(currentPage * ARTICLES_PER_PAGE, gridArticles.length)} di {gridArticles.length} articoli aggiuntivi (Totale database: {articles.length})
              </>
            )}
          </div>
        </div>
      )}
      
      {filteredArticles.length === 0 ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">
            {selectedTag 
              ? `Nessun articolo trovato per il tag "${toItalianSentenceCase(selectedTag)}"`
              : "Nessun articolo disponibile al momento"}
          </p>
        </Card>
      ) : (
        <>
          {/* Grid Articles */}
          {(selectedTag ? filteredArticles : gridArticles).length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(selectedTag ? 
                  // When filtering by tag, show all filtered articles
                  filteredArticles.slice((currentPage - 1) * ARTICLES_PER_PAGE, currentPage * ARTICLES_PER_PAGE)
                  : 
                  // When not filtering, show paginated grid articles (excluding hero)
                  paginatedArticles
                ).map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={selectedTag ? Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE) : totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <Card className="p-8">
              <p className="text-center text-gray-500">
                Nessun articolo aggiuntivo disponibile
              </p>
            </Card>
          )}
        </>
      )}
      <CTASection />
      <MainFooter/>
    </div>
  )
} 