'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export default function SetupProfilePage() {
  const [status, setStatus] = useState('Setting up your profile...');
  const { user } = useAuth();

  useEffect(() => {
    async function setupProfile() {
      try {
        if (!user) {
          setStatus('Please sign in first');
          return;
        }

        const db = getFirestore();
        const userProfileRef = doc(db, 'userProfiles', user.uid);
        
        await setDoc(userProfileRef, {
          email: user.email,
          displayName: user.displayName || '',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }, { merge: true });

        setStatus('Profile setup completed successfully! You can now access the jobs page.');
      } catch (error) {
        console.error('Error setting up profile:', error);
        setStatus('Error setting up profile. Please check the console for details.');
      }
    }

    setupProfile();
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Setup</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
} 