"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePincode } from "@/lib/hooks/use-pincode"
import { isPincodeServiceable } from "@/lib/firebase/firestore"

export default function CheckPincodeRedirect() {
  const { pincode, isLoading } = usePincode()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Only run on client side
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    // Only check if component is mounted and we have pincode data
    if (!mounted || !pincode || isLoading) return
    
    async function checkPincode() {
      try {
        setIsChecking(true)
        const isServiceable = await isPincodeServiceable(pincode)
        
        if (!isServiceable) {
          // Redirect to coming soon page if pincode is not serviceable
          router.push("/coming-soon")
        }
      } catch (error) {
        console.error("Error checking pincode serviceability:", error)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkPincode()
  }, [pincode, isLoading, router, mounted])
  
  // This component doesn't render anything visible
  return null
} 