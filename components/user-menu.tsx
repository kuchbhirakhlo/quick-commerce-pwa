"use client"

import Link from "next/link"
import { User as UserIcon, Clock, Heart } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useAuth } from "@/lib/context/auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth()  // ✅ get live user state from context
  const router = useRouter()

  // Not logged in → show login button
  if (!user) {
    return (
      <button
        onClick={() => {
          localStorage.removeItem("redirect_to_checkout")
          window.dispatchEvent(new CustomEvent("show-login-modal"))
          if (onNavigate) onNavigate()
        }}
        className="flex items-center justify-center p-2 text-gray-600"
      >
        <UserIcon size={20} />
        <span className="ml-1 text-sm font-medium">Login</span>
      </button>
    )
  }

  // Logged in → show profile menu
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center justify-center p-2 text-gray-600">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || "User"}
              width={28}
              height={28}
              className="rounded-full border"
            />
          ) : (
            <UserIcon size={22} />
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[85vw] sm:w-[350px] p-0 pt-4 z-50"
        style={{ position: "fixed", top: 0, bottom: 0, height: "100dvh" }}
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
              <h2 className="text-xl font-bold">{user.displayName || "Account"}</h2>
            </div>
          </div>

          <div className="flex-1">
            <nav>
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
                  href="/wishlist"
                  className="flex items-center p-4 hover:bg-gray-50 border-b"
                >
                  <Heart size={20} className="mr-3 text-emerald-600" />
                  <span>My Wishlist</span>
                </Link>
              </SheetClose>
            </nav>
          </div>

          <div className="mt-auto p-4 pb-20 sm:pb-4">
            <SheetClose asChild>
              <button
                onClick={async () => {
                  try {
                    await signOut()
                    localStorage.removeItem("redirect_to_checkout")
                    router.push("/")
                    router.refresh()
                  } catch (error) {
                    console.error("Sign out error:", error)
                  }
                }}
                className="flex items-center justify-center p-3 text-white w-full rounded-md bg-emerald-500 hover:bg-emerald-600"
              >
                <span>Logout</span>
              </button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
