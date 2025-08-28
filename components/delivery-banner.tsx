"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { initializeFirebaseApp } from "@/lib/firebase/firebase-client"
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

export default function DeliveryBanner() {
  const [deliveryMessage, setDeliveryMessage] = useState("Delivery in 8 minutes")
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch delivery message based on selected pincode
  useEffect(() => {
    const fetchDeliveryMessage = async () => {
      try {
        // Get the selected pincode from localStorage using the correct key
        const selectedPincode = localStorage.getItem('pincode')
        
        if (!selectedPincode) {
          setIsLoading(false)
          return
        }

        // Initialize Firebase
        const app = initializeFirebaseApp()
        if (!app) {
          console.error("Firebase app initialization failed")
          setIsLoading(false)
          return
        }

        const db = getFirestore(app)
        
        // Query vendors that serve this pincode
        const vendorsRef = collection(db, "vendors")
        
        // First check for active vendors
        const activeVendorsQuery = query(
          vendorsRef, 
          where("status", "==", "active")
        )

        const querySnapshot = await getDocs(activeVendorsQuery)
        
        if (querySnapshot.empty) {
          setIsLoading(false)
          return
        }
        
        // Find vendors that have this pincode in their pincodes array
        let foundVendor = null
        for (const vendorDoc of querySnapshot.docs) {
          const vendorData = vendorDoc.data()
          const pincodes = vendorData.pincodes || []
          
          if (pincodes.includes(selectedPincode)) {
            foundVendor = vendorData
            break
          }
        }
        
        if (foundVendor && foundVendor.deliveryMessage) {
          setDeliveryMessage(foundVendor.deliveryMessage)
        } else {
        }
      } catch (error) {
        console.error("Error fetching delivery message:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeliveryMessage()
  }, [])

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show banner when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY && isVisible && currentScrollY > 100) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY && !isVisible) {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isVisible, lastScrollY])

  if (isLoading) {
    return null // Don't show anything while loading
  }

  return (
    <div className={`transition-all duration-300 ${
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
    } md:hidden bg-amber-100 rounded-lg p-4 mb-4 flex items-center sticky top-[60px] z-10`}>
      <div className="font-bold text-gray-800">
        <span className="block">{deliveryMessage}</span>
      </div>
      <div className="ml-auto flex items-center text-xs rounded-full">
        <Clock size={16} className="text-gray-600 mr-1" />
        <span className="font-medium">Fastest Delivery</span>
      </div>
    </div>
  )
} 