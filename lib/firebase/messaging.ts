"use client"

import { app } from "./config"
import { getToken, onMessage, getMessaging } from "firebase/messaging"

let messaging: any = null

// Initialize Firebase Cloud Messaging
export const initMessaging = async () => {
  try {
    if (typeof window === "undefined") return null
    
    if (!messaging) {
      const { getMessaging } = await import("firebase/messaging")
      messaging = getMessaging(app)
    }
    
    return messaging
  } catch (error) {
    console.error("Error initializing messaging:", error)
    return null
  }
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    if (typeof window === "undefined") {
      return { success: false, error: "Only available in browser" }
    }

    // Check if browser supports notifications
    if (!("Notification" in window)) {
      return { success: false, error: "This browser does not support notifications" }
    }

    // Check if permission already granted
    if (Notification.permission === "granted") {
      return await getFCMToken()
    }

    // Request permission
    const permission = await Notification.requestPermission()
    
    if (permission === "granted") {
      return await getFCMToken()
    } else {
      return { 
        success: false, 
        error: "Notification permission denied" 
      }
    }
  } catch (error: any) {
    console.error("Error requesting notification permission:", error)
    return { 
      success: false, 
      error: error.message || "Failed to request notification permission" 
    }
  }
}

// Get FCM token
export const getFCMToken = async () => {
  try {
    const messagingInstance = await initMessaging()
    if (!messagingInstance) {
      return { success: false, error: "Messaging not initialized" }
    }

    // Service worker registration
    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration()
    if (!serviceWorkerRegistration) {
      return { success: false, error: "Service worker not registered" }
    }

    // Get token
    const currentToken = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    })

    if (currentToken) {
      return { success: true, token: currentToken }
    } else {
      return { 
        success: false, 
        error: "No registration token available" 
      }
    }
  } catch (error: any) {
    console.error("Error getting FCM token:", error)
    return { 
      success: false, 
      error: error.message || "Failed to get FCM token" 
    }
  }
}

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (typeof window === "undefined") return () => {}
  
  const handleMessage = async () => {
    const messagingInstance = await initMessaging()
    if (!messagingInstance) return () => {}
    
    return onMessage(messagingInstance, (payload) => {
      callback(payload)
      
      // Play notification sound
      const audio = new Audio('/notification-sound.mp3')
      audio.play().catch(err => console.error("Error playing notification sound:", err))
    })
  }
  
  // Return unsubscribe function
  const unsubscribePromise = handleMessage()
  return () => {
    unsubscribePromise.then(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    })
  }
} 