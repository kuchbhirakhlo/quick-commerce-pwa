"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Product {
  id: string
  name: string
  price: number
  unit: string
  image: string
  quantity?: number
}

interface CartItem extends Product {
  quantity: number
}

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [currentPincode, setCurrentPincode] = useState<string>("")
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      // Get current pincode
      const pincode = localStorage.getItem("pincode") || ""
      setCurrentPincode(pincode)
      
      // Get cart for this pincode
      const cartKey = `cart_${pincode}`
      const savedCart = localStorage.getItem(cartKey)
      
    if (savedCart) {
      try {
          const parsedCart = JSON.parse(savedCart)
          setCartItems(parsedCart)
      } catch (error) {
          console.error(`Failed to parse cart from localStorage (${cartKey}):`, error)
          // If there's an error parsing, initialize with empty cart
          setCartItems([])
        }
      } else {
        // No cart for this pincode yet
        setCartItems([])
      }
      
      setIsInitialized(true)
    }
    
    loadCart()
  }, [])
  
  // Listen for pincode changes from other tabs/windows and custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pincode" && e.newValue !== currentPincode) {
        // Pincode changed in another tab/window
        const newPincode = e.newValue || ""
        setCurrentPincode(newPincode)
        
        // Load cart for the new pincode
        const cartKey = `cart_${newPincode}`
        const savedCart = localStorage.getItem(cartKey)
        
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart))
          } catch (error) {
            console.error(`Failed to parse cart for new pincode:`, error)
            setCartItems([])
          }
        } else {
          setCartItems([])
        }
      }
    }
    
    // Handle custom pincodeChange event for browsers that don't support StorageEvent constructor
    const handleCustomPincodeChange = (e: CustomEvent<{ newPincode: string; oldPincode: string }>) => {
      const { newPincode } = e.detail;
      if (newPincode !== currentPincode) {
        setCurrentPincode(newPincode);
        
        // Load cart for the new pincode
        const cartKey = `cart_${newPincode}`;
        const savedCart = localStorage.getItem(cartKey);
        
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart));
          } catch (error) {
            console.error(`Failed to parse cart for new pincode:`, error);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pincodeChange", handleCustomPincodeChange as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pincodeChange", handleCustomPincodeChange as EventListener);
    };
  }, [currentPincode]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Only save after initialization to prevent overwriting with empty cart
    if (isInitialized && currentPincode) {
      const cartKey = `cart_${currentPincode}`
      localStorage.setItem(cartKey, JSON.stringify(cartItems))
    }
  }, [cartItems, currentPincode, isInitialized])

  // Monitor pincode changes within the same tab
  useEffect(() => {
    const checkPincodeChange = () => {
      const storedPincode = localStorage.getItem("pincode") || ""
      
      // If pincode changed and we have a current pincode (not initial load)
      if (currentPincode && storedPincode !== currentPincode) {
        setCurrentPincode(storedPincode)
        
        // Load cart for the new pincode
        const cartKey = `cart_${storedPincode}`
        const savedCart = localStorage.getItem(cartKey)
        
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart))
          } catch (error) {
            console.error("Failed to parse cart for new pincode:", error)
            setCartItems([])
          }
        } else {
          setCartItems([])
        }
      }
    }
    
    // Check periodically for pincode changes
    const interval = setInterval(checkPincodeChange, 1000)
    return () => clearInterval(interval)
  }, [currentPincode])

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0)

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)

      if (existingItem) {
        return prevItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prevItems, { ...product, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCartItems([])
    if (currentPincode) {
      const cartKey = `cart_${currentPincode}`
      localStorage.removeItem(cartKey)
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
