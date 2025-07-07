"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { collection, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { JobSearch } from "@/components/jobs/ConcorsiSearch"
import { ConcoroList } from "@/components/bandi/ConcoroList"
import { ConcoroDetails } from "@/components/bandi/ConcoroDetails"
import { addDays, isAfter, isBefore, startOfDay, startOfMonth, startOfWeek } from "date-fns"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Concorso } from "@/types/concorso"
import { Concorso as ConcoroDetailsType } from "@/components/bandi/ConcoroDetails"
import { Spinner } from '@/components/ui/spinner'
import { FilterIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { extractAllRegions, localitaContainsRegions } from "@/lib/utils/region-utils"
import { getAvailableRegimes, normalizeConcorsoRegime, filterByRegime } from "@/lib/utils/regime-utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

function JobsPage() {
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedDeadlines, setSelectedDeadlines] = useState<string[]>([])
  const [selectedEnti, setSelectedEnti] = useState<string[]>([])
  const [selectedSettori, setSelectedSettori] = useState<string[]>([])
  const [selectedRegimi, setSelectedRegimi] = useState<string[]>([])
  const [selectedStati, setSelectedStati] = useState<string[]>([])
  
  // Core data state
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<Concorso[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Concorso[]>([])
  const [selectedJob, setSelectedJob] = useState<Concorso | null>(null)
  
  // Filter options
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [availableEnti, setAvailableEnti] = useState<string[]>([])
  const [availableSettori, setAvailableSettori] = useState<string[]>([])
  const [availableRegimi, setAvailableRegimi] = useState<string[]>([])
  
  // Navigation and UI state
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showFilterSidebar, setShowFilterSidebar] = useState(false)
  
  // Ref to prevent infinite loops in auto-selection
  const isAutoSelectingRef = useRef(false)
  
  // Hooks
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 1024px)")

  const ITEMS_PER_PAGE = 25

  // Helper function to convert various date formats to Date objects
  const toDate = (dateValue: any): Date | null => {
    if (!dateValue) return null
    if (typeof dateValue === 'string') return new Date(dateValue)
    if (typeof dateValue === 'object' && dateValue.seconds) return new Date(dateValue.seconds * 1000)
    return new Date(dateValue)
  }

  // Initialize from URL parameters (only on mount)
  useEffect(() => {
    const pageParam = searchParams.get('page')
    const sortParam = searchParams.get('sort')
    
    if (pageParam) {
      const page = parseInt(pageParam, 10)
      if (page > 0) {
        setCurrentPage(page)
      }
    }
    
    if (sortParam === 'publication-desc') {
      setSortBy('publication-desc')
    } else if (sortParam === 'posts-desc') {
      setSortBy('posts-desc')
    } else if (sortParam === 'deadline-asc') {
      setSortBy('deadline-asc')
    }
  }, []) // Empty dependency array - only run on mount

  // Handle initial job selection from URL when jobs are loaded (only once)
  const [initialUrlHandled, setInitialUrlHandled] = useState(false)
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob && !initialUrlHandled) {
      const idParam = searchParams.get('id')
      if (idParam) {
        const foundJob = jobs.find(job => job.id === idParam)
        if (foundJob) {
          setSelectedJob(foundJob)
          updateURL(currentPage, foundJob.id)
        }
      }
      setInitialUrlHandled(true)
    }
  }, [jobs.length, selectedJob, initialUrlHandled, currentPage]) // Run when jobs load and no job is selected

  // Store current page in sessionStorage for mobile back navigation
  useEffect(() => {
    sessionStorage.setItem('bandiLastPage', currentPage.toString())
  }, [currentPage])

  // Handle authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin')
    }
  }, [user, authLoading, router])

  // Fetch jobs from Firestore
  useEffect(() => {
    async function fetchJobs() {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        if (!db) {
          console.error('Firestore database is not initialized')
          toast.error('Failed to connect to database. Please try again later.')
          setIsLoading(false)
          return
        }
        
        const concorsiCollection = collection(db, 'concorsi')
        const concorsiSnapshot = await getDocs(concorsiCollection)
        
        const jobsData = concorsiSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data
          }
        }) as Concorso[]

        // Extract unique values for filters
        const localitaStrings = jobsData.map(job => job.AreaGeografica)
          .filter((location): location is string => Boolean(location))
        
        const allRegions = extractAllRegions(localitaStrings)
        const uniqueEnti = Array.from(new Set(
          jobsData.map(job => job.Ente).filter(Boolean)
        )).sort()
        
        const settoriSet = new Set<string>()
        
        jobsData.forEach(job => {
          if (job.settore_professionale) settoriSet.add(job.settore_professionale)
        })
        
        const uniqueSettori = Array.from(settoriSet).sort()
        const uniqueRegimi = getAvailableRegimes(jobsData)

        setJobs(jobsData)
        setAvailableLocations(allRegions)
        setAvailableEnti(uniqueEnti)
        setAvailableSettori(uniqueSettori)
        setAvailableRegimi(uniqueRegimi)
      } catch (error) {
        console.error('Error fetching jobs:', error)
        toast.error('Failed to load jobs. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [user])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...jobs]

    // Apply default filters first
    filtered = filtered.filter(job => {
      // Must have location
      if (!job.AreaGeografica || job.AreaGeografica.trim() === '') {
        return false
      }
      
      // Must have deadline
      if (!job.DataChiusura) {
        return false
      }
      
      return true
    })

    // Hide closed concorsi by default - only show if user explicitly selects "chiuso" filter
    if (selectedStati.length === 0) {
      // Default behavior: only show open concorsi
      filtered = filtered.filter(job => {
        const status = job.Stato?.toLowerCase()
        return status === 'open' || status === 'aperto' || !status
      })
    }

    // Apply search filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(job => 
        (job.Titolo?.toLowerCase().includes(query)) ||
        (job.Ente?.toLowerCase().includes(query)) ||
        (job.AreaGeografica?.toLowerCase().includes(query)) ||
        (job.Descrizione?.toLowerCase().includes(query))
      )
    }

    if (locationQuery) {
      const query = locationQuery.toLowerCase()
      filtered = filtered.filter(job => 
        job.AreaGeografica?.toLowerCase().includes(query)
      )
    }

    // Apply location filters
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(job => 
        localitaContainsRegions(job.AreaGeografica, selectedLocations)
      )
    }

    // Apply other filters
    if (selectedEnti.length > 0) {
      filtered = filtered.filter(job => 
        job.Ente && selectedEnti.some(ente => job.Ente?.includes(ente))
      )
    }

    // Use settore_professionale instead of settore for filtering
    if (selectedSettori.length > 0) {
      filtered = filtered.filter(job => 
        job.settore_professionale && selectedSettori.includes(job.settore_professionale)
      )
    }

    if (selectedRegimi.length > 0) {
      filtered = filterByRegime(filtered, selectedRegimi)
    }

    if (selectedStati.length > 0) {
      filtered = filtered.filter(job => {
        const status = job.Stato?.toLowerCase()
        return selectedStati.some(selectedStatus => {
          if (selectedStatus === 'aperto') return status === 'open' || status === 'aperto'
          if (selectedStatus === 'chiuso') return status === 'closed' || status === 'chiuso'
          return false
        })
      })
    }

    // Apply deadline filters
    if (selectedDeadlines.length > 0) {
      const now = new Date()
      filtered = filtered.filter(job => {
        const deadlineDate = toDate(job.DataChiusura)
        
        return selectedDeadlines.some(filter => {
          switch (filter) {
            case 'today':
              return deadlineDate && isAfter(deadlineDate, startOfDay(now)) && 
                     isBefore(deadlineDate, addDays(startOfDay(now), 1))
            case 'week':
              return deadlineDate && isAfter(deadlineDate, startOfWeek(now, { weekStartsOn: 1 })) &&
                     isBefore(deadlineDate, addDays(startOfWeek(now, { weekStartsOn: 1 }), 7))
            case 'month':
              return deadlineDate && isAfter(deadlineDate, startOfMonth(now)) &&
                     isBefore(deadlineDate, addDays(startOfMonth(now), 31))
            case 'next-month':
              const nextMonth = addDays(startOfMonth(now), 31)
              return deadlineDate && isAfter(deadlineDate, nextMonth) &&
                     isBefore(deadlineDate, addDays(nextMonth, 31))
            default:
              return false
          }
        })
      })
    }

    // Apply sorting
    if (sortBy === 'publication-desc') {
      filtered.sort((a, b) => {
        const aDate = toDate(a.publication_date) || new Date(0)
        const bDate = toDate(b.publication_date) || new Date(0)
        return bDate.getTime() - aDate.getTime()
      })
    } else if (sortBy === 'posts-desc') {
      filtered.sort((a, b) => (b.numero_di_posti || 0) - (a.numero_di_posti || 0))
    } else if (sortBy === 'deadline-asc') {
      filtered.sort((a, b) => {
        const aDate = toDate(a.DataChiusura) || new Date('9999-12-31')
        const bDate = toDate(b.DataChiusura) || new Date('9999-12-31')
        return aDate.getTime() - bDate.getTime()
      })
    }

    setFilteredJobs(filtered)
    
    // Reset to page 1 when filters change
    if (currentPage > 1) {
      setCurrentPage(1)
      // URL will be updated by the separate useEffect
    }
  }, [jobs, searchQuery, locationQuery, selectedLocations, selectedDeadlines, selectedEnti, 
      selectedSettori, selectedRegimi, selectedStati, sortBy])

  // Auto-select first job on desktop when filtered jobs change (not on page change)
  useEffect(() => {
    if (!isMobile && filteredJobs.length > 0 && !selectedJob) {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const currentPageJobs = filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE)
      
      if (currentPageJobs.length > 0) {
        setSelectedJob(currentPageJobs[0])
        updateURL(currentPage, currentPageJobs[0].id)
      }
    }
  }, [filteredJobs, isMobile, selectedJob, currentPage]) // Only run when jobs change or no job selected

  // Handle concorso selection
  const handleConcorsoSelect = (concorso: Concorso) => {
    if (isMobile) {
      // On mobile, navigate to individual page
      router.push(`/bandi/${concorso.id}`)
    } else {
      // On desktop, show in sidebar
      setSelectedJob(concorso)
      // Update URL immediately for manual selection
      updateURL(currentPage, concorso.id)
    }
  }

  // Handle page changes with mobile scroll behavior
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    
    // On mobile, scroll to top of page when pagination is clicked
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    // On desktop, manually select first job of the new page
    if (!isMobile && filteredJobs.length > 0) {
      const startIndex = (newPage - 1) * ITEMS_PER_PAGE
      const newPageJobs = filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE)
      
      if (newPageJobs.length > 0) {
        setSelectedJob(newPageJobs[0])
        updateURL(newPage, newPageJobs[0].id)
      } else {
        setSelectedJob(null)
        updateURL(newPage)
      }
    }
  }

  // Update URL without page reload
  const updateURL = (page: number, jobId?: string) => {
    const params = new URLSearchParams()
    
    if (page > 1) {
      params.set('page', page.toString())
    }
    
    if (jobId) {
      params.set('id', jobId)
    }
    
    if (sortBy) {
      params.set('sort', sortBy)
    }
    
    const newUrl = params.toString() ? `/bandi?${params.toString()}` : '/bandi'
    window.history.replaceState(null, '', newUrl)
  }

  // Filter handlers
  const handleClearFilters = () => {
    setSearchQuery("")
    setLocationQuery("")
    setSelectedLocations([])
    setSelectedDeadlines([])
    setSelectedEnti([])
    setSelectedSettori([])
    setSelectedRegimi([])
    setSelectedStati([])
    setSortBy("")
    setSelectedCategory("all")
  }

  const handleOptionToggle = (value: string, currentValues: string[], setValuesFn: (values: string[]) => void) => {
    if (currentValues.includes(value)) {
      setValuesFn(currentValues.filter(v => v !== value))
    } else {
      setValuesFn([...currentValues, value])
    }
  }

  const handleDeadlinesFilterChange = (values: string[]) => {
    setSelectedDeadlines(values)
  }

  // Mobile filter sidebar handlers
  const handleFilterSidebarClose = () => {
    setShowFilterSidebar(false)
  }

  // Close filter sidebar on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (!isMobile && showFilterSidebar) {
        setShowFilterSidebar(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showFilterSidebar, isMobile])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (showFilterSidebar) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [showFilterSidebar])

  // Don't render anything until auth is checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 pt-8">
        {/* Search and Filter Section */}
        <div className="mb-6">
          <JobSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            locationQuery={locationQuery}
            onLocationChange={setLocationQuery}
            selectedDeadlines={selectedDeadlines}
            onDeadlinesChange={handleDeadlinesFilterChange}
            selectedLocations={selectedLocations}
            onLocationsChange={setSelectedLocations}
            selectedEnti={selectedEnti}
            onEntiChange={setSelectedEnti}

            selectedSettori={selectedSettori}
            onSettoriChange={setSelectedSettori}
            selectedRegimi={selectedRegimi}
            onRegimiChange={setSelectedRegimi}
            selectedStati={selectedStati}
            onStatiChange={setSelectedStati}
            availableLocations={availableLocations}
            availableEnti={availableEnti}
            availableSettori={availableSettori}
            availableRegimi={availableRegimi}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onClearFilters={handleClearFilters}
            showFilterSidebar={showFilterSidebar}
            onShowFilterSidebar={() => setShowFilterSidebar(true)}
            onFilterSidebarClose={handleFilterSidebarClose}
            showAdvancedFilters={true}
            totalCount={filteredJobs.length}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs List */}
          <div className={cn("lg:col-span-2", !isMobile && selectedJob && "lg:col-span-1")}>
            <ConcoroList
              jobs={filteredJobs}
              isLoading={isLoading}
              selectedJobId={selectedJob?.id || null}
              onJobSelect={handleConcorsoSelect}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>

          {/* Job Details Sidebar - Desktop Only */}
          {!isMobile && selectedJob && (
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <ConcoroDetails
                  job={selectedJob}
                  isLoading={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Filter Sidebar */}
        <Sheet open={showFilterSidebar} onOpenChange={setShowFilterSidebar}>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Filtri</SheetTitle>
            </SheetHeader>
            
                         <ScrollArea className="h-[calc(100vh-80px)] mt-6">
               <div className="space-y-6 pl-2 pr-4">

              {/* Ente Filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Ente</h3>
                    <AutocompleteInput
                      options={availableEnti
                        .filter(ente => ente && ente.trim() !== '' && !ente.toLowerCase().includes('non specificato'))
                        .sort((a, b) => a.localeCompare(b))
                      }
                      selectedValues={selectedEnti}
                      onSelectionChange={setSelectedEnti}
                      placeholder="Cerca ente..."
                      emptyMessage="Nessun ente trovato"
                    />
                  </div>
                  {/* Regione Filter */}
                  <div className="space-y-2">
                    <Label>Regioni</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableLocations
                        .sort((a, b) => {
                          const nonSpecA = a.toLowerCase().includes('non specificato') || a.toLowerCase() === 'n/a' || a === '';
                          const nonSpecB = b.toLowerCase().includes('non specificato') || b.toLowerCase() === 'n/a' || b === '';
                          if (nonSpecA) return 1;
                          if (nonSpecB) return -1;
                          return a.localeCompare(b);
                        })
                        .map(location => (
                        <Badge 
                          key={location} 
                          variant={selectedLocations.includes(location) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedLocations.includes(location) 
                              ? "bg-blue-500 text-white hover:bg-blue-600" 
                              : "hover:bg-blue-100 hover:text-blue-800"
                          }`}
                          onClick={() => {
                            if (selectedLocations.includes(location)) {
                              setSelectedLocations(selectedLocations.filter(r => r !== location))
                            } else {
                              setSelectedLocations([...selectedLocations, location])
                            }
                          }}
                        >
                          {location}
                          {selectedLocations.includes(location) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Scadenza Filter */}
                  <div className="space-y-2">
                    <Label>Scadenza</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Oggi", value: "today" },
                        { label: "Questa Settimana", value: "week" },
                        { label: "Questo Mese", value: "month" },
                      ].map(deadline => (
                        <Badge 
                          key={deadline.value} 
                          variant={selectedDeadlines.includes(deadline.value) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedDeadlines.includes(deadline.value) 
                              ? "bg-green-500 text-white hover:bg-green-600" 
                              : "hover:bg-green-100 hover:text-green-800"
                          }`}
                          onClick={() => {
                            if (selectedDeadlines.includes(deadline.value)) {
                              setSelectedDeadlines(selectedDeadlines.filter(d => d !== deadline.value))
                            } else {
                              setSelectedDeadlines([...selectedDeadlines, deadline.value])
                            }
                          }}
                        >
                          {deadline.label}
                          {selectedDeadlines.includes(deadline.value) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Settore Professionale Filter */}
                  <div className="space-y-2">
                    <Label>Settore Professionale</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableSettori
                        .sort((a, b) => {
                          const nonSpecA = a.toLowerCase().includes('non specificato') || a.toLowerCase() === 'n/a' || a === '';
                          const nonSpecB = b.toLowerCase().includes('non specificato') || b.toLowerCase() === 'n/a' || b === '';
                          if (nonSpecA) return 1;
                          if (nonSpecB) return -1;
                          return a.localeCompare(b);
                        })
                        .map(settore => (
                        <Badge 
                          key={settore} 
                          variant={selectedSettori.includes(settore) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedSettori.includes(settore) 
                              ? "bg-orange-500 text-white hover:bg-orange-600" 
                              : "hover:bg-orange-100 hover:text-orange-800"
                          }`}
                          onClick={() => {
                            if (selectedSettori.includes(settore)) {
                              setSelectedSettori(selectedSettori.filter(s => s !== settore))
                            } else {
                              setSelectedSettori([...selectedSettori, settore])
                            }
                          }}
                        >
                          {settore}
                          {selectedSettori.includes(settore) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Regime Filter */}
                  <div className="space-y-2">
                    <Label>Regime di Impegno</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableRegimi
                        .sort((a, b) => {
                          const nonSpecA = a.toLowerCase().includes('non specificato') || a.toLowerCase() === 'n/a' || a === '';
                          const nonSpecB = b.toLowerCase().includes('non specificato') || b.toLowerCase() === 'n/a' || b === '';
                          if (nonSpecA) return 1;
                          if (nonSpecB) return -1;
                          return a.localeCompare(b);
                        })
                        .map(regime => (
                        <Badge 
                          key={regime} 
                          variant={selectedRegimi.includes(regime) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedRegimi.includes(regime) 
                              ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                              : "hover:bg-indigo-100 hover:text-indigo-800"
                          }`}
                          onClick={() => {
                            if (selectedRegimi.includes(regime)) {
                              setSelectedRegimi(selectedRegimi.filter(r => r !== regime))
                            } else {
                              setSelectedRegimi([...selectedRegimi, regime])
                            }
                          }}
                        >
                          {regime}
                          {selectedRegimi.includes(regime) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stato Filter */}
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Aperto", value: "aperto" },
                        { label: "Chiuso", value: "chiuso" }
                      ].map(stato => (
                        <Badge 
                          key={stato.value} 
                          variant={selectedStati.includes(stato.value) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedStati.includes(stato.value) 
                              ? "bg-red-500 text-white hover:bg-red-600" 
                              : "hover:bg-red-100 hover:text-red-800"
                          }`}
                          onClick={() => {
                            if (selectedStati.includes(stato.value)) {
                              setSelectedStati(selectedStati.filter(s => s !== stato.value))
                            } else {
                              setSelectedStati([...selectedStati, stato.value])
                            }
                          }}
                        >
                          {stato.label}
                          {selectedStati.includes(stato.value) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Ordinamento */}
                  <div className="space-y-2">
                    <Label>Ordinamento</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Scadenza (più vicina)", value: "deadline-asc" },
                        { label: "Data di pubblicazione (più recente)", value: "publication-desc" },
                        { label: "Posti disponibili (più posti)", value: "posts-desc" }
                      ].map(sort => (
                        <Badge 
                          key={sort.value} 
                          variant={sortBy === sort.value ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            sortBy === sort.value 
                              ? "bg-teal-500 text-white hover:bg-teal-600" 
                              : "hover:bg-teal-100 hover:text-teal-800"
                          }`}
                          onClick={() => {
                            if (sortBy === sort.value) {
                              setSortBy("")
                            } else {
                              setSortBy(sort.value)
                            }
                          }}
                        >
                          {sort.label}
                          {sortBy === sort.value && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                                     {/* Clear Filters Button */}
                   <div className="pt-4">
                     <Button
                       variant="outline"
                       onClick={handleClearFilters}
                       className="w-full"
                     >
                       Cancella tutti i filtri
                     </Button>
                   </div>
                 </div>
               </ScrollArea>
             </SheetContent>
           </Sheet>
      </main>
    </div>
  )
}

export default function JobsPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 pt-20">
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        </div>
      </div>
    }>
      <JobsPage />
    </Suspense>
  )
}




