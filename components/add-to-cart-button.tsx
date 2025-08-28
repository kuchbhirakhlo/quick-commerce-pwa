"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { getButtonClass } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  unit: string
  image: string
}

export default function AddToCartButton({
  product,
  className = "",
}: {
  product: Product
  className?: string
}) {
  const { addToCart, cartItems, updateQuantity } = useCart()
  const cartItem = cartItems.find((item) => item.id === product.id)
  const [quantity, setQuantity] = useState(cartItem?.quantity || 0)
  const pathname = usePathname()

  const handleAddToCart = () => {
    addToCart(product)
    setQuantity((prev) => prev + 1)
  }

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1)
    setQuantity((prev) => prev + 1)
  }

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1)
      setQuantity((prev) => prev - 1)
    }
  }

  return (
    <div className={className}>
      {quantity === 0 ? (
        <Button 
          onClick={handleAddToCart} 
          className={`w-full ${getButtonClass(pathname)}`}
        >
          <ShoppingCart size={18} className="mr-2" />
          Add to Cart
        </Button>
      ) : (
        <div className="flex items-center justify-between border border-gray-300 rounded-lg overflow-hidden">
          <Button variant="ghost" size="icon" onClick={handleDecrement} className="rounded-none h-12">
            <Minus size={16} />
          </Button>
          <span className="font-medium text-lg">{quantity}</span>
          <Button variant="ghost" size="icon" onClick={handleIncrement} className="rounded-none h-12">
            <Plus size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
