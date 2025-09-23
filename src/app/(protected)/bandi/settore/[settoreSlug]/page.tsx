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
  Home,
  Briefcase
} from "lucide-react"
import Link from "next/link"
import { 
  groupConcorsiByConcorsoId, 
  createGroupedConcorso 
} from "@/lib/utils/ente-utils"
import { splitLocationString } from "@/lib/utils/localita-utils"

interface SettorePageProps {
  params: {
    settoreSlug: string
  }
}

export default function SettorePage({ params }: SettorePageProps) {
  const [loading, setLoading] = useState(true)
  const [concorsi, setConcorsi] = useState<Concorso[]>([])
  const [displayedConcorsi, setDisplayedConcorsi] = useState<Concorso[]>([])
  const [settore, setSettore] = useState<string>("")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  // Filter options
  const [locations, setLocations] = useState<string[]>([])
  const [enti, setEnti] = useState<string[]>([])
  
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Handle authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin')
    }
  }, [user, authLoading, router])

  // Fetch concorsi for the specific settore
  useEffect(() => {
    async function fetchConcorsiBySettore() {
      if (!user) return
      
      try {
        setLoading(true)
        
        if (!db) {
          console.error('Firestore database is not initialized')
          toast.error('Failed to connect to database. Please try again later.')
          setLoading(false)
          return
        }
        
        // Decode the settore slug to get the actual settore name
        const settoreName = decodeURIComponent(params.settoreSlug)
        setSettore(settoreName)
        
        const concorsiCollection = collection(db, 'concorsi')
        // Only fetch open concorsi for this settore (server-side filtering)
        const settoreQuery = query(
          concorsiCollection,
          where('settore_professionale', '==', settoreName),
          where('Stato', 'in', ['open', 'aperto', 'OPEN', 'APERTO'])
        )
        const concorsiSnapshot = await getDocs(settoreQuery)
        
        const concorsiData = concorsiSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data
          }
        }) as Concorso[]

        // All fetched concorsi are already open, so no need for additional filtering
        const openConcorsi = concorsiData

        // Group concorsi by concorso_id to handle multiple regions
        const groupedConcorsi = groupConcorsiByConcorsoId(concorsiData)
        const groupedDisplayedConcorsi = Object.values(groupedConcorsi).map(group => 
          createGroupedConcorso(group)
        ).filter(Boolean)

        setConcorsi(concorsiData)
        setDisplayedConcorsi(groupedDisplayedConcorsi)

        // Extract unique locations from grouped concorsi (individual regions)
        const uniqueLocations = Array.from(new Set(
          groupedDisplayedConcorsi.flatMap(c => {
            if (c.isGrouped && c.regions) {
              return c.regions;
            } else {
              // Handle single concorsi that might have combined regions
              const areaGeografica = c.AreaGeografica;
              if (!areaGeografica) return [];
              
              // Use the utility function to split location strings
              return splitLocationString(areaGeografica);
            }
          }).filter(Boolean)
        )).sort()

        const uniqueEnti = Array.from(new Set(
          groupedDisplayedConcorsi
            .map(c => c.Ente)
            .filter(Boolean)
        )).sort()

        setLocations(uniqueLocations)
        setEnti(uniqueEnti)

      } catch (error) {
        console.error('Error fetching concorsi:', error)
        toast.error('Errore nel caricamento dei concorsi. Riprova più tardi.')
      } finally {
        setLoading(false)
      }
    }

    fetchConcorsiBySettore()
  }, [user, params.settoreSlug])

  const handleJobSelect = (job: Concorso) => {
    setSelectedJobId(job.id)
    router.push(`/bandi/${job.id}`)
  }

  const totalCount = displayedConcorsi.length
  const totalPositions = displayedConcorsi.reduce((total, concorso) => 
    total + (concorso.numero_di_posti || 1), 0
  )

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
              { label: "Settori", href: "/bandi" },
              { label: settore, current: true }
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
            <Card className="">
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Enti ({enti.length})  
                </h2>
              </div>
              <CardContent className="">
                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-2">
                    {enti.map((ente, index) => {
                      // Count concorsi for this ente
                      const enteCount = displayedConcorsi.filter(c => 
                        c.Ente?.toLowerCase() === ente.toLowerCase()
                      ).length;
                      
                      return (
                        <Link 
                          key={index}
                          href={`/bandi/ente/${encodeURIComponent(ente)}`}
                          className="block"
                        >
                          <div 
                            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden"
                          >
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
                <CardContent className="">
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="space-y-2">
                      {locations.map((location, index) => {
                        // Count concorsi for this location
                        const locationCount = displayedConcorsi.filter(c => {
                          if (c.isGrouped && c.regions) {
                            // For grouped concorsi, check if this location is in the regions array
                            return c.regions.some(region => 
                              region.trim().toLowerCase() === location.trim().toLowerCase()
                            );
                          } else {
                            // For single concorsi, check AreaGeografica
                            if (!c.AreaGeografica) return false;
                            const normalizedLocation = c.AreaGeografica.trim().toLowerCase();
                            const normalizedCurrentLocation = location.trim().toLowerCase();
                            return normalizedLocation.includes(normalizedCurrentLocation) || normalizedCurrentLocation.includes(normalizedLocation);
                          }
                        }).length;
                        return (
                          <Link 
                            key={index}
                            href={`/bandi/localita/${encodeURIComponent(location)}`}
                            className="block"
                          >
                            <div 
                              className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden"
                            >
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
            {displayedConcorsi.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Concorsi Disponibili ({totalCount}) nel settore {settore}
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
            <Card className="">
              <div className="flex justify-between items-center pt-6 pl-6 pr-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Enti ({enti.length})  
                </h2>
              </div>
              <CardContent className="">
                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-2">
                    {enti.map((ente, index) => {
                      // Count concorsi for this ente
                      const enteCount = displayedConcorsi.filter(c => 
                        c.Ente?.toLowerCase() === ente.toLowerCase()
                      ).length;
                      
                      return (
                        <Link 
                          key={index}
                          href={`/bandi/ente/${encodeURIComponent(ente)}`}
                          className="block"
                        >
                          <div 
                            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden"
                          >
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
                <CardContent className="">
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="space-y-2">
                      {locations.map((location, index) => {
                        // Count concorsi for this location
                        const locationCount = displayedConcorsi.filter(c => {
                          if (c.isGrouped && c.regions) {
                            // For grouped concorsi, check if this location is in the regions array
                            return c.regions.some(region => 
                              region.trim().toLowerCase() === location.trim().toLowerCase()
                            );
                          } else {
                            // For single concorsi, check AreaGeografica
                            if (!c.AreaGeografica) return false;
                            const normalizedLocation = c.AreaGeografica.trim().toLowerCase();
                            const normalizedCurrentLocation = location.trim().toLowerCase();
                            return normalizedLocation.includes(normalizedCurrentLocation) || normalizedCurrentLocation.includes(normalizedLocation);
                          }
                        }).length;
                        return (
                          <Link 
                            key={index}
                            href={`/bandi/localita/${encodeURIComponent(location)}`}
                            className="block"
                          >
                            <div 
                              className="p-2 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden"
                            >
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
  )
}
