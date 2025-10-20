"use server"

import { NextRequest, NextResponse } from "next/server"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, vendorId, platform = 'web' } = body

    console.log("Vendor FCM token registration:", { vendorId, platform, tokenLength: token?.length })

    // Validate required fields
    if (!token) {
      return NextResponse.json({
        success: false,
        error: "FCM token is required"
      }, { status: 400 })
    }

    if (!vendorId) {
      return NextResponse.json({
        success: false,
        error: "Vendor ID is required"
      }, { status: 400 })
    }

    // Verify vendor exists
    const vendorDoc = await getDoc(doc(db, "vendors", vendorId))
    if (!vendorDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: "Vendor not found"
      }, { status: 404 })
    }

    // Store FCM token for vendor
    const tokenData = {
      token,
      vendorId,
      platform,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      active: true,
      lastUsed: serverTimestamp()
    }

    // Store in vendor_tokens collection
    const tokenRef = doc(db, "vendor_tokens", `${vendorId}_${platform}`)
    await setDoc(tokenRef, tokenData, { merge: true })

    // Also update vendor document with token info
    const vendorRef = doc(db, "vendors", vendorId)
    await setDoc(vendorRef, {
      fcmToken: token,
      fcmTokenPlatform: platform,
      fcmTokenUpdatedAt: serverTimestamp(),
      notificationEnabled: true
    }, { merge: true })

    console.log(`FCM token registered successfully for vendor ${vendorId}`)

    return NextResponse.json({
      success: true,
      message: "FCM token registered successfully",
      vendorId,
      platform,
      registeredAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error registering vendor FCM token:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Handle token unregistration
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, vendorId, platform = 'web' } = body

    if (!vendorId) {
      return NextResponse.json({
        success: false,
        error: "Vendor ID is required"
      }, { status: 400 })
    }

    // Remove FCM token from vendor_tokens collection
    const tokenRef = doc(db, "vendor_tokens", `${vendorId}_${platform}`)
    await setDoc(tokenRef, {
      active: false,
      unregisteredAt: serverTimestamp()
    }, { merge: true })

    // Update vendor document
    const vendorRef = doc(db, "vendors", vendorId)
    await setDoc(vendorRef, {
      fcmToken: null,
      fcmTokenPlatform: null,
      fcmTokenUpdatedAt: serverTimestamp(),
      notificationEnabled: false
    }, { merge: true })

    console.log(`FCM token unregistered successfully for vendor ${vendorId}`)

    return NextResponse.json({
      success: true,
      message: "FCM token unregistered successfully",
      vendorId,
      platform
    })

  } catch (error) {
    console.error("Error unregistering vendor FCM token:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}