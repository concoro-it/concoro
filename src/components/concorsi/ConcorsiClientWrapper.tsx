"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ConcorsiSearch } from "./ConcorsiSearch";
import { ConcorsiFilters } from "./ConcorsiFilters";
import { ConcorsiMobileFilters } from "./ConcorsiMobileFilters";
import { ConcorsoCardCompact } from "./ConcorsoCardCompact";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Concorso } from "@/types/concorso";

interface ConcorsiClientWrapperProps {
  initialData: {
    concorsi: Concorso[];
    totalCount: number;
    filters: {
      enti: string[];
      localita: string[];
      settori: string[];
    };
  };
  currentFilters: {
    page?: string;
    ente?: string;
    localita?: string;
    settore?: string;
    scadenza?: string;
    sort?: string;
    search?: string;
  };
  currentPage: number;
  totalPages: number;
}

function createPaginationUrl(page: number, searchParams: any): string {
  const params = new URLSearchParams();
  
  if (page > 1) params.set('page', page.toString());
  if (searchParams.ente) params.set('ente', searchParams.ente);
  if (searchParams.localita) params.set('localita', searchParams.localita);
  if (searchParams.settore) params.set('settore', searchParams.settore);
  if (searchParams.scadenza) params.set('scadenza', searchParams.scadenza);
  if (searchParams.sort) params.set('sort', searchParams.sort);
  if (searchParams.search) params.set('search', searchParams.search);
  
  const queryString = params.toString();
  return queryString ? `/concorsi?${queryString}` : '/concorsi';
}

export function ConcorsiClientWrapper({
  initialData,
  currentFilters,
  currentPage,
  totalPages,
}: ConcorsiClientWrapperProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || "");
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");


  const handleClearFilters = () => {
    setIsLoading(true);
    const url = new URL(window.location.pathname, window.location.origin);
    // Use router.push instead of direct navigation for better loading detection
    router.push(url.toString());
  };

  const handleFilterSidebarClose = () => {
    setShowFilterSidebar(false);
  };

  // Track URL changes to detect page regeneration
  useEffect(() => {
    if (!isLoading) return; // Only run when loading is active
    
    const currentUrl = window.location.href;
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 second max timeout

    // Check for URL changes periodically
    const interval = setInterval(() => {
      if (window.location.href !== currentUrl) {
        setIsLoading(false);
        clearInterval(interval);
        clearTimeout(timeout);
      }
    }, 100);

    // Also listen for page load events
    const handleLoad = () => setIsLoading(false);
    const handlePopstate = () => setIsLoading(false);
    
    window.addEventListener('load', handleLoad);
    window.addEventListener('popstate', handlePopstate);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [isLoading]); // Re-run when loading state changes

  // Close filter sidebar on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (!isMobile && showFilterSidebar) {
        setShowFilterSidebar(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showFilterSidebar, isMobile]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (showFilterSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showFilterSidebar]);

  return (
    <>
      {/* Page Title - H1 for SEO */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {currentFilters.search 
            ? `Concorsi Pubblici: ${decodeURIComponent(currentFilters.search)}`
            : 'Concorsi Pubblici 2025'
          }
        </h1>
        <p className="text-gray-600 text-lg">
          {currentFilters.search 
            ? `${initialData.totalCount} ${initialData.totalCount === 1 ? 'concorso trovato' : 'concorsi trovati'} per "${decodeURIComponent(currentFilters.search)}"`
            : `Trova e candidati ai migliori concorsi nella Pubblica Amministrazione italiana`
          }
        </p>
      </div>

      {/* Search and Filter Section */}
      <ConcorsiSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentFilters={currentFilters}
        totalCount={initialData.totalCount}
        showFilterSidebar={showFilterSidebar}
        onShowFilterSidebar={() => setShowFilterSidebar(true)}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
        onSetLoading={setIsLoading}
      />


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar - Desktop Only */}
        {!isMobile && (
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Suspense fallback={<FiltersSkeleton />}>
                <ConcorsiFilters
                  filters={initialData.filters}
                  currentFilters={currentFilters}
                  onSetLoading={setIsLoading}
                />
              </Suspense>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className={isMobile ? "col-span-1" : "lg:col-span-3"}>
          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                      <div className="h-3 bg-muted rounded w-4/5" />
                    </div>
                    <div className="flex justify-between pt-3">
                      <div className="h-8 bg-muted rounded w-20" />
                      <div className="h-8 bg-muted rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Concorsi Grid */
            <div className="space-y-4">
              {initialData.concorsi.length > 0 ? (
                initialData.concorsi.map((concorso) => (
                  <ConcorsoCardCompact 
                    key={concorso.id} 
                    concorso={concorso}
                    showSaveButton={false}
                  />
                ))
              ) : (
                <div className="bg-white rounded-lg border p-12 text-center">
                  <p className="text-gray-500 text-lg">
                    Nessun concorso trovato con i filtri selezionati.
                  </p>
                  <p className="text-gray-400 mt-2">
                    Prova a modificare i filtri o rimuoverli per vedere più risultati.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                {currentPage > 1 && (
                  <a 
                    href={createPaginationUrl(currentPage - 1, currentFilters)}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Precedente
                  </a>
                )}
                <span className="px-4 py-2 text-sm font-medium">
                  Pagina {currentPage} di {totalPages}
                </span>
                {currentPage < totalPages && (
                  <a 
                    href={createPaginationUrl(currentPage + 1, currentFilters)}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Successiva
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      <ConcorsiMobileFilters
        filters={initialData.filters}
        currentFilters={currentFilters}
        showFilterSidebar={showFilterSidebar}
        onClose={handleFilterSidebarClose}
        onSetLoading={setIsLoading}
      />
    </>
  );
}

// Loading skeletons
function FiltersSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-20 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-6 w-24 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
