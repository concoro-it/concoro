import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ChevronDown, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import React from "react"

interface FilterOption {
  label: string
  value: string
}

interface FilterPopoverProps {
  icon?: React.ReactNode
  title: string
  options: FilterOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  className?: string
  buttonClassName?: string
  triggerText?: string
}

export function FilterPopover({
  icon,
  title,
  options,
  selectedValues,
  onChange,
  className,
  buttonClassName,
  triggerText,
}: FilterPopoverProps) {
  const handleOptionToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    
    onChange(newValues)
  }

  const handleRemoveValue = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedValues.filter(v => v !== value))
  }

  // Calculate the appropriate height based on the number of options
  const getScrollAreaHeight = () => {
    const itemHeight = 36; // Approximate height of each option item
    const minHeight = 150; // Minimum height
    const maxHeight = 300; // Maximum height
    
    // Calculate a height based on number of options (up to 8 items without scroll)
    const calculatedHeight = Math.min(options.length * itemHeight + 60, maxHeight);
    
    // Use the calculated height, but not less than minHeight
    return Math.max(calculatedHeight, minHeight);
  }

  if (selectedValues.length > 0) {
    return (
      <div className="inline-flex items-center gap-1">
        {selectedValues.map(value => {
          const option = options.find(opt => opt.value === value)
          return (
            <div
              key={value}
              className="inline-flex items-center gap-x-1 rounded-xl bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-all duration-200 animate-in fade-in slide-in-from-left-1"
            >
              {option?.label || value}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-[26px] px-3 font-normal text-sm rounded-lg hover:bg-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0",
            buttonClassName
          )}
        >
          <span className="flex items-center gap-1">
            {icon && <span className="opacity-70">{icon}</span>}
            <span>{triggerText || title}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <ScrollArea className={`h-[${getScrollAreaHeight()}px] p-4`} style={{ height: getScrollAreaHeight() }}>
          <div className="space-y-4">
            <div className="mb-4 px-1">
              <h4 className="text-sm font-medium">{title}</h4>
            </div>
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={() => handleOptionToggle(option.value)}
                />
                <label
                  htmlFor={option.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 