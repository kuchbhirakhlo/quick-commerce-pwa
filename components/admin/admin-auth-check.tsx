"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, Firestore } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-client"
import Cookies from "js-cookie"

export default function AdminAuthCheck({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    // Check authentication state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        try {
          // Check if user is in admins collection
          const adminDoc = await getDoc(doc(db as Firestore, "admins", user.uid))
          if (adminDoc.exists()) {
            setIsAdmin(true)

            // Ensure cookie is set
            if (!Cookies.get("admin_session")) {
              Cookies.set("admin_session", "true", {
                expires: 7,
                path: "/",
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict"
              })
            }
          } else {
            // User is not an admin, remove the cookie and redirect
            Cookies.remove("admin_session")
            router.push("/admin/login")
          }
        } catch (error) {
          console.error("Error checking admin status:", error)
          Cookies.remove("admin_session")
          router.push("/admin/login")
        }
      } else {
        // User is not authenticated, check if admin_session cookie exists
        if (Cookies.get("admin_session")) {
          // Invalid state - remove cookie
          Cookies.remove("admin_session")
        }
        router.push("/admin/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Checking authorization...</p>
        </div>
      </div>
    )
  }

  return isAdmin ? <>{children}</> : null
} 