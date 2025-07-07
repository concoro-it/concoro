# SEO-Friendly URLs for Concoro Blog System

This document explains the implementation of SEO-friendly URLs for the Concoro blog system.

## 🎯 Overview

The system supports both SEO-friendly URLs and fallback ID-based URLs:

- **SEO URL**: `https://concoro.it/articolo/istruttore-amministrativo-rieti-lazio-2025`
- **Fallback URL**: `https://concoro.it/articolo/e575f2d4747742f4b0d1478a5fbd9551`

## 🔧 Implementation Details

### 1. Slug Generation

The `generateSlug()` function in `src/lib/utils/slug-utils.ts` creates SEO-friendly URLs by:

- **Prioritizing relevant tags**: role keywords (istruttore, dirigente), locations (rieti, roma), regions (lazio, lombardia)
- **Adding publication year**: extracted from `publication_date`
- **Ensuring uniqueness**: prevents duplicate slugs
- **Fallback handling**: uses article title if tags are insufficient

**Example generation**:
```typescript
generateSlug({
  articolo_tags: ["istruttore amministrativo", "rieti", "lazio"],
  publication_date: new Timestamp(/* 2025 date */),
  articolo_title: "Concorso Istruttore Amministrativo"
})
// → "istruttore-amministrativo-rieti-lazio-2025"
```

### 2. Dynamic Routing

The route `/articolo/[slugOrId]/page.tsx` handles both URL formats:

1. **Slug lookup**: First attempts to find article by slug
2. **ID fallback**: If slug fails, tries document ID
3. **Smart redirect**: If accessed by ID but slug exists, redirects to slug URL (301)

```typescript
// Redirect logic
if (isDocumentId(params.slugOrId) && articleData.slug) {
  router.replace(`/articolo/${articleData.slug}`, { scroll: false })
}
```

### 3. SEO Enhancements

#### Canonical Tags
```html
<link rel="canonical" href="https://concoro.it/articolo/istruttore-amministrativo-rieti-lazio-2025" />
```

#### Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Concorso Istruttore Amministrativo",
  "url": "https://concoro.it/articolo/istruttore-amministrativo-rieti-lazio-2025"
}
```

#### Open Graph Meta Tags
```html
<meta property="og:url" content="https://concoro.it/articolo/istruttore-amministrativo-rieti-lazio-2025" />
```

## 📊 Database Schema

### Updated Articolo Type
```typescript
interface Articolo {
  id: string;
  articolo_title: string;
  articolo_tags: string[];
  publication_date: Timestamp;
  slug?: string; // NEW: SEO-friendly URL slug
  // ... other fields
}
```

## 🚀 Deployment Steps

### 1. Generate Slugs for Existing Articles
```bash
npm run generate-slugs
```

This script:
- Finds articles without slugs
- Generates unique slugs using the algorithm
- Updates Firestore documents
- Provides detailed progress logging

### 2. Update Components

All article links now use the slug-first approach:
```typescript
// Before
<Link href={`/articolo/${article.concorso_id}`}>

// After  
<Link href={`/articolo/${article.slug || article.concorso_id}`}>
```

## 🔍 Validation Functions

### URL Type Detection
```typescript
isDocumentId("e575f2d4747742f4b0d1478a5fbd9551") // true
isSlug("istruttore-amministrativo-rieti-lazio-2025") // true
```

### Slug Generation Rules

1. **Role Keywords**: istruttore, dirigente, funzionario, assistente, tecnico, etc.
2. **Location Keywords**: roma, milano, rieti, napoli, etc.
3. **Region Keywords**: lazio, lombardia, campania, etc.
4. **Length Limit**: Maximum 100 characters for optimal SEO
5. **Format**: lowercase, hyphen-separated, strict mode

## 📈 SEO Benefits

1. **Better Indexing**: Search engines prefer descriptive URLs
2. **Click-through Rates**: Users trust readable URLs
3. **Social Sharing**: Pretty URLs look better when shared
4. **Breadcrumbs**: Easier navigation and user experience
5. **Canonical URLs**: Prevents duplicate content issues

## 🛠 Maintenance

### Adding New Keywords
Update the keyword arrays in `generateSlug()`:
```typescript
const roleKeywords = ['istruttore', 'dirigente', /* new roles */];
const locationKeywords = ['roma', 'milano', /* new cities */];
```

### Monitoring Slugs
- Check for duplicate slugs periodically
- Monitor article creation to ensure slug generation
- Update slug algorithm based on SEO performance

## 🔄 Migration Strategy

1. **Gradual Rollout**: New articles automatically get slugs
2. **Backward Compatibility**: ID-based URLs still work
3. **Automatic Redirects**: ID access redirects to slug URL
4. **Sitemap Updates**: Only include slug-based URLs in sitemap.xml

## 🚨 Important Notes

- **Never remove** the ID fallback - essential for existing bookmarks
- **Monitor** redirect chains to avoid SEO penalties  
- **Test** all article links after deployment
- **Update** sitemaps to include only slug-based URLs
- **Consider** 301 redirects in production for better SEO signals

## 📝 Future Enhancements

1. **Custom Slugs**: Allow manual slug editing in admin interface
2. **Slug History**: Track slug changes for better redirect management
3. **Analytics**: Monitor which URL format performs better
4. **A/B Testing**: Test different slug generation strategies 