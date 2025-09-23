"use client"

import { useState, useEffect, Suspense } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { ConcoroList } from "@/components/bandi/ConcoroList"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Concorso } from "@/types/concorso"
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Building2,
  ChevronRight,
  Home
} from "lucide-react"
import Link from "next/link"
import { 
  decodeLocalitaSlug, 
  extractProvince, 
  extractRegion,
  groupLocationsByProvince,
  groupLocationsByRegion,
  getLocalitaUrl,
  locationMatchesSearch
} from "@/lib/utils/localita-utils"
import { 
  groupConcorsiByConcorsoId, 
  createGroupedConcorso 
} from "@/lib/utils/ente-utils"

interface LocalitaPageProps {
  params: {
    localitaSlug: string
  }
}

export default function LocalitaPage({ params }: LocalitaPageProps) {
  const [loading, setLoading] = useState(true)
  const [concorsi, setConcorsi] = useState<Concorso[]>([])
  const [displayedConcorsi, setDisplayedConcorsi] = useState<Concorso[]>([])
  const [localita, setLocalita] = useState<string>("")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  // Filter options
  const [enti, setEnti] = useState<string[]>([])
  const [allEnti, setAllEnti] = useState<string[]>([])
  const [showAllEnti, setShowAllEnti] = useState(false)
  const [relatedProvinces, setRelatedProvinces] = useState<string[]>([])
  const [relatedRegions, setRelatedRegions] = useState<string[]>([])
  
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Handle authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin')
    }
  }, [user, authLoading, router])

  // Fetch concorsi for the specific location
  useEffect(() => {
    async function fetchConcorsiByLocalita() {
      if (!user) return
      
      try {
        setLoading(true)
        
        if (!db) {
          console.error('Firestore database is not initialized')
          toast.error('Failed to connect to database. Please try again later.')
          setLoading(false)
          return
        }
        
        // Decode the località slug to get the actual location name
        const locationName = decodeLocalitaSlug(params.localitaSlug)
        setLocalita(locationName)
        
        const concorsiCollection = collection(db, 'concorsi')
        // Fetch all concorsi and filter by location containing the search term
        const allConcorsiQuery = query(concorsiCollection)
        const allConcorsiSnapshot = await getDocs(allConcorsiQuery)
        
        // Filter concorsi that contain the location name in their AreaGeografica
        const concorsiData = allConcorsiSnapshot.docs
          .map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data
            } as Concorso
          })
          .filter(concorso => 
            locationMatchesSearch(concorso.AreaGeografica || '', locationName)
          )

        // Group concorsi by concorso_id to handle multiple regions
        const groupedConcorsi = groupConcorsiByConcorsoId(concorsiData)
        
        // Create grouped concorsi but filter to show only relevant regions
        const processedConcorsiData = Object.values(groupedConcorsi).map(group => {
          const groupedConcorso = createGroupedConcorso(group)
          if (groupedConcorso && groupedConcorso.isGrouped) {
            // Filter regions to only show the current location and related ones
            const relevantRegions = groupedConcorso.regions.filter((region: string) => 
              locationMatchesSearch(region, locationName)
            )
            
            if (relevantRegions.length > 0) {
              return {
                ...groupedConcorso,
                regions: relevantRegions,
                regionCount: relevantRegions.length,
                AreaGeografica: relevantRegions.join(', ')
              }
            }
          }
          return groupedConcorso
        }).filter(Boolean)

        // Debug: Log some sample locations to understand the data structure
        if (processedConcorsiData.length === 0) {
          const sampleLocations = allConcorsiSnapshot.docs
            .slice(0, 10)
            .map(doc => (doc.data() as any).AreaGeografica)
            .filter(Boolean);
          console.log('Sample locations in database:', sampleLocations);
          console.log('Searching for:', locationName);
        }

        // Filter only open concorsi for display
        const openConcorsi = processedConcorsiData.filter(concorso => 
          concorso.Stato?.toLowerCase() === 'open' || 
          concorso.Stato?.toLowerCase() === 'aperto'
        )

        setConcorsi(processedConcorsiData)
        setDisplayedConcorsi(openConcorsi)

        // Extract unique enti (all enti from all concorsi in this location)
        const allUniqueEnti = Array.from(new Set(
          processedConcorsiData
            .map(c => c.Ente)
            .filter(Boolean)
        )).sort()

        // Extract enti with active concorsi only
        const activeEnti = Array.from(new Set(
          openConcorsi
            .map(c => c.Ente)
            .filter(Boolean)
        )).sort()

        // Extract related provinces from all locations in the database
        const allLocations = allConcorsiSnapshot.docs
          .map(doc => (doc.data() as any).AreaGeografica)
          .filter(Boolean)
        
        const currentProvince = extractProvince(locationName)
        const currentRegion = extractRegion(locationName)
        const groupedLocationsByProv = groupLocationsByProvince(allLocations)
        const groupedLocationsByReg = groupLocationsByRegion(allLocations)
        
        // Get related provinces (same province or nearby)
        const relatedProvincesList = currentProvince 
          ? Object.keys(groupedLocationsByProv).filter(province => 
              province !== 'Altre' && 
              (province === currentProvince || 
               province.toLowerCase().includes(currentProvince.toLowerCase()) ||
               currentProvince.toLowerCase().includes(province.toLowerCase()))
            )
          : []

        // Get related regions (same region or nearby)
        const relatedRegionsList = currentRegion 
          ? Object.keys(groupedLocationsByReg).filter(region => 
              region !== 'Altre' && 
              (region === currentRegion || 
               region.toLowerCase().includes(currentRegion.toLowerCase()) ||
               currentRegion.toLowerCase().includes(region.toLowerCase()))
            )
          : []

        setEnti(activeEnti)
        setAllEnti(allUniqueEnti)
        setRelatedProvinces(relatedProvincesList)
        setRelatedRegions(relatedRegionsList)

      } catch (error) {
        console.error('Error fetching concorsi:', error)
        toast.error('Errore nel caricamento dei concorsi. Riprova più tardi.')
      } finally {
        setLoading(false)
      }
    }

    fetchConcorsiByLocalita()
  }, [user, params.localitaSlug])

  const handleJobSelect = (job: Concorso) => {
    setSelectedJobId(job.id)
    router.push(`/bandi/${job.id}`)
  }

  const totalCount = displayedConcorsi.length
  const totalPositions = displayedConcorsi.reduce((total, concorso) => 
    total + (concorso.numero_di_posti || 1), 0
  )
  const activeEnti = Array.from(new Set(
    displayedConcorsi.map(c => c.Ente).filter(Boolean)
  )).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb
            items={[
              { label: "Concorsi", href: "/bandi" },
              { label: "Località", href: "/bandi" },
              { label: localita, current: true }
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
                    <div className="text-2xl font-bold">{activeEnti}</div>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar - Enti List - Desktop */}
          <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
            <Card className="">
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Enti ({showAllEnti ? allEnti.length : enti.length})  
                </h2>
              </div>
              <CardContent className="">
                <ScrollArea className="pr-2">
                  <div className="space-y-2">
                    {(showAllEnti ? allEnti : enti).map((ente, index) => {
                      // Count active concorsi for this ente
                      const activeCount = displayedConcorsi.filter(c => 
                        c.Ente?.toLowerCase() === ente.toLowerCase()
                      ).length;
                      
                      // Count total concorsi for this ente
                      const totalCount = concorsi.filter(c => 
                        c.Ente?.toLowerCase() === ente.toLowerCase()
                      ).length;
                      
                      const isActive = activeCount > 0;
                      
                      return (
                        <Link 
                          key={index}
                          href={`/bandi/ente/${encodeURIComponent(ente)}`}
                          className="block"
                        >
                          <div 
                            className={`p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer ${
                              !isActive ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="font-medium text-sm line-clamp-2 truncate" title={ente}>
                              {ente}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {activeCount > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {activeCount} {activeCount === 1 ? 'concorso attivo' : 'concorsi attivi'}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  {totalCount} {totalCount === 1 ? 'concorso chiuso' : 'concorsi chiusi'}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  
                  {/* Show All / Show Less button */}
                  {allEnti.length > enti.length && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => setShowAllEnti(!showAllEnti)}
                        className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        {showAllEnti ? (
                          `Mostra solo enti attivi (${enti.length})`
                        ) : (
                          `Mostra tutti gli enti (${allEnti.length})`
                        )}
                      </button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Related Provinces List */}
            {relatedProvinces.length > 0 && (
              <Card className="mt-6">
                <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Province Correlate ({relatedProvinces.length})
                  </h2>
                </div>
                <CardContent className="">
                  <ScrollArea className="pr-2">
                    <div className="space-y-2">
                      {relatedProvinces.map((province, index) => (
                        <Link 
                          key={index}
                          href={`/bandi/localita/${encodeURIComponent(province)}`}
                          className="block"
                        >
                          <div 
                            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-sm line-clamp-2 truncate" title={province}>
                              {province}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Related Regions List */}
            {relatedRegions.length > 0 && (
              <Card className="mt-6">
                <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Regioni Correlate ({relatedRegions.length})
                  </h2>
                </div>
                <CardContent className="">
                  <ScrollArea className="pr-2">
                    <div className="space-y-2">
                      {relatedRegions.map((region, index) => (
                        <Link 
                          key={index}
                          href={`/bandi/localita/${encodeURIComponent(region)}`}
                          className="block"
                        >
                          <div 
                            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-sm line-clamp-2 truncate" title={region}>
                              {region}
                            </div>
                          </div>
                        </Link>
                      ))}
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
                    Concorsi Disponibili ({totalCount}) a {localita}
                  </h2>
                </div>
                
                <Suspense fallback={<div>Caricamento concorsi...</div>}>
                  <ConcoroList 
                    jobs={displayedConcorsi} 
                    isLoading={loading}
                    selectedJobId={selectedJobId}
                    onJobSelect={handleJobSelect}
                    currentPage={1}
                    onPageChange={() => {}}
                    itemsPerPage={25}
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
                  Enti ({showAllEnti ? allEnti.length : enti.length})  
                </h2>
              </div>
              <CardContent className="">
                <ScrollArea className="h-[420px] pr-2">
                  <div className="space-y-2">
                    {(showAllEnti ? allEnti : enti).map((ente, index) => {
                      // Count active concorsi for this ente
                      const activeCount = displayedConcorsi.filter(c => 
                        c.Ente?.toLowerCase() === ente.toLowerCase()
                      ).length;
                      
                      // Count total concorsi for this ente
                      const totalCount = concorsi.filter(c => 
                        c.Ente?.toLowerCase() === ente.toLowerCase()
                      ).length;
                      
                      const isActive = activeCount > 0;
                      
                      return (
                        <Link 
                          key={index}
                          href={`/bandi/ente/${encodeURIComponent(ente)}`}
                          className="block"
                        >
                          <div 
                            className={`p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer ${
                              !isActive ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="font-medium text-sm line-clamp-2 truncate" title={ente}>
                              {ente}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {activeCount > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {activeCount} {activeCount === 1 ? 'concorso attivo' : 'concorsi attivi'}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  {totalCount} {totalCount === 1 ? 'concorso chiuso' : 'concorsi chiusi'}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  
                  {/* Show All / Show Less button */}
                  {allEnti.length > enti.length && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => setShowAllEnti(!showAllEnti)}
                        className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        {showAllEnti ? (
                          `Mostra solo enti attivi (${enti.length})`
                        ) : (
                          `Mostra tutti gli enti (${allEnti.length})`
                        )}
                      </button>
                    </div>
                  )}
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Enti con Concorsi Attivi</h2>
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
                    {allEnti.length > enti.length && (
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        +{allEnti.length - enti.length} con concorsi chiusi
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Opportunità di Lavoro Pubblico a {localita}
              </h2>
              <div className="prose max-w-none text-gray-600">
                <p>
                  Esplora le opportunità di lavoro pubblico nella zona di {localita}. 
                  Concoro ti aiuta a trovare i migliori concorsi pubblici in questa area geografica, 
                  con informazioni dettagliate su requisiti, scadenze e procedure di candidatura.
                </p>
                <p>
                  Monitoriamo costantemente nuovi bandi e concorsi a {localita}, 
                  garantendoti accesso immediato alle ultime opportunità di carriera nel settore pubblico locale.
                </p>
              </div>
              {/* FAQ Section for SEO and UX */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Domande frequenti</h3>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h4 className="font-medium">Come candidarsi ai concorsi a {localita}?</h4>
                    <p>
                      Utilizza questa pagina per consultare i concorsi attivi a {localita}. Puoi navigare
                      per ente e aprire ciascun concorso per i dettagli su requisiti e domanda.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Quali sono le scadenze dei bandi a {localita}?</h4>
                    <p>
                      Ogni scheda riporta la data di scadenza aggiornata. Ti consigliamo di candidarti il prima possibile
                      e di verificare spesso eventuali nuovi bandi nella zona di {localita}.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Quali enti assumono a {localita}?</h4>
                    <p>
                      Diversi enti pubblici pubblicano bandi per posizioni a {localita}.
                      Puoi esplorare l'elenco degli enti nella barra laterale e accedere ai relativi bandi.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Come esplorare altre zone geografiche?</h4>
                    <p>
                      Nella barra laterale puoi trovare province e regioni correlate a {localita}.
                      Clicca su una provincia o regione per vedere tutti i concorsi disponibili in quell'area.
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
