"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingCart, User, LogOut, ChevronDown, Clock, MapPin, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/context/auth-context"
import { useFirebase } from "@/lib/context/firebase-provider"
import LoginModal from "./auth/login-modal"
import PincodeSelector from "./pincode-selector"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input as DialogInput } from "@/components/ui/input"
import { usePincode } from "@/lib/hooks/use-pincode"
import { isPincodeServiceable, getAllCategories } from "@/lib/firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import CartItem from "./cart-item"
import { ProductSearch } from "./product-search"
import { isAdminOrVendorPage, getButtonClass } from "@/lib/utils"

interface Category {
  id: string;
  name: string;
  icon?: string;
}

// Function to convert category name to URL-friendly slug
function createSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function Header() {
  const { cartItems, cartCount, clearCart } = useCart()
  const { user, signOut, loading: authLoading } = useAuth()
  const { isAuthInitialized, isLoading: firebaseLoading } = useFirebase()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Add state for categories
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Pincode related state
  const { pincode, updatePincode, isLoading: pincodeLoading } = usePincode()
  const [inputPincode, setInputPincode] = useState("")
  const [openPincodeDialog, setOpenPincodeDialog] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()

  // Address related state
  const [address, setAddress] = useState("")
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)

  // Estimate delivery time (would come from admin/backend)
  const [deliveryTime, setDeliveryTime] = useState("8")

  // Only show auth UI after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)

    // Update input pincode when pincode changes
    if (pincode) {
      setInputPincode(pincode)
      // Fetch address for the pincode
      fetchAddressFromPincode(pincode)
    }

    // Fetch categories
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const allCategories = await getAllCategories() as Category[];
        setCategories(allCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();

    // Listen for custom event to show login modal from other components (like BottomNav)
    const handleShowLoginModalEvent = () => {
      setShowLoginModal(true);
    };

    window.addEventListener('show-login-modal', handleShowLoginModalEvent);

    return () => {
      window.removeEventListener('show-login-modal', handleShowLoginModalEvent);
    };

  }, [pincode]);

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        // Clear any checkout redirects
        localStorage.removeItem("redirect_to_checkout");
        // Force a refresh to ensure auth state is updated
        router.refresh();
      } else {
        console.error("Sign out failed:", result.error);
      }
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  }

  // Fetch address from pincode using Google Maps API
  const fetchAddressFromPincode = async (pincode: string) => {
    if (!pincode) return

    setIsLoadingAddress(true)
    try {
      // Using Google Maps Geocoding API
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
      const data = await response.json()

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address
        setAddress(formattedAddress)
        // Save address to localStorage for future use
        localStorage.setItem(`address_${pincode}`, formattedAddress)
      } else {
        // If no results, check if we have a cached address
        const cachedAddress = localStorage.getItem(`address_${pincode}`)
        if (cachedAddress) {
          setAddress(cachedAddress)
        } else {
          setAddress("")
        }
      }
    } catch (error) {
      console.error("Error fetching address:", error)
      // Try to use cached address if available
      const cachedAddress = localStorage.getItem(`address_${pincode}`)
      if (cachedAddress) {
        setAddress(cachedAddress)
      } else {
        setAddress("")
      }
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
                  // Check if pincode is changing
                  if (pincode !== foundPincode) {
                    // Clear cart immediately when pincode changes
                    clearCart()
                  }

                  // Check if the pincode is serviceable
                  const serviceable = await isPincodeServiceable(foundPincode)

                  // Save pincode regardless of serviceability
                  updatePincode(foundPincode)
                  setOpenPincodeDialog(false)

                  if (serviceable) {
                    // Reload the page to fetch new data based on updated pincode
                    window.location.reload()
                  } else {
                    // Redirect to coming soon page if not serviceable
                    router.push("/coming-soon")
                  }
                } catch (error) {
                  console.error("Error checking pincode serviceability:", error)
                  // On error, update pincode and reload anyway
                  updatePincode(foundPincode)
                  setOpenPincodeDialog(false)
                  window.location.reload()
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

  // Handle pincode submission
  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputPincode.length === 6 && /^\d+$/.test(inputPincode)) {
      setIsChecking(true)

      try {
        // No need to clear cart manually, the cart context will handle this
        // when the pincode changes through localStorage events

        // Check if the pincode is serviceable
        const serviceable = await isPincodeServiceable(inputPincode)

        // Save pincode regardless of serviceability
        updatePincode(inputPincode)
        setOpenPincodeDialog(false)

        if (serviceable) {
          // No need to reload the page, just refresh the router
          router.refresh()
        } else {
          // Redirect to coming soon page if not serviceable
          router.push("/coming-soon")
        }
      } catch (error) {
        console.error("Error checking pincode serviceability:", error)
        // On error, update pincode but don't reload
        updatePincode(inputPincode)
        setOpenPincodeDialog(false)
        router.refresh()
      } finally {
        setIsChecking(false)
      }
    }
  }

  // Handle login modal
  const handleLoginClick = () => {
    // Clear any previous errors or state
    setShowLoginModal(true);
  }

  // Close login modal
  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  }

  // Determine if we're in a loading state
  const loading = !mounted || firebaseLoading || authLoading || !isAuthInitialized

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      {/* Mobile header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center">
            <Image src="/logo.webp" alt="Buzzat" width={90} height={36} className="h-12 w-auto" priority />
          </Link>
        </div>

        {/* Work location selector and pincode for mobile */}
        <Dialog open={openPincodeDialog} onOpenChange={setOpenPincodeDialog}>
          <DialogTrigger asChild>
            <div className="flex items-center px-4 py-1 bg-gray-50 text-sm font-medium cursor-pointer">
              <div className="flex items-center">
                <MapPin size={16} className="mr-1 text-gray-600" />
                <span className="text-gray-600">
                  {address ? (
                    <span className="truncate max-w-[200px] inline-block">{address.split(',').slice(0, 2).join(',')}</span>
                  ) : (
                    "Select Location"
                  )}
                </span>
                <ChevronDown size={16} className="ml-1 text-gray-500" />
              </div>
              <div className="ml-auto text-xs text-gray-500">
                {pincodeLoading ? "Loading..." : `PIN: ${pincode}`}
              </div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter your delivery location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center"
                onClick={getCurrentLocation}
                disabled={useCurrentLocation || isLoadingAddress || isChecking}
              >
                <MapPin size={16} />
                {isLoadingAddress ? "Getting location..." : isChecking ? "Checking serviceability..." : "Use current location"}
              </Button>

              {address && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Delivery Address</p>
                  <p className="text-sm text-gray-600">{address}</p>
                </div>
              )}

              <form onSubmit={handlePincodeSubmit} className="space-y-4">
                <div>
                  <label htmlFor="pincode" className="text-sm font-medium block mb-1">Pincode</label>
                  <DialogInput
                    id="pincode"
                    type="text"
                    placeholder="Enter 6-digit pincode"
                    value={inputPincode}
                    onChange={(e) => setInputPincode(e.target.value)}
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={inputPincode.length !== 6 || !/^\d+$/.test(inputPincode) || isChecking}
                >
                  {isChecking ? "Checking..." : "Continue"}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search bar for mobile */}
        <div className="px-4 py-2">
          <ProductSearch />
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/logo.webp" alt="Buzzat" width={100} height={40} className="h-20" priority />
            </Link>

            <div className="ml-4">
              <PincodeSelector headerStyle={true} />
            </div>
          </div>

          <div className="flex relative w-1/2 max-w-xl">
            <ProductSearch />
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-700">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || "User profile"}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    ) : (
                      <User size={20} />
                    )}
                    <span className="hidden md:inline">Hi,{user.displayName || user.phoneNumber || "Account"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700"
                onClick={handleLoginClick}
                disabled={!isAuthInitialized}
              >
                <User size={20} className="mr-2" />
                <span className="hidden md:inline">Login</span>
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-xl px-0 md:overflow-auto overflow-hidden">
                <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
                <div className="h-full flex flex-col px-4">
                  <div className="flex justify-between items-center pb-3 border-b mb-2">
                    <h2 className="text-xl font-bold">Your Cart</h2>
                  </div>
                  {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <ShoppingCart size={64} className="text-gray-300 mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                      <Button className={`mt-4 ${getButtonClass(pathname)}`}>Start Shopping</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto pb-4 md:static md:h-auto max-h-[50vh] md:max-h-none">
                        {cartItems.map(item => (
                          <CartItem
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            price={item.price}
                            unit={item.unit}
                            image={item.image}
                            quantity={item.quantity}
                          />
                        ))}
                      </div>
                      <div className="border-t pt-4 mt-auto md:static md:pb-0 sticky bottom-0 left-0 right-0 bg-white px-4 md:px-0">
                        <div className="flex justify-between mb-2">
                          <span>Subtotal</span>
                          <span>₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                          <span>Delivery Fee</span>
                          <span>₹40.00</span>
                        </div>
                        <div className="flex justify-between font-bold mb-4">
                          <span>Total</span>
                          <span>₹{(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 40).toFixed(2)}</span>
                        </div>
                        <div className="pb-20 md:pb-4">
                          <Button
                            className={`w-full ${getButtonClass(pathname)} md:static fixed bottom-4 left-0 right-0 mx-4 md:mx-0 z-10`}
                            onClick={() => {
                              if (!user) {
                                // Set a flag to redirect to checkout after login
                                localStorage.setItem("redirect_to_checkout", "true")
                                setShowLoginModal(true)
                              } else {
                                router.push('/checkout')
                              }
                            }}
                          >
                            {user ? "Proceed to Checkout" : "Login to Checkout"}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Navigation with Categories */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center overflow-x-auto hide-scrollbar">
              {isLoadingCategories ? (
                <div className="py-3 px-4">Loading categories...</div>
              ) : categories.length > 0 ? (
                categories.map((category) => {
                  const categorySlug = `${createSlug(category.name)}-${category.id}`;
                  return (
                    <Link
                      key={category.id}
                      href={`/category/${categorySlug}`}
                      className={`py-3 px-4 whitespace-nowrap text-sm font-medium transition-colors ${pathname.includes(`/category/${categorySlug}`) ||
                        pathname === `/category/${category.id}`
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-emerald-600'
                        }`}
                    >
                      {category.name}
                    </Link>
                  );
                })
              ) : (
                <div className="py-3 px-4 text-gray-500">No categories found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && <LoginModal onClose={handleCloseLoginModal} />}
    </header>
  )
}
