"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { useAuth } from "@/lib/context/auth-context"
import { LoginModal } from "@/components/auth/login-modal"
import { ArrowLeft, Check, Clock, Package, Truck, AlertTriangle } from "lucide-react"
import { getOrderById } from "@/lib/firebase/firestore"
import type { Order } from "@/lib/firebase/firestore"

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (user?.uid && params.id) {
        try {
          setIsLoading(true)
          const orderData = await getOrderById(params.id)
          
          if (orderData && orderData.userId === user.uid) {
            setOrder(orderData)
          } else {
            // If order doesn't exist or doesn't belong to user
            router.push('/account/orders')
          }
        } catch (error) {
          console.error("Error fetching order:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    if (user) {
      fetchOrder()
    }
  }, [user, params.id, router])
  
  // Redirect if not logged in
  useEffect(() => {
    setMounted(true)
    
    if (mounted && !loading && !user) {
      setShowLoginModal(true)
    }
  }, [user, loading, mounted])
  
  if (!mounted || loading || isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </main>
    )
  }

  // If user is not logged in, show login modal
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-lg mb-4">Please log in to view your order details</p>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
              >
                Login
              </button>
            </div>
          </div>
        </div>
        {showLoginModal && (
          <LoginModal 
            onClose={() => {
              setShowLoginModal(false);
              // If still not logged in after closing modal, redirect to home
              if (!user) {
                router.push('/');
              }
            }} 
          />
        )}
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium mb-2">Order not found</h2>
            <p className="text-gray-500 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <button 
              onClick={() => router.push('/account/orders')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
            >
              Back to My Orders
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Function to format timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    
    // Handle Firestore timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString() + ' at ' + 
             timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Handle regular Date object or string
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Function to get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return { icon: <Check size={20} />, color: 'text-green-600', bg: 'bg-green-50' };
      case 'out_for_delivery':
        return { icon: <Truck size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'cancelled':
        return { icon: <AlertTriangle size={20} />, color: 'text-red-600', bg: 'bg-red-50' };
      default:
        return { icon: <Clock size={20} />, color: 'text-orange-600', bg: 'bg-orange-50' };
    }
  };

  // Function to get readable status
  const getReadableStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get status info
  const statusInfo = getStatusInfo(order.orderStatus);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 px-4">
        <button 
          onClick={() => router.push('/account/orders')}
          className="flex items-center text-sm text-gray-600 mb-4 hover:text-gray-900"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to My Orders
        </button>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-xl font-bold">Order #{order.id?.slice(0, 8).toUpperCase()}</h1>
              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
            <div className={`flex items-center ${statusInfo.color} mt-2 sm:mt-0 px-3 py-1 rounded-full ${statusInfo.bg}`}>
              {statusInfo.icon}
              <span className="ml-2 font-medium">{getReadableStatus(order.orderStatus)}</span>
            </div>
          </div>
          
          <div className="border-t border-b py-4 my-4">
            <h2 className="font-semibold mb-2">Delivery Address</h2>
            <p className="font-medium">{order.address.name}</p>
            <p>{order.address.address}</p>
            <p>{order.address.city}, {order.address.pincode}</p>
            <p>Phone: {order.address.phone}</p>
          </div>
          
          <div className="mb-4">
            <h2 className="font-semibold mb-2">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{item.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{(order.totalAmount - order.deliveryFee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Payment Information</h2>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className={`capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'failed' ? 'text-red-600' : 'text-orange-600'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 mb-2">Need help with this order?</p>
          <button 
            onClick={() => router.push('/contact')}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
          >
            Contact Support
          </button>
        </div>
      </div>
    </main>
  )
} 