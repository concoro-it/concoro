import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Articolo } from "@/types"
import { getRelatedArticoli } from "@/lib/blog/services"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { getCanonicalUrlParam } from '@/lib/utils/articolo-canonical-utils'
import { Timestamp } from "firebase/firestore"

interface RelatedArticlesSectionProps {
  currentArticleId: string
  categoria?: string
  settore_professionale?: string
  AreaGeografica?: string
}

export function RelatedArticlesSection({
  currentArticleId,
  categoria,
  settore_professionale,
  AreaGeografica
}: RelatedArticlesSectionProps) {
  const [relatedArticles, setRelatedArticles] = useState<Articolo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        setIsLoading(true)
        
        // Sanitize input parameters
        const sanitizedCategoria = categoria === 'undefined' || !categoria ? undefined : categoria;
        const sanitizedSettore = settore_professionale === 'undefined' || !settore_professionale ? undefined : settore_professionale;
        const sanitizedArea = AreaGeografica === 'undefined' || !AreaGeografica ? undefined : AreaGeografica;
        
        // Debug logging
        console.log('🔍 RelatedArticlesSection - Starting fetch with:', {
          currentArticleId,
          categoria: sanitizedCategoria || 'undefined',
          settore_professionale: sanitizedSettore || 'undefined',
          AreaGeografica: sanitizedArea || 'undefined',
          hasAnyMetadata: !!(sanitizedCategoria || sanitizedSettore || sanitizedArea)
        })

        // Only fetch if we have at least one metadata field
        if (!sanitizedCategoria && !sanitizedSettore && !sanitizedArea) {
          console.log('⚠️ RelatedArticlesSection - No metadata available, skipping fetch')
          setRelatedArticles([])
          return
        }
        
        const articles = await getRelatedArticoli(
          currentArticleId,
          sanitizedCategoria,
          sanitizedSettore,
          sanitizedArea,
          4
        )
        
        console.log('📝 RelatedArticlesSection - Fetched articles:', articles)
        setRelatedArticles(articles)
      } catch (error) {
        console.error("❌ RelatedArticlesSection - Error fetching related articles:", error)
        setRelatedArticles([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedArticles()
  }, [currentArticleId, categoria, settore_professionale, AreaGeografica])

  // Format date to display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    
    try {
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds && timestamp.nanoseconds) {
        date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return "Data non disponibile";
      }
      
      if (isNaN(date.getTime())) {
        return "Data non disponibile";
      }
      
      return format(date, "d MMMM yyyy", { locale: it });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data non disponibile";
    }
  }

  // Show loading state
  if (isLoading) {
    console.log('⏳ RelatedArticlesSection - Loading...')
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Scopri questi altri concorsi
        </h2>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Log final state
  console.log('🎯 RelatedArticlesSection - Final render with:', {
    relatedArticlesCount: relatedArticles.length,
    isLoading,
    hasArticles: relatedArticles.length > 0
  })

  // Don't render if no related articles
  if (!relatedArticles || relatedArticles.length === 0) {
    console.log('❌ RelatedArticlesSection - No articles to show')
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Scopri questi altri concorsi
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relatedArticles
          .filter((article) => 
            article.articolo_title !== "Non specificato" && 
            article.articolo_subtitle !== "Non specificato"
          )
          .map((article) => {
          return (
            <div 
              key={article.id} 
              className="rounded-lg p-6 hover:shadow-lg transition-shadow duration-300"
              style={{ 
                background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8),rgb(255, 255, 255))',
                border: '1px solid #e0e0e0'
              }}
            >
              <Link href={`/articolo/${getCanonicalUrlParam(article)}`}>
                <div className="space-y-3">
                                    {/* Article Tags */}
                                    {article.articolo_tags && article.articolo_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.articolo_tags.slice(0, 1).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {toItalianSentenceCase(tag)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <h3 className="font-semibold text-lg  text-gray-900 hover:text-primary transition-colors">
                    {toItalianSentenceCase(article.articolo_title)}
                  </h3>
                  
                  {article.articolo_subtitle && (
                    <p className="text-gray-600 text-sm">
                      {article.articolo_subtitle}
                    </p>
                  )}
                  

                  
                  {/* Article Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon size={12} />
                      <span>{formatDate(article.publication_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>5 min</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
} 