"use client"

import { useState, useEffect } from "react"
import Cookies from "js-cookie"

// Cookie name for pincode
const PINCODE_COOKIE = "user_pincode"
// Cookie expiry in days
const COOKIE_EXPIRY = 30

export const usePincode = () => {
  const [pincode, setPincode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Load pincode from cookie and localStorage on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      // First try to get from cookie (more reliable across sessions)
      const cookiePincode = Cookies.get(PINCODE_COOKIE)
      
      // Then try localStorage as fallback
      const storedPincode = localStorage.getItem("pincode")
      
      // Use cookie value first, then localStorage, or empty string if neither exists
      const savedPincode = cookiePincode || storedPincode || ""
      
      // If we have a pincode from localStorage but not cookie, set the cookie
      if (!cookiePincode && storedPincode) {
        Cookies.set(PINCODE_COOKIE, storedPincode, { expires: COOKIE_EXPIRY })
      }
      
      setPincode(savedPincode)
      setIsLoading(false)
      
      // Listen for pincode changes from other tabs/windows
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "pincode") {
          const newPincode = e.newValue || ""
          setPincode(newPincode)
          
          // Sync cookie with localStorage
          if (newPincode) {
            Cookies.set(PINCODE_COOKIE, newPincode, { expires: COOKIE_EXPIRY })
          } else {
            Cookies.remove(PINCODE_COOKIE)
          }
        }
      }
      
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Save pincode to localStorage and cookie when it changes
  const updatePincode = (newPincode: string) => {
    // Don't update if it's the same pincode
    if (newPincode === pincode) return;
    
    // Update state
    setPincode(newPincode)
    
    // Save to localStorage
    localStorage.setItem("pincode", newPincode)
    
    // Save to cookie for better persistence
    Cookies.set(PINCODE_COOKIE, newPincode, { expires: COOKIE_EXPIRY })
    
    // Manually dispatch storage event to notify other tabs/components
    try {
      const storageEvent = new StorageEvent("storage", {
        key: "pincode",
        newValue: newPincode,
        oldValue: pincode,
        storageArea: localStorage,
      });
      window.dispatchEvent(storageEvent);
    } catch (e) {
      // Fallback for browsers that don't support StorageEvent constructor
      const event = new CustomEvent("pincodeChange", { 
        detail: { newPincode, oldPincode: pincode } 
      });
      window.dispatchEvent(event);
    }
  }

  return {
    pincode,
    updatePincode,
    isLoading
  }
} 