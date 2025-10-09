# 🔗 Internal Linking Guide for SEO

## Overview
Internal linking is crucial for SEO. It helps:
- **Distribute link equity** across your site
- **Improve crawlability** for search engines
- **Increase time on site** (users explore related content)
- **Signal topic relationships** to Google
- **Boost rankings** for target keywords

---

## 🛠️ Infrastructure Created

### 1. **Utility Functions** (`src/lib/utils/internal-linking-utils.ts`)
- `calculateArticleRelevance()` - Scores how related two articles are
- `suggestInternalLinks()` - Finds top N most relevant articles
- `extractLinkableKeywords()` - Identifies keywords that should be linked
- `generateLinkRecommendations()` - Suggests specific links to add
- `formatInternalLinkHTML/Markdown()` - Formats links for content

### 2. **React Components** (`src/components/blog/RelatedContentBox.tsx`)
- `<RelatedContentBox />` - Beautiful callout box for related articles
- `<InlineLink />` - Styled inline link component

---

## 📝 How to Use in Articles

### Method 1: Automatic Related Articles (Already Implemented)
The `RelatedArticlesSection` component at the bottom of each article automatically shows related content based on:
- Shared tags
- Same category
- Same professional sector
- Same geographic area

**No action needed** - this is already working!

---

### Method 2: Manual Contextual Links in Article Body

#### Option A: Using RelatedContentBox Component

Add this to your article content where it makes sense:

```typescript
// In article editor or CMS
{
  "articolo_body": "Your article text here...\n\n<RelatedContentBox items={[\n  {id: 'article-1', title: 'Concorso Istruttore Amministrativo 2025', url: '/articolo/concorso-istruttore-2025'},\n  {id: 'article-2', title: 'Come Prepararsi ai Concorsi', url: '/articolo/preparazione-concorsi'}\n]} />\n\nMore article text..."
}
```

**Display:**
```
┌─────────────────────────────────────────┐
│ 📚 Potrebbero interessarti anche       │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Concorso Istruttore Amministrativo│→ │
│ └───────────────────────────────────┘  │
│ ┌───────────────────────────────────┐  │
│ │ Come Prepararsi ai Concorsi       │→ │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### Option B: Using Inline Links in Text

Add natural links within your article text:

```markdown
Per maggiori informazioni sui <InlineLink href="/articolo/concorsi-istruttore">concorsi per istruttore</InlineLink>, consulta la nostra guida completa.
```

Or in HTML:
```html
Per maggiori informazioni sui <a href="/articolo/concorsi-istruttore" class="text-blue-600 hover:underline">concorsi per istruttore</a>, consulta la nostra guida completa.
```

---

## 🤖 Using the Link Recommendation System

### Server-Side (Recommended for Content Editors)

```typescript
import { generateLinkRecommendations } from '@/lib/utils/internal-linking-utils'

// Get recommendations for an article
const recommendations = generateLinkRecommendations(
  currentArticle,
  allOtherArticles
)

// Output:
// [
//   {
//     targetArticle: {...},
//     suggestedAnchor: "Istruttore Amministrativo",
//     relevanceScore: 25,
//     reason: "Condivide tag rilevanti"
//   },
//   ...
// ]
```

### Client-Side (For Editorial Dashboard)

```typescript
"use client"
import { suggestInternalLinks } from '@/lib/utils/internal-linking-utils'

function ArticleEditor({ article, allArticles }) {
  const suggestions = suggestInternalLinks(article, allArticles, 5)
  
  return (
    <div>
      <h3>Suggested Internal Links:</h3>
      <ul>
        {suggestions.map(s => (
          <li key={s.id}>
            Link to: {s.title} (Score: {s.relevanceScore})
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 📊 Best Practices for Internal Linking

### 1. **Link Placement**
- ✅ **Early in content** (first 2 paragraphs) - higher value
- ✅ **Contextually relevant** - only link when it adds value
- ✅ **3-5 links per article** - optimal for SEO
- ❌ Don't link to the same article multiple times
- ❌ Don't force links that don't make sense

### 2. **Anchor Text**
- ✅ Use descriptive phrases: "concorso istruttore amministrativo"
- ✅ Include target keywords naturally
- ✅ Vary anchor text (don't always use exact match)
- ❌ Avoid generic "click here" or "leggi di più"
- ❌ Don't over-optimize with exact match every time

### 3. **Link Diversity**
- Link to **older articles** (boost their rankings)
- Link to **pillar content** (main topic hubs)
- Link to **related but different** topics (broaden relevance)

---

## 🎯 Content Strategy: Topic Clusters

### What is a Topic Cluster?

```
Pillar Page: "Guida Completa ai Concorsi Pubblici"
     ↓
     ├─→ Subtopic: "Concorsi Istruttore Amministrativo"
     │        ↓
     │        ├─→ "Concorso Istruttore Milano 2025"
     │        └─→ "Come Prepararsi: Istruttore Amministrativo"
     │
     ├─→ Subtopic: "Concorsi Funzionario"
     │        ↓
     │        └─→ "Concorso Funzionario Roma 2025"
     │
     └─→ Subtopic: "Test e Prove d'Esame"
              ↓
              └─→ "Esempi di Test Logica Concorsi"
```

### How to Implement

1. **Identify Pillar Topics**
   - Main topics: "Concorsi Istruttore", "Preparazione Esami", etc.
   
2. **Create Pillar Content Pages**
   - Comprehensive guides (2000+ words)
   - Link to all subtopic articles
   
3. **Link Subtopics Back to Pillar**
   - Every article links to its pillar page
   - Subtopics also link to related subtopics

4. **Update Regularly**
   - Add new articles to the cluster
   - Update pillar page with new links

---

## 🔧 Adding Links to Existing Articles

### Manual Method (Immediate)

1. Open article in CMS/editor
2. Find relevant keyword phrase
3. Add link: `<InlineLink href="/articolo/[slug]">keyword</InlineLink>`
4. Save and publish

### Automated Method (Future Enhancement)

Create a script to add links programmatically:

```typescript
// scripts/add-internal-links.ts
import { getAllArticoliServer } from '@/lib/blog/services-server'
import { generateLinkRecommendations } from '@/lib/utils/internal-linking-utils'

async function addInternalLinks() {
  const articles = await getAllArticoliServer()
  
  for (const article of articles) {
    const recommendations = generateLinkRecommendations(article, articles)
    
    // Update article body with new links
    // This would require a function to intelligently insert links
    // without breaking existing formatting
  }
}
```

---

## 📈 Measuring Success

### Key Metrics to Track

1. **Internal Links Per Article**
   - Target: 3-5 contextual links
   - Track in Google Analytics

2. **Click-Through Rate on Internal Links**
   - Track with event tags
   - Measure which articles get most clicks

3. **Time on Site / Session Duration**
   - Should increase with better internal linking
   - Check Google Analytics

4. **Pages Per Session**
   - Target: +20-30% increase
   - Users should explore more content

5. **Crawl Depth**
   - Check Google Search Console
   - All articles should be crawled regularly

---

## 🚀 Quick Start Checklist

- [ ] Review top 10 performing articles
- [ ] Identify 3-5 related articles for each
- [ ] Add contextual links using `<InlineLink>`
- [ ] Add `<RelatedContentBox>` in middle of content
- [ ] Update once per month with new articles
- [ ] Track metrics in Google Analytics
- [ ] Create 2-3 pillar pages for main topics
- [ ] Link all related articles to pillar pages

---

## 💡 Examples of Good Internal Linking

### Example 1: Geographic Linking

**Article:** "Concorso Istruttore Roma 2025"

**Internal Links to Add:**
1. Link "istruttore amministrativo" → `/articolo/guida-istruttore-amministrativo`
2. Link "concorsi a Roma" → `/blog/tags/roma`
3. Link "come prepararsi" → `/articolo/preparazione-concorsi-pubblici`

**Placement:**
```markdown
Il **concorso per [istruttore amministrativo](/articolo/guida-istruttore-amministrativo)** 
presso il Comune di Roma rappresenta un'ottima opportunità per chi cerca lavoro nella 
pubblica amministrazione. Per conoscere altri [concorsi a Roma](/blog/tags/roma), 
consulta la nostra sezione dedicata.

<RelatedContentBox items={[...]} title="Altri concorsi nella tua zona" />

Vediamo ora [come prepararsi](/articolo/preparazione-concorsi-pubblici) al meglio...
```

### Example 2: Topic Cluster Linking

**Pillar Article:** "Guida Completa: Concorsi per Istruttore Amministrativo"

**Links to Include:**
- Link to all specific concorsi articles
- Link to preparation guides
- Link to salary info
- Link to requirements
- Link to exam examples

**Subtopic Articles link back:**
- Every subtopic article links to the pillar page
- Creates a strong topical cluster

---

## 🔍 Finding Link Opportunities

### Use the Utility Functions

```typescript
import { extractLinkableKeywords, findLinkOpportunities } from '@/lib/utils/internal-linking-utils'

// Extract keywords from an article
const keywords = extractLinkableKeywords(targetArticle)
// Returns: ["istruttore amministrativo", "concorsi pubblici", "roma", ...]

// Find where these keywords appear in your article
const opportunities = findLinkOpportunities(articleBody, keywords)
// Returns: [{keyword: "istruttore amministrativo", position: 234}, ...]
```

---

## 📚 Additional Resources

- **Google's Internal Linking Guide**: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- **Moz Internal Linking Guide**: https://moz.com/learn/seo/internal-link
- **Topic Clusters Strategy**: https://blog.hubspot.com/marketing/topic-clusters-seo

---

## ✅ Completion Checklist

Before considering internal linking "done":

- [ ] All articles have 3-5 contextual internal links
- [ ] Created 3-5 pillar content pages
- [ ] Linked all articles to relevant pillar pages  
- [ ] Added `<RelatedContentBox>` to top 20 articles
- [ ] Set up analytics tracking for internal link clicks
- [ ] Created monthly content linking review process
- [ ] Documented linking strategy for content team

---

**Remember:** Internal linking is an ongoing process. Review and update links monthly as you add new content!
