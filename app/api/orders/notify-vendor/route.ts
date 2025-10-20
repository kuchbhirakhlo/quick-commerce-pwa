"use server"

import { NextRequest, NextResponse } from "next/server"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { getAdminMessaging } from "@/lib/firebase/admin"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, vendorId } = body

        console.log("Order notification request:", { orderId, vendorId })

        if (!orderId || !vendorId) {
            return NextResponse.json({
                success: false,
                error: "Order ID and Vendor ID are required"
            }, { status: 400 })
        }

        // Get order details
        const orderDoc = await getDoc(doc(db, "orders", orderId))
        if (!orderDoc.exists()) {
            return NextResponse.json({
                success: false,
                error: "Order not found"
            }, { status: 404 })
        }

        const orderData = orderDoc.data()

        // Get vendor FCM token
        const vendorTokenDoc = await getDoc(doc(db, "vendor_tokens", `${vendorId}_web`))
        let fcmToken = null

        if (vendorTokenDoc.exists()) {
            const tokenData = vendorTokenDoc.data()
            if (tokenData.active && tokenData.token) {
                fcmToken = tokenData.token
            }
        }

        // If no FCM token found, try mobile token
        if (!fcmToken) {
            const mobileTokenDoc = await getDoc(doc(db, "vendor_tokens", `${vendorId}_mobile`))
            if (mobileTokenDoc.exists()) {
                const tokenData = mobileTokenDoc.data()
                if (tokenData.active && tokenData.token) {
                    fcmToken = tokenData.token
                }
            }
        }

        if (!fcmToken) {
            console.log(`No FCM token found for vendor ${vendorId}`)
            return NextResponse.json({
                success: false,
                error: "Vendor FCM token not found"
            }, { status: 404 })
        }

        // Prepare notification payload
        const orderNumber = orderData.orderNumber || orderId.substring(0, 8).toUpperCase()
        const customerName = orderData.customerName || "Unknown Customer"
        const totalAmount = orderData.totalAmount || 0
        const itemCount = orderData.items ? orderData.items.length : 0

        const notificationPayload = {
            token: fcmToken,
            notification: {
                title: "New Order Received! 🎉",
                body: `${customerName} placed order #${orderNumber} (${itemCount} items, ₹${totalAmount})`,
                icon: "/icons/vendor-icon-192x192.gif",
                badge: "/icons/vendor-icon-192x192.gif",
                tag: "vendor-order",
                requireInteraction: true,
                sound: "default"
            },
            data: {
                orderId: orderId,
                vendorId: vendorId,
                orderNumber: orderNumber,
                customerName: customerName,
                totalAmount: totalAmount.toString(),
                itemCount: itemCount.toString(),
                url: `/vendor/orders/${orderId}`,
                type: "new_order",
                timestamp: new Date().toISOString(),
                click_action: `/vendor/orders/${orderId}`
            },
            webpush: {
                headers: {
                    "TTL": "3600" // 1 hour
                },
                notification: {
                    title: "New Order Received! 🎉",
                    body: `${customerName} placed order #${orderNumber} (${itemCount} items, ₹${totalAmount})`,
                    icon: "/icons/vendor-icon-192x192.gif",
                    badge: "/icons/vendor-icon-192x192.gif",
                    tag: "vendor-order",
                    requireInteraction: true,
                    actions: [
                        {
                            action: "view",
                            title: "View Order",
                            icon: "/icons/vendor-icon-192x192.gif"
                        },
                        {
                            action: "dismiss",
                            title: "Dismiss"
                        }
                    ]
                },
                data: {
                    url: `/vendor/orders/${orderId}`,
                    orderId: orderId
                }
            },
            android: {
                notification: {
                    title: "New Order Received! 🎉",
                    body: `${customerName} placed order #${orderNumber}`,
                    icon: "vendor_icon",
                    color: "#f59e0b",
                    sound: "default",
                    tag: "vendor-order",
                    priority: "high" as const,
                    default_sound: true,
                    default_vibrate_timings: true
                }
            },
            apns: {
                headers: {
                    "apns-priority": "10",
                    "apns-expiration": "1604750400"
                },
                payload: {
                    aps: {
                        alert: {
                            title: "New Order Received! 🎉",
                            body: `${customerName} placed order #${orderNumber} (${itemCount} items, ₹${totalAmount})`
                        },
                        badge: 1,
                        sound: "default",
                        category: "NEW_ORDER",
                        "mutable-content": 1
                    }
                }
            }
        }

        // Send notification via Firebase Admin SDK
        try {
            const messaging = await getAdminMessaging()
            if (!messaging) {
                return NextResponse.json({
                    success: false,
                    error: "Firebase messaging not available"
                }, { status: 500 })
            }

            const response = await messaging.send(notificationPayload)
            console.log("Notification sent successfully:", response)

            // Update order with notification sent timestamp
            const { updateDoc } = await import("firebase/firestore")
            await updateDoc(orderDoc.ref, {
                notificationSentAt: new Date(),
                notificationMessageId: response
            })

            return NextResponse.json({
                success: true,
                message: "Notification sent successfully",
                messageId: response,
                orderId,
                vendorId,
                sentAt: new Date().toISOString()
            })

        } catch (firebaseError) {
            console.error("Firebase notification error:", firebaseError)
            return NextResponse.json({
                success: false,
                error: "Failed to send notification",
                details: firebaseError instanceof Error ? firebaseError.message : "Unknown Firebase error"
            }, { status: 500 })
        }

    } catch (error) {
        console.error("Error sending vendor notification:", error)
        return NextResponse.json({
            success: false,
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}