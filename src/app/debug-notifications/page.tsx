'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { NotificationsService } from '@/lib/services/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Bell, Zap, RefreshCw, Trash2, CheckCircle, XCircle, Mail, Send, History } from 'lucide-react';

interface EmailLog {
  id: string;
  type: string;
  sentAt: string;
  notificationCount: number;
  urgentCount: number;
  testSend?: boolean;
}

export default function DebugNotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, refetch } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWelcomeEmail, setIsSendingWelcomeEmail] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoadingEmailLogs, setIsLoadingEmailLogs] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleCreateNotifications = async () => {
    if (!user?.uid) return;

    setIsCreating(true);
    setResult(null);

    try {
      const count = await NotificationsService.createNotificationsForUser(user.uid);
      setResult({
        type: 'success',
        message: `Successfully created ${count} notifications`
      });
      
      // Refresh notifications list
      await refetch();
    } catch (error) {
      console.error('Error creating notifications:', error);
      setResult({
        type: 'error',
        message: 'Failed to create notifications. Check console for details.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!user?.uid) return;

    setIsClearing(true);
    setResult(null);

    try {
      // Mark all as read first
      await NotificationsService.markAllAsRead(user.uid);
      
      setResult({
        type: 'success',
        message: 'All notifications marked as read'
      });
      
      // Refresh notifications list
      await refetch();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setResult({
        type: 'error',
        message: 'Failed to clear notifications. Check console for details.'
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!user?.uid || !user?.email) return;

    setIsSendingEmail(true);
    setResult(null);

    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Utente Test'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: 'success',
          message: `Email sent successfully! ${data.data.notificationCount} notifications included.`
        });
        
        // Refresh email logs
        await loadEmailLogs();
      } else {
        setResult({
          type: 'error',
          message: data.message || 'Failed to send email'
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setResult({
        type: 'error',
        message: 'Failed to send test email. Check console for details.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendWelcomeEmail = async () => {
    if (!user?.uid || !user?.email) return;

    setIsSendingWelcomeEmail(true);
    setResult(null);

    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Utente Test',
          type: 'welcome'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: 'success',
          message: 'Welcome email sent successfully!'
        });
        
        // Refresh email logs
        await loadEmailLogs();
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Failed to send welcome email'
        });
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      setResult({
        type: 'error',
        message: 'Failed to send welcome email. Check console for details.'
      });
    } finally {
      setIsSendingWelcomeEmail(false);
    }
  };

  const loadEmailLogs = async () => {
    if (!user?.uid) return;

    setIsLoadingEmailLogs(true);
    try {
      const response = await fetch(`/api/notifications/email?userId=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        setEmailLogs(data.data.recentEmailLogs || []);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setIsLoadingEmailLogs(false);
    }
  };

  // Load email logs on component mount
  useEffect(() => {
    if (user?.uid) {
      loadEmailLogs();
    }
  }, [user?.uid, loadEmailLogs]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to access the notification debug page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔔 Notification Debug</h1>
        <p className="text-muted-foreground">
          Test and debug the notification system for your saved concorsos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <Badge variant="secondary" className="text-blue-600">
                {unreadCount}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent (0 days)</p>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.daysLeft === 0).length}
                </p>
              </div>
              <Badge variant="destructive">
                {notifications.filter(n => n.daysLeft === 0).length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Logs</p>
                <p className="text-2xl font-bold text-green-600">{emailLogs.length}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Test notification creation and email sending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleCreateNotifications}
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <Spinner size={16} />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Create Notifications
            </Button>

            <Button 
              onClick={handleSendTestEmail}
              disabled={isSendingEmail || unreadCount === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSendingEmail ? (
                <Spinner size={16} />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Test Email
            </Button>

            <Button 
              onClick={handleSendWelcomeEmail}
              disabled={isSendingWelcomeEmail}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSendingWelcomeEmail ? (
                <Spinner size={16} />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send Welcome Email
            </Button>

            <Button 
              onClick={refetch}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button 
              onClick={handleClearAllNotifications}
              variant="outline"
              disabled={isClearing}
              className="flex items-center gap-2"
            >
              {isClearing ? (
                <Spinner size={16} />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Mark All as Read
            </Button>
          </div>

          {unreadCount === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              No unread notifications available for email testing. Create some notifications first.
            </p>
          )}

          {result && (
            <Alert className={`mt-4 ${result.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center gap-2">
                {result.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Logs</CardTitle>
              <CardDescription>
                Recent email notifications sent
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadEmailLogs}
              disabled={isLoadingEmailLogs}
              className="flex items-center gap-2"
            >
              {isLoadingEmailLogs ? (
                <Spinner size={16} />
              ) : (
                <History className="h-4 w-4" />
              )}
              Refresh Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEmailLogs ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size={24} className="mr-2" />
              <span>Loading email logs...</span>
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email logs found</p>
              <p className="text-sm">
                Send a test email to see logs here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.testSend ? "outline" : "secondary"}>
                        {log.type}
                      </Badge>
                      {log.urgentCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {log.urgentCount} urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.notificationCount} notifications sent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(log.sentAt).toLocaleDateString('it-IT')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.sentAt).toLocaleTimeString('it-IT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            Current notifications for your saved concorsos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={32} className="mr-2" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
              <p className="text-sm">
                Save some concorsos and create notifications to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={async (id) => {
                    await NotificationsService.markAsRead(user.uid, id);
                    await refetch();
                  }}
                  fullWidth={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
          <CardDescription>
            Technical details about notifications and email system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="font-semibold">User ID:</span> {user.uid}
            </div>
            <div>
              <span className="font-semibold">User Email:</span> {user.email}
            </div>
            <div>
              <span className="font-semibold">Firebase Collection:</span> userProfiles/{user.uid}/notifications
            </div>
            <div>
              <span className="font-semibold">Email Logs Collection:</span> userProfiles/{user.uid}/emailLog
            </div>
            <div>
              <span className="font-semibold">Notification Thresholds:</span> 7, 3, 1, 0 days before deadline
            </div>
            <div>
              <span className="font-semibold">Scheduled Function:</span> createScheduledNotifications (daily at 9 AM)
            </div>
            <div>
              <span className="font-semibold">Email Provider:</span> Brevo (SendinBlue)
            </div>
            <div>
              <span className="font-semibold">Email Sender:</span> notifiche@concoro.it
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 