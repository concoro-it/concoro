"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Concorso } from "@/types/concorso"
import { Spinner } from '@/components/ui/spinner'
import { getOpenConcorsi, type ConcorsiQueryParams } from "@/lib/services/concorsi-service-client"
import { ConcoroList } from "@/components/bandi/ConcoroList"
import { ConcoroDetails } from "@/components/bandi/ConcoroDetails"
import { useAuthAdapter } from "@/lib/hooks/useAuthAdapter"
import { useMediaQuery } from "@/hooks/use-media-query"
import { getBandoUrl } from "@/lib/utils/bando-slug-utils"
import { cn } from "@/lib/utils"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

function JobsPage() {
  // Core state with URL management
  const [isLoading, setIsLoading] = useState(true)
  const [concorsi, setConcorsi] = useState<Concorso[]>([])
  const [selectedConcorso, setSelectedConcorso] = useState<Concorso | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [sortBy, setSortBy] = useState<string>('publication_desc')
  
  // Refs and hooks
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const { initializeAuth } = useAuthAdapter()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const ITEMS_PER_PAGE = 25

  // Initialize auth
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Initialize from URL parameters
  useEffect(() => {
    const sortParam = searchParams.get('sort')
    const pageParam = searchParams.get('page')
    const concorsoIdParam = searchParams.get('id')
    
    if (sortParam) {
      setSortBy(sortParam)
    }
    
    if (pageParam) {
      const page = parseInt(pageParam, 10)
      if (page > 0) {
        setCurrentPage(page)
      }
    }
    
    // Auto-select concorso if ID is in URL
    if (concorsoIdParam && concorsi.length > 0) {
      const concorso = concorsi.find(c => c.id === concorsoIdParam)
      if (concorso) {
        setSelectedConcorso(concorso)
      }
    }
  }, [searchParams, concorsi])

  // Fetch OPEN concorsi with pagination
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        console.log(`📋 Fetching OPEN concorsi - Page ${currentPage}, Sort: ${sortBy}`)
        
        const queryParams: ConcorsiQueryParams = {
          limit: ITEMS_PER_PAGE,
          page: currentPage,
          sortBy: sortBy
        }
        
        const result = await getOpenConcorsi(queryParams)
        
        setConcorsi(result.concorsi)
        setTotalCount(result.totalCount || result.concorsi.length)
        setCurrentPage(result.currentPage || currentPage)
        setTotalPages(result.totalPages || 1)
        
        console.log(`✅ Data loaded: ${result.concorsi.length} OPEN concorsi (Page ${result.currentPage}/${result.totalPages})`)
        
      } catch (error) {
        console.error('❌ Error fetching data:', error)
        toast.error('Failed to load concorsi. Please try again later.')
        setConcorsi([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentPage, sortBy])

  // Auto-select first concorso on desktop
  useEffect(() => {
    if (!isMobile && concorsi.length > 0 && !selectedConcorso) {
      const firstConcorso = concorsi[0]
      if (firstConcorso) {
        setSelectedConcorso(firstConcorso)
        updateURL(firstConcorso)
      }
    }
  }, [concorsi.length, isMobile, selectedConcorso])

  // Handle concorso selection
  const handleConcorsoSelect = (concorso: Concorso) => {
    if (isMobile) {
      try {
        const seoUrl = getBandoUrl(concorso)
        router.push(seoUrl)
      } catch (error) {
        console.error('Error generating SEO URL:', error)
        router.push(`/bandi/${concorso.id}`)
      }
    } else {
      setSelectedConcorso(concorso)
      updateURL(concorso)
    }
  }

  // Update URL with current state
  const updateURL = (concorso?: Concorso) => {
    if (concorso && !isMobile) {
      try {
        const seoUrl = getBandoUrl(concorso)
        window.history.replaceState(null, '', seoUrl)
        return
      } catch (error) {
        console.error('Error generating SEO URL for desktop:', error)
      }
    }
    
    const params = new URLSearchParams()
    
    if (concorso) params.set('id', concorso.id)
    if (sortBy && sortBy !== 'publication_desc') params.set('sort', sortBy)
    if (currentPage > 1) params.set('page', currentPage.toString())
    
    const newUrl = params.toString() ? `/bandi?${params.toString()}` : '/bandi'
    window.history.replaceState(null, '', newUrl)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Concorsi Aperti
              </h1>
              <p className="text-gray-600">
                {totalCount > 0 ? `${totalCount} concorsi disponibili` : 'Caricamento...'}
              </p>
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                Ordina per:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="publication_desc">Data di pubblicazione (più recente)</option>
                <option value="deadline_asc">Scadenza (più vicina)</option>
                <option value="deadline_desc">Scadenza (più lontana)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 min-h-[calc(100vh-300px)]">
          {/* Concorsi List */}
          <div className={cn("lg:col-span-2 overflow-hidden", !isMobile && selectedConcorso && "lg:col-span-1")}>
            <div className="h-full overflow-y-auto scrollbar-hide mr-2 p-2">
              <ConcoroList
                jobs={concorsi}
                isLoading={isLoading}
                selectedJobId={selectedConcorso?.id || null}
                onJobSelect={handleConcorsoSelect}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </div>
          </div>

          {/* Concorso Details Sidebar - Desktop Only */}
          {!isMobile && selectedConcorso && (
            <div className="lg:col-span-2">
              <div 
                className="sticky top-6 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide mr-1"
                style={{ position: 'sticky', top: '1.5rem' }}
              >
                <div className="bg-white rounded-lg shadow-sm border h-full">
                  <ConcoroDetails
                    job={selectedConcorso}
                    isLoading={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

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