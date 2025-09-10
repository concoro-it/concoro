#!/usr/bin/env ts-node

/**
 * Static sitemap generation script
 * Run with: npx ts-node scripts/generate-sitemap.ts
 * 
 * This script generates a static sitemap.xml file as a backup option
 * or for use with cron jobs for automated updates
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// Configure module resolution
const path = require('path');
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
  compilerOptions: {
    baseUrl: path.join(__dirname, '../src'),
    paths: {
      "@/*": ["*"]
    }
  }
});

import { getAllArticoliServer } from '../src/lib/blog/services-server';
import { getAllActiveConcorsiServer } from '../src/lib/concorsi/services-server';
import { getBandoUrl } from '../src/lib/utils/bando-slug-utils';

async function generateSitemap() {
  console.log('🔄 Generating static sitemap...');
  
  try {
    // Fetch all data
    console.log('📡 Fetching data from Firestore...');
    const [articles, concorsi] = await Promise.all([
      getAllArticoliServer(),
      getAllActiveConcorsiServer()
    ]);
    
    console.log(`📄 Found ${articles.length} articles`);
    console.log(`🏢 Found ${concorsi.length} active concorsi`);
    
    const baseUrl = 'https://www.concoro.it';
    
    // Static pages
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

    // Article pages
    const articlePages = articles
      .filter(article => {
        return article.slug && 
               article.articolo_title !== "Non specificato" && 
               article.articolo_subtitle !== "Non specificato";
      })
      .map(article => {
        let lastModified = new Date().toISOString();
        
        try {
          if (article.updatedAt?.toDate) {
            lastModified = article.updatedAt.toDate().toISOString();
          } else if (article.publication_date?.toDate) {
            lastModified = article.publication_date.toDate().toISOString();
          } else if ((article.updatedAt as any)?.seconds) {
            lastModified = new Date((article.updatedAt as any).seconds * 1000).toISOString();
          } else if ((article.publication_date as any)?.seconds) {
            lastModified = new Date((article.publication_date as any).seconds * 1000).toISOString();
          }
        } catch (error) {
          console.error('Error parsing article date:', error);
        }

        return {
          url: `${baseUrl}/articolo/${article.slug}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.7
        };
      });

    // Concorso pages - using SEO-friendly URLs
    const concorsoPages = concorsi.map(concorso => {
      let lastModified = new Date().toISOString();
      
      try {
        if (concorso.updatedAt?.seconds) {
          lastModified = new Date(concorso.updatedAt.seconds * 1000).toISOString();
        } else if (concorso.createdAt?.seconds) {
          lastModified = new Date(concorso.createdAt.seconds * 1000).toISOString();
        } else if (concorso.publication_date) {
          if (typeof concorso.publication_date === 'string') {
            lastModified = new Date(concorso.publication_date).toISOString();
          } else if (typeof concorso.publication_date === 'object' && 'seconds' in concorso.publication_date) {
            lastModified = new Date((concorso.publication_date as any).seconds * 1000).toISOString();
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

    // Combine all pages
    const allPages = [...staticPages, ...articlePages, ...concorsoPages];

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

    // Write to public/sitemap-static.xml
    const outputPath = join(process.cwd(), 'public', 'sitemap-static.xml');
    writeFileSync(outputPath, sitemap, 'utf8');
    
    console.log(`✅ Static sitemap generated successfully!`);
    console.log(`📁 Location: ${outputPath}`);
    console.log(`📊 Total URLs: ${allPages.length}`);
    console.log(`   - Static pages: ${staticPages.length}`);
    console.log(`   - Article pages: ${articlePages.length}`);
    console.log(`   - Concorso pages: ${concorsoPages.length}`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  generateSitemap().catch(console.error);
}

export { generateSitemap };
