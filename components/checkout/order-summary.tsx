"use client"

import Image from "next/image"
import { useCart } from "@/lib/hooks/use-cart"

export default function OrderSummary() {
  const { cartItems } = useCart()

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

  // Apply delivery fee logic: 19rs for cart under 99, FREE delivery for 99 and above
  const deliveryFee = subtotal < 99 ? 19 : 0

  // Apply discount logic
  let discountAmount = 0
  if (subtotal >= 199 && subtotal < 499) {
    discountAmount += subtotal * 0.1 // 10% discount for orders 199-498.99
  }
  if (subtotal >= 499) {
    discountAmount += 50 // 50rs discount for orders 499+
  }

  const total = subtotal - discountAmount + deliveryFee

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
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Delivery Fee</span>
          <span>₹{deliveryFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-medium text-base mt-4">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
