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
  decodeEnteSlug,
  groupConcorsiByConcorsoId, 
  createGroupedConcorso 
} from "@/lib/utils/ente-utils"
import { 
  extractAllRegions
} from "@/lib/utils/region-utils"
import { 
  groupLocationsByProvince,
  groupLocationsByRegion
} from "@/lib/utils/localita-utils"

interface EntePageProps {
  params: {
    enteSlug: string
  }
}

export default function EntePage({ params }: EntePageProps) {
  const [loading, setLoading] = useState(true)
  const [concorsi, setConcorsi] = useState<Concorso[]>([])
  const [displayedConcorsi, setDisplayedConcorsi] = useState<Concorso[]>([])
  const [ente, setEnte] = useState<string>("")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 25
  
  // Filter options
  const [locations, setLocations] = useState<string[]>([])
  const [allLocations, setAllLocations] = useState<string[]>([])
  const [showAllLocations, setShowAllLocations] = useState(false)
  const [settori, setSettori] = useState<string[]>([])
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

  // Fetch concorsi for the specific ente
  useEffect(() => {
    async function fetchConcorsiByEnte() {
      if (!user) return
      
      try {
        setLoading(true)
        
        if (!db) {
          console.error('Firestore database is not initialized')
          toast.error('Failed to connect to database. Please try again later.')
          setLoading(false)
          return
        }
        
        // Decode the ente slug to get the actual ente name
        const enteName = decodeEnteSlug(params.enteSlug)
        setEnte(enteName)
        
        const concorsiCollection = collection(db, 'concorsi')
        
        // Fetch ALL concorsi for client-side filtering
        const concorsiSnapshot = await getDocs(concorsiCollection)
        
        // Filter concorsi that match the ente name
        const concorsiData = concorsiSnapshot.docs
          .map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data
            } as Concorso
          })
          .filter(concorso => {
            // First filter by ente (case-insensitive)
            const enteMatch = concorso.Ente?.toLowerCase().trim() === enteName.toLowerCase().trim()
            if (!enteMatch) return false
            
            // Then filter out closed concorsi by default
            const status = concorso.Stato?.toLowerCase()
            return status === 'open' || status === 'aperto' || !status
          })

        // Group concorsi by concorso_id to handle multiple regions
        const groupedConcorsi = groupConcorsiByConcorsoId(concorsiData)
        
        // Create grouped concorsi
        const processedConcorsiData = Object.values(groupedConcorsi).map(group => {
          return createGroupedConcorso(group)
        }).filter(Boolean)

        setConcorsi(processedConcorsiData)
        setDisplayedConcorsi(processedConcorsiData)

        // Extract unique locations from all concorsi
        const allLocationStrings = processedConcorsiData.map(c => c.AreaGeografica)
          .filter((location): location is string => Boolean(location))
        
        const allRegions = extractAllRegions(allLocationStrings)
        const uniqueLocations = Array.from(new Set(allRegions)).sort()

        // Extract unique settori
        const uniqueSettori = Array.from(new Set(
          processedConcorsiData
            .map(c => c.settore_professionale)
            .filter(Boolean)
        )).sort()

        // Group locations by province and region for related locations
        const groupedLocationsByProv = groupLocationsByProvince(allLocationStrings)
        const groupedLocationsByReg = groupLocationsByRegion(allLocationStrings)
        
        // Get related provinces and regions (show top ones)
        const relatedProvincesList = Object.keys(groupedLocationsByProv)
          .filter(province => province !== 'Altre')
          .slice(0, 10)
        
        const relatedRegionsList = Object.keys(groupedLocationsByReg)
          .filter(region => region !== 'Altre')
          .slice(0, 10)

        setLocations(uniqueLocations)
        setAllLocations(uniqueLocations)
        setSettori(uniqueSettori)
        setRelatedProvinces(relatedProvincesList)
        setRelatedRegions(relatedRegionsList)

      } catch (error) {
        console.error('Error fetching concorsi:', error)
        toast.error('Errore nel caricamento dei concorsi. Riprova più tardi.')
      } finally {
        setLoading(false)
      }
    }

    fetchConcorsiByEnte()
  }, [user, params.enteSlug])

  const handleJobSelect = (job: Concorso) => {
    setSelectedJobId(job.id)
    router.push(`/bandi/${job.id}`)
  }

  const totalCount = displayedConcorsi.length
  const totalPositions = displayedConcorsi.reduce((total, concorso) => 
    total + (concorso.numero_di_posti || 1), 0
  )
  const activeLocations = Array.from(new Set(
    displayedConcorsi.map(c => c.AreaGeografica).filter(Boolean)
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
              { label: "Enti", href: "/bandi" },
              { label: ente, current: true }
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
                    <CardTitle className="text-sm font-medium">Concorsi Aperti</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalCount}</div>
                    <p className="text-xs text-muted-foreground">
                      Concorsi attivi di {ente}
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
                    <div className="text-2xl font-bold">{activeLocations}</div>
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
          {/* Sidebar - Locations List - Desktop */}
          <div className="hidden lg:block lg:col-span-2 order-1 lg:order-2">
            <div className="sticky top-20 space-y-2 h-fit">
              {/* Locations Card */}
              <Card className="overflow-hidden">
                <div className="flex justify-between items-center pt-6 pl-4 pr-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Località ({showAllLocations ? allLocations.length : locations.length})  
                  </h2>
                </div>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="px-2 pb-6 space-y-2">
                      {(showAllLocations ? allLocations : locations).map((location, index) => {
                        // Count active concorsi for this location
                        const activeCount = displayedConcorsi.filter(c => 
                          c.AreaGeografica?.toLowerCase().includes(location.toLowerCase())
                        ).length;
                        
                        // Count total concorsi for this location
                        const totalCount = concorsi.filter(c => 
                          c.AreaGeografica?.toLowerCase().includes(location.toLowerCase())
                        ).length;
                        
                        const isActive = activeCount > 0;
                        
                        return (
                          <Link 
                            key={index}
                            href={`/bandi/localita/${encodeURIComponent(location)}`}
                            className="block"
                          >
                            <div 
                              className={`p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden ${
                                !isActive ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="font-medium text-sm line-clamp-2 break-words min-w-0" title={location}>
                                {location}
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
                    {allLocations.length > locations.length && (
                      <div className="px-6 pb-4 pt-4 border-t">
                        <button
                          onClick={() => setShowAllLocations(!showAllLocations)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          {showAllLocations ? (
                            `Mostra solo località attive (${locations.length})`
                          ) : (
                            `Mostra tutte le località (${allLocations.length})`
                          )}
                        </button>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Settori List */}
              {settori.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="flex justify-between items-center pt-6 pl-6 pr-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Settori ({settori.length})
                    </h2>
                  </div>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-2">
                      {settori.map((settore, index) => {
                        const settoreCount = displayedConcorsi.filter(c => 
                          c.settore_professionale?.toLowerCase() === settore.toLowerCase()
                        ).length;
                        
                        return (
                          <Link 
                            key={index}
                            href={`/bandi?settore=${encodeURIComponent(settore)}`}
                            className="block"
                          >
                            <div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                              <div className="font-medium text-sm line-clamp-2 break-words" title={settore}>
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
                  </CardContent>
                </Card>
              )}

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
                          <div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
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
                          <div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
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
                    Concorsi Disponibili ({totalCount}) di {ente}
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

          </div>

          {/* Sidebar - Locations List - Mobile */}
          <div className="block lg:hidden order-3">
            <Card className="">
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Località ({showAllLocations ? allLocations.length : locations.length})  
                </h2>
              </div>
              <CardContent className="">
                <ScrollArea className="h-[420px] pr-2">
                  <div className="space-y-2">
                    {(showAllLocations ? allLocations : locations).map((location, index) => {
                      // Count active concorsi for this location
                      const activeCount = displayedConcorsi.filter(c => 
                        c.AreaGeografica?.toLowerCase().includes(location.toLowerCase())
                      ).length;
                      
                      // Count total concorsi for this location
                      const totalCount = concorsi.filter(c => 
                        c.AreaGeografica?.toLowerCase().includes(location.toLowerCase())
                      ).length;
                      
                      const isActive = activeCount > 0;
                      
                      return (
                        <Link 
                          key={index}
                          href={`/bandi/localita/${encodeURIComponent(location)}`}
                          className="block"
                        >
                          <div 
                            className={`p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden ${
                              !isActive ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="font-medium text-sm line-clamp-2 break-words min-w-0" title={location}>
                              {location}
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
                  {allLocations.length > locations.length && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => setShowAllLocations(!showAllLocations)}
                        className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        {showAllLocations ? (
                          `Mostra solo località attive (${locations.length})`
                        ) : (
                          `Mostra tutte le località (${allLocations.length})`
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

