"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc, Firestore } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-client"
import Cookies from "js-cookie"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect')

  // Check if the user is already logged in
  useEffect(() => {
    const session = Cookies.get("admin_session")
    if (session) {
      router.push("/admin")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Check Firebase configuration in production
      if (process.env.NODE_ENV === 'production') {
        console.log("Production environment detected. Checking Firebase config...");
        const hasFirebaseConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                                  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        console.log("Firebase config available:", hasFirebaseConfig);
      }
      
      // Get Firebase auth instance
      const auth = getAuth()
      if (!auth) {
        throw new Error("Firebase authentication is not initialized");
      }

      console.log("Attempting admin login with email:", email);
      
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log("User authenticated with Firebase, checking admin status");

      if (!db) {
        throw new Error("Firebase Firestore is not initialized")
      }

      // Check if user has admin role in Firestore
      const userDoc = await getDoc(doc(db as Firestore, "admins", user.uid))

      if (!userDoc.exists()) {
        // User exists but not as admin
        console.log("User not found in admins collection");
        await auth.signOut()
        setError("You don't have admin privileges.")
        setLoading(false)
        return
      }

      console.log("Admin authenticated successfully, setting session cookie");
      
      // Get the current domain for proper cookie setting
      const domain = window.location.hostname;
      const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';
      
      // Set admin session cookie with proper options
      const cookieOptions: Cookies.CookieAttributes = {
        expires: 7, // 7 days
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      };
      
      // In production, set domain for cookies (not on localhost)
      if (!isLocalhost) {
        cookieOptions.domain = domain;
      }
      
      // Set admin session cookies
      Cookies.set("admin_session", "true", cookieOptions);
      Cookies.set("admin_uid", user.uid, cookieOptions);
      
      console.log("Admin session cookies set, redirecting to dashboard");

      // Redirect to the originally requested page or default to admin dashboard
      if (redirectPath) {
        router.push(decodeURIComponent(redirectPath))
      } else {
        // Use window.location for more reliable redirect in production
        if (process.env.NODE_ENV === 'production') {
          window.location.href = "/admin";
        } else {
          router.push("/admin")
        }
      }
    } catch (error: any) {
      console.error("Admin login error:", error)

      // Handle different types of Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError("Invalid email or password")
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many login attempts. Please try again later.")
      } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/app-deleted' || error.code === 'auth/app-not-authorized') {
        setError("Authentication service is temporarily unavailable. Please try again later.")
      } else {
        setError(error.message || "Failed to login")
      }

      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md px-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 