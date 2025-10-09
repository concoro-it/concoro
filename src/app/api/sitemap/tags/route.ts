import { NextResponse } from 'next/server';
import { getAllArticoliServer } from '@/lib/blog/services-server';

export const dynamic = 'force-dynamic';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

export async function GET() {
  try {
    const urls: SitemapUrl[] = [];
    
    // Fetch all articles to extract tags
    const articles = await getAllArticoliServer();
    const tagData = new Map<string, Date>();

    // Collect tags with their most recent article date
    articles.forEach(article => {
      if (article.articolo_tags && Array.isArray(article.articolo_tags)) {
        article.articolo_tags.forEach(tag => {
          let articleDate: Date;
          
          // Handle different timestamp formats
          if (article.publication_date) {
            if (typeof article.publication_date === 'object' && 'toDate' in article.publication_date) {
              articleDate = article.publication_date.toDate();
            } else if (typeof article.publication_date === 'object' && '_seconds' in article.publication_date) {
              articleDate = new Date((article.publication_date as any)._seconds * 1000);
            } else {
              articleDate = new Date(article.publication_date as any);
            }
          } else {
            articleDate = new Date();
          }

          // Keep the most recent date for each tag
          const existingDate = tagData.get(tag.toLowerCase());
          if (!existingDate || articleDate > existingDate) {
            tagData.set(tag.toLowerCase(), articleDate);
          }
        });
      }
    });

    // Generate sitemap entries for each tag
    tagData.forEach((lastmod, tag) => {
      urls.push({
        loc: `https://www.concoro.it/blog/tags/${encodeURIComponent(tag)}`,
        lastmod: lastmod.toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      });
    });

    // Sort by priority (most articles first would be ideal, but we'll use alphabetical for now)
    urls.sort((a, b) => a.loc.localeCompare(b.loc));

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('Error generating tags sitemap:', error);
    
    // Return minimal sitemap on error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.concoro.it/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  }
}
