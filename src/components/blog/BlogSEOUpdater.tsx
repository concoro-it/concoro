'use client'

import { useEffect } from 'react'
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'

interface BlogSEOUpdaterProps {
  selectedTag?: string | null
}

export function BlogSEOUpdater({ selectedTag }: BlogSEOUpdaterProps) {
  useEffect(() => {
    // Update page title dynamically when tag changes
    if (selectedTag) {
      document.title = `${toItalianSentenceCase(selectedTag)} - Blog Concorsi Pubblici | Concoro`
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `Articoli e guide su ${selectedTag.toLowerCase()} per concorsi pubblici. Consigli pratici e strategie di preparazione.`
        )
      }
    } else {
      document.title = 'Blog Concorsi Pubblici - Guide e Consigli | Concoro'
      
      // Reset meta description
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          'Guide pratiche per concorsi pubblici: strategie, consigli e aggiornamenti. Preparati al meglio con gli esperti di Concoro.'
        )
      }
    }
  }, [selectedTag])

  return null // This component doesn't render anything
}

