import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
export const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    try {
      // First try to load from service account file
      const serviceAccountPath = process.cwd() + '/concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json';
      
      try {
        // Try initializing with service account file
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        console.log('Firebase admin initialized with service account file');
      } catch (fileError: any) {
        console.warn('Failed to initialize with service account file, trying environment variables:', fileError.message);
        
        // Fallback to environment variables
        if (!process.env.FIREBASE_PRIVATE_KEY) {
          throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables');
        }
        if (!process.env.FIREBASE_CLIENT_EMAIL) {
          throw new Error('FIREBASE_CLIENT_EMAIL is not set in environment variables');
        }
        if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
          throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in environment variables');
        }

        // Parse the private key correctly
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        // Check if the key is surrounded by quotes and contains escaped newlines
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          // Remove surrounding quotes and parse JSON string
          privateKey = JSON.parse(privateKey);
        } else {
          // Handle direct format with escaped newlines
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          }),
        });
        console.log('Firebase admin initialized with environment variables');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }
  return admin.firestore();
};

export const getFirebaseAdmin = () => {
  return admin;
}; 