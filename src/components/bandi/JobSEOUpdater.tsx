'use client'

import { useEffect } from 'react'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'

interface Job {
  id: string
  Titolo?: string
  Title?: string
  Ente?: string
  AreaGeografica?: string
  DataChiusura?: string | any
  Descrizione?: string
  riassunto?: string
}

interface JobSEOUpdaterProps {
  job: Job | null
}

export function JobSEOUpdater({ job }: JobSEOUpdaterProps) {
  useEffect(() => {
    if (!job) return

    // Extract job details
    const title = job.Titolo || job.Title || 'Concorso Pubblico'
    const ente = job.Ente || 'Pubblica Amministrazione'
    const location = job.AreaGeografica || ''
    
    // Generate SEO-friendly title
    let seoTitle = title
    if (location) {
      seoTitle += ` ${location}`
    }
    seoTitle += ' - Concorso Pubblico | Concoro'
    
    // Truncate title if too long
    if (seoTitle.length > 60) {
      const maxLength = 60 - ' | Concoro'.length
      seoTitle = seoTitle.substring(0, maxLength).trim() + ' | Concoro'
    }
    
    // Generate description
    let seoDescription = `${title} presso ${ente}`
    if (location) {
      seoDescription += ` a ${location}`
    }
    seoDescription += '. Scopri requisiti, scadenze e come candidarti. Tutte le informazioni su Concoro.'
    
    // Ensure description is within limits
    if (seoDescription.length > 160) {
      seoDescription = seoDescription.substring(0, 157) + '...'
    }
    
    // Update page title
    document.title = seoTitle
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', seoDescription)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = seoDescription
      document.head.appendChild(meta)
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', seoTitle)
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
      ogDescription.setAttribute('content', seoDescription)
    }
    
    // Generate SEO-friendly URL with fallback
    let seoUrl: string
    try {
      const generatedUrl = getBandoUrl(job as any)
      seoUrl = `https://www.concoro.it${generatedUrl}`
    } catch (error) {
      console.error('Error generating SEO URL for meta tags:', error)
      seoUrl = `https://www.concoro.it/bandi/${job.id}`
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) {
      ogUrl.setAttribute('content', seoUrl)
    }
    
    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) {
      canonical.setAttribute('href', seoUrl)
    }
    
  }, [job])

  return null // This component doesn't render anything
}

