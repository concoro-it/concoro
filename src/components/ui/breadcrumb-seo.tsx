'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { useEffect } from 'react'
import { extractRegionsFromLocalita } from '@/lib/utils/region-utils'
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
// Removed normalizeEnteForSlug import - using exact ente names now

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbSEOProps {
  items: BreadcrumbItem[]
  className?: string
  // Optional props for automatic region/ente hierarchy generation
  areaGeografica?: string
  ente?: string
  enableRegionHierarchy?: boolean
}

export function BreadcrumbSEO({ 
  items, 
  className = '', 
  areaGeografica,
  ente,
  enableRegionHierarchy = false
}: BreadcrumbSEOProps) {
  
  // Generate hierarchical breadcrumbs if region hierarchy is enabled
  const generateHierarchicalItems = () => {
    if (!enableRegionHierarchy) {
      return items;
    }

    const hierarchicalItems: BreadcrumbItem[] = [];
    
    // Always add Concorsi Pubblici as the first item after Home
    hierarchicalItems.push({ label: 'Concorsi Pubblici', href: '/bandi' });
    
    // For new structure, we need to check if we have province data in the concorso
    // Since we're getting areaGeografica as a string, we'll use the legacy extraction for now
    // TODO: Pass the full concorso object to get access to the province array
    
    // Add region if available
    if (areaGeografica) {
      const regions = extractRegionsFromLocalita(areaGeografica);
      if (regions.length > 0) {
        const primaryRegion = regions[0]; // Use the first region as primary
        hierarchicalItems.push({
          label: primaryRegion,
          href: `/bandi/localita/${encodeURIComponent(primaryRegion.toLowerCase().replace(/\s+/g, '-'))}`
        });
      }
    }
    
    // Add ente if available
    if (ente) {
      hierarchicalItems.push({
        label: ente,
        href: `/bandi/ente/${encodeURIComponent(ente)}`
      });
    }
    
    // Add any remaining custom items (like the specific bando title) at the end
    const customItems = items.filter(item => 
      item.href !== '/bandi' && 
      !item.href.includes('/regione/') && 
      !item.href.includes('/ente/') &&
      item.href !== '' // Don't filter out the current page title
    );
    
    // Add custom items at the end to maintain proper hierarchy
    hierarchicalItems.push(...customItems);
    
    return hierarchicalItems;
  };

  const finalItems = generateHierarchicalItems();

  // Generate structured data for breadcrumbs
  useEffect(() => {
    const breadcrumbStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.concoro.it'
        },
        ...finalItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 2,
          name: item.label,
          item: `https://www.concoro.it${item.href}`
        }))
      ]
    }
    
    // Add or update breadcrumb structured data
    const existingScript = document.getElementById('breadcrumb-structured-data')
    if (existingScript) {
      existingScript.textContent = JSON.stringify(breadcrumbStructuredData)
    } else {
      const script = document.createElement('script')
      script.id = 'breadcrumb-structured-data'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(breadcrumbStructuredData)
      document.head.appendChild(script)
    }
    
    return () => {
      const script = document.getElementById('breadcrumb-structured-data')
      if (script) {
        script.remove()
      }
    }
  }, [finalItems])

  const allItems = [{ label: 'Home', href: '/' }, ...finalItems]

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-1 text-sm text-gray-600 min-w-0 overflow-hidden ${className}`}>
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isTitle = isLast && item.label !== 'Home' && item.label !== 'Concorsi Pubblici';
        
        return (
          <div key={`${index}-${item.label}-${item.href || 'no-href'}`} className="flex items-center min-w-0">
            {index === 0 && <Home className="h-4 w-4 mr-1 flex-shrink-0" />}
            {index < allItems.length - 1 && item.href ? (
              <Link 
                href={item.href}
                className="hover:text-gray-900 transition-colors flex-shrink-0"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={`text-gray-900 font-medium min-w-0 ${
                  isTitle ? 'truncate' : ''
                }`}
                title={isTitle ? toItalianSentenceCase(item.label) : item.label}
              >
                {isTitle ? toItalianSentenceCase(item.label) : item.label}
              </span>
            )}
            {index < allItems.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-1 text-gray-400 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </nav>
  )
}

