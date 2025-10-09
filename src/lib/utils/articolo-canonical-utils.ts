import { Articolo } from '@/types'
import { generateArticoloSlug, generateSEOArticoloUrl } from './articolo-urls'

/**
 * Canonicalization utilities for articolo pages
 * Ensures consistent URL generation and canonical signals
 */

/**
 * Gets the canonical URL for an articolo
 * Uses SEO-friendly multi-segment URL structure: /articolo/[category]/[title]/[year]/[id]
 */
export function getArticoloCanonicalUrl(article: Articolo): string {
  const baseUrl = 'https://www.concoro.it'
  const seoUrl = generateSEOArticoloUrl(article)
  return `${baseUrl}${seoUrl}`
}

/**
 * Gets the canonical path (without domain) for an articolo
 * Uses SEO-friendly multi-segment URL structure
 */
export function getArticoloCanonicalPath(article: Articolo): string {
  return generateSEOArticoloUrl(article)
}

/**
 * Checks if the current URL parameter matches the canonical form
 * Used to determine if a redirect is needed
 */
export function isCanonicalUrl(urlParam: string, article: Articolo): boolean {
  const canonicalSlug = generateArticoloSlug(article)
  return urlParam === canonicalSlug
}

/**
 * Gets the canonical URL parameter for internal linking
 * This ensures all internal links use the canonical SEO-friendly form
 */
export function getCanonicalUrlParam(article: Articolo): string {
  return generateArticoloSlug(article)
}

/**
 * Validates that an article has proper canonical data
 * Returns validation errors if any
 */
export function validateArticoloCanonical(article: Articolo): string[] {
  const errors: string[] = []
  
  if (!article.id) {
    errors.push('Article missing ID')
  }
  
  if (!article.slug) {
    errors.push('Article missing slug - should generate one')
  }
  
  if (article.slug && article.slug === article.id) {
    errors.push('Article slug is the same as ID - potential canonicalization issue')
  }
  
  return errors
}

/**
 * Checks if a URL parameter is a document ID vs a slug
 * Used for redirect logic
 */
export function shouldRedirectToCanonical(urlParam: string, article: Articolo): boolean {
  // If article has a slug and we're accessing by ID, redirect
  if (article.slug && urlParam === article.id) {
    return true
  }
  
  // If we're accessing by a different slug than the canonical one, redirect
  if (article.slug && urlParam !== article.slug && urlParam !== article.id) {
    return true
  }
  
  return false
}

