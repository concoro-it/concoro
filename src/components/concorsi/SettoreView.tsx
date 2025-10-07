'use client'

import { Suspense } from 'react';
import { Concorso } from '@/types/concorso';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Building2,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { ConcorsoCardCompact } from '@/components/concorsi/ConcorsoCardCompact';

interface SettoreViewProps {
  settore: string;
  concorsi: Concorso[];
  totalCount: number;
  totalPositions: number;
  locations: string[];
  enti: string[];
}

export function SettoreView({
  settore,
  concorsi,
  totalCount,
  totalPositions,
  locations,
  enti,
}: SettoreViewProps) {
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
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Settori</span>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2">{settore}</span>
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
                Concorsi Pubblici - {settore}
              </h1>
              <p className="text-gray-600 mt-1">
                Scopri le opportunità di lavoro pubblico nel settore {settore}
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
                      Concorsi aperti nel settore {settore}
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
                    <CardTitle className="text-sm font-medium">Organizzazioni</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enti.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Enti con concorsi in questo settore
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
          {/* Sidebar - Enti and Locations List - Desktop */}
          <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
            {/* Enti Card */}
            <Card>
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Enti ({enti.length})
                </h2>
              </div>
              <CardContent>
                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-2">
                    {enti.map((ente, index) => {
                      const enteCount = concorsi.filter(c => 
                        c.Ente?.toLowerCase() === ente.toLowerCase()
                      ).length;
                      
                      return (
                        <Link 
                          key={index}
                          href={`/concorsi?ente=${encodeURIComponent(ente)}`}
                          className="block"
                        >
                          <div className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden">
                            <div className="font-medium text-sm line-clamp-2 break-words min-w-0" title={ente}>
                              {ente}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {enteCount} {enteCount === 1 ? 'concorso' : 'concorsi'}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Locations List */}
            {locations.length > 0 && (
              <Card className="mt-6">
                <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Località ({locations.length})
                  </h2>
                </div>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-2">
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
                            <div className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden">
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
            )}
          </div>

          {/* Main Content - Concorsi List */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {concorsi.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Concorsi Disponibili ({totalCount}) nel settore {settore}
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
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nessun concorso trovato
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Non ci sono concorsi attivi nel settore {settore} al momento.
                  </p>
                  <p className="text-sm text-gray-500">
                    Torna più tardi per nuove opportunità o esplora altri settori.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Enti and Locations List - Mobile */}
          <div className="block lg:hidden order-3">
            {/* Enti Card */}
            <Card>
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Enti ({enti.length})
                </h2>
              </div>
              <CardContent>
                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-2">
                    {enti.map((ente, index) => {
                      const enteCount = concorsi.filter(c => 
                        c.Ente?.toLowerCase() === ente.toLowerCase()
                      ).length;
                      
                      return (
                        <Link 
                          key={index}
                          href={`/concorsi?ente=${encodeURIComponent(ente)}`}
                          className="block"
                        >
                          <div className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden">
                            <div className="font-medium text-sm line-clamp-2 break-words min-w-0" title={ente}>
                              {ente}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {enteCount} {enteCount === 1 ? 'concorso' : 'concorsi'}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Locations List */}
            {locations.length > 0 && (
              <Card className="mt-6">
                <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Località ({locations.length})
                  </h2>
                </div>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-2">
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
                            <div className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

