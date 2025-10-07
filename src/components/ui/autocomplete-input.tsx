"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface AutocompleteInputProps {
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder?: string
  className?: string
  emptyMessage?: string
}

export function AutocompleteInput({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Cerca e seleziona...",
  className,
  emptyMessage = "Nessun ente trovato",
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return options.slice(0, 50) // Show first 50 when empty
    return options.filter(option =>
      option.toLowerCase().includes(inputValue.toLowerCase().trim())
    )
  }, [options, inputValue])

  const handleSelect = (value: string) => {
    console.log('handleSelect called with:', value) // Debug log
    console.log('Current selectedValues:', selectedValues) // Debug log
    
    if (selectedValues.includes(value)) {
      // Remove if already selected
      onSelectionChange(selectedValues.filter(v => v !== value))
    } else {
      // Add if not selected
      onSelectionChange([...selectedValues, value])
    }
    // Clear input and close popover after selection
    setInputValue("")
    setOpen(false)
  }

  const handleRemove = (value: string) => {
    onSelectionChange(selectedValues.filter(v => v !== value))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    // Open popover when user starts typing
    if (value.length > 0 && !open) {
      setOpen(true)
    }
  }

  const handleInputFocus = () => {
    // Only open if user has typed something or clicked directly on the input
    if (inputValue.length > 0) {
      setOpen(true)
    }
  }

  const handleInputClick = () => {
    // Open dropdown when user explicitly clicks on the input
    setOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false)
      setInputValue("")
    }
  }

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {/* Selected values display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map(value => (
            <div
              key={value}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
            >
              <span>{value}</span>
              <button
                onClick={() => handleRemove(value)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Autocomplete input */}
      <div className="relative w-full">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-8 focus:ring-0 focus:ring-offset-0 focus:border-input w-full"
        />
        <Search className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        
        {/* Custom dropdown */}
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-2 px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded-sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Clicked on option:', option) // Debug log
                      handleSelect(option)
                    }}
                  >
                    <Checkbox
                      checked={selectedValues.includes(option)}
                      className="pointer-events-none"
                    />
                    <span className="flex-1">{option}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 