/**
 * Script to fix canonical duplicates and regenerate slugs for existing articles
 * This addresses the "Duplicate, Google chose different canonical than user" issue
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore'
import { generateSlug } from '../lib/utils/slug-utils'
import { validateArticoloCanonical } from '../lib/utils/articolo-canonical-utils'

// Firebase config (use your actual config)
const firebaseConfig = {
  // Add your config here
}

interface ArticleData {
  id: string
  articolo_title: string
  articolo_tags?: string[]
  publication_date?: any
  slug?: string
  concorso_id: string
}

async function fixCanonicalDuplicates() {
  console.log('🔧 Starting canonical duplicates fix...')
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  
  try {
    // Get all articles
    console.log('📥 Fetching all articles...')
    const articlesRef = collection(db, 'articoli')
    const snapshot = await getDocs(articlesRef)
    
    const articles: ArticleData[] = []
    snapshot.forEach(doc => {
      articles.push({
        id: doc.id,
        ...doc.data()
      } as ArticleData)
    })
    
    console.log(`📊 Found ${articles.length} articles`)
    
    // Find and fix issues
    let fixed = 0
    let duplicateSlugCount = 0
    let missingSlugCount = 0
    
    // Group articles by slug to find duplicates
    const slugGroups = new Map<string, ArticleData[]>()
    
    for (const article of articles) {
      // Check for missing slugs
      if (!article.slug) {
        missingSlugCount++
        console.log(`🔍 Article ${article.id} missing slug: "${article.articolo_title}"`)
        
        // Generate new slug
        if (article.articolo_tags && article.publication_date) {
          try {
            const newSlug = generateSlug({
              articolo_tags: article.articolo_tags,
              publication_date: article.publication_date,
              articolo_title: article.articolo_title
            })
            
            console.log(`✨ Generated slug: ${newSlug}`)
            
            // Update in Firestore
            const articleRef = doc(db, 'articoli', article.id)
            await updateDoc(articleRef, { slug: newSlug })
            
            fixed++
            console.log(`✅ Updated article ${article.id} with slug: ${newSlug}`)
          } catch (error) {
            console.error(`❌ Error generating slug for ${article.id}:`, error)
          }
        }
      } else {
        // Group by slug to find duplicates
        if (!slugGroups.has(article.slug)) {
          slugGroups.set(article.slug, [])
        }
        slugGroups.get(article.slug)!.push(article)
      }
      
      // Validate canonical data (only for articles with required fields)
      if (article.slug) {
        const validationErrors = validateArticoloCanonical(article as any)
        if (validationErrors.length > 0) {
          console.log(`⚠️  Validation issues for ${article.id}:`, validationErrors)
        }
      }
    }
    
    // Handle duplicate slugs
    for (const [slug, duplicateArticles] of slugGroups.entries()) {
      if (duplicateArticles.length > 1) {
        duplicateSlugCount += duplicateArticles.length
        console.log(`🔄 Found ${duplicateArticles.length} articles with duplicate slug: ${slug}`)
        
        // Keep the oldest article with the original slug, regenerate others
        const sortedByDate = duplicateArticles.sort((a, b) => {
          const dateA = a.publication_date?.seconds || 0
          const dateB = b.publication_date?.seconds || 0
          return dateA - dateB
        })
        
        for (let i = 1; i < sortedByDate.length; i++) {
          const article = sortedByDate[i]
          try {
            const newSlug = generateSlug({
              articolo_tags: article.articolo_tags || [],
              publication_date: article.publication_date,
              articolo_title: article.articolo_title
            })
            
            // Ensure uniqueness by adding suffix if needed
            let uniqueSlug = newSlug
            let counter = 1
            
            while (slugGroups.has(uniqueSlug) && slugGroups.get(uniqueSlug)!.some(a => a.id !== article.id)) {
              uniqueSlug = `${newSlug}-${counter}`
              counter++
            }
            
            console.log(`🔧 Regenerating slug for ${article.id}: ${slug} → ${uniqueSlug}`)
            
            // Update in Firestore
            const articleRef = doc(db, 'articoli', article.id)
            await updateDoc(articleRef, { slug: uniqueSlug })
            
            fixed++
          } catch (error) {
            console.error(`❌ Error fixing duplicate slug for ${article.id}:`, error)
          }
        }
      }
    }
    
    console.log('📈 Summary:')
    console.log(`  • Articles processed: ${articles.length}`)
    console.log(`  • Missing slugs found: ${missingSlugCount}`)
    console.log(`  • Duplicate slugs found: ${duplicateSlugCount}`)
    console.log(`  • Articles fixed: ${fixed}`)
    console.log('✅ Canonical duplicates fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing canonical duplicates:', error)
  }
}

// Run the script
if (require.main === module) {
  fixCanonicalDuplicates()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { fixCanonicalDuplicates }
