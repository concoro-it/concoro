"use client"

import { useState } from "react"
import { ConcoroList } from "./ConcoroList"
import { ConcoroDetails } from "./ConcoroDetails"
import { useRouter } from "next/navigation"
import { getBandoUrl } from "@/lib/utils/bando-slug-utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Concorso } from "@/types/concorso"
import { FilterPageHeader } from "./FilterPageHeader"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { FilterIcon } from "lucide-react"

interface FilterPageLayoutProps {
  title: string
  subtitle: string
  totalCount: number
  concorsi: Concorso[]
  badges?: Array<{
    label: string
    value: string
    color?: string
  }>
  filterSidebar?: React.ReactNode
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
}

export function FilterPageLayout({
  title,
  subtitle,
  totalCount,
  concorsi,
  badges,
  filterSidebar,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false
}: FilterPageLayoutProps) {
  const [selectedJob, setSelectedJob] = useState<Concorso | null>(null)
  const [showFilterSidebar, setShowFilterSidebar] = useState(false)
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 1024px)")

  // Handle concorso selection
  const handleConcorsoSelect = (concorso: Concorso) => {
    if (isMobile) {
      // On mobile, navigate to individual page
      try {
        const seoUrl = getBandoUrl(concorso)
        router.push(seoUrl)
      } catch (error) {
        console.error('Error generating SEO URL:', error)
        router.push(`/bandi/${concorso.id}`)
      }
    } else {
      // On desktop, show in sidebar
      setSelectedJob(concorso)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 pt-8">
        {/* Header */}
        <FilterPageHeader
          title={title}
          subtitle={subtitle}
          totalCount={totalCount}
          badges={badges}
        />

        {/* Filter button (mobile only) */}
        {filterSidebar && isMobile && (
          <div className="mb-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowFilterSidebar(true)}
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              Filtra risultati
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Filter Sidebar (desktop) */}
          {filterSidebar && !isMobile && (
            <div className="lg:col-span-1 overflow-hidden">
              <div className="h-full overflow-y-auto scrollbar-hide mr-1">
                {filterSidebar}
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div className={
            !isMobile 
              ? filterSidebar 
                ? selectedJob 
                  ? "lg:col-span-1 overflow-hidden" 
                  : "lg:col-span-2 overflow-hidden"
                : selectedJob 
                  ? "lg:col-span-1 overflow-hidden" 
                  : "lg:col-span-2 overflow-hidden"
              : "lg:col-span-3"
          }>
            <div className="h-full overflow-y-auto scrollbar-hide">
              <ConcoroList
                jobs={concorsi}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                selectedJobId={selectedJob?.id || null}
                onJobSelect={handleConcorsoSelect}
                onLoadMore={onLoadMore || (() => {})}
                hasMore={hasMore}
              />
            </div>
          </div>

          {/* Job Details Sidebar - Desktop Only */}
          {!isMobile && selectedJob && (
            <div className="lg:col-span-1 overflow-hidden">
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
        {filterSidebar && (
          <Sheet open={showFilterSidebar} onOpenChange={setShowFilterSidebar}>
            <SheetContent side="right" className="w-full sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Filtri</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {filterSidebar}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </main>
    </div>
  )
}
