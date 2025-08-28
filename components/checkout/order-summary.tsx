"use client"

import Image from "next/image"
import { useCart } from "@/lib/hooks/use-cart"

export default function OrderSummary() {
  const { cartItems } = useCart()

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const deliveryFee = 40
  const total = subtotal + deliveryFee

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

      {cartItems.length === 0 ? (
        <p className="text-gray-500 mb-4">Your cart is empty</p>
      ) : (
        <div className="space-y-4 mb-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                <p className="text-sm text-gray-500">
                  {item.quantity} × ₹{item.price}
                </p>
              </div>
              <div className="text-sm font-medium text-gray-900">₹{item.price * item.quantity}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Delivery Fee</span>
          <span>₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between font-medium text-base mt-4">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>
    </div>
  )
}
