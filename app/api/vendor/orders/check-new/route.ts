"use server"

import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase/auth"
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { vendorId, timestamp, source } = body

        console.log("Vendor order check request:", { vendorId, timestamp, source })

        // If vendorId is provided in request body, use it
        // Otherwise, try to get it from authentication
        let targetVendorId = vendorId

        if (!targetVendorId) {
            // Try to get vendor ID from authentication if available
            try {
                const auth = getAuth()
                const user = auth.currentUser

                if (user) {
                    // Try to find vendor document by user ID
                    const vendorDoc = await getDoc(doc(db, "vendors", user.uid))
                    if (vendorDoc.exists()) {
                        targetVendorId = vendorDoc.id
                    } else {
                        // Try with vendor_ prefix
                        const prefixedVendorDoc = await getDoc(doc(db, "vendors", `vendor_${user.uid}`))
                        if (prefixedVendorDoc.exists()) {
                            targetVendorId = prefixedVendorDoc.id
                        }
                    }
                }
            } catch (authError) {
                console.error("Auth error:", authError)
            }
        }

        if (!targetVendorId) {
            return NextResponse.json({
                success: false,
                error: "No vendor ID provided or authenticated"
            }, { status: 400 })
        }

        // Get vendor data to check pincodes/service areas
        const vendorDoc = await getDoc(doc(db, "vendors", targetVendorId))
        if (!vendorDoc.exists()) {
            return NextResponse.json({
                success: false,
                error: "Vendor not found"
            }, { status: 404 })
        }

        const vendorData = vendorDoc.data()
        const vendorPincodes = vendorData?.pincodes || []

        if (vendorPincodes.length === 0) {
            return NextResponse.json({
                success: true,
                hasNewOrders: false,
                orders: [],
                message: "No service areas configured"
            })
        }

        // Parse timestamp for new orders check
        const sinceTimestamp = timestamp ? new Date(parseInt(timestamp)) : new Date(Date.now() - 24 * 60 * 60 * 1000) // Default to last 24 hours

        console.log("Checking orders since:", sinceTimestamp)

        // Query orders for vendor's service areas
        const ordersRef = collection(db, "orders")
        const ordersQuery = query(
            ordersRef,
            where("vendorId", "==", targetVendorId),
            where("status", "in", ["pending", "confirmed"]),
            where("createdAt", ">=", Timestamp.fromDate(sinceTimestamp)),
            orderBy("createdAt", "desc"),
            limit(50)
        )

        const querySnapshot = await getDocs(ordersQuery)
        const orders: Array<{
            id: string;
            orderNumber: string;
            customerName: string;
            customerPhone: string;
            items: any[];
            totalAmount: number;
            deliveryAddress: any;
            status: string;
            createdAt: string;
            pincode: string;
        }> = []

        querySnapshot.forEach((doc) => {
            const orderData = doc.data()
            orders.push({
                id: doc.id,
                orderNumber: orderData.orderNumber || doc.id.substring(0, 8).toUpperCase(),
                customerName: orderData.customerName || "Unknown Customer",
                customerPhone: orderData.customerPhone || "",
                items: orderData.items || [],
                totalAmount: orderData.totalAmount || 0,
                deliveryAddress: orderData.deliveryAddress || {},
                status: orderData.status || "pending",
                createdAt: orderData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                pincode: orderData.pincode || ""
            })
        })

        console.log(`Found ${orders.length} orders for vendor ${targetVendorId}`)

        return NextResponse.json({
            success: true,
            hasNewOrders: orders.length > 0,
            orders: orders,
            totalCount: orders.length,
            vendorId: targetVendorId,
            checkedAt: new Date().toISOString()
        })

    } catch (error) {
        console.error("Error checking vendor orders:", error)
        return NextResponse.json({
            success: false,
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}