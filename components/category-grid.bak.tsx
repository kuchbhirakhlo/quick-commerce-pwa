"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { usePincode } from "@/lib/hooks/use-pincode"
import { getCategoriesByPincode } from "@/lib/firebase/firestore"
import { Loader2 } from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-client"

interface Category {
  id: string
  name: string
  icon: string
}

export default function CategoryGrid() {
  const { pincode } = usePincode()
  const [availableCategoryIds, setAvailableCategoryIds] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch available category IDs based on pincode
  useEffect(() => {
    const fetchCategoryIds = async () => {
      if (!pincode) {
        setAvailableCategoryIds([])
        return
      }

      try {
        const categoryIds = await getCategoriesByPincode(pincode)
        setAvailableCategoryIds(categoryIds)
      } catch (error) {
        console.error("Error fetching category IDs:", error)
        setAvailableCategoryIds([])
      }
    }

    fetchCategoryIds()
  }, [pincode])

  // Fetch category details from Firebase
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      setIsLoading(true)
      if (availableCategoryIds.length === 0) {
        setCategories([])
        setIsLoading(false)
        return
      }

      try {
        if (!db) {
          throw new Error("Firestore instance not available")
        }
        const q = query(collection(db, "categories"), orderBy("name"))
        const querySnapshot = await getDocs(q)
        
        const allCategories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[]

        // Filter categories to only show those with products
        const filteredCategories = allCategories.filter(category => 
          availableCategoryIds.includes(category.id)
        )
        
        setCategories(filteredCategories)
      } catch (error) {
        console.error("Error fetching category details:", error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryDetails()
  }, [availableCategoryIds])

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.id}`}
          className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-2">
              <Image 
                src={category.icon || "/logo.webp"} 
                alt={category.name} 
                width={64} 
                height={64} 
                className="object-contain"
                onError={(e) => {
                  // Fallback to logo if category image fails to load
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.src = "/logo.webp";
                }}
              />
            </div>
            <span className="text-sm text-center font-medium text-gray-800">{category.name}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
