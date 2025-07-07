// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

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

// Function to remove lowercase 'stato' field from all job documents
async function removeStatoField() {
  try {
    
    
    const concorsiCollection = db.collection('concorsi');
    const snapshot = await concorsiCollection.get();
    
    if (snapshot.empty) {
      
      return 0;
    }

    const batchSize = 500;
    let operationsCount = 0;
    let totalProcessed = 0;
    let batch = db.batch();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Only process documents that have the lowercase 'stato' field
      if ('stato' in data) {
        const docRef = concorsiCollection.doc(doc.id);
        
        // Remove the lowercase 'stato' field
        batch.update(docRef, {
          'stato': admin.firestore.FieldValue.delete()
        });
        
        operationsCount++;
        totalProcessed++;
        
        if (operationsCount >= batchSize) {
          await batch.commit();
          
          operationsCount = 0;
          batch = db.batch();
        }
      }
    }
    
    if (operationsCount > 0) {
      await batch.commit();
      
    }
    
    
    return totalProcessed;
  } catch (error) {
    console.error('Error removing stato field:', error);
    throw error;
  }
}

// Main function to execute the script
async function main() {
  try {
    const processedCount = await removeStatoField();
    
    process.exit(0);
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

// Execute the script
main(); 