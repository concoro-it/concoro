# API-Based Concorsi Filtering System

This document explains the new API-based filtering system implemented for the concorsi search functionality.

## Overview

The new system replaces client-side filtering of all concorsi data with server-side API calls that filter at the database level. This approach is much more efficient for large datasets (10,000+ documents) and provides better performance.

## Architecture

### Components

1. **ConcorsiFilterService** (`src/lib/services/concorsi-filter-service.ts`)
   - Main service class that handles API-based filtering
   - Maps UI filter parameters to API query parameters
   - Transforms API responses to match `Concorso` interface
   - Provides pagination and filter options extraction

2. **Enhanced Types** (`src/types/query-options.ts`)
   - Extended `ConcorsiQueryOptions` interface to support UI filter arrays
   - Added `FilterOptions` interface for dropdown/autocomplete options
   - Maintains backward compatibility with existing API

3. **Updated Search Component** (`src/components/jobs/ConcorsiSearch.tsx`)
   - Added loading indicator during API calls
   - Increased debounce delay to 500ms for better API performance
   - Disabled input during search to prevent multiple requests

4. **Modernized Page Logic** (`src/app/bandi/page.tsx`)
   - Replaced client-side filtering with API calls
   - Added proper loading states and error handling
   - Maintained fallback to legacy methods

## Key Features

### 🚀 Performance Improvements
- **Server-side filtering**: No more downloading 10,000+ documents to client
- **Efficient pagination**: Uses cursor-based pagination with `nextCursor`
- **Optimized queries**: Leverages Firestore indexes for fast filtering
- **Debounced search**: Reduces API calls during typing

### 🔧 Filter Capabilities
- **Text search**: Search in title, ente, area geografica, and description
- **Location filtering**: Multiple region selection (using province.regione_nome field)
- **Ente filtering**: Organization-based filtering
- **Settore filtering**: Professional sector filtering
- **Regime filtering**: Employment type filtering
- **Status filtering**: Open/closed status
- **Deadline filtering**: Time-based filtering (today, week, month)
- **Sorting**: Publication date, deadline, number of positions

### 🎯 Type Safety
- All parameters use the `Concorso` interface for type safety
- Field mapping prevents naming mistakes
- Proper TypeScript interfaces for all API communications

## Usage

### Basic Filtering
```typescript
import { concorsiFilterService, ConcorsiFilterParams } from '@/lib/services/concorsi-filter-service'

const filters: ConcorsiFilterParams = {
  searchQuery: 'ingegnere',
  selectedLocations: ['Lombardia', 'Lazio'],
  selectedEnti: ['Comune di Milano'],
  sortBy: 'deadline-asc',
  limit: 20
}

const result = await concorsiFilterService.getFilteredConcorsi(filters)
console.log(`Found ${result.concorsi.length} concorsi`)
```

### Pagination
```typescript
// Load more results
if (result.hasMore && result.nextCursor) {
  const moreResults = await concorsiFilterService.loadMoreConcorsi(filters, result.nextCursor)
}
```

### Filter Options
```typescript
// Get available filter options from loaded data
const options = await concorsiFilterService.getAvailableFilterOptions(loadedConcorsi)
console.log('Available regions:', options.locations)
console.log('Available enti:', options.enti)
```

## Filter Parameter Mapping

The service automatically maps UI-friendly filter parameters to API parameters:

| UI Parameter | API Parameter | Description |
|--------------|---------------|-------------|
| `selectedLocations` | `province` | Array of regions (filters on province.regione_nome) |
| `selectedEnti` | `ente` | Single ente (first selected) |
| `selectedSettori` | `settore` | Single settore (first selected) |
| `selectedRegimi` | `regime` | Mapped regime values |
| `selectedStati` | `stato` | Status (aperto/chiuso → open/closed) |
| `selectedDeadlines` | `scadenza` | Deadline filters (today/week/month) |
| `sortBy` | `orderByField` + `orderDirection` | Sorting configuration |

## Error Handling

The system includes comprehensive error handling:

1. **API Failures**: Falls back to legacy client-side filtering
2. **Network Issues**: Shows user-friendly error messages
3. **Invalid Parameters**: Filters out invalid values
4. **Type Mismatches**: Transforms data to match expected interfaces

## Performance Optimizations

### API Call Optimizations
- **Debounced search**: 500ms delay to reduce server load
- **Request deduplication**: Prevents duplicate concurrent requests
- **Cursor pagination**: Efficient pagination without offset calculations
- **Selective field loading**: Only loads necessary fields for list view

### UI Optimizations
- **Loading indicators**: Visual feedback during API calls
- **Disabled inputs**: Prevents multiple simultaneous requests
- **Progressive loading**: Loads 2 pages worth initially for better UX
- **Efficient re-renders**: Minimized React re-renders

## Migration Guide

### From Old System
The old system downloaded all concorsi and filtered client-side:

```typescript
// OLD: Client-side filtering
const allJobs = await fetchAllConcorsi() // ❌ Downloads 10,000+ docs
const filtered = allJobs.filter(job => job.Ente === selectedEnte) // ❌ Client-side filtering
```

### To New System
The new system filters server-side:

```typescript
// NEW: Server-side filtering
const filters = { selectedEnti: [selectedEnte] }
const result = await concorsiFilterService.getFilteredConcorsi(filters) // ✅ Only relevant docs
```

## Backward Compatibility

The system maintains backward compatibility:
- Legacy API endpoints still work
- Fallback mechanisms for API failures
- Same UI components and interfaces
- Gradual migration path

## Future Enhancements

Potential improvements for the future:
- **Multi-ente filtering**: Support multiple enti simultaneously
- **Multi-settore filtering**: Support multiple settori simultaneously
- **Advanced search**: Boolean operators, phrase matching
- **Faceted search**: Show filter counts before applying
- **Search suggestions**: Autocomplete based on API results
- **Caching**: Client-side caching of frequent searches
