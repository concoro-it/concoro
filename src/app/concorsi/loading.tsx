import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-6 pt-8">
      {/* Search Bar Skeleton */}
      <div className="mb-6">
        <div className="flex gap-3 items-center mb-4">
          <div className="flex-1 h-12 bg-muted rounded animate-pulse" />
          <div className="h-12 w-20 bg-muted rounded animate-pulse" />
          <div className="h-12 w-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
            <div className="space-y-6">
              <div>
                <div className="h-6 w-16 bg-muted rounded animate-pulse mb-3" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-6 w-20 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
              <div>
                <div className="h-6 w-20 bg-muted rounded animate-pulse mb-3" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 w-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
              <div>
                <div className="h-6 w-28 bg-muted rounded animate-pulse mb-3" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 w-18 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="h-8 bg-muted rounded w-20" />
                  <div className="h-8 bg-muted rounded w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
