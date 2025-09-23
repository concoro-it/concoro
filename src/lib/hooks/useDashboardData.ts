import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, where } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import { Concorso, ConcorsoWithMatch } from '@/types/concorso';

interface DashboardData {
  closingToday: Concorso[];
  newest: Concorso[];
  maxi: Concorso[];
  matched: ConcorsoWithMatch[];
  saved: Concorso[];
  isLoading: boolean;
  error: string | null;
}

// Helper function to parse dates consistently
const parseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  if (typeof dateValue === 'object' && dateValue.seconds) {
    return new Date(dateValue.seconds * 1000);
  }
  
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  return null;
};

// Get concorsi closing today or with most imminent deadlines
const getClosingTodayConcorsi = (allConcorsi: Concorso[]): Concorso[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Filter concorsi with valid closing dates and not already closed
  const validConcorsi = allConcorsi.filter(concorso => {
    const closingDate = parseDate(concorso.DataChiusura);
    if (!closingDate) return false;
    
    // Only include concorsi that haven't closed yet (closing date >= today)
    return closingDate >= today;
  });

  // Sort by closing date (ascending - soonest first)
  const sortedConcorsi = validConcorsi.sort((a, b) => {
    const dateA = parseDate(a.DataChiusura)!;
    const dateB = parseDate(b.DataChiusura)!;
    return dateA.getTime() - dateB.getTime();
  });

  // Get first 5 concorsi (prioritizing those closing today, then soonest)
  return sortedConcorsi.slice(0, 5);
};

// Get newest concorsi by publication date
const getNewestConcorsi = (allConcorsi: Concorso[]): Concorso[] => {
  return allConcorsi
    .filter(concorso => concorso.publication_date || concorso.createdAt)
    .sort((a, b) => {
      const getDateFromTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date(0);
        
        // Handle Firestore timestamp objects
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
        
        // Handle string dates
        if (typeof timestamp === 'string') {
          const date = new Date(timestamp);
          return isNaN(date.getTime()) ? new Date(0) : date;
        }
        
        // Handle Date objects
        if (timestamp instanceof Date) return timestamp;
        
        // Fallback
        return new Date(timestamp);
      };
      
      // Use publication_date first, fallback to DataApertura, then createdAt
      const dateA = getDateFromTimestamp(a.publication_date || a.DataApertura || a.createdAt);
      const dateB = getDateFromTimestamp(b.publication_date || b.DataApertura || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);
};

// Get maxi concorsi (highest number of posts)
const getMaxiConcorsi = (allConcorsi: Concorso[]): Concorso[] => {
  return allConcorsi
    .filter(concorso => concorso.numero_di_posti && concorso.numero_di_posti > 0)
    .sort((a, b) => (b.numero_di_posti || 0) - (a.numero_di_posti || 0))
    .slice(0, 5);
};

// Get matched concorsi for user
const getMatchedConcorsi = async (userId: string, allConcorsi: Concorso[]): Promise<ConcorsoWithMatch[]> => {
  if (!userId) return [];

  try {
    const db = getFirebaseFirestore();
    
    // Get user profile
    const userProfileRef = doc(db, 'userProfiles', userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (!userProfileSnap.exists()) {
      return [];
    }

    // Get all matches for the user
    const matchesRef = collection(db, `userProfiles/${userId}/matches`);
    const matchesSnapshot = await getDocs(matchesRef);
    
    if (matchesSnapshot.empty) {
      return [];
    }

    const matchedConcorsi: ConcorsoWithMatch[] = [];
    const concorsiMap = new Map(allConcorsi.map(c => [c.id, c]));

    // For each match, find the corresponding concorso in our already fetched data
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      
      if (matchData.concorso_id && concorsiMap.has(matchData.concorso_id)) {
        const concorso = concorsiMap.get(matchData.concorso_id)!;
        matchedConcorsi.push({
          ...concorso,
          match_score: matchData.match_score || 0,
          match_explanation: matchData.explanation || ''
        });
      }
    }

    // Sort by match score and return top 3
    return matchedConcorsi
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      .slice(0, 3);

  } catch (error) {
    console.error('Error fetching matched concorsi:', error);
    return [];
  }
};

// Get saved concorsi for user
const getSavedConcorsi = async (userId: string, allConcorsi: Concorso[]): Promise<Concorso[]> => {
  if (!userId) return [];

  try {
    const db = getFirebaseFirestore();
    
    // Get saved concorsi IDs
    const savedConcorsiRef = collection(db, 'savedconcorsi');
    const q = query(savedConcorsiRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const savedIds = querySnapshot.docs.map(doc => doc.data().concorso_id);
    
    if (savedIds.length === 0) return [];

    // Filter concorsi that are saved and not expired
    const concorsiMap = new Map(allConcorsi.map(c => [c.id, c]));
    const savedConcorsi = savedIds
      .map(id => concorsiMap.get(id))
      .filter((concorso): concorso is Concorso => {
        if (!concorso) return false;
        
        // Filter out expired concorsi
        const closingDate = parseDate(concorso.DataChiusura);
        if (!closingDate) return true; // Keep if no closing date
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return closingDate >= today;
      })
      .slice(0, 5);

    return savedConcorsi;

  } catch (error) {
    console.error('Error fetching saved concorsi:', error);
    return [];
  }
};

export const useDashboardData = (userId: string): DashboardData => {
  const [data, setData] = useState<DashboardData>({
    closingToday: [],
    newest: [],
    maxi: [],
    matched: [],
    saved: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        const db = getFirebaseFirestore();
        const concorsiCollection = collection(db, "concorsi");

        // Single optimized query to get all concorsi
        // We'll get more data than needed to ensure we have enough for all sections
        const concorsiQuery = query(
          concorsiCollection,
          orderBy("publication_date", "desc"),
          limit(100) // Reasonable limit for all sections
        );

        const snapshot = await getDocs(concorsiQuery);
        
        if (snapshot.empty) {
          setData({
            closingToday: [],
            newest: [],
            maxi: [],
            matched: [],
            saved: [],
            isLoading: false,
            error: null
          });
          return;
        }

        const allConcorsi = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Concorso[];

        // Process data for different sections in parallel
        const [matched, saved] = await Promise.all([
          getMatchedConcorsi(userId, allConcorsi),
          getSavedConcorsi(userId, allConcorsi)
        ]);

        const processedData = {
          closingToday: getClosingTodayConcorsi(allConcorsi),
          newest: getNewestConcorsi(allConcorsi),
          maxi: getMaxiConcorsi(allConcorsi),
          matched,
          saved,
          isLoading: false,
          error: null
        };

        setData(processedData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch dashboard data'
        }));
      }
    };

    fetchDashboardData();
  }, [userId]);

  return data;
};
