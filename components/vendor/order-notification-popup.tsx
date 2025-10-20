"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShoppingBag, MapPin, Phone, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface OrderItem {
    id: string
    name: string
    quantity: number
    price: number
    image?: string
}

interface OrderData {
    id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    items: OrderItem[]
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

interface OrderNotificationPopupProps {
    order: OrderData | null
    isVisible: boolean
    onClose: () => void
    onAccept?: (orderId: string) => void
    onReject?: (orderId: string) => void
}

export const OrderNotificationPopup: React.FC<OrderNotificationPopupProps> = ({
    order,
    isVisible,
    onClose,
    onAccept,
    onReject
}) => {
    const [timeRemaining, setTimeRemaining] = useState(30) // 30 seconds to respond
    const [isPlayingSound, setIsPlayingSound] = useState(false)

    // Play notification sound when popup opens
    useEffect(() => {
        if (isVisible && order) {
            setIsPlayingSound(true)

            // Play notification sound
            const audio = new Audio('/sounds/new-order.wav')
            audio.volume = 1.0
            audio.play().catch(err => {
                console.error('Error playing notification sound:', err)
            }).finally(() => {
                setIsPlayingSound(false)
            })

            // Start countdown timer
            setTimeRemaining(30)

            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [isVisible, order])

    // Auto-close after 30 seconds
    useEffect(() => {
        if (timeRemaining === 0) {
            onClose()
        }
    }, [timeRemaining, onClose])

    if (!order || !isVisible) return null

    const formatTime = (seconds: number) => {
        return `${seconds}s`
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        } catch {
            return 'Just now'
        }
    }

    const getTotalItems = () => {
        return order.items.reduce((total, item) => total + item.quantity, 0)
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full max-w-md"
                >
                    <Card className="relative overflow-hidden border-2 border-orange-200 shadow-2xl">
                        {/* Animated border effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 opacity-20 animate-pulse" />

                        {/* Header with pulsing notification indicator */}
                        <CardHeader className="relative bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <ShoppingBag className="h-6 w-6" />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"
                                        />
                                    </div>
                                    <CardTitle className="text-lg font-bold">
                                        New Order!
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatTime(timeRemaining)}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="relative p-6 bg-white">
                            {/* Order details */}
                            <div className="space-y-4">
                                {/* Order number and customer */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                                    </div>
                                    <Badge variant={order.status === 'pending' ? 'destructive' : 'default'}>
                                        {order.status}
                                    </Badge>
                                </div>

                                <Separator />

                                {/* Customer contact */}
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone className="h-4 w-4" />
                                    <span>{order.customerPhone}</span>
                                </div>

                                {/* Delivery address */}
                                <div className="flex items-start gap-3 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4 mt-0.5" />
                                    <div>
                                        <p>{order.deliveryAddress.street || 'Address not specified'}</p>
                                        <p>{order.deliveryAddress.area}, {order.deliveryAddress.city} - {order.pincode}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Order items */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {order.items.slice(0, 3).map((item, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-semibold">₹{item.price * item.quantity}</p>
                                            </div>
                                        ))}
                                        {order.items.length > 3 && (
                                            <p className="text-sm text-gray-500 text-center">
                                                +{order.items.length - 3} more items
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Order summary */}
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        <p>{getTotalItems()} items</p>
                                        <p className="font-semibold text-lg text-gray-900">Total: ₹{order.totalAmount}</p>
                                    </div>
                                    <div className="text-right text-sm text-gray-600">
                                        <p>Ordered at</p>
                                        <p className="font-medium">{formatDate(order.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() => onReject?.(order.id)}
                                        variant="outline"
                                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                        disabled={timeRemaining === 0}
                                    >
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => onAccept?.(order.id)}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        disabled={timeRemaining === 0}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Accept
                                    </Button>
                                </div>

                                {/* Sound indicator */}
                                {isPlayingSound && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-2 right-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                    >
                                        🔊 Playing sound...
                                    </motion.div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}