import { NextResponse } from 'next/server';
import { getAllArticoliServer } from '@/lib/blog/services-server';

export async function GET() {
  try {
    // Fetch all published articles
    const articles = await getAllArticoliServer();
    
    // Base URLs for the sitemap
    const baseUrl = 'https://concoro.it';
    
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
      }
    ];

    // Generate article URLs - ONLY use slug-based URLs for SEO compliance
    const articlePages = articles
      .filter(article => {
        // Only include articles that have slugs
        return article.slug && 
               article.articolo_title !== "Non specificato" && 
               article.articolo_subtitle !== "Non specificato";
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

        return {
          url: `${baseUrl}/articolo/${article.slug}`, // ONLY slug-based URLs
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.7
        };
      });

    // Combine all pages
    const allPages = [...staticPages, ...articlePages];

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a minimal sitemap on error
    const minimalSitemap = `<?xml version="1.0" encoding="UTF-8"?>
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