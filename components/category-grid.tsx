"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { usePincode } from "@/lib/hooks/use-pincode"
import { getCategoriesByPincode, getAllCategories } from "@/lib/firebase/firestore"
import { Loader2 } from "lucide-react"

// Fallback categories if none are available in the database
const fallbackCategories = [
  { id: "fruits-vegetables", name: "Vegetables & Fruits", icon: "/icons/fruits.png" },
  { id: "dairy-bread-eggs", name: "Milk, Curd & Paneer", icon: "/icons/dairy.png" },
  { id: "bakery", name: "Drinks & Juices", icon: "/icons/bakery.png" },
  { id: "meat-fish", name: "Meat & Fish", icon: "/icons/meat.png" },
  { id: "masala-oils", name: "Masala and Oils", icon: "/icons/grocery.png" },
  { id: "cleaning-essentials", name: "Cleaning Essentials", icon: "/icons/cleaning.png" },
  { id: "drinks-juice", name: "Nutrition Bar", icon: "/icons/fruits.png" },
  { id: "namkeen-biscuits", name: "Chips & Namkeen", icon: "/icons/bakery.png" },
  { id: "dry-fruits", name: "Dry Fruits", icon: "/icons/grocery.png" },
  { id: "pharma-wellness", name: "Pharma and Wellness", icon: "/icons/cleaning.png" },
  { id: "aata-dal-rice", name: "Aataa Dal Rice", icon: "/icons/grocery.png" },
  { id: "organic", name: "Organic & Healthy", icon: "/icons/fruits.png" },
  { id: "dairy", name: "Dairy Products", icon: "/icons/dairy.png" },
  { id: "grocery", name: "Grocery & Staples", icon: "/icons/grocery.png" },
]

interface Category {
  id: string
  name: string
  icon: string
}

export default function CategoryGrid() {
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
  const categories = dbCategories.length > 0 ? dbCategories : fallbackCategories;

  // Filter categories to only show those with products for the current pincode
  const filteredCategories = pincode
    ? categories.filter(category => availableCategoryIds.includes(category.id))
    : categories;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (filteredCategories.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No categories available for your location. Please try another pincode.
      </div>
    )
  }

  // Filter out categories with invalid data and display all valid categories
  const mainCategories = filteredCategories.filter(category =>
    category &&
    category.id &&
    category.name &&
    category.name.trim() !== ''
  );

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {mainCategories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.id}`}
          className="flex flex-col items-center"
        >
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-2 rounded-full bg-white p-2 shadow-sm border border-gray-100">
              <Image
                src={category.icon && category.icon.startsWith('http') ? category.icon : "/logo.webp"}
                alt={category.name}
                fill
                className="object-contain p-1 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logo.webp";
                }}
              />
            </div>
            <span className="text-xs text-center font-medium text-gray-800 mt-1">{category.name}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

