"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAllCategories } from "@/lib/firebase/firestore"
import { Loader2 } from "lucide-react"
import Header from "@/components/header"

// Define Category interface
interface Category {
  id: string;
  name: string;
  icon?: string;
}

// Function to convert category name to URL-friendly slug
function createSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function CategoryRedirectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const redirectToFirstCategory = async () => {
      try {
        const categories = await getAllCategories() as Category[];
        if (categories && categories.length > 0) {
          const firstCategory = categories[0];
          // Create a slug with category name and ID
          const slug = `${createSlug(firstCategory.name)}-${firstCategory.id}`;
          // Redirect to the first category with the proper slug
          router.push(`/category/${slug}`)
        } else {
          // If no categories, stay on this page but stop loading
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        setIsLoading(false)
      }
    }
    
    redirectToFirstCategory()
  }, [router])
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-12 flex flex-col items-center justify-center">
        {isLoading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
            <p className="text-gray-600">Loading categories...</p>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Categories Found</h1>
            <p className="text-gray-600">Please check back later.</p>
          </div>
        )}
      </div>
    </main>
  )
} 