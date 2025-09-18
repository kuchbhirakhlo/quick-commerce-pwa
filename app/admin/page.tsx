"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, onSnapshot, Firestore } from "firebase/firestore"
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
  totalRevenue: number
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
    totalRevenue: 0,
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
    setLoading(true)
    setError(null)
    if (!db) {
      setError("Firebase is not initialized")
      setLoading(false)
      return
    }

    const vendorsRef = collection(db, "vendors")
    const unsubVendors = onSnapshot(vendorsRef, (snapshot) => {
      const totalVendors = snapshot.size
      const activeVendors = snapshot.docs.filter((doc) => doc.data().status === "active").length
      setStats((prev) => ({ ...prev, totalVendors, activeVendors }))
    }, (error) => {
      console.error("Error listening to vendors:", error)
      setError(error.message)
    })

    const productsRef = collection(db, "products")
    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      setStats((prev) => ({ ...prev, totalProducts: snapshot.size }))
    }, (error) => {
      console.error("Error listening to products:", error)
      setError(error.message)
    })

    const ordersRef = collection(db, "orders")
    const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
      const totalOrders = snapshot.size
      const pendingOrders = snapshot.docs.filter((doc) => doc.data().status === "pending").length
      let totalRevenue = 0
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (data.status !== "pending" && typeof data.total === "number") {
          totalRevenue += data.total
        }
      })
      setStats((prev) => ({
        ...prev,
        totalOrders,
        pendingOrders,
        totalRevenue
      }))
    }, (error) => {
      console.error("Error listening to orders:", error)
      setError(error.message)
    })

    setLoading(false)

    return () => {
      unsubVendors()
      unsubProducts()
      unsubOrders()
    }
  }, [])


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
          <Button onClick={() => window.location.reload()}>Retry</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            {/* Vendors Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Vendors</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVendors}</div>
                <p className="text-xs text-muted-foreground mt-1">Active: {stats.activeVendors}</p>
              </CardContent>
            </Card>
            {/* Products Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>
            {/* Orders Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">Pending: {stats.pendingOrders}</p>
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