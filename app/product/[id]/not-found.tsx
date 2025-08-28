import Link from "next/link"
import Header from "@/components/header"

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Link href="/" className="text-green-500 hover:text-green-600 font-medium">
          Return to Home
        </Link>
      </div>
    </div>
  )
} 