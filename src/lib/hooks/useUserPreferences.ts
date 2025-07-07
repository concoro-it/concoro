import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { UserPreferences } from '@/lib/utils/preferences-utils';

export function useUserPreferences() {
  const { user, initialized } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !user || !db) {
      setLoading(false);
      return;
    }

    const userProfileRef = doc(db, 'userProfiles', user.uid);
    
    // Set up real-time listener for user preferences
    const unsubscribe = onSnapshot(
      userProfileRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const userPreferences: UserPreferences = {
            RegioniPreferite: data.RegioniPreferite || [],
            SettoriInteresse: data.SettoriInteresse || [],
            TipologiaContratto: data.TipologiaContratto || '',
            TitoloStudio: data.TitoloStudio || ''
          };
          setPreferences(userPreferences);
        } else {
          setPreferences(null);
        }
        setLoading(false);
        setError(null);
      }, 
      (error) => {
        console.error('Error fetching user preferences:', error);
        setError('Failed to fetch user preferences');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, initialized]);

  return {
    preferences,
    loading,
    error
  };
} 