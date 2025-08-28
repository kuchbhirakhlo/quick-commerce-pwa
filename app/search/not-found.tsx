import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <h2 className="text-2xl font-bold mb-4">No Results Found</h2>
      <p className="text-gray-600 mb-8">
        We couldn't find any products matching your search. Try a different search term or browse our categories.
      </p>
      <Link
        href="/"
        className="inline-flex items-center text-green-600 hover:text-green-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>
    </div>
  )
} 