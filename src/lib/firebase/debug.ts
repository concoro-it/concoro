/**
 * Firebase Debug Utility
 * 
 * This utility helps to identify Firebase initialization issues and track
 * service availability throughout the application lifecycle.
 */

import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { db, auth, storage } from './config';

type ServiceStatus = {
  isAvailable: boolean;
  lastChecked: Date;
  error?: string;
};

type FirebaseDebugState = {
  firestore: ServiceStatus;
  auth: ServiceStatus;
  storage: ServiceStatus;
  environment: {
    isServer: boolean;
    hasRequiredEnvVars: boolean;
    missingEnvVars: string[];
  };
};

/**
 * Checks if Firebase services are initialized and available
 */
export function checkFirebaseServices(): FirebaseDebugState {
  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );
  
  const hasRequiredEnvVars = missingEnvVars.length === 0;
  const isServer = typeof window === 'undefined';

  // Check individual services
  const checkFirestore = checkService<Firestore>(db, 'Firestore');
  const checkAuth = checkService<Auth>(auth, 'Auth');
  const checkStorage = checkService<FirebaseStorage>(storage, 'Storage');

  return {
    firestore: checkFirestore,
    auth: checkAuth,
    storage: checkStorage,
    environment: {
      isServer,
      hasRequiredEnvVars,
      missingEnvVars
    }
  };
}

/**
 * Helper function to check if a service is initialized
 */
function checkService<T>(service: T | null, serviceName: string): ServiceStatus {
  const now = new Date();
  if (!service) {
    return {
      isAvailable: false,
      lastChecked: now,
      error: `${serviceName} is not initialized`
    };
  }
  
  try {
    // Perform a simple check on the service object
    const keys = Object.keys(service);
    const isValid = keys.length > 0;
    
    return {
      isAvailable: isValid,
      lastChecked: now,
      error: isValid ? undefined : `${serviceName} appears to be initialized but may not be valid`
    };
  } catch (error) {
    return {
      isAvailable: false,
      lastChecked: now,
      error: error instanceof Error ? error.message : `Unknown error checking ${serviceName}`
    };
  }
}

/**
 * Logs Firebase services status to console
 */
export function logFirebaseStatus() {
  const status = checkFirebaseServices();
  
  console.group('🔥 Firebase Status');
  
  
  if (!status.environment.hasRequiredEnvVars) {
    console.warn('Missing environment variables:', status.environment.missingEnvVars);
  }
  
  
  
  
  
  if (!status.auth.isAvailable) console.error('Auth error:', status.auth.error);
  if (!status.firestore.isAvailable) console.error('Firestore error:', status.firestore.error);
  if (!status.storage.isAvailable) console.error('Storage error:', status.storage.error);
  
  console.groupEnd();
  
  return status;
}

// Auto-initialize debug session only in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only run in browser and development mode
  setTimeout(() => {
    logFirebaseStatus();
  }, 500); // Reduced delay for faster development feedback
} 