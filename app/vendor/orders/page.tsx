"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase/config"
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore"
import { useVendor } from "@/lib/context/vendor-provider"
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
import OrderNotification from "@/components/vendor/order-notification"
import { notificationService } from "@/lib/firebase/notification-service"

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

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string
  createdAt: Timestamp
  userId: string
  items: OrderItem[]
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
  vendorId: string
}

export default function VendorOrders() {
  const router = useRouter()
  const { vendor } = useVendor()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vendor || !vendor.pincodes || vendor.pincodes.length === 0) return

    setLoading(true)
    setError(null)

    // Get orders for this vendor
    const ordersQuery = query(
      collection(db, "orders"),
      where("vendorId", "==", vendor.id),
      orderBy("createdAt", "desc")
    )

    // Set up a snapshot listener
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        try {
          const ordersData = snapshot.docs
            .map(doc => {
              try {
                const data = doc.data();
                const docId = doc.id;

                // Create a safe order object with defaults for missing values
                return {
                  id: docId,
                  createdAt: data.createdAt || Timestamp.now(),
                  userId: data.userId || "",
                  vendorId: data.vendorId || "",
                  items: Array.isArray(data.items) ? data.items.map(item => ({
                    productId: item.productId || "",
                    name: item.name || "Unknown Product",
                    price: typeof item.price === 'number' ? item.price : 0,
                    quantity: typeof item.quantity === 'number' ? item.quantity : 1
                  })) : [],
                  totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
                  deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
                  address: {
                    name: data.address?.name || "Unknown",
                    phone: data.address?.phone || "",
                    address: data.address?.address || "",
                    pincode: data.address?.pincode || "",
                    city: data.address?.city || ""
                  },
                  paymentMethod: data.paymentMethod || "cod",
                  paymentStatus: data.paymentStatus || "pending",
                  orderStatus: data.orderStatus || "pending"
                } as Order;
              } catch (err) {
                console.error("Error processing order document:", err, doc.id);
                return null;
              }
            })
            .filter(order => order !== null); // Remove any orders that failed to process

          // Check for new orders in the last 5 minutes
          const fiveMinutesAgo = new Date();
          fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

          const newOrders = ordersData.filter(order => {
            if (!order.createdAt) return false;
            try {
              const orderDate = order.createdAt.toDate();
              return orderDate > fiveMinutesAgo && order.orderStatus === 'pending';
            } catch (err) {
              console.error("Error converting timestamp:", err);
              return false;
            }
          });

          // Show notification for new orders
          if (newOrders.length > 0) {
            const previousCount = newOrdersCount;
            const currentCount = newOrders.length;

            // Only show notification if the count changed (new orders arrived)
            if (currentCount > previousCount) {
              const newOrderCount = currentCount - previousCount;

              console.log(`New orders detected: ${newOrderCount} new orders`);

              // Show toast notification
              toast({
                title: `${newOrderCount} New Order(s)!`,
                description: "You have new orders that need attention.",
                variant: "default",
                duration: 5000,
              });

              // Show browser notification and play loud sound
              if (newOrderCount > 0 && window.vendorNotificationPermission === 'granted') {
                // Get the newest order
                const newestOrder = newOrders[0];
                const orderNumber = newestOrder.id.slice(0, 8).toUpperCase();

                console.log('Triggering loud notification for order:', orderNumber);

                // Play loud notification sound first
                const playLoudNotificationSound = function () {
                  try {
                    // Try primary audio first
                    if (window.vendorNotificationAudio) {
                      window.vendorNotificationAudio.currentTime = 0;
                      window.vendorNotificationAudio.volume = 1.0;
                      window.vendorNotificationAudio.play().catch(err => {
                        console.log('Primary audio failed, trying backup:', err);
                        // Try backup audio if primary fails
                        if (window.vendorNotificationAudioBackup) {
                          window.vendorNotificationAudioBackup.currentTime = 0;
                          window.vendorNotificationAudioBackup.volume = 1.0;
                          window.vendorNotificationAudioBackup.play().catch(err2 => {
                            console.error('Both audio instances failed:', err2);
                          });
                        }
                      });
                    }
                  } catch (err) {
                    console.error('Error playing notification sound:', err);
                  }
                };

                // Play sound immediately
                playLoudNotificationSound();

                // Show notification with enhanced options
                notificationService.showNewOrderNotification(
                  newestOrder.id,
                  orderNumber
                ).then(success => {
                  console.log('Notification result:', success);
                  // Play sound again when notification is shown
                  if (success) {
                    playLoudNotificationSound();
                  }
                }).catch(err => {
                  console.error('Notification error:', err);
                  // Still play sound even if notification fails
                  playLoudNotificationSound();
                });
              } else {
                console.log('Notification permission not granted or no new orders');
              }
            }

            setNewOrdersCount(currentCount);
          } else {
            // No new orders, reset count
            if (newOrdersCount > 0) {
              setNewOrdersCount(0);
            }
          }

          setOrders(ordersData);
          setLoading(false);
        } catch (error) {
          console.error("Error processing orders:", error);
          setError("Failed to process orders data. Please refresh the page.");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders. Please check your connection and refresh the page.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [vendor, toast]);

  const handleOrderClick = (orderId: string) => {
    router.push(`/vendor/orders/${orderId}`)
  }

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter(order => order.orderStatus === filterStatus)

  if (!vendor) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading vendor information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500">Manage orders for your delivery areas</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <OrderNotification
            newOrdersCount={newOrdersCount}
            onClick={() => setFilterStatus('pending')}
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
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

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md my-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-center">No orders found</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              {filterStatus === "all"
                ? "You don't have any orders yet."
                : `You don't have any ${ORDER_STATUS_LABELS[filterStatus as keyof typeof ORDER_STATUS_LABELS].toLowerCase()} orders.`}
            </p>
            {filterStatus !== "all" && (
              <Button variant="outline" className="mt-4" onClick={() => setFilterStatus("all")}>
                View all orders
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile view - card list */}
          <div className="grid gap-4 md:hidden">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="cursor-pointer" onClick={() => handleOrderClick(order.id)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">
                        {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'Unknown date'}
                      </p>
                    </div>
                    <Badge className={ORDER_STATUS_COLORS[order.orderStatus]}>
                      {ORDER_STATUS_LABELS[order.orderStatus]}
                    </Badge>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-gray-600">Customer:</p>
                      <p className="text-sm font-medium">{order.address?.name || "Unknown"}</p>
                    </div>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-gray-600">Items:</p>
                      <p className="text-sm font-medium">{order.items?.length || 0}</p>
                    </div>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-gray-600">Total:</p>
                      <p className="text-sm font-medium">₹{order.totalAmount?.toFixed(2) || 0}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">Payment:</p>
                      <p className="text-sm font-medium capitalize">{order.paymentMethod}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop view - table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <TableCell className="font-medium">
                      {order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>{order.address?.name || "Unknown"}</TableCell>
                    <TableCell>
                      {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'Unknown date'}
                    </TableCell>
                    <TableCell>
                      <Badge className={ORDER_STATUS_COLORS[order.orderStatus]}>
                        {ORDER_STATUS_LABELS[order.orderStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {order.paymentMethod}
                      <span className="text-xs ml-1 capitalize">
                        ({order.paymentStatus})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{order.totalAmount?.toFixed(2) || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
} 