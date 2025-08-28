"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CartProvider } from "@/lib/hooks/use-cart"
import { AuthProvider } from "@/lib/context/auth-context"
import { FirebaseProvider } from "@/lib/context/firebase-provider"

// Create a client-only wrapper component
const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient ? <>{children}</> : null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClientOnly>
      <FirebaseProvider>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </FirebaseProvider>
    </ClientOnly>
  )
}
