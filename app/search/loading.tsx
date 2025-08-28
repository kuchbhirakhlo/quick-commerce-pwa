import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Skeleton className="h-8 w-64 mb-6" />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array(10).fill(0).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg bg-white flex flex-col h-full">
            <Skeleton className="h-32 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-4" />
            <div className="flex justify-between items-center mt-auto">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-9 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 