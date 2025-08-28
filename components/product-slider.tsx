"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { getProductsByPincode } from "@/lib/firebase/firestore"
import { usePincode } from "@/lib/hooks/use-pincode"
import { Loader2 } from "lucide-react"
import { getButtonClass } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  unit: string
  image: string
}

export default function ProductSlider({ category }: { category: string }) {
  const { addToCart, cartItems, updateQuantity } = useCart()
  const { pincode } = usePincode()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

        console.log(`Fetched ${categoryProducts.length} products for category ${category} in pincode ${pincode}`)
      } catch (error) {
        console.error(`Error fetching products for category ${category}:`, error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [category, pincode])

  // Get quantity of product in cart
  const getQuantityInCart = (productId: string) => {
    const cartItem = cartItems.find(item => item.id === productId)
    return cartItem ? cartItem.quantity : 0
  }

  // Handle increase/decrease quantity
  const handleDecrease = (product: Product) => {
    const currentQty = getQuantityInCart(product.id)
    updateQuantity(product.id, currentQty - 1)
  }

  const handleIncrease = (product: Product) => {
    addToCart(product)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No products available in this category for your location.
      </div>
    )
  }

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
      {products.map((product) => {
        const quantityInCart = getQuantityInCart(product.id)
        
        return (
          <div key={product.id} className="min-w-[180px] p-4 border rounded-lg bg-white flex flex-col h-full">
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
              
              {quantityInCart > 0 ? (
                <div className="flex items-center border border-gray-200 rounded-full">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="h-8 w-8 rounded-l-full p-0 hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDecrease(product)
                    }}
                  >
                    <Minus size={16} className="text-green-600" />
                  </Button>
                  <span className="w-6 text-center font-medium">{quantityInCart}</span>
                  <Button 
                    size="icon" 
                    className="h-8 w-8 rounded-r-full p-0 bg-green-500 hover:bg-green-600"
                    onClick={(e) => {
                      e.preventDefault()
                      handleIncrease(product)
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={(e) => {
                    e.preventDefault()
                    addToCart(product)
                  }}
                >
                  <Plus size={16} />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
