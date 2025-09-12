"use client"

import Link from "next/link"
import { User, Clock, MapPin, Heart, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useAuth } from "@/lib/context/auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { User as FirebaseUser } from "firebase/auth"

interface UserMenuProps {
  user?: FirebaseUser | null;
  onNavigate?: () => void;
}


export default function UserMenu({ onNavigate }: UserMenuProps) {
  const { user, signOut } = useAuth() as { user: FirebaseUser | null; signOut: () => Promise<any>; }
  const router = useRouter()

  if (!user) {
    return (
      <button
        onClick={() => {
          localStorage.removeItem("redirect_to_checkout");
          window.dispatchEvent(new CustomEvent('show-login-modal'));
          if (onNavigate) onNavigate();
        }}
        className="flex flex-col items-center justify-center w-full py-1 text-gray-500"
      >
        <div className="flex justify-center">
          <User size={22} />
        </div>
        <span className="text-xs mt-1">Login</span>
      </button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center justify-center w-full py-1 text-gray-500">
          <div className="flex justify-center">
            {user && user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={32}
                height={32}
                className="rounded-full border"
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
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  width={40}
                  height={40}
                  className="rounded-full border"
                />
              )}
              <h2 className="text-xl font-bold">{user.displayName || "MAccount"}</h2>
            </div>
            {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
            {user.phoneNumber && <p className="text-sm text-gray-500">{user.phoneNumber}</p>}
            {!user.phoneNumber && !user.email && <p className="text-sm text-gray-500">No contact info available</p>
            }
            <SheetClose asChild>
              <Link
                href="/cart"
                className="flex items-center p-4 hover:bg-gray-50 border-b"
              >
                <span className="mr-3 text-emerald-600">🛒</span>
                <span>My Cart</span>
              </Link>
            </SheetClose>
          </div>

          <div className="flex-1">
            <nav className="space-y-0">
              <SheetClose asChild>
                <Link
                  href="/account/orders"
                  className="flex items-center p-4 hover:bg-gray-50 border-b"
                >
                  <Clock size={20} className="mr-3 text-emerald-600" />
                  <span>My Orders</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/account/addresses"
                  className="flex items-center p-4 hover:bg-gray-50 border-b"
                >
                  <MapPin size={20} className="mr-3 text-emerald-600" />
                  <span>My Addresses</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/wishlist"
                  className="flex items-center p-4 hover:bg-gray-50 border-b"
                >
                  <Heart size={20} className="mr-3 text-emerald-600" />
                  <span>My Wishlist</span>
                </Link>
              </SheetClose>
            </nav>
          </div>

          <div className="mt-auto p-4 pt-6 pb-20 sm:pb-4">
            <SheetClose asChild>
              <button
                onClick={async () => {
                  try {
                    const result = await signOut();
                    if (result.success) {
                      // Clear any checkout redirects
                      localStorage.removeItem("redirect_to_checkout");
                      // Use router for cleaner navigation
                      router.push('/');
                      router.refresh();
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
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
