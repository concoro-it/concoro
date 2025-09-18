"use client"

import { useState } from "react"
import { ModernFilterSystem, FilterGroup, FilterOption } from "./ModernFilterSystem"
import { Button } from "@/components/ui/button"

// Test component to verify the ModernFilterSystem works
export function FilterSystemTest() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedDeadlines, setSelectedDeadlines] = useState<string[]>([])
  const [selectedEnti, setSelectedEnti] = useState<string[]>([])
  const [selectedSettori, setSelectedSettori] = useState<string[]>([])
  const [selectedRegimi, setSelectedRegimi] = useState<string[]>([])
  const [selectedStati, setSelectedStati] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("")

  const filterGroups: FilterGroup[] = [
    {
      id: 'locations',
      label: 'Regione',
      icon: <span className="text-blue-600">📍</span>,
      options: [
        { label: "Lombardia", value: "Lombardia" },
        { label: "Lazio", value: "Lazio" },
        { label: "Campania", value: "Campania" },
        { label: "Sicilia", value: "Sicilia" },
        { label: "Veneto", value: "Veneto" },
      ],
      selectedValues: selectedLocations,
      onSelectionChange: setSelectedLocations,
      searchable: true,
      multiSelect: true,
      color: 'blue'
    },
    {
      id: 'deadlines',
      label: 'Scadenza',
      icon: <span className="text-green-600">📅</span>,
      options: [
        { label: "Oggi", value: "today" },
        { label: "Questa Settimana", value: "week" },
        { label: "Questo Mese", value: "month" },
      ],
      selectedValues: selectedDeadlines,
      onSelectionChange: setSelectedDeadlines,
      multiSelect: true,
      color: 'green'
    },
    {
      id: 'enti',
      label: 'Ente',
      icon: <span className="text-yellow-600">🏛️</span>,
      options: [
        { label: "Comune di Milano", value: "Comune di Milano" },
        { label: "Regione Lombardia", value: "Regione Lombardia" },
        { label: "ASL Roma", value: "ASL Roma" },
        { label: "Università di Napoli", value: "Università di Napoli" },
      ],
      selectedValues: selectedEnti,
      onSelectionChange: setSelectedEnti,
      searchable: true,
      multiSelect: true,
      color: 'yellow'
    },
    {
      id: 'settori',
      label: 'Settore',
      icon: <span className="text-orange-600">💼</span>,
      options: [
        { label: "Sanità", value: "Sanità" },
        { label: "Istruzione", value: "Istruzione" },
        { label: "Amministrazione", value: "Amministrazione" },
        { label: "Tecnico", value: "Tecnico" },
      ],
      selectedValues: selectedSettori,
      onSelectionChange: setSelectedSettori,
      searchable: true,
      multiSelect: true,
      color: 'orange'
    },
    {
      id: 'regimi',
      label: 'Regime',
      icon: <span className="text-indigo-600">⏰</span>,
      options: [
        { label: "Tempo pieno", value: "Tempo pieno" },
        { label: "Part-time", value: "Part-time" },
        { label: "Collaborazione", value: "Collaborazione" },
      ],
      selectedValues: selectedRegimi,
      onSelectionChange: setSelectedRegimi,
      multiSelect: true,
      color: 'indigo'
    },
    {
      id: 'stati',
      label: 'Stato',
      icon: <span className="text-red-600">📋</span>,
      options: [
        { label: "Aperto", value: "aperto" },
        { label: "Chiuso", value: "chiuso" }
      ],
      selectedValues: selectedStati,
      onSelectionChange: setSelectedStati,
      multiSelect: true,
      color: 'red'
    }
  ]

  const sortOptions: FilterOption[] = [
    { label: "Scadenza (più vicina)", value: "deadline-asc" },
    { label: "Data di pubblicazione (più recente)", value: "publication-desc" },
    { label: "Posti disponibili (più posti)", value: "posts-desc" }
  ]

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedLocations([])
    setSelectedDeadlines([])
    setSelectedEnti([])
    setSelectedSettori([])
    setSelectedRegimi([])
    setSelectedStati([])
    setSortBy("")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Modern Filter System Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <ModernFilterSystem
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterGroups={filterGroups}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={sortOptions}
          onClearFilters={handleClearFilters}
          isLoading={false}
          totalCount={1250}
          isMobile={false}
        />
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Current Filter State:</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Search:</strong> "{searchQuery}"</div>
          <div><strong>Locations:</strong> {selectedLocations.join(", ") || "None"}</div>
          <div><strong>Deadlines:</strong> {selectedDeadlines.join(", ") || "None"}</div>
          <div><strong>Enti:</strong> {selectedEnti.join(", ") || "None"}</div>
          <div><strong>Settori:</strong> {selectedSettori.join(", ") || "None"}</div>
          <div><strong>Regimi:</strong> {selectedRegimi.join(", ") || "None"}</div>
          <div><strong>Stati:</strong> {selectedStati.join(", ") || "None"}</div>
          <div><strong>Sort:</strong> {sortBy || "None"}</div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleClearFilters} variant="outline">
          Clear All Filters
        </Button>
        <Button onClick={() => {
          setSelectedLocations(["Lombardia", "Lazio"])
          setSelectedSettori(["Sanità"])
          setSortBy("deadline-asc")
        }}>
          Test Multiple Filters
        </Button>
      </div>
    </div>
  )
}
