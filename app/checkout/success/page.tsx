"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { getOrderById } from "@/lib/firebase/firestore"
import ProtectedRoute from "@/components/auth/protected-route"
import LoadingAnimation from "@/components/loading-animation"
import { getButtonClass } from "@/lib/utils"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const allOrderIdsParam = searchParams.get("allOrderIds")
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [orderCount, setOrderCount] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (orderId) {
      // Format order ID for display
      setOrderNumber(orderId.slice(0, 8).toUpperCase())
      
      // Check if there are multiple orders
      if (allOrderIdsParam) {
        const allOrderIds = allOrderIdsParam.split(',')
        setOrderCount(allOrderIds.length)
      }
      
      setLoading(false)

      // Fetch order details if needed
      const fetchOrder = async () => {
        try {
          const order = await getOrderById(orderId)
          if (!order) {
            setError(true)
          }
          // You could use order details here if needed
        } catch (error) {
          console.error("Error fetching order:", error)
          setError(true)
        } finally {
          setLoading(false)
        }
      }

      fetchOrder()
    } else {
      // If no orderId in URL, wait a moment and check again (might be due to navigation timing)
      const timer = setTimeout(() => {
        if (!searchParams.get("orderId")) {
          setError(true)
          setLoading(false)
        }
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [orderId, allOrderIdsParam, searchParams])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingAnimation />
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm text-center">
              <h1 className="text-2xl font-bold mb-2">Order Information Unavailable</h1>
              <p className="text-gray-600 mb-6">
                We couldn't find your order details. If you just placed an order, it may still be processing.
              </p>
              <div className="space-y-3">
                <Button asChild className={`w-full ${getButtonClass()}`}>
                  <Link href="/">Continue Shopping</Link>
                </Button>
                <Button asChild variant="outline" className={`w-full ${getButtonClass()}`}>
                  <Link href="/account/orders">View All Orders</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm text-center">
              <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                {orderCount > 1 ? `${orderCount} Orders Placed Successfully!` : "Order Placed Successfully!"}
              </h1>
              <p className="text-gray-600 mb-6">
                {orderCount > 1 
                  ? `Thank you for your orders. We've sent them to ${orderCount} different vendors and they will begin processing soon.`
                  : "Thank you for your order. We've received your order and will begin processing it soon."}
              </p>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Order Number:</span>
                  <span className="font-medium">#{orderNumber || "QM12345"}</span>
                </div>
                {orderCount > 1 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Total Orders:</span>
                    <span className="font-medium">{orderCount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Delivery:</span>
                  <span className="font-medium">30-60 minutes</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className={`w-full ${getButtonClass()}`}>
                  <Link href="/">Continue Shopping</Link>
                </Button>
                <Button asChild variant="outline" className={`w-full ${getButtonClass()}`}>
                  <Link href="/account/orders">Track Order</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
