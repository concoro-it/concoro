import { NextResponse } from 'next/server';
import { getFirestoreForSEO } from '@/lib/firebase-admin';
import { Concorso } from '@/types/concorso';
import { generateSEOConcorsoUrl } from '@/lib/utils/concorso-urls';

export const dynamic = 'force-dynamic';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}

export async function GET() {
  try {
    const db = getFirestoreForSEO();
    
    // Fetch all open concorsi for sitemap
    const concorsiQuery = db.collection('concorsi')
      .where('Stato', 'in', ['open', 'aperto', 'OPEN', 'APERTO'])
      .orderBy('publication_date', 'desc')
      .limit(10000); // Reasonable limit for sitemap
      
    const snapshot = await concorsiQuery.get();
    
    const concorsi = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Concorso[];

    // Generate sitemap URLs
    const urls: SitemapUrl[] = [];
    
    // Main concorsi page
    urls.push({
      loc: 'https://concoro.it/concorsi',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '0.9'
    });

    // Individual concorso pages
    concorsi.forEach(concorso => {
      const lastmod = (() => {
        // Handle updatedAt timestamp (Firebase timestamp object)
        if (concorso.updatedAt && typeof concorso.updatedAt === 'object' && 'seconds' in concorso.updatedAt) {
          return new Date(concorso.updatedAt.seconds * 1000).toISOString();
        }
        
        // Handle createdAt timestamp (Firebase timestamp object)
        if (concorso.createdAt && typeof concorso.createdAt === 'object' && 'seconds' in concorso.createdAt) {
          return new Date(concorso.createdAt.seconds * 1000).toISOString();
        }
        
        // Handle publication_date (string format)
        if (concorso.publication_date && typeof concorso.publication_date === 'string') {
          try {
            return new Date(concorso.publication_date).toISOString();
          } catch {
            // If string parsing fails, continue to fallback
          }
        }
        
        return new Date().toISOString();
      })();

      // Generate SEO-friendly URL
      const seoUrl = generateSEOConcorsoUrl(concorso);
      
      urls.push({
        loc: `https://concoro.it${seoUrl}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.7'
      });
    });

    // Generate category pages (enti, localita, settori)
    const enti = Array.from(new Set(
      concorsi.map(c => c.Ente).filter((ente): ente is string => Boolean(ente))
    ));
    
    const localita = Array.from(new Set(
      concorsi.map(c => c.AreaGeografica?.split(',')[0]?.trim()).filter((loc): loc is string => Boolean(loc))
    ));
    
    const settori = Array.from(new Set(
      concorsi.map(c => c.settore_professionale).filter((settore): settore is string => Boolean(settore))
    ));

    // Add ente pages (limit to most common ones)
    enti.slice(0, 100).forEach(ente => {
      const slug = encodeURIComponent(ente);
      urls.push({
        loc: `https://concoro.it/concorsi?ente=${slug}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.6'
      });
    });

    // Add localita pages (limit to most common ones)
    localita.slice(0, 100).forEach(loc => {
      const slug = encodeURIComponent(loc);
      urls.push({
        loc: `https://concoro.it/concorsi?localita=${slug}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.6'
      });
    });

    // Add settore pages
    settori.slice(0, 50).forEach(settore => {
      const slug = encodeURIComponent(settore);
      urls.push({
        loc: `https://concoro.it/concorsi?settore=${slug}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.6'
      });
    });

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
    console.error('Error generating concorsi sitemap:', error);
    
    // Return minimal sitemap on error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://concoro.it/concorsi</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // Short cache on error
      },
    });
  }
}
