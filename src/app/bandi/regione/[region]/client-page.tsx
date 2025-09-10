'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
// Use any type for now since we're dealing with flexible data structure
interface ConcorsoData {
  id: string
  Titolo?: string
  Ente?: string
  AreaGeografica?: string
  numero_di_posti?: number
  settore_professionale?: string
  regime?: string
  "Data chiusura candidature"?: any
  DataChiusura?: any
  riassunto?: string
  [key: string]: any
}
import { BreadcrumbSEO } from '@/components/ui/breadcrumb-seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Building2, Calendar, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'
import { formatLocalitaDisplay } from '@/lib/utils/region-utils'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

interface RegionClientProps {
  region: string
  concorsi: ConcorsoData[]
  totalCount: number
  enti: string[]
  regionSlug: string
}

export default function RegionClient({ 
  region, 
  concorsi = [], 
  totalCount = 0, 
  enti = [],
  regionSlug 
}: RegionClientProps) {
  // Ensure we always have valid data
  const [displayedConcorsi, setDisplayedConcorsi] = useState<ConcorsoData[]>(
    Array.isArray(concorsi) ? concorsi : []
  )
  const [loading, setLoading] = useState(false)

  // Update displayed concorsi when props change
  useEffect(() => {
    if (Array.isArray(concorsi) && concorsi.length > 0) {
      setDisplayedConcorsi(concorsi)
    }
  }, [concorsi])

  // Memoize deadline status function to avoid recreation on every render
  const getDeadlineStatus = useMemo(() => (closingDate: any) => {
    if (!closingDate) return null
    
    try {
      let date: Date
      if (typeof closingDate === 'string') {
        date = parseISO(closingDate)
      } else if (closingDate.seconds) {
        date = new Date(closingDate.seconds * 1000)
      } else {
        return null
      }
      
      const now = new Date()
      if (date < now) {
        return { status: 'expired', text: 'Scaduto' }
      }
      
      const distance = formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: it 
      })
      return { status: 'active', text: `Scade ${distance}` }
    } catch (error) {
      return null
    }
  }, [])

  // Early return if no data
  if (!region || (!displayedConcorsi && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Regione non trovata</h1>
          <p className="text-gray-600">La regione richiesta non è disponibile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="min-w-0 overflow-hidden">
            <BreadcrumbSEO
              items={[]}
              areaGeografica={region}
              enableRegionHierarchy={true}
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Concorsi Pubblici in {region}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Scopri {totalCount || 0} opportunità di lavoro nel settore pubblico in {region}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Concorsi Attivi</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enti Pubblici</p>
                    <p className="text-2xl font-bold text-gray-900">{enti?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Regione</p>
                    <p className="text-2xl font-bold text-gray-900">{region}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Enti Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enti Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enti Pubblici in {region}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(enti || []).slice(0, 10).map((ente) => {
                    // Count concorsi for this ente from already loaded data
                    const enteConcorsiCount = displayedConcorsi.filter(
                      concorso => concorso.Ente === ente
                    ).length
                    
                    return (
                      <Link
                        key={ente}
                        href={`/bandi/ente/${encodeURIComponent(ente)}`}
                        className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block">
                              {ente}
                            </span>
                            <span className="text-xs text-gray-500">
                              {enteConcorsiCount} concors{enteConcorsiCount === 1 ? 'o' : 'i'}
                            </span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                      </Link>
                    )
                  })}
                  {(enti?.length || 0) > 10 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      e altri {(enti?.length || 0) - 10} enti
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Concorsi List */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ultimi Concorsi Pubblicati
              </h2>
            </div>

            <div className="space-y-4">
              {(displayedConcorsi || []).map((concorso) => {
                const deadlineStatus = getDeadlineStatus(
                  concorso["Data chiusura candidature"] || concorso.DataChiusura
                )
                const bandoUrl = getBandoUrl(concorso as any)

                return (
                  <Card key={concorso.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <Link 
                            href={bandoUrl}
                            className="block group"
                          >
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                              {concorso.Titolo}
                            </h3>
                          </Link>
                          
                          <div className="flex items-center text-gray-600 mb-2">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {concorso.Ente}
                            </span>
                          </div>

                          {concorso.AreaGeografica && (
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                {formatLocalitaDisplay(concorso.AreaGeografica)}
                              </span>
                            </div>
                          )}

                          {concorso.numero_di_posti && (
                            <div className="flex items-center text-gray-600 mb-2">
                              <Users className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                {concorso.numero_di_posti} posti
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          {deadlineStatus && (
                            <Badge 
                              variant={deadlineStatus.status === 'expired' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              {deadlineStatus.text}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {concorso.settore_professionale && (
                            <Badge variant="outline" className="text-xs">
                              {concorso.settore_professionale}
                            </Badge>
                          )}
                          {concorso.regime && (
                            <Badge variant="outline" className="text-xs">
                              {concorso.regime}
                            </Badge>
                          )}
                        </div>

                        <Button asChild size="sm">
                          <Link href={bandoUrl}>
                            Visualizza
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* All concorsi are now displayed directly */}
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="mt-12 bg-white rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Opportunità di Lavoro Pubblico in {region}
          </h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed">
              La regione {region} offre numerose opportunità nel settore pubblico attraverso 
              concorsi e selezioni pubbliche. I principali enti che bandiscono concorsi includono 
              comuni, province, aziende sanitarie locali, università e altri enti pubblici.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Monitora costantemente i bandi pubblicati in {region} per non perdere 
              l'opportunità di costruire una carriera stabile nel settore pubblico. 
              Tutti i concorsi sono costantemente aggiornati e verificati per garantire 
              informazioni accurate e tempestive.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
