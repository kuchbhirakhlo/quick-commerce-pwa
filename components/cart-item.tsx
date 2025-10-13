"use client"

import Image from "next/image"
import { Plus, Minus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { getButtonClass } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface CartItemProps {
  id: string
  name: string
  price: number
  unit: string
  image: string
  quantity: number
}

export default function CartItem({ id, name, price, unit, image, quantity }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart()
  const pathname = usePathname()

  const handleDecrease = () => {
    if (quantity === 1) {
      removeFromCart(id)
    } else {
      updateQuantity(id, quantity - 1)
    }
  }

  const handleIncrease = () => {
    updateQuantity(id, quantity + 1)
  }

  return (
    <div className="flex py-4 border-b">
      <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
        <Image src={image || "/placeholder.svg"} fill alt={name} className="object-cover" />
      </div>

      <div className="ml-3 flex-1">
        <div className="flex justify-between">
          <div>
            <h4 className="font-medium text-gray-800 text-sm">{name}</h4>
            <p className="text-xs text-gray-500">{unit}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-500"
            onClick={() => removeFromCart(id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="font-semibold">₹{price}</div>

          <div className="flex items-center border border-gray-200 rounded-full">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-l-full p-0 hover:bg-gray-100"
              onClick={handleDecrease}
            >
              <Minus size={14} className="text-orange-600" />
            </Button>
            <span className="w-6 text-center font-medium text-sm">{quantity}</span>
            <Button
              size="icon"
              className={`h-7 w-7 rounded-r-full p-0 ${getButtonClass(pathname)}`}
              onClick={handleIncrease}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 