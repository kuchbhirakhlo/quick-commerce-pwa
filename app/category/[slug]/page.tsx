"use client"

import { useState, useEffect } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import ProductGrid from "@/components/product-grid"
import { getAllCategories } from "@/lib/firebase/firestore"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"

interface Category {
  id: string
  name: string
  icon: string
}

// Function to convert category name to URL-friendly slug
function createSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function CategoryPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const slug = params?.slug as string
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryName, setCategoryName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [categoryId, setCategoryId] = useState<string>("")

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const allCategories = await getAllCategories() as Category[];
        setCategories(allCategories);
        
        // Check if slug contains a hyphen (indicating it has category name)
        const slugParts = slug.split('-');
        const potentialId = slugParts[slugParts.length - 1];
        
        // Find the category either by ID at the end of the slug or by full ID
        const currentCategory = allCategories.find(cat => 
          cat.id === potentialId || cat.id === slug
        );
        
        if (currentCategory) {
          setCategoryName(currentCategory.name);
          setCategoryId(currentCategory.id);
          
          // Update the document title with the category name
          document.title = `${currentCategory.name} - Buzzat Delivery`;
          
          // If the URL doesn't contain the category name, redirect to the proper URL
          const expectedSlug = `${createSlug(currentCategory.name)}-${currentCategory.id}`;
          if (slug !== expectedSlug && !pathname?.includes(expectedSlug)) {
            router.replace(`/category/${expectedSlug}`, { scroll: false });
          }
        }
        
        // Log to debug
        console.log("Category loaded:", { slug, categoryName: currentCategory?.name, categoriesCount: allCategories.length })
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCategories()
  }, [slug, pathname, router])

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-12 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
        </div>
      </>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">{categoryName || slug}</h1>
        
        {/* Horizontal Category Scroller */}
        <div className="mb-6 overflow-x-auto pb-2 md:hidden block hide-scrollbar">
          <div className="flex space-x-4">
            {categories.map((category) => {
              const categorySlug = `${createSlug(category.name)}-${category.id}`;
              return (
                <Link
                  key={category.id}
                  href={`/category/${categorySlug}`}
                  className="flex flex-col items-center min-w-[80px]"
                >
                  <div className={`relative w-16 h-16 mb-2 rounded-full overflow-hidden flex-shrink-0 ${
                    category.id === categoryId ? 'border-2 border-emerald-500' : 'border border-gray-200'
                  }`}>
                    <Image 
                      src={category.icon || "/logo.webp"} 
                      alt={category.name}
                      fill
                      className="object-contain p-2" 
                    />
                  </div>
                  <span className={`text-xs text-center ${
                    category.id === categoryId ? 'font-semibold text-emerald-600' : 'text-gray-700'
                  }`}>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="flex-1">
          <ProductGrid category={categoryId || slug} />
        </div>
      </div>
    </main>
  )
} 