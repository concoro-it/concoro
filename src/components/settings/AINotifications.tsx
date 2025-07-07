import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';


export function AINotifications() {
  const [isAIMatchingEnabled, setIsAIMatchingEnabled] = useState(false);
  const [isDeadlineRemindersEnabled, setIsDeadlineRemindersEnabled] = useState(true);
  const [newContestsNotification, setNewContestsNotification] = useState('daily');
  const [notificationMethod, setNotificationMethod] = useState('email');

  const handleSave = async () => {
    try {
      // TODO: Implement save logic
      toast.success('Impostazioni salvate con successo');
    } catch (error) {
      toast.error('Impossibile salvare le impostazioni');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI e Notifiche</CardTitle>
        <CardDescription>
          Gestisci le impostazioni di matching AI e le notifiche
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Attiva Matching AI</p>
                <p className="text-sm text-muted-foreground">
                  Ricevi suggerimenti personalizzati basati sul tuo profilo
                </p>
              </div>
              <Switch
                checked={isAIMatchingEnabled}
                onCheckedChange={setIsAIMatchingEnabled}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Promemoria e Avvisi</Label>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Promemoria per Scadenze</p>
                <p className="text-sm text-muted-foreground">
                  Ricevi promemoria per le scadenze di candidatura
                </p>
              </div>
              <Switch
                checked={isDeadlineRemindersEnabled}
                onCheckedChange={setIsDeadlineRemindersEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Avvisi per Nuovi Concorsi</Label>
              <Select
                value={newContestsNotification}
                onValueChange={setNewContestsNotification}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona la frequenza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Giornaliero</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                  <SelectItem value="disabled">Disattivato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Metodo di Notifica</Label>
              <Select
                value={notificationMethod}
                onValueChange={setNotificationMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona il metodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Notifiche Push</SelectItem>
                  <SelectItem value="both">Entrambi</SelectItem>
                </SelectContent>
              </Select>
            
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Salva Impostazioni
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 