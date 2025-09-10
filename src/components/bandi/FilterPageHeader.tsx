"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface FilterPageHeaderProps {
  title: string
  subtitle: string
  totalCount: number
  badges?: Array<{
    label: string
    value: string
    color?: string
  }>
}

export function FilterPageHeader({ 
  title, 
  subtitle, 
  totalCount,
  badges 
}: FilterPageHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-8">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Torna ai concorsi
      </Button>

      {/* Title and subtitle */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {title}
        </h1>
        <p className="text-gray-600">
          {subtitle}
          <span className="font-semibold"> {totalCount} </span>
          opportunità disponibili
        </p>
      </div>

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {badges.map((badge, index) => (
            <Badge 
              key={index}
              variant="secondary"
              style={{ 
                backgroundColor: badge.color ? `${badge.color}10` : undefined,
                color: badge.color,
                borderColor: badge.color ? `${badge.color}20` : undefined
              }}
            >
              {badge.label}: {badge.value}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
