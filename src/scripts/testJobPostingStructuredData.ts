import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { generateJobPostingStructuredData, validateJobPostingData } from '@/lib/utils/jobposting-utils';
import { ArticoloWithConcorso } from '@/types';

/**
 * Test script to validate JobPosting structured data generation
 * Run with: npx tsx src/scripts/testJobPostingStructuredData.ts
 */
async function testJobPostingStructuredData() {
  try {
    console.log('🚀 Starting JobPosting structured data test...\n');

    // Initialize Firebase Admin
    const db = initializeFirebaseAdmin();
    
    // Get a sample of articles
    const articoliSnapshot = await db.collection('articoli').limit(5).get();
    
    if (articoliSnapshot.empty) {
      console.log('❌ No articles found in Firestore');
      return;
    }

    console.log(`📝 Testing ${articoliSnapshot.size} articles for JobPosting structured data:\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const articleDoc of articoliSnapshot.docs) {
      const articleData = articleDoc.data();
      const articleId = articleDoc.id;
      
      console.log(`\n📄 Testing article: ${articleId}`);
      console.log(`   Title: ${articleData.articolo_title?.substring(0, 60)}...`);
      
      try {
        // Fetch concorso data
        const concorsoSnap = await db.collection('concorsi').doc(articleData.concorso_id).get();
        
        if (!concorsoSnap.exists) {
          console.log(`   ⚠️  Concorso ${articleData.concorso_id} not found - skipping`);
          continue;
        }
        
        const concorsoData = concorsoSnap.data();
        
        // Create ArticoloWithConcorso object
        const articleWithConcorso: ArticoloWithConcorso = {
          ...articleData,
          id: articleId,
          concorso: {
            id: concorsoSnap.id,
            ...concorsoData
          }
        } as ArticoloWithConcorso;

        // Generate JobPosting structured data
        const jobPostingData = generateJobPostingStructuredData(articleWithConcorso);
        
        if (!jobPostingData) {
          console.log(`   ❌ Failed to generate JobPosting structured data`);
          errorCount++;
          continue;
        }
        
        // Validate the generated data
        const isValid = validateJobPostingData(jobPostingData);
        
        if (isValid) {
          console.log(`   ✅ JobPosting structured data generated and validated successfully`);
          console.log(`   📊 Job Title: ${jobPostingData.title}`);
          console.log(`   🏢 Organization: ${jobPostingData.hiringOrganization.name}`);
          console.log(`   📍 Location: ${jobPostingData.jobLocation.address.addressLocality || 'N/A'}, ${jobPostingData.jobLocation.address.addressCountry}`);
          console.log(`   📅 Date Posted: ${jobPostingData.datePosted}`);
          console.log(`   🔗 URL: ${jobPostingData.url}`);
          
          if (jobPostingData.validThrough) {
            console.log(`   ⏰ Valid Through: ${jobPostingData.validThrough}`);
          }
          
          if (jobPostingData.totalJobOpenings) {
            console.log(`   👥 Job Openings: ${jobPostingData.totalJobOpenings}`);
          }
          
          if (jobPostingData.employmentType) {
            console.log(`   💼 Employment Type: ${jobPostingData.employmentType.join(', ')}`);
          }
          
          if (jobPostingData.jobLocationType) {
            console.log(`   🏠 Location Type: ${jobPostingData.jobLocationType}`);
          }
          
          successCount++;
        } else {
          console.log(`   ❌ JobPosting structured data validation failed`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing article ${articleId}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success Rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (successCount > 0) {
      console.log(`\n🎉 JobPosting structured data implementation is working correctly!`);
      console.log(`\n📋 Next steps:`);
      console.log(`   1. Test your pages with Google's Rich Results Test: https://search.google.com/test/rich-results`);
      console.log(`   2. Submit your updated sitemap to Google Search Console`);
      console.log(`   3. Use the URL Inspection tool to test specific article pages`);
      console.log(`   4. Monitor your site's performance in Google for Jobs`);
    } else {
      console.log(`\n⚠️  No successful JobPosting structured data generated. Check your data and implementation.`);
    }

  } catch (error) {
    console.error('❌ Error during JobPosting structured data test:', error);
  }
}

// Run the test
testJobPostingStructuredData().catch(console.error); 