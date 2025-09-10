"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { CreditCard, MapPin, Truck, Clock, ChevronRight, Plus, Edit, Check, Home, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/context/auth-context"
import { createOrder } from "@/lib/firebase/firestore"
import { usePincode } from "@/lib/hooks/use-pincode"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { getButtonClass } from "@/lib/utils"
import LoginModal from "../auth/login-modal"

// Define address type
interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  pincode: string;
  city: string;
  isDefault?: boolean;
  type?: string;
}

export default function CheckoutForm() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { cartItems, clearCart } = useCart()
  const { user } = useAuth()
  const { pincode } = usePincode()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: pincode || "",
    city: "",
    deliveryOption: "express",
    paymentMethod: "cod",
  })
  const [addressFormData, setAddressFormData] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: pincode || "",
    city: "",
    type: "Home" // Address type (Home, Work, Other)
  })

  // Load saved addresses from localStorage on component mount
  useEffect(() => {
    if (user?.uid) {
      // Load all saved addresses
      const addressesJson = localStorage.getItem(`saved_addresses_${user.uid}`)
      if (addressesJson) {
        try {
          const addresses = JSON.parse(addressesJson) as SavedAddress[]
          setSavedAddresses(addresses)

          // Find default address or use the first one
          const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
            setFormData(prev => ({
              ...prev,
              name: defaultAddress.name,
              phone: defaultAddress.phone,
              address: defaultAddress.address,
              pincode: defaultAddress.pincode,
              city: defaultAddress.city,
            }))
          }
        } catch (error) {
          console.error("Error parsing saved addresses:", error)
        }
      }

      // Pre-fill phone number from user data if available and no saved addresses
      if (!addressesJson && user?.phoneNumber) {
        setFormData(prev => ({
          ...prev,
          phone: user.phoneNumber?.replace('+91', '') || '',
          pincode: pincode || ""
        }))
      }
    }
  }, [user, pincode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle address form changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setAddressFormData(prev => ({ ...prev, [id]: value }))
  }

  // Start adding a new address
  const startNewAddress = () => {
    setIsAddingNewAddress(true)
    setIsEditingAddress(false)
    setAddressFormData({
      name: user?.displayName || "",
      phone: user?.phoneNumber?.replace('+91', '') || '',
      address: "",
      pincode: pincode || "",
      city: "",
      type: "Home"
    })
  }

  // Start editing an address
  const startEditingAddress = (address: SavedAddress) => {
    setIsEditingAddress(true)
    setIsAddingNewAddress(false)
    setAddressFormData({
      name: address.name,
      phone: address.phone,
      address: address.address,
      pincode: address.pincode,
      city: address.city,
      type: address.type || "Home"
    })
  }

  // Save the address
  const saveAddress = () => {
    if (!user?.uid) return;
    // Validate name and phone
    if (!addressFormData.name.trim()) {
      toast({ title: "Name Required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    if (!addressFormData.phone.trim() || !/^\d{10}$/.test(addressFormData.phone.trim())) {
      toast({ title: "Mobile Number Required", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }
    const newAddresses = [...savedAddresses];
    const addressData = {
      name: addressFormData.name,
      phone: addressFormData.phone,
      address: addressFormData.address,
      pincode: addressFormData.pincode,
      city: addressFormData.city,
      type: addressFormData.type
    };
    if (isAddingNewAddress) {
      // Add as new address
      const newId = `addr_${Date.now()}`;
      const newAddress: SavedAddress = {
        id: newId,
        ...addressData,
        isDefault: savedAddresses.length === 0 // Make default if it's the first address
      };
      newAddresses.push(newAddress);
      setSelectedAddressId(newId);
    } else if (isEditingAddress && selectedAddressId) {
      // Update existing address
      const index = newAddresses.findIndex(addr => addr.id === selectedAddressId);
      if (index >= 0) {
        newAddresses[index] = {
          ...newAddresses[index],
          ...addressData
        };
      }
    }
    // Save to localStorage
    localStorage.setItem(`saved_addresses_${user.uid}`, JSON.stringify(newAddresses));
    setSavedAddresses(newAddresses);
    // Update main form data
    if (selectedAddressId) {
      const selectedAddress = newAddresses.find(addr => addr.id === selectedAddressId);
      if (selectedAddress) {
        setFormData(prev => ({
          ...prev,
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          pincode: selectedAddress.pincode,
          city: selectedAddress.city,
        }));
      }
    }
    // Reset states
    setIsEditingAddress(false);
    setIsAddingNewAddress(false);
    setShowAddressDialog(false);
    toast({
      title: "Address Saved",
      description: "Your delivery address has been saved successfully."
    });
  }

  // Select an address
  const selectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id)
    setFormData(prev => ({
      ...prev,
      name: address.name,
      phone: address.phone,
      address: address.address,
      pincode: address.pincode,
      city: address.city,
    }))
    setShowAddressDialog(false)
  }

  // Open address dialog
  const openAddressDialog = () => {
    setShowAddressDialog(true)
    setIsEditingAddress(false)
    setIsAddingNewAddress(false)
  }

  // Get current location and find address
  const getCurrentLocation = () => {
    setIsLoadingAddress(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords

            // Use reverse geocoding to get address
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            )

            const data = await response.json()

            if (data.status === "OK" && data.results && data.results.length > 0) {
              // Extract address components
              let foundPincode = ""
              let foundCity = ""
              let foundAddress = data.results[0].formatted_address

              // Look for postal_code and locality in address components
              for (const result of data.results) {
                for (const component of result.address_components) {
                  if (component.types.includes("postal_code") && !foundPincode) {
                    foundPincode = component.long_name
                  }
                  if ((component.types.includes("locality") || component.types.includes("administrative_area_level_2")) && !foundCity) {
                    foundCity = component.long_name
                  }
                }
                if (foundPincode && foundCity) break
              }

              // Create a new address
              const newAddress: SavedAddress = {
                id: `addr_${Date.now()}`,
                name: formData.name || user?.displayName || "",
                phone: formData.phone || user?.phoneNumber?.replace('+91', '') || "",
                address: foundAddress,
                pincode: foundPincode || formData.pincode,
                city: foundCity || "",
                type: "Home",
                isDefault: savedAddresses.length === 0
              }

              // Save the new address
              const newAddresses = [...savedAddresses, newAddress]
              localStorage.setItem(`saved_addresses_${user?.uid}`, JSON.stringify(newAddresses))
              setSavedAddresses(newAddresses)
              setSelectedAddressId(newAddress.id)

              // Update form data
              setFormData(prev => ({
                ...prev,
                address: foundAddress,
                pincode: foundPincode || prev.pincode,
                city: foundCity || prev.city
              }))

              toast({
                title: "Address Updated",
                description: "Your delivery address has been updated based on your current location."
              })
            }
          } catch (error) {
            console.error("Error getting location:", error)
            toast({
              title: "Location Error",
              description: "Failed to get your location. Please enter address manually.",
              variant: "destructive"
            })
          } finally {
            setIsLoadingAddress(false)
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "Location Error",
            description: "Failed to access your location. Please check your browser permissions.",
            variant: "destructive"
          })
          setIsLoadingAddress(false)
        }
      )
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      })
      setIsLoadingAddress(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      // Validate name and phone
      if (!formData.name.trim()) {
        toast({ title: "Name Required", description: "Please enter your name.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.trim())) {
        toast({ title: "Mobile Number Required", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
      const deliveryFee = formData.deliveryOption === "standard" ? 40 : 60;
      const totalAmount = subtotal + deliveryFee;
      const orderData = {
        userId: user.uid,
        userName: formData.name,
        userPhone: formData.phone,
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount,
        deliveryFee,
        address: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          pincode: formData.pincode,
          city: formData.city,
        },
        paymentMethod: formData.paymentMethod as "cod" | "online",
        paymentStatus: "pending" as "pending" | "paid" | "failed",
        orderStatus: "pending" as "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled",
      };
      // If payment method is online, we would redirect to payment gateway here
      // For now, we'll just create the order directly
      const result = await createOrder(orderData);
      if (result.id) {
        clearCart();
        // Show appropriate message based on whether multiple orders were created
        if (result.orderCount && result.orderCount > 1) {
          toast({
            title: "Orders placed successfully!",
            description: `Your ${result.orderCount} orders have been placed with different vendors.`,
          });
        } else {
          toast({
            title: "Order placed successfully!",
            description: `Your order #${result.id.slice(0, 8).toUpperCase()} has been placed.`,
          });
        }
        // Use setTimeout to ensure toast is displayed before navigation
        setTimeout(() => {
          router.push(`/checkout/success?orderId=${result.id}${result.allOrderIds ? `&allOrderIds=${result.allOrderIds.join(',')}` : ''}`);
        }, 500);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Failed to place order",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate order summary
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const deliveryFee = formData.deliveryOption === "standard" ? 40 : 60
  const totalAmount = subtotal + deliveryFee

  // Get selected address
  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Delivery Address */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-semibold mb-3">Delivery Address</h2>

        {selectedAddress ? (
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <MapPin size={16} className="text-green-500 mr-2" />
                <span className="font-medium">{selectedAddress.type || "Home"}</span>
              </div>
              <p className="text-sm text-gray-600 ml-6 mt-1">
                {selectedAddress.address}
              </p>
              <p className="text-sm text-gray-600 ml-6">
                {selectedAddress.city}, {selectedAddress.pincode}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openAddressDialog}
              className="text-green-600 h-8 px-2"
            >
              Change Address
            </Button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">No address selected</p>
            <Button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLoadingAddress}
              variant="outline"
              size="sm"
              className="flex items-center h-8"
            >
              <MapPin size={14} className="mr-1" />
              {isLoadingAddress ? "Getting Location..." : "Use My Location"}
            </Button>
          </div>
        )}

        {/* Address Dialog */}
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Delivery Address</DialogTitle>
            </DialogHeader>

            {/* Address List */}
            {!isAddingNewAddress && !isEditingAddress && (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
                {savedAddresses.length > 0 ? (
                  savedAddresses.map(address => (
                    <Card
                      key={address.id}
                      className={`cursor-pointer border ${selectedAddressId === address.id ? 'border-orange-500' : 'border-gray-200'}`}
                      onClick={() => selectAddress(address)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <Home size={14} className="text-green-500 mr-1" />
                              <span className="font-medium text-sm">{address.type || "Home"}</span>
                              {address.isDefault && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">Default</span>
                              )}
                            </div>
                            <p className="text-sm mt-1">{address.address}</p>
                            <p className="text-xs text-gray-500">{address.city}, {address.pincode}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingAddress(address);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No saved addresses</div>
                )}

                <Button
                  type="button"
                  onClick={startNewAddress}
                  variant="outline"
                  className="w-full flex items-center justify-center"
                >
                  <Plus size={16} className="mr-2" />
                  Add New Address
                </Button>

                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLoadingAddress}
                  variant="outline"
                  className="w-full flex items-center justify-center"
                >
                  <MapPin size={16} className="mr-2" />
                  {isLoadingAddress ? "Getting Location..." : "Use Current Location"}
                </Button>
              </div>
            )}

            {/* Address Form */}
            {(isAddingNewAddress || isEditingAddress) && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="type" className="text-sm">Address Type</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        type="button"
                        onClick={() => setAddressFormData({ ...addressFormData, type: "home" })}
                        className={addressFormData.type === "home" ? getButtonClass(pathname) : ""}
                      >
                        <Home size={16} className="mr-2" />
                        Home
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setAddressFormData({ ...addressFormData, type: "work" })}
                        className={addressFormData.type === "work" ? getButtonClass(pathname) : ""}
                      >
                        <Briefcase size={16} className="mr-2" />
                        Work
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setAddressFormData({ ...addressFormData, type: "other" })}
                        className={addressFormData.type === "other" ? getButtonClass(pathname) : ""}
                      >
                        <MapPin size={16} className="mr-2" />
                        Other
                      </Button>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="name" className="text-sm">Full Name</Label>
                    <Input
                      id="name"
                      value={addressFormData.name}
                      onChange={handleAddressChange}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                    <Input
                      id="phone"
                      value={addressFormData.phone}
                      onChange={handleAddressChange}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="address" className="text-sm">Address</Label>
                    <Textarea
                      id="address"
                      value={addressFormData.address}
                      onChange={handleAddressChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pincode" className="text-sm">Pincode</Label>
                    <Input
                      id="pincode"
                      value={addressFormData.pincode}
                      onChange={handleAddressChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-sm">City</Label>
                    <Input
                      id="city"
                      value={addressFormData.city}
                      onChange={handleAddressChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingNewAddress(false)
                      setIsEditingAddress(false)
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={saveAddress}
                    className={getButtonClass(pathname)}
                    disabled={!addressFormData.address || !addressFormData.pincode}
                  >
                    Save Address
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Delivery Time */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-semibold mb-3">Delivery Time</h2>

        <RadioGroup
          value={formData.deliveryOption}
          onValueChange={(value) => handleRadioChange("deliveryOption", value)}
          className="space-y-2"
        >
          <div className={`flex items-center p-3 rounded-lg border ${formData.deliveryOption === "express" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
            <RadioGroupItem value="express" id="express" className="mr-3" />
            <div className="flex items-start flex-1">
              <Clock size={18} className="text-green-500 mr-2 mt-0.5" />
              <div>
                <Label htmlFor="express" className="font-medium cursor-pointer">Express Delivery</Label>
                <p className="text-xs text-gray-600">Arrives within 20-45 minutes</p>
              </div>
            </div>
          </div>

          <div className={`flex items-center p-3 rounded-lg border ${formData.deliveryOption === "standard" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
            <RadioGroupItem value="standard" id="standard" className="mr-3" />
            <div className="flex items-start flex-1">
              <Truck size={18} className="text-green-500 mr-2 mt-0.5" />
              <div>
                <Label htmlFor="standard" className="font-medium cursor-pointer">Standard Delivery</Label>
                <p className="text-xs text-gray-600">Arrives within 45-60 minutes</p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-semibold mb-3">Order Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Fee</span>
            <span>₹{deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium border-t pt-2 mt-2">
            <span>Total</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-semibold mb-3">Payment Method</h2>

        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={(value) => handleRadioChange("paymentMethod", value)}
          className="space-y-2"
        >
          <div className={`flex items-center p-3 rounded-lg border ${formData.paymentMethod === "cod" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
            <RadioGroupItem value="cod" id="cod" className="mr-3" />
            <div>
              <Label htmlFor="cod" className="font-medium cursor-pointer">Cash on Delivery</Label>
              <p className="text-xs text-gray-600">Pay when your order arrives</p>
            </div>
          </div>

          <div className={`flex items-center p-3 rounded-lg border ${formData.paymentMethod === "online" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
            <RadioGroupItem value="online" id="online" className="mr-3" />
            <div>
              <Label htmlFor="online" className="font-medium cursor-pointer">Online Payment</Label>
              <p className="text-xs text-gray-600">Pay now with card, UPI, or wallet</p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className={`w-full ${getButtonClass(pathname)}`} disabled={isSubmitting || !selectedAddress}>
        {isSubmitting ? "Processing..." : "Place Order"}
      </Button>
    </form>
  )
}
