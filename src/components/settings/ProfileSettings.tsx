import { useState } from 'react';
import { useProfile } from '@/lib/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function ProfileSettings() {
  const { profile, loading, error, updateProfile } = useProfile();
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    currentTitle: profile?.currentPosition || '',
    yearsOfExperience: '',
    skills: profile?.skills?.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const skillObjects = formData.skills
        .split(',')
        .map((skill: string) => skill.trim())
        .filter(Boolean)
        .map((skillName: string) => ({
          id: uuidv4(),
          name: skillName,
          proficiency: 'intermediate' as const
        }));
      
      const success = await updateProfile({
        displayName: formData.displayName,
        currentPosition: formData.currentTitle,
        skills: skillObjects,
      });

      if (success) {
        toast.success('Profilo aggiornato con successo');
      }
    } catch (err) {
      toast.error('Impossibile aggiornare il profilo');
    }
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }

  if (error) {
    return <div>Errore: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impostazioni Profilo</CardTitle>
        <CardDescription>
          Gestisci le informazioni del tuo profilo professionale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome visualizzato</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Il tuo nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentTitle">Titolo attuale</Label>
              <Input
                id="currentTitle"
                value={formData.currentTitle}
                onChange={(e) =>
                  setFormData({ ...formData, currentTitle: e.target.value })
                }
                placeholder="La tua posizione attuale"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Anni di esperienza</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData({ ...formData, yearsOfExperience: e.target.value })
                }
                placeholder="Numero di anni di esperienza"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Competenze</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                placeholder="Inserisci le tue competenze separate da virgole"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Salva modifiche
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 