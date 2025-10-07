"use client"

// Firebase configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// Lazy load Firebase Analytics and Messaging to reduce initial bundle size
// These will be loaded only when actually needed

// Simplified environment check - only in development
const validateEnvVars = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: Firebase API key is missing!');
    }
  }
};

// Only validate in development
if (process.env.NODE_ENV === 'development') {
  validateEnvVars();
}

// Initialize Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate config before initialization
const isValidConfig = (config: typeof firebaseConfig): boolean => {
  // API key format validation (basic check)
  const apiKeyRegex = /^AIza[0-9A-Za-z_-]{35}$/;
  const isApiKeyFormatValid = config.apiKey ? apiKeyRegex.test(config.apiKey) : false;
  
  if (config.apiKey && !isApiKeyFormatValid) {
    console.error('Firebase API key format appears invalid. API keys should start with "AIza" and be 39 characters long.');
  }
  
  const hasRequiredFields = !!(config.apiKey && config.authDomain && config.projectId);
  
  return hasRequiredFields && isApiKeyFormatValid;
};

// Only log config status in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!isValidConfig(firebaseConfig)) {
    console.error('Firebase configuration is invalid or incomplete');
  }
}

// Lazy initialization pattern for Firebase services
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firebaseDb: Firestore | undefined;
let firebaseStorage: FirebaseStorage | undefined;
let firebaseAnalytics: any | undefined;
let firebaseMessaging: any | undefined;

// Get Firebase app - initialize if needed
function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase cannot be initialized on server side');
  }

  if (!isValidConfig(firebaseConfig)) {
    console.error('Invalid Firebase configuration. Required fields missing:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId
    });
    throw new Error('Invalid Firebase configuration');
  }

  if (!firebaseApp) {
    try {
      // Initialize Firebase app if not already initialized
      if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
        
      } else {
        firebaseApp = getApps()[0];
        
      }
    } catch (error) {
      console.error('Error initializing Firebase app:', error);
      throw error;
    }
  }
  
  return firebaseApp;
}

// Auth with lazy initialization
export function getFirebaseAuth(): Auth {
  
  if (!firebaseAuth) {
    try {
      const app = getFirebaseApp();
      
      firebaseAuth = getAuth(app);
      
      // Set persistence asynchronously to avoid blocking auth initialization
      if (typeof window !== 'undefined') {
        setPersistence(firebaseAuth, browserLocalPersistence)
          .catch(error => {
            console.error('getFirebaseAuth: Error setting auth persistence:', error);
            // Don't throw here, just log the error
          });
      }
    } catch (error) {
      console.error('getFirebaseAuth: Error initializing Firebase Auth:', error);
      throw error;
    }
  }
  return firebaseAuth;
}

// Firestore with lazy initialization
export function getFirebaseFirestore(): Firestore {
  if (!firebaseDb) {
    try {
      const app = getFirebaseApp();
      firebaseDb = getFirestore(app);
      
    } catch (error) {
      console.error('Error initializing Firestore:', error);
      throw error;
    }
  }
  return firebaseDb;
}

// Storage with lazy initialization
export function getFirebaseStorage(): FirebaseStorage {
  if (!firebaseStorage) {
    try {
      const app = getFirebaseApp();
      firebaseStorage = getStorage(app);
      
    } catch (error) {
      console.error('Error initializing Firebase Storage:', error);
      throw error;
    }
  }
  return firebaseStorage;
}

// Analytics with lazy initialization and dynamic import (client-side only)
export async function getFirebaseAnalytics(): Promise<any | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Don't initialize during hydration to prevent mismatches
  if (typeof window !== 'undefined' && !document.readyState) {
    return null;
  }
  
  if (!firebaseAnalytics) {
    try {
      // Dynamically import Firebase Analytics to reduce initial bundle
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      
      const app = getFirebaseApp();
      const supported = await isSupported();
      
      if (supported && document.readyState === 'complete') {
        firebaseAnalytics = getAnalytics(app);
        
      }
    } catch (error) {
      console.error('Error initializing Firebase Analytics:', error);
    }
  }
  return firebaseAnalytics || null;
}

// Messaging with lazy initialization and dynamic import (client-side only)
export async function getFirebaseMessaging(): Promise<any | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  
  if (!firebaseMessaging) {
    try {
      // Dynamically import Firebase Messaging to reduce initial bundle
      const { getMessaging } = await import('firebase/messaging');
      
      const app = getFirebaseApp();
      firebaseMessaging = getMessaging(app);
      
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error);
    }
  }
  return firebaseMessaging || null;
}

// Create backward-compatible exports
let app: FirebaseApp;
let auth: Auth;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
// Analytics and messaging are now async - use getFirebaseAnalytics() and getFirebaseMessaging()
let analytics: any | null = null;
let messaging: any | null = null;

// Initialize on the client side only
if (typeof window !== 'undefined') {
  try {
    app = getFirebaseApp();
    auth = getFirebaseAuth();
    db = getFirebaseFirestore();
    storage = getFirebaseStorage();
    // Analytics and messaging init is deferred
  } catch (error) {
    console.error('Error during Firebase initialization:', error);
  }
}

export { app, auth, db, storage, analytics, messaging }; 