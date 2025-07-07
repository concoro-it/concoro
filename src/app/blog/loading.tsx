import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function BlogLoading() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-8">
      <div className="h-8 bg-gray-200 rounded w-1/6 mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-gray-200 rounded"></div>
            </CardContent>
            <CardFooter>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 