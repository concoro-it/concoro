"use client"

import { useState, useEffect, useMemo, memo, useCallback } from "react"
import { Search, MapPin, Calendar, X, FileText, Briefcase, Clock, Filter as FilterIcon, ArrowUpDown, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"

export interface FilterOption {
  label: string
  value: string
  count?: number
}

export interface FilterGroup {
  id: string
  label: string
  icon: React.ReactNode
  options: FilterOption[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  searchable?: boolean
  multiSelect?: boolean
  color?: string
}

export interface ModernFilterSystemProps {
  // Search
  searchQuery: string
  onSearchChange: (value: string) => void
  
  // Filter groups
  filterGroups: FilterGroup[]
  
  // Sorting
  sortBy?: string
  onSortChange?: (value: string) => void
  sortOptions?: FilterOption[]
  
  // Clear filters
  onClearFilters: () => void
  
  // UI state
  isLoading?: boolean
  totalCount?: number
  
  // Mobile
  isMobile?: boolean
}

function ModernFilterSystemComponent({
  searchQuery,
  onSearchChange,
  filterGroups,
  sortBy,
  onSortChange,
  sortOptions = [],
  onClearFilters,
  isLoading = false,
  totalCount,
  isMobile = false
}: ModernFilterSystemProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm, onSearchChange])

  // Sync local search state with prop
  useEffect(() => {
    setSearchTerm(searchQuery)
  }, [searchQuery])

  // Calculate active filters
  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; groupId: string; color?: string }> = []
    
    filterGroups.forEach(group => {
      group.selectedValues.forEach(value => {
        const option = group.options.find(opt => opt.value === value)
        if (option) {
          filters.push({
            label: option.label,
            value,
            groupId: group.id,
            color: group.color
          })
        }
      })
    })
    
    if (sortBy) {
      const sortOption = sortOptions.find(opt => opt.value === sortBy)
      if (sortOption) {
        filters.push({
          label: `Ordinamento: ${sortOption.label}`,
          value: sortBy,
          groupId: 'sort'
        })
      }
    }
    
    return filters
  }, [filterGroups, sortBy, sortOptions])

  const hasActiveFilters = activeFilters.length > 0 || searchTerm.trim().length > 0

  // Memoized filter popover component
  const FilterPopover = memo(({ group }: { group: FilterGroup }) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const filteredOptions = group.searchable 
      ? group.options.filter(option => 
          option.label.toLowerCase().includes(search.toLowerCase())
        )
      : group.options

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-2 text-xs",
              group.selectedValues.length > 0 && "bg-blue-50 border-blue-200 text-blue-700"
            )}
          >
            {group.icon}
            <span className="hidden sm:inline">{group.label}</span>
            {group.selectedValues.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {group.selectedValues.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              {group.icon}
              <span className="font-medium text-sm">{group.label}</span>
            </div>
            {group.searchable && (
              <Input
                placeholder={`Cerca ${group.label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-2 space-y-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (group.multiSelect !== false) {
                      // Multi-select behavior
                      const newValues = group.selectedValues.includes(option.value)
                        ? group.selectedValues.filter(v => v !== option.value)
                        : [...group.selectedValues, option.value]
                      group.onSelectionChange(newValues)
                    } else {
                      // Single-select behavior
                      group.onSelectionChange([option.value])
                      setOpen(false)
                    }
                  }}
                >
                  <Checkbox
                    checked={group.selectedValues.includes(option.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm flex-1">{option.label}</span>
                  {option.count && (
                    <Badge variant="outline" className="text-xs">
                      {option.count}
                    </Badge>
                  )}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Nessun risultato trovato
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    )
  })

  // Memoized mobile filter sheet
  const MobileFilterSheet = memo(() => (
    <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden gap-2">
          <FilterIcon className="h-4 w-4" />
          Filtri
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {activeFilters.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filtri</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)] mt-6">
          <div className="space-y-6 px-2">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ricerca</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca bandi..."
                className="h-9"
              />
            </div>

            {/* Filter groups */}
            {filterGroups.map((group) => (
              <div key={group.id}>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  {group.icon}
                  {group.label}
                </label>
                
                {group.searchable ? (
                  <Command>
                    <CommandInput placeholder={`Cerca ${group.label.toLowerCase()}...`} />
                    <CommandEmpty>Nessun risultato trovato.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="max-h-48">
                        {group.options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => {
                              if (group.multiSelect !== false) {
                                const newValues = group.selectedValues.includes(option.value)
                                  ? group.selectedValues.filter(v => v !== option.value)
                                  : [...group.selectedValues, option.value]
                                group.onSelectionChange(newValues)
                              } else {
                                group.onSelectionChange([option.value])
                              }
                            }}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={group.selectedValues.includes(option.value)}
                              className="h-4 w-4"
                            />
                            <span className="flex-1">{option.label}</span>
                            {option.count && (
                              <Badge variant="outline" className="text-xs">
                                {option.count}
                              </Badge>
                            )}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                ) : (
                  <div className="space-y-2">
                    <ScrollArea className="max-h-48">
                      {group.options.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (group.multiSelect !== false) {
                              const newValues = group.selectedValues.includes(option.value)
                                ? group.selectedValues.filter(v => v !== option.value)
                                : [...group.selectedValues, option.value]
                              group.onSelectionChange(newValues)
                            } else {
                              group.onSelectionChange([option.value])
                            }
                          }}
                        >
                          <Checkbox
                            checked={group.selectedValues.includes(option.value)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm flex-1">{option.label}</span>
                          {option.count && (
                            <Badge variant="outline" className="text-xs">
                              {option.count}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
            ))}

            {/* Sort */}
            {sortOptions.length > 0 && onSortChange && (
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Ordinamento
                </label>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        onSortChange(sortBy === option.value ? "" : option.value)
                      }}
                    >
                      <Checkbox
                        checked={sortBy === option.value}
                        className="h-4 w-4"
                      />
                      <span className="text-sm flex-1">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  onClearFilters()
                  setSearchTerm("")
                }}
                className="w-full"
              >
                Cancella tutti i filtri
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  ))

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          {isLoading ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca bandi e avvisi per titolo, ente o descrizione..."
            className={cn("pl-9", isLoading && "bg-gray-50")}
            disabled={isLoading}
          />
        </div>
        
        {/* Mobile filter button */}
        {isMobile && <MobileFilterSheet />}
      </div>

      {/* Desktop filters */}
      {!isMobile && (
        <div className="space-y-3">
          {/* Filter buttons row */}
          <div className="flex flex-wrap items-center gap-2">
            {filterGroups.map((group) => (
              <FilterPopover key={group.id} group={group} />
            ))}
            
            {/* Sort popover */}
            {sortOptions.length > 0 && onSortChange && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 gap-2 text-xs",
                      sortBy && "bg-indigo-50 border-indigo-200 text-indigo-700"
                    )}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    <span className="hidden sm:inline">Ordina</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="font-medium text-sm">Ordinamento</span>
                    </div>
                  </div>
                  <div className="p-2">
                    {sortOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          onSortChange(sortBy === option.value ? "" : option.value)
                        }}
                      >
                        <Checkbox
                          checked={sortBy === option.value}
                          className="h-4 w-4"
                        />
                        <span className="text-sm flex-1">{option.label}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClearFilters()
                  setSearchTerm("")
                }}
                className="h-8 gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
                Cancella
              </Button>
            )}
          </div>

          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Filtri attivi:</span>
              {activeFilters.map((filter, index) => (
                <Badge
                  key={`${filter.groupId}-${filter.value}-${index}`}
                  variant="secondary"
                  className={cn(
                    "gap-1 text-xs",
                    filter.color === 'blue' && "bg-blue-100 text-blue-800",
                    filter.color === 'green' && "bg-green-100 text-green-800",
                    filter.color === 'orange' && "bg-orange-100 text-orange-800",
                    filter.color === 'indigo' && "bg-indigo-100 text-indigo-800",
                    filter.color === 'red' && "bg-red-100 text-red-800"
                  )}
                >
                  {filter.label}
                  <button
                    onClick={() => {
                      if (filter.groupId === 'sort' && onSortChange) {
                        onSortChange("")
                      } else {
                        const group = filterGroups.find(g => g.id === filter.groupId)
                        if (group) {
                          group.onSelectionChange(
                            group.selectedValues.filter(v => v !== filter.value)
                          )
                        }
                      }
                    }}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Results count */}
          {totalCount !== undefined && (
            <div className="text-sm text-gray-600">
              {totalCount} {totalCount === 1 ? 'concorso' : 'concorsi'} trovati
            </div>
          )}
        </div>
      )}

      {/* Mobile active filters and count */}
      {isMobile && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasActiveFilters ? (
                <>
                  <span className="text-sm text-blue-600 font-medium">Filtri attivi</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeFilters.length}
                  </Badge>
                </>
              ) : (
                <span className="text-sm text-gray-600">Nessun filtro attivo</span>
              )}
            </div>
            {totalCount !== undefined && (
              <span className="text-sm text-gray-600 font-medium">
                {totalCount} {totalCount === 1 ? 'concorso' : 'concorsi'}
              </span>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <Badge
                  key={`${filter.groupId}-${filter.value}-${index}`}
                  variant="secondary"
                  className={cn(
                    "gap-1 text-xs",
                    filter.color === 'blue' && "bg-blue-100 text-blue-800",
                    filter.color === 'green' && "bg-green-100 text-green-800",
                    filter.color === 'orange' && "bg-orange-100 text-orange-800",
                    filter.color === 'indigo' && "bg-indigo-100 text-indigo-800",
                    filter.color === 'red' && "bg-red-100 text-red-800"
                  )}
                >
                  {filter.label}
                  <button
                    onClick={() => {
                      if (filter.groupId === 'sort' && onSortChange) {
                        onSortChange("")
                      } else {
                        const group = filterGroups.find(g => g.id === filter.groupId)
                        if (group) {
                          group.onSelectionChange(
                            group.selectedValues.filter(v => v !== filter.value)
                          )
                        }
                      }
                    }}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Memoized export with safe comparison
export const ModernFilterSystem = memo(ModernFilterSystemComponent, (prevProps, nextProps) => {
  // Safe comparison avoiding JSON.stringify on React components
  if (
    prevProps.searchQuery !== nextProps.searchQuery ||
    prevProps.sortBy !== nextProps.sortBy ||
    prevProps.isLoading !== nextProps.isLoading ||
    prevProps.totalCount !== nextProps.totalCount ||
    prevProps.isMobile !== nextProps.isMobile
  ) {
    return false
  }
  
  // Compare filter groups safely
  if (prevProps.filterGroups.length !== nextProps.filterGroups.length) {
    return false
  }
  
  for (let i = 0; i < prevProps.filterGroups.length; i++) {
    const prev = prevProps.filterGroups[i]
    const next = nextProps.filterGroups[i]
    
    if (
      prev.id !== next.id ||
      prev.label !== next.label ||
      prev.selectedValues.length !== next.selectedValues.length ||
      prev.options.length !== next.options.length
    ) {
      return false
    }
    
    // Compare selected values
    for (let j = 0; j < prev.selectedValues.length; j++) {
      if (prev.selectedValues[j] !== next.selectedValues[j]) {
        return false
      }
    }
  }
  
  // Compare sort options safely
  if (prevProps.sortOptions.length !== nextProps.sortOptions.length) {
    return false
  }
  
  for (let i = 0; i < prevProps.sortOptions.length; i++) {
    if (
      prevProps.sortOptions[i].label !== nextProps.sortOptions[i].label ||
      prevProps.sortOptions[i].value !== nextProps.sortOptions[i].value
    ) {
      return false
    }
  }
  
  return true
})
