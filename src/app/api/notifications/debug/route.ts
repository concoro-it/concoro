import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

export async function GET() {
  try {
    
    
    // Check environment variables
    const envVars = {
      'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY ? 'Set (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'Not set',
      'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL || 'Not set',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set',
    };

    // Check service account file
    const serviceAccountPath = path.resolve(process.cwd(), 'concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json');
    const serviceAccountExists = fs.existsSync(serviceAccountPath);
    
    
    

    // Try to initialize Firebase Admin
    let initializationResult: Record<string, unknown>;
    try {
      const db = initializeFirebaseAdmin();
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
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
} 