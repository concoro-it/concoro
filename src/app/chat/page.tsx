"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import AIChatBot from '@/components/Genio';
import { Spinner } from '@/components/ui/spinner';


export default function ChatPage() {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner variant="infinite" size={48} className="mb-4" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if there's no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main>
      <AIChatBot />
    </main>
  );
} 