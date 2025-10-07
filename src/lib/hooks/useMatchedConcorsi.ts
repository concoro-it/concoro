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
        console.log('Fetching matched concorsi for user:', userId, 'limit:', limit, 'offset:', offset);
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
        
        console.log('User profile found:', userId);

        // Get all matches for the user
        const matchesRef = collection(db, `userProfiles/${userId}/matches`);
        console.log('Fetching matches from path:', `userProfiles/${userId}/matches`);
        
        const matchesSnapshot = await getDocs(matchesRef);
        console.log('Matches found:', matchesSnapshot.size);
        
        if (matchesSnapshot.empty) {
          console.log('No matches found for user:', userId);
          setConcorsi([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }
        
        const allMatchedConcorsi: ConcorsoWithMatch[] = [];

        // For each match, fetch the corresponding concorso
        for (const matchDoc of matchesSnapshot.docs) {
          const matchData = matchDoc.data() as Match;
          console.log('Processing match:', matchDoc.id, 'for concorso:', matchData.concorso_id);
          
          if (!matchData.concorso_id) {
            console.warn('Match missing concorso_id:', matchDoc.id);
            continue;
          }
          
          // Fetch the concorso details
          const concorsoRef = doc(db, 'concorsi', matchData.concorso_id);
          
          const concorsoSnap = await getDoc(concorsoRef);
          
          if (concorsoSnap.exists()) {
            console.log('Found concorso:', concorsoSnap.id);
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
                console.log('Skipping passed concorso:', concorsoSnap.id);
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
          console.log(`Paginated results: ${startIndex}-${endIndex} of ${allMatchedConcorsi.length}`);
        }
        
        console.log('Final matched concorsi count:', paginatedConcorsi.length);
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
      console.log('No userId provided, skipping fetch');
    }
  }, [userId, limit, offset]);

  return { concorsi, totalCount, isLoading, error };
}; 