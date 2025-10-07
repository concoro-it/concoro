import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import { Concorso, Match, ConcorsoWithMatch } from '@/types/concorso';

export const useMatchedConcorsi = (userId: string, limit?: number, offset?: number) => {
  const [concorsi, setConcorsi] = useState<ConcorsoWithMatch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchedConcorsi = async () => {
      try {
        
        setIsLoading(true);
        setError(null);

        // Get Firestore instance
        const db = getFirebaseFirestore();
        if (!db) {
          console.error('Database not initialized');
          setError('Database not initialized');
          return;
        }

        // Check if the user profile exists
        const userProfileRef = doc(db, 'userProfiles', userId);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (!userProfileSnap.exists()) {
          console.error('User profile not found:', userId);
          setError('User profile not found');
          setIsLoading(false);
          return;
        }
        
        

        // Get all matches for the user
        const matchesRef = collection(db, `userProfiles/${userId}/matches`);
        
        
        const matchesSnapshot = await getDocs(matchesRef);
        
        
        if (matchesSnapshot.empty) {
          
          setConcorsi([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }
        
        const allMatchedConcorsi: ConcorsoWithMatch[] = [];

        // For each match, fetch the corresponding concorso
        for (const matchDoc of matchesSnapshot.docs) {
          const matchData = matchDoc.data() as Match;
          
          
          if (!matchData.concorso_id) {
            console.warn('Match missing concorso_id:', matchDoc.id);
            continue;
          }
          
          // Fetch the concorso details
          const concorsoRef = doc(db, 'concorsi', matchData.concorso_id);
          
          const concorsoSnap = await getDoc(concorsoRef);
          
          if (concorsoSnap.exists()) {
            
            const concorsoData = concorsoSnap.data() as Omit<Concorso, 'id'>;
            
            // Convert DataChiusura to Timestamp if it's not already
            let dataChiusura = concorsoData.DataChiusura;
            if (dataChiusura && typeof dataChiusura === 'object' && 'seconds' in dataChiusura) {
              dataChiusura = new Timestamp(dataChiusura.seconds, dataChiusura.nanoseconds);
            }

            // Skip if the closing date has passed
            if (dataChiusura) {
              const closingDate = dataChiusura instanceof Timestamp ? dataChiusura.toDate() : new Date(dataChiusura);
              if (closingDate < new Date()) {
                
                continue;
              }
            }
            
            allMatchedConcorsi.push({
              id: concorsoSnap.id,
              ...concorsoData,
              DataChiusura: dataChiusura,
              match_score: matchData.match_score,
              match_explanation: matchData.match_explanation
            });
          } else {
            console.warn('Concorso not found:', matchData.concorso_id);
          }
        }

        // Sort by match score (highest first)
        allMatchedConcorsi.sort((a, b) => b.match_score - a.match_score);
        
        // Set total count
        setTotalCount(allMatchedConcorsi.length);
        
        // Apply pagination if limit and offset are provided
        let paginatedConcorsi = allMatchedConcorsi;
        if (limit !== undefined) {
          const startIndex = offset || 0;
          const endIndex = startIndex + limit;
          paginatedConcorsi = allMatchedConcorsi.slice(startIndex, endIndex);
          
        }
        
        
        setConcorsi(paginatedConcorsi);
      } catch (err) {
        console.error('Error fetching matched concorsi:', err);
        setError('Failed to load matched concorsi');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchMatchedConcorsi();
    } else {
      
    }
  }, [userId, limit, offset]);

  return { concorsi, totalCount, isLoading, error };
}; 