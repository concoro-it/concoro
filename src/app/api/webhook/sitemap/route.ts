import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Webhook endpoint for triggering sitemap regeneration
// Can be called by external services, cron jobs, or when data changes

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SITEMAP_WEBHOOK_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Webhook triggered: Regenerating sitemap...');
    
    // Get current dynamic sitemap
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const sitemapResponse = await fetch(`${baseUrl}/api/sitemap`);
    const sitemapContent = await sitemapResponse.text();
    
    // Write static sitemap file
    const outputPath = join(process.cwd(), 'public', 'sitemap-static.xml');
    writeFileSync(outputPath, sitemapContent, 'utf8');
    
    // Ping search engines about the dynamic sitemap
    const sitemapUrl = 'https://www.concoro.it/api/sitemap';
    
    const searchEnginePings = [
      // Google
      fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`).catch(console.error),
      // Bing
      fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`).catch(console.error),
    ];
    
    await Promise.allSettled(searchEnginePings);
    
    console.log('✅ Sitemap regenerated and search engines pinged');
    
    return NextResponse.json({
      success: true,
      message: 'Sitemap regenerated successfully',
      timestamp: new Date().toISOString(),
      sitemapUrl: sitemapUrl
    });
    
  } catch (error) {
    console.error('❌ Error in sitemap webhook:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to regenerate sitemap',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Support GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Sitemap webhook endpoint is active',
    usage: 'Send a POST request to trigger sitemap regeneration',
    endpoints: {
      dynamic: '/api/sitemap',
      static: '/sitemap-static.xml',
      webhook: '/api/webhook/sitemap'
    }
  });
}
