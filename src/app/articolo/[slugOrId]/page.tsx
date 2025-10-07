"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { 
  ArrowLeft, 
  CalendarIcon,
  FileText,
  Clock,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { getArticoloWithConcorsoBySlugOrId, updateArticleMetadata } from "@/lib/blog/services"
import { ArticoloWithConcorso } from "@/types"
import { it } from "date-fns/locale"
import { Separator } from "@/components/ui/separator"
import { marked } from 'marked'
import { ConcorsoCard } from "@/components/blog/ConcorsoCard"
import { Timestamp } from "firebase/firestore"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { cn } from "@/lib/utils"
import { getArticleCoverImage, getFallbackCoverImage } from '@/lib/utils/image-utils'
import { CTASection } from "@/components/ui/cta-section"
import { MainFooter } from "@/components/ui/main-footer"
import { isDocumentId } from '@/lib/utils/slug-utils'
import { getDeadlineCountdown } from '@/lib/utils/date-utils'
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb"
import { RelatedArticlesSection } from "@/components/blog/RelatedArticlesSection"
import { generateArticleSEO, generateAltText, generateSocialImage } from '@/lib/utils/seo-utils'
import { generateJobPostingStructuredData, validateJobPostingData } from '@/lib/utils/jobposting-utils'
import { getArticoloCanonicalUrl } from '@/lib/utils/articolo-canonical-utils'
import { trackArticleView, trackConcorsoEngagement, trackEvent } from '@/lib/analytics'

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

export default function ArticolePage({ params }: { params: { slugOrId: string } }) {
  const [article, setArticle] = useState<ArticoloWithConcorso | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string>('/blog/default-article-image.png')
  const router = useRouter()
  
  // Extract role and location for reuse throughout component
  const role = article?.concorso?.Titolo?.includes('Istruttore') ? 'Istruttore' : 
               article?.concorso?.Titolo?.includes('Dirigente') ? 'Dirigente' :
               article?.concorso?.Titolo?.includes('Funzionario') ? 'Funzionario' :
               article?.concorso?.Titolo?.includes('Assistente') ? 'Assistente' :
               article?.concorso?.Titolo?.includes('Operatore') ? 'Operatore' :
               article?.concorso?.Titolo?.includes('Tecnico') ? 'Tecnico' :
               undefined;

  const location = article?.concorso?.AreaGeografica || article?.AreaGeografica;
  
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const articleData = await getArticoloWithConcorsoBySlugOrId(params.slugOrId)
        
        if (!articleData) {
          setError("Articolo non trovato")
          return
        }
        
        setArticle(articleData)
        
        // Redirect is now handled server-side in layout.tsx for proper SEO
        // This ensures 301 redirects are properly sent to search engines
        
        // Set the initial image path using the same logic as ArticleCard
        setImageSrc(getArticleCoverImage(articleData.concorso_id))
        
        // Update article metadata if missing and concorso data is available
        if (articleData.concorso && (!articleData.categoria || !articleData.AreaGeografica)) {
          try {
            await updateArticleMetadata(articleData.id, articleData.concorso_id)
            // Update local state with new metadata
            setArticle(prev => prev && articleData.concorso ? {
              ...prev,
              categoria: articleData.concorso.categoria || prev.categoria,
              settore_professionale: articleData.concorso.settore_professionale || prev.settore_professionale,
              AreaGeografica: articleData.concorso.AreaGeografica || prev.AreaGeografica,
            } : prev)
          } catch (error) {
            console.warn("Failed to update article metadata:", error)
          }
        }
        
      } catch (err) {
        console.error("Error fetching article:", err)
        setError("Impossibile caricare l'articolo. Riprova più tardi.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchArticle()
  }, [params.slugOrId, router])

  // Handle image error - use deterministic fallback
  const handleImageError = () => {
    if (article) {
      setImageSrc(getFallbackCoverImage(article.concorso_id))
    } else {
      setImageSrc('/blog/default-article-image.png')
    }
  }
  
  // Format date to display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    
    try {
      // Convert Firebase timestamp to Date
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds && timestamp.nanoseconds) {
        // Handle Firestore timestamp format
        date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
      } else if (typeof timestamp === 'string') {
        // Handle string date
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return "Data non disponibile";
      }
      
      // Check if date is valid before formatting
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
      // Debug logging (optional - remove in production)
      // 
      
      // Use existing date utility to check if the deadline is still valid
      const deadlineCountdown = getDeadlineCountdown(concorso.DataChiusura);
      
      if (!deadlineCountdown) {
        // If no countdown, it means the deadline has passed
        return { 
          status: 'closed', 
          message: 'Chiuso',
          closingDate: formatDate(concorso.DataChiusura)
        };
      }
      
      // If we have a countdown, the concorso is still open
      return { 
        status: 'open', 
        message: deadlineCountdown, // Use the exact countdown message
        closingDate: formatDate(concorso.DataChiusura)
      };
      
    } catch (error) {
      console.error("Error determining concorso status:", error);
      return { status: 'unknown', message: 'Stato non determinabile' };
    }
  }
  
  // Update page metadata dynamically and inject canonical tag
  useEffect(() => {
    if (article) {
      // Extract data for SEO generation
      const role = article.concorso?.Titolo?.includes('Istruttore') ? 'Istruttore' : 
                   article.concorso?.Titolo?.includes('Dirigente') ? 'Dirigente' :
                   article.concorso?.Titolo?.includes('Funzionario') ? 'Funzionario' :
                   article.concorso?.Titolo?.includes('Assistente') ? 'Assistente' : undefined;
      
      const location = article.AreaGeografica || article.concorso?.AreaGeografica;
      const region = (article.concorso as any)?.Regione;
      const articleTags = (article as any).tags || [];
      
      // Generate SEO-optimized meta data
      const seoData = generateArticleSEO(
        article.articolo_title,
        article.articolo_subtitle,
        articleTags,
        role,
        location,
        region,
        article.articolo_meta_description
      );
      
      // Note: robots meta and canonical are now handled server-side in layout.tsx

      // Set SEO-optimized title (≤ 60 chars, primary keyword first, ends with "| Concoro")
      document.title = seoData.title;
      
      // Set SEO-optimized meta description (140-160 chars, role + location + CTA)
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', seoData.description)
      } else {
        const meta = document.createElement('meta')
        meta.name = 'description'
        meta.content = seoData.description
        document.head.appendChild(meta)
      }
      
      // Add keywords meta tag
      const metaKeywords = document.querySelector('meta[name="keywords"]')
      if (metaKeywords) {
        metaKeywords.setAttribute('content', seoData.keywords.join(', '))
      } else {
        const meta = document.createElement('meta')
        meta.name = 'keywords'
        meta.content = seoData.keywords.join(', ')
        document.head.appendChild(meta)
      }
      
      // Add hreflang="it-IT" meta tag
      const hreflang = document.querySelector('link[rel="alternate"][hreflang="it-IT"]')
      if (hreflang) {
        hreflang.setAttribute('href', getArticoloCanonicalUrl(article))
      } else {
        const hreflangLink = document.createElement('link')
        hreflangLink.rel = 'alternate'
        hreflangLink.hreflang = 'it-IT'
        hreflangLink.href = getArticoloCanonicalUrl(article)
        document.head.appendChild(hreflangLink)
      }
      
      // Note: canonical link is now handled server-side in layout.tsx
      
      // Helper function to safely convert timestamps to ISO strings
      const toISOString = (timestamp: any): string => {
        if (!timestamp) return new Date().toISOString();
        
        try {
          // Handle Firestore Timestamp
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toISOString();
          }
          // Handle Firestore timestamp format
          if (timestamp.seconds && timestamp.nanoseconds) {
            return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString();
          }
          // Handle JavaScript Date
          if (timestamp instanceof Date) {
            return timestamp.toISOString();
          }
          // Handle string date
          if (typeof timestamp === 'string') {
            return new Date(timestamp).toISOString();
          }
          // Fallback
          return new Date().toISOString();
        } catch (error) {
          console.error('Error converting timestamp to ISO string:', error);
          return new Date().toISOString();
        }
      };
      
              // Generate optimized social image URL (1200x630, WebP preferred, <100kB)
        const socialImageUrl = generateSocialImage(
          article.articolo_title,
          role,
          location,
          imageSrc.startsWith('/') ? `https://www.concoro.it${imageSrc}` : imageSrc
        );

        // Complete Open Graph implementation
        const ogMetaTags = [
          { property: 'og:title', content: seoData.title },
          { property: 'og:description', content: seoData.description },
          { property: 'og:url', content: getArticoloCanonicalUrl(article) },
          { property: 'og:type', content: 'article' },
          { property: 'og:site_name', content: 'Concoro' },
          { property: 'og:locale', content: 'it_IT' },
          { property: 'og:image', content: socialImageUrl },
          { property: 'og:image:width', content: '1200' },
          { property: 'og:image:height', content: '630' },
          { property: 'og:image:alt', content: generateAltText(imageSrc, article.articolo_title, role, location) },
          { property: 'article:author', content: 'Concoro' },
          { property: 'article:published_time', content: toISOString(article.publication_date) },
          { property: 'article:modified_time', content: toISOString(article.updatedAt) || toISOString(article.publication_date) },
          { property: 'article:section', content: article.categoria || 'Concorsi Pubblici' },
          { property: 'article:tag', content: seoData.keywords.join(', ') }
        ];
      
      // Add Twitter Card meta tags
      const twitterMetaTags = [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: seoData.title },
        { name: 'twitter:description', content: seoData.description },
        { name: 'twitter:image', content: socialImageUrl },
        { name: 'twitter:image:alt', content: generateAltText(imageSrc, article.articolo_title, role, location) }
      ];
      
      // Update or create Open Graph meta tags
      ogMetaTags.forEach(({ property, content }) => {
        const existing = document.querySelector(`meta[property="${property}"]`);
        if (existing) {
          existing.setAttribute('content', content);
        } else {
          const meta = document.createElement('meta');
          meta.setAttribute('property', property);
          meta.content = content;
          document.head.appendChild(meta);
        }
      });
      
      // Update or create Twitter Card meta tags
      twitterMetaTags.forEach(({ name, content }) => {
        const existing = document.querySelector(`meta[name="${name}"]`);
        if (existing) {
          existing.setAttribute('content', content);
        } else {
          const meta = document.createElement('meta');
          meta.name = name;
          meta.content = content;
          document.head.appendChild(meta);
        }
      });
      
      // Add Article structured data for SEO (use BlogPosting for blog articles)
      const articleStructuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.articolo_title,
        "description": article.articolo_meta_description || article.articolo_subtitle,
        "datePublished": toISOString(article.publication_date),
        "dateModified": toISOString(article.updatedAt) || toISOString(article.publication_date),
        "url": getArticoloCanonicalUrl(article),
        "image": [socialImageUrl],
        "author": {
          "@type": "Organization",
          "name": "Concoro",
          "url": "https://www.concoro.it"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Concoro",
          "url": "https://www.concoro.it",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.concoro.it/concoro-favicon-light.jpg"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": getArticoloCanonicalUrl(article)
        }
      } as const
      
      // Generate JobPosting structured data only if concorso is active (validThrough in the future)
      let jobPostingStructuredData = null as any;
      if (article.concorso) {
        const now = new Date();
        let closingDate: Date | null = null;
        const dc: any = (article.concorso as any).DataChiusura;
        try {
          if (dc?.toDate && typeof dc.toDate === 'function') {
            closingDate = dc.toDate();
          } else if (dc?.seconds && dc?.nanoseconds) {
            closingDate = new Timestamp(dc.seconds, dc.nanoseconds).toDate();
          } else if (typeof dc === 'string') {
            closingDate = new Date(dc);
          }
        } catch {}

        const isActive = !closingDate || (closingDate instanceof Date && !isNaN(closingDate.getTime()) && closingDate > now);
        if (isActive) {
          jobPostingStructuredData = generateJobPostingStructuredData(article, 'https://www.concoro.it');
        }
        
        if (jobPostingStructuredData && !validateJobPostingData(jobPostingStructuredData)) {
          console.warn('Generated JobPosting structured data failed validation');
          jobPostingStructuredData = null;
        }
      }
      
      // Remove existing structured data
      const existingArticleScript = document.querySelector('script[type="application/ld+json"][data-article]')
      if (existingArticleScript) {
        existingArticleScript.remove()
      }
      
      const existingJobScript = document.querySelector('script[type="application/ld+json"][data-jobposting]')
      if (existingJobScript) {
        existingJobScript.remove()
      }
      
      // Add Article structured data
      const articleScript = document.createElement('script')
      articleScript.type = 'application/ld+json'
      articleScript.setAttribute('data-article', 'true')
      articleScript.textContent = JSON.stringify(articleStructuredData)
      document.head.appendChild(articleScript)
      
      // Add JobPosting structured data if available
      if (jobPostingStructuredData) {
        const jobScript = document.createElement('script')
        jobScript.type = 'application/ld+json'
        jobScript.setAttribute('data-jobposting', 'true')
        jobScript.textContent = JSON.stringify(jobPostingStructuredData)
        document.head.appendChild(jobScript)
        
        
      } else {
        
      }

      // Track article view for analytics
      if (article.slug || article.id) {
        trackArticleView(article.id, article.slug || article.id, article.articolo_title);
        
        // Track additional custom events for engagement
        trackEvent('article_engagement_start', {
          article_id: article.id,
          article_title: article.articolo_title,
          article_category: article.categoria,
          geographic_area: article.AreaGeografica,
          professional_sector: article.settore_professionale,
          has_concorso: !!article.concorso,
          url_type: isDocumentId(params.slugOrId) ? 'id_based' : 'slug_based'
        });
        
        // Track reading time engagement after 30 seconds
        setTimeout(() => {
          trackEvent('article_reading_engagement', {
            article_id: article.id,
            engagement_duration: 30,
            article_title: article.articolo_title
          });
        }, 30000);
      }
    }
  }, [article])
  
  // Function to format article text with paragraphs
  const formatArticleText = (text: string) => {
    if (!text) return "";
    
    // Split text into paragraphs
    const paragraphs = text.split('\n\n');
    
    // Format paragraphs with proper HTML
    return paragraphs.map((paragraph, index) => {
      // Handle bold text (** **)
      const formattedParagraph = paragraph.replace(
        /\*\*(.*?)\*\*/g, 
        '<strong>$1</strong>'
      );
      
      return (
        <p key={index} className="mb-4">
          <span dangerouslySetInnerHTML={{ __html: formattedParagraph }} />
        </p>
      );
    });
  };

  // Generate breadcrumb items
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (!article) return [];
    
    const items: BreadcrumbItem[] = [
      { label: "Concorsi", href: "/bandi" }
    ];
    
    // Add geographic area if available
    const areaGeografica = article.AreaGeografica || article.concorso?.AreaGeografica;
    if (areaGeografica) {
      items.push({
        label: toItalianSentenceCase(areaGeografica),
        href: `/bandi?location=${encodeURIComponent(areaGeografica)}`
      });
    }
    
    // Add final segment (current article title) - not clickable
    items.push({
      label: toItalianSentenceCase(article.articolo_title),
      current: true
    });
    
    return items;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-8 max-w-4xl">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Torna al blog
            </Button>
          </Link>
        </div>
        
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          
          <div className="h-80 bg-gray-200 rounded-lg mb-8"></div>
          
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error || !article) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-8 max-w-4xl">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Torna al blog
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-16">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Articolo non trovato"}
          </h2>
          <p className="text-gray-600 mb-8">
            L'articolo che stai cercando non esiste o è stato rimosso.
          </p>
          <Link href="/blog">
            <Button>
              Torna al blog
            </Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen ">
      
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
            {article.articolo_title}
          </h1>
          
          {article.articolo_subtitle && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.articolo_subtitle}
            </p>
          )}
          
          {/* Article metadata - responsive layout for mobile */}
          <div className="mb-3">
            
            {/* Publication date and reading time in the same row */}
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


          
          {/* Tags - Made clickable with proper routing */}
        </div>
                   
        {/* Article image */}
        <div className="relative h-80 md:h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={imageSrc}
            alt={generateAltText(imageSrc, article.articolo_title, role, location)}
            fill
            className="object-cover"
            onError={handleImageError}
            priority={false}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            quality={80}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+i+12HThi5xYzs52hPdZl7dOzO4e8mJ3f9kqJrA="
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