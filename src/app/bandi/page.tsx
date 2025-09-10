"use client"

import { useState, useEffect, useRef, Suspense } from "react"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
import { collection, getDocs, query, orderBy, limit, where, or, getCountFromServer, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { JobSearch } from "@/components/jobs/ConcorsiSearch"
import { ConcoroList } from "@/components/bandi/ConcoroList"
import { ConcoroDetails } from "@/components/bandi/ConcoroDetails"
// Date functions removed - now using server-side filtering exclusively
import { useAuthAdapter } from "@/lib/hooks/useAuthAdapter"
import { useRouter, useSearchParams } from "next/navigation"
import { getBandoUrl } from "@/lib/utils/bando-slug-utils"
import { getEnteUrl } from "@/lib/utils/ente-slug-utils"
import { toast } from "sonner"
import { Concorso } from "@/types/concorso"
import { Spinner } from '@/components/ui/spinner'
import { concorsiFilterService, ConcorsiFilterParams } from "@/lib/services/concorsi-filter-service"
import { FilterIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'
import { extractAllRegions, localitaContainsRegions } from "@/lib/utils/region-utils"
import { getAvailableRegimes, normalizeConcorsoRegime } from "@/lib/utils/regime-utils"
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
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [jobs, setJobs] = useState<Concorso[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Concorso[]>([])
  const [selectedJob, setSelectedJob] = useState<Concorso | null>(null)
  const [totalOpenConcorsi, setTotalOpenConcorsi] = useState<number>(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  
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
  const { user, loading: authLoading, initializeAuth } = useAuthAdapter()
  const router = useRouter()
  const searchParams = useSearchParams()

  // SEO handling for pagination and filters
  useEffect(() => {
    const pageParam = searchParams.get('page')
    const pageNum = pageParam ? parseInt(pageParam, 10) : 1
    
    // Get filter count
    const filterCount = ['ente', 'location', 'settore', 'regime', 'stato'].filter(key => 
      searchParams.get(key)
    ).length

    // Update meta robots for toxic combinations
    const robotsMeta = document.querySelector('meta[name="robots"]')
    if (filterCount > 2 || pageNum > 5) {
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'noindex,follow')
      } else {
        const meta = document.createElement('meta')
        meta.name = 'robots'
        meta.content = 'noindex,follow'
        document.head.appendChild(meta)
      }
    } else {
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index,follow')
      }
    }

    // Update title for pagination
    if (pageNum > 1) {
      document.title = document.title.replace(' | Concoro', ` - Pagina ${pageNum} | Concoro`)
    }
  }, [searchParams])

  // Auto-initialize auth for logged-in users on this page
  useEffect(() => {
    initializeAuth()
  }, [])
  const isMobile = useMediaQuery("(max-width: 1024px)")

  const ITEMS_PER_PAGE = 20 // Reduced for better performance

  // Date helper function removed - now using server-side filtering exclusively

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
          updateURL(currentPage, foundJob.id, foundJob)
          
          // If this is an old-style ID URL access, redirect to SEO-friendly URL
          try {
            const seoUrl = getBandoUrl(foundJob)
            if (seoUrl !== `/bandi/${foundJob.id}` && seoUrl !== `/bandi?id=${foundJob.id}`) {
              // Redirect to the new SEO-friendly URL
              setTimeout(() => {
                router.replace(seoUrl)
              }, 100) // Small delay to ensure state is set
            }
          } catch (error) {
            console.error('Error generating SEO URL for redirect:', error)
          }
        }
      }
      setInitialUrlHandled(true)
    }
  }, [jobs.length, selectedJob, initialUrlHandled, currentPage, router, searchParams]) // Run when jobs load and no job is selected

  // Store current page in sessionStorage for mobile back navigation
  useEffect(() => {
    sessionStorage.setItem('bandiLastPage', currentPage.toString())
  }, [currentPage])

  // Set static total count to avoid expensive queries
  useEffect(() => {
    // Use estimated count instead of expensive database query
    setTotalOpenConcorsi(1628)
    console.log('⚡ Using static estimated count: 1628 (instant)')
  }, [])

  // Fetch initial jobs and filter options using the new API-based service
  useEffect(() => {
    async function fetchInitialData() {
      const startTime = performance.now()
      console.log('📋 Starting initial data fetch with new API service...')
      
      try {
        setIsLoading(true)
        
        // Load initial concorsi with default settings (no filters, just basic sorting)
        const initialFilters: ConcorsiFilterParams = {
          sortBy: 'publication-desc', // Default sort by publication date
          limit: ITEMS_PER_PAGE * 2 // Load 2 pages worth for better initial experience
        }
        
        const result = await concorsiFilterService.getFilteredConcorsi(initialFilters)
        
        console.log(`📋 ✅ Initial API query: ${result.concorsi.length} concorsi in ${(performance.now() - startTime).toFixed(0)}ms`)
        
        const jobsData = result.concorsi
        setJobs(jobsData)
        setFilteredJobs(jobsData) // Initially, filtered jobs = all jobs
        setNextCursor(result.nextCursor || null)
        setHasMore(result.hasMore)
        
        // Extract filter options from loaded data
        const filterOptions = await concorsiFilterService.getAvailableFilterOptions(jobsData)
        setAvailableLocations(filterOptions.locations)
        setAvailableEnti(filterOptions.enti)
        setAvailableSettori(filterOptions.settori)
        setAvailableRegimi(filterOptions.regimi)
        
        const endTime = performance.now()
        console.log(`✅ Initial data loading completed: ${jobsData.length} documents (total time: ${(endTime - startTime).toFixed(0)}ms)`)
        
      } catch (error) {
        console.error('❌ Error fetching initial data:', error)
        toast.error('Failed to load concorsi. Please try again later.')
        
        // Fallback to legacy method if the new service fails
        try {
          console.log('📋 Falling back to legacy data loading...')
          const { getRegionalConcorsi } = await import('@/lib/services/regional-queries-client')
          
          const result = await getRegionalConcorsi({
            stato: 'open',
            limit: ITEMS_PER_PAGE * 2,
            orderByField: 'publication_date',
            orderDirection: 'desc'
          })
          
          const jobsData = result.concorsi as Concorso[]
          setJobs(jobsData)
          setFilteredJobs(jobsData)
          setNextCursor(result.nextCursor || null)
          setHasMore(result.hasMore)
          
          // Extract filter options using legacy method
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

          setAvailableLocations(allRegions)
          setAvailableEnti(uniqueEnti.filter((ente): ente is string => Boolean(ente)))
          setAvailableSettori(uniqueSettori)
          setAvailableRegimi(uniqueRegimi)
          
          console.log('📋 ✅ Legacy fallback completed successfully')
          
        } catch (fallbackError) {
          console.error('❌ Legacy fallback also failed:', fallbackError)
          toast.error('Failed to load data. Please refresh the page.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, []) // Run once on mount

  // Apply filters using new API-based filtering service
  useEffect(() => {
    async function fetchFilteredJobs() {
      try {
        // Check if we have any active filters
        const hasActiveFilters = selectedLocations.length > 0 || 
                                selectedEnti.length > 0 || 
                                selectedSettori.length > 0 || 
                                selectedRegimi.length > 0 || 
                                selectedStati.length > 0 ||
                                selectedDeadlines.length > 0 ||
                                searchQuery?.trim() ||
                                locationQuery?.trim() ||
                                sortBy

        // ALWAYS use API-based filtering for consistency and to avoid limitations of cached data
        setIsSearching(true)
        try {
          const filterParams: ConcorsiFilterParams = {
            searchQuery: searchQuery?.trim() || undefined,
            locationQuery: locationQuery?.trim() || undefined,
            selectedLocations,
            selectedDeadlines,
            selectedEnti,
            selectedSettori,
            selectedRegimi,
            selectedStati,
            sortBy: sortBy || 'publication-desc', // Default sort if none specified
            currentPage,
            limit: ITEMS_PER_PAGE * 2 // Load extra for better UX
          }

          console.log('🔄 Using API-based filtering:', filterParams)
          const result = await concorsiFilterService.getFilteredConcorsi(filterParams)
          
          setFilteredJobs(result.concorsi)
          setHasMore(result.hasMore)
          setNextCursor(result.nextCursor || null)
          
          // Update the base jobs array only if no filters are active (for filter options extraction)
          if (!hasActiveFilters) {
            setJobs(result.concorsi)
          }
          
          console.log(`✅ API-based filtering: ${result.concorsi.length} results`)
        } finally {
          setIsSearching(false)
        }
      } catch (error) {
        console.error('❌ Error in API-based filtering:', error)
        toast.error('Failed to apply filters. Please try again.')
        setIsSearching(false)
        
        // If API fails, show empty results instead of potentially confusing cached data
        setFilteredJobs([])
        setHasMore(false)
        setNextCursor(null)
      }
    }

    fetchFilteredJobs()
    
    // Reset to page 1 when filters change
    if (currentPage > 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, locationQuery, selectedLocations, selectedDeadlines, selectedEnti, 
      selectedSettori, selectedRegimi, selectedStati, sortBy, currentPage])

  // Client-side filtering removed - now using API-based filtering exclusively

  // Auto-select first job on desktop (optimized)
  useEffect(() => {
    if (!isMobile && filteredJobs.length > 0 && !selectedJob && currentPage === 1) {
      // Only auto-select on first page to avoid performance issues
      const firstJob = filteredJobs[0]
      if (firstJob) {
        setSelectedJob(firstJob)
        updateURL(currentPage, firstJob.id, firstJob)
      }
    }
  }, [filteredJobs.length, isMobile, selectedJob]) // Simplified dependencies

  // Handle concorso selection
  const handleConcorsoSelect = (concorso: Concorso) => {
    if (isMobile) {
      // On mobile, navigate to individual page using SEO-friendly URL
      try {
        const seoUrl = getBandoUrl(concorso)
        router.push(seoUrl)
      } catch (error) {
        console.error('Error generating SEO URL:', error)
        // Fallback to ID-based URL
        router.push(`/bandi/${concorso.id}`)
      }
    } else {
      // On desktop, show in sidebar
      setSelectedJob(concorso)
      // Update URL immediately for manual selection
      updateURL(currentPage, concorso.id, concorso)
    }
  }

  // Handle loading more jobs using the new filtering service
  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const filterParams: ConcorsiFilterParams = {
        searchQuery: searchQuery?.trim() || undefined,
        locationQuery: locationQuery?.trim() || undefined,
        selectedLocations,
        selectedDeadlines,
        selectedEnti,
        selectedSettori,
        selectedRegimi,
        selectedStati,
        sortBy,
        limit: ITEMS_PER_PAGE,
        nextCursor
      }

      const result = await concorsiFilterService.loadMoreConcorsi(filterParams, nextCursor);

      const newJobs = result.concorsi;
      
      // If we have active filters, replace the filtered jobs
      const hasActiveFilters = selectedLocations.length > 0 || 
                              selectedEnti.length > 0 || 
                              selectedSettori.length > 0 || 
                              selectedRegimi.length > 0 || 
                              selectedStati.length > 0 ||
                              selectedDeadlines.length > 0 ||
                              searchQuery?.trim() ||
                              locationQuery?.trim() ||
                              sortBy

      if (hasActiveFilters) {
        // For filtered results, append to filtered jobs
        setFilteredJobs(prevFiltered => {
          const existingIds = new Set(prevFiltered.map(job => job.id));
          const uniqueNewJobs = newJobs.filter(job => !existingIds.has(job.id));
          return [...prevFiltered, ...uniqueNewJobs];
        });
      } else {
        // For unfiltered results, append to base jobs
        setJobs(prevJobs => {
          const existingIds = new Set(prevJobs.map(job => job.id));
          const uniqueNewJobs = newJobs.filter(job => !existingIds.has(job.id));
          return [...prevJobs, ...uniqueNewJobs];
        });
      }
      
      setNextCursor(result.nextCursor || null);
      setHasMore(result.hasMore);

    } catch (error) {
      console.error('Error loading more jobs:', error);
      toast.error('Failed to load more jobs. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Update URL without page reload
  const updateURL = (page: number, jobId?: string, job?: Concorso) => {
    // If we have a job object and it's not mobile, try to use SEO-friendly URL
    if (job && !isMobile) {
      try {
        const seoUrl = getBandoUrl(job)
        window.history.replaceState(null, '', seoUrl)
        return
      } catch (error) {
        console.error('Error generating SEO URL for desktop:', error)
        // Fall through to old URL format
      }
    }
    
    // Fallback to query parameter format (for backward compatibility and when SEO URL fails)
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

  // Remove auth loading check to allow immediate guest access

  // Allow both authenticated and guest users to access the page

  // Calculate pagination - now using server-side pagination
  // For now, we'll use client-side filtering on the fetched data
  // In a future optimization, we can move filters to server-side too
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentJobs = filteredJobs.slice(startIndex, endIndex)

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
            totalCount={totalOpenConcorsi}
            isSearching={isSearching}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 h-[calc(100vh-200px)]">
          {/* Jobs List */}
          <div className={cn("lg:col-span-2 overflow-hidden", !isMobile && selectedJob && "lg:col-span-1")}>
            <div className="h-full overflow-y-auto scrollbar-hide mr-2 p-2">
              <ConcoroList
                jobs={filteredJobs}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                selectedJobId={selectedJob?.id || null}
                onJobSelect={handleConcorsoSelect}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
              />
            </div>
          </div>

          {/* Job Details Sidebar - Desktop Only */}
          {!isMobile && selectedJob && (
            <div className="lg:col-span-2 overflow-hidden">
              <div className="h-full overflow-y-auto scrollbar-hide mr-1">
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




