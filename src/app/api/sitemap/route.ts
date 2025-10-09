import { NextResponse } from 'next/server';
import { getAllArticoliWithConcorsoForSitemapServer } from '@/lib/blog/services-server';
import { ArticoloWithConcorso } from '@/types';
import { generateSEOArticoloUrl } from '@/lib/utils/articolo-urls';

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

    // Fetch blog articles with their concorso data
    try {
      const articles = await getAllArticoliWithConcorsoForSitemapServer();
      
      // Add individual blog articles
      articles.forEach((article: ArticoloWithConcorso) => {
        // Skip placeholder articles
        if (article.articolo_title === "Non specificato" && article.articolo_subtitle === "Non specificato") {
          return;
        }

        // ✅ SEO FIX: Use SEO-friendly multi-segment URL structure
        const articlePath = generateSEOArticoloUrl(article);
        
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

        // ✅ FRESHNESS SIGNAL: Check if concorso is expired
        const isConcorsoExpired = (() => {
          if (!article.concorso?.DataChiusura) return false;
          
          const deadline = article.concorso.DataChiusura;
          let deadlineDate: Date | null = null;
          
          try {
            if (typeof deadline === 'object' && 'seconds' in deadline) {
              deadlineDate = new Date(deadline.seconds * 1000);
            } else if (typeof deadline === 'string') {
              deadlineDate = new Date(deadline);
            }
            
            if (deadlineDate && !isNaN(deadlineDate.getTime())) {
              return deadlineDate < new Date();
            }
          } catch (e) {
            console.error('Error parsing deadline:', e);
          }
          
          return false;
        })();

        // ✅ FRESHNESS SIGNAL: Lower priority for articles older than 6 months
        const articleAge = Date.now() - new Date(lastmod).getTime();
        const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
        const isRecent = articleAge < sixMonths;

        // Expired concorsi get lowest priority and yearly changefreq
        // This signals to Google that the content is archived/historical
        let changefreq: 'weekly' | 'monthly' | 'yearly';
        let priority: string;
        
        if (isConcorsoExpired) {
          changefreq = 'yearly';
          priority = '0.3'; // Low priority for expired content
        } else if (isRecent) {
          changefreq = 'weekly';
          priority = '0.8'; // High priority for fresh, active content
        } else {
          changefreq = 'monthly';
          priority = '0.6'; // Medium priority for older but still active content
        }

        urls.push({
          loc: `https://concoro.it${articlePath}`,
          lastmod,
          changefreq,
          priority
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
