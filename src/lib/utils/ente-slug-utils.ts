/**
 * Generate a URL-friendly slug from an Ente name
 * Now returns the exact ente name for direct field matching
 */
export function generateEnteSlug(ente: string | undefined | null): string {
  if (!ente) return '';
  
  // Return the exact ente name, just URL-encoded
  return encodeURIComponent(ente);
}

/**
 * Convert a slug back to a readable Ente name format
 * Now simply decodes the exact ente name
 */
export function slugToEnteName(slug: string): string {
  if (!slug) return '';
  
  // Simply decode the URL-encoded ente name
  return decodeURIComponent(slug);
}

/**
 * Get the full URL path for an Ente page
 * Now uses exact ente field values
 */
export function getEnteUrl(ente: string | undefined | null): string {
  if (!ente) return '/bandi';
  return `/bandi/ente/${encodeURIComponent(ente)}`;
}