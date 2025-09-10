"use client"

import { useState } from "react"
import { FilterPageLayout } from "@/components/bandi/FilterPageLayout"
import { FilterSidebar } from "@/components/bandi/FilterSidebar"
import { Concorso } from "@/types/concorso"
import { useRouter, useSearchParams } from "next/navigation"
import { ParsedParams } from "./types"

interface BandiClientProps {
  concorsi: Concorso[]
  metadata: {
    totalCount: number
    currentPage: number
    hasMore: boolean
    nextCursor?: string
  }
  filterOptions: {
    settori: string[]
    regimi: string[]
    enti: string[]
    regioni: string[]
  }
  appliedFilters: ParsedParams
}

export default function BandiClient({
  concorsi,
  metadata,
  filterOptions,
  appliedFilters
}: BandiClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Handle filter changes
  const updateFilters = (newFilters: Partial<ParsedParams>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update or remove each filter
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else {
        params.set(key, Array.isArray(value) ? value.join(',') : String(value))
      }
    })

    // Reset page when filters change
    params.delete('page')

    // Update URL
    router.push(`/bandi?${params.toString()}`)
  }

  // Handle load more
  const handleLoadMore = async () => {
    if (isLoadingMore || !metadata.hasMore) return
    
    setIsLoadingMore(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(metadata.currentPage + 1))
      router.push(`/bandi?${params.toString()}`)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Prepare filter groups for sidebar
  const filterGroups = [
    {
      id: 'regioni',
      label: 'Regioni',
      options: filterOptions.regioni.map(r => ({ label: r, value: r })),
      selectedValues: appliedFilters.regione || [],
      onSelectionChange: (values: string[]) => updateFilters({ regione: values }),
      color: 'blue'
    },
    {
      id: 'settori',
      label: 'Settori Professionali',
      options: filterOptions.settori.map(s => ({ label: s, value: s })),
      selectedValues: appliedFilters.settore ? [appliedFilters.settore] : [],
      onSelectionChange: (values: string[]) => updateFilters({ settore: values[0] }),
      color: 'orange'
    },
    {
      id: 'regimi',
      label: 'Regime di Impegno',
      options: filterOptions.regimi.map(r => ({ label: r, value: r })),
      selectedValues: appliedFilters.regime ? [appliedFilters.regime] : [],
      onSelectionChange: (values: string[]) => updateFilters({ regime: values[0] }),
      color: 'indigo'
    },
    {
      id: 'enti',
      label: 'Enti',
      options: filterOptions.enti.map(e => ({ label: e, value: e })),
      selectedValues: appliedFilters.ente ? [appliedFilters.ente] : [],
      onSelectionChange: (values: string[]) => updateFilters({ ente: values[0] })
    }
  ]

  // Prepare badges for header
  const badges = [
    ...(appliedFilters.regione?.map(r => ({ label: 'Regione', value: r, color: '#3b82f6' })) || []),
    ...(appliedFilters.settore ? [{ label: 'Settore', value: appliedFilters.settore, color: '#f97316' }] : []),
    ...(appliedFilters.regime ? [{ label: 'Regime', value: appliedFilters.regime, color: '#6366f1' }] : []),
    ...(appliedFilters.ente ? [{ label: 'Ente', value: appliedFilters.ente }] : [])
  ]

  return (
    <FilterPageLayout
      title="Concorsi Pubblici"
      subtitle="Esplora"
      totalCount={metadata.totalCount}
      concorsi={concorsi}
      badges={badges}
      filterSidebar={
        <FilterSidebar
          groups={filterGroups}
          onClearAll={() => {
            router.push('/bandi')
          }}
        />
      }
      hasMore={metadata.hasMore}
      onLoadMore={handleLoadMore}
      isLoadingMore={isLoadingMore}
    />
  )
}