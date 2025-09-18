'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, MapPin } from 'lucide-react'
import { RegionWithProvinces, getRegionSlug, getProvinceSlug } from '@/lib/utils/province-categorization'

interface RegionProvinceListProps {
  regions: RegionWithProvinces[]
  className?: string
}

export default function RegionProvinceList({ regions, className = '' }: RegionProvinceListProps) {
  if (regions.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <MapPin className="h-5 w-5" />
          Località per Regione
        </CardTitle>
        <p className="text-sm text-gray-600">
          Esplora i concorsi per regione e provincia
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[600px] pr-2">
          <div className="space-y-6">
            {regions.map((region, regionIndex) => (
              <div key={regionIndex} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                {/* Region Header - Clickable */}
                <div className="mb-3">
                  <Link 
                    href={`/bandi/localita/${getRegionSlug(region.regione_nome)}`}
                    className="group flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {region.totalConcorsi}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {region.regione_nome}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {region.totalConcorsi} concorsi • {region.provinces.length} province
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </Link>
                </div>

                {/* Provinces List */}
                <div className="ml-4 space-y-2">
                  {region.provinces.map((province, provinceIndex) => (
                    <Link
                      key={provinceIndex}
                      href={`/bandi/localita/${getProvinceSlug(province.provincia_nome)}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                            {province.provincia_nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {province.concorsiCount}
                          </span>
                          <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-gray-400 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
