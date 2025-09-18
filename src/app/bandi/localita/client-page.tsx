'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { BreadcrumbSEO } from '@/components/ui/breadcrumb-seo'
import RegionProvinceList from '@/components/bandi/RegionProvinceList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Building2, Users, Calendar } from 'lucide-react'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import { categorizeProvincesByRegion, getRegionSlug } from '@/lib/utils/province-categorization'

interface RegionData {
  region: string
  concorsiCount: number
  concorsi: any[]
}

interface LocalitaIndexClientProps {
  regionsData: RegionData[]
}

export default function LocalitaIndexClient({ regionsData }: LocalitaIndexClientProps) {
  // Calculate total statistics
  const totalConcorsi = regionsData.reduce((sum, region) => sum + region.concorsiCount, 0)
  const totalRegions = regionsData.length
  
  // Categorize all provinces by region from all concorsi
  const allConcorsi = regionsData.flatMap(region => region.concorsi)
  const regionsWithProvinces = useMemo(() => {
    return categorizeProvincesByRegion(allConcorsi)
  }, [allConcorsi])

  // Sort regions by concorsi count (most active first)
  const sortedRegionsData = [...regionsData].sort((a, b) => b.concorsiCount - a.concorsiCount)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <BreadcrumbSEO
            items={[
              { label: "Concorsi", href: "/bandi" },
              { label: "Località", href: "/bandi/localita" }
            ]}
          />
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <div className="">
              <h1 className="text-3xl font-bold text-gray-900">
                Concorsi per Località
              </h1>
              <p className="text-gray-600 mt-1">
                Esplora le opportunità di lavoro nel settore pubblico per regione e provincia
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
                    <div className="text-2xl font-bold">{totalConcorsi}</div>
                    <p className="text-xs text-muted-foreground">
                      Concorsi in tutta Italia
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
                    <CardTitle className="text-sm font-medium">Regioni</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalRegions}</div>
                    <p className="text-xs text-muted-foreground">
                      Regioni con concorsi attivi
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
                    <CardTitle className="text-sm font-medium">Province</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {regionsWithProvinces.reduce((sum, region) => sum + region.provinces.length, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Province con opportunità
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Top Regions Sidebar */}
          <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
            <Card className="">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Regioni più Attive
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Le regioni con più concorsi aperti
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {sortedRegionsData.slice(0, 10).map((regionData, index) => (
                    <Link
                      key={index}
                      href={`/bandi/localita/${getRegionSlug(regionData.region)}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm group-hover:text-blue-700 transition-colors">
                              {regionData.region}
                            </div>
                            <div className="text-xs text-gray-500">
                              {regionData.concorsiCount} concorsi
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {regionData.concorsiCount}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - All Regions */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Esplora per Regione e Provincia
                </h2>
                <p className="text-sm text-gray-600">
                  Clicca su una regione per vedere le province disponibili
                </p>
              </div>
              
              {/* Region-Province List */}
              {regionsWithProvinces.length > 0 ? (
                <RegionProvinceList regions={regionsWithProvinces} />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nessun dato disponibile
                    </h3>
                    <p className="text-gray-600">
                      Non ci sono dati di località disponibili al momento.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Mobile Top Regions */}
          <div className="block lg:hidden order-3">
            <Card className="">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Regioni più Attive
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Le regioni con più concorsi aperti
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {sortedRegionsData.slice(0, 5).map((regionData, index) => (
                    <Link
                      key={index}
                      href={`/bandi/localita/${getRegionSlug(regionData.region)}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm group-hover:text-blue-700 transition-colors">
                              {regionData.region}
                            </div>
                            <div className="text-xs text-gray-500">
                              {regionData.concorsiCount} concorsi
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {regionData.concorsiCount}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Content */}
        <div className="mt-12 bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Opportunità di Lavoro Pubblico in Italia
          </h2>
          <div className="prose max-w-none text-gray-600">
            <p>
              Esplora le opportunità di lavoro nel settore pubblico in tutta Italia. 
              Concoro ti aiuta a trovare i migliori concorsi pubblici nella tua regione o provincia, 
              con informazioni dettagliate su requisiti, scadenze e procedure di candidatura.
            </p>
            <p>
              Monitoriamo costantemente nuovi bandi e concorsi da enti pubblici in tutte le regioni italiane, 
              garantendoti accesso immediato alle ultime opportunità di carriera nel settore pubblico.
            </p>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Domande frequenti</h3>
            <div className="space-y-4 text-gray-700">
              <div>
                <h4 className="font-medium">Come trovare concorsi pubblici nella mia regione?</h4>
                <p>
                  Seleziona la tua regione dalla lista e accedi ai concorsi disponibili. 
                  Puoi anche esplorare le singole province per risultati più specifici alla tua zona.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Quali regioni hanno più concorsi pubblici?</h4>
                <p>
                  Ogni regione mostra il numero di concorsi attivi. Le regioni con più concorsi sono generalmente 
                  Lombardia, Lazio, Campania e Emilia-Romagna.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Posso filtrare i concorsi per provincia?</h4>
                <p>
                  Sì, clicca su una regione per vedere le province disponibili e accedere ai concorsi 
                  specifici di quella provincia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
