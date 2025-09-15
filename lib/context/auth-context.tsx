"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { onAuthStateChange, signOut, getCurrentUser } from "@/lib/firebase/auth"
import { useFirebase } from "./firebase-provider"
import { getAuth, getRedirectResult } from "firebase/auth"

interface User {
  uid: string
  phoneNumber: string | null
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<{ success: boolean; error?: any }>
  refreshAuthState: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthInitialized, isLoading: firebaseLoading } = useFirebase()

  // Helper to convert Firebase user -> our User object
  const mapUser = (authUser: any): User => ({
    uid: authUser.uid,
    phoneNumber: authUser.phoneNumber,
    displayName: authUser.displayName || null,
    email: authUser.email || null,
    photoURL: authUser.photoURL || null,
  })

  // Function to manually refresh auth state
  const refreshAuthState = useCallback(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(mapUser(currentUser))
    } else {
      setUser(null)
    }
  }, [])

  // Handle redirect results (Google/Phone etc.)
  useEffect(() => {
    const checkRedirectResult = async () => {
      if (typeof window !== "undefined" && isAuthInitialized && !firebaseLoading) {
        try {
          const auth = getAuth()
          const result = await getRedirectResult(auth)

          if (result?.user) {
            console.log("Redirect sign-in success:", result.user.displayName || result.user.phoneNumber)
            setUser(mapUser(result.user))
            refreshAuthState()

            // Handle redirect to checkout if needed
            const shouldRedirect = localStorage.getItem("redirect_to_checkout")
            if (shouldRedirect === "true") {
              localStorage.removeItem("redirect_to_checkout")
              setTimeout(() => {
                window.location.href = "/checkout"
              }, 500)
            }
          }
        } catch (error) {
          console.error("Error checking redirect result:", error)
        } finally {
          // Ensure loading is cleared after handling redirect flow so UI updates on mobile
          setLoading(false)
        }
      }
    }
    checkRedirectResult()
  }, [isAuthInitialized, firebaseLoading])

  // Subscribe to Firebase auth state
  useEffect(() => {
    if (typeof window === "undefined") return

    // Dev mode: check for mock user in localStorage
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
      const devUser = localStorage.getItem("dev-auth-user")
      if (devUser) {
        try {
          setUser(JSON.parse(devUser))
        } catch (e) {
          console.error("Error parsing dev user:", e)
        }
      }
      setLoading(false)
      return
    }

    if (isAuthInitialized && !firebaseLoading) {
      const unsubscribe = onAuthStateChange((authUser) => {
        if (authUser) {
          setUser(mapUser(authUser))
        } else {
          setUser(null)
        }
        setLoading(false)
      })
      return () => unsubscribe?.()
    } else if (!firebaseLoading) {
      setLoading(false)
    }
  }, [isAuthInitialized, firebaseLoading])

  // Custom signOut
  const handleSignOut = async () => {
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
      localStorage.removeItem("dev-auth-user")
      setUser(null)
      return { success: true }
    } else {
      const result = await signOut()
      if (result.success) {
        setUser(null)
      }
      return result
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
