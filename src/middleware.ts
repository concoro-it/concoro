import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isFirebaseDocumentId } from './lib/utils/concorso-urls';

// Add paths that don't require authentication
const publicPaths = ['/signin', '/signup', '/reset-password', '/verify-email', '/basic-info'];

// Function to check if a string is a document ID (20+ character alphanumeric)
function isDocumentId(value: string): boolean {
  return /^[a-zA-Z0-9]{20,}$/.test(value);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // SEO: Handle ID-based article URL redirects at server level for proper 301 redirects
  const articleMatch = pathname.match(/^\/articolo\/([^\/]+)$/);
  if (articleMatch) {
    const slugOrId = articleMatch[1];
    
    // If it's a document ID, we should ideally redirect to slug
    // However, we need the slug from the database, so we'll let the client handle this
    // and rely on the meta robots noindex,follow tags we added
    if (isDocumentId(slugOrId)) {
      // Add a header to indicate this is an ID-based URL for tracking
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      response.headers.set('x-article-access-type', 'id-based');
      return response;
    } else {
      // Slug-based URL - normal processing
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      response.headers.set('x-article-access-type', 'slug-based');
      return response;
    }
  }

  // Handle old bando URLs with query parameters and redirect to new format
  if (pathname === '/bandi' && request.nextUrl.searchParams.has('id')) {
    const id = request.nextUrl.searchParams.get('id');
    if (id && isFirebaseDocumentId(id)) {
      // Redirect old query-based URLs to the new [id] route
      return NextResponse.redirect(new URL(`/bandi/${id}`, request.url));
    }
  }

  // Handle mobile pagination URLs - redirect to main page with query params
  const mobilePageMatch = pathname.match(/^\/bandi\/page\/(\d+)\/([a-f0-9]{32})$/);
  
  if (mobilePageMatch) {
    const id = mobilePageMatch[2];
    // Mobile pagination URL - redirect to main page with query params
    const page = mobilePageMatch[1];
    return NextResponse.redirect(new URL(`/bandi?page=${page}&id=${id}`, request.url));
  }

  // Handle SEO-friendly slug URLs - let them pass through to [...slug] route
  const bandoSlugMatch = pathname.match(/^\/bandi\/(.+)$/);
  if (bandoSlugMatch) {
    const slugPath = bandoSlugMatch[1];
    
    // Skip if it's a single segment that looks like an ID (handled above)
    if (!slugPath.includes('/') && isFirebaseDocumentId(slugPath)) {
      return NextResponse.next();
    }
    
    // SEO-friendly slug - let it pass through
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    response.headers.set('x-bando-access-type', 'slug-based');
    return response;
  }
  
  // Handle expired concorsi - set x-concorso-status header for the page to check
  const concorsoMatch = pathname.match(/^\/concorsi\/([^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\/[a-zA-Z0-9]{20,})$/);
  if (concorsoMatch) {
    // Add header to track that this is a concorso page
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    response.headers.set('x-route-type', 'concorso');
    return response;
  }
  
  // Create a new response object
  const response = NextResponse.next();
  
  // Set the x-pathname header with the current path
  response.headers.set('x-pathname', pathname);

  // Allow access to public paths without any checks
  if (publicPaths.includes(pathname)) {
    return response;
  }

  // For all other routes, return the response with the pathname header
  return response;
}

// Configure which paths need the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 