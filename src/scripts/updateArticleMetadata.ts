import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * Script to update existing articles with metadata from their concorso records
 * This populates categoria, settore_professionale, and AreaGeografica fields
 */
async function updateArticleMetadata() {
  try {
    // Initialize Firebase Admin
    const db = initializeFirebaseAdmin();
    
    console.log('🔄 Starting article metadata update...');

    // Get all articles
    const articoliSnapshot = await db.collection('articoli').get();
    
    if (articoliSnapshot.empty) {
      console.log('❌ No articles found');
      return;
    }

    console.log(`📝 Found ${articoliSnapshot.size} articles to process`);

    // Process articles in batches of 500 (Firestore limit)
    const batchSize = 500;
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;

    for (const articleDoc of articoliSnapshot.docs) {
      const articleData = articleDoc.data();
      const articleId = articleDoc.id;
      
      // Skip if metadata already exists
      if (articleData.categoria && articleData.AreaGeografica) {
        console.log(`⏭️  Skipping ${articleId} - metadata already exists`);
        continue;
      }

      try {
        // Fetch concorso data
        const concorsoSnap = await db.collection('concorsi').doc(articleData.concorso_id).get();
        
        if (!concorsoSnap.exists) {
          console.warn(`⚠️  Concorso ${articleData.concorso_id} not found for article ${articleId}`);
          continue;
        }
        
        const concorsoData = concorsoSnap.data();
        
        // Prepare update data
        const updateData: any = {
          updatedAt: new Date(),
        };
        
        if (concorsoData?.categoria && concorsoData.categoria !== 'undefined' && !articleData.categoria) {
          updateData.categoria = concorsoData.categoria;
        }
        
        if (concorsoData?.settore_professionale && concorsoData.settore_professionale !== 'undefined' && !articleData.settore_professionale) {
          updateData.settore_professionale = concorsoData.settore_professionale;
        }
        
        if (concorsoData?.AreaGeografica && concorsoData.AreaGeografica !== 'undefined' && !articleData.AreaGeografica) {
          updateData.AreaGeografica = concorsoData.AreaGeografica;
        }
        
        // Only update if we have new data
        if (Object.keys(updateData).length > 1) { // More than just updatedAt
          const articleRef = db.collection('articoli').doc(articleId);
          currentBatch.update(articleRef, updateData);
          operationCount++;
          
          console.log(`✅ Queued update for ${articleId}:`, updateData);
          
          // Create new batch if current one is full
          if (operationCount >= batchSize) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            operationCount = 0;
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing article ${articleId}:`, error);
      }
    }
    
    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    console.log(`📦 Executing ${batches.length} batches...`);
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`✅ Batch ${i + 1}/${batches.length} committed`);
    }
    
    console.log('🎉 Article metadata update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating article metadata:', error);
    throw error;
  }
}

// Export for external usage
export { updateArticleMetadata };

// Run the script if executed directly
if (require.main === module) {
  updateArticleMetadata()
    .then(() => {
      console.log('✨ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
} 