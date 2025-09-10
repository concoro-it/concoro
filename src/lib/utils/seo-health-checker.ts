/**
 * SEO Health Checker for Concoro Guest Pages
 * Validates SEO implementation across the site
 */

export interface SEOHealthReport {
  page: string
  score: number
  issues: SEOIssue[]
  recommendations: string[]
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  element?: string
}

/**
 * Check SEO health of current page
 */
export function checkPageSEO(): SEOHealthReport {
  const issues: SEOIssue[] = []
  const recommendations: string[] = []
  let score = 100

  // Check title tag
  const title = document.title
  if (!title) {
    issues.push({ type: 'error', message: 'Missing page title', element: 'title' })
    score -= 20
  } else if (title.length > 60) {
    issues.push({ type: 'warning', message: `Title too long (${title.length} chars, max 60)`, element: 'title' })
    score -= 5
  } else if (title.length < 30) {
    issues.push({ type: 'warning', message: `Title too short (${title.length} chars, min 30)`, element: 'title' })
    score -= 5
  }
  
  if (title && !title.includes('Concoro')) {
    recommendations.push('Consider including "Concoro" brand name in title')
  }

  // Check meta description
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')
  if (!metaDescription) {
    issues.push({ type: 'error', message: 'Missing meta description', element: 'meta[name="description"]' })
    score -= 15
  } else if (metaDescription.length > 160) {
    issues.push({ type: 'warning', message: `Meta description too long (${metaDescription.length} chars, max 160)`, element: 'meta[name="description"]' })
    score -= 5
  } else if (metaDescription.length < 120) {
    issues.push({ type: 'warning', message: `Meta description too short (${metaDescription.length} chars, min 120)`, element: 'meta[name="description"]' })
    score -= 5
  }

  // Check H1 tag
  const h1Tags = document.querySelectorAll('h1')
  if (h1Tags.length === 0) {
    issues.push({ type: 'error', message: 'Missing H1 tag', element: 'h1' })
    score -= 15
  } else if (h1Tags.length > 1) {
    issues.push({ type: 'warning', message: `Multiple H1 tags found (${h1Tags.length})`, element: 'h1' })
    score -= 10
  }

  // Check canonical URL
  const canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    issues.push({ type: 'warning', message: 'Missing canonical URL', element: 'link[rel="canonical"]' })
    score -= 5
  }

  // Check Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]')
  const ogDescription = document.querySelector('meta[property="og:description"]')
  const ogImage = document.querySelector('meta[property="og:image"]')
  
  if (!ogTitle) {
    issues.push({ type: 'warning', message: 'Missing Open Graph title', element: 'meta[property="og:title"]' })
    score -= 5
  }
  if (!ogDescription) {
    issues.push({ type: 'warning', message: 'Missing Open Graph description', element: 'meta[property="og:description"]' })
    score -= 5
  }
  if (!ogImage) {
    issues.push({ type: 'warning', message: 'Missing Open Graph image', element: 'meta[property="og:image"]' })
    score -= 5
  }

  // Check structured data
  const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]')
  if (structuredDataScripts.length === 0) {
    issues.push({ type: 'info', message: 'No structured data found', element: 'script[type="application/ld+json"]' })
    recommendations.push('Consider adding structured data for better search results')
  }

  // Check images alt text
  const images = document.querySelectorAll('img')
  let imagesWithoutAlt = 0
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      imagesWithoutAlt++
    }
  })
  
  if (imagesWithoutAlt > 0) {
    issues.push({ type: 'warning', message: `${imagesWithoutAlt} images missing alt text`, element: 'img' })
    score -= Math.min(imagesWithoutAlt * 2, 10)
  }

  // Check internal links
  const internalLinks = document.querySelectorAll('a[href^="/"], a[href*="concoro.it"]')
  if (internalLinks.length < 3) {
    recommendations.push('Consider adding more internal links for better SEO')
  }

  // Check page loading speed (simple check)
  if (performance.timing) {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    if (loadTime > 3000) {
      issues.push({ type: 'warning', message: `Page load time slow (${Math.round(loadTime/1000)}s)`, element: 'performance' })
      score -= 5
    }
  }

  return {
    page: window.location.pathname,
    score: Math.max(0, score),
    issues,
    recommendations
  }
}

/**
 * Generate SEO health report for console
 */
export function logSEOHealth(): void {
  const report = checkPageSEO()
  
  console.group(`🔍 SEO Health Check - ${report.page}`)
  console.log(`📊 Score: ${report.score}/100`)
  
  if (report.issues.length > 0) {
    console.group('⚠️ Issues')
    report.issues.forEach(issue => {
      const emoji = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'
      console.log(`${emoji} ${issue.message}`)
    })
    console.groupEnd()
  }
  
  if (report.recommendations.length > 0) {
    console.group('💡 Recommendations')
    report.recommendations.forEach(rec => {
      console.log(`• ${rec}`)
    })
    console.groupEnd()
  }
  
  console.groupEnd()
}

/**
 * Auto-run SEO health check in development
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run after page load
  window.addEventListener('load', () => {
    setTimeout(logSEOHealth, 1000)
  })
}

