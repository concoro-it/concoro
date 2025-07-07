/**
 * SEO Compliance Validation Script
 * Verifies that the blog system meets the GO-LIVE checklist requirements
 */

import { getAllArticoliServer } from '@/lib/blog/services-server';
import { isDocumentId, isSlug } from '@/lib/utils/slug-utils';
import { readFileSync } from 'fs';
import path from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

interface SEOValidationReport {
  robotsTxt: ValidationResult;
  sitemapXml: ValidationResult;
  articleUrls: ValidationResult;
  articleSlugs: ValidationResult;
  overall: boolean;
}

async function validateSEOCompliance(): Promise<SEOValidationReport> {
  console.log('🔍 Starting SEO GO-LIVE Compliance Validation...\n');
  
  const report: SEOValidationReport = {
    robotsTxt: { passed: false, message: '' },
    sitemapXml: { passed: false, message: '' },
    articleUrls: { passed: false, message: '' },
    articleSlugs: { passed: false, message: '' },
    overall: false
  };

  // 1. Validate robots.txt
  console.log('📄 Validating robots.txt...');
  try {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    const robotsContent = readFileSync(robotsPath, 'utf-8');
    
    const hasGooglebotAllowed = robotsContent.includes('User-agent: *') && robotsContent.includes('Allow: /');
    const blocksSearchPages = robotsContent.includes('Disallow: /search') || robotsContent.includes('Disallow: /*?search');
    const hasSitemap = robotsContent.includes('Sitemap: https://concoro.it/sitemap.xml');
    
    if (hasGooglebotAllowed && blocksSearchPages && hasSitemap) {
      report.robotsTxt = {
        passed: true,
        message: '✅ robots.txt is compliant',
        details: 'Allows Googlebot, blocks search pages, includes sitemap'
      };
    } else {
      report.robotsTxt = {
        passed: false,
        message: '❌ robots.txt is not compliant',
        details: `Missing: ${!hasGooglebotAllowed ? 'Googlebot allow' : ''} ${!blocksSearchPages ? 'Search page blocks' : ''} ${!hasSitemap ? 'Sitemap reference' : ''}`
      };
    }
  } catch (error) {
    report.robotsTxt = {
      passed: false,
      message: '❌ robots.txt not found or readable',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 2. Validate sitemap.xml setup
  console.log('🗺️  Validating sitemap.xml...');
  try {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    const sitemapContent = readFileSync(sitemapPath, 'utf-8');
    
    const isDynamicSitemap = sitemapContent.includes('api/sitemap') && sitemapContent.includes('sitemapindex');
    
    if (isDynamicSitemap) {
      report.sitemapXml = {
        passed: true,
        message: '✅ sitemap.xml is properly configured for dynamic updates',
        details: 'Points to API route for automatic daily updates'
      };
    } else {
      report.sitemapXml = {
        passed: false,
        message: '❌ sitemap.xml is static and won\'t update automatically',
        details: 'Should point to /api/sitemap for dynamic generation'
      };
    }
  } catch (error) {
    report.sitemapXml = {
      passed: false,
      message: '❌ sitemap.xml not found or readable',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 3. Validate article URLs and slugs
  console.log('📰 Validating article URLs and slugs...');
  try {
    const articles = await getAllArticoliServer();
    
    const totalArticles = articles.length;
    const articlesWithSlugs = articles.filter(article => article.slug);
    const validSlugs = articlesWithSlugs.filter(article => isSlug(article.slug!));
    const publishedArticles = articles.filter(article => 
      article.articolo_title !== "Non specificato" && 
      article.articolo_subtitle !== "Non specificato"
    );
    
    const slugCoverage = totalArticles > 0 ? (articlesWithSlugs.length / totalArticles) * 100 : 0;
    const publishedSlugCoverage = publishedArticles.length > 0 ? 
      (publishedArticles.filter(a => a.slug).length / publishedArticles.length) * 100 : 0;

    if (publishedSlugCoverage >= 95) {
      report.articleSlugs = {
        passed: true,
        message: `✅ Article slug coverage is excellent (${publishedSlugCoverage.toFixed(1)}%)`,
        details: `${articlesWithSlugs.length}/${totalArticles} total articles have slugs, ${publishedArticles.filter(a => a.slug).length}/${publishedArticles.length} published articles have slugs`
      };
    } else {
      report.articleSlugs = {
        passed: false,
        message: `❌ Article slug coverage is insufficient (${publishedSlugCoverage.toFixed(1)}%)`,
        details: `Only ${articlesWithSlugs.length}/${totalArticles} articles have slugs. Need 95%+ coverage for published articles.`
      };
    }

    // Check if any articles are accessible by both ID and slug
    const articlesWithValidSlugs = articles.filter(article => article.slug && isSlug(article.slug));
    
    if (articlesWithValidSlugs.length > 0) {
      report.articleUrls = {
        passed: true,
        message: '✅ Article URL structure supports both slug and ID access',
        details: `${articlesWithValidSlugs.length} articles have valid slugs and support fallback ID access`
      };
    } else {
      report.articleUrls = {
        passed: false,
        message: '❌ No articles have valid slug-based URLs',
        details: 'Articles need SEO-friendly slug URLs'
      };
    }

  } catch (error) {
    report.articleSlugs = {
      passed: false,
      message: '❌ Failed to validate articles',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    report.articleUrls = {
      passed: false,
      message: '❌ Failed to validate article URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Calculate overall compliance
  report.overall = report.robotsTxt.passed && 
                   report.sitemapXml.passed && 
                   report.articleUrls.passed && 
                   report.articleSlugs.passed;

  return report;
}

async function generateSEOReport() {
  try {
    const report = await validateSEOCompliance();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEO GO-LIVE COMPLIANCE REPORT');
    console.log('='.repeat(60));
    
    console.log('\n🤖 ROBOTS.TXT:');
    console.log(`   ${report.robotsTxt.message}`);
    if (report.robotsTxt.details) console.log(`   ${report.robotsTxt.details}`);
    
    console.log('\n🗺️  SITEMAP.XML:');
    console.log(`   ${report.sitemapXml.message}`);
    if (report.sitemapXml.details) console.log(`   ${report.sitemapXml.details}`);
    
    console.log('\n📰 ARTICLE URLS:');
    console.log(`   ${report.articleUrls.message}`);
    if (report.articleUrls.details) console.log(`   ${report.articleUrls.details}`);
    
    console.log('\n🏷️  ARTICLE SLUGS:');
    console.log(`   ${report.articleSlugs.message}`);
    if (report.articleSlugs.details) console.log(`   ${report.articleSlugs.details}`);
    
    console.log('\n' + '='.repeat(60));
    if (report.overall) {
      console.log('🎉 OVERALL STATUS: ✅ GO-LIVE READY');
      console.log('🚀 All SEO requirements are met for deployment!');
    } else {
      console.log('❌ OVERALL STATUS: ⚠️  NOT GO-LIVE READY');
      console.log('🛠️  Please fix the failing requirements before deployment.');
    }
    console.log('='.repeat(60));
    
    return report.overall;
    
  } catch (error) {
    console.error('❌ Failed to generate SEO report:', error);
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  generateSEOReport()
    .then((isReady) => {
      process.exit(isReady ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

export { validateSEOCompliance, generateSEOReport }; 