import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Calendar, X, FileText, Briefcase, Clock, Filter as FilterIcon, ArrowUpDown, Loader2 } from "lucide-react"
import { FilterPopover } from "./FilterPopover"
import { Button } from "@/components/ui/button"
import { FilterBadge } from "@/components/ui/filter-badge"
import { cn } from "@/lib/utils"

interface JobSearchProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  locationQuery?: string
  onLocationChange?: (value: string) => void
  selectedLocations?: string[]
  selectedDeadlines?: string[]
  selectedEnti?: string[]
  selectedSettori?: string[]
  selectedRegimi?: string[]
  selectedStati?: string[]
  onLocationsChange?: (values: string[]) => void
  onDeadlinesChange?: (values: string[]) => void
  onEntiChange?: (values: string[]) => void
  onSettoriChange?: (values: string[]) => void
  onRegimiChange?: (values: string[]) => void
  onStatiChange?: (values: string[]) => void
  availableLocations?: string[]
  availableEnti?: string[]
  availableSettori?: string[]
  availableRegimi?: string[]
  showAdvancedFilters?: boolean
  onShowFilterSidebar?: () => void
  onFilterSidebarClose?: () => void
  // Sorting props
  sortBy?: string
  onSortChange?: (value: string) => void
  // Category props
  selectedCategory?: string
  onCategoryChange?: (value: string) => void
  // Clear filters
  onClearFilters?: () => void
  // Mobile filter sidebar
  showFilterSidebar?: boolean
  // Total count prop
  totalCount?: number
  // Loading state for API calls
  isSearching?: boolean
}

export function JobSearch({
  searchQuery,
  onSearchChange,
  locationQuery = "",
  onLocationChange = () => {},
  selectedLocations = [],
  selectedDeadlines = [],
  selectedEnti = [],
  selectedSettori = [],
  selectedRegimi = [],
  selectedStati = [],
  onLocationsChange = () => {},
  onDeadlinesChange = () => {},
  onEntiChange = () => {},
  onSettoriChange = () => {},
  onRegimiChange = () => {},
  onStatiChange = () => {},
  availableLocations = [],
  availableEnti = [],
  availableSettori = [],
  availableRegimi = [],
  showAdvancedFilters = false,
  onShowFilterSidebar = () => {},
  onFilterSidebarClose = () => {},
  // Sorting props
  sortBy = "",
  onSortChange = () => {},
  // Category props
  selectedCategory = "all",
  onCategoryChange = () => {},
  // Clear filters
  onClearFilters = () => {},
  // Mobile filter sidebar
  showFilterSidebar = false,
  // Total count prop
  totalCount,
  // Loading state for API calls
  isSearching = false,
}: JobSearchProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery)

  // Sync local state with prop changes
  useEffect(() => {
    setSearchTerm(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    // Increased debounce delay for API calls to reduce server load
    const timer = setTimeout(() => {
      onSearchChange(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, onSearchChange])

  // Helper function to truncate Ente names
  const cleanEnteName = (ente: string): string => {
    if (!ente) return ente;
    const dashIndex = ente.indexOf('-');
    if (dashIndex > 0) {
      return ente.substring(0, dashIndex).trim();
    }
    return ente;
  }

  const deadlineOptions = [
    { label: "Oggi", value: "today" },
    { label: "Questa Settimana", value: "week" },
    { label: "Questo Mese", value: "month" },
  ]

  const handleClearFilters = () => {
    setSearchTerm("")
    onSearchChange("")
    onLocationsChange([])
    onDeadlinesChange([])
    onEntiChange([])
    onSettoriChange([])
    onRegimiChange([])
    onStatiChange([])
    onSortChange("")
    if (onClearFilters) {
      onClearFilters()
    }
  }

  const hasActiveFilters = 
    selectedLocations.length > 0 || 
    selectedDeadlines.length > 0 || 
    selectedEnti.length > 0 ||
    selectedSettori.length > 0 ||
    selectedRegimi.length > 0 ||
    selectedStati.length > 0 ||
    Boolean(sortBy)

  const totalActiveFilters = 
    selectedLocations.length + 
    selectedDeadlines.length + 
    selectedEnti.length +
    selectedSettori.length +
    selectedRegimi.length +
    selectedStati.length +
    (sortBy ? 1 : 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <div className="flex-1 relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca bandi e avvisi per titolo, ente o descrizione…"
            className={cn("pl-9", isSearching && "bg-gray-50")}
            disabled={isSearching}
          />
        </div>
        
        {/* Mobile filter button with notification indicator */}
        <div className="relative lg:hidden">
          <Button 
            variant="outline" 
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={onShowFilterSidebar}
          >
            <FilterIcon className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
              {totalActiveFilters}
            </span>
          )}
        </div>
        
        {/* Desktop "All filters" button with notification indicator */}
        <div className="relative hidden lg:block">
          <Button
            variant="outline"
            size="sm"
            className="h-10 items-center gap-1 flex"
            onClick={onShowFilterSidebar}
          >
            <FilterIcon className="h-4 w-4 mr-1" />
            Tutti i filtri
          </Button>
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-lg bg-blue-500 text-[10px] font-medium text-white">
              {totalActiveFilters}
            </span>
          )}
        </div>
      </div>
      
      {showAdvancedFilters && (
        <>
          {/* Mobile layout - filters and total count */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                {hasActiveFilters ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm mobile-text-compact text-blue-600 font-medium">Filtri attivi</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {totalActiveFilters}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm mobile-text-compact text-gray-600">Nessun filtro attivo</span>
                )}
              </div>
              {totalCount !== undefined && (
                <span className="text-sm mobile-text-compact text-gray-600 font-medium">
                  {totalCount} {totalCount === 1 ? 'concorso' : 'concorsi'}
                </span>
              )}
            </div>
            
            {/* Active filter chips for mobile */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {selectedLocations.map(location => (
                  <div key={`loc-${location}`} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    <span>{location}</span>
                    <button
                      onClick={() => onLocationsChange(selectedLocations.filter(l => l !== location))}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedDeadlines.map(deadline => (
                  <div key={`deadline-${deadline}`} className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    <span>{deadlineOptions.find(d => d.value === deadline)?.label || deadline}</span>
                    <button
                      onClick={() => onDeadlinesChange(selectedDeadlines.filter(d => d !== deadline))}
                      className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedEnti.map(ente => (
                  <div key={`ente-${ente}`} className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    <span>{ente}</span>
                    <button
                      onClick={() => onEntiChange(selectedEnti.filter(e => e !== ente))}
                      className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedSettori.map(settore => (
                  <div key={`settore-${settore}`} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                    <span>{settore}</span>
                    <button
                      onClick={() => onSettoriChange(selectedSettori.filter(s => s !== settore))}
                      className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedRegimi.map(regime => (
                  <div key={`regime-${regime}`} className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs">
                    <span>{regime}</span>
                    <button
                      onClick={() => onRegimiChange(selectedRegimi.filter(r => r !== regime))}
                      className="ml-1 hover:bg-teal-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedStati.map(stato => (
                  <div key={`stato-${stato}`} className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                    <span>{stato.charAt(0).toUpperCase() + stato.slice(1)}</span>
                    <button
                      onClick={() => onStatiChange(selectedStati.filter(s => s !== stato))}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {sortBy && (
                  <div className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
                    <span>Ordinato</span>
                    <button
                      onClick={() => onSortChange("")}
                      className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Show filter popovers only on desktop */}
          <div className="hidden lg:flex flex-wrap items-center gap-2">
            <FilterPopover
              icon={<MapPin className="h-3 w-3" />}
              title="Regione"
              options={availableLocations
                .sort((a, b) => {
                  const nonSpecA = a.toLowerCase().includes('non specificato') || a.toLowerCase() === 'n/a' || a === '';
                  const nonSpecB = b.toLowerCase().includes('non specificato') || b.toLowerCase() === 'n/a' || b === '';
                  if (nonSpecA) return 1;
                  if (nonSpecB) return -1;
                  return a.localeCompare(b);
                })
                .map(location => ({
                  label: location,
                  value: location,
                }))}
              selectedValues={selectedLocations}
              onChange={onLocationsChange}
            />
            <FilterPopover
              icon={<Calendar className="h-3 w-3" />}
              title="Scade"
              options={deadlineOptions}
              selectedValues={selectedDeadlines}
              onChange={onDeadlinesChange}
            />
            <FilterPopover
              icon={<Briefcase className="h-3 w-3" />}
              title="Settore"
              options={availableSettori
                .sort((a, b) => {
                  const nonSpecA = a.toLowerCase().includes('non specificato') || a.toLowerCase() === 'n/a' || a === '';
                  const nonSpecB = b.toLowerCase().includes('non specificato') || b.toLowerCase() === 'n/a' || b === '';
                  if (nonSpecA) return 1;
                  if (nonSpecB) return -1;
                  return a.localeCompare(b);
                })
                .map(settore => ({
                  label: settore,
                  value: settore,
                }))}
              selectedValues={selectedSettori}
              onChange={onSettoriChange}
            />
            <FilterPopover
              icon={<Clock className="h-3 w-3" />}
              title="Regime"
              options={availableRegimi
                .sort((a, b) => {
                  const nonSpecA = a.toLowerCase().includes('non specificato') || a.toLowerCase() === 'n/a' || a === '';
                  const nonSpecB = b.toLowerCase().includes('non specificato') || b.toLowerCase() === 'n/a' || b === '';
                  if (nonSpecA) return 1;
                  if (nonSpecB) return -1;
                  return a.localeCompare(b);
                })
                .map(regime => ({
                  label: regime,
                  value: regime,
                }))}
              selectedValues={selectedRegimi}
              onChange={onRegimiChange}
            />
            <FilterPopover
              icon={<FileText className="h-3 w-3" />}
              title="Stato"
              options={[
                { label: "Aperto", value: "aperto" },
                { label: "Chiuso", value: "chiuso" }
              ]}
              selectedValues={selectedStati}
              onChange={onStatiChange}
            />
            
            {/* Spacer to push right-side buttons to the right */}
            <div className="flex-1"></div>
            
            {/* Ordina Button */}
            <FilterPopover
              icon={<ArrowUpDown className="h-3 w-3" />}
              title="Ordina"
              options={[
                { label: "Scadenza (più vicina)", value: "deadline-asc" },
                { label: "Data di pubblicazione (più recente)", value: "publication-desc" },
                { label: "Posti disponibili (più posti)", value: "posts-desc" }
              ]}
              selectedValues={sortBy ? [sortBy] : []}
              onChange={(values) => onSortChange(values[0] || "")}
            />
            
            {(hasActiveFilters || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 px-3 text-xs rounded-full flex-shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <X className="h-3 w-3 mr-1" />
                Cancella
              </Button>
            )}
          </div>
          
          {/* Total count display - desktop only, bottom of header */}
          {totalCount !== undefined && (
            <div className="hidden lg:block">
              <span className="text-sm text-gray-600 font-medium">
                {totalCount} concorsi trovati
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
} 