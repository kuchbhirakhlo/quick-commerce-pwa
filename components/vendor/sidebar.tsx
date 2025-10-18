"use client"

import { usePathname } from "next/navigation"
import { BarChart3, Home, LogOut, Package, Settings, ShoppingBag, User, MapPin, Grid } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useVendor } from "@/lib/context/vendor-provider"
import { Button } from "../ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import PWAInstallButton from "@/components/pwa-install-button"

interface SidebarNavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
  color?: string
}

function SidebarNavItem({ href, icon, label, onClick, color = "text-indigo-600" }: SidebarNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        isActive
          ? "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-900 font-medium border-l-4 border-indigo-600"
          : "text-gray-600 hover:bg-blue-50"
      )}
    >
      <div className={cn(
        "rounded-md p-1",
        isActive ? color : "text-gray-500"
      )}>
        {icon}
      </div>
      {label}
    </Link>
  )
}

interface SidebarProps {
  onNavItemClick?: () => void
}

export function Sidebar({ onNavItemClick }: SidebarProps) {
  const { logout } = useVendor()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      router.push("/vendor/login")
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex flex-col h-full py-4 space-y-4">
      <div className="px-3 py-2">
        <div className="space-y-1">
          <SidebarNavItem
            href="/vendor"
            icon={<Home className="h-4 w-4" />}
            label="Dashboard"
            onClick={onNavItemClick}
            color="text-blue-600"
          />
          <SidebarNavItem
            href="/vendor/products"
            icon={<Package className="h-4 w-4" />}
            label="Products"
            onClick={onNavItemClick}
            color="text-green-600"
          />
          <SidebarNavItem
            href="/vendor/categories"
            icon={<Grid className="h-4 w-4" />}
            label="Categories"
            onClick={onNavItemClick}
            color="text-amber-600"
          />
          <SidebarNavItem
            href="/vendor/orders"
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Orders"
            onClick={onNavItemClick}
            color="text-purple-600"
          />
          <SidebarNavItem
            href="/vendor/profile"
            icon={<User className="h-4 w-4" />}
            label="Profile"
            onClick={onNavItemClick}
            color="text-cyan-600"
          />
          <SidebarNavItem
            href="/vendor/profile/pincodes"
            icon={<MapPin className="h-4 w-4" />}
            label="Delivery Areas"
            onClick={onNavItemClick}
            color="text-red-600"
          />
          <SidebarNavItem
            href="/vendor/analytics"
            icon={<BarChart3 className="h-4 w-4" />}
            label="Analytics"
            onClick={onNavItemClick}
            color="text-indigo-600"
          />
          <SidebarNavItem
            href="/vendor/settings"
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            onClick={onNavItemClick}
            color="text-gray-600"
          />
        </div>
      </div>

      {/* PWA Install Section */}
      <div className="px-3 py-2">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-2">Install App</p>
          <p className="text-xs text-blue-700 mb-3">Get live order notifications</p>
          <PWAInstallButton
            variant="outline"
            size="sm"
            className="w-full bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            label="Install App"
          />
        </div>
      </div>

      <div className="px-3 py-2 mt-auto">
        <Button
          variant="outline"
          className="w-full justify-start bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300"
          onClick={() => {
            handleLogout();
            onNavItemClick?.();
          }}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  )
} 