import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <main className="container py-8">
      <div className="h-12 w-64 bg-muted rounded animate-pulse mb-8" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-9 bg-muted rounded animate-pulse" />
          <div className="w-full md:w-64 h-9 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="h-9 bg-muted rounded w-24" />
                <div className="h-9 bg-muted rounded w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
} 