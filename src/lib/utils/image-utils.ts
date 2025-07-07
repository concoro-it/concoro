/**
 * Generate a deterministic image number based on article ID
 * This ensures the same article always gets the same cover image
 */
export function getDeterministicImageNumber(articleId: string): number {
  // Simple hash function to convert string to number
  let hash = 0
  for (let i = 0; i < articleId.length; i++) {
    const char = articleId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive number and get a value between 1-12
  const positiveHash = Math.abs(hash)
  return (positiveHash % 12) + 1
}

/**
 * Get the cover image path for an article
 * First tries the specific article image, then falls back to deterministic image
 */
export function getArticleCoverImage(articleId: string): string {
  return `/blog/${articleId}.png`
}

/**
 * Get the fallback cover image path for an article
 */
export function getFallbackCoverImage(articleId: string): string {
  const imageNumber = getDeterministicImageNumber(articleId)
  return `/blog/${imageNumber}.png`
} 