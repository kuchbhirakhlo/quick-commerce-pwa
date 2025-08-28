"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useVendor } from "@/lib/context/vendor-provider"
import { AlertCircle, Info, ShieldCheck, LogIn } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { setVendorSessionCookies } from "@/lib/firebase/set-session-cookie"
import LoginDebug from "./debug"

export default function VendorLogin() {
  const { login, isLoading, isAuthenticated, vendor } = useVendor()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Check if already logged in and redirect
  useEffect(() => {
    if (isAuthenticated && vendor) {
      console.log("Already authenticated, setting session cookies");

      // Set session cookies with the vendor's ID
      setVendorSessionCookies(
        vendor.uid || vendor.id // Use UID if available, otherwise ID
      );

      // Delay redirect slightly to ensure cookies are set
      setTimeout(() => {
        console.log("Redirecting to dashboard");
        router.push("/vendor");
      }, 100);
    }
  }, [isAuthenticated, vendor, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    let loginSuccessful = false;

    try {
      console.log("Logging in with email:", email)
      
      // Check Firebase configuration in production
      if (process.env.NODE_ENV === 'production') {
        console.log("Production environment detected. Checking Firebase config...");
        const hasFirebaseConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                                 !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        console.log("Firebase config available:", hasFirebaseConfig);
      }
      
      const result = await login(email, password)
      loginSuccessful = result.success;

      if (result.success) {
        console.log("Login successful");

        // For real accounts, wait for vendor state to update and check multiple times
        let attempts = 0;
        const maxAttempts = 8;
        const checkInterval = 250;

        const checkVendorData = () => {
          attempts++;
          console.log(`Checking vendor data (attempt ${attempts}/${maxAttempts})...`);
          console.log("Current vendor state:", vendor ? `ID: ${vendor.id || vendor.uid}` : "No vendor data");

          if (vendor && (vendor.id || vendor.uid)) {
            // We have vendor data with an ID
            const vendorId = vendor.uid || vendor.id;
            console.log("Vendor data available. Setting session cookies with ID:", vendorId);

            // Set session cookies and redirect
            setVendorSessionCookies(vendorId);
            
            // Use direct window.location for more reliable redirect in production
            if (process.env.NODE_ENV === 'production') {
              window.location.href = "/vendor";
            } else {
              router.push("/vendor");
            }
          } else if (attempts < maxAttempts) {
            // Try again after a short delay
            setTimeout(checkVendorData, checkInterval);
          } else {
            // Give up after max attempts
            console.error("No vendor ID available after maximum attempts");
            
            // In production, try one last fallback approach
            if (process.env.NODE_ENV === 'production') {
              console.log("Attempting fallback authentication approach...");
              // Try to get current user directly from Firebase Auth
              const auth = require('firebase/auth').getAuth();
              if (auth && auth.currentUser) {
                const uid = auth.currentUser.uid;
                console.log("Found authenticated user with UID:", uid);
                setVendorSessionCookies(uid);
                window.location.href = "/vendor";
                return;
              }
            }
            
            setError("Authentication error: Could not retrieve vendor details. Please try again or contact support.");
            setIsSubmitting(false);
          }
        };

        // Start checking for vendor data
        checkVendorData();
      } else if (result.error) {
        console.error("Login failed:", result.error)

        // Set specific error message for inactive vendors
        if (result.error.message.includes("not active") ||
          result.error.message.includes("pending") ||
          result.error.message.includes("blocked")) {
          setError("Your vendor account is not active. Please contact the admin for approval.")
        } else if (result.error.message.includes("Firebase") || 
                  result.error.message.includes("configuration")) {
          setError("Login service is currently unavailable. Please try again later or contact support.")
        } else {
          setError(result.error.message)
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Failed to login. Please try again.")
    } finally {
      if (!loginSuccessful) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100">
      <div className="w-full max-w-md px-4">
        <Card className="w-full shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-center font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent">Vendor Portal</CardTitle>
            <CardDescription className="text-center">Login to manage your store and orders</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
              <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

            <Alert className="mb-6 border-indigo-200 bg-indigo-50">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <AlertTitle className="font-semibold text-indigo-800">Admin Approval Required</AlertTitle>
              <AlertDescription className="text-indigo-700">
              Only vendors that have been approved by an admin can login.
              If you're having trouble logging in, please contact support.
            </AlertDescription>
          </Alert>

            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <Button
              type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 py-6"
              disabled={isSubmitting || isLoading}
            >
                {isSubmitting || isLoading ? "Logging in..." : "Login to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}