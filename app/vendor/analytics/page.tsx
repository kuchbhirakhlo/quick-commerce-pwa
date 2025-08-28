"use client"

import { useState, useEffect } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart } from "@/components/ui/charts"

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  averageOrderValue: number
  salesByDay: {
    name: string
    total: number
  }[]
  ordersByDay: {
    name: string
    total: number
  }[]
  topProducts: {
    id: string
    name: string
    totalSold: number
    revenue: number
  }[]
  orderStatusBreakdown: {
    name: string
    value: number
  }[]
}

export default function VendorAnalytics() {
  const { vendor } = useVendor()
  const [period, setPeriod] = useState("week")
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    salesByDay: [],
    ordersByDay: [],
    topProducts: [],
    orderStatusBreakdown: []
  })

  useEffect(() => {
    if (!vendor) return

    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        // Get date range based on selected period
        const now = new Date()
        let startDate = new Date()

        if (period === "week") {
          startDate.setDate(now.getDate() - 7)
        } else if (period === "month") {
          startDate.setMonth(now.getMonth() - 1)
        } else if (period === "year") {
          startDate.setFullYear(now.getFullYear() - 1)
        }

        // Fetch orders within date range
        const ordersQuery = query(
          collection(db, "orders"),
          where("vendorId", "==", vendor.id),
          where("createdAt", ">=", startDate)
        )
        const ordersSnapshot = await getDocs(ordersQuery)

        // Fetch products
        const productsQuery = query(
          collection(db, "products"),
          where("vendorId", "==", vendor.id)
        )
        const productsSnapshot = await getDocs(productsQuery)

        // Process order data
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))

        // Calculate total revenue and average order value
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
        const averageOrderValue = orders.length ? totalRevenue / orders.length : 0

        // Process orders by day
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const ordersByDay = Array(7).fill(0).map((_, i) => ({
          name: dayNames[i],
          total: 0
        }))

        const salesByDay = Array(7).fill(0).map((_, i) => ({
          name: dayNames[i],
          total: 0
        }))

        orders.forEach(order => {
          const dayIndex = order.createdAt.getDay()
          ordersByDay[dayIndex].total += 1
          salesByDay[dayIndex].total += (order.total || 0)
        })

        // Calculate order status breakdown
        const statusCounts: { [key: string]: number } = {}
        orders.forEach(order => {
          const status = order.orderStatus || "unknown"
          statusCounts[status] = (statusCounts[status] || 0) + 1
        })

        const orderStatusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value
        }))

        // Calculate top products
        const productMap: { [key: string]: { name: string, totalSold: number, revenue: number } } = {}

        orders.forEach(order => {
          if (!order.items) return

          order.items.forEach(item => {
            if (!productMap[item.id]) {
              productMap[item.id] = {
                name: item.name,
                totalSold: 0,
                revenue: 0
              }
            }

            productMap[item.id].totalSold += (item.quantity || 1)
            productMap[item.id].revenue += (item.price * (item.quantity || 1))
          })
        })

        const topProducts = Object.entries(productMap)
          .map(([id, data]) => ({
            id,
            ...data
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)

        setAnalytics({
          totalOrders: orders.length,
          totalRevenue,
          totalProducts: productsSnapshot.size,
          averageOrderValue,
          salesByDay,
          ordersByDay,
          topProducts,
          orderStatusBreakdown
        })
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [vendor, period])

  if (!vendor) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-500">Track your store performance</p>
        </div>
        <Tabs value={period} onValueChange={setPeriod} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-gray-500">
                  For the selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                <p className="text-xs text-gray-500">
                  For the selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analytics.averageOrderValue.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">
                  For the selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalProducts}</div>
                <p className="text-xs text-gray-500">
                  Active products in your store
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <LineChart
                  data={analytics.salesByDay}
                  index="name"
                  categories={["total"]}
                  colors={["blue"]}
                  valueFormatter={(value) => `$${value.toFixed(2)}`}
                  yAxisWidth={60}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Orders by Day</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <BarChart
                  data={analytics.ordersByDay}
                  index="name"
                  categories={["total"]}
                  colors={["blue"]}
                  valueFormatter={(value) => `${value} orders`}
                  yAxisWidth={30}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topProducts.length === 0 ? (
                    <p className="text-gray-500">No sales data available for the selected period</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between pb-2 border-b last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              Sold: {product.totalSold} units
                            </p>
                          </div>
                          <p className="font-medium">${product.revenue.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.orderStatusBreakdown.length === 0 ? (
                    <p className="text-gray-500">No orders for the selected period</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.orderStatusBreakdown.map((status, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${status.name === "delivered" ? "bg-green-500" :
                                status.name === "cancelled" ? "bg-red-500" :
                                  "bg-blue-500"
                              }`}></div>
                            <p className="capitalize">{status.name.replace(/_/g, ' ')}</p>
                          </div>
                          <p className="font-medium">{status.value} orders</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
} 