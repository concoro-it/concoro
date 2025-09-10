import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Cache the Firestore instance to avoid re-initialization
let cachedFirestore: admin.firestore.Firestore | null = null;

// Initialize Firebase Admin for server-side operations
export function initializeFirebaseAdminForSSR() {
  // Return cached instance if available
  if (cachedFirestore) {
    return cachedFirestore;
  }
  
  if (!admin.apps.length) {
    try {
      // First try service account file (more reliable than env vars)
      const serviceAccountPath = path.resolve(process.cwd(), 'concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
      } else {
        // Fallback to environment variables
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
          
          // Parse the private key correctly
          let privateKey = process.env.FIREBASE_PRIVATE_KEY;
          
          // Handle different formats of private key in environment
          if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = JSON.parse(privateKey);
          } else {
            privateKey = privateKey.replace(/\\n/g, '\n');
          }
          
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey
            }),
          });
          
        } else {
          throw new Error('SSR: No Firebase credentials found (neither service account file nor environment variables)');
        }
      }
    } catch (error: any) {
      console.error('SSR: Error initializing Firebase Admin:', error);
      throw new Error(`SSR: Firebase Admin initialization failed: ${error.message}`);
    }
  }
  
  // Cache the Firestore instance for reuse
  cachedFirestore = admin.firestore();
  
  return cachedFirestore;
}

// Get Firestore instance for SSR (with caching)
export function getFirestoreForSSR() {
  return initializeFirebaseAdminForSSR();
}
