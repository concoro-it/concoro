"use client";

import { Search, Filter, MapPin, Building2, Users } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackgroundBeams } from '@/components/ui/background-beams';

interface ConcorsiLandingProps {
  totalConcorsi: number;
  hasFilters: boolean;
  searchTerm?: string;
  totalPositions?: number;
  uniqueEntiCount?: number;
  uniqueLocalitaCount?: number;
}

export function ConcorsiLanding({ 
  totalConcorsi, 
  hasFilters, 
  searchTerm,
  totalPositions,
  uniqueEntiCount,
  uniqueLocalitaCount
}: ConcorsiLandingProps) {
  const [searchQuery, setSearchQuery] = useState(searchTerm || '');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const url = new URL(window.location.href);
      url.searchParams.set('search', searchQuery.trim());
      url.searchParams.delete('page'); // Reset to first page
      router.push(url.toString());
    }
  };

  const stats = [
    {
      icon: Users,
      label: 'Concorsi Attivi',
      value: totalConcorsi.toLocaleString(),
      description: totalConcorsi === 1 ? 'Opportunità aperta' : 'Opportunità aperte'
    },
    {
      icon: Building2,
      label: 'Enti Pubblici',
      value: uniqueEntiCount !== undefined && uniqueEntiCount > 0
        ? uniqueEntiCount.toLocaleString()
        : '500+',
      description: uniqueEntiCount !== undefined && uniqueEntiCount > 0
        ? `${uniqueEntiCount === 1 ? 'Ente attivo' : 'Enti attivi'}`
        : 'In tutta Italia'
    },
    {
      icon: MapPin,
      label: 'Località',
      value: uniqueLocalitaCount !== undefined && uniqueLocalitaCount > 0
        ? uniqueLocalitaCount.toLocaleString()
        : '8000+',
      description: uniqueLocalitaCount !== undefined && uniqueLocalitaCount > 0
        ? `${uniqueLocalitaCount === 1 ? 'Località attiva' : 'Località attive'}`
        : 'Comuni e città'
    }
  ];

  return (
    <section className="relative bg-background py-16 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6" style={{ letterSpacing: '-0.96px' }}>
            {searchTerm ? (
              <>
                Concorsi Pubblici{' '}
                <span className="text-blue-600">{searchTerm}</span> 2025
              </>
            ) : (
              <>
                Trova il Tuo{' '}
                <span className="text-blue-600">Concorso Pubblico</span>
              </>
            )}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" style={{ letterSpacing: '-0.6px' }}> 
            {searchTerm ? (
              <>
                Scopri tutte le opportunità per <strong>{searchTerm}</strong> nella Pubblica Amministrazione italiana. 
                {totalConcorsi > 0 ? ` ${totalConcorsi.toLocaleString()} ${totalConcorsi === 1 ? 'concorso disponibile' : 'concorsi disponibili'}.` : ' Nessun concorso trovato.'}
              </>
            ) : (
              <>
                Scopri migliaia di opportunità nella Pubblica Amministrazione. 
                Filtra per ente, località e settore professionale per trovare il lavoro perfetto per te.
              </>
            )}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-12">
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Cerca per titolo, ente o descrizione..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="h-12 px-8"
              >
                <Search className="mr-2 h-5 w-5" />
                Cerca
              </Button>
            </div>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-500">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Filter Chips */}
          {!hasFilters && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 font-medium">Cerca per categoria:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { label: 'Roma', param: 'localita', value: 'Roma' },
                  { label: 'Milano', param: 'localita', value: 'Milano' },
                  { label: 'Comune', param: 'ente', value: 'Comune' },
                  { label: 'ASL', param: 'ente', value: 'ASL' },
                  { label: 'Università', param: 'ente', value: 'Università' },
                  { label: 'Istruttore', param: 'search', value: 'Istruttore' },
                  { label: 'Dirigente', param: 'search', value: 'Dirigente' },
                  { label: 'Infermiere', param: 'search', value: 'Infermiere' }
                ].map((filter, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set(filter.param, filter.value);
                      router.push(url.toString());
                    }}
                    className="hover:bg-blue-50 hover:border-blue-300"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Current Filters Display */}
          {hasFilters && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Filter className="h-5 w-5" />
                <span className="font-medium">Filtri attivi</span>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => router.push('/concorsi')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Rimuovi tutti
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Background Beams Effect */}
      <BackgroundBeams />
    </section>
  );
}





