"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Header from "@/components/header"
import { usePincode } from "@/lib/hooks/use-pincode"
import { isPincodeServiceable } from "@/lib/firebase/firestore"
import { Loader2 } from "lucide-react"

export default function ComingSoonPage() {
  const router = useRouter()
  const { pincode, updatePincode } = usePincode()
  const [newPincode, setNewPincode] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState("")
  
  const handleBack = () => {
    // Go back to home page
    router.push("/")
  }
  
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setNewPincode(value)
    setError("")
  }

  const checkPincode = async () => {
    if (!newPincode || newPincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode")
      return
    }

    setIsChecking(true)
    setError("")

    try {
      // Check if pincode is serviceable using the actual Firebase function
      const isServiceable = await isPincodeServiceable(newPincode)
      
      if (isServiceable) {
        // Update pincode and redirect to homepage
        updatePincode(newPincode)
        router.push("/")
      } else {
        setError("We don't deliver to this pincode yet")
      }
    } catch (err) {
      console.error("Error checking pincode:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }

  // Handle pressing Enter key in the input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isChecking) {
      checkPincode()
    }
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 p-4 rounded-full">
              <MapPin size={40} className="text-yellow-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">We're not in your area yet!</h1>
          
          <p className="text-gray-600 mb-6">
            We're sorry, but we don't currently deliver to pincode <span className="font-bold">{pincode}</span>. 
            Try checking another pincode below.
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="Enter pincode"
                  value={newPincode}
                  onChange={handlePincodeChange}
                  onKeyDown={handleKeyPress}
                  className="w-full"
                  aria-label="Pincode"
                />
              </div>
              <Button 
                onClick={checkPincode} 
                disabled={isChecking || newPincode.length !== 6}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {isChecking ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Availability"
                )}
              </Button>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md mb-8">
            <p className="text-blue-700">
              We're continuously expanding! Check back soon for more delivery areas.
            </p>
          </div>
          
          <Button 
            onClick={handleBack} 
            variant="outline"
            className="flex items-center justify-center"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to home
          </Button>
        </div>
      </div>
    </main>
  )
} 