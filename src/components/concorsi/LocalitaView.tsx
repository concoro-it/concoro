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
} from "lucide-react";
import Link from "next/link";
import { ConcorsoCardCompact } from '@/components/concorsi/ConcorsoCardCompact';

interface EnteWithCounts {
  name: string;
  activeCount: number;
  totalCount: number;
}

interface LocalitaViewProps {
  localita: string;
  concorsi: Concorso[];
  totalCount: number;
  totalPositions: number;
  enti: EnteWithCounts[];
  relatedProvinces: string[];
  relatedRegions: string[];
}

export function LocalitaView({
  localita,
  concorsi,
  totalCount,
  totalPositions,
  enti,
  relatedProvinces,
  relatedRegions,
}: LocalitaViewProps) {
  const activeEntiCount = enti.filter(e => e.activeCount > 0).length;

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
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Località</span>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2">{localita}</span>
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
                Concorsi Pubblici a {localita}
              </h1>
              <p className="text-gray-600 mt-1">
                Scopri le opportunità di lavoro pubblico nella zona di {localita}
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
                    <CardTitle className="text-sm font-medium">Concorsi Aperti</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalCount}</div>
                    <p className="text-xs text-muted-foreground">
                      Concorsi attivi a {localita}
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
                    <CardTitle className="text-sm font-medium">Organizzazioni Attive</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeEntiCount}</div>
                    <p className="text-xs text-muted-foreground">
                      Enti con bandi aperti
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
                    <CardTitle className="text-sm font-medium">Posizioni Lavorative</CardTitle>
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar - Enti List - Desktop */}
          <div className="hidden lg:block lg:col-span-2 order-1 lg:order-2">
            <div className="sticky top-20 space-y-2 h-fit">
              {/* Enti Card */}
              <Card className="overflow-hidden">
                <div className="flex justify-between items-center pt-6 pl-4 pr-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Enti ({enti.length})  
                  </h2>
                </div>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="px-2 pb-6 space-y-2">
                      {enti.map((ente, index) => {
                        const isActive = ente.activeCount > 0;
                        
                        return (
                          <Link 
                            key={index}
                            href={`/concorsi?ente=${encodeURIComponent(ente.name)}`}
                            className="block"
                          >
                            <div 
                              className={`p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden ${
                                !isActive ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="font-medium text-sm line-clamp-2 break-words min-w-0" title={ente.name}>
                                {ente.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {ente.activeCount > 0 ? (
                                  <span className="text-green-600 font-medium">
                                    {ente.activeCount} {ente.activeCount === 1 ? 'concorso attivo' : 'concorsi attivi'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">
                                    Nessun concorso attivo
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Related Provinces List */}
              {relatedProvinces.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="flex justify-between items-center pt-6 pl-6 pr-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Province Correlate ({relatedProvinces.length})
                    </h2>
                  </div>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-2">
                      {relatedProvinces.map((province, index) => (
                        <Link 
                          key={index}
                          href={`/concorsi?localita=${encodeURIComponent(province)}`}
                          className="block"
                        >
                          <div 
                            className="p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-sm line-clamp-2 break-words" title={province}>
                              {province}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Regions List */}
              {relatedRegions.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="flex justify-between items-center pt-6 pl-6 pr-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Regioni Correlate ({relatedRegions.length})
                    </h2>
                  </div>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-2">
                      {relatedRegions.map((region, index) => (
                        <Link 
                          key={index}
                          href={`/concorsi?localita=${encodeURIComponent(region)}`}
                          className="block"
                        >
                          <div 
                            className="p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-sm line-clamp-2 break-words" title={region}>
                              {region}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main Content - Concorsi List */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {concorsi.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Concorsi Disponibili ({totalCount}) a {localita}
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
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nessun concorso trovato
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Non ci sono concorsi attivi a {localita} al momento.
                  </p>
                  <p className="text-sm text-gray-500">
                    Torna più tardi per nuove opportunità o esplora altre località.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Enti List - Mobile */}
          <div className="block lg:hidden order-3">
            <Card className="">
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Enti ({enti.length})  
                </h2>
              </div>
              <CardContent className="">
                <ScrollArea className="h-[420px] pr-2">
                  <div className="space-y-2">
                    {enti.map((ente, index) => {
                      const isActive = ente.activeCount > 0;
                      
                      return (
                        <Link 
                          key={index}
                          href={`/concorsi?ente=${encodeURIComponent(ente.name)}`}
                          className="block"
                        >
                          <div 
                            className={`p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden ${
                              !isActive ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="font-medium text-sm line-clamp-2 break-words min-w-0" title={ente.name}>
                              {ente.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {ente.activeCount > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {ente.activeCount} {ente.activeCount === 1 ? 'concorso attivo' : 'concorsi attivi'}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  Nessun concorso attivo
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Mobile Related Provinces */}
            {relatedProvinces.length > 0 && (
              <Card className="mt-4">
                <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Province Correlate ({relatedProvinces.length})
                  </h2>
                </div>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-2">
                    {relatedProvinces.map((province, index) => (
                      <Link 
                        key={index}
                        href={`/concorsi?localita=${encodeURIComponent(province)}`}
                        className="block"
                      >
                        <div 
                          className="p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="font-medium text-sm line-clamp-2 break-words" title={province}>
                            {province}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile Related Regions */}
            {relatedRegions.length > 0 && (
              <Card className="mt-4">
                <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Regioni Correlate ({relatedRegions.length})
                  </h2>
                </div>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-2">
                    {relatedRegions.map((region, index) => (
                      <Link 
                        key={index}
                        href={`/concorsi?localita=${encodeURIComponent(region)}`}
                        className="block"
                      >
                        <div 
                          className="p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="font-medium text-sm line-clamp-2 break-words" title={region}>
                            {region}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

