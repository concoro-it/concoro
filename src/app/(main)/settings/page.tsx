"use client";

import * as React from "react";
import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AINotifications } from '@/components/settings/AINotifications';
import { DataPrivacy } from '@/components/settings/DataPrivacy';
import { Separator } from '@/components/ui/separator';
import LeftSidebar from '@/components/layout/LeftSidebar';

export default function SettingsPage(): React.JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="container py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Impostazioni</h1>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Accesso Richiesto</h1>
          <p className="text-muted-foreground">Reindirizzamento alla pagina di accesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 pt-8 flex gap-8">
      <div className="hidden md:block w-1/4">
        <LeftSidebar />
      </div>
      <div className="flex-1 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Impostazioni</h1>
          <p className="text-muted-foreground">
            Gestisci le impostazioni del tuo account e personalizza la tua esperienza
          </p>
        </div>
  
        <div className="space-y-8">
          <AccountSettings />
          <Separator />
          <AINotifications />
          <Separator />
          <DataPrivacy />
        </div>
      </div>
    </div>
  );
} 