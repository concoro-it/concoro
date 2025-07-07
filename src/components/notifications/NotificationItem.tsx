"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { NotificationWithConcorso } from '@/types';
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization';

interface NotificationItemProps {
  notification: NotificationWithConcorso;
  onMarkAsRead?: (notificationId: string) => void;
  fullWidth?: boolean;
}

export function NotificationItem({ notification, onMarkAsRead, fullWidth = false }: NotificationItemProps) {
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (notification.isRead || isMarkingAsRead) return;

    try {
      setIsMarkingAsRead(true);
      if (onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data non disponibile';
    }
  };

  const getNotificationMessage = (daysLeft: number) => {
    if (daysLeft === 0) {
      return (
        <span>
          Il tuo concorso salvato scade <span className="font-bold">oggi</span>
        </span>
      );
    } else if (daysLeft === 1) {
      return (
        <span>
          Il tuo concorso salvato scade <span className="font-bold">tra 1 giorno</span>
        </span>
      );
    } else {
      return (
        <span>
          Il tuo concorso salvato scade <span className="font-bold">tra {daysLeft} giorni</span>
        </span>
      );
    }
  };

  const handleCardClick = () => {
    // Mark as read when clicking the card
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "relative p-4 border rounded-lg transition-all duration-200 hover:shadow-md",
        !fullWidth && "max-w-[366px]",
        notification.isRead 
          ? "bg-white border-gray-200" 
          : "bg-blue-50/50/30 border-blue-200 shadow-sm"
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Notification message */}
          <p className="text-sm text-gray-700 mb-3">
            {getNotificationMessage(notification.daysLeft)}
          </p>

          {/* Clickable concorso card */}
          <Link 
            href={`/bandi/${notification.concorso_id}`}
            onClick={handleCardClick}
            className="block w-full"
          >
            <div 
              className={cn(
                "rounded-lg p-3 transition-all duration-200 hover:shadow-sm cursor-pointer border w-full",
                !fullWidth && "max-w-[366px]"
              )}
              style={{ 
                background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), #c2e9fb)',
                borderColor: '#e5e7eb',
                borderWidth: '1px'
              }}
            >
              <div className="mb-1 flex flex-col">
                {/* Ente */}
                {notification.concorsoEnte && (
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate mb-1" title={notification.concorsoEnte}>
                      {notification.concorsoEnte}
                    </p>
                  </div>
                )}
                
                {/* Title */}
                <div className="font-semibold text-sm mb-2 line-clamp-2 flex-1">
                  {toItalianSentenceCase(notification.concorsoTitoloBreve || notification.concorsoTitle)}
                </div>
                
                {/* Details */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1 shrink-0" />
                    <span>Scade: {formatDate(notification.concorsoDataChiusura)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Mark as read button */}
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAsRead}
            disabled={isMarkingAsRead}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="Segna come letto"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 