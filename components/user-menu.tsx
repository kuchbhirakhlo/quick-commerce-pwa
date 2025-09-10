"use client"

import Link from "next/link"
import { User, Clock, MapPin, Heart, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/context/auth-context"
import LoginModal from "./auth/login-modal"
import { useState, useEffect } from "react"

interface AuthUser {
  photoURL?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  // Add other properties as needed
}

interface UserMenuProps {
  user?: AuthUser | null;
  onNavigate?: () => void;
}

export default function UserMenu({ user, onNavigate }: UserMenuProps) {
  const { signOut } = useAuth() as { signOut: () => Promise<{ success: boolean; error?: string }> }
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Listen for custom event to show login modal
  useEffect(() => {
    const handleShowLoginModal = () => {
      setShowLoginModal(true);
    };
    window.addEventListener('show-login-modal', handleShowLoginModal);
    return () => {
      window.removeEventListener('show-login-modal', handleShowLoginModal);
    };
  }, []);

  if (!user) {
    return (
      <>
        <button
          onClick={() => {
            localStorage.removeItem("redirect_to_checkout");
            setShowLoginModal(true);
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
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center justify-center w-full py-1 text-gray-500">
          <div className="flex justify-center">
            {user && user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-8 h-8 rounded-full border"
              />
            ) : (
              <User size={22} />
            )}
          </div>
          <span className="text-xs mt-1">{user?.displayName || "Account"}</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[85vw] sm:w-[350px] p-0 pt-4 z-50"
        style={{ position: 'fixed', top: 0, bottom: 0, height: '100dvh' }}
      >
        <div className="flex flex-col h-full bg-white">
          <div className="px-4 pb-4 mb-2">
            <div className="flex items-center gap-2">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-10 h-10 rounded-full border"
                />
              )}
              <h2 className="text-xl font-bold">{user.displayName || "My Account"}</h2>
            </div>
            {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
            {user.phoneNumber && <p className="text-sm text-gray-500">{user.phoneNumber}</p>}
            {!user.phoneNumber && (
              <p className="text-xs text-gray-400">Google sign-in does not provide phone number by default.</p>
            )}
            <Link
              href="/cart"
              className="flex items-center p-4 hover:bg-gray-50 border-b"
              onClick={onNavigate}
            >
              <span className="mr-3 text-emerald-600">🛒</span>
              <span>My Cart</span>
            </Link>
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