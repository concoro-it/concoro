#!/usr/bin/env tsx

/**
 * SEO Compliance Validation Script
 * Validates all MUST-HAVE requirements for Concoro blog articles
 * 
 * Requirements checked:
 * D. OPEN GRAPH & TWITTER CARD
 * E. CONTENT MARKUP  
 * F. PERFORMANCE / ACCESSIBILITY
 * G. ANALYTICS / TRACKING
 */

import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

interface SEOValidationResults {
  openGraph: {
    hasOgTitle: boolean;
    hasOgDescription: boolean;
    hasOgType: boolean;
    hasOgUrl: boolean;
    hasOgImage: boolean;
    hasOgImageDimensions: boolean;
    imageSize: string;
  };
  twitterCard: {
    hasTwitterCard: boolean;
    hasTwitterTitle: boolean;
    hasTwitterDescription: boolean;
    hasTwitterImage: boolean;
    hasTwitterImageAlt: boolean;
  };
  contentMarkup: {
    hasSingleH1: boolean;
    h1MatchesTitle: boolean;
    hasH2: boolean;
    hierarchyValid: boolean;
    introWordCount: number;
    introHasKeyword: boolean;
    hasDescriptiveAltText: boolean;
    hasInternalLinks: boolean;
    hasExternalLink: boolean;
    wordCount: number;
    keywordDensity: number;
    hasInlineStyles: boolean;
  };
  performance: {
    hasLazyLoading: boolean;
    hasImageDimensions: boolean;
    hasAriaLabels: boolean;
    hasFocusVisible: boolean;
    hasConsoleErrors: boolean;
  };
  analytics: {
    hasGA4: boolean;
    hasPageViewEvent: boolean;
    hasCustomEvent: boolean;
    hasNoDuplicates: boolean;
  };
  overall: {
    compliant: boolean;
    score: number;
    issues: string[];
  };
}

/**
 * Validate Open Graph implementation
 */
function validateOpenGraph(document: Document): SEOValidationResults['openGraph'] {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogType = document.querySelector('meta[property="og:type"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogImageWidth = document.querySelector('meta[property="og:image:width"]');
  const ogImageHeight = document.querySelector('meta[property="og:image:height"]');

  const imageWidth = ogImageWidth?.getAttribute('content') || '';
  const imageHeight = ogImageHeight?.getAttribute('content') || '';
  const hasCorrectDimensions = imageWidth === '1200' && imageHeight === '630';

  return {
    hasOgTitle: !!ogTitle,
    hasOgDescription: !!ogDescription,
    hasOgType: ogType?.getAttribute('content') === 'article',
    hasOgUrl: !!ogUrl,
    hasOgImage: !!ogImage,
    hasOgImageDimensions: hasCorrectDimensions,
    imageSize: `${imageWidth}x${imageHeight}`
  };
}

/**
 * Validate Twitter Card implementation
 */
function validateTwitterCard(document: Document): SEOValidationResults['twitterCard'] {
  const twitterCard = document.querySelector('meta[name="twitter:card"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  const twitterImageAlt = document.querySelector('meta[name="twitter:image:alt"]');

  return {
    hasTwitterCard: twitterCard?.getAttribute('content') === 'summary_large_image',
    hasTwitterTitle: !!twitterTitle,
    hasTwitterDescription: !!twitterDescription,
    hasTwitterImage: !!twitterImage,
    hasTwitterImageAlt: !!twitterImageAlt
  };
}

/**
 * Validate content markup structure
 */
function validateContentMarkup(document: Document): SEOValidationResults['contentMarkup'] {
  const h1Elements = document.querySelectorAll('h1');
  const h2Elements = document.querySelectorAll('h2');
  const title = document.title;
  const bodyText = document.body?.textContent || '';
  const firstParagraph = document.querySelector('p')?.textContent || '';
  const images = document.querySelectorAll('img');
  const internalLinks = document.querySelectorAll('a[href^="/"]');
  const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="concoro.it"])');
  const elementsWithStyle = document.querySelectorAll('[style]');

  // Word count
  const wordCount = bodyText.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Intro validation (first 120 words, keyword in first 80 chars)
  const introWords = firstParagraph.split(/\s+/).slice(0, 120);
  const introWordCount = introWords.length;
  const first80Chars = firstParagraph.substring(0, 80);
  
  // Simple keyword detection (looking for common role keywords)
  const keywords = ['istruttore', 'dirigente', 'funzionario', 'assistente', 'concorso'];
  const introHasKeyword = keywords.some(keyword => 
    first80Chars.toLowerCase().includes(keyword)
  );

  // Check heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let hierarchyValid = true;
  let lastLevel = 0;
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.substring(1));
    if (level > lastLevel + 1) {
      hierarchyValid = false;
    }
    lastLevel = Math.max(lastLevel, level);
  });

  // Check alt text quality
  let hasDescriptiveAltText = true;
  images.forEach(img => {
    const alt = img.getAttribute('alt') || '';
    if (alt.length < 10 || alt === 'image' || alt === '') {
      hasDescriptiveAltText = false;
    }
  });

  // Basic keyword density calculation
  const primaryKeyword = 'concorso'; // Simplified
  const keywordOccurrences = (bodyText.toLowerCase().match(new RegExp(primaryKeyword, 'g')) || []).length;
  const keywordDensity = wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0;

  return {
    hasSingleH1: h1Elements.length === 1,
    h1MatchesTitle: h1Elements[0]?.textContent?.trim() === title.replace(' | Concoro', ''),
    hasH2: h2Elements.length > 0,
    hierarchyValid,
    introWordCount,
    introHasKeyword,
    hasDescriptiveAltText,
    hasInternalLinks: internalLinks.length >= 2,
    hasExternalLink: externalLinks.length === 1,
    wordCount,
    keywordDensity,
    hasInlineStyles: elementsWithStyle.length === 0
  };
}

/**
 * Validate performance and accessibility
 */
function validatePerformance(document: Document): SEOValidationResults['performance'] {
  const images = document.querySelectorAll('img');
  const buttons = document.querySelectorAll('button');
  const links = document.querySelectorAll('a');

  let hasLazyLoading = true;
  let hasImageDimensions = true;
  
  images.forEach(img => {
    const loading = img.getAttribute('loading');
    const width = img.getAttribute('width');
    const height = img.getAttribute('height');
    
    if (loading !== 'lazy' && loading !== 'eager') {
      hasLazyLoading = false;
    }
    if (!width || !height) {
      hasImageDimensions = false;
    }
  });

  let hasAriaLabels = true;
  buttons.forEach(button => {
    const ariaLabel = button.getAttribute('aria-label');
    const textContent = button.textContent?.trim();
    if (!ariaLabel && !textContent) {
      hasAriaLabels = false;
    }
  });

  // Check for focus-visible (simplified check)
  const hasFocusVisible = document.querySelector('[data-focus-visible-added]') !== null ||
                         document.styleSheets.length > 0; // Simplified check

  return {
    hasLazyLoading,
    hasImageDimensions,
    hasAriaLabels,
    hasFocusVisible,
    hasConsoleErrors: false // Would need browser console access to check properly
  };
}

/**
 * Validate analytics implementation
 */
function validateAnalytics(document: Document): SEOValidationResults['analytics'] {
  const scripts = document.querySelectorAll('script');
  let hasGA4 = false;
  let hasPageViewEvent = false;
  let hasCustomEvent = false;

  scripts.forEach(script => {
    const content = script.textContent || '';
    if (content.includes('gtag') && content.includes('G-')) {
      hasGA4 = true;
    }
    if (content.includes('page_view')) {
      hasPageViewEvent = true;
    }
    if (content.includes('concoro_article_view')) {
      hasCustomEvent = true;
    }
  });

  return {
    hasGA4,
    hasPageViewEvent,
    hasCustomEvent,
    hasNoDuplicates: true // Would need runtime validation
  };
}

/**
 * Main validation function
 */
export async function validateSEOCompliance(url: string): Promise<SEOValidationResults> {
  try {
    console.log(`🔍 Validating SEO compliance for: ${url}`);
    
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const openGraph = validateOpenGraph(document);
    const twitterCard = validateTwitterCard(document);
    const contentMarkup = validateContentMarkup(document);
    const performance = validatePerformance(document);
    const analytics = validateAnalytics(document);

    // Calculate overall score and compliance
    const checks = [
      // Open Graph (6 checks)
      openGraph.hasOgTitle,
      openGraph.hasOgDescription,
      openGraph.hasOgType,
      openGraph.hasOgUrl,
      openGraph.hasOgImage,
      openGraph.hasOgImageDimensions,
      
      // Twitter Card (5 checks)
      twitterCard.hasTwitterCard,
      twitterCard.hasTwitterTitle,
      twitterCard.hasTwitterDescription,
      twitterCard.hasTwitterImage,
      twitterCard.hasTwitterImageAlt,
      
      // Content Markup (11 checks)
      contentMarkup.hasSingleH1,
      contentMarkup.h1MatchesTitle,
      contentMarkup.hasH2,
      contentMarkup.hierarchyValid,
      contentMarkup.introWordCount <= 120,
      contentMarkup.introHasKeyword,
      contentMarkup.hasDescriptiveAltText,
      contentMarkup.hasInternalLinks,
      contentMarkup.hasExternalLink,
      contentMarkup.wordCount >= 600,
      contentMarkup.keywordDensity <= 2,
      
      // Performance (4 checks)
      performance.hasLazyLoading,
      performance.hasImageDimensions,
      performance.hasAriaLabels,
      performance.hasFocusVisible,
      
      // Analytics (3 checks)
      analytics.hasGA4,
      analytics.hasPageViewEvent,
      analytics.hasCustomEvent
    ];

    const passedChecks = checks.filter(Boolean).length;
    const totalChecks = checks.length;
    const score = Math.round((passedChecks / totalChecks) * 100);
    const compliant = score >= 90; // 90% threshold for compliance

    const issues: string[] = [];
    
    // Collect issues
    if (!openGraph.hasOgTitle) issues.push('Missing og:title');
    if (!openGraph.hasOgImageDimensions) issues.push('Missing og:image dimensions (1200x630)');
    if (!twitterCard.hasTwitterCard) issues.push('Missing twitter:card');
    if (!contentMarkup.hasSingleH1) issues.push('Missing single H1 or multiple H1s');
    if (contentMarkup.wordCount < 600) issues.push(`Word count too low: ${contentMarkup.wordCount} (min 600)`);
    if (contentMarkup.keywordDensity > 2) issues.push(`Keyword density too high: ${contentMarkup.keywordDensity}% (max 2%)`);
    if (!performance.hasLazyLoading) issues.push('Images missing lazy loading');
    if (!analytics.hasCustomEvent) issues.push('Missing custom analytics events');

    return {
      openGraph,
      twitterCard,
      contentMarkup,
      performance,
      analytics,
      overall: {
        compliant,
        score,
        issues
      }
    };

  } catch (error) {
    console.error('❌ Error validating SEO compliance:', error);
    throw error;
  }
}

/**
 * CLI usage
 */
if (require.main === module) {
  const url = process.argv[2];
  
  if (!url) {
    console.error('Usage: npx tsx validateSEOCompliance.ts <url>');
    console.error('Example: npx tsx validateSEOCompliance.ts https://concoro.it/articolo/istruttore-milano-2024');
    process.exit(1);
  }

  validateSEOCompliance(url)
    .then(results => {
      console.log('\n📊 SEO COMPLIANCE VALIDATION RESULTS');
      console.log('=====================================\n');
      
      console.log('🔗 OPEN GRAPH & TWITTER CARD:');
      console.log(`  ✓ og:title: ${results.openGraph.hasOgTitle ? '✅' : '❌'}`);
      // og:image dimensions validated
      console.log(`  ✓ twitter:card: ${results.twitterCard.hasTwitterCard ? '✅' : '❌'}\n`);
      
      console.log('📝 CONTENT MARKUP:');
      console.log(`  ✓ Single H1: ${results.contentMarkup.hasSingleH1 ? '✅' : '❌'}`);
      console.log(`  ✓ Word count: ${results.contentMarkup.wordCount >= 600 ? '✅' : '❌'} (${results.contentMarkup.wordCount}/600)`);
      console.log(`  ✓ Keyword density: ${results.contentMarkup.keywordDensity <= 2 ? '✅' : '❌'} (${results.contentMarkup.keywordDensity.toFixed(1)}%)`);
      console.log(`  ✓ Internal links: ${results.contentMarkup.hasInternalLinks ? '✅' : '❌'}`);
      console.log(`  ✓ External link: ${results.contentMarkup.hasExternalLink ? '✅' : '❌'}\n`);
      
      console.log('⚡ PERFORMANCE & ACCESSIBILITY:');
      console.log(`  ✓ Lazy loading: ${results.performance.hasLazyLoading ? '✅' : '❌'}`);
      // Image dimensions validated
      console.log(`  ✓ Aria labels: ${results.performance.hasAriaLabels ? '✅' : '❌'}\n`);
      
      console.log('📈 ANALYTICS & TRACKING:');
      console.log(`  ✓ GA4 setup: ${results.analytics.hasGA4 ? '✅' : '❌'}`);
      console.log(`  ✓ Page view event: ${results.analytics.hasPageViewEvent ? '✅' : '❌'}`);
      console.log(`  ✓ Custom events: ${results.analytics.hasCustomEvent ? '✅' : '❌'}\n`);
      
      console.log('🏆 OVERALL SCORE:');
      console.log(`  Score: ${results.overall.score}%`);
      console.log(`  Compliant: ${results.overall.compliant ? '✅' : '❌'}\n`);
      
      if (results.overall.issues.length > 0) {
        console.log('⚠️  ISSUES TO FIX:');
        results.overall.issues.forEach(issue => {
          console.log(`  • ${issue}`);
        });
        console.log();
      }
      
      process.exit(results.overall.compliant ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    });
} 