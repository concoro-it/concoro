import { Metadata } from 'next';
import { Suspense } from 'react';
import { Concorso } from '@/types/concorso';
import { ConcorsiClientWrapper } from '@/components/concorsi/ConcorsiClientWrapper';
import { LocalitaView } from '@/components/concorsi/LocalitaView';
import { EnteView } from '@/components/concorsi/EnteView';
import { SettoreView } from '@/components/concorsi/SettoreView';
import { Skeleton } from '@/components/ui/skeleton';
import { generateMetadata as generateSEOMetadata, seoConfigs, generateStructuredData } from '@/lib/seo';
import { RelatedConcorsiFooter } from '@/components/concorsi/RelatedConcorsiFooter';
import {
  extractProvince,
  extractRegion,
  groupLocationsByProvince,
  groupLocationsByRegion,
  splitLocationString
} from "@/lib/utils/localita-utils";
import { generateSEOConcorsoUrl } from '@/lib/utils/concorso-urls';
import { RelatedSearches } from '@/components/concorsi/RelatedSearches';
import { Breadcrumbs } from '@/components/concorsi/Breadcrumbs';
import { PaginationHead } from '@/components/concorsi/PaginationHead';

// Helper function to serialize Firestore data for client components
function serializeConcorso(concorso: any): Concorso {
  // Deep clone to avoid modifying original
  const serialized = JSON.parse(JSON.stringify(concorso, (key, value) => {
    // Convert Firestore Timestamps to ISO strings
    if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      return new Date(value.seconds * 1000).toISOString();
    }
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }));

  return serialized as Concorso;
}

function serializeConcorsi(concorsi: any[]): Concorso[] {
  return concorsi.map(serializeConcorso);
}

interface ConcorsiSearchParams {
  page?: string;
  ente?: string;
  localita?: string;
  settore?: string;
  scadenza?: string;
  sort?: string;
  search?: string;
}

interface ConcorsiPageProps {
  searchParams: Promise<ConcorsiSearchParams>;
}

interface ConcorsiData {
  concorsi: Concorso[];
  totalCount: number;
  filters: {
    enti: string[];
    localita: string[];
    settori: string[];
  };
}

interface EnteWithCounts {
  name: string;
  activeCount: number;
  totalCount: number;
}

interface LocalitaData {
  concorsi: Concorso[];
  localita: string;
  totalCount: number;
  totalPositions: number;
  enti: EnteWithCounts[];
  relatedProvinces: string[];
  relatedRegions: string[];
}

interface EnteData {
  concorsi: Concorso[];
  ente: string;
  totalCount: number;
  totalPositions: number;
  locations: string[];
  settori: string[];
}

interface SettoreData {
  concorsi: Concorso[];
  settore: string;
  totalCount: number;
  totalPositions: number;
  locations: string[];
  enti: string[];
}

// Server-side data fetching for locality-specific view
async function getLocalitaData(localita: string): Promise<LocalitaData> {
  try {
    // Build query parameters for the API
    const params = new URLSearchParams();
    params.set('localita', localita);
    params.set('limit', '100'); // Reduced to prevent 2MB cache limit

    // Use relative URL for production, absolute for development
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it'
      : 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/public/concorsi?${params.toString()}`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 7200 } // 2 hours revalidation
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const apiData = await response.json();
    const concorsiData = apiData.concorsi || [];

    // Use filter data from API which represents ALL results, not just current page
    const filters = apiData.filters || { enti: [], localita: [], settori: [] };

    // Calculate total positions from current page (for display purposes only)
    const totalPositions = concorsiData.reduce((total: number, concorso: any) =>
      total + (concorso.numero_di_posti || 1), 0
    );

    // Calculate statistics
    const totalCount = apiData.pagination?.total || concorsiData.length;

    // Extract unique enti with counts from API filters
    const enti = (filters.enti || []).map((enteName: string) => ({
      name: enteName,
      activeCount: 1, // API filters show enti with active concorsi
      totalCount: 1
    })).sort((a: any, b: any) => b.activeCount - a.activeCount || a.name.localeCompare(b.name));

    // Get all locations for finding related provinces and regions
    const allLocations = filters.localita || [];

    const currentProvince = extractProvince(localita);
    const currentRegion = extractRegion(localita);
    const groupedLocationsByProv = groupLocationsByProvince(allLocations);
    const groupedLocationsByReg = groupLocationsByRegion(allLocations);

    // Get related provinces (same province or nearby)
    const relatedProvincesList = currentProvince
      ? Array.from(new Set(Object.keys(groupedLocationsByProv)
        .filter(province =>
          province !== 'Altre' &&
          (province === currentProvince ||
            province.toLowerCase().includes(currentProvince.toLowerCase()) ||
            currentProvince.toLowerCase().includes(province.toLowerCase()))
        )))
      : [];

    // Get related regions (same region or nearby)
    const relatedRegionsList = currentRegion
      ? Array.from(new Set(Object.keys(groupedLocationsByReg)
        .filter(region =>
          region !== 'Altre' &&
          region !== currentRegion &&
          (region.toLowerCase().includes(currentRegion.toLowerCase()) ||
            currentRegion.toLowerCase().includes(region.toLowerCase()))
        )))
      : [];

    return {
      concorsi: concorsiData,
      localita,
      totalCount,
      totalPositions,
      enti,
      relatedProvinces: relatedProvincesList,
      relatedRegions: relatedRegionsList,
    };
  } catch (error) {
    console.error('Error fetching località data:', error);
    return {
      concorsi: [],
      localita,
      totalCount: 0,
      totalPositions: 0,
      enti: [],
      relatedProvinces: [],
      relatedRegions: [],
    };
  }
}

// Server-side data fetching for ente-specific view
async function getEnteData(ente: string): Promise<EnteData> {
  try {
    // Build query parameters for the API
    const params = new URLSearchParams();
    params.set('ente', ente);
    params.set('limit', '100'); // Reduced to prevent 2MB cache limit

    // Use relative URL for production, absolute for development
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it'
      : 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/public/concorsi?${params.toString()}`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 7200 } // 2 hours revalidation
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const apiData = await response.json();
    const concorsiData = apiData.concorsi || [];

    // Use filter data from API which represents ALL results, not just current page
    const filters = apiData.filters || { enti: [], localita: [], settori: [] };

    // Calculate total positions from current page (for display purposes only)
    const totalPositions = concorsiData.reduce((total: number, concorso: any) =>
      total + (concorso.numero_di_posti || 1), 0
    );

    // Calculate statistics
    const totalCount = apiData.pagination?.total || concorsiData.length;

    // Extract unique locations from API filters (these represent ALL results, not just current page)
    const uniqueLocations = Array.from(new Set(
      (filters.localita || []) as string[]
    )).sort();

    const uniqueSettori = Array.from(new Set(
      (filters.settori || []) as string[]
    )).sort();

    return {
      concorsi: concorsiData,
      ente,
      totalCount,
      totalPositions,
      locations: uniqueLocations,
      settori: uniqueSettori,
    };
  } catch (error) {
    console.error('Error fetching ente data:', error);
    return {
      concorsi: [],
      ente,
      totalCount: 0,
      totalPositions: 0,
      locations: [],
      settori: [],
    };
  }
}

// Server-side data fetching for settore-specific view
async function getSettoreData(settore: string): Promise<SettoreData> {
  try {
    // Build query parameters for the API
    const params = new URLSearchParams();
    params.set('settore', settore);
    params.set('limit', '100'); // Reduced to prevent 2MB cache limit

    // Use relative URL for production, absolute for development
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it'
      : 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/public/concorsi?${params.toString()}`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 7200 } // 2 hours revalidation
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const apiData = await response.json();
    const concorsiData = apiData.concorsi || [];

    // Use filter data from API which represents ALL results, not just current page
    const filters = apiData.filters || { enti: [], localita: [], settori: [] };

    // Calculate total positions from current page (for display purposes only)
    const totalPositions = concorsiData.reduce((total: number, concorso: any) =>
      total + (concorso.numero_di_posti || 1), 0
    );

    // Calculate statistics
    const totalCount = apiData.pagination?.total || concorsiData.length;

    // Extract unique locations from API filters (these represent ALL results, not just current page)
    const uniqueLocations = Array.from(new Set(
      (filters.localita || []) as string[]
    )).sort();

    const uniqueEnti = Array.from(new Set(
      (filters.enti || []) as string[]
    )).sort();

    return {
      concorsi: concorsiData,
      settore,
      totalCount,
      totalPositions,
      locations: uniqueLocations,
      enti: uniqueEnti,
    };
  } catch (error) {
    console.error('Error fetching settore data:', error);
    return {
      concorsi: [],
      settore,
      totalCount: 0,
      totalPositions: 0,
      locations: [],
      enti: [],
    };
  }
}

// Server-side data fetching using the API endpoint
async function getConcorsiData(searchParams: ConcorsiSearchParams): Promise<ConcorsiData & {
  totalPositions: number;
  uniqueEntiCount: number;
  uniqueLocalitaCount: number;
}> {
  try {
    // Build query parameters for the API
    const params = new URLSearchParams();
    if (searchParams.page) params.set('page', searchParams.page);
    if (searchParams.ente) params.set('ente', searchParams.ente);
    if (searchParams.localita) params.set('localita', searchParams.localita);
    if (searchParams.settore) params.set('settore', searchParams.settore);
    if (searchParams.scadenza) params.set('scadenza', searchParams.scadenza);
    if (searchParams.sort) params.set('sort', searchParams.sort);
    if (searchParams.search) params.set('search', searchParams.search);
    params.set('limit', '100'); // Reduced to prevent 2MB cache limit

    // Use relative URL for production, absolute for development
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it'
      : 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/public/concorsi?${params.toString()}`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 7200 } // 2 hours revalidation
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const apiData = await response.json();
    const concorsiData = apiData.concorsi || [];

    // Use filter data from API which represents ALL results, not just current page
    const filters = apiData.filters || { enti: [], localita: [], settori: [] };

    // Calculate total positions from current page (for display purposes only)
    const totalPositions = concorsiData.reduce((total: number, concorso: any) =>
      total + (concorso.numero_di_posti || 1), 0
    );

    // Split localita properly since API returns combined strings like "Roma, Lazio"
    const uniqueLocalita = new Set(
      filters.localita.flatMap((loc: string) => splitLocationString(loc))
    );

    return {
      concorsi: concorsiData,
      totalCount: apiData.pagination?.total || 0,
      filters: {
        enti: filters.enti,
        localita: filters.localita,
        settori: filters.settori,
      },
      totalPositions,
      // Use filter counts which represent ALL results across all pages
      uniqueEntiCount: filters.enti?.length || 0,
      uniqueLocalitaCount: uniqueLocalita.size, // Use split and deduplicated count
    };
  } catch (error) {
    console.error('Error fetching concorsi data:', error);
    return {
      concorsi: [],
      totalCount: 0,
      filters: {
        enti: [],
        localita: [],
        settori: [],
      },
      totalPositions: 0,
      uniqueEntiCount: 0,
      uniqueLocalitaCount: 0,
    };
  }
}

// Metadata generation
export async function generateMetadata({ searchParams }: ConcorsiPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const hasFilters = resolvedSearchParams.ente || resolvedSearchParams.localita || resolvedSearchParams.settore || resolvedSearchParams.scadenza || resolvedSearchParams.sort;
  const currentPage = parseInt(resolvedSearchParams.page || '1');

  let seoConfig;

  if (resolvedSearchParams.search) {
    const searchTerm = decodeURIComponent(resolvedSearchParams.search);
    seoConfig = seoConfigs.concorsiBySearch(searchTerm);
  } else if (resolvedSearchParams.ente) {
    const ente = decodeURIComponent(resolvedSearchParams.ente);
    seoConfig = seoConfigs.concorsiByOrganization(ente);
  } else if (resolvedSearchParams.localita) {
    const localita = decodeURIComponent(resolvedSearchParams.localita);
    seoConfig = seoConfigs.concorsiByLocation(localita);
  } else if (resolvedSearchParams.settore) {
    const settore = decodeURIComponent(resolvedSearchParams.settore);
    seoConfig = seoConfigs.concorsiBySector(settore);
  } else {
    seoConfig = seoConfigs.concorsi;
  }

  const metadata = generateSEOMetadata(seoConfig);

  // Build canonical URL
  const baseUrl = 'https://concoro.it/concorsi';
  const params = new URLSearchParams();

  // Add filter parameters (but not page for canonical)
  if (resolvedSearchParams.ente) params.set('ente', resolvedSearchParams.ente);
  if (resolvedSearchParams.localita) params.set('localita', resolvedSearchParams.localita);
  if (resolvedSearchParams.settore) params.set('settore', resolvedSearchParams.settore);
  if (resolvedSearchParams.scadenza) params.set('scadenza', resolvedSearchParams.scadenza);
  if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
  if (resolvedSearchParams.search) params.set('search', resolvedSearchParams.search);

  const queryString = params.toString();
  const canonicalUrl = currentPage === 1
    ? `${baseUrl}${queryString ? `?${queryString}` : ''}`
    : `${baseUrl}?${queryString ? `${queryString}&` : ''}page=${currentPage}`;

  // Fetch data to determine total pages for pagination links
  const data = await getConcorsiData(resolvedSearchParams);
  const totalPages = Math.ceil(data.totalCount / 20);

  // Build prev/next URLs for pagination
  const baseWithParams = queryString ? `${baseUrl}?${queryString}` : baseUrl;
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  // Add canonical URL to metadata
  // Note: rel="prev/next" are added via PaginationHead component in the page
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      canonical: canonicalUrl,
    },
  };
}


// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 7200; // Revalidate every 2 hours

export default async function ConcorsiPage({ searchParams }: ConcorsiPageProps) {
  const resolvedSearchParams = await searchParams;
  // Check if we should render the locality-specific view
  const shouldRenderLocalitaView = resolvedSearchParams.localita && !resolvedSearchParams.ente && !resolvedSearchParams.settore && !resolvedSearchParams.search;

  if (shouldRenderLocalitaView && resolvedSearchParams.localita) {
    const localita = decodeURIComponent(resolvedSearchParams.localita);
    const localitaData = await getLocalitaData(localita);

    return (
      <>
        <LocalitaView
          key={`localita-${localita}`}
          localita={localitaData.localita}
          concorsi={localitaData.concorsi}
          totalCount={localitaData.totalCount}
          totalPositions={localitaData.totalPositions}
          enti={localitaData.enti}
          relatedProvinces={localitaData.relatedProvinces}
          relatedRegions={localitaData.relatedRegions}
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": `Concorsi Pubblici a ${localita}`,
              "description": `Trova e candidati ai concorsi pubblici nella zona di ${localita}`,
              "url": `https://concoro.it/concorsi?localita=${encodeURIComponent(localita)}`,
              "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": localitaData.totalCount,
                "itemListElement": localitaData.concorsi.slice(0, 10).map((concorso, index) => ({
                  "@type": "JobPosting",
                  "position": index + 1,
                  "title": concorso.Titolo,
                  "description": concorso.Descrizione?.substring(0, 200) + "...",
                  "hiringOrganization": {
                    "@type": "Organization",
                    "name": concorso.Ente
                  },
                  "jobLocation": {
                    "@type": "Place",
                    "address": concorso.AreaGeografica
                  },
                  "datePosted": (() => {
                    const pubDate = concorso.publication_date;
                    if (pubDate && typeof pubDate === 'string') {
                      try {
                        return new Date(pubDate).toISOString();
                      } catch {
                        return new Date().toISOString();
                      }
                    }
                    return new Date().toISOString();
                  })(),
                  "url": `https://concoro.it/concorsi/${concorso.id}`
                }))
              }
            })
          }}
        />
      </>
    );
  }

  // Check if we should render the ente-specific view
  const shouldRenderEnteView = resolvedSearchParams.ente && !resolvedSearchParams.localita && !resolvedSearchParams.settore && !resolvedSearchParams.search;

  if (shouldRenderEnteView && resolvedSearchParams.ente) {
    const ente = decodeURIComponent(resolvedSearchParams.ente);
    const enteData = await getEnteData(ente);

    return (
      <>
        <EnteView
          ente={enteData.ente}
          concorsi={enteData.concorsi}
          totalCount={enteData.totalCount}
          totalPositions={enteData.totalPositions}
          locations={enteData.locations}
          settori={enteData.settori}
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": `Concorsi Pubblici ${ente}`,
              "description": `Trova e candidati ai concorsi pubblici di ${ente}`,
              "url": `https://concoro.it/concorsi?ente=${encodeURIComponent(ente)}`,
              "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": enteData.totalCount,
                "itemListElement": enteData.concorsi.slice(0, 10).map((concorso, index) => ({
                  "@type": "JobPosting",
                  "position": index + 1,
                  "title": concorso.Titolo,
                  "description": concorso.Descrizione?.substring(0, 200) + "...",
                  "hiringOrganization": {
                    "@type": "Organization",
                    "name": concorso.Ente
                  },
                  "jobLocation": {
                    "@type": "Place",
                    "address": concorso.AreaGeografica
                  },
                  "datePosted": (() => {
                    const pubDate = concorso.publication_date;
                    if (pubDate && typeof pubDate === 'string') {
                      try {
                        return new Date(pubDate).toISOString();
                      } catch {
                        return new Date().toISOString();
                      }
                    }
                    return new Date().toISOString();
                  })(),
                  "url": `https://concoro.it/concorsi/${concorso.id}`
                }))
              }
            })
          }}
        />
      </>
    );
  }

  // Check if we should render the settore-specific view
  const shouldRenderSettoreView = resolvedSearchParams.settore && !resolvedSearchParams.localita && !resolvedSearchParams.ente && !resolvedSearchParams.search;

  if (shouldRenderSettoreView && resolvedSearchParams.settore) {
    const settore = decodeURIComponent(resolvedSearchParams.settore);
    const settoreData = await getSettoreData(settore);

    return (
      <>
        <SettoreView
          settore={settoreData.settore}
          concorsi={settoreData.concorsi}
          totalCount={settoreData.totalCount}
          totalPositions={settoreData.totalPositions}
          locations={settoreData.locations}
          enti={settoreData.enti}
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": `Concorsi Pubblici - ${settore}`,
              "description": `Trova e candidati ai concorsi pubblici nel settore ${settore}`,
              "url": `https://concoro.it/concorsi?settore=${encodeURIComponent(settore)}`,
              "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": settoreData.totalCount,
                "itemListElement": settoreData.concorsi.slice(0, 10).map((concorso, index) => ({
                  "@type": "JobPosting",
                  "position": index + 1,
                  "title": concorso.Titolo,
                  "description": concorso.Descrizione?.substring(0, 200) + "...",
                  "hiringOrganization": {
                    "@type": "Organization",
                    "name": concorso.Ente
                  },
                  "jobLocation": {
                    "@type": "Place",
                    "address": concorso.AreaGeografica
                  },
                  "datePosted": (() => {
                    const pubDate = concorso.publication_date;
                    if (pubDate && typeof pubDate === 'string') {
                      try {
                        return new Date(pubDate).toISOString();
                      } catch {
                        return new Date().toISOString();
                      }
                    }
                    return new Date().toISOString();
                  })(),
                  "url": `https://concoro.it/concorsi/${concorso.id}`
                }))
              }
            })
          }}
        />
      </>
    );
  }

  // Default view - fetch data via API
  const data = await getConcorsiData(resolvedSearchParams);
  const currentPage = parseInt(resolvedSearchParams.page || '1');
  const totalPages = Math.ceil(data.totalCount / 20);

  // Build pagination URLs for link tags
  const baseUrl = 'https://concoro.it/concorsi';
  const params = new URLSearchParams();
  if (resolvedSearchParams.ente) params.set('ente', resolvedSearchParams.ente);
  if (resolvedSearchParams.localita) params.set('localita', resolvedSearchParams.localita);
  if (resolvedSearchParams.settore) params.set('settore', resolvedSearchParams.settore);
  if (resolvedSearchParams.scadenza) params.set('scadenza', resolvedSearchParams.scadenza);
  if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
  if (resolvedSearchParams.search) params.set('search', resolvedSearchParams.search);

  const queryString = params.toString();
  const baseWithParams = queryString ? `${baseUrl}?${queryString}` : baseUrl;
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const prevUrl = prevPage === 1
    ? baseWithParams
    : prevPage
      ? `${baseWithParams}${queryString ? '&' : '?'}page=${prevPage}`
      : null;

  const nextUrl = nextPage
    ? `${baseWithParams}${queryString ? '&' : '?'}page=${nextPage}`
    : null;

  return (
    <>
      {/* Pagination SEO - Add prev/next link tags */}
      <PaginationHead prevUrl={prevUrl} nextUrl={nextUrl} />

      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 pt-8">
          {/* Breadcrumbs */}
          {resolvedSearchParams.search && (
            <Breadcrumbs
              items={[
                { label: 'Concorsi', href: '/concorsi' },
                { label: `Concorsi ${decodeURIComponent(resolvedSearchParams.search)}`, href: `/concorsi?search=${resolvedSearchParams.search}` }
              ]}
            />
          )}

          {/* Main Content */}
          <ConcorsiClientWrapper
            initialData={data}
            currentFilters={resolvedSearchParams}
            currentPage={currentPage}
            totalPages={totalPages}
          />

          {/* Related Searches for SEO */}
          {resolvedSearchParams.search && (
            <div className="container mx-auto px-4">
              <RelatedSearches
                searchTerm={decodeURIComponent(resolvedSearchParams.search)}
                totalCount={data.totalCount}
              />
            </div>
          )}
        </main>

        {/* Breadcrumb Structured Data */}
        {resolvedSearchParams.search && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://concoro.it"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Concorsi Pubblici",
                    "item": "https://concoro.it/concorsi"
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": `Concorsi ${decodeURIComponent(resolvedSearchParams.search)}`,
                    "item": `https://concoro.it/concorsi?search=${encodeURIComponent(resolvedSearchParams.search)}`
                  }
                ]
              })
            }}
          />
        )}

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": resolvedSearchParams.search
                ? `Concorsi Pubblici ${decodeURIComponent(resolvedSearchParams.search)} 2026`
                : "Concorsi Pubblici 2026",
              "description": resolvedSearchParams.search
                ? `Cerca concorsi pubblici per ${decodeURIComponent(resolvedSearchParams.search)}. Scopri tutte le opportunità disponibili nella pubblica amministrazione italiana.`
                : "Trova e candidati ai migliori concorsi pubblici in Italia",
              "url": resolvedSearchParams.search
                ? `https://concoro.it/concorsi?search=${encodeURIComponent(resolvedSearchParams.search)}`
                : "https://concoro.it/concorsi",
              "keywords": resolvedSearchParams.search
                ? `concorsi ${decodeURIComponent(resolvedSearchParams.search)}, lavoro ${decodeURIComponent(resolvedSearchParams.search)}, bandi ${decodeURIComponent(resolvedSearchParams.search)}, concorsi pubblici 2026`
                : "concorsi pubblici, lavoro pubblico, bandi concorsi, concorsi 2026",
              "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": data.totalCount,
                "itemListElement": data.concorsi.slice(0, 10).map((concorso, index) => ({
                  "@type": "JobPosting",
                  "position": index + 1,
                  "title": concorso.Titolo,
                  "description": concorso.Descrizione?.substring(0, 200) + "...",
                  "hiringOrganization": {
                    "@type": "Organization",
                    "name": concorso.Ente
                  },
                  "jobLocation": {
                    "@type": "Place",
                    "address": concorso.AreaGeografica
                  },
                  "datePosted": (() => {
                    const pubDate = concorso.publication_date;
                    if (pubDate && typeof pubDate === 'string') {
                      try {
                        return new Date(pubDate).toISOString();
                      } catch {
                        return new Date().toISOString();
                      }
                    }
                    return new Date().toISOString();
                  })(),
                  "url": `https://concoro.it${generateSEOConcorsoUrl(concorso)}`
                }))
              }
            })
          }}
        />

        {/* Additional Structured Data - SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://concoro.it",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://concoro.it/concorsi?search={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />

        {/* FAQPage Structured Data for Search Pages */}
        {resolvedSearchParams.search && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": `Come candidarsi ai concorsi ${decodeURIComponent(resolvedSearchParams.search)}?`,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": `Per candidarsi ai concorsi ${decodeURIComponent(resolvedSearchParams.search)}, è necessario visitare il portale INPA o il sito dell'ente che bandisce il concorso. Su Concoro puoi trovare tutti i link diretti per candidarti facilmente.`
                    }
                  },
                  {
                    "@type": "Question",
                    "name": `Quali sono i requisiti per i concorsi ${decodeURIComponent(resolvedSearchParams.search)}?`,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": `I requisiti variano per ogni concorso ${decodeURIComponent(resolvedSearchParams.search)}. Generalmente includono cittadinanza italiana o UE, età minima e massima, titolo di studio richiesto e eventuali abilitazioni professionali. Consulta ogni singolo bando per i requisiti specifici.`
                    }
                  },
                  {
                    "@type": "Question",
                    "name": `Quanto dura un concorso pubblico per ${decodeURIComponent(resolvedSearchParams.search)}?`,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": `La durata di un concorso pubblico per ${decodeURIComponent(resolvedSearchParams.search)} varia da alcuni mesi a oltre un anno, includendo presentazione domanda, prove scritte, prove orali e formazione della graduatoria finale.`
                    }
                  }
                ]
              })
            }}
          />
        )}
      </div>

      {/* Related Concorsi Footer */}
      <RelatedConcorsiFooter />
    </>
  );
}

