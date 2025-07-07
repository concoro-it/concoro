import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function DataPrivacy() {
  const [dataConsent, setDataConsent] = useState(true);

  const handleExportData = async () => {
    try {
      // TODO: Implement data export logic
      toast.success('Dati esportati con successo');
    } catch (error) {
      toast.error('Impossibile esportare i dati');
    }
  };

  const handleConsentChange = async (checked: boolean) => {
    try {
      // TODO: Implement consent update logic
      setDataConsent(checked);
      toast.success('Consenso aggiornato con successo');
    } catch (error) {
      toast.error('Impossibile aggiornare il consenso');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dati e Privacy</CardTitle>
        <CardDescription>
          Gestisci i tuoi dati personali e le impostazioni sulla privacy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Esportazione Dati</Label>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Scarica i Dati Personali</p>
                <p className="text-sm text-muted-foreground">
                  Scarica una copia dei tuoi dati personali in formato GDPR
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Scarica Dati</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Esportazione Dati</DialogTitle>
                    <DialogDescription>
                      Stai per scaricare una copia dei tuoi dati personali. Questa operazione potrebbe richiedere alcuni minuti.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button onClick={handleExportData}>
                      Conferma Esportazione
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Gestione Consenso</Label>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Consenso all'Uso dei Dati</p>
                <p className="text-sm text-muted-foreground">
                  Autorizza l'uso dei tuoi dati per migliorare il servizio
                </p>
              </div>
              <Switch
                checked={dataConsent}
                onCheckedChange={handleConsentChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 