"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';

interface NotificationsDropdownProps {
  className?: string;
}

export function NotificationsDropdown({ className }: NotificationsDropdownProps) {
  const {
    notifications,
    unreadCount,
    urgentNotifications,
    loading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAllAsRead) return;

    try {
      setIsMarkingAllAsRead(true);
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  const hasUrgentNotifications = urgentNotifications.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className={cn(
            "relative h-10 w-10 p-0 hover:bg-accent",
            className
          )}
          aria-label={`Notifiche${unreadCount > 0 ? ` (${unreadCount} non lette)` : ''}`}
        >
          <Bell className={cn(
            "h-5 w-5 transition-colors",
            hasUrgentNotifications ? "text-red-600" : "text-gray-600"
          )} />
          
          {/* Notification badge */}
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium",
                hasUrgentNotifications ? "bg-red-600 text-white" : "bg-blue-600 text-white"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[600px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">
            Notifiche {unreadCount > 0 && `(${unreadCount})`}
          </h3>
          
          {/* Vedi tutto button */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Link href="/notifiche">
              Vedi tutto
            </Link>
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                Caricamento notifiche...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Errore nel caricamento delle notifiche
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Riprova
                </Button>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Nessuna notifica disponibile
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Ti avviseremo quando ci saranno aggiornamenti sui tuoi concorsi salvati
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="p-2 space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                asChild
              >
                <Link href="/notifiche">
                  Visualizza tutte le notifiche
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 