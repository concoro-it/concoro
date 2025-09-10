// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import readline from 'readline';

// Initialize Firebase Admin with service account
const serviceAccountPath = path.resolve(process.cwd(), 'concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json');
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
) as ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get Firestore instance
const db = admin.firestore();

// Helper function to parse date from various formats
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  try {
    // Handle Firebase Timestamp format
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }
    
    // Handle string dates
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Handle Date objects
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error, dateValue);
    return null;
  }
}

// Function to delete concorsi within date range
async function deleteConcorsiByDateRange(startDate: Date, endDate: Date) {
  try {
    console.log(`Starting deletion of concorsi from ${startDate.toLocaleDateString('it-IT')} to ${endDate.toLocaleDateString('it-IT')}`);
    
    const concorsiCollection = db.collection('concorsi');
    
    // Get all concorsi documents
    const snapshot = await concorsiCollection.get();
    
    if (snapshot.empty) {
      console.log('No concorsi found in the collection');
      return 0;
    }
    
    console.log(`Found ${snapshot.size} total concorsi documents`);
    
    const batchSize = 500;
    let operationsCount = 0;
    let successCount = 0;
    let skippedCount = 0;
    let batch = db.batch();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check multiple date fields to determine if the concorso falls within the range
      // Priority: publication_date > createdAt > DataApertura
      let relevantDate: Date | null = null;
      
      if (data.publication_date) {
        relevantDate = parseDate(data.publication_date);
      }
      
      if (!relevantDate && data.createdAt) {
        relevantDate = parseDate(data.createdAt);
      }
      
      if (!relevantDate && data.DataApertura) {
        relevantDate = parseDate(data.DataApertura);
      }
      
      if (!relevantDate) {
        console.log(`Skipping concorso ${doc.id} - no valid date found`);
        skippedCount++;
        continue;
      }
      
      // Check if the date falls within our range
      if (relevantDate >= startDate && relevantDate <= endDate) {
        console.log(`Marking for deletion: ${doc.id} (${data.Titolo || 'No title'}) - Date: ${relevantDate.toLocaleDateString('it-IT')}`);
        
        batch.delete(doc.ref);
        operationsCount++;
        
        // Commit batch when it reaches the limit
        if (operationsCount >= batchSize) {
          await batch.commit();
          console.log(`Committed batch of ${operationsCount} deletions`);
          
          successCount += operationsCount;
          operationsCount = 0;
          batch = db.batch();
        }
      } else {
        skippedCount++;
      }
    }
    
    // Commit any remaining operations
    if (operationsCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationsCount} deletions`);
      successCount += operationsCount;
    }
    
    console.log(`\nDeletion completed:`);
    console.log(`- Successfully deleted: ${successCount} concorsi`);
    console.log(`- Skipped (outside date range or no date): ${skippedCount} concorsi`);
    console.log(`- Total processed: ${snapshot.size} concorsi`);
    
    return successCount;
  } catch (error) {
    console.error('Error deleting concorsi:', error);
    throw error;
  }
}

// Function to perform a dry run (count only, no deletion)
async function dryRunConcorsiByDateRange(startDate: Date, endDate: Date) {
  try {
    console.log(`Starting DRY RUN - analyzing concorsi from ${startDate.toLocaleDateString('it-IT')} to ${endDate.toLocaleDateString('it-IT')}`);
    
    const concorsiCollection = db.collection('concorsi');
    
    // Get all concorsi documents
    const snapshot = await concorsiCollection.get();
    
    if (snapshot.empty) {
      console.log('No concorsi found in the collection');
      return { toDelete: 0, toSkip: 0, samples: [] };
    }
    
    console.log(`Found ${snapshot.size} total concorsi documents`);
    
    let toDeleteCount = 0;
    let toSkipCount = 0;
    const sampleConcorsi: any[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check multiple date fields to determine if the concorso falls within the range
      // Priority: publication_date > createdAt > DataApertura
      let relevantDate: Date | null = null;
      let dateSource = '';
      
      if (data.publication_date) {
        relevantDate = parseDate(data.publication_date);
        dateSource = 'publication_date';
      }
      
      if (!relevantDate && data.createdAt) {
        relevantDate = parseDate(data.createdAt);
        dateSource = 'createdAt';
      }
      
      if (!relevantDate && data.DataApertura) {
        relevantDate = parseDate(data.DataApertura);
        dateSource = 'DataApertura';
      }
      
      if (!relevantDate) {
        toSkipCount++;
        continue;
      }
      
      // Check if the date falls within our range
      if (relevantDate >= startDate && relevantDate <= endDate) {
        toDeleteCount++;
        
        // Collect sample data for review (first 10)
        if (sampleConcorsi.length < 10) {
          sampleConcorsi.push({
            id: doc.id,
            title: data.Titolo || 'No title',
            ente: data.Ente || 'No ente',
            date: relevantDate.toLocaleDateString('it-IT'),
            dateSource: dateSource
          });
        }
      } else {
        toSkipCount++;
      }
    }
    
    return { toDelete: toDeleteCount, toSkip: toSkipCount, samples: sampleConcorsi };
  } catch (error) {
    console.error('Error in dry run:', error);
    throw error;
  }
}

// Main function to execute the script
async function main() {
  try {
    // Check command line arguments for dry run
    const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
    
    // Set the date range: June 13th, 2025 to today
    const startDate = new Date('2025-06-13');
    startDate.setHours(0, 0, 0, 0); // Start of June 13th
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    
    console.log('='.repeat(60));
    console.log(isDryRun ? 'CONCORSI DELETION DRY RUN' : 'CONCORSI BULK DELETION SCRIPT');
    console.log('='.repeat(60));
    console.log(`Date range: ${startDate.toLocaleDateString('it-IT')} to ${endDate.toLocaleDateString('it-IT')}`);
    console.log('');
    
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No deletions will be performed');
      console.log('This will analyze and show what would be deleted');
      console.log('');
      
      const dryRunResult = await dryRunConcorsiByDateRange(startDate, endDate);
      
      console.log('');
      console.log('='.repeat(60));
      console.log('DRY RUN RESULTS:');
      console.log('='.repeat(60));
      console.log(`📊 Concorsi that WOULD BE DELETED: ${dryRunResult.toDelete}`);
      console.log(`📊 Concorsi that would be SKIPPED: ${dryRunResult.toSkip}`);
      console.log('');
      
      if (dryRunResult.samples.length > 0) {
        console.log('📋 Sample concorsi that would be deleted:');
        console.log('-'.repeat(40));
        dryRunResult.samples.forEach((sample, index) => {
          console.log(`${index + 1}. ${sample.title}`);
          console.log(`   Ente: ${sample.ente}`);
          console.log(`   Date: ${sample.date} (from ${sample.dateSource})`);
          console.log(`   ID: ${sample.id}`);
          console.log('');
        });
        
        if (dryRunResult.toDelete > dryRunResult.samples.length) {
          console.log(`... and ${dryRunResult.toDelete - dryRunResult.samples.length} more concorsi`);
        }
      }
      
      console.log('');
      console.log('To perform the actual deletion, run the script without --dry-run flag');
      console.log('='.repeat(60));
      
    } else {
      // Ask for confirmation
      console.log('⚠️  WARNING: This will permanently delete concorsi from the database!');
      console.log('This action cannot be undone.');
      console.log('');
      console.log('💡 TIP: Run with --dry-run flag first to see what would be deleted');
      console.log('');
      
      // For safety, require manual confirmation
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('Are you sure you want to proceed? Type "YES" to confirm: ', resolve);
      });
      
      rl.close();
      
      if (answer !== 'YES') {
        console.log('Operation cancelled by user.');
        process.exit(0);
      }
      
      console.log('Starting deletion process...');
      console.log('');
      
      const deletedCount = await deleteConcorsiByDateRange(startDate, endDate);
      
      console.log('');
      console.log('='.repeat(60));
      console.log(`✅ Deletion completed successfully!`);
      console.log(`Total concorsi deleted: ${deletedCount}`);
      console.log('='.repeat(60));
    }
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

// Execute the script
main(); 