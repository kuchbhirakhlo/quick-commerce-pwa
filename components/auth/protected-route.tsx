"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { useFirebase } from "@/lib/context/firebase-provider"
import LoadingAnimation from "@/components/loading-animation"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isAuthInitialized, isLoading: firebaseLoading } = useFirebase()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Only run after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we're in a loading state
  const loading = !mounted || firebaseLoading || authLoading || !isAuthInitialized

  useEffect(() => {
    // Check if we're on the success page with an orderId
    const isSuccessPage = pathname?.includes('/checkout/success')
    
    if (mounted && !loading && !user) {
      // Add a delay to allow time for any pending auth operations to complete
      const redirectTimer = setTimeout(() => {
        router.push("/")
      }, 1000)
      
      return () => clearTimeout(redirectTimer)
    }
  }, [user, loading, router, mounted, pathname])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingAnimation />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
