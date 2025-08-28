"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { getProductsByPincode } from "@/lib/firebase/firestore"
import { usePincode } from "@/lib/hooks/use-pincode"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getButtonClass } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  unit: string
  image: string
}

export default function ProductGrid({ category }: { category: string }) {
  const { addToCart } = useCart()
  const { pincode } = usePincode()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
  const [addedProducts, setAddedProducts] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      if (!pincode) {
        setProducts([])
        setIsLoading(false)
        return
      }

      try {
        // Get all products for this pincode
        const allProducts = await getProductsByPincode(pincode)

        // Filter products by category
        const categoryProducts = allProducts.filter(p => p.category === category)

        // Type cast to ensure compatibility with our Product interface
        setProducts(categoryProducts.map(p => ({
          id: p.id || '',
          name: p.name,
          price: p.price,
          unit: p.unit,
          image: p.image
        })))

        console.log(`Fetched ${categoryProducts.length} products for category ${category} in pincode ${pincode} for grid view`)
      } catch (error) {
        console.error(`Error fetching products for category ${category}:`, error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [category, pincode])

  const handleAddToCart = (product: Product) => {
    setLoadingProductId(product.id)
    addToCart(product)
    console.log("Product added to cart:", product)
    
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

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No products available in this category for your location.</p>
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
            <span className="font-bold">₹{product.price}</span>
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
