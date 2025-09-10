#!/usr/bin/env node

/**
 * Simple JavaScript sitemap generation script
 * Run with: node scripts/generate-sitemap-simple.js
 * 
 * This avoids TypeScript path resolution issues
 */

const fs = require('fs');
const path = require('path');

// Import Next.js built files
const sitemap = require('../src/app/api/sitemap/route');

async function generateStaticSitemap() {
  console.log('🔄 Generating static sitemap...');
  
  try {
    console.log('📡 Calling dynamic sitemap API...');
    
    // Create a mock request object
    const mockRequest = {
      url: 'http://localhost:3000/api/sitemap',
      headers: new Map(),
      method: 'GET'
    };
    
    // Call the sitemap route
    const response = await sitemap.GET(mockRequest);
    const sitemapContent = await response.text();
    
    // Write to public/sitemap-static.xml
    const outputPath = path.join(process.cwd(), 'public', 'sitemap-static.xml');
    fs.writeFileSync(outputPath, sitemapContent, 'utf8');
    
    console.log(`✅ Static sitemap generated successfully!`);
    console.log(`📁 Location: ${outputPath}`);
    console.log(`📊 Size: ${sitemapContent.length} characters`);
    
    // Count URLs for reporting
    const urlMatches = sitemapContent.match(/<loc>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;
    console.log(`🔗 Total URLs: ${urlCount}`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    
    // Generate minimal fallback sitemap
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.concoro.it/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.concoro.it/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.concoro.it/bandi</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    
    const outputPath = path.join(process.cwd(), 'public', 'sitemap-static.xml');
    fs.writeFileSync(outputPath, fallbackSitemap, 'utf8');
    
    console.log('⚠️ Generated fallback sitemap due to error');
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  generateStaticSitemap().catch(console.error);
}

module.exports = { generateStaticSitemap };

