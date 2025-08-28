"use client"

import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { usePincode } from "@/lib/hooks/use-pincode"
import { isPincodeServiceable } from "@/lib/firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import { isAdminOrVendorPage, getButtonClass } from "@/lib/utils"

export default function PincodeRequiredModal(props: React.HTMLAttributes<HTMLDivElement>) {
  const { pincode, updatePincode, isLoading } = usePincode()
  const [inputPincode, setInputPincode] = useState("")
  const [open, setOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [address, setAddress] = useState("")
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Check if on admin or vendor pages
  const isAdminOrVendor = isAdminOrVendorPage(pathname)

  // Show modal if no pincode is set and not on admin/vendor pages
  useEffect(() => {
    if (!isLoading && !pincode && !isAdminOrVendor) {
      setOpen(true)
    }
  }, [pincode, isLoading, isAdminOrVendor])

  // Prevent closing the modal if no pincode is set
  const handleOpenChange = (newOpen: boolean) => {
    if (pincode || newOpen) {
      setOpen(newOpen)
    }
  }

  // Don't render on admin or vendor pages
  if (isAdminOrVendor) {
    return null
  }

  // Fetch address from pincode using Google Maps API
  const fetchAddressFromPincode = async (pincode: string) => {
    if (!pincode) return
    
    setIsLoadingAddress(true)
    try {
      // First check if we have a cached address
      const cachedAddress = localStorage.getItem(`address_${pincode}`)
      if (cachedAddress) {
        setAddress(cachedAddress)
        setIsLoadingAddress(false)
        return
      }
      
      // Using Google Maps Geocoding API
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
      const data = await response.json()
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address
        setAddress(formattedAddress)
        // Save address to localStorage for future use
        localStorage.setItem(`address_${pincode}`, formattedAddress)
      } else {
        setAddress("")
      }
    } catch (error) {
      console.error("Error fetching address:", error)
      setAddress("")
    } finally {
      setIsLoadingAddress(false)
    }
  }
  
  // Get current location and find pincode
  const getCurrentLocation = () => {
    setUseCurrentLocation(true)
    
    if (navigator.geolocation) {
      setIsLoadingAddress(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            
            // Use reverse geocoding to get address and pincode
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            )
            
            const data = await response.json()
            
            if (data.status === "OK" && data.results && data.results.length > 0) {
              // Extract pincode from address components
              let foundPincode = ""
              let formattedAddress = data.results[0].formatted_address
              
              // Look for postal_code in address components
              for (const result of data.results) {
                for (const component of result.address_components) {
                  if (component.types.includes("postal_code")) {
                    foundPincode = component.long_name
                    break
                  }
                }
                if (foundPincode) break
              }
              
              if (foundPincode) {
                setInputPincode(foundPincode)
                setAddress(formattedAddress)
                // Save address to localStorage
                localStorage.setItem(`address_${foundPincode}`, formattedAddress)
                
                // Check if the pincode is serviceable
                setIsChecking(true)
                try {
                  const serviceable = await isPincodeServiceable(foundPincode)
                  
                  // Save pincode regardless of serviceability
                  updatePincode(foundPincode)
                  setOpen(false)
                  
                  if (serviceable) {
                    // No need to reload the page, the cart will update automatically
                    // Just refresh the page data
                    router.refresh();
                  } else {
                    // Redirect to coming soon page if not serviceable
                    router.push("/coming-soon")
                  }
                } catch (error) {
                  console.error("Error checking pincode serviceability:", error)
                  // On error, update pincode but don't reload
                  updatePincode(foundPincode)
                  setOpen(false)
                  router.refresh();
                } finally {
                  setIsChecking(false)
                }
              } else {
                setAddress(formattedAddress)
                alert("Could not detect pincode from your location. Please enter it manually.")
              }
            }
          } catch (error) {
            console.error("Error getting location:", error)
            alert("Failed to get your location. Please enter pincode manually.")
          } finally {
            setIsLoadingAddress(false)
            setUseCurrentLocation(false)
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          alert("Failed to access your location. Please check your browser permissions and try again.")
          setIsLoadingAddress(false)
          setUseCurrentLocation(false)
        }
      )
    } else {
      alert("Geolocation is not supported by this browser.")
      setUseCurrentLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputPincode.length === 6 && /^\d+$/.test(inputPincode)) {
      setIsChecking(true)
      
      try {
        // Check if the pincode is serviceable
        const serviceable = await isPincodeServiceable(inputPincode)
        
        // Save pincode regardless of serviceability
        updatePincode(inputPincode)
        setOpen(false)
        
        if (serviceable) {
          // No need to reload the page, the cart will update automatically
          // Just refresh the page data
          router.refresh();
        } else {
          // Redirect to coming soon page if not serviceable
          router.push("/coming-soon")
        }
      } catch (error) {
        console.error("Error checking pincode serviceability:", error)
        // On error, update pincode but don't reload
        updatePincode(inputPincode)
        setOpen(false)
        router.refresh();
      } finally {
        setIsChecking(false)
      }
    }
  }

  if (isLoading) {
    return null; // Don't render anything while loading
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} {...props}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} hideCloseButton={true}>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">Select your delivery location</h2>
          
          <p className="text-sm text-gray-600">
            Please select your delivery location to continue using the app.
          </p>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 py-6"
            onClick={getCurrentLocation}
            disabled={useCurrentLocation || isLoadingAddress || isChecking}
          >
            <MapPin size={18} />
            {isLoadingAddress ? "Getting location..." : isChecking ? "Checking serviceability..." : "Use current location"}
          </Button>
          
          {address && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">Delivery Address</p>
              <p className="text-sm text-gray-600">{address}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pincode" className="text-sm font-medium block mb-1">Pincode</label>
              <Input
                id="pincode"
                type="text"
                placeholder="Enter 6-digit pincode"
                value={inputPincode}
                onChange={(e) => setInputPincode(e.target.value)}
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                autoFocus
                className="py-6"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !inputPincode || inputPincode.length !== 6}
              className={`w-full ${getButtonClass(pathname)} py-6 text-white`}
            >
              {isLoading ? "Checking..." : "Continue"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 