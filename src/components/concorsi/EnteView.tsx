'use client'

import { Suspense } from 'react';
import { Concorso } from '@/types/concorso';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Building2,
} from "lucide-react";
import Link from "next/link";
import { ConcorsoCardCompact } from '@/components/concorsi/ConcorsoCardCompact';

interface EnteViewProps {
  ente: string;
  concorsi: Concorso[];
  totalCount: number;
  totalPositions: number;
  locations: string[];
  settori: string[];
}

export function EnteView({
  ente,
  concorsi,
  totalCount,
  totalPositions,
  locations,
  settori,
}: EnteViewProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link 
                  href="/concorsi" 
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Concorsi
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Enti</span>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2">{ente}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Concorsi Pubblici {ente}
              </h1>
              <p className="text-gray-600 mt-1">
                Scopri le opportunità di lavoro pubblico presso {ente}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
            <div className="relative group">
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="absolute inset-0">
                  <GlowingEffect 
                    disabled={false}
                    glow={true}
                    blur={10}
                    spread={60}
                    movementDuration={1}
                    inactiveZone={0.2}
                    proximity={100}
                  />
                </div>
                <div className="relative z-10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Concorsi Attivi</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalCount}</div>
                    <p className="text-xs text-muted-foreground">
                      Concorsi aperti di {ente}
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            <div className="relative group">
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="absolute inset-0">
                  <GlowingEffect 
                    disabled={false}
                    glow={true}
                    blur={10}
                    spread={60}
                    movementDuration={1}
                    inactiveZone={0.2}
                    proximity={100}
                  />
                </div>
                <div className="relative z-10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Località Operative</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{locations.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Aree geografiche attive
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            <div className="relative group">
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="absolute inset-0">
                  <GlowingEffect 
                    disabled={false}
                    glow={true}
                    blur={10}
                    spread={60}
                    movementDuration={1}
                    inactiveZone={0.2}
                    proximity={100}
                  />
                </div>
                <div className="relative z-10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Posti Disponibili</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalPositions}</div>
                    <p className="text-xs text-muted-foreground">
                      Posizioni lavorative totali
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar - Locations List - Desktop */}
          <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Località ({locations.length})
                </h2>
              </div>
              <CardContent>
                <ScrollArea className="pr-2 max-h-[400px]">
                  <div className="space-y-2">
                    {locations.map((location, index) => {
                      // Count concorsi for this location
                      const locationCount = concorsi.filter(c => {
                        if (c.isGrouped && c.regions) {
                          return c.regions.some(region => 
                            region.trim().toLowerCase() === location.trim().toLowerCase()
                          );
                        } else {
                          if (!c.AreaGeografica) return false;
                          const normalizedLocation = c.AreaGeografica.trim().toLowerCase();
                          const normalizedCurrentLocation = location.trim().toLowerCase();
                          return normalizedLocation.includes(normalizedCurrentLocation) || normalizedCurrentLocation.includes(normalizedLocation);
                        }
                      }).length;

                      return (
                        <Link 
                          key={index}
                          href={`/concorsi?localita=${encodeURIComponent(location)}`}
                          className="block"
                        >
                          <div className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="font-medium text-sm line-clamp-2 truncate" title={location}>
                              {location}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {locationCount} {locationCount === 1 ? 'concorso' : 'concorsi'}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Settori List */}
            {settori.length > 0 && (
              <Card className="mt-6">
                <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Settori ({settori.length})
                  </h2>
                </div>
                <CardContent>
                  <ScrollArea className="pr-2 max-h-[400px]">
                    <div className="space-y-2">
                      {settori.map((settore, index) => {
                        const settoreCount = concorsi.filter(c => 
                          c.settore_professionale?.toLowerCase() === settore.toLowerCase()
                        ).length;
                        
                        return (
                          <Link 
                            key={index}
                            href={`/concorsi?settore=${encodeURIComponent(settore)}`}
                            className="block"
                          >
                            <div className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                              <div className="font-medium text-sm line-clamp-2 truncate" title={settore}>
                                {settore}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {settoreCount} {settoreCount === 1 ? 'concorso' : 'concorsi'}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Concorsi List */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {concorsi.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Concorsi Disponibili ({totalCount}) di {ente}
                  </h2>
                </div>
                
                <Suspense fallback={<div>Caricamento concorsi...</div>}>
                  <div className="space-y-4">
                    {concorsi.map((concorso) => (
                      <ConcorsoCardCompact 
                        key={concorso.id} 
                        concorso={concorso}
                        showSaveButton={false}
                      />
                    ))}
                  </div>
                </Suspense>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nessun concorso trovato
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Non ci sono concorsi attivi di {ente} al momento.
                  </p>
                  <p className="text-sm text-gray-500">
                    Torna più tardi per nuove opportunità o esplora altri enti.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* SEO Footer Content */}
            <div className="mt-12 bg-white border rounded-lg p-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Top Settori */}
                {settori.length > 0 && (
                  <div className="mt-8 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Settori Principali</h2>
                    <div className="flex flex-wrap gap-2">
                      {settori.slice(0, 10).map((settore, index) => (
                        <Link 
                          key={index}
                          href={`/concorsi?settore=${encodeURIComponent(settore)}`}
                        >
                          <Badge 
                            variant="secondary" 
                            className="text-sm px-3 py-1 hover:bg-gray-200 cursor-pointer"
                          >
                            {settore}
                          </Badge>
                        </Link>
                      ))}
                      {settori.length > 10 && (
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          +{settori.length - 10} altri
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Opportunità di Lavoro Pubblico presso {ente}
                </h2>
                <div className="prose max-w-none text-gray-600">
                  <p>
                    Esplora le opportunità di lavoro presso {ente}. 
                    Concoro ti aiuta a trovare i migliori concorsi pubblici di questo ente, 
                    con informazioni dettagliate su requisiti, scadenze e procedure di candidatura.
                  </p>
                  <p>
                    Monitoriamo costantemente nuovi bandi e concorsi di {ente}, 
                    garantendoti accesso immediato alle ultime opportunità di carriera nel settore pubblico.
                  </p>
                </div>
                
                {/* FAQ Section for SEO and UX */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Domande frequenti</h3>
                  <div className="space-y-4 text-gray-700">
                    <div>
                      <h4 className="font-medium">Come candidarsi ai concorsi di {ente}?</h4>
                      <p>
                        Utilizza questa pagina per consultare i concorsi attivi di {ente}. Puoi navigare
                        per settore o località e aprire ciascun concorso per i dettagli su requisiti e domanda.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Quali sono le scadenze dei bandi di {ente}?</h4>
                      <p>
                        Ogni scheda riporta la data di scadenza aggiornata. Ti consigliamo di candidarti il prima possibile
                        e di verificare spesso eventuali nuovi bandi di {ente}.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">In quali settori assume {ente}?</h4>
                      <p>
                        {ente} pubblica bandi in diversi settori professionali.
                        Puoi esplorare l'elenco dei settori nella barra laterale e accedere ai relativi bandi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Locations List - Mobile */}
          <div className="block lg:hidden order-3">
            <Card>
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Località ({locations.length})
                </h2>
              </div>
              <CardContent>
                <ScrollArea className="h-[420px] pr-2">
                  <div className="space-y-2">
                    {locations.map((location, index) => {
                      const locationCount = concorsi.filter(c => {
                        if (c.isGrouped && c.regions) {
                          return c.regions.some(region => 
                            region.trim().toLowerCase() === location.trim().toLowerCase()
                          );
                        } else {
                          if (!c.AreaGeografica) return false;
                          const normalizedLocation = c.AreaGeografica.trim().toLowerCase();
                          const normalizedCurrentLocation = location.trim().toLowerCase();
                          return normalizedLocation.includes(normalizedCurrentLocation) || normalizedCurrentLocation.includes(normalizedLocation);
                        }
                      }).length;

                      return (
                        <Link 
                          key={index}
                          href={`/concorsi?localita=${encodeURIComponent(location)}`}
                          className="block"
                        >
                          <div className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="font-medium text-sm line-clamp-2 truncate" title={location}>
                              {location}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {locationCount} {locationCount === 1 ? 'concorso' : 'concorsi'}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

