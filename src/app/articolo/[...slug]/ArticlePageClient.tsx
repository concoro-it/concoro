"use client"

import { useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { 
  ArrowLeft, 
  CalendarIcon,
  Clock,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ArticoloWithConcorso } from "@/types"
import { it } from "date-fns/locale"
import { Separator } from "@/components/ui/separator"
import { ConcorsoCard } from "@/components/blog/ConcorsoCard"
import { Timestamp } from "firebase/firestore"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { cn } from "@/lib/utils"
import { getArticleCoverImage, getFallbackCoverImage } from '@/lib/utils/image-utils'
import { CTASection } from "@/components/ui/cta-section"
import { MainFooter } from "@/components/ui/main-footer"
import { isFirebaseDocumentId } from '@/lib/utils/articolo-urls'
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb"
import { RelatedArticlesSection } from "@/components/blog/RelatedArticlesSection"
import { generateAltText } from '@/lib/utils/seo-utils'
import { generateJobPostingStructuredData, validateJobPostingData } from '@/lib/utils/jobposting-utils'
import { getArticoloCanonicalUrl } from '@/lib/utils/articolo-canonical-utils'
import { trackArticleView, trackConcorsoEngagement, trackEvent } from '@/lib/analytics'
import { removeEmojis, convertMarkdownBoldToH2 } from '@/lib/utils/text-utils'
import { FAQSection } from '@/components/blog/FAQSection'
import { useState } from "react"

interface ArticlePageClientProps {
  article: ArticoloWithConcorso
  slugPath: string
}

export function ArticlePageClient({ article, slugPath }: ArticlePageClientProps) {
  const [imageSrc, setImageSrc] = useState<string>(() => {
    // Initialize image source
    if (article.image_meta?.mediaLink) {
      return article.image_meta.mediaLink
    }
    return getArticleCoverImage(article.concorso_id)
  })
  
  // Extract role and location for reuse throughout component
  const role = article.concorso?.Titolo?.includes('Istruttore') ? 'Istruttore' : 
               article.concorso?.Titolo?.includes('Dirigente') ? 'Dirigente' :
               article.concorso?.Titolo?.includes('Funzionario') ? 'Funzionario' :
               article.concorso?.Titolo?.includes('Assistente') ? 'Assistente' :
               article.concorso?.Titolo?.includes('Operatore') ? 'Operatore' :
               article.concorso?.Titolo?.includes('Tecnico') ? 'Tecnico' :
               undefined;

  const location = article.concorso?.AreaGeografica || article.AreaGeografica;

  // Handle image error - use deterministic fallback
  const handleImageError = () => {
    setImageSrc(getFallbackCoverImage(article.concorso_id))
  }
  
  // Format date to display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    
    try {
      let date;
      
      // Handle Firebase Admin timestamp (has _seconds)
      if (timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
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

  // Function to dynamically check if concorso is open or closed based on current date
  const getConcorsoStatus = (concorso: any) => {
    if (!concorso) return null;
    
    try {
      const deadlineCountdown = getDeadlineCountdown(concorso.DataChiusura);
      
      if (!deadlineCountdown) {
        return { 
          status: 'closed', 
          message: 'Chiuso',
          closingDate: formatDate(concorso.DataChiusura)
        };
      }
      
      return { 
        status: 'open', 
        message: deadlineCountdown,
        closingDate: formatDate(concorso.DataChiusura)
      };
      
    } catch (error) {
      console.error("Error determining concorso status:", error);
      return { status: 'unknown', message: 'Stato non determinabile' };
    }
  }
  
  // ✅ CLIENT-SIDE: Add structured data (only runs in browser)
  useEffect(() => {
    // 1. Add BreadcrumbList structured data for better SERP display
    const breadcrumbItems = getBreadcrumbItems();
    const breadcrumbStructuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        ...(item.href && { "item": `https://www.concoro.it${item.href}` })
      }))
    };

    const existingBreadcrumbScript = document.querySelector('script[type="application/ld+json"][data-breadcrumb]');
    if (existingBreadcrumbScript) {
      existingBreadcrumbScript.remove();
    }

    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.setAttribute('data-breadcrumb', 'true');
    breadcrumbScript.textContent = JSON.stringify(breadcrumbStructuredData);
    document.head.appendChild(breadcrumbScript);

    // 2. Add JobPosting structured data if concorso is active
    if (!article.concorso) return;

    // Helper function to convert timestamps
    const toISOString = (timestamp: any): string => {
      if (!timestamp) return new Date().toISOString();
      
      try {
        if (timestamp._seconds !== undefined) {
          return new Date(timestamp._seconds * 1000).toISOString();
        }
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().toISOString();
        }
        if (timestamp.seconds && timestamp.nanoseconds) {
          return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString();
        }
        if (timestamp instanceof Date) {
          return timestamp.toISOString();
        }
        if (typeof timestamp === 'string') {
          return new Date(timestamp).toISOString();
        }
        return new Date().toISOString();
      } catch (error) {
        console.error('Error converting timestamp to ISO string:', error);
        return new Date().toISOString();
      }
    };

    // Generate JobPosting structured data only if concorso is active
    const now = new Date();
    let closingDate: Date | null = null;
    const dc: any = article.concorso.DataChiusura;
    
    try {
      if (dc?._seconds !== undefined) {
        closingDate = new Date(dc._seconds * 1000);
      } else if (dc?.toDate && typeof dc.toDate === 'function') {
        closingDate = dc.toDate();
      } else if (dc?.seconds && dc?.nanoseconds) {
        closingDate = new Timestamp(dc.seconds, dc.nanoseconds).toDate();
      } else if (typeof dc === 'string') {
        closingDate = new Date(dc);
      }
    } catch {}

    const isActive = !closingDate || (closingDate instanceof Date && !isNaN(closingDate.getTime()) && closingDate > now);
    
    if (isActive) {
      const jobPostingData = generateJobPostingStructuredData(article, 'https://www.concoro.it');
      
      if (jobPostingData && validateJobPostingData(jobPostingData)) {
        const existingJobScript = document.querySelector('script[type="application/ld+json"][data-jobposting]')
        if (existingJobScript) {
          existingJobScript.remove()
        }
        
        const jobScript = document.createElement('script')
        jobScript.type = 'application/ld+json'
        jobScript.setAttribute('data-jobposting', 'true')
        jobScript.textContent = JSON.stringify(jobPostingData)
        document.head.appendChild(jobScript)
      }
    }

    // Track article view for analytics
    if (article.id) {
      trackArticleView(article.id, slugPath, article.articolo_title);
      
      trackEvent('article_engagement_start', {
        article_id: article.id,
        article_title: article.articolo_title,
        article_category: article.categoria,
        geographic_area: article.AreaGeografica,
        professional_sector: article.settore_professionale,
        has_concorso: !!article.concorso,
        url_type: 'seo_slug'
      });
      
      // Track reading time engagement after 30 seconds
      const timer = setTimeout(() => {
        trackEvent('article_reading_engagement', {
          article_id: article.id,
          engagement_duration: 30,
          article_title: article.articolo_title
        });
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [article, slugPath])
  
  // Function to format article text with paragraphs, headings, and lists
  const formatArticleText = (text: string) => {
    if (!text) return "";
    
    const formattedHtml = convertMarkdownBoldToH2(removeEmojis(text));
    return <div dangerouslySetInnerHTML={{ __html: formattedHtml }} />;
  };

  // Generate breadcrumb items
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: "Concorsi", href: "/bandi" }
    ];
    
    const areaGeografica = article.AreaGeografica || article.concorso?.AreaGeografica;
    if (areaGeografica) {
      items.push({
        label: toItalianSentenceCase(areaGeografica),
        href: `/bandi?location=${encodeURIComponent(areaGeografica)}`
      });
    }
    
    const cleanArticleTitle = removeEmojis(article.articolo_title) || article.articolo_title;
    items.push({
      label: toItalianSentenceCase(cleanArticleTitle),
      current: true
    });
    
    return items;
  };
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-12 px-4 md:px-8 max-w-4xl relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Torna al blog
            </Button>
          </Link>
        </div>

        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb className="mb-6 max-w-full" items={getBreadcrumbItems()} />
        </div>

        {/* Article header */}
        <div className="mb-8">
          {/* Status Badge - Appears before title on mobile, after breadcrumbs */}
          {article.concorso && (() => {
            const statusInfo = getConcorsoStatus(article.concorso);
            if (!statusInfo) return null;
            
            const getStatusColor = (status: string) => {
              switch (status) {
                case 'open':
                  return "bg-green-100 text-green-800 hover:bg-green-200";
                case 'closed':
                  return "bg-red-100 text-red-800 hover:bg-red-200";
                default:
                  return "bg-gray-100 text-gray-800 hover:bg-gray-200";
              }
            };
            
            const getStatusIcon = (status: string) => {
              switch (status) {
                case 'open':
                  return '';
                case 'closed':
                  return '';
                default:
                  return '  ';
              }
            };
            
            return (
              <div className="mb-4 sm:hidden">
                <Badge 
                  variant="secondary"
                  className={cn(
                    "text-xs px-3 py-1 font-medium",
                    getStatusColor(statusInfo.status)
                  )}
                >
                  {getStatusIcon(statusInfo.status)} {statusInfo.message}
                  {statusInfo.closingDate && (
                    <span className="ml-2 text-xs opacity-75">
                      ({statusInfo.closingDate})
                    </span>
                  )}
                </Badge>
              </div>
            );
          })()}
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {removeEmojis(article.articolo_title) || article.articolo_title}
          </h1>
          
          {article.articolo_subtitle && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {removeEmojis(article.articolo_subtitle) || article.articolo_subtitle}
            </p>
          )}
          
          {/* Article metadata - responsive layout for mobile */}
          <div className="mb-3">
            <div className="flex flex-row items-center justify-between gap-2 text-sm text-gray-500 mb-2">
              <div className="flex flex-row items-center gap-2">
                <div className="flex items-center gap-2">
                  <span>Pubblicato il</span>
                  <CalendarIcon size={16} />
                  <span>{formatDate(article.publication_date)}</span>
                </div>
                
                <Separator orientation="vertical" className="h-4 mx-2" />
                
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>5 min di lettura</span>
                </div>
              </div>
              
              {/* Status Badge - Only visible on desktop */}
              {article.concorso && (() => {
                const statusInfo = getConcorsoStatus(article.concorso);
                if (!statusInfo) return null;
                
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'open':
                      return "bg-green-100 text-green-800 hover:bg-green-200";
                    case 'closed':
                      return "bg-red-100 text-red-800 hover:bg-red-200";
                    default:
                      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
                  }
                };
                
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'open':
                      return '';
                    case 'closed':
                      return '';
                    default:
                      return '  ';
                  }
                };
                
                return (
                  <div className="hidden sm:block">
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "text-xs px-3 py-1 font-medium",
                        getStatusColor(statusInfo.status)
                      )}
                    >
                      {getStatusIcon(statusInfo.status)} {statusInfo.message}
                      {statusInfo.closingDate && (
                        <span className="ml-2 text-xs opacity-75">
                          ({statusInfo.closingDate})
                        </span>
                      )}
                    </Badge>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
                   
        {/* Article image - ✅ OPTIMIZED: proper dimensions, quality 85, priority for LCP */}
        <div className="relative h-[720px] md:h-[560px] mb-8 rounded-lg overflow-hidden">
          <Image
            src={imageSrc}
            alt={generateAltText(imageSrc, article.articolo_title, role, location)}
            fill
            className="object-cover"
            onError={handleImageError}
            priority={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        
        {/* Article content */}
        <Card className="p-8 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed">
              {formatArticleText(article.articolo_body)}
            </div>
            
            {article.articolo && article.articolo !== article.articolo_body && (
              <div className="mt-8 pt-2 border-gray-200">
                <div className="text-gray-700 leading-relaxed">
                  {formatArticleText(article.articolo)}
                </div>
              </div>
            )}

            {article.articolo_tags && article.articolo_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 mt-12">
                {article.articolo_tags.slice(0, 6).map((tag, index) => (
                  <Link 
                    key={index}
                    href={`/blog?tag=${encodeURIComponent(tag.toLowerCase())}`}
                    className="inline-block"
                    onClick={() => trackEvent('article_tag_click', {
                      tag: tag,
                      article_id: article.id,
                      article_title: article.articolo_title,
                      tag_position: index + 1
                    })}
                  >
                    <Badge 
                      variant="secondary"
                      className="hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      {toItalianSentenceCase(tag)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
        
        {/* FAQ Section */}
        {article.faqs && article.faqs.length > 0 && (
          <FAQSection 
            faqs={article.faqs} 
            title="Domande Frequenti"
            articleUrl={getArticoloCanonicalUrl(article)}
          />
        )}

        {/* Related concorso */}
        {article.concorso && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Concorso di riferimento
            </h2>
            <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div 
                className="relative"
                onClick={() => article.concorso && trackConcorsoEngagement('view_from_article', article.concorso.id, article.concorso.Titolo)}
              >
                <ConcorsoCard concorso={article.concorso} />
              </div>
            </div>
          </div>
        )}

        {/* Related Articles Section */}
        <RelatedArticlesSection
          currentArticleId={article.id}
          categoria={article.categoria || article.concorso?.categoria}
          settore_professionale={article.settore_professionale || article.concorso?.settore_professionale}
          AreaGeografica={article.AreaGeografica || article.concorso?.AreaGeografica}
        />
      </div>
      
      {/* CTA Section */}
      <CTASection />
      
      {/* Footer */}
      <MainFooter />
    </div>
  )
}

