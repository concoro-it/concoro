'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Filter, Calendar, MapPin, Building, Tag } from 'lucide-react'

interface BandiResponse {
  data: any[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  filters_applied: Record<string, any>
}

export default function TestBandiApiPage() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<BandiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [keyword, setKeyword] = useState('')
  const [categoria, setCategoria] = useState('')
  const [settore, setSettore] = useState('')
  const [areaGeografica, setAreaGeografica] = useState('')
  const [regione, setRegione] = useState('')
  const [stato, setStato] = useState<'attivo' | 'scaduto'>('attivo')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState<'deadline_asc' | 'deadline_desc' | 'publication_desc'>('publication_desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const buildApiUrl = () => {
    const params = new URLSearchParams()
    
    if (keyword.trim()) params.set('keyword', keyword.trim())
    if (categoria.trim()) params.set('categoria', categoria.trim())
    if (settore.trim()) params.set('settore', settore.trim())
    if (areaGeografica.trim()) params.set('area_geografica', areaGeografica.trim())
    if (regione.trim()) params.set('regione', regione.trim())
    if (stato) params.set('stato', stato)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (sort) params.set('sort', sort)
    if (page > 1) params.set('page', page.toString())
    if (perPage !== 20) params.set('per_page', perPage.toString())
    
    return `/api/bandi?${params.toString()}`
  }

  const testApi = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const url = buildApiUrl()
      console.log('🔍 Testing API URL:', url)
      
      const startTime = performance.now()
      const res = await fetch(url)
      const endTime = performance.now()
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setResponse(data)
      console.log(`✅ API Response received in ${(endTime - startTime).toFixed(0)}ms:`, data)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ API Test Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setKeyword('')
    setCategoria('')
    setSettore('')
    setAreaGeografica('')
    setRegione('')
    setStato('attivo')
    setDateFrom('')
    setDateTo('')
    setSort('publication_desc')
    setPage(1)
    setPerPage(10)
    setResponse(null)
    setError(null)
  }

  const quickTests = [
    {
      name: 'Basic Query',
      action: () => {
        clearFilters()
        setPerPage(5)
        setTimeout(testApi, 100)
      }
    },
    {
      name: 'Keyword Search',
      action: () => {
        clearFilters()
        setKeyword('polizia')
        setPerPage(3)
        setTimeout(testApi, 100)
      }
    },
    {
      name: 'Region Filter',
      action: () => {
        clearFilters()
        setRegione('Lombardia')
        setPerPage(3)
        setTimeout(testApi, 100)
      }
    },
    {
      name: 'Deadline Sort',
      action: () => {
        clearFilters()
        setSort('deadline_asc')
        setPerPage(3)
        setTimeout(testApi, 100)
      }
    },
    {
      name: 'Expired Jobs',
      action: () => {
        clearFilters()
        setStato('scaduto')
        setPerPage(3)
        setTimeout(testApi, 100)
      }
    }
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Bandi API Test Page</h1>
        <p className="text-muted-foreground">
          Test the new unified <code className="bg-muted px-2 py-1 rounded">/api/bandi</code> endpoint with all query parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filters Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              API Parameters
            </CardTitle>
            <CardDescription>
              Configure the query parameters for the /api/bandi endpoint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Text Filters */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="keyword">Keyword (searches Titolo, Descrizione, sommario)</Label>
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g., polizia, ingegnere, medico"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Exact match"
                  />
                </div>
                <div>
                  <Label htmlFor="settore">Settore</Label>
                  <Input
                    id="settore"
                    value={settore}
                    onChange={(e) => setSettore(e.target.value)}
                    placeholder="Exact match"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="area-geografica">Area Geografica</Label>
                  <Input
                    id="area-geografica"
                    value={areaGeografica}
                    onChange={(e) => setAreaGeografica(e.target.value)}
                    placeholder="Exact match"
                  />
                </div>
                <div>
                  <Label htmlFor="regione">Regione</Label>
                  <Input
                    id="regione"
                    value={regione}
                    onChange={(e) => setRegione(e.target.value)}
                    placeholder="e.g., Lombardia"
                  />
                </div>
              </div>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="date-from">Date From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">Date To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Select Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Stato</Label>
                <Select value={stato} onValueChange={(value: 'attivo' | 'scaduto') => setStato(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attivo">Attivo</SelectItem>
                    <SelectItem value="scaduto">Scaduto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort</Label>
                <Select value={sort} onValueChange={(value: typeof sort) => setSort(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publication_desc">Publication Desc</SelectItem>
                    <SelectItem value="deadline_asc">Deadline Asc</SelectItem>
                    <SelectItem value="deadline_desc">Deadline Desc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pagination */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="page">Page</Label>
                <Input
                  id="page"
                  type="number"
                  min="1"
                  value={page}
                  onChange={(e) => setPage(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="per-page">Per Page</Label>
                <Input
                  id="per-page"
                  type="number"
                  min="1"
                  max="100"
                  value={perPage}
                  onChange={(e) => setPerPage(parseInt(e.target.value) || 10)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={testApi} disabled={loading} className="flex-1">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Test API
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear
              </Button>
            </div>

            {/* Quick Tests */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">Quick Tests:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {quickTests.map((test) => (
                  <Button
                    key={test.name}
                    onClick={test.action}
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                  >
                    {test.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* API URL Preview */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">API URL:</Label>
              <div className="mt-1 p-2 bg-muted rounded text-sm font-mono break-all">
                {buildApiUrl()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              API Response
            </CardTitle>
            <CardDescription>
              Results from the /api/bandi endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                <p className="text-destructive font-medium">Error:</p>
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {response && (
              <div className="space-y-4">
                {/* Pagination Info */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="secondary">
                      Page {response.pagination.page} of {response.pagination.total_pages}
                    </Badge>
                    <span className="text-muted-foreground">
                      {response.pagination.total} total results
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!response.pagination.has_prev || loading}
                      onClick={() => {
                        setPage(page - 1)
                        setTimeout(testApi, 100)
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!response.pagination.has_next || loading}
                      onClick={() => {
                        setPage(page + 1)
                        setTimeout(testApi, 100)
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {response.data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No results found
                    </div>
                  ) : (
                    response.data.map((item, index) => (
                      <Card key={item.id || index} className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm leading-tight">
                            {item.Titolo || 'No Title'}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {item.Ente && (
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {item.Ente}
                              </div>
                            )}
                            {item.AreaGeografica && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.AreaGeografica}
                              </div>
                            )}
                            {item.DataChiusura && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.DataChiusura).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          {item.sommario && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.sommario}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>

                {/* Raw Response Toggle */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    View Raw JSON Response
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {!response && !error && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                Configure filters and click "Test API" to see results
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Testing API...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


