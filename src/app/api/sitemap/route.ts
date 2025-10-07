import { NextResponse } from 'next/server';
import { getAllArticoliServer } from '@/lib/blog/services-server';
import { Articolo } from '@/types';

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
    
    // Static pages with proper priorities and change frequencies
    const staticPages = [
      {
        path: '/',
        priority: '1.0',
        changefreq: 'daily' as const,
        lastmod: new Date().toISOString()
      },
      {
        path: '/blog',
        priority: '0.8',
        changefreq: 'daily' as const,
        lastmod: new Date().toISOString()
      },
      {
        path: '/chi-siamo',
        priority: '0.7',
        changefreq: 'monthly' as const,
        lastmod: new Date().toISOString()
      },
      {
        path: '/contatti',
        priority: '0.6',
        changefreq: 'monthly' as const,
        lastmod: new Date().toISOString()
      },
      {
        path: '/prezzi',
        priority: '0.7',
        changefreq: 'monthly' as const,
        lastmod: new Date().toISOString()
      },
      {
        path: '/faq',
        priority: '0.6',
        changefreq: 'weekly' as const,
        lastmod: new Date().toISOString()
      },
      {
        path: '/privacy-policy',
        priority: '0.3',
        changefreq: 'yearly' as const,
        lastmod: new Date().toISOString()
      },
      {
        path: '/termini-di-servizio',
        priority: '0.3',
        changefreq: 'yearly' as const,
        lastmod: new Date().toISOString()
      }
    ];

    // Add static pages to sitemap
    staticPages.forEach(page => {
      urls.push({
        loc: `https://concoro.it${page.path}`,
        lastmod: page.lastmod,
        changefreq: page.changefreq,
        priority: page.priority
      });
    });

    // Fetch blog articles
    try {
      const articles = await getAllArticoliServer();
      
      // Add individual blog articles
      articles.forEach((article: Articolo) => {
        // Skip placeholder articles
        if (article.articolo_title === "Non specificato" && article.articolo_subtitle === "Non specificato") {
          return;
        }

        // Use slug if available, otherwise fall back to ID
        const articlePath = article.slug ? `/articolo/${article.slug}` : `/articolo/${article.id}`;
        
        // Handle publication_date (could be Timestamp or string)
        let lastmod: string;
        if (article.publication_date) {
          if (typeof article.publication_date === 'object' && 'toDate' in article.publication_date) {
            // Firebase Timestamp
            lastmod = article.publication_date.toDate().toISOString();
          } else {
            // Assume it's already a date string or Date
            lastmod = new Date(article.publication_date as any).toISOString();
          }
        } else {
          lastmod = new Date().toISOString();
        }

        urls.push({
          loc: `https://concoro.it${articlePath}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.7'
        });
      });
    } catch (error) {
      console.error('Error fetching blog articles for sitemap:', error);
      // Continue without blog articles rather than failing completely
    }

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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // 1 hour cache, 24 hour stale
      },
    });

  } catch (error) {
    console.error('Error generating main sitemap:', error);
    
    // Return a minimal sitemap with just static pages in case of error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://concoro.it/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://concoro.it/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://concoro.it/chi-siamo</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://concoro.it/contatti</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600', // Shorter cache for fallback
      },
    });
  }
}
