import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin for API routes
function initializeFirebaseAdminForAPI() {
  if (!admin.apps.length) {
    try {
      // First try service account file (more reliable than env vars)
      console.log('Trying service account file first...');
      const serviceAccountPath = path.resolve(process.cwd(), 'concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        console.log('Service account file found, using it...');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        console.log('Firebase Admin initialized with service account file');
      } else {
        // Fallback to environment variables
        console.log('Service account file not found, trying environment variables...');
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
          console.log('Initializing Firebase Admin with environment variables...');
          
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
          
          console.log('Firebase Admin initialized successfully with environment variables');
        } else {
          throw new Error('No Firebase credentials found (neither service account file nor environment variables)');
        }
      }
    } catch (error: unknown) {
      console.error('Error initializing Firebase Admin:', error);
      throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return admin.firestore();
}

export async function GET() {
  try {
    console.log('=== Firebase Debug Route ===');
    
    // Check environment variables
    const envVars = {
      'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY ? 'Set (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'Not set',
      'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL || 'Not set',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set',
    };

    // Check service account file
    const serviceAccountPath = path.resolve(process.cwd(), 'concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json');
    const serviceAccountExists = fs.existsSync(serviceAccountPath);
    
    console.log('Environment variables:', envVars);
    console.log('Service account file exists:', serviceAccountExists);

    // Try to initialize Firebase Admin
    let initializationResult: Record<string, unknown>;
    try {
      const db = initializeFirebaseAdminForAPI();
      initializationResult = {
        success: true,
        message: 'Firebase Admin initialized successfully',
        method: serviceAccountExists ? 'Service Account File' : 'Environment Variables'
      };
      
      // Try a simple Firestore operation
      try {
        const testCollection = await db.collection('concorsi').limit(1).get();
        initializationResult.firestoreTest = {
          success: true,
          message: `Firestore connection works, found ${testCollection.size} documents`
        };
      } catch (firestoreError: unknown) {
        initializationResult.firestoreTest = {
          success: false,
          error: firestoreError instanceof Error ? firestoreError.message : 'Unknown error'
        };
      }
      
    } catch (error: unknown) {
      initializationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      firebaseAdmin: {
        appsCount: admin.apps.length,
        appNames: admin.apps.map(app => app ? app.name : 'unknown')
      },
      environmentVariables: envVars,
      serviceAccount: {
        path: serviceAccountPath,
        exists: serviceAccountExists
      },
      initialization: initializationResult
    });

  } catch (error: unknown) {
    console.error('Debug API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Debug API failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 