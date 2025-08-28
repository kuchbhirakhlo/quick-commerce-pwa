"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { usePincode } from "@/lib/hooks/use-pincode"
import { toast } from "sonner"
import { getButtonClass } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { collection, query as firestoreQuery, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

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

export function SearchResults({ query }: { query: string }) {
  const { addToCart } = useCart()
  const { pincode } = usePincode()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
  const [addedProducts, setAddedProducts] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  useEffect(() => {
    const searchProducts = async () => {
      setIsLoading(true)
      
      if (!query || !pincode) {
        setProducts([])
        setIsLoading(false)
        return
      }

      try {
        const searchTermLower = query.toLowerCase()
        
        // Query for products
        const productsQuery = firestoreQuery(
          collection(db, "products"),
          where("pincodes", "array-contains", pincode),
          where("status", "==", "active"),
          orderBy("name"),
          limit(50)
        )
        
        const querySnapshot = await getDocs(productsQuery)
        
        // Filter results client-side for more flexible matching
        const results = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as unknown as Product))
          .filter(product => 
            product.name.toLowerCase().includes(searchTermLower) ||
            product.description?.toLowerCase().includes(searchTermLower) ||
            product.category?.toLowerCase().includes(searchTermLower)
          )
        
        setProducts(results)
        console.log(`Found ${results.length} products matching "${query}"`)
      } catch (error) {
        console.error("Error searching products:", error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    searchProducts()
  }, [query, pincode])

  const handleAddToCart = (product: Product) => {
    setLoadingProductId(product.id)
    addToCart(product)
    
    // Show temporary visual feedback
    setAddedProducts(prev => ({ ...prev, [product.id]: true }))
    toast.success(`Added ${product.name} to cart`)
    
    // Reset after animation
    setTimeout(() => {
      setAddedProducts(prev => ({ ...prev, [product.id]: false }))
      setLoadingProductId(null)
    }, 1500)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      </div>
    )
  }

  if (products.length === 0 && query) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No products found matching "{query}".</p>
        <p className="text-gray-400 mt-2">Try a different search term or browse our categories.</p>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Enter a search term to find products.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <div key={product.id} className="p-4 border rounded-lg bg-white flex flex-col h-full">
          <Link href={`/product/${product.id}`} className="group flex-1">
            <div className="relative h-32 w-full mb-2 overflow-hidden">
              <div className="h-full w-full">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-contain" />
              </div>
            </div>
            <h3 className="font-medium text-gray-800 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.unit}</p>
          </Link>
          <div className="flex justify-between items-center mt-auto pt-2">
            <div>
              <span className="font-bold">₹{product.price}</span>
              {product.mrp > product.price && (
                <span className="text-xs text-gray-500 line-through ml-2">₹{product.mrp}</span>
              )}
            </div>
            <Button
              onClick={() => handleAddToCart(product)}
              disabled={loadingProductId === product.id}
              className={`p-4 ${getButtonClass(pathname ?? '')}`}
            >
              {loadingProductId === product.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus size={16} className="mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
} 