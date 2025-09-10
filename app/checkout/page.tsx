"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import BannerCardsDisplay from "@/components/banner-cards-display"
import LoginModal from "@/components/auth/login-modal"
import CheckoutForm from "@/components/checkout/checkout-form"

export default function CheckoutPage() {
  const { cartItems, cartCount } = useCart()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Redirect to home if cart is empty or user is not logged in
  useEffect(() => {
    setMounted(true)

    if (mounted && !loading) {
      if (!user) {
        // Show login modal instead of redirecting
        setShowLoginModal(true)
      } else if (cartCount === 0) {
        router.push('/')
      }
    }
  }, [user, cartCount, loading, mounted, router])

  // Handle empty cart redirect - moved outside of conditional rendering
  useEffect(() => {
    if (mounted && !loading && user && cartCount === 0) {
      router.push('/')
    }
  }, [mounted, loading, user, cartCount, router])

  if (!mounted || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </main>
    )
  }

  // If user is not logged in, show login modal
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-lg mb-4">Please log in to proceed with checkout</p>
              <Button
                onClick={() => setShowLoginModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
        {showLoginModal && (
          <LoginModal
            onClose={() => {
              setShowLoginModal(false);
              // If still not logged in after closing modal, redirect to home
              if (!user) {
                router.push('/');
              }
            }}
          />
        )}
      </main>
    )
  }

  // If cart is empty, show loading and let the useEffect handle the redirect
  if (cartCount === 0) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 px-4 max-w-lg">
        <h1 className="text-xl font-bold mb-4">Checkout</h1>

        {/* Cart Items Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-base font-semibold mb-3">Your Items</h2>

          <div className="max-h-48 overflow-y-auto">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center py-2 border-b last:border-0">
                <div className="w-12 h-12 relative rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout Form */}
        <CheckoutForm />

        {/* Bottom banner */}
        <div className="mt-8">
          <BannerCardsDisplay position="bottom" />
        </div>
      </div>
    </main>
  )
}
