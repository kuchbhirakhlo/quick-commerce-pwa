"use client"

import { useState, useEffect, useCallback } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import { vendorNotificationService } from "@/lib/firebase/notification-service"

interface OrderData {
    id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    items: Array<{
        id: string
        name: string
        quantity: number
        price: number
    }>
    totalAmount: number
    deliveryAddress: {
        street?: string
        area?: string
        city?: string
        pincode?: string
    }
    status: string
    createdAt: string
    pincode: string
}

interface UseVendorNotificationsReturn {
    currentOrder: OrderData | null
    isPopupVisible: boolean
    showNotificationPopup: (order: OrderData) => void
    hideNotificationPopup: () => void
    acceptOrder: (orderId: string) => Promise<void>
    rejectOrder: (orderId: string) => Promise<void>
    pendingOrders: OrderData[]
    clearPendingOrders: () => void
}

interface UseVendorNotificationsOptions {
    showPopup?: boolean
}

export const useVendorNotifications = (options: UseVendorNotificationsOptions = {}): UseVendorNotificationsReturn => {
    const { vendor } = useVendor()
    const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null)
    const [isPopupVisible, setIsPopupVisible] = useState(false)
    const [pendingOrders, setPendingOrders] = useState<OrderData[]>([])
    const { showPopup = true } = options

    // Show notification popup for new order
    const showNotificationPopup = useCallback((order: OrderData) => {
        setCurrentOrder(order)

        // Only show popup if showPopup is enabled (for dashboard page)
        if (showPopup) {
            setIsPopupVisible(true)
        }

        // Add to pending orders if not already there
        setPendingOrders(prev => {
            if (!prev.find(o => o.id === order.id)) {
                return [...prev, order]
            }
            return prev
        })

        // Play notification sound (always play sound for new orders)
        vendorNotificationService.playOrderSound()

        // Trigger vibration on mobile (always vibrate for new orders)
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200])
        }
    }, [showPopup])

    // Hide notification popup
    const hideNotificationPopup = useCallback(() => {
        setIsPopupVisible(false)
        setCurrentOrder(null)
    }, [])

    // Accept order
    const acceptOrder = useCallback(async (orderId: string) => {
        try {
            const response = await fetch(`/api/vendor/orders/${orderId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vendorId: vendor?.id,
                    acceptedAt: new Date().toISOString()
                })
            })

            if (response.ok) {
                // Remove from pending orders
                setPendingOrders(prev => prev.filter(order => order.id !== orderId))

                // Update order status in current order if it's the same
                if (currentOrder?.id === orderId) {
                    setCurrentOrder(prev => prev ? { ...prev, status: 'confirmed' } : null)
                }

                // Show success feedback
                vendorNotificationService.showVendorNotification(
                    'Order Accepted',
                    'Order has been accepted successfully',
                    { type: 'success' }
                )

                // Auto-hide popup after 2 seconds
                setTimeout(() => {
                    hideNotificationPopup()
                }, 2000)
            } else {
                throw new Error('Failed to accept order')
            }
        } catch (error) {
            console.error('Error accepting order:', error)
            vendorNotificationService.showVendorNotification(
                'Error',
                'Failed to accept order. Please try again.',
                { type: 'error' }
            )
        }
    }, [vendor?.id, currentOrder, hideNotificationPopup])

    // Reject order
    const rejectOrder = useCallback(async (orderId: string) => {
        try {
            const response = await fetch(`/api/vendor/orders/${orderId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vendorId: vendor?.id,
                    rejectedAt: new Date().toISOString(),
                    reason: 'Rejected by vendor'
                })
            })

            if (response.ok) {
                // Remove from pending orders
                setPendingOrders(prev => prev.filter(order => order.id !== orderId))

                // Update order status in current order if it's the same
                if (currentOrder?.id === orderId) {
                    setCurrentOrder(prev => prev ? { ...prev, status: 'cancelled' } : null)
                }

                // Show feedback
                vendorNotificationService.showVendorNotification(
                    'Order Rejected',
                    'Order has been rejected',
                    { type: 'info' }
                )

                // Auto-hide popup after 2 seconds
                setTimeout(() => {
                    hideNotificationPopup()
                }, 2000)
            } else {
                throw new Error('Failed to reject order')
            }
        } catch (error) {
            console.error('Error rejecting order:', error)
            vendorNotificationService.showVendorNotification(
                'Error',
                'Failed to reject order. Please try again.',
                { type: 'error' }
            )
        }
    }, [vendor?.id, currentOrder, hideNotificationPopup])

    // Clear all pending orders
    const clearPendingOrders = useCallback(() => {
        setPendingOrders([])
    }, [])

    // Listen for push notifications and background sync messages
    useEffect(() => {
        if (!vendor) return

        // Listen for service worker messages
        const handleServiceWorkerMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NEW_ORDER_NOTIFICATION') {
                const orderData = event.data.order
                if (orderData) {
                    showNotificationPopup(orderData)
                }
            }
        }

        navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)

        // Listen for Firebase foreground messages
        const handleForegroundMessage = (payload: any) => {
            if (payload.data?.type === 'new_order' && payload.data?.orderData) {
                try {
                    const orderData = JSON.parse(payload.data.orderData)
                    showNotificationPopup(orderData)
                } catch (error) {
                    console.error('Error parsing order data from notification:', error)
                }
            }
        }

        // Set up foreground message listener using Firebase messaging directly
        const setupForegroundMessaging = async () => {
            try {
                const { onForegroundMessage } = await import('@/lib/firebase/messaging')
                return onForegroundMessage(handleForegroundMessage)
            } catch (error) {
                console.error('Error setting up foreground messaging:', error)
                return () => { }
            }
        }

        let unsubscribe: (() => void) | undefined
        setupForegroundMessaging().then(unsub => {
            unsubscribe = unsub
        })

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
            if (typeof unsubscribe === 'function') {
                unsubscribe()
            }
        }
    }, [vendor, showNotificationPopup])

    // Periodic order checking when app is in foreground
    useEffect(() => {
        if (!vendor) return

        const checkForNewOrders = async () => {
            try {
                const response = await fetch('/api/vendor/orders/check-new', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        vendorId: vendor.id,
                        timestamp: Date.now() - 60000 // Check last minute
                    })
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.hasNewOrders && data.orders.length > 0) {
                        // Show notification for the first new order
                        const newOrder = data.orders[0]
                        if (!pendingOrders.find(order => order.id === newOrder.id)) {
                            showNotificationPopup(newOrder)
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking for new orders:', error)
            }
        }

        // Check immediately
        checkForNewOrders()

        // Check every 30 seconds
        const interval = setInterval(checkForNewOrders, 30000)

        return () => clearInterval(interval)
    }, [vendor, pendingOrders, showNotificationPopup])

    return {
        currentOrder,
        isPopupVisible,
        showNotificationPopup,
        hideNotificationPopup,
        acceptOrder,
        rejectOrder,
        pendingOrders,
        clearPendingOrders
    }
}
