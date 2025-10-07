"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ConcorsiSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentFilters: {
    localita?: string;
    settore?: string;
    scadenza?: string;
    sort?: string;
    search?: string;
  };
  totalCount: number;
  showFilterSidebar: boolean;
  onShowFilterSidebar: () => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  onSetLoading?: (loading: boolean) => void;
}

export function ConcorsiSearch({
  searchQuery,
  onSearchChange,
  currentFilters,
  totalCount,
  showFilterSidebar,
  onShowFilterSidebar,
  onClearFilters,
  isLoading = false,
  onSetLoading,
}: ConcorsiSearchProps) {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSetLoading?.(true);
      const url = new URL(window.location.href);
      url.searchParams.set('search', searchQuery.trim());
      url.searchParams.delete('page'); // Reset to first page
      router.push(url.toString());
    }
  };

  const hasActiveFilters = !!(
    currentFilters.localita || 
    currentFilters.settore ||
    currentFilters.scadenza ||
    (currentFilters.sort && currentFilters.sort !== 'publication-desc') ||
    currentFilters.search
  );


  const getFilterLabel = (key: string, value: string) => {
    switch (key) {
      case 'localita':
        return `Regione: ${value}`;
      case 'settore':
        return `Settore: ${value}`;
      case 'scadenza':
        return `Scadenza: ${value === 'today' ? 'Oggi' : value === 'week' ? 'Questa Settimana' : 'Questo Mese'}`;
      case 'sort':
        return `Ordinamento: ${value === 'deadline-asc' ? 'Scadenza' : value === 'posts-desc' ? 'Posti' : 'Data Pubblicazione'}`;
      case 'search':
        return `Ricerca: ${value}`;
      default:
        return value;
    }
  };

  const removeFilter = (key: string) => {
    onSetLoading?.(true);
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    url.searchParams.delete('page'); // Reset to first page
    router.push(url.toString());
  };

  return (
    <div className="mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Cerca bandi e avvisi per titolo, ente o descrizione..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button 
            type="submit" 
            size="lg"
            className="h-12 px-4"
            disabled={isLoading}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onShowFilterSidebar}
            className="h-12 px-4 relative"
            disabled={isLoading}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {hasActiveFilters && (
              <Badge 
                variant="default" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-600"
              >
                {Object.keys(currentFilters).filter(key => {
                  const value = currentFilters[key as keyof typeof currentFilters];
                  return value && !(key === 'sort' && value === 'publication-desc');
                }).length}
              </Badge>
            )}
          </Button>
        </div>
      </form>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-blue-600 font-medium">Filtri attivi</span>
          <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
            {Object.keys(currentFilters).filter(key => {
              const value = currentFilters[key as keyof typeof currentFilters];
              return value && !(key === 'sort' && value === 'publication-desc');
            }).length}
          </Badge>
          {Object.entries(currentFilters).map(([key, value]) => {
            if (!value || (key === 'sort' && value === 'publication-desc')) return null;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {key === 'localita' ? value : getFilterLabel(key, value)}
                <button
                  onClick={() => removeFilter(key)}
                  className="ml-1 hover:bg-blue-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Filter Status and Results Count */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          {hasActiveFilters ? "Filtri attivi" : "Nessun filtro attivo"}
        </span>
        <span className="text-sm text-gray-600">
          {totalCount.toLocaleString()} concorsi
        </span>
      </div>
    </div>
  );
}
