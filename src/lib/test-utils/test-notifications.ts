import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function createTestNotifications(userId: string) {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const notificationsRef = collection(db, 'userProfiles', userId, 'notifications');

  // Sample notifications with different urgency levels
  const testNotifications = [
    {
      concorso_id: 'test-concorso-1',
      user_id: userId,
      daysLeft: 0,
      scadenza: Timestamp.fromDate(new Date()),
      publication_date: '2024-01-15',
      savedAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
      timestamp: Timestamp.fromDate(new Date()),
      isRead: false
    },
    {
      concorso_id: 'test-concorso-2',
      user_id: userId,
      daysLeft: 1,
      scadenza: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // tomorrow
      publication_date: '2024-01-10',
      savedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      timestamp: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)), // 1 hour ago
      isRead: false
    },
    {
      concorso_id: 'test-concorso-3',
      user_id: userId,
      daysLeft: 3,
      scadenza: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days from now
      publication_date: '2024-01-05',
      savedAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
      timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
      isRead: true
    }
  ];

  // Create test concorsi documents as well
  const concorsiData = [
    {
      id: 'test-concorso-1',
      Titolo: 'Concorso per Funzionario Amministrativo - Comune di Roma',
      Ente: 'Comune di Roma',
      Link: 'https://example.com/concorso-1',
      Descrizione: 'Concorso pubblico per funzionario amministrativo',
      DataChiusura: Timestamp.fromDate(new Date()),
      Stato: 'Attivo'
    },
    {
      id: 'test-concorso-2',
      Titolo: 'Selezione Pubblica per Tecnico Informatico - Regione Lazio',
      Ente: 'Regione Lazio',
      Link: 'https://example.com/concorso-2',
      Descrizione: 'Selezione per tecnico informatico specializzato',
      DataChiusura: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      Stato: 'Attivo'
    },
    {
      id: 'test-concorso-3',
      Titolo: 'Concorso per Istruttore Direttivo - Ministero della Salute',
      Ente: 'Ministero della Salute',
      Link: 'https://example.com/concorso-3',
      Descrizione: 'Concorso per istruttore direttivo area sanitaria',
      DataChiusura: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
      Stato: 'Attivo'
    }
  ];

  try {
    // Create test concorsi
    for (const concorso of concorsiData) {
      const concorsoRef = doc(db, 'concorsi', concorso.id);
      await setDoc(concorsoRef, concorso);
    }

    // Create test notifications
    for (let i = 0; i < testNotifications.length; i++) {
      const notificationRef = doc(notificationsRef, `test-notification-${i + 1}`);
      await setDoc(notificationRef, testNotifications[i]);
    }

    
    return true;
  } catch (error) {
    console.error('Error creating test notifications:', error);
    throw error;
  }
}

export async function clearTestNotifications(userId: string) {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  try {
    // Clear test notifications
    for (let i = 1; i <= 3; i++) {
      const notificationRef = doc(db, 'userProfiles', userId, 'notifications', `test-notification-${i}`);
      await setDoc(notificationRef, {}, { merge: false });
    }

    // Clear test concorsi
    for (let i = 1; i <= 3; i++) {
      const concorsoRef = doc(db, 'concorsi', `test-concorso-${i}`);
      await setDoc(concorsoRef, {}, { merge: false });
    }

    
    return true;
  } catch (error) {
    console.error('Error clearing test notifications:', error);
    throw error;
  }
} 