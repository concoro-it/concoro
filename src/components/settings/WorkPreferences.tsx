import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, getDocs, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Badge } from '@/components/ui/badge';
import { Pencil, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const REGIONS = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino-Alto Adige',
  'Umbria',
  'Valle d\'Aosta',
  'Veneto'
];

const CATEGORIES = [
  'Amministrativo',
  'Sanitario',
  'Tecnico',
  'Insegnante',
  'Dirigente',
  'Operaio',
  'Impiegato',
];

const CONTRACT_TYPES = [
  'Tempo Indeterminato',
  'Tempo Determinato',
  'Part-time',
  'Apprendistato',
  'Stage',
];

const EDUCATION_LEVELS = [
  'Licenza Media',
  'Diploma',
  'Laurea Triennale',
  'Laurea Magistrale',
  'Dottorato',
];

interface WorkPreferencesProps {
  userId: string;
}

export function WorkPreferences({ userId }: WorkPreferencesProps) {
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [preferredContractType, setPreferredContractType] = useState('');
  const [minEducationLevel, setMinEducationLevel] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states for each section
  const [isRegionsDialogOpen, setIsRegionsDialogOpen] = useState(false);
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);

  useEffect(() => {
    if (!userId || !db) return;

    const userProfileRef = doc(db, 'userProfiles', userId);
    
    // Set up real-time listener for user profile
    const unsubscribe = onSnapshot(userProfileRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPreferredRegions(data.RegioniPreferite || []);
        setPreferredCategories(data.SettoriInteresse || []);
        setPreferredContractType(data.TipologiaContratto || '');
        setMinEducationLevel(data.TitoloStudio || '');
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching user profile:', error);
      toast.error('Errore nel caricamento delle preferenze');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);


  const handleSave = async (section: string, data: any) => {
    try {
      if (!db || !userId) {
        throw new Error('Database or user not initialized');
      }

      const userData = {
        ...data,
        updatedAt: new Date().toISOString()
      };

      const userProfileRef = doc(db, 'userProfiles', userId);
      await setDoc(userProfileRef, userData, { merge: true });
      
      toast.success('Preferenze salvate con successo');
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Impossibile salvare le preferenze');
      return false;
    }
  };

  // Helper to get display label for ente
  const getEnteDisplay = (ente: string) => ente.split(' - ')[0];

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <Card>

      <CardContent className="space-y-6">
        {/* Regions Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Regioni Preferite</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRegionsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Modifica
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferredRegions.map((region) => (
              <Badge 
                key={region} 
                variant="default" 
                className="flex items-center gap-1 cursor-pointer group hover:bg-red-100 hover:text-red-800 transition-colors"
                onClick={() => {
                  const newRegions = preferredRegions.filter(r => r !== region);
                  setPreferredRegions(newRegions);
                  handleSave('regions', { RegioniPreferite: newRegions });
                }}
              >
                {region}
                <X className="h-3 w-3 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ))}
            {preferredRegions.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna regione selezionata</p>
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Categorie Professionali di Interesse</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCategoriesDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Modifica
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferredCategories.map((category) => (
              <Badge 
                key={category} 
                variant="default" 
                className="flex items-center gap-1 cursor-pointer group hover:bg-red-100 hover:text-red-800 transition-colors"
                onClick={() => {
                  const newCategories = preferredCategories.filter(c => c !== category);
                  setPreferredCategories(newCategories);
                  handleSave('categories', { SettoriInteresse: newCategories });
                }}
              >
                {category}
                <X className="h-3 w-3 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ))}
            {preferredCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna categoria selezionata</p>
            )}
          </div>
        </div>

        {/* Contract Type Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Tipologia di Contratto Preferita</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsContractDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Modifica
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferredContractType ? (
              <Badge 
                variant="default" 
                className="flex items-center gap-1 cursor-pointer group hover:bg-red-100 hover:text-red-800 transition-colors"
                onClick={() => {
                  setPreferredContractType('');
                  handleSave('contract', { TipologiaContratto: '' });
                }}
              >
                {preferredContractType}
                <X className="h-3 w-3 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun tipo di contratto selezionato</p>
            )}
          </div>
        </div>

        {/* Education Level Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Titolo di Studio Minimo</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEducationDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Modifica
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {minEducationLevel ? (
              <Badge 
                variant="default" 
                className="flex items-center gap-1 cursor-pointer group hover:bg-red-100 hover:text-red-800 transition-colors"
                onClick={() => {
                  setMinEducationLevel('');
                  handleSave('education', { TitoloStudio: '' });
                }}
              >
                {minEducationLevel}
                <X className="h-3 w-3 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun titolo di studio selezionato</p>
            )}
          </div>
        </div>


        {/* Edit Dialogs */}
        <Dialog open={isRegionsDialogOpen} onOpenChange={setIsRegionsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Regioni Preferite</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <MultiSelect
                options={REGIONS.map(region => ({ label: region, value: region }))}
                selected={preferredRegions}
                onChange={setPreferredRegions}
                placeholder="Seleziona le regioni"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRegionsDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={async () => {
                const success = await handleSave('regions', { RegioniPreferite: preferredRegions });
                if (success) setIsRegionsDialogOpen(false);
              }}>
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCategoriesDialogOpen} onOpenChange={setIsCategoriesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Categorie Professionali</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <MultiSelect
                options={CATEGORIES.map(category => ({ label: category, value: category }))}
                selected={preferredCategories}
                onChange={setPreferredCategories}
                placeholder="Seleziona le categorie"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCategoriesDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={async () => {
                const success = await handleSave('categories', { SettoriInteresse: preferredCategories });
                if (success) setIsCategoriesDialogOpen(false);
              }}>
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Tipologia di Contratto</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Select value={preferredContractType} onValueChange={setPreferredContractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona il tipo di contratto" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={async () => {
                const success = await handleSave('contract', { TipologiaContratto: preferredContractType });
                if (success) setIsContractDialogOpen(false);
              }}>
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEducationDialogOpen} onOpenChange={setIsEducationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Titolo di Studio</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Select value={minEducationLevel} onValueChange={setMinEducationLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona il titolo di studio" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEducationDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={async () => {
                const success = await handleSave('education', { TitoloStudio: minEducationLevel });
                if (success) setIsEducationDialogOpen(false);
              }}>
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </CardContent>
    </Card>
  );
} 