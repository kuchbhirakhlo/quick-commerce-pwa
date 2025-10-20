"use server"

import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { vendorId } = body

        console.log("Vendor auth verification request:", { vendorId })

        if (!vendorId) {
            return NextResponse.json({
                success: false,
                authenticated: false,
                error: "Vendor ID is required"
            }, { status: 400 })
        }

        // Check if vendor exists and is active
        const vendorDoc = await getDoc(doc(db, "vendors", vendorId))
        if (!vendorDoc.exists()) {
            return NextResponse.json({
                success: false,
                authenticated: false,
                error: "Vendor not found"
            }, { status: 404 })
        }

        const vendorData = vendorDoc.data()

        // Check if vendor is active
        if (vendorData?.status !== "active") {
            return NextResponse.json({
                success: false,
                authenticated: false,
                error: "Vendor account is not active",
                status: vendorData?.status || "unknown"
            }, { status: 403 })
        }

        // Try to verify Firebase Auth token if available
        let firebaseAuthenticated = false
        try {
            const auth = getAuth()
            const user = auth.currentUser

            if (user) {
                // Check if the authenticated user matches the vendor
                const userVendorDoc = await getDoc(doc(db, "vendors", user.uid))
                if (userVendorDoc.exists()) {
                    firebaseAuthenticated = true
                } else {
                    // Try with vendor_ prefix
                    const prefixedVendorDoc = await getDoc(doc(db, "vendors", `vendor_${user.uid}`))
                    if (prefixedVendorDoc.exists()) {
                        firebaseAuthenticated = true
                    }
                }
            }
        } catch (authError) {
            console.error("Firebase auth verification error:", authError)
            // Continue with vendor document verification
        }

        console.log(`Vendor auth verification successful for ${vendorId}`)

        return NextResponse.json({
            success: true,
            authenticated: true,
            vendor: {
                id: vendorDoc.id,
                name: vendorData?.name || "Unknown Vendor",
                email: vendorData?.email || "",
                phone: vendorData?.phone || "",
                status: vendorData?.status || "unknown",
                isOpen: vendorData?.isOpen || false,
                pincodes: vendorData?.pincodes || [],
                profileComplete: vendorData?.profileComplete || false
            },
            firebaseAuthenticated,
            verifiedAt: new Date().toISOString()
        })

    } catch (error) {
        console.error("Error verifying vendor auth:", error)
        return NextResponse.json({
            success: false,
            authenticated: false,
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}