"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { isFirebaseInitialized, isAuthInitialized, initializeFirebaseApp, initializeFirebaseAuth } from "@/lib/firebase/firebase-client"

interface FirebaseContextType {
  isFirebaseInitialized: boolean
  isAuthInitialized: boolean
  isLoading: boolean
  initializeAuth: () => void
}

const FirebaseContext = createContext<FirebaseContextType>({
  isFirebaseInitialized: false,
  isAuthInitialized: false,
  isLoading: true,
  initializeAuth: () => {}
})

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    isFirebaseInitialized: false,
    isAuthInitialized: false,
    isLoading: true,
  })

  // Function to force initialization
  const initializeAuth = () => {
    console.log("Manually initializing Firebase auth...");
    try {
      // Initialize Firebase app and auth
      const app = initializeFirebaseApp();
      const auth = initializeFirebaseAuth();
      
      console.log("Manual initialization result:", { 
        app: !!app, 
        auth: !!auth,
        isFirebaseInitialized,
        isAuthInitialized
      });
      
      // Update state
      setState({
        isFirebaseInitialized: !!app,
        isAuthInitialized: !!auth,
        isLoading: false
      });
    } catch (error) {
      console.error("Error during manual Firebase initialization:", error);
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    console.log("FirebaseProvider: Initial state check", { isFirebaseInitialized, isAuthInitialized });
    
    // Try to initialize immediately
    if (!isFirebaseInitialized) {
      console.log("FirebaseProvider: Attempting initial Firebase initialization");
      initializeFirebaseApp();
    }
    
    if (!isAuthInitialized) {
      console.log("FirebaseProvider: Attempting initial Auth initialization");
      initializeFirebaseAuth();
    }

    // Check initialization status periodically
    const interval = setInterval(() => {
      if (isFirebaseInitialized !== state.isFirebaseInitialized || 
          isAuthInitialized !== state.isAuthInitialized) {
        console.log("FirebaseProvider: State updated", { isFirebaseInitialized, isAuthInitialized });
      }
      
      setState({
        isFirebaseInitialized,
        isAuthInitialized,
        isLoading: false,
      })

      // Stop checking once both are initialized
      if (isFirebaseInitialized && isAuthInitialized) {
        console.log("FirebaseProvider: Both Firebase and Auth initialized, clearing interval");
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [state.isFirebaseInitialized, state.isAuthInitialized])

  return (
    <FirebaseContext.Provider value={{ 
      ...state, 
      initializeAuth 
    }}>
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  return useContext(FirebaseContext)
}
