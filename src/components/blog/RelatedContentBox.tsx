"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { ArrowRight, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RelatedContentItem {
  id: string
  title: string
  url: string
  description?: string
}

interface RelatedContentBoxProps {
  items: RelatedContentItem[]
  title?: string
  className?: string
  variant?: 'default' | 'compact'
}

/**
 * RelatedContentBox - Displays related articles as a callout within article content
 * 
 * This component improves SEO by:
 * 1. Creating contextual internal links
 * 2. Increasing time on page (users explore related content)
 * 3. Distributing link equity across the site
 * 4. Helping Google understand topic relationships
 * 
 * Usage in article content:
 * <RelatedContentBox items={[...]} title="Articoli correlati" />
 */
export function RelatedContentBox({ 
  items, 
  title = "📚 Potrebbero interessarti anche",
  className,
  variant = 'default'
}: RelatedContentBoxProps) {
  if (items.length === 0) return null

  if (variant === 'compact') {
    return (
      <div className={cn(
        "my-6 p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-lg",
        className
      )}>
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          {title}
        </p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link 
                href={item.url}
                className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:underline inline-flex items-center gap-1 group"
              >
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <Card className={cn(
      "my-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800",
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          {title}
        </h3>
      </div>
      
      <div className="space-y-3">
        {items.map((item) => (
          <Link 
            key={item.id}
            href={item.url}
            className="block group"
          >
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

/**
 * InlineLink - Simple styled internal link for use within article text
 */
interface InlineLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function InlineLink({ href, children, className }: InlineLinkProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-blue-300 dark:decoration-blue-700 hover:decoration-blue-500 dark:hover:decoration-blue-500 underline-offset-2 transition-colors font-medium",
        className
      )}
    >
      {children}
    </Link>
  )
}
