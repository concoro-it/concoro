import { NextRequest, NextResponse } from 'next/server';
import { brevoService } from '@/lib/services/brevo';
import { NotificationsService } from '@/lib/services/notifications';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { NotificationWithConcorso } from '@/types/notification';

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
    const notifications: NotificationWithConcorso[] = [];
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
            concorsoTitle: concorsoData.Titolo || concorsoData.titolo_breve || 'Titolo non disponibile',
            concorsoTitoloBreve: concorsoData.titolo_breve || concorsoData.Titolo || 'Titolo breve non disponibile',
            concorsoEnte: concorsoData.Ente || 'Ente non disponibile',
            concorsoLink: concorsoData.Link || concorsoData.apply_link || '',
            concorsoDaysLeft: notificationData.daysLeft || 0,
            concorsoNumeroPosti: concorsoData.numero_di_posti || concorsoData.NumerodiPosti || 1,
            concorsoAreaGeografica: concorsoData.AreaGeografica || concorsoData.area_geografica || concorsoData.localita || concorsoData.Localita || 'Italia',
            concorsoDataChiusura: concorsoData.DataChiusura || concorsoData.data_chiusura || notificationData.DataChiusura
          } as NotificationWithConcorso);
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
          stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        },
        { status: 500 }
      );
  }
} 