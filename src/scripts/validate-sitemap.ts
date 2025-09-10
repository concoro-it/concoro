/**
 * Sitemap validation script
 * Validates that the sitemap only contains canonical URLs and detects issues
 */

import fetch from 'node-fetch';

interface SitemapValidationResult {
  totalUrls: number;
  articleUrls: number;
  slugBasedUrls: number;
  idBasedUrls: number;
  duplicateUrls: string[];
  invalidUrls: string[];
  canonicalIssues: string[];
}

async function validateSitemap(sitemapUrl: string = 'https://www.concoro.it/api/sitemap'): Promise<SitemapValidationResult> {
  console.log('🔍 Validating sitemap...');
  console.log(`📡 Fetching: ${sitemapUrl}`);
  
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const sitemapXml = await response.text();
    
    // Extract URLs from sitemap
    const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g);
    if (!urlMatches) {
      throw new Error('No URLs found in sitemap');
    }
    
    const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
    
    // Initialize validation result
    const result: SitemapValidationResult = {
      totalUrls: urls.length,
      articleUrls: 0,
      slugBasedUrls: 0,
      idBasedUrls: 0,
      duplicateUrls: [],
      invalidUrls: [],
      canonicalIssues: []
    };
    
    // Track duplicates
    const urlCounts = new Map<string, number>();
    
    // Validate each URL
    urls.forEach(url => {
      // Count occurrences
      urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
      
      // Check if it's an article URL
      if (url.includes('/articolo/')) {
        result.articleUrls++;
        
        // Extract the slug/ID part
        const urlParam = url.split('/articolo/')[1];
        
        if (!urlParam) {
          result.invalidUrls.push(url);
          return;
        }
        
        // Check if it looks like a document ID (20+ alphanumeric chars)
        const isDocumentId = /^[a-zA-Z0-9]{20,}$/.test(urlParam);
        
        if (isDocumentId) {
          result.idBasedUrls++;
          result.canonicalIssues.push(`ID-based URL in sitemap: ${url}`);
        } else {
          result.slugBasedUrls++;
        }
        
        // Validate slug format
        if (!isDocumentId) {
          const hasValidSlugFormat = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(urlParam);
          if (!hasValidSlugFormat) {
            result.invalidUrls.push(`Invalid slug format: ${url}`);
          }
        }
      }
    });
    
    // Find duplicates
    urlCounts.forEach((count, url) => {
      if (count > 1) {
        result.duplicateUrls.push(`${url} (${count} times)`);
      }
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error validating sitemap:', error);
    throw error;
  }
}

function printValidationReport(result: SitemapValidationResult) {
  console.log('\n📊 Sitemap Validation Report');
  console.log('━'.repeat(50));
  
  // Summary
  console.log(`📈 Total URLs: ${result.totalUrls}`);
  console.log(`📄 Article URLs: ${result.articleUrls}`);
  
  if (result.articleUrls > 0) {
    console.log(`✅ Slug-based URLs: ${result.slugBasedUrls} (${(result.slugBasedUrls / result.articleUrls * 100).toFixed(1)}%)`);
    console.log(`❌ ID-based URLs: ${result.idBasedUrls} (${(result.idBasedUrls / result.articleUrls * 100).toFixed(1)}%)`);
  }
  
  // Issues
  if (result.duplicateUrls.length > 0) {
    console.log(`\n🔄 Duplicate URLs (${result.duplicateUrls.length}):`);
    result.duplicateUrls.forEach(dup => console.log(`  • ${dup}`));
  }
  
  if (result.invalidUrls.length > 0) {
    console.log(`\n⚠️ Invalid URLs (${result.invalidUrls.length}):`);
    result.invalidUrls.slice(0, 10).forEach(invalid => console.log(`  • ${invalid}`));
    if (result.invalidUrls.length > 10) {
      console.log(`  ... and ${result.invalidUrls.length - 10} more`);
    }
  }
  
  if (result.canonicalIssues.length > 0) {
    console.log(`\n🚨 Canonical Issues (${result.canonicalIssues.length}):`);
    result.canonicalIssues.slice(0, 10).forEach(issue => console.log(`  • ${issue}`));
    if (result.canonicalIssues.length > 10) {
      console.log(`  ... and ${result.canonicalIssues.length - 10} more`);
    }
  }
  
  // Overall health
  console.log('\n🏥 Sitemap Health:');
  const healthScore = calculateHealthScore(result);
  console.log(`  Overall Score: ${healthScore}% ${getHealthEmoji(healthScore)}`);
  
  if (healthScore >= 95) {
    console.log('🎉 Excellent! Your sitemap is in great shape.');
  } else if (healthScore >= 80) {
    console.log('👍 Good! Minor issues detected.');
  } else if (healthScore >= 60) {
    console.log('⚠️ Fair. Some issues need attention.');
  } else {
    console.log('🚨 Poor. Significant issues detected.');
  }
}

function calculateHealthScore(result: SitemapValidationResult): number {
  if (result.articleUrls === 0) return 100;
  
  let score = 100;
  
  // Deduct points for ID-based URLs (should be 0)
  score -= (result.idBasedUrls / result.articleUrls) * 50;
  
  // Deduct points for duplicates
  score -= (result.duplicateUrls.length / result.totalUrls) * 30;
  
  // Deduct points for invalid URLs
  score -= (result.invalidUrls.length / result.totalUrls) * 20;
  
  return Math.max(0, Math.round(score));
}

function getHealthEmoji(score: number): string {
  if (score >= 95) return '🟢';
  if (score >= 80) return '🟡';
  if (score >= 60) return '🟠';
  return '🔴';
}

// Run validation if called directly
async function main() {
  try {
    const result = await validateSitemap();
    printValidationReport(result);
    
    // Exit with error code if there are critical issues
    if (result.idBasedUrls > 0 || result.duplicateUrls.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { validateSitemap, printValidationReport };

