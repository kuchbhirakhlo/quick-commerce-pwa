"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, query, where, Firestore } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, ShoppingBag, Users, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"
import dynamic from "next/dynamic"

interface DashboardStats {
  totalVendors: number
  activeVendors: number
  totalProducts: number
  totalOrders: number
  pendingOrders: number
}

// Dynamically import the PWA install button with no SSR
const PWAInstallButton = dynamic(() => import("@/components/pwa-install-button"), {
  ssr: false
})

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendors: 0,
    activeVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Sample data for charts
  const salesData = [
    { name: "Jan", sales: 4000 },
    { name: "Feb", sales: 3000 },
    { name: "Mar", sales: 5000 },
    { name: "Apr", sales: 4500 },
    { name: "May", sales: 6000 },
    { name: "Jun", sales: 5500 },
  ]

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setError(null)

      // Verify Firebase connection
      if (!db) {
        throw new Error("Firebase is not initialized")
      }

      // Fetch vendors stats
      const vendorsSnapshot = await getDocs(collection(db as Firestore, "vendors"))
      const vendors = vendorsSnapshot.docs.map(doc => doc.data())

      // Fetch products stats
      const productsSnapshot = await getDocs(collection(db as Firestore, "products"))

      // Fetch orders stats
      const ordersSnapshot = await getDocs(collection(db as Firestore, "orders"))
      const orders = ordersSnapshot.docs.map(doc => doc.data())

      setStats({
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.status === "active").length,
        totalProducts: productsSnapshot.size,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === "pending").length,
      })
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error)
      setError(error.message || "Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Button onClick={fetchDashboardStats}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* PWA Install Button */}
      <div className="fixed bottom-8 right-4 z-50">
        <PWAInstallButton 
          variant="default" 
          className="bg-blue-500 hover:bg-blue-600 shadow-lg"
          label="Install Admin App" 
        />
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome to your admin dashboard</p>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹42,500</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">285</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  +8% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">152</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  +18% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 