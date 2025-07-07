import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import fs from 'fs';
import path from 'path';

async function main() {
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
    
    
    
    
    
    // Initialize Firebase Admin
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
      });
      
    }
    
    // Get Firestore instance
    const db = admin.firestore();
    
    
    // Try to list collections (this will fail if database doesn't exist)
    
    try {
      const collections = await db.listCollections();
      
      for (const collection of collections) {
        
      }
      
      if (collections.length === 0) {
        
      }
    } catch (error) {
      console.error('Error listing collections:', error);
      
      
    }
    
    // Try to create a test document
    
    try {
      const testRef = db.collection('test').doc('test-doc');
      await testRef.set({
        message: 'This is a test document',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      
      // Read the document back
      const doc = await testRef.get();
      
      
      // Delete the test document
      await testRef.delete();
      
    } catch (error) {
      console.error('Error creating test document:', error);
      
    }
    
  } catch (error) {
    console.error('Error in diagnostic script:', error);
  }
}

main(); 