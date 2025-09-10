import { useCallback } from 'react'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'
import { Concorso } from '@/types/concorso'

/**
 * Hook for generating bando URLs with fallback handling
 */
export function useBandoUrl() {
  const generateUrl = useCallback((concorso: Concorso): string => {
    try {
      return getBandoUrl(concorso)
    } catch (error) {
      console.error('Error generating bando URL:', error)
      // Fallback to ID-based URL
      return `/bandi/${concorso.id}`
    }
  }, [])

  const generateUrlWithAuth = useCallback((concorso: Concorso, user: any): string => {
    const bandoUrl = generateUrl(concorso)
    
    if (!user) {
      return `/signin?redirect=${encodeURIComponent(bandoUrl)}`
    }
    
    return bandoUrl
  }, [generateUrl])

  return {
    generateUrl,
    generateUrlWithAuth
  }
}

