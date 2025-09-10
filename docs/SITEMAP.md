# Sitemap Implementation Guide

This document explains the comprehensive sitemap implementation for the Concoro platform.

## Overview

The sitemap is automatically generated and includes:
- **Static pages**: Homepage, blog, bandi, chi-siamo, faq, contatti, privacy, terms, auth pages
- **Dynamic routes**: 
  - `/articolo/[slug]` → One entry per published blog article (slug-based URLs only)
  - `/bandi/[id]` → One entry per active concorso
- **Excludes**: Dashboard, profile, admin, and other private pages

## Implementation

### 1. Dynamic API Route (`/api/sitemap`)

**Location**: `src/app/api/sitemap/route.ts`

The main sitemap is generated server-side using:
- **Articles**: Fetched via `getAllArticoliServer()` from `src/lib/blog/services-server.ts`
- **Concorsi**: Fetched via `getAllActiveConcorsiServer()` from `src/lib/concorsi/services-server.ts`

**Features**:
- Real-time data from Firestore using Firebase Admin SDK
- Proper XML structure with `loc`, `lastmod`, `changefreq`, `priority`
- HTTPS URLs with www subdomain
- Error handling with fallback minimal sitemap
- Caching headers for performance

### 2. Static Sitemap Redirect

**Location**: `public/sitemap.xml`

This is a sitemap index file that redirects to the dynamic API endpoint:
```xml
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.concoro.it/api/sitemap</loc>
    <lastmod>2024-12-19T12:00:00.000Z</lastmod>
  </sitemap>
</sitemapindex>
```

### 3. Robots.txt Configuration

**Location**: `public/robots.txt`

Points to the sitemap:
```
Sitemap: https://www.concoro.it/sitemap.xml
```

## Data Sources

### Articles (Blog Posts)
- **Collection**: `articoli`
- **Filter**: Only articles with slugs and proper titles
- **URL Format**: `/articolo/{slug}` (SEO-friendly)
- **Priority**: 0.7
- **Change Frequency**: weekly

### Concorsi (Job Postings)
- **Collection**: `concorsi` 
- **Filter**: Only active/open concorsi (`Stato` = 'open', 'aperto', 'aperti', or null)
- **URL Format**: `/bandi/{id}`
- **Priority**: 0.7  
- **Change Frequency**: weekly

### Static Pages
- **Homepage** (`/`): Priority 1.0, daily updates
- **Main sections** (`/blog`, `/bandi`): Priority 0.8, daily updates
- **Info pages** (`/chi-siamo`, `/prezzi`): Priority 0.6-0.7, weekly/monthly updates
- **Legal pages** (`/privacy-policy`, `/termini-di-servizio`): Priority 0.3, yearly updates
- **Auth pages** (`/signin`, `/signup`): Priority 0.4, monthly updates

## Scripts and Tools

### 1. Test Sitemap
```bash
npm run test-sitemap
```
**File**: `scripts/test-sitemap.js`
- Tests the API endpoint locally
- Validates XML structure
- Counts URLs and checks for required pages
- Shows sample dynamic URLs

### 2. Generate Static Sitemap
```bash
npm run generate-sitemap
```
**File**: `scripts/generate-sitemap.ts`
- Generates a static `sitemap-static.xml` file
- Useful for cron jobs or backup scenarios
- Uses the same data sources as the API route

## URL Structure

### Canonical URLs
- **Base URL**: `https://www.concoro.it`
- **No trailing slashes**: All URLs end without `/`
- **HTTPS only**: All URLs use secure protocol
- **www subdomain**: Consistent with main site

### Examples
```
https://www.concoro.it/
https://www.concoro.it/blog
https://www.concoro.it/bandi
https://www.concoro.it/articolo/guida-concorsi-pubblici
https://www.concoro.it/bandi/abc123def456
```

## Automation Options

### Option 1: Server-Side (Current)
- ✅ **Automatic updates**: Every request fetches fresh data
- ✅ **Real-time**: Always current with database
- ✅ **No maintenance**: Zero manual intervention
- ⚠️ **Performance**: Slight latency on first request (cached after)

### Option 2: Cron Job (Available)
```bash
# Add to crontab for daily regeneration
0 2 * * * cd /path/to/project && npm run generate-sitemap
```
- ✅ **Performance**: Static file serving
- ✅ **Reliability**: Works even if API fails
- ⚠️ **Maintenance**: Requires cron setup
- ⚠️ **Freshness**: Only as current as last run

### Option 3: Build-Time Generation
Add to `next.config.js` or build scripts:
```javascript
// Generate sitemap during build
await generateSitemap();
```

## SEO Compliance

### XML Standards
- ✅ Proper XML declaration and encoding
- ✅ Standard sitemap namespace
- ✅ Required elements: `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>`
- ✅ Escaped special characters in URLs

### Search Engine Guidelines
- ✅ **URL limit**: Well under 50,000 URL limit
- ✅ **File size**: Well under 50MB limit  
- ✅ **Update frequency**: Reflects actual content change patterns
- ✅ **Priority values**: Logical hierarchy (1.0 for homepage, 0.8 for main sections, etc.)

### Content Filtering
- ✅ **Published only**: Only includes published articles with proper titles
- ✅ **Active only**: Only includes open/active concorsi
- ✅ **SEO URLs**: Uses slug-based URLs for articles
- ✅ **Public pages**: Excludes private/dashboard pages

## Monitoring and Maintenance

### Google Search Console
1. Submit sitemap: `https://www.concoro.it/sitemap.xml`
2. Monitor indexing status
3. Check for errors or warnings

### Regular Checks
- **Weekly**: Verify sitemap accessibility
- **Monthly**: Check URL count and sample URLs
- **Quarterly**: Review priority and change frequency settings

### Troubleshooting

#### Common Issues
1. **Empty sitemap**: Check Firebase connection and data
2. **Missing URLs**: Verify article slugs and concorso status
3. **XML errors**: Validate XML structure and encoding
4. **404 errors**: Ensure all included URLs are accessible

#### Debug Commands
```bash
# Test API endpoint
curl https://www.concoro.it/api/sitemap

# Test locally
npm run dev
npm run test-sitemap

# Generate static version
npm run generate-sitemap
```

## Performance Considerations

### Caching Strategy
- **API Route**: 1 hour browser cache, 24 hour CDN cache
- **Error Fallback**: 5 minute cache for error responses
- **Static File**: Standard browser caching

### Database Optimization
- **Indexes**: Ensure proper indexes on `publication_date`, `slug`, `Stato` fields
- **Limits**: Consider pagination for very large datasets (>10,000 items)
- **Monitoring**: Track query performance and costs

## Future Enhancements

### Potential Improvements
1. **Sitemap Index**: Split into multiple sitemaps for different content types
2. **Image Sitemaps**: Include article images and thumbnails  
3. **News Sitemaps**: Special handling for recent articles
4. **Hreflang**: Multi-language support if internationalization is added
5. **Compression**: Gzip compression for large sitemaps

### Monitoring Integration
1. **Analytics**: Track sitemap requests and indexing
2. **Alerts**: Notify on sitemap generation failures
3. **Metrics**: Monitor URL count trends and performance
