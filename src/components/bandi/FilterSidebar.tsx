"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { X } from "lucide-react"

interface FilterOption {
  label: string
  value: string
  color?: string
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  color?: string
}

interface FilterSidebarProps {
  groups: FilterGroup[]
  onClearAll: () => void
}

export function FilterSidebar({
  groups,
  onClearAll
}: FilterSidebarProps) {
  // Check if any filters are applied
  const hasActiveFilters = groups.some(group => group.selectedValues.length > 0)

  return (
    <div className="space-y-6">
      {/* Clear all filters button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClearAll}
          className="w-full"
        >
          Cancella tutti i filtri
        </Button>
      )}

      {/* Filter groups */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pr-4">
          {groups.map(group => (
            <div key={group.id} className="space-y-2">
              <Label>{group.label}</Label>

              {/* Show autocomplete for groups with many options */}
              {group.options.length > 10 ? (
                <AutocompleteInput
                  options={group.options.map(opt => opt.value)}
                  selectedValues={group.selectedValues}
                  onSelectionChange={group.onSelectionChange}
                  placeholder={`Cerca ${group.label.toLowerCase()}...`}
                  emptyMessage={`Nessun ${group.label.toLowerCase()} trovato`}
                />
              ) : (
                /* Show badges for groups with fewer options */
                <div className="flex flex-wrap gap-2">
                  {group.options.map(option => (
                    <Badge
                      key={option.value}
                      variant={group.selectedValues.includes(option.value) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        group.selectedValues.includes(option.value)
                          ? option.color
                            ? `bg-${option.color}-500 text-white hover:bg-${option.color}-600`
                            : "bg-blue-500 text-white hover:bg-blue-600"
                          : option.color
                            ? `hover:bg-${option.color}-100 hover:text-${option.color}-800`
                            : "hover:bg-blue-100 hover:text-blue-800"
                      }`}
                      onClick={() => {
                        if (group.selectedValues.includes(option.value)) {
                          group.onSelectionChange(
                            group.selectedValues.filter(v => v !== option.value)
                          )
                        } else {
                          group.onSelectionChange([...group.selectedValues, option.value])
                        }
                      }}
                    >
                      {option.label}
                      {group.selectedValues.includes(option.value) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
