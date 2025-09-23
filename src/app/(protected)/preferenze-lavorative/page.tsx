'use client';

import { WorkPreferences } from '@/components/settings/WorkPreferences';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LeftSidebar from '@/components/layout/LeftSidebar';
import { Spinner } from '@/components/ui/spinner';

export default function PreferenzeLavorativePage() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth is initialized and there's no user
    if (initialized && !loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, initialized, router]);

  // Show loading state while auth is initializing
  if (loading || !initialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner variant="infinite" size={48} className="mb-4" />
          <p className="text-muted-foreground">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if there's no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="container py-8 pt-8 flex gap-8">
      <div className="hidden md:block w-1/4">
        <LeftSidebar />
      </div>
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-2">Preferenze Lavorative</h1>
        <h4 className="text-l font-regular mb-6">Le tue preferenze per i concorsi</h4>
        <WorkPreferences userId={user.uid} />
      </div>
    </div>
  );
} 