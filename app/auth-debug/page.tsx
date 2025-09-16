"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signInWithGoogle } from "@/lib/firebase/auth"
import { useRouter } from "next/navigation"
import { getAuth, getRedirectResult } from "firebase/auth"
import LoginModal from "@/components/auth/login-modal"

export default function AuthDebugPage() {
  const { user, loading, refreshAuthState } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [redirectInfo, setRedirectInfo] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const router = useRouter()

  useEffect(() => {
    // Collect debug information
    const collectDebugInfo = async () => {
      try {
        const info: any = {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          authEmulator: process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR,
          sessionStorage: {},
          localStorage: {},
        }

        // Check for redirect info
        if (typeof window !== "undefined") {
          const auth = getAuth()
          try {
            const result = await getRedirectResult(auth)
            if (result) {
              setRedirectInfo({
                user: {
                  uid: result.user.uid,
                  email: result.user.email,
                  displayName: result.user.displayName,
                  phoneNumber: result.user.phoneNumber,
                }
              })
            }
          } catch (error) {
            console.error("Error getting redirect result:", error)
            setRedirectInfo({ error })
          }

          // Get session storage items
          try {
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i)
              if (key) {
                info.sessionStorage[key] = sessionStorage.getItem(key)
              }
            }
          } catch (e) {
            info.sessionStorage = { error: "Could not access sessionStorage" }
          }

          // Get local storage items
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key) {
                // Don't include sensitive data
                if (!key.includes("token") && !key.includes("auth")) {
                  info.localStorage[key] = localStorage.getItem(key)
                } else {
                  info.localStorage[key] = "[REDACTED]"
                }
              }
            }
          } catch (e) {
            info.localStorage = { error: "Could not access localStorage" }
          }
        }

        setDebugInfo(info)
      } catch (error) {
        console.error("Error collecting debug info:", error)
      }
    }

    collectDebugInfo()
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle()
      if (result.success) {
        refreshAuthState()
        router.refresh()
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? "True" : "False"}</p>
              <p><strong>User Authenticated:</strong> {user ? "Yes" : "No"}</p>
              {user && (
                <div className="bg-gray-100 p-4 rounded-md mt-2">
                  <h3 className="font-medium mb-2">User Info</h3>
                  <p><strong>UID:</strong> {user.uid}</p>
                  <p><strong>Display Name:</strong> {user.displayName || "N/A"}</p>
                  <p><strong>Email:</strong> {user.email || "N/A"}</p>
                  <p><strong>Phone:</strong> {user.phoneNumber || "N/A"}</p>
                  {user.photoURL && (
                    <div className="mt-2">
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {redirectInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Redirect Result</CardTitle>
              <CardDescription>Information from redirect authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(redirectInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Authentication Actions</CardTitle>
            <CardDescription>Test authentication functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowLoginModal(true)}>
                Open Login Modal
              </Button>
              <Button onClick={handleGoogleSignIn} variant="outline">
                Direct Google Sign-in
              </Button>
              <Button onClick={refreshAuthState} variant="outline">
                Refresh Auth State
              </Button>
              <Button onClick={() => router.refresh()} variant="outline">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>Technical details for troubleshooting</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  )
} 