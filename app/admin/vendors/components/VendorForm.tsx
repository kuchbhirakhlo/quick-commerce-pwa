"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  addDoc,
  collection,
  updateDoc,
  doc,
  getFirestore,
  connectFirestoreEmulator,
  setDoc,
  serverTimestamp
} from "firebase/firestore"
import {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator
} from "firebase/auth"
import { initializeFirebaseApp, retryFirestoreOperation } from "@/lib/firebase/firebase-client"
import { Eye, EyeOff, AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFirebaseConnection } from "@/hooks/useFirebaseConnection"

interface VendorFormProps {
  vendor?: {
    id: string
    name: string
    email: string
    phone: string
    pincodes: string[]
    status: string
    joinedDate?: string
    productsCount?: number
    deliveryMessage?: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  name: string
  email: string
  phone: string
  pincodes: string
  status: string
  password: string
  deliveryMessage: string
}

export function VendorForm({ vendor, onSuccess, onCancel }: VendorFormProps) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: vendor?.name || "",
    email: vendor?.email || "",
    phone: vendor?.phone || "",
    pincodes: vendor?.pincodes?.join(", ") || "",
    status: vendor?.status || "pending",
    password: "",
    deliveryMessage: vendor?.deliveryMessage || "Delivery in 8 minutes",
  })

  // Use our custom hook for connection status
  const { isOffline, isOnline, lastOnlineTime, shouldShowWarning } = useFirebaseConnection();

  // Format the last online time
  const formatLastOnlineTime = () => {
    if (!lastOnlineTime) return "";

    const now = new Date();
    const diffMs = now.getTime() - lastOnlineTime.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Initialize Firebase app
      const app = initializeFirebaseApp()
      if (!app) {
        throw new Error("Firebase configuration is missing. Please check your environment variables.")
      }

      // Get Firebase services
      const auth = getAuth(app)
      const db = getFirestore(app)

      // Check if we're in development mode and need to use emulators
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
        try {
          connectAuthEmulator(auth, 'http://localhost:9099')
          connectFirestoreEmulator(db, 'localhost', 8080)
        } catch (emulatorError) {
          console.warn('Failed to connect to emulators:', emulatorError)
        }
      }

      if (!vendor?.id) {
        // Create new vendor with authentication
        if (!formData.password) {
          throw new Error("Password is required for new vendors")
        }

        try {
          // Create user account
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          )

          // Prepare vendor data
          const vendorData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            pincodes: formData.pincodes.split(",").map((p) => p.trim()).filter(p => p),
            status: formData.status,
            productsCount: 0,
            joinedDate: new Date().toISOString(),
            createdAt: serverTimestamp(),
            uid: userCredential.user.uid,
            role: "vendor",
            deliveryMessage: formData.deliveryMessage
          }

          console.log("Saving vendor with pincodes:", vendorData.pincodes);

          // Use the retry utility for better error handling
          const vendorId = `vendor_${userCredential.user.uid}`;
          await retryFirestoreOperation(async () => {
            console.log("Saving vendor data to Firestore");
            return setDoc(doc(db, "vendors", vendorId), vendorData);
          });

          console.log("Vendor created successfully");
          onSuccess?.();
        } catch (authError: any) {
          console.error("Authentication error:", authError);
          if (authError.code === "auth/email-already-in-use") {
            setError("This email is already registered. Please use a different email address.");
          } else {
            throw authError; // Re-throw if it's not the email-already-in-use error
          }
        }
      } else {
        // Update existing vendor
        const vendorData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          pincodes: formData.pincodes.split(",").map((p) => p.trim()).filter(p => p),
          status: formData.status,
          updatedAt: serverTimestamp(),
          deliveryMessage: formData.deliveryMessage
        }

        console.log("Updating vendor with pincodes:", vendorData.pincodes);

        // Use the retry utility for better error handling
        await retryFirestoreOperation(async () => {
          console.log("Updating vendor data in Firestore");
          return updateDoc(doc(db, "vendors", vendor.id), vendorData);
        });

        console.log("Vendor updated successfully");
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("Error saving vendor:", error)
      let errorMessage = "Failed to save vendor. Please try again."

      if (error.code === "auth/api-key-not-valid") {
        errorMessage = "Firebase configuration error. Please check your API key in your environment variables."
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please use a different email address."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters long."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address."
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection."
      } else if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to perform this action. Please check your Firebase security rules."
      } else if (error.code === "unavailable") {
        errorMessage = "The service is currently unavailable. Please try again later."
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{vendor ? "Edit Vendor" : "Add New Vendor"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isOffline && (
          <Alert variant={shouldShowWarning ? "destructive" : "default"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {shouldShowWarning
                ? "Connection to Firebase has been lost. Your changes will be saved when your connection is restored."
                : "You appear to be offline. Changes will be saved when your connection is restored."}
              {lastOnlineTime && (
                <div className="flex items-center mt-1 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Last online: {formatLastOnlineTime()}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vendor Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!vendor}
            />
            {vendor && <p className="text-xs text-gray-500">Email cannot be changed after creation</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincodes" className="flex items-center">
              <span>Delivery Areas (Pincodes)</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Admin Only</span>
            </Label>
            <Textarea
              id="pincodes"
              value={formData.pincodes}
              onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
              placeholder="Enter pincodes separated by commas (e.g. 110001, 110002)"
            />
            <p className="text-xs text-gray-500">
              These pincodes define the areas where this vendor can deliver. Vendors cannot modify these themselves.
            </p>
          </div>

          {!vendor && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!vendor}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="deliveryMessage">Delivery Message</Label>
            <Textarea
              id="deliveryMessage"
              value={formData.deliveryMessage}
              onChange={(e) => setFormData({ ...formData, deliveryMessage: e.target.value })}
              placeholder="Delivery in 8 minutes"
              required
            />
            <p className="text-xs text-gray-500">
              This message will be displayed to customers when they order from this vendor.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (isOffline && shouldShowWarning)}>
              {loading ? "Saving..." : vendor ? "Update Vendor" : "Add Vendor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}



// all okay now implement the vendor login page which are approved by admin
