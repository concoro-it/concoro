"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Articolo } from "@/types"
import { ArticleCard } from "@/components/blog/ArticleCard"
import { HeroArticleCard } from "@/components/blog/HeroArticleCard"
import { TagFilter } from "@/components/blog/TagFilter"
import { CTASection } from "@/components/ui/cta-section"
import { MainFooter } from "@/components/ui/main-footer"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const ARTICLES_PER_LOAD = 9

interface BlogPageClientProps {
  initialArticles: Articolo[]
  tags: string[]
  searchParams: { page?: string; tag?: string }
}

export function BlogPageClient({ initialArticles, tags, searchParams }: BlogPageClientProps) {
  const [articles, setArticles] = useState<Articolo[]>(initialArticles)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()
  
  // ✅ SEO FIX: Redirect tag queries to static tag pages
  useEffect(() => {
    const tagParam = searchParams.tag
    if (tagParam) {
      // Redirect to new SEO-friendly tag page
      router.replace(`/blog/tags/${encodeURIComponent(tagParam.toLowerCase())}`)
    }
  }, [searchParams, router])

  // Separate hero post and grid posts
  const heroPost = articles.length > 0 ? articles[0] : null
  const gridArticles = articles.slice(1) // Skip the first article (hero post)

  const loadMore = async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      // Fetch next batch starting after current articles
      const response = await fetch(`/api/blog/articles?limit=${ARTICLES_PER_LOAD}&offset=${articles.length}`)
      const data = await response.json()
      
      if (data.articles && data.articles.length > 0) {
        setArticles(prev => [...prev, ...data.articles])
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more articles:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-12 px-4 md:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog</h1>
        
        {tags.length > 0 && (
          <TagFilter 
            tags={tags} 
            selectedTag={null} 
            onSelectTag={(tag) => {
              if (tag) {
                router.push(`/blog/tags/${encodeURIComponent(tag.toLowerCase())}`)
              }
            }} 
          />
        )}
      </div>

      {/* Hero Post - Always shown */}
      {heroPost && (
        <div className="mb-16">
          <HeroArticleCard article={heroPost} />
        </div>
      )}

      {/* Section Title */}
      {articles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Ultimi articoli</h2>
          <div className="text-sm text-gray-600">
            Mostrando {gridArticles.length} articoli
          </div>
        </div>
      )}
      
      {articles.length === 0 ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">
            Nessun articolo disponibile al momento
          </p>
        </Card>
      ) : (
        <>
          {/* Grid Articles */}
          {gridArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {gridArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8 mb-12">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    size="lg"
                    variant="outline"
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Caricamento...
                      </>
                    ) : (
                      'Carica altri articoli'
                    )}
                  </Button>
                </div>
              )}
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
      <MainFooter />
    </div>
  )
}
