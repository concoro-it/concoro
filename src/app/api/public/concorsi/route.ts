import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreForSEO } from '@/lib/firebase-admin';
import { Concorso } from '@/types/concorso';
import { apiCache } from '@/lib/cache';
import { preserveDateFormat, serializeDate } from '@/lib/utils/concorsi-utils';
import { getDeadlineCountdown } from '@/lib/utils/date-utils';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// Helper function to serialize Firestore data
function serializeFirestoreData(data: any): any {
  if (!data) return data;
  
  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Use the preserveDateFormat utility for consistent date handling
    if (key === 'DataChiusura' || key === 'publication_date' || key === 'DataApertura') {
      return preserveDateFormat(value);
    }
    
    // Convert Firestore Timestamps to objects with seconds/nanoseconds
    if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
      return {
        seconds: value._seconds,
        nanoseconds: value._nanoseconds
      };
    }
    return value;
  }));
}

interface ConcorsiQuery {
  page?: number;
  limit?: number;
  ente?: string;
  localita?: string;
  settore?: string;
  stato?: string;
  scadenza?: string;
  sort?: string;
  search?: string;
}

interface ConcorsiResponse {
  concorsi: Concorso[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    enti: string[];
    localita: string[];
    settori: string[];
  };
}

export async function GET(request: NextRequest) {
  try {
    
    const searchParams = request.nextUrl.searchParams;
    
    
    // Parse query parameters
    const query: ConcorsiQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100 per page to prevent 2MB cache limit
      ente: searchParams.get('ente') || undefined,
      localita: searchParams.get('localita') || undefined,
      settore: searchParams.get('settore') || undefined,
      stato: searchParams.get('stato') || 'open', // Default to open concorsi
      scadenza: searchParams.get('scadenza') || undefined,
      sort: searchParams.get('sort') || 'publication-desc', // Default sorting
      search: searchParams.get('search') || undefined,
    };

    

    // Check cache first
    const cacheKey = { ...query };
    const cachedData = apiCache.getConcorsi(cacheKey);
    if (cachedData) {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800, max-age=300',
        'CDN-Cache-Control': 'public, s-maxage=1800',
        'Vary': 'Accept-Encoding',
        'X-Cache': 'HIT',
      });
      return new NextResponse(JSON.stringify(cachedData), { headers });
    }

    
    const db = getFirestoreForSEO();
    const concorsiCollection = db.collection('concorsi');
    
    
    // Build optimized query - avoid orderBy to prevent index issues
    let firestoreQuery = concorsiCollection
      .where('Stato', 'in', ['open', 'aperto', 'OPEN', 'APERTO'])
      .limit(2000); // Reasonable limit to prevent memory issues
    
    // Apply filters that can be done at database level
    if (query.ente) {
      firestoreQuery = firestoreQuery.where('Ente', '==', decodeURIComponent(query.ente));
    }

    if (query.settore) {
      firestoreQuery = firestoreQuery.where('settore_professionale', '==', decodeURIComponent(query.settore));
    }

    // Execute query
    
    const snapshot = await firestoreQuery.get();
    
    
    let concorsi = snapshot.docs.map(doc => serializeFirestoreData({
      id: doc.id,
      ...doc.data()
    })) as Concorso[];

    // Apply client-side filters for complex queries
    if (query.localita) {
      const localitaFilter = decodeURIComponent(query.localita).toLowerCase().trim();
      concorsi = concorsi.filter(concorso => {
        if (!concorso.AreaGeografica) return false;
        
        const areaGeografica = concorso.AreaGeografica.toLowerCase();
        
        // Split by comma to get individual locations/regions
        const locations = areaGeografica.split(',').map(loc => loc.trim());
        
        // Check if any location starts with or equals the filter
        return locations.some(location => 
          location === localitaFilter || 
          location.startsWith(localitaFilter + ' ') ||
          location.startsWith(localitaFilter + ',')
        );
      });
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      concorsi = concorsi.filter(concorso => 
        concorso.Titolo?.toLowerCase().includes(searchTerm) ||
        concorso.Descrizione?.toLowerCase().includes(searchTerm) ||
        concorso.Ente?.toLowerCase().includes(searchTerm)
      );
    }

    // Helper function to convert Firestore Timestamp to Date
    const toDate = (value: any): Date | null => {
      if (!value) return null;
      
      try {
        if (typeof value === 'string') {
          return new Date(value);
        }
        
        if (typeof value === 'object') {
          // Handle Firestore timestamp objects
          if ('seconds' in value && typeof value.seconds === 'number') {
            return new Date(value.seconds * 1000);
          }
          if ('_seconds' in value && typeof value._seconds === 'number') {
            return new Date(value._seconds * 1000);
          }
        }
        
        if (value instanceof Date) {
          return value;
        }
        
        return null;
      } catch (error) {
        console.error('Error converting to date:', error, value);
        return null;
      }
    };

    // Apply deadline filter (scadenza)
    if (query.scadenza) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      concorsi = concorsi.filter(concorso => {
        if (!concorso.DataChiusura) return false;
        
        const deadline = toDate(concorso.DataChiusura);
        if (!deadline) return false;
        
        switch (query.scadenza) {
          case 'today':
            const endOfDay = new Date(startOfDay);
            endOfDay.setDate(endOfDay.getDate() + 1);
            return deadline >= startOfDay && deadline < endOfDay;
          
          case 'week':
            const startOfWeek = new Date(startOfDay);
            const dayOfWeek = startOfDay.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
            startOfWeek.setDate(startOfWeek.getDate() + diff);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);
            return deadline >= startOfWeek && deadline < endOfWeek;
          
          case 'month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return deadline >= startOfMonth && deadline < endOfMonth;
          
          default:
            return true;
        }
      });
    }

    // Apply sorting
    concorsi.sort((a, b) => {
      switch (query.sort) {
        case 'deadline-asc':
          // Sort by deadline (closest first)
          const aDeadlineDate = toDate(a.DataChiusura);
          const bDeadlineDate = toDate(b.DataChiusura);
          const aDeadline = aDeadlineDate ? aDeadlineDate.getTime() : Number.MAX_VALUE;
          const bDeadline = bDeadlineDate ? bDeadlineDate.getTime() : Number.MAX_VALUE;
          return aDeadline - bDeadline;
        
        case 'posts-desc':
          // Sort by number of posts (descending)
          return (b.numero_di_posti || 0) - (a.numero_di_posti || 0);
        
        case 'publication-desc':
        default:
          // Sort by publication date (most recent first)
          const getTimestamp = (concorso: Concorso) => {
            if (concorso.publication_date) {
              const date = toDate(concorso.publication_date);
              return date ? date.getTime() : 0;
            }
            return 0;
          };
          return getTimestamp(b) - getTimestamp(a);
      }
    });

    // Calculate pagination
    const total = concorsi.length;
    const totalPages = Math.ceil(total / query.limit!);
    const startIndex = (query.page! - 1) * query.limit!;
    const endIndex = startIndex + query.limit!;
    const paginatedConcorsi = concorsi.slice(startIndex, endIndex);

    // Extract filter options from all results (before pagination)
    const enti = Array.from(new Set(concorsi.map(c => c.Ente).filter((ente): ente is string => Boolean(ente)))).sort();
    const localita = Array.from(new Set(
      concorsi.map(c => c.AreaGeografica).filter((loc): loc is string => Boolean(loc))
    )).sort();
    const settori = Array.from(new Set(
      concorsi.map(c => c.settore_professionale).filter((settore): settore is string => Boolean(settore))
    )).sort();

    const response: ConcorsiResponse = {
      concorsi: paginatedConcorsi,
      pagination: {
        page: query.page!,
        limit: query.limit!,
        total,
        totalPages,
        hasNext: query.page! < totalPages,
        hasPrev: query.page! > 1,
      },
      filters: {
        enti,
        localita,
        settori,
      },
    };

    // Cache the response
    apiCache.setConcorsi(cacheKey, response, 300); // 5 minutes cache

    // Set optimized cache headers for better performance
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800, max-age=300', // 10min cache, 30min stale
      'CDN-Cache-Control': 'public, s-maxage=1800', // Longer CDN cache
      'Vary': 'Accept-Encoding',
      'X-Cache': 'MISS',
    });

    return new NextResponse(JSON.stringify(response), { headers });
    
  } catch (error) {
    console.error('Error fetching public concorsi:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch concorsi',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60'
    }
  });
}
