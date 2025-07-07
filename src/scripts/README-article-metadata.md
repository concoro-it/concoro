# Article Metadata Update Script

This script updates existing blog articles with categorization metadata from their associated concorso records.

## Purpose

The script populates the following fields in article documents:
- `categoria` - Competition category 
- `settore_professionale` - Professional sector
- `AreaGeografica` - Geographic area

This metadata is used for:
- Breadcrumb navigation
- Related articles suggestions
- Better categorization and SEO

## How it works

1. Fetches all articles from the `/articoli` collection
2. For each article missing metadata, looks up the associated concorso
3. Copies relevant metadata fields from the concorso to the article
4. Updates articles in batches for efficiency

## Usage

### Run directly with Node.js
```bash
# Run from project root (recommended)
npx tsx src/scripts/updateArticleMetadata.ts

# Alternative: from scripts directory
cd src/scripts
npx tsx updateArticleMetadata.ts
```

### Import in another script
```typescript
import { updateArticleMetadata } from './updateArticleMetadata';

await updateArticleMetadata();
```

## Safety Features

- ✅ **Skip existing**: Won't overwrite existing metadata
- ✅ **Batch processing**: Uses Firestore batch writes for efficiency  
- ✅ **Error handling**: Continues processing even if individual articles fail
- ✅ **Detailed logging**: Shows progress and any issues

## Example Output

```
🔄 Starting article metadata update...
📝 Found 150 articles to process
⏭️  Skipping abc123 - metadata already exists
✅ Queued update for def456: { categoria: 'Amministrativo', AreaGeografica: 'Lazio' }
📦 Executing 1 batches...
✅ Batch 1/1 committed
🎉 Article metadata update completed successfully!
```

## Related Components

- **Article Types**: Updated in `src/types/articolo.ts`
- **Blog Services**: New functions in `src/lib/blog/services.ts`
- **Article Page**: Enhanced with breadcrumbs and related articles in `src/app/articolo/[slugOrId]/page.tsx`
- **Breadcrumb Component**: New component at `src/components/ui/breadcrumb.tsx`
- **Related Articles**: New component at `src/components/blog/RelatedArticlesSection.tsx` 