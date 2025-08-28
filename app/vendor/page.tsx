"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useVendor } from "@/lib/context/vendor-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ArrowRight, Package, ShoppingBag, DollarSign, Clock, AlertTriangle, TrendingUp, BarChart, Info, User, Settings, RefreshCw } from "lucide-react"
import { db } from "@/lib/firebase/config"
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore"
import Link from "next/link"
import dynamic from "next/dynamic"
import { notificationService } from "@/lib/firebase/notification-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Dynamically import the PWA install button with no SSR
const PWAInstallButton = dynamic(() => import("@/components/pwa-install-button"), {
  ssr: false
})

interface Order {
  id: string
  orderNumber: string
  customerName: string
  total: number
  orderStatus: string
  createdAt: any
}

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
  productCount: number
  recentOrders: Order[]
  hasLoaded: boolean
  lastUpdated: Date | null
}

export default function VendorDashboard() {
  const { vendor, isAuthenticated, isLoading } = useVendor()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    productCount: 0,
    recentOrders: [],
    hasLoaded: false,
    lastUpdated: null
  })
  const [showNotificationDemo, setShowNotificationDemo] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check authentication status
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login")
      router.push("/vendor/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch dashboard data
  useEffect(() => {
    if (!vendor?.id) return

    let unsubscribeOrders: () => void;
    let unsubscribeRecentOrders: () => void;
    let unsubscribeProducts: () => void;
    
    const setupListeners = async () => {
      try {
        // For test vendor in development
        if (process.env.NODE_ENV === 'development' && vendor.id === 'test-vendor-id') {
          setTimeout(() => {
            setStats({
              totalOrders: 52,
              totalRevenue: 7890,
              pendingOrders: 5,
              lowStockProducts: 3,
              productCount: 24,
              recentOrders: [
                {
                  id: 'test-order-1',
                  orderNumber: 'ORD12345',
                  customerName: 'John Doe',
                  total: 420,
                  orderStatus: 'pending',
                  createdAt: new Date()
                },
                {
                  id: 'test-order-2',
                  orderNumber: 'ORD12346',
                  customerName: 'Jane Smith',
                  total: 185,
                  orderStatus: 'confirmed',
                  createdAt: new Date(Date.now() - 3600000)
                },
                {
                  id: 'test-order-3',
                  orderNumber: 'ORD12347',
                  customerName: 'Mike Johnson',
                  total: 560,
                  orderStatus: 'delivered',
                  createdAt: new Date(Date.now() - 7200000)
                }
              ],
              hasLoaded: true,
              lastUpdated: new Date()
            });
          }, 1000);
          return;
        }

        console.log("Setting up real-time listeners for vendor:", vendor.id);
        
        // Create date range for orders (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Real-time listener for recent orders
        const recentOrdersQuery = query(
          collection(db, "orders"),
          where("vendorId", "==", vendor.id),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        
        unsubscribeRecentOrders = onSnapshot(recentOrdersQuery, (snapshot) => {
          const recentOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              orderNumber: data.orderNumber || `ORD-${doc.id.slice(0,6)}`,
              customerName: data.customerName || "Customer",
              total: data.total || 0,
              orderStatus: data.orderStatus || "pending",
              createdAt: data.createdAt?.toDate() || new Date()
            } as Order;
          });
          
          // Check if there are new orders
          if (stats.hasLoaded && recentOrders.length > stats.recentOrders.length) {
            // Play notification sound for new orders
            notificationService.playOrderSound();
          }
          
          setStats(prevStats => ({
            ...prevStats,
            recentOrders,
            hasLoaded: true,
            lastUpdated: new Date()
          }));
        });
        
        // Real-time listener for all orders
        const ordersQuery = query(
          collection(db, "orders"),
          where("vendorId", "==", vendor.id),
          where("createdAt", ">=", thirtyDaysAgo)
        );
        
        unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
          const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data
            } as Order;
          });
          
          // Calculate total revenue
          const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
          
          // Count pending orders
          const pendingOrders = orders.filter(order => 
            order.orderStatus === 'pending' || 
            order.orderStatus === 'confirmed' || 
            order.orderStatus === 'preparing'
          ).length;
          
          setStats(prevStats => ({
            ...prevStats,
            totalOrders: snapshot.size,
            totalRevenue,
            pendingOrders,
            hasLoaded: true,
            lastUpdated: new Date()
          }));
        });
        
        // Real-time listener for products
        const productsQuery = query(
          collection(db, "products"),
          where("vendorId", "==", vendor.id)
        );
        
        unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
          // Count products with low stock
          const lowStockProducts = snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.stock <= 5; // Consider low stock if 5 or fewer items
          }).length;
          
          setStats(prevStats => ({
            ...prevStats,
            lowStockProducts,
            productCount: snapshot.size,
            hasLoaded: true,
            lastUpdated: new Date()
          }));
        });
        
      } catch (error) {
        console.error("Error setting up dashboard listeners:", error);
      }
    };
    
    setupListeners();
    
    // Clean up listeners when component unmounts
    return () => {
      console.log("Cleaning up dashboard listeners");
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeRecentOrders) unsubscribeRecentOrders();
      if (unsubscribeProducts) unsubscribeProducts();
    };
  }, [vendor]);
  
  // Manual refresh function
  const refreshDashboard = () => {
    // This function is just for UI feedback
    // The real-time listeners will automatically update the data
    setStats(prev => ({...prev, hasLoaded: false}));
    setTimeout(() => {
      setStats(prev => ({...prev, hasLoaded: true, lastUpdated: new Date()}));
    }, 1000);
  };

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Check if we haven't asked for permission yet
      if (Notification.permission === 'default') {
        // Show notification demo after a delay
        const timer = setTimeout(() => {
          setShowNotificationDemo(true);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Loading...</h2>
          <p>Please wait while we load your vendor dashboard</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !vendor) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">You need to be logged in to access this page</p>
          <Button onClick={() => router.push("/vendor/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen pb-8">
      {/* PWA Install Button */}
      <div className="fixed bottom-8 right-4 z-50">
        <PWAInstallButton 
          variant="default" 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
          label="Install Vendor App" 
        />
      </div>
      
      <div className="mt-2 sm:mt-0 pt-4 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Vendor Dashboard
            </h1>
            <p className="text-sm sm:text-base text-indigo-700">
              Welcome back, <span className="font-semibold">{vendor.name}</span>! Here's an overview of your store.
            </p>
            {stats.lastUpdated && (
              <div className="flex items-center mt-1">
                <p className="text-xs text-indigo-500">
                  Last updated: {stats.lastUpdated.toLocaleTimeString()}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-6 w-6 p-0 text-indigo-600" 
                  onClick={refreshDashboard}
                  disabled={!stats.hasLoaded}
                >
                  <RefreshCw className={`h-3 w-3 ${!stats.hasLoaded ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
              onClick={() => router.push("/vendor/profile")}
            >
              <User className="h-4 w-4 mr-1" />
              Profile
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
              onClick={() => router.push("/vendor/settings")}
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Notification permission prompt */}
      {showNotificationDemo && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 mx-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-800">Enable Order Notifications</CardTitle>
            <CardDescription className="text-amber-700">
              Get instant alerts when new orders arrive, even when you're not looking at this screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => {
                  notificationService.requestPermission();
                  setShowNotificationDemo(false);
                }}
              >
                Enable Notifications
              </Button>
              <Button 
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => {
                  setShowNotificationDemo(false);
                }}
              >
                Maybe Later
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards - 2 column on small mobile, 2 column on medium, 4 column on large */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 px-4">
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-800">Total Revenue</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-2">
            <div className="text-lg sm:text-2xl font-bold truncate text-blue-900">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-blue-600">Last 30 days</p>
          </CardContent>
          <CardFooter className="px-3 sm:px-6 pt-0">
            <Link href="/vendor/analytics" className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center">
              View analytics <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-white to-purple-50 border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-800">Orders</CardTitle>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-2">
            <div className="text-lg sm:text-2xl font-bold text-purple-900">{stats.totalOrders}</div>
            <p className="text-[10px] sm:text-xs text-purple-600">Last 30 days</p>
          </CardContent>
          <CardFooter className="px-3 sm:px-6 pt-0">
            <Link href="/vendor/orders" className="text-xs sm:text-sm text-purple-600 hover:underline flex items-center">
              View all orders <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-white to-amber-50 border-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-amber-800">Pending Orders</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-2">
            <div className="text-lg sm:text-2xl font-bold text-amber-900">{stats.pendingOrders}</div>
            <p className="text-[10px] sm:text-xs text-amber-600">Need attention</p>
          </CardContent>
          <CardFooter className="px-3 sm:px-6 pt-0">
            <Link 
              href="/vendor/orders?status=pending,confirmed,preparing" 
              className="text-xs sm:text-sm text-amber-600 hover:underline flex items-center"
            >
              Process orders <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-white to-red-50 border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-red-800">Low Stock</CardTitle>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
        </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-2">
            <div className="text-lg sm:text-2xl font-bold text-red-900">{stats.lowStockProducts}</div>
            <p className="text-[10px] sm:text-xs text-red-600">Out of {stats.productCount}</p>
          </CardContent>
          <CardFooter className="px-3 sm:px-6 pt-0">
            <Link href="/vendor/products?stock=low" className="text-xs sm:text-sm text-red-600 hover:underline flex items-center">
              Update inventory <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Main content cards - 1 column on mobile, 2 column on desktop */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 px-4">
        <Card className="col-span-1 bg-white shadow-md border-0">
          <CardHeader className="px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-lg sm:text-xl">Recent Orders</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-blue-100">
              Your latest 5 orders
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pt-4">
            {!stats.hasLoaded ? (
              <div className="h-[150px] sm:h-[200px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading recent orders...</p>
              </div>
            ) : stats.recentOrders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground mt-1">Orders will appear here once customers make purchases</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-start sm:items-center justify-between border-b pb-2 flex-wrap sm:flex-nowrap hover:bg-blue-50 p-2 rounded-md transition-colors">
                    <div className="min-w-0 pr-2">
                      <Link 
                        href={`/vendor/orders/${order.id}`}
                        className="font-medium hover:underline line-clamp-1 text-sm sm:text-base text-blue-700"
                      >
                        #{order.orderNumber}
                      </Link>
                      <div className="text-xs sm:text-sm text-gray-700 line-clamp-1">
                        {order.customerName}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-medium text-sm sm:text-base">₹{order.total}</div>
                      <div className={`text-[10px] sm:text-xs px-2 py-1 rounded-full inline-block font-medium ${
                        order.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).replace('_', ' ')}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
            )}
          </CardContent>
          <CardFooter className="px-4 sm:px-6 bg-gray-50 rounded-b-lg py-3">
            <Link href="/vendor/orders" className="text-xs sm:text-sm text-blue-600 hover:underline font-medium">
              View all orders
            </Link>
          </CardFooter>
        </Card>

        <Card className="col-span-1 bg-white shadow-md border-0">
          <CardHeader className="px-4 sm:px-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-purple-100">
              Common tasks to manage your store
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button className="h-auto py-4 sm:py-5 justify-start bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 text-green-800" variant="outline" asChild>
                <Link href="/vendor/products/add">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">Add Product</div>
                    <div className="text-[10px] sm:text-xs text-green-700">Create a new product</div>
                  </div>
                </Link>
              </Button>
              
              <Button className="h-auto py-4 sm:py-5 justify-start bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 border border-blue-200 text-blue-800" variant="outline" asChild>
                <Link href="/vendor/profile">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">Store Settings</div>
                    <div className="text-[10px] sm:text-xs text-blue-700">Update profile</div>
                  </div>
                </Link>
              </Button>
              
              <Button className="h-auto py-4 sm:py-5 justify-start bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 text-purple-800" variant="outline" asChild>
                <Link href="/vendor/analytics">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <BarChart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">Analytics</div>
                    <div className="text-[10px] sm:text-xs text-purple-700">View sales reports</div>
                  </div>
                </Link>
              </Button>
              
              <Button className="h-auto py-4 sm:py-5 justify-start bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200 text-amber-800" variant="outline" asChild>
                <Link href="/vendor/categories">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">Categories</div>
                    <div className="text-[10px] sm:text-xs text-amber-700">Manage categories</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Areas Notice */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mx-4 shadow-sm">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-blue-800">Delivery Areas</span>
            <span className="text-blue-700">
              {vendor.pincodes?.length ?
                `Your store serves ${vendor.pincodes.length} delivery areas: ${vendor.pincodes.join(', ')}` :
                "No delivery areas assigned to your store yet"}
            </span>
            <span className="text-xs italic mt-1 text-blue-600">Delivery areas are managed by the administrator. Contact support to update your delivery areas.</span>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
} 