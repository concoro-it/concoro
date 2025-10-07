import { NextResponse } from 'next/server';
import { getAllArticoliServer } from '@/lib/blog/services-server';
<<<<<<< Updated upstream
import { getAllActiveConcorsiServer } from '@/lib/concorsi/services-server';
import { getBandoUrl } from '@/lib/utils/bando-slug-utils';
import { getCanonicalUrlParam } from '@/lib/utils/articolo-canonical-utils';

// Force dynamic rendering to avoid build-time timeout
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    // Add timeout protection for large data fetches
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sitemap generation timeout')), 45000)
    );

    // Fetch all published articles and active concorsi with timeout
    const [articles, concorsi] = await Promise.race([
      Promise.all([
        getAllArticoliServer(),
        getAllActiveConcorsiServer()
      ]),
      timeout
    ]) as [Array<{ id: string; slug: string; updatedAt: Date }>, Array<{ id: string; Titolo: string; DataChiusura: string }>];
    
    // Base URLs for the sitemap
    const baseUrl = 'https://www.concoro.it';
    
    // Static pages with their priorities and change frequencies
    const staticPages = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.8
      },
      {
        url: `${baseUrl}/bandi`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.8
      },
      {
        url: `${baseUrl}/chi-siamo`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.6
      },
      {
        url: `${baseUrl}/prezzi`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.7
      },
      {
        url: `${baseUrl}/faq`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.5
      },
      {
        url: `${baseUrl}/contatti`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.5
      },
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'yearly',
        priority: 0.3
      },
      {
        url: `${baseUrl}/termini-di-servizio`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'yearly',
        priority: 0.3
      },
      // Public auth pages (only if they should be indexed)
      {
        url: `${baseUrl}/signin`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.4
      },
      {
        url: `${baseUrl}/signup`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.4
      }
    ];

    // Generate article URLs - ONLY canonical URLs for SEO compliance
    const articlePages = articles
      .filter(article => {
        // Only include articles with proper canonical data
        const hasValidData = (article.slug || article.id) && 
                            article.articolo_title !== "Non specificato" && 
                            article.articolo_subtitle !== "Non specificato";
        
        // Log validation for monitoring
        if (!hasValidData) {
          console.log(`🚫 Sitemap: Excluding article ${article.id} - missing canonical data`);
        }
        
        return hasValidData;
      })
      .map(article => {
        // Convert Firebase timestamp to ISO string
        let lastModified = new Date().toISOString();
        
        try {
          if (article.updatedAt?.toDate) {
            lastModified = article.updatedAt.toDate().toISOString();
          } else if (article.publication_date?.toDate) {
            lastModified = article.publication_date.toDate().toISOString();
          } else if (article.updatedAt?.seconds) {
            lastModified = new Date(article.updatedAt.seconds * 1000).toISOString();
          } else if (article.publication_date?.seconds) {
            lastModified = new Date(article.publication_date.seconds * 1000).toISOString();
          }
        } catch (error) {
          console.error('Error parsing article date:', error);
        }

        const canonicalParam = getCanonicalUrlParam(article);
        
        // Log canonical URL generation for monitoring
        if (article.slug && canonicalParam !== article.slug) {
          console.log(`⚠️ Sitemap: Article ${article.id} canonical mismatch - slug: ${article.slug}, canonical: ${canonicalParam}`);
        }
        
        return {
          url: `${baseUrl}/articolo/${canonicalParam}`, // ONLY canonical URLs
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.7
        };
      });

    // Generate concorso URLs - only active concorsi
    const concorsoPages = concorsi.map(concorso => {
      // Convert Firebase timestamp to ISO string
      let lastModified = new Date().toISOString();
      
      try {
        if (concorso.updatedAt?.seconds) {
          lastModified = new Date(concorso.updatedAt.seconds * 1000).toISOString();
        } else if (concorso.createdAt?.seconds) {
          lastModified = new Date(concorso.createdAt.seconds * 1000).toISOString();
        } else if (concorso.publication_date) {
          // Handle string or timestamp format
          if (typeof concorso.publication_date === 'string') {
            lastModified = new Date(concorso.publication_date).toISOString();
          } else if (typeof concorso.publication_date === 'object' && 'seconds' in concorso.publication_date) {
            lastModified = new Date((concorso.publication_date as { seconds: number }).seconds * 1000).toISOString();
          }
        }
      } catch (error) {
        console.error('Error parsing concorso date:', error);
      }

      // Generate SEO-friendly URL with fallback to ID
      let concorsoUrl: string;
      try {
        const seoUrl = getBandoUrl(concorso);
        concorsoUrl = `${baseUrl}${seoUrl}`;
      } catch (error) {
        console.error('Error generating SEO URL for concorso:', concorso.id, error);
        // Fallback to ID-based URL
        concorsoUrl = `${baseUrl}/bandi/${concorso.id}`;
      }

      return {
        url: concorsoUrl,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7
      };
    });

    // Deduplicate URLs as a safety net (should not be needed with improved URL generation)
    const allPagesWithDuplicates = [...staticPages, ...articlePages, ...concorsoPages];
    const urlSet = new Set();
    const allPages: Array<{
      url: string;
      lastModified: string;
      changeFrequency: string;
      priority: number;
    }> = [];
    let duplicateCount = 0;
    
    allPagesWithDuplicates.forEach(page => {
      if (!urlSet.has(page.url)) {
        urlSet.add(page.url);
        allPages.push(page);
      } else {
        duplicateCount++;
        console.warn(`🟡 Sitemap: Removed duplicate URL - ${page.url}`);
      }
    });
    
    // Log sitemap generation summary
    console.log(`🗺️ Sitemap generated:`);
    console.log(`  • Static pages: ${staticPages.length}`);
    console.log(`  • Article pages: ${articlePages.length}`);
    console.log(`  • Concorso pages: ${concorsoPages.length}`);
    console.log(`  • Unique pages: ${allPages.length}`);
    if (duplicateCount > 0) {
      console.log(`  🟡 Duplicates removed: ${duplicateCount}`);
    } else {
      console.log(`  ✅ No duplicates detected`);
=======
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
>>>>>>> Stashed changes
    }

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<<<<<<< Updated upstream
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Set appropriate headers for XML content
    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'CDN-Cache-Control': 'public, max-age=86400', // Cache on CDN for 24 hours
=======
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
>>>>>>> Stashed changes
      },
    });

  } catch (error) {
<<<<<<< Updated upstream
    console.error('Error generating sitemap:', error);
    
    // Return a minimal sitemap on error
    const minimalSitemap = `<?xml version="1.0" encoding="UTF-8"?>
=======
    console.error('Error generating main sitemap:', error);
    
    // Return a minimal sitemap with just static pages in case of error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
</urlset>`;

    return new NextResponse(minimalSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300', // Shorter cache on error
      },
    });
  }
} 
=======
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
>>>>>>> Stashed changes
