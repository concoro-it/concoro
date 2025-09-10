/**
 * SEO Validation Script for Concoro Guest Pages
 * Run: npm run seo-validate
 */

import { promises as fs } from 'fs'
import path from 'path'

interface SEOValidationResult {
  file: string
  hasMetadata: boolean
  hasTitle: boolean
  hasDescription: boolean
  hasStructuredData: boolean
  issues: string[]
}

async function validateSEOImplementation(): Promise<void> {
  console.log('🔍 Validating SEO Implementation for Guest Pages...\n')
  
  const appDir = path.join(process.cwd(), 'src/app')
  const results: SEOValidationResult[] = []
  
  // Pages to check
  const pagesToCheck = [
    '(homepage)/layout.tsx', // Homepage
    'bandi/layout.tsx',      // Bandi layout
    'blog/layout.tsx',       // Blog layout  
    'chi-siamo/layout.tsx',  // About layout
    'prezzi/page.tsx',       // Pricing
    'contatti/layout.tsx',   // Contact layout
    'faq/layout.tsx',        // FAQ layout
  ]
  
  for (const pagePath of pagesToCheck) {
    const fullPath = path.join(appDir, pagePath)
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8')
      const result = await validatePageSEO(pagePath, content)
      results.push(result)
    } catch (error) {
      console.log(`⚠️  File not found: ${pagePath}`)
    }
  }
  
  // Print results
  console.log('📊 SEO Validation Results:\n')
  
  let totalScore = 0
  let maxScore = 0
  
  results.forEach(result => {
    const score = calculateScore(result)
    totalScore += score
    maxScore += 100
    
    const emoji = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌'
    console.log(`${emoji} ${result.file} (${score}/100)`)
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   • ${issue}`)
      })
    }
    console.log()
  })
  
  const overallScore = Math.round((totalScore / maxScore) * 100)
  console.log(`🎯 Overall SEO Score: ${overallScore}/100`)
  
  if (overallScore >= 90) {
    console.log('🎉 Excellent SEO implementation!')
  } else if (overallScore >= 70) {
    console.log('👍 Good SEO implementation with room for improvement')
  } else {
    console.log('⚠️  SEO implementation needs attention')
  }
}

async function validatePageSEO(filePath: string, content: string): Promise<SEOValidationResult> {
  const result: SEOValidationResult = {
    file: filePath,
    hasMetadata: false,
    hasTitle: false,
    hasDescription: false,
    hasStructuredData: false,
    issues: []
  }
  
  // Check for metadata export
  if (content.includes('export const metadata') || content.includes('export async function generateMetadata')) {
    result.hasMetadata = true
  } else {
    result.issues.push('Missing metadata export')
  }
  
  // Check for SEO utility imports
  if (content.includes('guest-seo-utils')) {
    result.hasTitle = true
    result.hasDescription = true
  } else if (result.hasMetadata) {
    // Check for manual title/description
    if (content.includes('title:')) {
      result.hasTitle = true
    } else {
      result.issues.push('Missing title in metadata')
    }
    
    if (content.includes('description:')) {
      result.hasDescription = true
    } else {
      result.issues.push('Missing description in metadata')
    }
  }
  
  // Check for structured data
  if (content.includes('application/ld+json') || content.includes('StructuredData')) {
    result.hasStructuredData = true
  }
  
  // Specific checks
  if (filePath.includes('page.tsx') && filePath !== 'page.tsx') {
    // Check if it's a client component that should use layout
    if (content.includes('"use client"') && !result.hasMetadata) {
      result.issues.push('Client component should use layout.tsx for SEO metadata')
    }
  }
  
  return result
}

function calculateScore(result: SEOValidationResult): number {
  let score = 100
  
  if (!result.hasMetadata) score -= 30
  if (!result.hasTitle) score -= 25
  if (!result.hasDescription) score -= 25
  if (!result.hasStructuredData) score -= 10
  
  // Deduct points for each issue
  score -= result.issues.length * 5
  
  return Math.max(0, score)
}

// Run validation
validateSEOImplementation().catch(console.error)
