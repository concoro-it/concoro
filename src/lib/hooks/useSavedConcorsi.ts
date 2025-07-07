import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore'
import { getFirebaseFirestore } from '@/lib/firebase/config'
import { useAuth } from '@/lib/hooks/useAuth'

export function useSavedConcorsi() {
  const [savedConcorsiIds, setSavedConcorsiIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  // Safely get the Firestore instance
  const getDb = useCallback(() => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot access database on server side');
    }
    
    try {
      return getFirebaseFirestore();
    } catch (error) {
      console.error('Failed to initialize Firestore', error);
      throw new Error('Database not available');
    }
  }, []);

  // Fetch saved concorsi IDs for the current user
  const fetchSavedConcorsiIds = useCallback(async () => {
    if (!user) {
      setSavedConcorsiIds([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const db = getDb();
      const savedConcorsiRef = collection(db, 'savedconcorsi')
      const q = query(savedConcorsiRef, where('userId', '==', user.uid))
      const querySnapshot = await getDocs(q)
      
      const concorsiIds = querySnapshot.docs.map(doc => doc.data().concorso_id)
      setSavedConcorsiIds(concorsiIds)
    } catch (error) {
      console.error('Error fetching saved concorsi:', error)
      setSavedConcorsiIds([])
    } finally {
      setIsLoading(false)
    }
  }, [user, getDb])

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined' && user) {
      fetchSavedConcorsiIds()
    } else {
      // Reset state when on server or no user
      setSavedConcorsiIds([])
      setIsLoading(false)
    }
  }, [fetchSavedConcorsiIds, user])

  // Toggle save/unsave concorsi
  const toggleSaveConcorso = async (concorsoId: string) => {
    if (!user) {
      throw new Error('Devi effettuare l\'accesso per salvare i concorsi')
    }

    try {
      const db = getDb();
      
      // First check if the concorso exists
      const concorsoDoc = await getDoc(doc(db, 'concorsi', concorsoId))
      if (!concorsoDoc.exists()) {
        throw new Error('Concorso non trovato')
      }

      // Check if the concorso is already saved
      const savedConcorsiRef = collection(db, 'savedconcorsi')
      const q = query(savedConcorsiRef, where('userId', '==', user.uid), where('concorso_id', '==', concorsoId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Save the concorso
        const newSavedConcorso = {
          userId: user.uid,
          concorso_id: concorsoId,
          savedAt: new Date()
        }

        await addDoc(savedConcorsiRef, newSavedConcorso)
        setSavedConcorsiIds(prev => [...prev, concorsoId])
      } else {
        // Remove the saved concorso
        const docToDelete = querySnapshot.docs[0]
        await deleteDoc(doc(savedConcorsiRef, docToDelete.id))
        setSavedConcorsiIds(prev => prev.filter(id => id !== concorsoId))
      }

      // Refresh saved concorsi list
      await fetchSavedConcorsiIds()
    } catch (error) {
      console.error('Error in toggleSaveConcorso:', error)
      throw error
    }
  }

  // Check if a concorso is saved
  const isConcorsoSaved = useCallback((concorsoId: string | undefined) => {
    if (!concorsoId) return false
    return savedConcorsiIds.includes(concorsoId)
  }, [savedConcorsiIds])

  // Fetch full concorso details for saved concorsi
  const fetchSavedConcorsi = useCallback(async () => {
    if (!user || savedConcorsiIds.length === 0) {
      return []
    }

    try {
      setIsLoading(true)
      const db = getDb();
      
      const concorsi = await Promise.all(
        savedConcorsiIds.map(async (concorsoId) => {
          const concorsoDoc = await getDoc(doc(db, 'concorsi', concorsoId))
          if (concorsoDoc.exists()) {
            return { id: concorsoDoc.id, ...concorsoDoc.data() }
          }
          return null
        })
      )

      return concorsi.filter(Boolean)
    } catch (error) {
      console.error('Error fetching saved concorsi details:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [user, savedConcorsiIds, getDb])

  return {
    savedConcorsiIds,
    isLoading,
    toggleSaveConcorso,
    isConcorsoSaved,
    fetchSavedConcorsi
  }
} 