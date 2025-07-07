'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function NotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new route
    router.replace('/preferenze-lavorative');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner variant="infinite" size={48} className="mb-4" />
        <p className="text-muted-foreground">Reindirizzamento alle preferenze lavorative...</p>
      </div>
    </div>
  );
} 