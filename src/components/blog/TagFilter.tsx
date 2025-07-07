import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Filter, Tag as TagIcon } from "lucide-react"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'

interface TagFilterProps {
  tags: string[]
  selectedTag: string | null
  onSelectTag: (tag: string | null) => void
}

export function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  const clearTagFilter = () => {
    onSelectTag(null)
  }
  
  return (
    <div className="flex flex-col">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} />
            Filtro per tag
            {selectedTag && <Badge className="ml-2">{toItalianSentenceCase(selectedTag)}</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {selectedTag && (
            <DropdownMenuItem onClick={clearTagFilter}>
              Mostra tutti
            </DropdownMenuItem>
          )}
          <Separator className={selectedTag ? "my-2" : "hidden"} />
          {tags.map(tag => (
            <DropdownMenuItem
              key={tag}
              onClick={() => onSelectTag(tag)}
              className={selectedTag === tag ? "bg-gray-100" : ""}
            >
              {toItalianSentenceCase(tag)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {selectedTag && (
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
            <TagIcon size={14} />
            <span>Filtro: {toItalianSentenceCase(selectedTag)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={clearTagFilter}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 