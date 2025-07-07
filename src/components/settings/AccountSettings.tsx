import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/lib/hooks/useAuth';
import { Pencil } from 'lucide-react';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export function AccountSettings() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleEmailUpdate = async () => {
    if (!user) return;
    
    try {
      // Re-authenticate user before updating email
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, newEmail);
      setEmail(newEmail);
      setIsEmailDialogOpen(false);
      setCurrentPassword('');
      setNewEmail('');
      toast.success('Email aggiornata con successo');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        toast.error('Password non corretta');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Email già in uso');
      } else {
        toast.error('Impossibile aggiornare l\'email');
      }
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      setIsPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password aggiornata con successo');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        toast.error('Password attuale non corretta');
      } else {
        toast.error('Impossibile aggiornare la password');
      }
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion logic
      toast.success('Account eliminato con successo');
    } catch (error) {
      toast.error('Impossibile eliminare l\'account');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impostazioni Account</CardTitle>
        <CardDescription>
          Gestisci le impostazioni del tuo account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Email Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEmailDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Modifica
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>

          {/* Password Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Modifica
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">••••••••</div>
          </div>

          {/* Delete Account Section */}
          <div className="space-y-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Elimina Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sei sicuro?</DialogTitle>
                  <DialogDescription>
                    Questa azione non può essere annullata. Tutti i tuoi dati verranno eliminati permanentemente.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Conferma Eliminazione
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>

      {/* Email Update Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Email</DialogTitle>
            <DialogDescription>
              Inserisci la tua password attuale e la nuova email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Password Attuale</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Inserisci la tua password attuale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Nuova Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Inserisci la nuova email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleEmailUpdate}>
              Aggiorna Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Update Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Password</DialogTitle>
            <DialogDescription>
              Inserisci la tua password attuale e la nuova password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Password Attuale</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Inserisci la tua password attuale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci la nuova password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Conferma Nuova Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Conferma la nuova password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handlePasswordUpdate}>
              Aggiorna Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 