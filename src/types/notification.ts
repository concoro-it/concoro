import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  concorso_id: string;
  user_id: string;
  daysLeft: number;
  numero_di_posti: number;
  AreaGeografica: string;
  DataChiusura: Timestamp;
  publication_date: string;
  savedAt: Timestamp;
  timestamp: Timestamp;
  isRead?: boolean;
  concorsoTitle?: string; // Will be populated when fetching with concorso data
}

export interface NotificationWithConcorso extends Notification {
  concorsoTitle: string;
  concorsoTitoloBreve: string;
  concorsoEnte: string;
  concorsoLink: string;
  concorsoDaysLeft: number;
  concorsoNumeroPosti: number;
  concorsoAreaGeografica: string; 
  concorsoDataChiusura: Timestamp;
} 