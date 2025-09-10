# Sitemap Automation Guide

This document explains how to automate sitemap generation for Concoro with the new SEO-friendly URLs.

## 🎯 Overview

Concoro now has **both dynamic and static sitemap generation** with full automation capabilities:

- **Dynamic Sitemap**: `/api/sitemap` - Generated on-demand with cache
- **Static Sitemap**: `/sitemap-static.xml` - Pre-generated file
- **SEO-Friendly URLs**: All bando URLs now use the format `/bandi/[ente]/[provincia]/[titolo]/[data]`

## 🔄 Automation Options

### 1. GitHub Actions (Recommended)

**File**: `.github/workflows/update-sitemap.yml`

**Features**:
- Runs every 6 hours automatically
- Triggers on code changes
- Manual trigger available
- Commits updated sitemap to repository
- Pings search engines automatically

**Setup**:
1. Ensure all Firebase environment variables are set in GitHub Secrets
2. The workflow will run automatically
3. Manual trigger: Go to Actions tab → "Update Sitemap" → "Run workflow"

### 2. Server Cron Jobs

**File**: `scripts/cron-sitemap.sh`

**Setup**:
```bash
# 1. Make script executable
chmod +x scripts/cron-sitemap.sh

# 2. Edit the script and update PROJECT_DIR path
nano scripts/cron-sitemap.sh

# 3. Add to crontab (runs every 6 hours)
crontab -e

# Add this line:
0 */6 * * * /path/to/your/concoro/scripts/cron-sitemap.sh

# 4. Check cron logs
tail -f /path/to/your/concoro/logs/sitemap-cron.log
```

### 3. Webhook Automation

**Endpoint**: `POST /api/webhook/sitemap`

**Features**:
- Trigger sitemap regeneration via HTTP POST
- Optional authentication with bearer token
- Automatic search engine pinging
- Can be called from external services

**Setup**:
```bash
# 1. Set webhook token in environment
SITEMAP_WEBHOOK_TOKEN=your_secure_token_here

# 2. Call the webhook
curl -X POST \
  -H "Authorization: Bearer your_secure_token_here" \
  https://www.concoro.it/api/webhook/sitemap
```

**Example integrations**:
- Firestore triggers (when new bando is added)
- CI/CD pipelines
- Content management systems
- Scheduled cloud functions

### 4. Manual Generation

```bash
# Generate static sitemap locally
npm run generate-sitemap

# Or using the Node.js script directly
npx ts-node scripts/generate-sitemap.ts
```

## 📊 Sitemap Features

### Current Implementation

✅ **SEO-Friendly URLs**: All bando URLs use the new format  
✅ **Fallback Support**: Falls back to ID-based URLs if slug generation fails  
✅ **Proper Timestamps**: Uses actual creation/update dates  
✅ **Cache Control**: Dynamic sitemap has 1-hour cache  
✅ **Error Handling**: Graceful fallback to minimal sitemap on errors  
✅ **Search Engine Pinging**: Automatic notification to Google/Bing  

### URL Examples in Sitemap

```xml
<!-- Old format (fallback only) -->
<url>
  <loc>https://www.concoro.it/bandi/abc123def456</loc>
  <lastmod>2025-01-01T12:00:00.000Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>

<!-- New SEO-friendly format -->
<url>
  <loc>https://www.concoro.it/bandi/comune-di-roma/lazio/istruttore-amministrativo/2025-01-15</loc>
  <lastmod>2025-01-01T12:00:00.000Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>
```

## 🔧 Configuration

### Environment Variables

```bash
# Required for sitemap generation
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_service_account_key

# Optional for webhook security
SITEMAP_WEBHOOK_TOKEN=your_secure_token

# Firebase Web Config (for client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### NPM Scripts

```json
{
  "scripts": {
    "generate-sitemap": "ts-node scripts/generate-sitemap.ts",
    "sitemap:test": "curl https://www.concoro.it/api/sitemap",
    "sitemap:webhook": "curl -X POST https://www.concoro.it/api/webhook/sitemap"
  }
}
```

## 🚀 Deployment Integration

### Vercel/Netlify

Add to your build commands:
```bash
# After build, generate static sitemap
npm run build && npm run generate-sitemap
```

### Docker

The sitemap generation is already included in the Docker build process.

### Traditional Servers

Set up the cron job for automatic updates:
```bash
# Run every 6 hours
0 */6 * * * /path/to/concoro/scripts/cron-sitemap.sh >> /var/log/sitemap-cron.log 2>&1
```

## 📈 Monitoring

### Check Sitemap Health

```bash
# Test dynamic sitemap
curl -I https://www.concoro.it/api/sitemap

# Test static sitemap
curl -I https://www.concoro.it/sitemap-static.xml

# Check webhook endpoint
curl https://www.concoro.it/api/webhook/sitemap
```

### Google Search Console

1. Add both sitemap URLs:
   - `https://www.concoro.it/api/sitemap`
   - `https://www.concoro.it/sitemap-static.xml`

2. Monitor indexing status
3. Check for crawl errors

### Logs

- **GitHub Actions**: Check Actions tab for workflow logs
- **Cron Jobs**: Check `/path/to/project/logs/sitemap-cron.log`
- **Application**: Check Next.js logs for sitemap generation

## 🔍 Troubleshooting

### Common Issues

1. **Empty Sitemap**: Check Firebase credentials and database access
2. **Old URLs**: Ensure `getBandoUrl` import is working
3. **Build Errors**: Check TypeScript compilation
4. **Cron Not Running**: Verify cron service and permissions

### Debug Commands

```bash
# Test sitemap generation locally
npm run generate-sitemap

# Check generated file
cat public/sitemap-static.xml | head -20

# Test database connection
npm run dev
# Then visit http://localhost:3000/api/sitemap
```

## 📚 Additional Resources

- [Google Sitemap Guidelines](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Next.js Sitemap Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)

---

**Last Updated**: January 2025  
**SEO URL Format**: `/bandi/[ente]/[provincia]/[titolo]/[data]`  
**Cache Duration**: 1 hour (dynamic), Daily rebuild (static)

