"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useVendor } from "@/lib/context/vendor-provider";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, User, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const ORDER_STATUS_SEQUENCE = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered"
];

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: { [key: string]: string };
  image?: string;
}

interface Order {
  id: string;
  createdAt: Timestamp;
  userId: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  address: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
    city: string;
  };
  paymentMethod: "cod" | "online";
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: keyof typeof ORDER_STATUS_COLORS;
  notes?: string;
  updatedAt?: Timestamp;
  deliveryPersonId?: string;
}

export default function OrderDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { vendor } = useVendor();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the order ID from params
  const orderId = (params?.id as unknown as string) || "";

  useEffect(() => {
    if (!vendor || !orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const orderDoc = await getDoc(doc(db, "orders", orderId));

        if (orderDoc.exists()) {
          const orderData = orderDoc.data();

          // Check if this order belongs to the current vendor
          if (orderData.vendorId && orderData.vendorId !== vendor.id) {
            console.error("Order does not belong to this vendor");
            setError("You do not have permission to view this order.");
            setLoading(false);
            return;
          }

          // Ensure all required fields exist with defaults
          const safeOrderData = {
            id: orderDoc.id,
            createdAt: orderData.createdAt || Timestamp.now(),
            userId: orderData.userId || "",
            vendorId: orderData.vendorId || "",
            items: Array.isArray(orderData.items) ? orderData.items.map(item => ({
              productId: item.productId || "",
              name: item.name || "Unknown Product",
              price: typeof item.price === 'number' ? item.price : 0,
              quantity: typeof item.quantity === 'number' ? item.quantity : 1,
              options: item.options || {},
              image: item.image || ""
            })) : [],
            totalAmount: typeof orderData.totalAmount === 'number' ? orderData.totalAmount : 0,
            deliveryFee: typeof orderData.deliveryFee === 'number' ? orderData.deliveryFee : 0,
            address: {
              name: orderData.address?.name || "Unknown",
              phone: orderData.address?.phone || "",
              address: orderData.address?.address || "",
              pincode: orderData.address?.pincode || "",
              city: orderData.address?.city || ""
            },
            paymentMethod: orderData.paymentMethod || "cod",
            paymentStatus: orderData.paymentStatus || "pending",
            orderStatus: orderData.orderStatus || "pending",
            notes: orderData.notes || "",
            updatedAt: orderData.updatedAt
          };

          // Check if order has address and items
          if (!orderData.address) {
            console.error("Order is missing address data");
            setError("Order data is incomplete. Missing address information.");
          }

          if (!orderData.items || orderData.items.length === 0) {
            console.error("Order has no items");
            setError("Order data is incomplete. No items found.");
          }

          setOrder(safeOrderData as Order);
        } else {
          console.error("Order not found");
          setError("Order not found");
        }
      } catch (error: any) {
        console.error("Error fetching order:", error);
        setError(`Error loading order: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, vendor]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order || updating || !newStatus) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        orderStatus: newStatus,
        updatedAt: Timestamp.now()
      });

      setOrder({
        ...order,
        orderStatus: newStatus as keyof typeof ORDER_STATUS_COLORS,
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      console.error("Error updating order status:", error);
      setError(`Failed to update order status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || updating) return;

    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        orderStatus: "cancelled",
        updatedAt: Timestamp.now()
      });

      setOrder({
        ...order,
        orderStatus: "cancelled",
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      setError(`Failed to cancel order: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = () => {
    if (!order) return null;

    const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.orderStatus);

    if (currentIndex === -1 || currentIndex === ORDER_STATUS_SEQUENCE.length - 1) {
      return null;
    }

    return ORDER_STATUS_SEQUENCE[currentIndex + 1];
  };

  if (!vendor) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Loading vendor information...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Order not found</p>
      </div>
    );
  }

  // Safely format date
  const formattedDate = order.createdAt?.toDate ?
    new Date(order.createdAt.toDate()).toLocaleString() :
    'Unknown date';

  const nextStatus = getNextStatus();

  // Calculate subtotal safely
  const subtotal = order.items.reduce((sum, item) => {
    const price = typeof item.price === 'number' ? item.price : 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    return sum + (price * quantity);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>

        <Badge className={`${ORDER_STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'} text-sm px-3 py-1 rounded-full`}>
          {ORDER_STATUS_LABELS[order.orderStatus] || 'Unknown Status'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">{item.name || "Unknown Product"}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity || 0} × ₹{(item.price || 0).toFixed(2)}
                      </div>
                      {item.options && Object.entries(item.options).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(item.options).map(([key, value]) => (
                            <span key={key}>
                              {key}: {value}
                            </span>
                          )).reduce((prev, curr) => (
                            <>
                              {prev}, {curr}
                            </>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>₹{(order.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>₹{(order.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {nextStatus && (
                    <Button
                      onClick={() => handleUpdateStatus(nextStatus)}
                      disabled={updating || order.orderStatus === "cancelled"}
                    >
                      Mark as {ORDER_STATUS_LABELS[nextStatus as keyof typeof ORDER_STATUS_LABELS] || nextStatus}
                    </Button>
                  )}

                  {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelOrder}
                      disabled={updating}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <User className="mr-2 h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-medium">{order.address?.name || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">Customer</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="mr-2 h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-medium">{order.address?.phone || "No phone provided"}</div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-medium">{order.address?.address || "No address provided"}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.address?.city || ""}{order.address?.city && order.address?.pincode ? ", " : ""}{order.address?.pincode || ""}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CreditCard className="mr-2 h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                    </div>
                    <div className="text-sm text-muted-foreground">Payment Method</div>
                  </div>
                </div>

                <div>
                  <Badge className={
                    order.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                      order.paymentStatus === "failed" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                  }>
                    {order.paymentStatus === "paid" ? "Paid" :
                      order.paymentStatus === "failed" ? "Failed" :
                        "Pending"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 