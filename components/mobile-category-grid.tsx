"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { usePincode } from "@/lib/hooks/use-pincode"
import { getCategoriesByPincode, getAllCategories } from "@/lib/firebase/firestore"
import { Loader2 } from "lucide-react"

// Function to convert category name to URL-friendly slug
function createSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

interface Category {
  id: string
  name: string
  icon: string
}

export default function MobileCategoryGrid() {
  const { pincode } = usePincode()
  const [availableCategoryIds, setAvailableCategoryIds] = useState<string[]>([])
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all categories from the database
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const categories = await getAllCategories();
        if (categories && categories.length > 0) {
          setDbCategories(categories as Category[]);
        }
      } catch (error) {
        console.error("Error fetching all categories:", error);
      }
    };

    fetchAllCategories();
  }, []);

  // Fetch categories available for the selected pincode
  useEffect(() => {
    const fetchCategoriesByPincode = async () => {
      setIsLoading(true)
      if (!pincode) {
        setAvailableCategoryIds([])
        setIsLoading(false)
        return
      }

      try {
        const categoryIds = await getCategoriesByPincode(pincode)
        setAvailableCategoryIds(categoryIds)
      } catch (error) {
        console.error("Error fetching categories by pincode:", error)
        setAvailableCategoryIds([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoriesByPincode()
  }, [pincode])

  // Determine which categories to use
  const categories = dbCategories.length > 0 ? dbCategories : [];

  // Filter categories to only show those with products for the current pincode
  const filteredCategories = pincode 
    ? categories.filter(category => availableCategoryIds.includes(category.id))
    : categories;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    )
  }

  if (filteredCategories.length === 0) {
    return null;
  }

  // Get first rows of categories for mobile display (limit to 6)
  const mainCategories = filteredCategories.slice(0, 6);

  return (
    <div className="md:hidden">
      <h2 className="text-base font-bold text-gray-800 mb-3">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-3">
        {mainCategories.map((category) => {
          const categorySlug = `${createSlug(category.name)}-${category.id}`;
          return (
            <Link
              key={category.id}
              href={`/category/${categorySlug}`}
              className="flex flex-col items-center"
            >
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 mb-2 rounded-full bg-white p-2 shadow-sm border border-gray-100">
                  <Image 
                    src={category.icon || "/logo.webp"} 
                    alt={category.name} 
                    fill
                    className="object-contain p-1 rounded-full" 
                  />
                </div>
                <span className="text-xs text-center font-medium text-gray-800 mt-1">{category.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  )
} 