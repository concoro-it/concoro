"use client"

import { useState, useEffect } from "react"
import { MatchedConcorsi } from "@/components/dashboard/MatchedConcorsi"
import LeftSidebar from "@/components/layout/LeftSidebar"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Spinner } from '@/components/ui/spinner'
import { Button } from "@/components/ui/button"
import { getFirebaseFirestore } from "@/lib/firebase/config"
import { collection, getDocs } from "firebase/firestore"
import { toast } from "sonner"

export default function MatchedConcorsiPage() {
  const { user, loading: authLoading, initialized: authInitialized } = useAuth()
  const router = useRouter()
  const [isDebugging, setIsDebugging] = useState(false)

  useEffect(() => {
    if (authInitialized && !authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, authInitialized, router])

  const debugFirestore = async () => {
    if (!user) return
    
    setIsDebugging(true)
    try {
      const db = getFirebaseFirestore()
      
      // Check user profile
      const userProfilesCollection = collection(db, 'userProfiles')
      const userProfilesSnapshot = await getDocs(userProfilesCollection)
      // Check if current user exists
      const hasCurrentUser = userProfilesSnapshot.docs.some(doc => doc.id === user.uid)
      if (hasCurrentUser) {
        // Check matches collection
        const matchesCollection = collection(db, `userProfiles/${user.uid}/matches`)
        const matchesSnapshot = await getDocs(matchesCollection)
        
        toast.success(`Found ${matchesSnapshot.size} matches for your profile`)
      } else {
        toast.error('Your user profile was not found in the database')
      }
    } catch (error) {
      console.error('Debug error:', error)
      toast.error('Error debugging Firestore structure')
    } finally {
      setIsDebugging(false)
    }
  }

  if (authLoading || !authInitialized) {
    return (
      <div className="container py-8 pt-8 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          <LeftSidebar />
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Spinner variant="infinite" size={48} className="mx-auto" />
              <p className="mt-4 text-gray-600">Inizializzazione....</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="container py-8 pt-8 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <LeftSidebar />
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">Concorsi Consigliati</h1>
              <p className="text-gray-600">Concorsi selezionati in base al tuo profilo e alle tue preferenze.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={debugFirestore}
              disabled={isDebugging}
            >
              {isDebugging ? 'Verifica in corso...' : 'Verifica dati'}
            </Button>
          </div>
          
          <MatchedConcorsi userId={user.uid} showPagination={true} />
          <p className="text-gray-600">
          </p>
        </div>
      </div>
    </div>
  )
} 