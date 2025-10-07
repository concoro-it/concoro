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
import { ScrollArea } from "@/components/ui/scroll-area"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Building2
} from "lucide-react"
import Link from "next/link"
import { 
  decodeLocalitaSlug, 
  extractProvince, 
  extractRegion,
  groupLocationsByProvince,
  groupLocationsByRegion,
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 25
  
  // Filter options
  const [enti, setEnti] = useState<string[]>([])
  const [allEnti, setAllEnti] = useState<string[]>([])
  const [showAllEnti, setShowAllEnti] = useState(false)
  const [relatedProvinces, setRelatedProvinces] = useState<string[]>([])
  const [relatedRegions, setRelatedRegions] = useState<string[]>([])
  
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
        
        // Fetch ALL concorsi for client-side filtering
        const concorsiSnapshot = await getDocs(concorsiCollection)
        
        // Filter concorsi that contain the location name in their AreaGeografica
        const concorsiData = concorsiSnapshot.docs
          .map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data
            } as Concorso
          })
          .filter(concorso => {
            // First filter by location
            const locationMatch = locationMatchesSearch(concorso.AreaGeografica || '', locationName)
            if (!locationMatch) return false
            
            // Then filter out closed concorsi by default
            const status = concorso.Stato?.toLowerCase()
            return status === 'open' || status === 'aperto' || !status
          })

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
          const sampleLocations = concorsiSnapshot.docs
            .slice(0, 10)
            .map((doc: any) => (doc.data() as { AreaGeografica?: string }).AreaGeografica)
            .filter(Boolean);
          
          
        }

        // All fetched concorsi are already open, so no need for additional filtering
        setConcorsi(processedConcorsiData)
        setDisplayedConcorsi(processedConcorsiData)

        // Extract unique enti (all enti from open concorsi in this location)
        const activeEnti = Array.from(new Set(
          processedConcorsiData
            .map(c => c.Ente)
            .filter(Boolean)
        )).sort()

        // Since we only fetched open concorsi, all enti are active
        const allUniqueEnti = activeEnti

        // Extract related provinces from all concorsi locations
        const allLocations = concorsiSnapshot.docs
          .map((doc: any) => (doc.data() as { AreaGeografica?: string }).AreaGeografica)
          .filter((loc): loc is string => Boolean(loc))
        
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar - Enti List - Desktop */}
          <div className="hidden lg:block lg:col-span-2 order-1 lg:order-2">
            <div className="sticky top-20 space-y-2 h-fit">
              {/* Enti Card */}
              <Card className="overflow-hidden">
                <div className="flex justify-between items-center pt-6 pl-4 pr-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Enti ({showAllEnti ? allEnti.length : enti.length})  
                  </h2>
                </div>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="px-2 pb-6 space-y-2">
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
                              className={`p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden ${
                                !isActive ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="font-medium text-sm line-clamp-2 break-words min-w-0" title={ente}>
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
                      <div className="px-6 pb-4 pt-4 border-t">
                        <button
                          onClick={() => setShowAllEnti(!showAllEnti)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
                          href={`/bandi/localita/${encodeURIComponent(province)}`}
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
                          href={`/bandi/localita/${encodeURIComponent(region)}`}
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
            {displayedConcorsi.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Concorsi Disponibili ({totalCount}) a {localita}
                  </h2>
                </div>
                
                <Suspense fallback={<div>Caricamento concorsi...</div>}>
                  <ConcoroList 
                    jobs={displayedConcorsi.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)} 
                    isLoading={loading}
                    selectedJobId={selectedJobId}
                    onJobSelect={handleJobSelect}
                    currentPage={currentPage}
                    totalPages={Math.ceil(displayedConcorsi.length / ITEMS_PER_PAGE)}
                    totalCount={displayedConcorsi.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={handlePageChange}
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
                            className={`p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden ${
                              !isActive ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="font-medium text-sm line-clamp-2 break-words min-w-0" title={ente}>
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
        

      </div>
    </div>
  )
}