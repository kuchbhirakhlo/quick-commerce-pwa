"use client"

import Link from "next/link"
import { User, Clock, MapPin, Heart, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/context/auth-context"
import { LoginModal } from "./auth/login-modal"
import { useState, useEffect } from "react"

interface UserMenuProps {
  onNavigate?: () => void;
}

export default function UserMenu({ onNavigate }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Listen for custom event to show login modal
  useEffect(() => {
    const handleShowLoginModal = () => {
      setShowLoginModal(true)
    }
    
    window.addEventListener('show-login-modal', handleShowLoginModal)
    
    return () => {
      window.removeEventListener('show-login-modal', handleShowLoginModal)
    }
  }, [])

  if (!user) {
    return (
      <>
        <button
          onClick={() => {
            // Don't set redirect flag when clicking login from navbar
            localStorage.removeItem("redirect_to_checkout")
            // Ensure login modal appears when clicking the user icon
            setShowLoginModal(true)
            // Call onNavigate if provided
            if (onNavigate) onNavigate();
          }}
          className="flex flex-col items-center justify-center w-full py-1 text-gray-500"
        >
          <div className="flex justify-center">
            <User size={22} />
          </div>
          <span className="text-xs mt-1">Login</span>
        </button>
        
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      </>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center justify-center w-full py-1 text-gray-500">
          <div className="flex justify-center">
            <User size={22} />
          </div>
          <span className="text-xs mt-1">Account</span>
        </button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[85vw] sm:w-[350px] p-0 pt-4 z-50"
        style={{ position: 'fixed', top: 0, bottom: 0, height: '100dvh' }}
      >
        <div className="flex flex-col h-full bg-white">
          <div className="px-4 pb-4 mb-2">
            <h2 className="text-xl font-bold">My Account</h2>
            <p className="text-sm text-gray-500">{user.phoneNumber}</p>
          </div>
          
          <div className="flex-1">
            <nav className="space-y-0">
              <Link 
                href="/account/orders" 
                className="flex items-center p-4 hover:bg-gray-50 border-b"
                onClick={onNavigate}
              >
                <Clock size={20} className="mr-3 text-emerald-600" />
                <span>My Orders</span>
              </Link>
              <Link 
                href="/account/addresses" 
                className="flex items-center p-4 hover:bg-gray-50 border-b"
                onClick={onNavigate}
              >
                <MapPin size={20} className="mr-3 text-emerald-600" />
                <span>My Addresses</span>
              </Link>
              <Link 
                href="/wishlist" 
                className="flex items-center p-4 hover:bg-gray-50 border-b"
                onClick={onNavigate}
              >
                <Heart size={20} className="mr-3 text-emerald-600" />
                <span>My Wishlist</span>
              </Link>
            </nav>
          </div>
          
          <div className="mt-auto p-4 pt-6 pb-20 sm:pb-4">
            <button 
              onClick={async () => {
                try {
                  // Call onNavigate if provided
                  if (onNavigate) onNavigate();
                  
                  const result = await signOut();
                  if (result.success) {
                    // Clear any checkout redirects
                    localStorage.removeItem("redirect_to_checkout");
                    // Force a hard navigation to homepage to ensure auth state is refreshed
                    window.location.href = '/';
                  } else {
                    console.error("Sign out failed:", result.error);
                    alert("Failed to sign out. Please try again.");
                  }
                } catch (error) {
                  console.error("Error during sign out:", error);
                  alert("An error occurred during sign out.");
                }
              }}
              className="flex items-center justify-center p-3 text-white w-full rounded-md bg-emerald-500 hover:bg-emerald-600"
            >
              <span>Logout App</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 