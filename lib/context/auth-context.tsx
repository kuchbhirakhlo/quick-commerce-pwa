"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
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

  // Function to manually refresh auth state
  const refreshAuthState = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser({
        uid: currentUser.uid,
        phoneNumber: currentUser.phoneNumber,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });
    } else {
      setUser(null);
    }
  };

  // Check for redirect result from Google sign-in
  useEffect(() => {
    const checkRedirectResult = async () => {
      if (typeof window !== "undefined" && isAuthInitialized && !firebaseLoading) {
        try {
          // Check if we're coming back from a redirect
          const auth = getAuth();
          const result = await getRedirectResult(auth);
          
          if (result && result.user) {
            console.log("Detected redirect result, user signed in:", result.user.displayName);
            setUser({
              uid: result.user.uid,
              phoneNumber: result.user.phoneNumber,
              displayName: result.user.displayName,
              email: result.user.email,
              photoURL: result.user.photoURL,
            });
            
            // Clear the redirect flag
            sessionStorage.removeItem('auth_redirect_started');
            
            // Check if we need to redirect to checkout
            const shouldRedirectToCheckout = localStorage.getItem("redirect_to_checkout");
            if (shouldRedirectToCheckout === "true") {
              localStorage.removeItem("redirect_to_checkout");
              // Add a small delay to ensure auth state is updated
              setTimeout(() => {
                window.location.href = "/checkout";
              }, 500);
            }
          }
        } catch (error) {
          console.error("Error checking redirect result:", error);
        }
      }
    };
    
    checkRedirectResult();
  }, [isAuthInitialized, firebaseLoading]);

  useEffect(() => {
    // Only run auth state change listener on client side and after Firebase Auth is initialized
    if (typeof window !== "undefined") {
      // Check for development mode mock user
      const checkDevUser = () => {
        if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
          const devUser = localStorage.getItem("dev-auth-user")
          if (devUser) {
            try {
              const mockUser = JSON.parse(devUser)
              setUser(mockUser)
              return true
            } catch (e) {
              console.error("Error parsing dev user:", e)
            }
          }
        }
        return false
      }

      // If we have a dev user, use that
      const hasDevUser = checkDevUser()
      
      if (!hasDevUser && isAuthInitialized && !firebaseLoading) {
        // Use Firebase auth in production or if no dev user
        const unsubscribe = onAuthStateChange((authUser) => {
          if (authUser) {
            // User is signed in
            setUser({
              uid: authUser.uid,
              phoneNumber: authUser.phoneNumber,
              displayName: authUser.displayName,
              email: authUser.email,
              photoURL: authUser.photoURL,
            })
          } else {
            // User is signed out
            setUser(null)
          }
          setLoading(false)
        })

        // Cleanup subscription on unmount
        return () => {
          if (typeof unsubscribe === "function") {
            unsubscribe()
          }
        }
      } else if (!firebaseLoading) {
        // If Firebase is done loading but Auth is not initialized, or we're on the server, set loading to false
        setLoading(false)
      }
    }
  }, [isAuthInitialized, firebaseLoading])

  // Add an effect to check for development mode user changes
  useEffect(() => {
    // Check for development mode user in localStorage
    if (typeof window !== "undefined" && 
        (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true")) {
      
      // Function to check for dev user
      const checkDevUser = () => {
        const devUser = localStorage.getItem("dev-auth-user")
        if (devUser) {
          try {
            const mockUser = JSON.parse(devUser)
            setUser(mockUser)
          } catch (e) {
            console.error("Error parsing dev user:", e)
          }
        } else {
          // If no dev user in localStorage, set user to null
          setUser(null)
        }
        setLoading(false)
      }
      
      // Check immediately
      checkDevUser()
      
      // Also set up a storage event listener to detect changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "dev-auth-user") {
          checkDevUser()
        }
      }
      
      window.addEventListener("storage", handleStorageChange)
      
      // Clean up
      return () => {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [])

  // Custom signOut function that handles both Firebase and dev mode
  const handleSignOut = async () => {
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
      // In development, just remove the dev user from localStorage
      localStorage.removeItem("dev-auth-user")
      setUser(null)
      return { success: true }
    } else {
      // In production, use Firebase signOut
      const result = await signOut();
      if (result.success) {
        // Force refresh the user state
        setUser(null);
      }
      return result;
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
