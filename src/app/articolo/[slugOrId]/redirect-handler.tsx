import { redirect } from 'next/navigation'
import { getArticoloWithConcorsoBySlugOrIdServer } from '@/lib/blog/services-server'
import { isDocumentId } from '@/lib/utils/slug-utils'
import { shouldRedirectToCanonical } from '@/lib/utils/articolo-canonical-utils'

/**
 * Server-side redirect handler for articolo pages
 * Handles 301 redirects from non-canonical URLs to canonical URLs
 */
export async function handleArticoloRedirect(slugOrId: string) {
  try {
    // Fetch the article to check if we need to redirect
    const article = await getArticoloWithConcorsoBySlugOrIdServer(slugOrId)
    
    if (!article) {
      return null // Let the page handle 404
    }
    
    // Check if we should redirect to the canonical URL
    if (shouldRedirectToCanonical(slugOrId, article)) {
      const canonicalPath = `/articolo/${article.slug || article.id}`
      redirect(canonicalPath)
    }
    
    return article
  } catch (error) {
    console.error('Error in articolo redirect handler:', error)
    return null
  }
}
