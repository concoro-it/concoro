/**
 * Validation script for canonical implementation
 * Tests all aspects of the canonicalization fix
 */

import { validateArticoloCanonical, getArticoloCanonicalUrl, shouldRedirectToCanonical } from '../lib/utils/articolo-canonical-utils'
import { generateSlug, isDocumentId } from '../lib/utils/slug-utils'
import { Articolo } from '../types'

interface TestArticle extends Partial<Articolo> {
  id: string
  articolo_title: string
  slug?: string
}

function runCanonicalValidationTests() {
  console.log('🧪 Running canonical implementation validation tests...\n')
  
  // Test data
  const testArticles: TestArticle[] = [
    {
      id: 'abcd1234567890123456',
      articolo_title: 'Concorso Istruttore Amministrativo Milano',
      slug: 'istruttore-amministrativo-milano-2025'
    },
    {
      id: 'efgh1234567890123456',
      articolo_title: 'Concorso Dirigente Roma',
      slug: undefined // Missing slug
    },
    {
      id: 'ijkl1234567890123456',
      articolo_title: 'Concorso Tecnico Informatico',
      slug: 'ijkl1234567890123456' // Slug is same as ID - problematic
    }
  ]
  
  let passedTests = 0
  let totalTests = 0
  
  // Test 1: Canonical URL generation
  console.log('1️⃣ Testing canonical URL generation...')
  totalTests++
  try {
    const article = testArticles[0] as Articolo
    const canonicalUrl = getArticoloCanonicalUrl(article)
    const expectedUrl = 'https://www.concoro.it/articolo/istruttore-amministrativo-milano-2025'
    
    if (canonicalUrl === expectedUrl) {
      console.log('✅ Canonical URL generation: PASSED')
      passedTests++
    } else {
      console.log(`❌ Canonical URL generation: FAILED`)
      console.log(`   Expected: ${expectedUrl}`)
      console.log(`   Got: ${canonicalUrl}`)
    }
  } catch (error) {
    console.log(`❌ Canonical URL generation: ERROR - ${error}`)
  }
  
  // Test 2: Validation function
  console.log('\n2️⃣ Testing validation function...')
  totalTests++
  try {
    const validArticle = testArticles[0] as Articolo
    const invalidArticle = testArticles[1] as Articolo
    
    const validErrors = validateArticoloCanonical(validArticle)
    const invalidErrors = validateArticoloCanonical(invalidArticle)
    
    if (validErrors.length === 0 && invalidErrors.length > 0) {
      console.log('✅ Validation function: PASSED')
      console.log(`   Valid article errors: ${validErrors.length}`)
      console.log(`   Invalid article errors: ${invalidErrors.length}`)
      passedTests++
    } else {
      console.log(`❌ Validation function: FAILED`)
      console.log(`   Valid article errors: ${validErrors}`)
      console.log(`   Invalid article errors: ${invalidErrors}`)
    }
  } catch (error) {
    console.log(`❌ Validation function: ERROR - ${error}`)
  }
  
  // Test 3: Redirect logic
  console.log('\n3️⃣ Testing redirect logic...')
  totalTests++
  try {
    const article = testArticles[0] as Articolo
    
    // Should redirect when accessing by ID
    const shouldRedirectFromId = shouldRedirectToCanonical(article.id, article)
    // Should not redirect when accessing by slug
    const shouldRedirectFromSlug = shouldRedirectToCanonical(article.slug!, article)
    
    if (shouldRedirectFromId && !shouldRedirectFromSlug) {
      console.log('✅ Redirect logic: PASSED')
      console.log(`   Redirect from ID: ${shouldRedirectFromId}`)
      console.log(`   Redirect from slug: ${shouldRedirectFromSlug}`)
      passedTests++
    } else {
      console.log(`❌ Redirect logic: FAILED`)
      console.log(`   Redirect from ID: ${shouldRedirectFromId} (should be true)`)
      console.log(`   Redirect from slug: ${shouldRedirectFromSlug} (should be false)`)
    }
  } catch (error) {
    console.log(`❌ Redirect logic: ERROR - ${error}`)
  }
  
  // Test 4: Document ID detection
  console.log('\n4️⃣ Testing document ID detection...')
  totalTests++
  try {
    const validId = 'abcd1234567890123456'
    const validSlug = 'istruttore-amministrativo-milano-2025'
    
    const isIdDetectedCorrectly = isDocumentId(validId)
    const isSlugDetectedCorrectly = !isDocumentId(validSlug)
    
    if (isIdDetectedCorrectly && isSlugDetectedCorrectly) {
      console.log('✅ Document ID detection: PASSED')
      console.log(`   ID detected as ID: ${isIdDetectedCorrectly}`)
      console.log(`   Slug detected as slug: ${isSlugDetectedCorrectly}`)
      passedTests++
    } else {
      console.log(`❌ Document ID detection: FAILED`)
      console.log(`   ID detected as ID: ${isIdDetectedCorrectly} (should be true)`)
      console.log(`   Slug detected as slug: ${isSlugDetectedCorrectly} (should be true)`)
    }
  } catch (error) {
    console.log(`❌ Document ID detection: ERROR - ${error}`)
  }
  
  // Test 5: Slug generation enhancement
  console.log('\n5️⃣ Testing enhanced slug generation...')
  totalTests++
  try {
    const slugData = {
      articolo_tags: ['istruttore amministrativo', 'milano', 'lombardia'],
      publication_date: { seconds: 1640995200, nanoseconds: 0 }, // 2022 timestamp
      articolo_title: 'Concorso per Istruttore Amministrativo presso Comune di Milano'
    }
    
    const generatedSlug = generateSlug(slugData)
    
    // Should contain role, location, and year
    const hasRole = generatedSlug.includes('istruttore')
    const hasLocation = generatedSlug.includes('milano')
    const hasYear = generatedSlug.includes('2022')
    
    if (hasRole && hasLocation && hasYear) {
      console.log('✅ Enhanced slug generation: PASSED')
      console.log(`   Generated slug: ${generatedSlug}`)
      console.log(`   Contains role: ${hasRole}`)
      console.log(`   Contains location: ${hasLocation}`)
      console.log(`   Contains year: ${hasYear}`)
      passedTests++
    } else {
      console.log(`❌ Enhanced slug generation: FAILED`)
      console.log(`   Generated slug: ${generatedSlug}`)
      console.log(`   Contains role: ${hasRole} (should be true)`)
      console.log(`   Contains location: ${hasLocation} (should be true)`)
      console.log(`   Contains year: ${hasYear} (should be true)`)
    }
  } catch (error) {
    console.log(`❌ Enhanced slug generation: ERROR - ${error}`)
  }
  
  // Summary
  console.log('\n📊 Test Summary:')
  console.log(`   Tests passed: ${passedTests}/${totalTests}`)
  console.log(`   Success rate: ${(passedTests / totalTests * 100).toFixed(1)}%`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Canonical implementation is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.')
  }
  
  return passedTests === totalTests
}

// Additional diagnostic function
function diagnoseCanonicalizationIssues() {
  console.log('\n🔍 Canonical Implementation Checklist:')
  console.log('━'.repeat(50))
  
  const checklist = [
    '✅ Server-side canonical tags implemented in layout.tsx',
    '✅ Consistent internal linking using getCanonicalUrlParam()',
    '✅ Server-side redirects for ID-based URLs',
    '✅ Enhanced slug generation with uniqueness factors',
    '✅ Sitemap only includes canonical URLs',
    '✅ Robots meta tags for non-canonical pages',
    '✅ Validation utilities for ongoing monitoring'
  ]
  
  checklist.forEach(item => console.log(`   ${item}`))
  
  console.log('\n📋 Manual verification needed:')
  console.log('   1. Check Google Search Console for canonical conflicts')
  console.log('   2. Verify sitemap.xml only contains slug-based URLs')
  console.log('   3. Test redirects: /articolo/[ID] → /articolo/[slug]')
  console.log('   4. Validate structured data includes canonical URLs')
  console.log('   5. Monitor for new duplicate content issues')
}

// Run tests if called directly
if (require.main === module) {
  const success = runCanonicalValidationTests()
  diagnoseCanonicalizationIssues()
  
  if (!success) {
    process.exit(1)
  }
}

export { runCanonicalValidationTests, diagnoseCanonicalizationIssues }

