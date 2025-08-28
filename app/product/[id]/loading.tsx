import { Skeleton } from "@/components/ui/skeleton"

export default function ProductLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Skeleton className="h-6 w-32" />
      </div>
      
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image Skeleton */}
          <div className="bg-white p-6 rounded-lg border">
            <Skeleton className="aspect-square w-full" />
          </div>
          
          {/* Product Details Skeleton */}
          <div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-6" />
            
            <div className="flex items-center mb-6">
              <Skeleton className="h-7 w-24 mr-3" />
              <Skeleton className="h-5 w-16 mr-2" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            
            <div className="mb-6">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            <div className="mb-6">
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-l" />
                <Skeleton className="h-10 w-12" />
                <Skeleton className="h-10 w-10 rounded-r" />
              </div>
            </div>
            
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
} 