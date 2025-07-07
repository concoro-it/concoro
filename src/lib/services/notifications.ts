import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  onSnapshot,
  Unsubscribe,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Notification, NotificationWithConcorso, Concorso } from '@/types';

export class NotificationsService {
  /**
   * Fetch notifications for a specific user
   */
  static async getUserNotifications(userId: string): Promise<NotificationWithConcorso[]> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      const notificationsRef = collection(db, 'userProfiles', userId, 'notifications');
      const q = query(
        notificationsRef,
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        } as Notification);
      });

      // Enrich notifications with concorso data
      const enrichedNotifications = await Promise.all(
        notifications.map(async (notification) => {
          try {
            const concorsoRef = doc(db!, 'concorsi', notification.concorso_id);
            const concorsoSnap = await getDoc(concorsoRef);
            
            if (concorsoSnap.exists()) {
              const concorsoData = concorsoSnap.data() as Concorso;
              return {
                ...notification,
                concorsoTitle: concorsoData.Titolo,
                concorsoTitoloBreve: concorsoData.titolo_breve || concorsoData.Titolo,
                concorsoEnte: concorsoData.Ente,
                concorsoLink: concorsoData.Link
              } as NotificationWithConcorso;
            } else {
              // If concorso doesn't exist, return notification with fallback data
              return {
                ...notification,
                concorsoTitle: 'Concorso non trovato',
                concorsoTitoloBreve: 'Concorso non trovato',
                concorsoEnte: '',
                concorsoLink: ''
              } as NotificationWithConcorso;
            }
          } catch (error) {
            console.error('Error fetching concorso data for notification:', notification.id, error);
            return {
              ...notification,
              concorsoTitle: 'Errore nel caricamento',
              concorsoTitoloBreve: 'Errore nel caricamento',
              concorsoEnte: '',
              concorsoLink: ''
            } as NotificationWithConcorso;
          }
        })
      );

      return enrichedNotifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      const notificationsRef = collection(db, 'userProfiles', userId, 'notifications');
      const q = query(
        notificationsRef,
        where('isRead', '!=', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      const notificationRef = doc(db, 'userProfiles', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      const notificationsRef = collection(db, 'userProfiles', userId, 'notifications');
      const q = query(
        notificationsRef,
        where('isRead', '!=', true)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Subscribe to real-time notifications updates
   */
  static subscribeToNotifications(
    userId: string, 
    callback: (notifications: NotificationWithConcorso[]) => void
  ): Unsubscribe {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    const notificationsRef = collection(db, 'userProfiles', userId, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, async (querySnapshot) => {
      try {
        const notifications: Notification[] = [];
        querySnapshot.forEach((doc) => {
          notifications.push({
            id: doc.id,
            ...doc.data()
          } as Notification);
        });

        // Enrich notifications with concorso data
        const enrichedNotifications = await Promise.all(
          notifications.map(async (notification) => {
            try {
              const concorsoRef = doc(db!, 'concorsi', notification.concorso_id);
              const concorsoSnap = await getDoc(concorsoRef);
              
              if (concorsoSnap.exists()) {
                const concorsoData = concorsoSnap.data() as Concorso;
                return {
                  ...notification,
                  concorsoTitle: concorsoData.Titolo,
                  concorsoTitoloBreve: concorsoData.titolo_breve || concorsoData.Titolo,
                  concorsoEnte: concorsoData.Ente,
                  concorsoLink: concorsoData.Link
                } as NotificationWithConcorso;
              } else {
                return {
                  ...notification,
                  concorsoTitle: 'Concorso non trovato',
                  concorsoTitoloBreve: 'Concorso non trovato',
                  concorsoEnte: '',
                  concorsoLink: ''
                } as NotificationWithConcorso;
              }
            } catch (error) {
              console.error('Error fetching concorso data for notification:', notification.id, error);
              return {
                ...notification,
                concorsoTitle: 'Errore nel caricamento',
                concorsoTitoloBreve: 'Errore nel caricamento',
                concorsoEnte: '',
                concorsoLink: ''
              } as NotificationWithConcorso;
            }
          })
        );

        callback(enrichedNotifications);
      } catch (error) {
        console.error('Error in notifications subscription:', error);
        callback([]);
      }
    }, (error) => {
      console.error('Error in notifications subscription:', error);
      callback([]);
    });
  }

  /**
   * Get urgent notifications (0 days left)
   */
  static async getUrgentNotifications(userId: string): Promise<NotificationWithConcorso[]> {
    const notifications = await this.getUserNotifications(userId);
    return notifications.filter(notification => notification.daysLeft === 0);
  }

  /**
   * Format days left message
   */
  static formatDaysLeftMessage(daysLeft: number): string {
    if (daysLeft === 0) {
      return 'Scade oggi';
    } else if (daysLeft === 1) {
      return '1 giorno rimanente';
    } else {
      return `${daysLeft} giorni rimanenti`;
    }
  }

  /**
   * Manually create a notification (for testing or immediate creation)
   */
  static async createNotification(
    userId: string,
    concorsoId: string,
    daysLeft: number,
    concorsoData: Concorso
  ): Promise<void> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      const notificationsRef = collection(db, 'userProfiles', userId, 'notifications');
      
      // Check if notification already exists for this threshold
      const existingQuery = query(
        notificationsRef,
        where('concorso_id', '==', concorsoId),
        where('daysLeft', '==', daysLeft)
      );
      
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        console.log('Notification already exists for this threshold');
        return;
      }

      // Create the notification
      const notification = {
        concorso_id: concorsoId,
        user_id: userId,
        daysLeft: daysLeft,
        scadenza: concorsoData.DataChiusura,
        publication_date: concorsoData.publication_date || '',
        savedAt: Timestamp.now(),
        timestamp: Timestamp.now(),
        isRead: false
      };

      await addDoc(notificationsRef, notification);
      console.log(`Notification created for user ${userId}, concorso ${concorsoId}, ${daysLeft} days left`);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Create notifications for all saved concorsos for a user (manual trigger)
   */
  static async createNotificationsForUser(userId: string): Promise<number> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      // Get user's saved concorsos
      const savedConcorsiRef = collection(db, 'savedconcorsi');
      const savedQuery = query(savedConcorsiRef, where('userId', '==', userId));
      const savedSnapshot = await getDocs(savedQuery);

      if (savedSnapshot.empty) {
        return 0;
      }

      let notificationsCreated = 0;
      const thresholds = [7, 3, 1, 0]; // Days before deadline to create notifications

      for (const savedDoc of savedSnapshot.docs) {
        const savedData = savedDoc.data();
        const concorsoId = savedData.concorso_id;

        // Get concorso details
        const concorsoRef = doc(db, 'concorsi', concorsoId);
        const concorsoSnap = await getDoc(concorsoRef);

        if (!concorsoSnap.exists()) {
          continue;
        }

        const concorsoData = concorsoSnap.data() as Concorso;
        
        // Calculate days left
        const deadlineDate = concorsoData.DataChiusura.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);
        
        const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Skip if expired
        if (daysLeft < 0) continue;

        // Create notification if we're at a threshold
        if (thresholds.includes(daysLeft)) {
          await this.createNotification(userId, concorsoId, daysLeft, concorsoData);
          notificationsCreated++;
        }
      }

      return notificationsCreated;
    } catch (error) {
      console.error('Error creating notifications for user:', error);
      throw new Error('Failed to create notifications for user');
    }
  }
} 