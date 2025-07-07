import React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={cn("flex min-w-0", className)}>
      <ol className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 overflow-hidden">
        <li className="flex items-center flex-shrink-0">
          <Link 
            href="/" 
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={cn(
              "flex items-center gap-1",
              isLast ? "min-w-0 flex-1" : "flex-shrink-0"
            )}>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              {item.current || !item.href ? (
                <span 
                  className={cn(
                    "font-medium",
                    item.current ? "text-foreground" : "text-muted-foreground",
                    isLast ? "truncate min-w-0" : "whitespace-nowrap"
                  )}
                  aria-current={item.current ? "page" : undefined}
                  title={item.label} // Show full text on hover
                >
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.href}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    isLast ? "truncate min-w-0" : "whitespace-nowrap"
                  )}
                  title={item.label} // Show full text on hover
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  )
} 