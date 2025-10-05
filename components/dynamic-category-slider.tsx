"use client"
import { useState, useEffect } from "react"
import { usePincode } from "@/lib/hooks/use-pincode"
import { getCategoriesByPincode } from "@/lib/firebase/firestore"
import ProductSlider from "@/components/product-slider"
import { Loader2, ChevronRight } from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface Category {
  id: string
  name: string
  icon: string
}

export default function DynamicCategorySlider() {
  const { pincode } = usePincode()
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({})

  // Fetch category info first
  useEffect(() => {
    const fetchCategoryMap = async () => {
      try {
        const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
        const categoriesSnapshot = await getDocs(categoriesQuery)

        const categoryMapData: Record<string, string> = {};
        categoriesSnapshot.docs.forEach(doc => {
          categoryMapData[doc.id] = doc.data().name;
        });

        setCategoryMap(categoryMapData);
      } catch (error) {
        console.error("Error fetching category map:", error)
      }
    };

    fetchCategoryMap();
  }, []);

  // Fetch available categories by pincode
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      if (!pincode) {
        setCategories([])
        setIsLoading(false)
        return
      }

      try {
        const availableCategories = await getCategoriesByPincode(pincode)
        setCategories(availableCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [pincode])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No categories available for your location. Please try another pincode.
      </div>
    )
  }

  // Filter out categories with no products and display all remaining categories
  const displayCategories = categories.filter(categoryId => {
    // Only show categories that have products available
    return categoryMap[categoryId] // Ensure category exists in our mapping
  });

  return (
    <div className="space-y-6">
      {displayCategories.map(categoryId => (
        <div key={categoryId} className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-bold text-gray-800">
              {categoryMap[categoryId] ||
                categoryId.split("-").map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(" ")}
            </h2>
            <a href={`/category/${categoryId}`} className="text-sm font-medium text-emerald-600 flex items-center">
              See all <ChevronRight size={16} />
            </a>
          </div>
          <ProductSlider category={categoryId} />
        </div>
      ))}
    </div>
  )
} 