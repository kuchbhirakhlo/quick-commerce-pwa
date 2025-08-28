"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, orderBy, limit, startAt, endAt } from "firebase/firestore"
import Image from "next/image"
import Link from "next/link"
import { usePincode } from "@/lib/hooks/use-pincode"
import { useDebounce } from "@/hooks/use-debounce"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string
  price: number
  mrp: number
  category: string
  image: string
  unit: string
}

export function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const { pincode } = usePincode()
  const commandRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Search products when debounced search term changes
  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 3 || !pincode) {
        setSearchResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setIsOpen(true)

      try {
        const searchTermLower = debouncedSearchTerm.toLowerCase()
        
        // Query for products that match the search term
        const productsQuery = query(
          collection(db, "products"),
          where("pincodes", "array-contains", pincode),
          where("status", "==", "active"),
          orderBy("name"),
          limit(10)
        )
        
        const querySnapshot = await getDocs(productsQuery)
        
        // Filter results client-side for more flexible matching
        const results = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as unknown as Product))
          .filter(product => 
            product.name.toLowerCase().includes(searchTermLower) ||
            product.description?.toLowerCase().includes(searchTermLower)
          )
          .slice(0, 5)
        
        setSearchResults(results)
      } catch (error) {
        console.error("Error searching products:", error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    searchProducts()
  }, [debouncedSearchTerm, pincode])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    if (value.length >= 3) {
      setIsLoading(true)
    } else {
      setIsOpen(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (searchTerm.trim().length >= 3) {
      setIsOpen(false)
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <div className="relative w-full" ref={commandRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="search"
            placeholder="Search for products..."
            value={searchTerm}
            onChange={handleInputChange}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            onFocus={() => {
              if (searchTerm.length >= 3) {
                setIsOpen(true)
              }
            }}
          />
        </div>
      </form>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border overflow-hidden">
          {isLoading ? (
            <div className="p-2 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {searchResults.map((product) => (
                <Link 
                  href={`/product/${product.id}`} 
                  key={product.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="relative h-10 w-10 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">₹{product.price} / {product.unit}</p>
                  </div>
                </Link>
              ))}
              <div className="p-2 border-t">
                <button 
                  onClick={handleSubmit}
                  className="w-full text-center text-sm text-blue-600 hover:underline py-1"
                >
                  See all results for "{searchTerm}"
                </button>
              </div>
            </div>
          ) : debouncedSearchTerm.length >= 3 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No products found
              <div className="mt-2">
                <button 
                  onClick={handleSubmit}
                  className="text-blue-600 hover:underline"
                >
                  Search for "{searchTerm}"
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
} 