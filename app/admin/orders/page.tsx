"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase/config"
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Bell } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
}

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
}

interface Order {
  id: string
  createdAt: Timestamp
  userId: string
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
  }>
  totalAmount: number
  deliveryFee: number
  address: {
    name: string
    phone: string
    address: string
    pincode: string
    city: string
  }
  paymentMethod: "cod" | "online"
  paymentStatus: "pending" | "paid" | "failed"
  orderStatus: keyof typeof ORDER_STATUS_COLORS
  updatedAt?: Timestamp
  deliveryPersonId?: string
}

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  useEffect(() => {
    setLoading(true)

    // Get all orders
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    )

    // Set up a snapshot listener
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data() as Omit<Order, 'id'>;
          return {
            id: doc.id,
            ...data
          } as Order;
        });

        // Check for new orders in the last 5 minutes
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        const newOrders = ordersData.filter(order => {
          if (!order.createdAt) return false;
          const orderDate = order.createdAt.toDate();
          return orderDate > fiveMinutesAgo && order.orderStatus === 'pending';
        });

        // Show notification for new orders
        if (newOrders.length > 0 && newOrders.length !== newOrdersCount) {
          // Only show notification if the count changed
          if (newOrdersCount > 0) {
            toast({
              title: `${newOrders.length - newOrdersCount} New Order(s)!`,
              description: "You have new orders that need attention.",
              variant: "default",
              duration: 5000,
            });
          }
          setNewOrdersCount(newOrders.length);

          // Request notification permission and show browser notification
          if (typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted' && newOrders.length > newOrdersCount) {
                new Notification('New Orders!', {
                  body: `You have ${newOrders.length - newOrdersCount} new order(s) that need attention.`,
                  icon: '/icons/icon-192x192.png'
                });
              }
            });
          }
        }

        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, newOrdersCount]);

  const handleOrderClick = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
  }

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter(order => order.orderStatus === filterStatus)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Orders</h1>
          <p className="text-gray-500">View and manage all customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          {newOrdersCount > 0 && (
            <Button variant="outline" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {newOrdersCount}
              </span>
            </Button>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const formattedDate = order.createdAt?.toDate ?
                      new Date(order.createdAt.toDate()).toLocaleDateString() :
                      'Unknown date'

                    return (
                      <TableRow
                        key={order.id}
                        className={`cursor-pointer hover:bg-gray-50 ${order.orderStatus === 'pending' ? 'bg-yellow-50' : ''}`}
                        onClick={() => handleOrderClick(order.id)}
                      >
                        <TableCell className="font-medium">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>{order.address?.name || '-'}</TableCell>
                        <TableCell>{order.address?.pincode || '-'}</TableCell>
                        <TableCell>{order.items?.length || 0}</TableCell>
                        <TableCell>₹{order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Badge className={ORDER_STATUS_COLORS[order.orderStatus] || ""}>
                            {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === "paid" ? "outline" : "destructive"} className={order.paymentStatus === "paid" ? "bg-green-100 text-green-800" : ""}>
                            {order.paymentStatus || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOrderClick(order.id)
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 