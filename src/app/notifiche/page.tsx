'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LeftSidebar from '@/components/layout/LeftSidebar';
import { Spinner } from '@/components/ui/spinner';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { CheckCheck, Bell, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NotifichePage() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotifications();

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
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if there's no user (will redirect)
  if (!user) {
    return null;
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="container py-8 pt-8 flex gap-8">
      <div className="hidden md:block w-1/4">
        <LeftSidebar />
      </div>
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Notifiche</h1>
            <p className="text-gray-600">
              Rimani aggiornato sui tuoi concorsi salvati
            </p>
          </div>
          
          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {unreadCount} non lette
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Segna tutte come lette
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {notificationsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner variant="infinite" size={48} className="mb-4" />
            <span className="ml-2 text-gray-500">
              Caricamento notifiche...
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Errore nel caricamento delle notifiche
              </h3>
              <p className="text-gray-600 mb-4">
                Si è verificato un errore durante il caricamento delle tue notifiche.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Riprova
              </Button>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessuna notifica disponibile
              </h3>
              <p className="text-gray-600 mb-4">
                Ti avviseremo quando ci saranno aggiornamenti sui tuoi concorsi salvati.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/bandi')}
              >
                Esplora i concorsi
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                fullWidth={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 