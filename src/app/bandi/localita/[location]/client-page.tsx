'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBandoUrl } from '@/lib/utils/bando-slug-utils'

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
  province?: Array<{
    regione_nome: string
    provincia_nome?: string
  }>
  [key: string]: any
}

import { BreadcrumbSEO } from '@/components/ui/breadcrumb-seo'
import { ConcoroList } from '@/components/bandi/ConcoroList'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Building2, Users, Calendar } from 'lucide-react'
import { GlowingEffect } from '@/components/ui/glowing-effect'

interface LocationClientProps {
  location: string
  concorsi: ConcorsoData[]
  totalCount: number
  enti: string[]
  locationSlug: string
  provinces: string[]  // Array of province names
  isRegion?: boolean   // Whether this is a region or city
}

export default function LocationClient({ 
  location, 
  concorsi = [], 
  totalCount = 0, 
  enti = [],
  locationSlug,
  provinces = [],
  isRegion = false
}: LocationClientProps) {
  const router = useRouter()
  
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

  // Debug log for provinces
  useEffect(() => {
    console.log('Provinces in client:', provinces)
    if (provinces.length > 0) {
      console.log('First concorso province data:', displayedConcorsi[0]?.province)
    }
  }, [provinces, displayedConcorsi])

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

  // Handle job selection for navigation
  const handleJobSelect = (job: ConcorsoData) => {
    try {
      // Use getBandoUrl utility to get SEO-friendly URL
      const seoUrl = getBandoUrl(job);
      router.push(seoUrl);
    } catch (error) {
      console.error('Error navigating to job:', error);
      // Fallback to ID-based URL if SEO URL generation fails
      router.push(`/bandi/${job.id}`);
    }
  }

  // Early return if no data
  if (!location || (!displayedConcorsi && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Località non trovata</h1>
          <p className="text-gray-600">La località richiesta non è disponibile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <BreadcrumbSEO
            items={[
              { label: "Concorsi", href: "/bandi" },
              { label: isRegion ? "Regioni" : "Località", href: "/bandi" },
              { label: location, href: `/bandi/localita/${locationSlug}` }
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
                Concorsi Pubblici {location}
              </h1>
              <p className="text-gray-600 mt-1">
                Scopri le opportunità di lavoro nel settore pubblico {isRegion ? 'nella regione' : 'in'} {location}
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
                      Concorsi aperti {isRegion ? 'nella regione' : 'in'} {location}
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
                    <CardTitle className="text-sm font-medium">Enti Attivi</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enti.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Organizzazioni con bandi aperti
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
                    <div className="text-2xl font-bold">
                      {displayedConcorsi.reduce((total, concorso) => 
                        total + (concorso.numero_di_posti || 1), 0
                      )}
                    </div>
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
          {/* Sidebar - Enti List - Desktop */}
          <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
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
                      // Normalize both strings by trimming and converting to lowercase
                      const enteCount = displayedConcorsi.filter(c => {
                        if (!c.Ente) return false;
                        const normalizedEnte = c.Ente.trim().toLowerCase();
                        const normalizedCurrentEnte = ente.trim().toLowerCase();
                        return normalizedEnte === normalizedCurrentEnte;
                      }).length;
                      return (
                        <Link 
                          key={index}
                          href={`/bandi/ente/${encodeURIComponent(ente)}`}
                          className="block"
                        >
                          <div 
                            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-sm line-clamp-2" title={ente}>
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

            {/* Province List */}
            {provinces.length > 0 && (
              <Card className="mt-6">
                <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Province ({provinces.length})
                  </h2>
                </div>
                <CardContent className="">
                  <ScrollArea className="h-[420px] pr-2">
                    <div className="space-y-2">
                      {provinces.map((provincia, index) => {
                        // Count concorsi for this province
                        const provinceCount = displayedConcorsi.filter(c => 
                          c.province?.some(p => 
                            p.provincia_nome?.toLowerCase() === provincia.toLowerCase()
                          )
                        ).length;
                        
                        return (
                          <Link 
                            key={index}
                            href={`/bandi/provincia/${encodeURIComponent(provincia)}`}
                            className="block"
                          >
                            <div 
                              className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div className="font-medium text-sm line-clamp-2" title={provincia}>
                                {provincia}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {provinceCount} {provinceCount === 1 ? 'concorso' : 'concorsi'}
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
            {displayedConcorsi.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Concorsi Disponibili ({totalCount}) {isRegion ? 'nella regione' : 'in'} {location}
                  </h2>
                </div>
                
                <Suspense fallback={<div>Caricamento concorsi...</div>}>
                  <ConcoroList 
                    jobs={displayedConcorsi} 
                    isLoading={loading}
                    isLoadingMore={false}
                    selectedJobId={null}
                    onJobSelect={handleJobSelect}
                    onLoadMore={() => {}}
                    hasMore={false} // When false, shows all items without pagination
                  />
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
                    Non ci sono concorsi attivi {isRegion ? 'nella regione' : 'in'} {location} al momento.
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
                      // Normalize both strings by trimming and converting to lowercase
                      const enteCount = displayedConcorsi.filter(c => {
                        if (!c.Ente) return false;
                        const normalizedEnte = c.Ente.trim().toLowerCase();
                        const normalizedCurrentEnte = ente.trim().toLowerCase();
                        return normalizedEnte === normalizedCurrentEnte;
                      }).length;
                      return (
                        <Link 
                          key={index}
                          href={`/bandi/ente/${encodeURIComponent(ente)}`}
                          className="block"
                        >
                          <div 
                            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-sm line-clamp-2" title={ente}>
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
          </div>


        </div>
        <div className="lg:col-span-3 order-2 lg:order-1">


{/* Opportunità di Lavoro Footer */}
<div className="mt-12 bg-white border rounded-lg p-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {/* Top Enti */}
          {enti.length > 0 && (
              <div className="mt-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Enti Principali</h2>
              <div className="flex flex-wrap gap-2">
                  {enti.slice(0, 10).map((ente, index) => (
                  <Link 
                      key={index}
                      href={`/bandi/ente/${encodeURIComponent(ente)}`}
                  >
                      <Badge 
                      variant="secondary" 
                      className="text-sm px-3 py-1 hover:bg-gray-200 cursor-pointer"
                      >
                      {ente}
                      </Badge>
                  </Link>
                  ))}
                  {enti.length > 10 && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                      +{enti.length - 10} altri
                  </Badge>
                  )}
              </div>
              </div>
          )}
  <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Opportunità di Lavoro Pubblico {isRegion ? 'nella regione' : 'in'} {location}
  </h2>
  <div className="prose max-w-none text-gray-600">
      <p>
      Esplora le opportunità di lavoro nel settore pubblico {isRegion ? 'nella regione' : 'in'} {location}. 
      Concoro ti aiuta a trovare i migliori concorsi pubblici nella tua area, 
      con informazioni dettagliate su requisiti, scadenze e procedure di candidatura.
      </p>
      <p>
      Monitoriamo costantemente nuovi bandi e concorsi da enti pubblici {isRegion ? 'nella regione' : 'in'} {location}, 
      garantendoti accesso immediato alle ultime opportunità di carriera nel settore pubblico.
      </p>
</div>
{/* FAQ Section for SEO and UX */}
<div className="mt-8">
  <h3 className="text-xl font-semibold text-gray-900 mb-3">Domande frequenti</h3>
  <div className="space-y-4 text-gray-700">
  <div>
      <h4 className="font-medium">Come trovare concorsi pubblici {isRegion ? 'nella regione' : 'in'} {location}?</h4>
      <p>
      Utilizza questa pagina per consultare i concorsi attivi {isRegion ? 'nella regione' : 'in'} {location}. Puoi navigare
      per ente o provincia e aprire ciascun concorso per i dettagli su requisiti e domanda.
      </p>
  </div>
  <div>
      <h4 className="font-medium">Quali sono le scadenze dei bandi?</h4>
      <p>
      Ogni scheda riporta la data di scadenza aggiornata. Ti consigliamo di candidarti il prima possibile
      e di verificare spesso eventuali nuovi bandi {isRegion ? 'nella regione' : 'in'} {location}.
      </p>
  </div>
  <div>
      <h4 className="font-medium">Quali enti pubblicano bandi {isRegion ? 'nella regione' : 'in'} {location}?</h4>
      <p>
      {isRegion ? 'Nella regione' : 'In'} {location} pubblicano bandi diversi enti: Comuni, Province, ASL, Università e altri organismi.
      Puoi esplorare l'elenco degli enti nella barra laterale e accedere ai relativi bandi.
      </p>
  </div>
  </div>
</div>
</div>


</div>

</div>

    </div>


</div>
  )
}
