import { NextRequest, NextResponse } from 'next/server';
import { brevoService } from '@/lib/services/brevo';
<<<<<<< Updated upstream
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
=======
import { NotificationsService } from '@/lib/services/notifications';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
>>>>>>> Stashed changes

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, userName, type } = await request.json();

    if (!userId || !userEmail || !userName) {
      return NextResponse.json(
        { error: 'userId, userEmail, and userName are required' },
        { status: 400 }
      );
    }

    

    // Handle welcome email type
    if (type === 'welcome') {
      try {
        const result = await brevoService.sendWelcomeEmail(userEmail, userName);

        // Log the welcome email send
        const db = initializeFirebaseAdmin();
        await db
          .collection('userProfiles')
          .doc(userId)
          .collection('emailLog')
          .add({
            type: 'welcome',
            sentAt: new Date(),
            testSend: true
          });

        return NextResponse.json({
          success: true,
          message: 'Welcome email sent successfully',
          data: {
            brevoResponse: result
          }
        });
      } catch (error: unknown) {
        console.error('Welcome email error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to send welcome email',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Initialize Firebase Admin and get Firestore instance
    const db = initializeFirebaseAdmin();
    
    const notificationsSnapshot = await db
      .collection('userProfiles')
      .doc(userId)
      .collection('notifications')
      .where('isRead', '==', false)
      .limit(5)
      .get();

    if (notificationsSnapshot.empty) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No unread notifications found for this user',
          notificationCount: 0
        }
      );
    }

    // Enrich notifications with concorso data
    const notifications: Array<{
      id: string;
      concorsoId: string;
      concorsoTitle: string;
      ente: string;
      daysLeft: number;
      closingDate: string;
      url: string;
    }> = [];
    for (const notificationDoc of notificationsSnapshot.docs) {
      const notificationData = notificationDoc.data();
      
      try {
        const concorsoDoc = await db.collection('concorsi').doc(notificationData.concorso_id).get();
        if (concorsoDoc.exists) {
          const concorsoData = concorsoDoc.data()!;
          
          // Debug logging to understand the data structure
          
          
          
          
          notifications.push({
            ...notificationData,
            id: notificationDoc.id,
            concorsoTitoloBreve: concorsoData.titolo_breve || concorsoData.Titolo,
            concorsoEnte: concorsoData.Ente,
            // Add the missing fields for email template
            AreaGeografica: concorsoData.AreaGeografica || concorsoData.area_geografica || concorsoData.localita || concorsoData.Localita || 'Italia',
            numero_di_posti: concorsoData.numero_di_posti || concorsoData.NumerodiPosti || concorsoData.posti || 1,
            DataChiusura: concorsoData.DataChiusura || concorsoData.data_chiusura || notificationData.DataChiusura
          });
        }
      } catch (error) {
        console.warn('Error enriching notification:', error);
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No valid notifications found (concorsos may not exist)',
          notificationCount: 0
        }
      );
    }

    // Send email via Brevo
    const result = await brevoService.sendNotificationEmail(userEmail, userName, notifications);

    // Log the email send
    await db
      .collection('userProfiles')
      .doc(userId)
      .collection('emailLog')
      .add({
        type: 'notification_test',
        sentAt: new Date(),
        notificationCount: notifications.length,
        urgentCount: notifications.filter((n) => n.daysLeft === 0).length,
        testSend: true
      });

    return NextResponse.json({
      success: true,
      message: 'Email notification sent successfully',
      data: {
        notificationCount: notifications.length,
        urgentCount: notifications.filter((n) => n.daysLeft === 0).length,
        brevoResponse: result
      }
    });

  } catch (error: unknown) {
    console.error('Email notification API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send email notification',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin and get Firestore instance
    const db = initializeFirebaseAdmin();
    
    // Get user's email logs
    const emailLogsSnapshot = await db
      .collection('userProfiles')
      .doc(userId)
      .collection('emailLog')
      .orderBy('sentAt', 'desc')
      .limit(10)
      .get();

    const emailLogs = emailLogsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt
    }));

    // Get current notification count
    const notificationsSnapshot = await db
      .collection('userProfiles')
      .doc(userId)
      .collection('notifications')
      .where('isRead', '==', false)
      .get();

    return NextResponse.json({
      success: true,
      data: {
        currentUnreadNotifications: notificationsSnapshot.size,
        recentEmailLogs: emailLogs
      }
    });

  } catch (error: unknown) {
    console.error('Email notification status API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get email notification status',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 