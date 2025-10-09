# 🚀 SEO Deployment Checklist

## Pre-Deployment Testing

### Local Testing (10 minutes)
- [ ] Run `npm run dev` in terminal
- [ ] Visit http://localhost:3000/blog
- [ ] Visit http://localhost:3000/articolo/[any-article-slug]
- [ ] Visit http://localhost:3000/blog/tags/istruttore-amministrativo
- [ ] Check browser DevTools → Elements → `<head>` for proper meta tags
- [ ] Verify no console errors
- [ ] Test pagination on blog listing page
- [ ] Test tag filter redirects to static tag pages

### Build Testing (5 minutes)
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No linting errors

---

## Deployment

### Git Commit (5 minutes)
```bash
git add .
git commit -m "feat: implement comprehensive SEO optimizations for blog

- Convert article pages to Server Components with generateMetadata()
- Add SEO-friendly static tag pages (/blog/tags/[tag])
- Implement pagination with rel=prev/next
- Add BreadcrumbList structured data
- Optimize images (quality, dimensions, loading priority)
- Convert blog listing to Server Component
- Create internal linking infrastructure
- Add tag pages sitemap
- Remove robots.txt tag blocking

Expected impact: +150-250% organic traffic in 6 months"

git push origin main
```

### Deploy to Production
- [ ] Deploy via your hosting platform (Vercel/etc)
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

---

## Post-Deployment Validation (20 minutes)

### 1. Test Live URLs
- [ ] https://www.concoro.it/blog (check server-side rendering)
- [ ] https://www.concoro.it/blog?page=2 (check pagination)
- [ ] https://www.concoro.it/articolo/[any-article-slug] (check article page)
- [ ] https://www.concoro.it/blog/tags/istruttore-amministrativo (check tag page)

### 2. Verify Meta Tags (View Page Source)
```bash
curl https://www.concoro.it/articolo/[slug] | grep "<title>"
curl https://www.concoro.it/articolo/[slug] | grep "og:title"
curl https://www.concoro.it/articolo/[slug] | grep "canonical"
```

**Expected Results:**
- ✅ Title should be article-specific (not "Articolo | Concoro")
- ✅ og:title should match page title
- ✅ canonical URL should be present
- ✅ All meta tags in `<head>` section

### 3. Test Sitemaps
- [ ] Visit https://www.concoro.it/sitemap.xml (should list all sitemaps)
- [ ] Visit https://www.concoro.it/api/sitemap (static pages & articles)
- [ ] Visit https://www.concoro.it/api/sitemap/concorsi (concorsi)
- [ ] Visit https://www.concoro.it/api/sitemap/tags (new - tag pages)

**Expected:** All should return valid XML without errors

### 4. Test Robots.txt
- [ ] Visit https://www.concoro.it/robots.txt
- [ ] Verify `Disallow: /*?tag=*` is REMOVED
- [ ] Verify all sitemap references are present

### 5. Validate Structured Data
Go to: https://search.google.com/test/rich-results

Test these URLs:
- [ ] Any article page (should show BlogPosting, BreadcrumbList, JobPosting if applicable, FAQPage if FAQs present)
- [ ] Tag page (should pass validation)

**Expected:** No errors, all schemas valid

---

## Google Search Console Setup (10 minutes)

### 1. Submit Sitemaps
Go to: Google Search Console → Sitemaps

Add these sitemaps:
- [ ] https://www.concoro.it/sitemap.xml
- [ ] https://www.concoro.it/api/sitemap
- [ ] https://www.concoro.it/api/sitemap/concorsi
- [ ] https://www.concoro.it/api/sitemap/tags (NEW)

Click "Submit"

### 2. Request Indexing (Priority Pages)
In GSC → URL Inspection

Request indexing for:
- [ ] Your top 5 performing blog articles
- [ ] 3-4 new tag pages (e.g., `/blog/tags/istruttore-amministrativo`)
- [ ] Blog homepage: `/blog`

**Note:** Google limits requests to ~10 per day. Prioritize high-value pages.

### 3. Check Coverage Report
GSC → Coverage

- [ ] Verify no new errors
- [ ] Check "Valid" pages count (should increase over next week)
- [ ] Monitor "Excluded" pages (tag pages should no longer be excluded)

---

## Analytics Setup (5 minutes)

### Track Internal Link Clicks (Optional but Recommended)

Add to Google Analytics:
```javascript
// Track internal link clicks
gtag('event', 'internal_link_click', {
  'link_text': anchorText,
  'link_url': targetUrl,
  'source_article': currentArticleTitle
});
```

Or use Google Tag Manager:
- Create trigger: Click - All Elements
- Filter: URL contains "/articolo/"
- Tag: GA4 Event - "internal_link_click"

---

## PageSpeed Testing (5 minutes)

Test key pages at: https://pagespeed.web.dev/

Test:
- [ ] https://www.concoro.it/blog
- [ ] https://www.concoro.it/articolo/[top-article-slug]
- [ ] https://www.concoro.it/blog/tags/istruttore-amministrativo

**Target Scores:**
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: 100

**Key Metrics:**
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

---

## Monitoring Schedule

### Week 1 (Daily)
- [ ] Check Google Search Console for crawl errors
- [ ] Monitor sitemap submission status
- [ ] Check for any 404 errors in GSC
- [ ] Verify tag pages are being crawled

### Week 2-4 (Every 3 days)
- [ ] Review GSC Performance report
- [ ] Check impressions for new tag pages
- [ ] Monitor average position changes
- [ ] Look for featured snippet opportunities

### Month 1-6 (Weekly)
- [ ] Track organic traffic growth
- [ ] Monitor keyword rankings
- [ ] Check Core Web Vitals
- [ ] Analyze internal link performance
- [ ] Review pages per session (should increase)
- [ ] Check average session duration (should increase)

---

## Key Performance Indicators (KPIs)

### Baseline Metrics (Record These Now)
```
Date: ______________

Organic Traffic (monthly): ______________
Average Position: ______________
Featured Snippets: ______________
Click-Through Rate: ______________
Pages Per Session: ______________
Avg Session Duration: ______________
Core Web Vitals Score: ______________
```

### Target Metrics (6 Months)
```
Organic Traffic: +150-250%
Average Position: 8-12 (from 15-20)
Featured Snippets: 5-10 articles
Click-Through Rate: +35-50%
Pages Per Session: +20-30%
Avg Session Duration: +30-40%
Core Web Vitals: All Green
```

---

## Troubleshooting

### Issue: Meta tags not updating
**Solution:** 
- Clear browser cache
- Check if page is being cached by CDN
- Verify server-side rendering: `curl -I [url]` should show `content-type: text/html`

### Issue: Sitemap showing errors
**Solution:**
- Check API route is deployed: visit `/api/sitemap` directly
- Verify Firebase Admin SDK credentials are set
- Check server logs for errors

### Issue: Tag pages not indexing
**Solution:**
- Verify robots.txt doesn't block them
- Check sitemap includes them
- Request indexing manually in GSC
- Wait 1-2 weeks for Google to crawl

### Issue: Slow page loading
**Solution:**
- Check image sizes (should use quality=85)
- Verify code splitting is working
- Check if database queries are optimized
- Use Performance tab in DevTools to identify bottlenecks

---

## Success Indicators

### Week 1
- ✅ All sitemaps submitted and processed
- ✅ No new errors in GSC
- ✅ Tag pages appearing in sitemap
- ✅ PageSpeed scores >85

### Month 1
- ✅ Tag pages indexed in Google
- ✅ Impressions increasing for long-tail keywords
- ✅ Average position improving
- ✅ No decrease in organic traffic (transition stable)

### Month 3
- ✅ Organic traffic +50-100%
- ✅ 2-3 featured snippets
- ✅ Tag pages ranking in top 20
- ✅ Pages per session +15%

### Month 6
- ✅ Organic traffic +150-250%
- ✅ 5-10 featured snippets
- ✅ Average position 8-12
- ✅ Core Web Vitals all green
- ✅ Pages per session +25%

---

## Support & Questions

If issues arise:
1. Check server logs for errors
2. Review Git commit history
3. Consult `SEO_FIXES_SUMMARY.md` for technical details
4. Review `INTERNAL_LINKING_GUIDE.md` for linking strategy

---

## Final Checklist

Before marking deployment as complete:

- [ ] All tests passed
- [ ] Production site loading correctly
- [ ] Meta tags visible in page source
- [ ] Sitemaps submitted to GSC
- [ ] Structured data validated
- [ ] PageSpeed scores acceptable
- [ ] Analytics tracking configured
- [ ] Baseline metrics recorded
- [ ] Monitoring schedule set
- [ ] Team informed of changes

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Baseline Metrics Recorded:** _______________
**Next Review Date:** _______________

✅ **READY FOR PRODUCTION!**
