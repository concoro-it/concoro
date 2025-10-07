"use client";

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConcorsiFiltersProps {
  filters: {
    enti: string[];
    localita: string[];
    settori: string[];
  };
  currentFilters: {
    localita?: string;
    settore?: string;
    scadenza?: string;
    sort?: string;
    search?: string;
  };
  onSetLoading?: (loading: boolean) => void;
}

// List of Italian regions
const ITALIAN_REGIONS = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche', 
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana', 
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
];

export function ConcorsiFilters({ filters, currentFilters, onSetLoading }: ConcorsiFiltersProps) {
  const router = useRouter();

  const updateFilter = (key: string, value: string) => {
    onSetLoading?.(true);
    const url = new URL(window.location.href);
    
    // Toggle filter - if already selected, remove it
    if (currentFilters[key as keyof typeof currentFilters] === value) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    
    // Reset to first page when filters change
    url.searchParams.delete('page');
    
    router.push(url.toString());
  };

  const clearAllFilters = () => {
    const url = new URL(window.location.pathname, window.location.origin);
    router.push(url.toString());
  };

  const hasActiveFilters = !!(
    currentFilters.localita || 
    currentFilters.settore ||
    currentFilters.scadenza ||
    (currentFilters.sort && currentFilters.sort !== 'publication-desc')
  );

  // Sort function to put "Non specificato" and empty values at the end
  const sortWithNonSpecificato = (a: string, b: string) => {
    const nonSpecA = a.toLowerCase().includes('non specificato') || a.toLowerCase() === 'n/a' || a === '';
    const nonSpecB = b.toLowerCase().includes('non specificato') || b.toLowerCase() === 'n/a' || b === '';
    if (nonSpecA) return 1;
    if (nonSpecB) return -1;
    return a.localeCompare(b);
  };

  // Extract unique main regions from localita strings
  const extractMainRegions = (localitaList: string[]): string[] => {
    const regionsSet = new Set<string>();
    
    localitaList.forEach(location => {
      if (!location || location.trim() === '') return;
      
      // Split by comma and process each part
      const parts = location.split(',').map(part => part.trim());
      
      parts.forEach(part => {
        // Check if this part matches any Italian region
        const matchedRegion = ITALIAN_REGIONS.find(region => 
          part.toLowerCase() === region.toLowerCase() ||
          part.toLowerCase().startsWith(region.toLowerCase() + ' ')
        );
        
        if (matchedRegion) {
          regionsSet.add(matchedRegion);
        }
      });
    });
    
    return Array.from(regionsSet);
  };

  const regions = extractMainRegions(filters.localita).sort(sortWithNonSpecificato);

  // Filter and clean settori - remove duplicates with number prefixes
  const settori = filters.settori
    .filter(settore => {
      if (!settore || settore.trim() === '') return false;
      // Filter out entries that start with a number followed by a dot (e.g., "2. Tecnico e Ingegneria")
      return !settore.match(/^\d+\.\s/);
    })
    .sort(sortWithNonSpecificato);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Filtri</h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearAllFilters}
            className="text-blue-600 hover:text-blue-800 h-auto p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pr-4">
          {/* Regioni */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Regioni</Label>
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <Badge
                  key={region}
                  variant={currentFilters.localita === region ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    currentFilters.localita === region
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "hover:bg-blue-100 hover:text-blue-800"
                  }`}
                  onClick={() => updateFilter('localita', region)}
                >
                  {region}
                  {currentFilters.localita === region && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Scadenza */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Scadenza</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Oggi", value: "today" },
                { label: "Questa Settimana", value: "week" },
                { label: "Questo Mese", value: "month" },
              ].map(deadline => (
                <Badge
                  key={deadline.value}
                  variant={currentFilters.scadenza === deadline.value ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    currentFilters.scadenza === deadline.value
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "hover:bg-green-100 hover:text-green-800"
                  }`}
                  onClick={() => updateFilter('scadenza', deadline.value)}
                >
                  {deadline.label}
                  {currentFilters.scadenza === deadline.value && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Settore Professionale */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Settore Professionale</Label>
            <div className="flex flex-wrap gap-2">
              {settori.map((settore) => (
                <Badge
                  key={settore}
                  variant={currentFilters.settore === settore ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    currentFilters.settore === settore
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "hover:bg-orange-100 hover:text-orange-800"
                  }`}
                  onClick={() => updateFilter('settore', settore)}
                >
                  {settore}
                  {currentFilters.settore === settore && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Ordinamento */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Ordinamento</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Scadenza (più vicina)", value: "deadline-asc" },
                { label: "Data di pubblicazione (più recente)", value: "publication-desc" },
                { label: "Posti disponibili (più posti)", value: "posts-desc" }
              ].map(sort => (
                <Badge
                  key={sort.value}
                  variant={currentFilters.sort === sort.value ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    currentFilters.sort === sort.value
                      ? "bg-teal-500 text-white hover:bg-teal-600"
                      : "hover:bg-teal-100 hover:text-teal-800"
                  }`}
                  onClick={() => updateFilter('sort', sort.value)}
                >
                  {sort.label}
                  {currentFilters.sort === sort.value && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="w-full"
              >
                Cancella tutti i filtri
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}





