import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { generateSlug } from '../lib/utils/slug-utils';
import { Articolo } from '../types';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  try {
    // Load service account
    const serviceAccountPath = path.resolve(process.cwd(), 'concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at: ${serviceAccountPath}`);
    }
    
    // Read and parse the service account file
    const serviceAccountJson = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8')
    );
    
    // Convert snake_case to camelCase for compatibility with Firebase Admin SDK
    const serviceAccount: ServiceAccount = {
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key
    };
    
    // Initialize Firebase Admin if not already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
    
    return admin.firestore();
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

async function generateSlugsForExistingArticles() {
  try {
    console.log('🚀 Starting slug generation for existing articles...');
    
    // Initialize Firebase Admin
    const db = initializeFirebaseAdmin();
    
    // Get all articles that don't have a slug yet
    const articoliRef = db.collection('articoli');
    const snapshot = await articoliRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No articles found');
      return;
    }
    
    const articles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Articolo));
    
    console.log(`📄 Found ${articles.length} articles`);
    
    const articlesWithoutSlugs = articles.filter(article => !article.slug);
    console.log(`🔍 ${articlesWithoutSlugs.length} articles need slugs`);
    
    if (articlesWithoutSlugs.length === 0) {
      console.log('✅ All articles already have slugs!');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const slugs = new Set<string>(); // Track used slugs to avoid duplicates
    
    for (const article of articlesWithoutSlugs) {
      try {
        if (!article.articolo_tags || !article.publication_date) {
          console.log(`⚠️  Skipping article ${article.id}: missing required fields`);
          continue;
        }
        
        // Generate initial slug (generateSlug will handle date format conversion)
        let slug = generateSlug({
          articolo_tags: article.articolo_tags,
          publication_date: article.publication_date,
          articolo_title: article.articolo_title,
        });
        
        // Ensure slug uniqueness
        let uniqueSlug = slug;
        let counter = 1;
        while (slugs.has(uniqueSlug)) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }
        
        // Check if slug already exists in database
        const existingQuery = await articoliRef.where('slug', '==', uniqueSlug).limit(1).get();
        
        if (!existingQuery.empty) {
          // If slug exists, append counter
          let dbCounter = 1;
          let dbUniqueSlug = `${slug}-${dbCounter}`;
          
          while (true) {
            const checkQuery = await articoliRef.where('slug', '==', dbUniqueSlug).limit(1).get();
            
            if (checkQuery.empty) {
              uniqueSlug = dbUniqueSlug;
              break;
            }
            
            dbCounter++;
            dbUniqueSlug = `${slug}-${dbCounter}`;
          }
        }
        
        // Update the article with the slug
        const articleRef = db.collection('articoli').doc(article.id);
        await articleRef.update({
          slug: uniqueSlug,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        slugs.add(uniqueSlug);
        successCount++;
        
        console.log(`✅ Generated slug for "${article.articolo_title}": ${uniqueSlug}`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error generating slug for article ${article.id}:`, error);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully generated ${successCount} slugs`);
    console.log(`❌ Failed to generate ${errorCount} slugs`);
    console.log(`📄 Total articles processed: ${articlesWithoutSlugs.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Slug generation completed successfully!');
      console.log('💡 All articles now have SEO-friendly URLs');
    }
    
  } catch (error) {
    console.error('❌ Error in slug generation script:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateSlugsForExistingArticles()
    .then(() => {
      console.log('🏁 Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default generateSlugsForExistingArticles; 