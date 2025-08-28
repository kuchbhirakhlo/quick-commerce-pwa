"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { onAuthStateChange } from "@/lib/firebase/auth"
import { useRouter } from "next/navigation"
import { signInVendor, signOutVendor, getCurrentVendorData } from "@/lib/firebase/vendor-auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { getAuth } from "firebase/auth"

// Vendor types
export interface VendorProfile {
  id: string
  uid?: string        // Firebase Auth UID
  name: string
  email: string
  phone: string
  address: string
  pincode?: string
  pincodes?: string[]  // Service areas
  fssai?: string
  gstin?: string
  isOpen?: boolean
  role?: "vendor"
  status: "active" | "pending" | "blocked"
  productsCount?: number
  joinedDate?: string
  profileComplete?: boolean

}

interface VendorContextType {
  isLoading: boolean
  isAuthenticated: boolean
  vendor: VendorProfile | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: Error }>
  logout: () => Promise<{ success: boolean; error?: Error }>
  refreshVendorData: () => Promise<void>
}

const VendorContext = createContext<VendorContextType>({
  isLoading: false,
  isAuthenticated: false,
  vendor: null,
  login: async () => ({ success: false }),
  logout: async () => ({ success: false }),
  refreshVendorData: async () => { },
})

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Set isMounted to true when component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true)
    console.log("Vendor provider mounted");
  }, [])

  // Fetch vendor data when user is authenticated
  const fetchVendorData = async (userId: string) => {
    try {
      const vendorDoc = await getDoc(doc(db, "vendors", userId));

      // First try with direct vendor ID
      if (vendorDoc.exists()) {
        const vendorData = vendorDoc.data() as Omit<VendorProfile, "id">;
        const vendor = {
          id: vendorDoc.id,
          ...vendorData,
        };
        setVendor(vendor);
        setIsAuthenticated(true);
        setIsLoading(false);
        return vendor;
      }

      // Try with vendor_ prefix
      const prefixedId = `vendor_${userId}`;
      const prefixedVendorDoc = await getDoc(doc(db, "vendors", prefixedId));

      if (prefixedVendorDoc.exists()) {
        const vendorData = prefixedVendorDoc.data() as Omit<VendorProfile, "id">;
        const vendor = {
          id: prefixedVendorDoc.id,
          ...vendorData,
        };
        setVendor(vendor);
        setIsAuthenticated(true);
        setIsLoading(false);
        return vendor;
      }

      // If vendor data doesn't exist, sign out
      console.error("No vendor document found for user:", userId);
      await signOutVendor();
      setIsAuthenticated(false);
      setVendor(null);
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      setIsAuthenticated(false);
      setVendor(null);
      setIsLoading(false);
      return null;
    }
  };

  // Refresh vendor data (used after profile updates)
  const refreshVendorData = async () => {
    try {
      setIsLoading(true);

      // For real users, fetch fresh data
      const auth = getAuth();
      if (!auth || !auth.currentUser) {
        console.error("Cannot refresh vendor data: No authenticated user");
        setIsLoading(false);
        return;
      }

      // Get the current user ID
      const userId = auth.currentUser.uid;
      console.log("Refreshing vendor data for user:", userId);

      // Fetch the vendor data directly
      if (vendor?.id) {
        // If we know the vendor document ID, fetch it directly
        const vendorDoc = await getDoc(doc(db, "vendors", vendor.id));

        if (vendorDoc.exists()) {
          const vendorData = vendorDoc.data() as Omit<VendorProfile, "id">;
          setVendor({
            id: vendorDoc.id,
            ...vendorData,
          });
          console.log("Vendor data refreshed successfully");
        } else {
          console.error("Vendor document not found:", vendor.id);
        }
      } else {
        // Otherwise, try to find the vendor by user ID
        await fetchVendorData(userId);
      }
    } catch (error) {
      console.error("Error refreshing vendor data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth state on mount (client-side only)
  useEffect(() => {
    if (isMounted) {
      setIsLoading(true);
      let unsubscribed = false;

      console.log("Setting up auth state listener");

      const unsubscribePromise = onAuthStateChange(async (user) => {
        if (unsubscribed) return;

        console.log("Auth state changed:", user ? `User: ${user.uid}` : "No user");

        if (user) {
          const vendorData = await fetchVendorData(user.uid);
          if (!vendorData) {
            console.error("Could not fetch vendor data for user:", user.uid);
            setIsAuthenticated(false);
            setVendor(null);
          } else {
            console.log("Vendor data fetched successfully:", vendorData.id);
          }
        } else {
          setIsAuthenticated(false);
          setVendor(null);
          setIsLoading(false);
        }
      });

      return () => {
        unsubscribed = true;
        // Handle the unsubscribe promise properly
        if (unsubscribePromise instanceof Promise) {
          unsubscribePromise.then((unsubscribeFn: (() => void) | undefined) => {
            if (typeof unsubscribeFn === 'function') {
              unsubscribeFn();
            }
          }).catch((err: Error) => {
            console.error("Error unsubscribing from auth state:", err);
          });
        } else if (typeof unsubscribePromise === 'function') {
          // If it's already a function, call it directly
          unsubscribePromise();
        }
      }
    }
  }, [isMounted]);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log("Attempting login with:", email);

      const result = await signInVendor(email, password);

      if (result.success && result.vendorData) {
        // Ensure we have a vendor ID before proceeding
        if (!result.vendorData.id) {
          console.error("No vendor ID returned from authentication");
          return { success: false, error: new Error("No vendor ID available") };
        }

        // Update vendor state immediately with data from signInVendor
        const vendorData = result.vendorData as VendorProfile;
        console.log("Setting vendor data to:", vendorData.id);

        // Force a clean state update
        setVendor(null);
        setTimeout(() => {
          setVendor(vendorData);
          setIsAuthenticated(true);
          console.log("Vendor authenticated successfully with ID:", vendorData.id);
        }, 0);

        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: new Error(error.message || "Login failed") };
    } finally {
      setIsLoading(false);
    }
  }

  // Logout function
  const logout = async () => {
    setIsLoading(true)
    try {
      const result = await signOutVendor()
      if (result.success) {
        setIsAuthenticated(false)
        setVendor(null)
      }
      return result
    } catch (error: any) {
      return { success: false, error: new Error(error.message || "Logout failed") }
    } finally {
      setIsLoading(false)
    }
  }

  // Debug state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Vendor auth state:", { isAuthenticated, vendorId: vendor?.id });
    }
  }, [isAuthenticated, vendor]);

  return (
    <VendorContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        vendor,
        login,
        logout,
        refreshVendorData,
      }}
    >
      {children}
    </VendorContext.Provider>
  )
}

export const useVendor = () => useContext(VendorContext) 