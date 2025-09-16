import { Suspense } from "react"
import { SearchResults } from "@/components/search-results"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "Search Results | Quick Commerce",
  description: "Search for products in our store",
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = "" } = await searchParams
  const query = q || ""

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Search results for "${query}"` : "Search Results"}
      </h1>

      <Suspense fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
        </div>
      }>
        <SearchResults query={query} />
      </Suspense>
    </div>
  )
} 