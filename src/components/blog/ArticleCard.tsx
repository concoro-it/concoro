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
import Link from "next/link"
import Image from "next/image"
import {
  GraduationCap,
  MapPin,
  Heart,
  Gavel,
  Euro,
  Laptop,
  Leaf,
  Landmark,
  Bus,
  Wheat,
  Flame,
  FileText,
  CalendarIcon,
} from "lucide-react" 
import { format } from "date-fns"
import { Articolo } from "@/types"
import { it } from "date-fns/locale"
import { useState } from "react"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { getArticleCoverImage, getFallbackCoverImage } from '@/lib/utils/image-utils'
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ArticleCardProps {
  article: Articolo
}

export function ArticleCard({ article }: ArticleCardProps) {
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

  // Placeholder articles are now filtered at the page level, so no need to hide here

  // Determine icon based on article category/type - now 32px
/**
 * Determine icon based on article category/type – 32 px (Tailwind h-8 w-8)
 */
const getArticleIcon = (article: Articolo) => {
  const title = article.articolo_title?.toLowerCase() || ""
  const subtitle = article.articolo_subtitle?.toLowerCase() || ""
  const content = `${title} ${subtitle}`

  // University and education
  if (
    content.includes("università") ||
    content.includes("laurea") ||
    content.includes("dottorato") ||
    content.includes("ricerca") ||
    content.includes("accademico")
  ) {
    return <GraduationCap className="h-8 w-8 text-purple-500" />
  }

  // Regional and local administration
  if (
    content.includes("regione") ||
    content.includes("comune") ||
    content.includes("provincia") ||
    content.includes("regionale") ||
    content.includes("comunale")
  ) {
    return <MapPin className="h-8 w-8 text-green-500" />
  }

  // Healthcare
  if (
    content.includes("sanit") || // sanitÀ, sanitario, sanità …
    content.includes("ospedale") ||
    content.includes("medic") ||
    content.includes("infermier")
  ) {
    return <Heart className="h-8 w-8 text-red-500" />
  }

  /* ─────────────────────────────── NEW CATEGORIES ────────────────────────────── */

  // Justice & security (tribunali, polizia giudiziaria, ecc.)
  if (
    content.includes("giustizia") ||
    content.includes("tribunale") ||
    content.includes("magistrat") ||
    content.includes("cancelliere") ||
    content.includes("penitenziaria") ||
    content.includes("forze dell'ordine") ||
    content.includes("polizia") ||
    content.includes("carabinieri") ||
    content.includes("guardia di finanza")
  ) {
    return <Gavel className="h-8 w-8 text-yellow-600" />
  }

  // Finance, accounting & taxation
  if (
    content.includes("contabil") ||
    content.includes("ragioniere") ||
    content.includes("finanza") ||
    content.includes("bilancio") ||
    content.includes("tesoreria") ||
    content.includes("fiscale") ||
    content.includes("tributi")
  ) {
    return <Euro className="h-8 w-8 text-emerald-600" />
  }

  // Digital & IT
  if (
    content.includes("informatica") ||
    content.includes("ict") ||
    content.includes("tecnologi") ||
    content.includes("digitale") ||
    content.includes("software") ||
    content.includes("sistemist") ||
    content.includes("cyber")
  ) {
    return <Laptop className="h-8 w-8 text-blue-500" />
  }

  // Environment, forestry & ecology
  if (
    content.includes("ambiente") ||
    content.includes("ecologi") ||
    content.includes("forestale") ||
    content.includes("geologo") ||
    content.includes("agronomo") ||
    content.includes("sostenibilità")
  ) {
    return <Leaf className="h-8 w-8 text-lime-600" />
  }

  // Culture, heritage & tourism
  if (
    content.includes("beni culturali") ||
    content.includes("museo") ||
    content.includes("bibliotec") ||
    content.includes("archivio") ||
    content.includes("turismo") ||
    content.includes("archeologi")
  ) {
    return <Landmark className="h-8 w-8 text-rose-500" />
  }

  // Transport & infrastructure
  if (
    content.includes("trasport") ||
    content.includes("mobilità") ||
    content.includes("autisti") ||
    content.includes("conducente") ||
    content.includes("logistica") ||
    content.includes("infrastrutture")
  ) {
    return <Bus className="h-8 w-8 text-cyan-600" />
  }

  // Agriculture & food safety
  if (
    content.includes("agricoltur") ||
    content.includes("alimenti") ||
    content.includes("zootech") ||
    content.includes("veterinar") ||
    content.includes("sivico") || // silvicoltura
    content.includes("alimentare")
  ) {
    return <Wheat className="h-8 w-8 text-amber-500" />
  }

  // Fire-brigade & civil protection
  if (
    content.includes("vigili del fuoco") ||
    content.includes("antincendio") ||
    content.includes("protezione civile") ||
    content.includes("emergenza")
  ) {
    return <Flame className="h-8 w-8 text-orange-600" />
  }

  /* ─────────────────────────── Default / fallback ──────────────────────────── */
  return <FileText className="h-8 w-8 text-gray-400" />
}
  
  return (
    <Link href={`/articolo/${article.slug || article.concorso_id}`} className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background hover:bg-muted/30 p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group cursor-pointer">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            {/* Top section with icon and tag */}
            <div className="flex items-start justify-between">
              <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                {getArticleIcon(article)}
              </div>
              {article.articolo_tags && article.articolo_tags.length > 0 && (
                <Badge variant="outline" className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted transition-colors">
                  {toItalianSentenceCase(article.articolo_tags[0])}
                </Badge>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-3 h-3" />
                <span>{formatDate(article.publication_date || article.createdAt)}</span>
              </div>
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {toItalianSentenceCase(article.articolo_title)}
              </h3>
              {article.articolo_subtitle && (
                <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                  {toItalianSentenceCase(article.articolo_subtitle)}
                </h2>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
} 