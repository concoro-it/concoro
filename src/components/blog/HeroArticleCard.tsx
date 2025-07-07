import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { BackgroundBeams } from "@/components/ui/background-beams"
import Link from "next/link"
import Image from "next/image"
import { CalendarIcon, BookOpen, FileText, Briefcase, GraduationCap, MapPin, Heart, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { Articolo } from "@/types"
import { it } from "date-fns/locale"
import { useState } from "react"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { getArticleCoverImage, getFallbackCoverImage } from '@/lib/utils/image-utils'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HeroArticleCardProps {
  article: Articolo
}

export function HeroArticleCard({ article }: HeroArticleCardProps) {
  const [imageSrc, setImageSrc] = useState<string>(getArticleCoverImage(article.concorso_id))

  // Handle image error - use deterministic fallback instead of random
  const handleImageError = () => {
    setImageSrc(getFallbackCoverImage(article.concorso_id))
  }
  
  // Format date to display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    
    // Convert Firebase timestamp to Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return format(date, "d MMMM yyyy", { locale: it })
  }

  // Determine icon based on article category/type - larger for hero
  const getArticleIcon = (article: Articolo) => {
    const title = article.articolo_title?.toLowerCase() || ""
    const subtitle = article.articolo_subtitle?.toLowerCase() || ""
    const content = `${title} ${subtitle}`.toLowerCase()
    
    // University and education related
    if (content.includes("università") || content.includes("laurea") || content.includes("dottorato") || content.includes("ricerca")) {
      return <GraduationCap className="h-12 w-12 text-purple-500" />
    }
    
    // Regional and local administration
    if (content.includes("regione") || content.includes("comune") || content.includes("provincia") || content.includes("regionale") || content.includes("comunale")) {
      return <MapPin className="h-12 w-12 text-green-500" />
    }
    
    // Healthcare related
    if (content.includes("sanit") || content.includes("ospedale") || content.includes("medic") || content.includes("infermier")) {
      return <Heart className="h-12 w-12 text-red-500" />
    }
    
    // Default icon
    return <FileText className="h-12 w-12 text-orange-500" />
  }
  
  return (
    <Link href={`/articolo/${article.slug || article.concorso_id}`} className="block w-full">
      <div className="relative w-full rounded-[1.25rem] border-[0.75px] border-border p-3 md:rounded-[1.5rem] md:p-4">
        <GlowingEffect
          spread={60}
          glow={true}
          disabled={false}
          proximity={80}
          inactiveZone={0.01}
          borderWidth={4}
        />
        <div className="relative flex w-full min-h-[24rem] md:min-h-[28rem] lg:min-h-[32rem] flex-col justify-between gap-8 overflow-hidden rounded-xl border-[0.75px] bg-background p-8 md:p-12 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] hover:shadow-lg transition-all duration-300 group cursor-pointer">          
          <div className="relative flex flex-1 flex-col justify-between gap-6 z-10">
            {/* Icon and Badge Section */}
            <div className="flex items-start justify-between">
              <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-3">
                {getArticleIcon(article)}
              </div>
              {article.articolo_tags && article.articolo_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.articolo_tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-sm">
                        {toItalianSentenceCase(tag)}
                      </Badge>
                    ))}
                  </div>
                )}
            </div>
            
            {/* Content Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDate(article.publication_date || article.createdAt)}</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sans tracking-[-0.02em] text-balance text-foreground leading-tight">
                  {toItalianSentenceCase(article.articolo_title)}
                </h1>
                
                {article.articolo_subtitle && (
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl">
                    {toItalianSentenceCase(article.articolo_subtitle)}
                  </p>
                )}
              </div>
              
              {/* CTA Section */}
              <div className="flex items-center gap-3 pt-4">
                <Button variant="default" size="lg" className="group">
                  Leggi l'articolo
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
} 