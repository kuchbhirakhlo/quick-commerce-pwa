"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { useAuth } from "@/lib/context/auth-context"
import { LoginModal } from "@/components/auth/login-modal"
import { Clock, Package, Check, Truck, AlertTriangle } from "lucide-react"
import { getOrdersByUser } from "@/lib/firebase/firestore"
import type { Order } from "@/lib/firebase/firestore"

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.uid) {
        try {
          setIsLoading(true)
          const userOrders = await getOrdersByUser(user.uid)
          setOrders(userOrders)
        } catch (error) {
          console.error("Error fetching orders:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    if (user) {
      fetchOrders()
    }
  }, [user])
  
  // Redirect if not logged in
  useEffect(() => {
    setMounted(true)
    
    if (mounted && !loading && !user) {
      setShowLoginModal(true)
    }
  }, [user, loading, mounted])
  
  if (!mounted || loading) {
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
              <p className="text-lg mb-4">Please log in to view your orders</p>
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

  // Function to format timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    
    // Handle Firestore timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    
    // Handle regular Date object or string
    return new Date(timestamp).toLocaleDateString();
  };
  
  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Check size={16} className="mr-1 text-green-600" />;
      case 'out_for_delivery':
        return <Truck size={16} className="mr-1 text-blue-600" />;
      case 'cancelled':
        return <AlertTriangle size={16} className="mr-1 text-red-600" />;
      default:
        return <Clock size={16} className="mr-1 text-blue-600" />;
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

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 px-4">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <button 
              onClick={() => router.push('/category')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center border-b pb-3 mb-3">
                  <div>
                    <p className="font-medium">Order #{order.id?.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`flex items-center text-sm ${
                      order.orderStatus === 'delivered' ? 'text-green-600' : 
                      order.orderStatus === 'cancelled' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {getStatusIcon(order.orderStatus)}
                      {getReadableStatus(order.orderStatus)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₹{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">₹{order.totalAmount.toFixed(2)}</span>
                </div>
                
                <div className="mt-3">
                  <button 
                    onClick={() => router.push(`/account/orders/${order.id}`)}
                    className="text-emerald-600 text-sm font-medium hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
} 