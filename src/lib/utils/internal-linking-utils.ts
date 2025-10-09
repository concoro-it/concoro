/**
 * Internal Linking Utilities for SEO
 * 
 * These utilities help create contextual internal links within article content,
 * improving SEO through better link distribution and topic clustering.
 */

import { Articolo } from '@/types'

export interface InternalLink {
  id: string
  title: string
  slug?: string
  url: string
  relevanceScore: number
  anchor?: string // Optional custom anchor text
}

export interface LinkSuggestion {
  keyword: string // The keyword/phrase to link
  targetArticle: InternalLink
  position: number // Character position in text where this could be inserted
}

/**
 * Calculates relevance score between two articles based on:
 * - Shared tags
 * - Same category
 * - Same geographic area
 * - Same professional sector
 */
export function calculateArticleRelevance(
  sourceArticle: Articolo,
  targetArticle: Articolo
): number {
  let score = 0

  // Shared tags (most important for content relevance)
  if (sourceArticle.articolo_tags && targetArticle.articolo_tags) {
    const sharedTags = sourceArticle.articolo_tags.filter(tag =>
      targetArticle.articolo_tags?.includes(tag)
    )
    score += sharedTags.length * 10
  }

  // Same category
  if (sourceArticle.categoria && targetArticle.categoria === sourceArticle.categoria) {
    score += 5
  }

  // Same professional sector
  if (sourceArticle.settore_professionale && targetArticle.settore_professionale === sourceArticle.settore_professionale) {
    score += 5
  }

  // Same geographic area
  if (sourceArticle.AreaGeografica && targetArticle.AreaGeografica === sourceArticle.AreaGeografica) {
    score += 3
  }

  return score
}

/**
 * Suggests related articles that should be linked from the current article
 * Returns top N most relevant articles
 */
export function suggestInternalLinks(
  currentArticle: Articolo,
  allArticles: Articolo[],
  limit: number = 5
): InternalLink[] {
  const suggestions = allArticles
    .filter(article => article.id !== currentArticle.id) // Exclude self
    .filter(article => article.slug || article.id) // Must have URL
    .map(article => ({
      id: article.id,
      title: article.articolo_title,
      slug: article.slug,
      url: `/articolo/${article.slug || article.id}`,
      relevanceScore: calculateArticleRelevance(currentArticle, article),
    }))
    .filter(suggestion => suggestion.relevanceScore > 0) // Only relevant articles
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Most relevant first
    .slice(0, limit)

  return suggestions
}

/**
 * Extracts keywords from article that could be good anchor text
 */
export function extractLinkableKeywords(article: Articolo): string[] {
  const keywords: string[] = []

  // Add tags as potential keywords
  if (article.articolo_tags) {
    keywords.push(...article.articolo_tags.map(tag => tag.toLowerCase()))
  }

  // Add category if available
  if (article.categoria) {
    keywords.push(article.categoria.toLowerCase())
  }

  // Add professional sector if available
  if (article.settore_professionale) {
    keywords.push(article.settore_professionale.toLowerCase())
  }

  // Add geographic area if available
  if (article.AreaGeografica) {
    keywords.push(article.AreaGeografica.toLowerCase())
  }

  // Common job titles that should be linked
  const commonTitles = [
    'istruttore amministrativo',
    'istruttore direttivo',
    'istruttore tecnico',
    'funzionario',
    'dirigente',
    'assistente amministrativo',
    'operatore',
    'tecnico',
  ]

  keywords.push(...commonTitles)

  // Remove duplicates and return
  return Array.from(new Set(keywords))
}

/**
 * Generates anchor text for a link to an article
 * Uses the article title or a custom phrase
 */
export function generateAnchorText(
  targetArticle: Articolo,
  keyword?: string
): string {
  if (keyword) {
    return keyword
  }

  // Use first tag if available (most relevant)
  if (targetArticle.articolo_tags && targetArticle.articolo_tags.length > 0) {
    return targetArticle.articolo_tags[0]
  }

  // Fallback to shortened title
  const title = targetArticle.articolo_title
  if (title.length > 60) {
    return title.substring(0, 57) + '...'
  }

  return title
}

/**
 * Finds positions in text where internal links could be naturally inserted
 * Returns keyword matches with their positions
 */
export function findLinkOpportunities(
  articleText: string,
  targetKeywords: string[]
): { keyword: string; position: number }[] {
  const opportunities: { keyword: string; position: number }[] = []
  const lowerText = articleText.toLowerCase()

  targetKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    let match

    // Find all occurrences of this keyword
    while ((match = regex.exec(lowerText)) !== null) {
      opportunities.push({
        keyword,
        position: match.index,
      })
    }
  })

  // Sort by position in text
  return opportunities.sort((a, b) => a.position - b.position)
}

/**
 * Creates a contextual internal link recommendation
 * This can be used to suggest links to content editors
 */
export interface LinkRecommendation {
  sourceArticle: Articolo
  targetArticle: Articolo
  suggestedAnchor: string
  relevanceScore: number
  reason: string // Why this link is recommended
}

export function generateLinkRecommendations(
  sourceArticle: Articolo,
  potentialTargets: Articolo[]
): LinkRecommendation[] {
  const suggestions = suggestInternalLinks(sourceArticle, potentialTargets, 5)

  return suggestions.map(suggestion => {
    const targetArticle = potentialTargets.find(a => a.id === suggestion.id)
    if (!targetArticle) return null

    // Determine reason for recommendation
    let reason = 'Contenuto correlato'
    if (sourceArticle.articolo_tags?.some(tag => targetArticle.articolo_tags?.includes(tag))) {
      reason = 'Condivide tag rilevanti'
    } else if (sourceArticle.categoria === targetArticle.categoria) {
      reason = 'Stessa categoria'
    } else if (sourceArticle.AreaGeografica === targetArticle.AreaGeografica) {
      reason = 'Stessa area geografica'
    }

    return {
      sourceArticle,
      targetArticle,
      suggestedAnchor: generateAnchorText(targetArticle),
      relevanceScore: suggestion.relevanceScore,
      reason,
    }
  }).filter(Boolean) as LinkRecommendation[]
}

/**
 * Formats a contextual link in markdown
 */
export function formatInternalLinkMarkdown(
  anchorText: string,
  targetUrl: string
): string {
  return `[${anchorText}](${targetUrl})`
}

/**
 * Formats a contextual link in HTML
 */
export function formatInternalLinkHTML(
  anchorText: string,
  targetUrl: string,
  className?: string
): string {
  const classAttr = className ? ` class="${className}"` : ''
  return `<a href="${targetUrl}"${classAttr}>${anchorText}</a>`
}
