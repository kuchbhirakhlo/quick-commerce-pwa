"use client"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { getButtonClass } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string
  price: number
  mrp: number
  category: string
  image: string
  unit: string
  stock?: number
  createdAt: string | null
  updatedAt: string | null
  pincodes?: string[]
  vendorId?: string
  status?: string
  imagePublicId?: string
  additionalImages?: Array<{
    url: string;
    path?: string;
    public_id?: string;
  }>
}

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  const handleAddToCart = () => {
    setIsLoading(true)
    
    // Add product to cart with selected quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    
    toast.success(`Added ${quantity} ${product.name} to cart`)
    setIsLoading(false)
  }

  const incrementQuantity = () => {
    if (product.stock && quantity >= product.stock) {
      toast.error(`Sorry, only ${product.stock} in stock`)
      return
    }
    setQuantity(prev => prev + 1)
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="relative aspect-square w-full">
            <Image 
              src={product.image || "/placeholder.svg"} 
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        {/* Product Details */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-500 mb-4">{product.unit}</p>
          
          <div className="flex items-center mb-6">
            <span className="text-2xl font-bold mr-3">₹{product.price}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-gray-500 line-through mr-2">₹{product.mrp}</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                </span>
              </>
            )}
          </div>
          
       
          
          {/* Quantity Selector */}
          <div className="mb-6">
            <h2 className="font-medium mb-2">Quantity</h2>
            <div className="flex items-center">
              <button 
                onClick={decrementQuantity}
                className="border rounded-l p-2 hover:bg-gray-100"
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <div className="border-t border-b py-2 px-4 text-center min-w-[3rem]">
                {quantity}
              </div>
              <button 
                onClick={incrementQuantity}
                className="border rounded-r p-2 hover:bg-gray-100"
                disabled={product.stock ? quantity >= product.stock : false}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

        
          
          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className={`w-full py-6 text-lg ${getButtonClass(pathname ?? '')}`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>Add to Cart - ₹{(product.price * quantity).toFixed(2)}</>
            )}
          </Button>


          {product.description && (
            <div className="mt-6">
              <h2 className="font-medium mb-2">Description</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 