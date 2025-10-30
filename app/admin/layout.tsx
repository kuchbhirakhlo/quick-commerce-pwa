"use client"

import { useState, useEffect } from "react"
import type React from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { BarChart3, Home, Package, Settings, ShoppingBag, Users, LogOut, Layers, Image, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import PWAInstallButton from "@/components/pwa-install-button"
import { getAuth } from "firebase/auth"
import AdminAuthCheck from "@/components/admin/admin-auth-check"
import Cookies from "js-cookie"
import Head from "next/head"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === "/admin/login"
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const auth = getAuth()

      // First remove cookie to prevent redirect loops
      Cookies.remove("admin_session")

      // Then sign out from Firebase
      await auth.signOut()

      // Delay navigation slightly to ensure state updates complete
      setTimeout(() => {
        router.push("/admin/login")
      }, 100)
    } catch (error) {
      console.error("Error signing out:", error)
      setIsLoggingOut(false)
    }
  }

  // Don't show admin layout on login page
  if (isLoginPage) {
    return (
      <>
        <Head>
          <link rel="manifest" href="/admin-manifest.json" />
          <meta name="theme-color" content="#3b82f6" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="QC Admin" />
          <link rel="apple-touch-icon" href="/icons/admin-icon-192x192.png" />
        </Head>
        {children}
      </>
    )
  }

  return (
    <AdminAuthCheck>
      <Head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QC Admin" />
        <link rel="apple-touch-icon" href="/icons/admin-icon-192x192.png" />
      </Head>
      <div className="min-h-screen flex">
        <aside className="w-64 bg-gray-900 text-white p-4 hidden md:block">
          <div className="mb-8">
            <h1 className="text-xl font-bold">Buzzat Admin</h1>
          </div>

          <nav className="space-y-1">
            <NavItem href="/admin/orders" icon={<ShoppingBag size={18} />} label="Orders" />
            <NavItem href="/admin" icon={<Home size={18} />} label="Dashboard" />
            <NavItem href="/admin/vendors" icon={<Users size={18} />} label="Vendors" />
            <NavItem href="/admin/categories" icon={<Layers size={18} />} label="Categories" />
            <NavItem href="/admin/products" icon={<Package size={18} />} label="Products" />
            <NavItem href="/admin/banner-cards" icon={<Image size={18} />} label="Banner Cards" />
            <NavItem href="/admin/analytics" icon={<BarChart3 size={18} />} label="Analytics" />
            <NavItem href="/admin/settings" icon={<Settings size={18} />} label="Settings" />
          </nav>

          <div className="mt-auto pt-4">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors w-full disabled:opacity-50"
            >
              {isLoggingOut ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut size={18} />
                  <span>Logout</span>
                </>
              )}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden mr-4">
                    <span className="sr-only">Toggle menu</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <line x1="3" x2="21" y1="6" y2="6" />
                      <line x1="3" x2="21" y1="12" y2="12" />
                      <line x1="3" x2="21" y1="18" y2="18" />
                    </svg>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="bg-gray-900 text-white p-4 h-full">
                    <div className="mb-8">
                      <h1 className="text-xl font-bold">Buzzat Admin</h1>
                    </div>
                    <nav className="space-y-1">
                      <NavItem href="/admin/orders" icon={<ShoppingBag size={18} />} label="Orders" onClick={() => setIsMobileMenuOpen(false)} />
                      <NavItem href="/admin" icon={<Home size={18} />} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
                      <NavItem href="/admin/vendors" icon={<Users size={18} />} label="Vendors" onClick={() => setIsMobileMenuOpen(false)} />
                      <NavItem href="/admin/categories" icon={<Layers size={18} />} label="Categories" onClick={() => setIsMobileMenuOpen(false)} />
                      <NavItem href="/admin/products" icon={<Package size={18} />} label="Products" onClick={() => setIsMobileMenuOpen(false)} />
                      <NavItem href="/admin/banner-cards" icon={<Image size={18} />} label="Banner Cards" onClick={() => setIsMobileMenuOpen(false)} />
                      <NavItem href="/admin/analytics" icon={<BarChart3 size={18} />} label="Analytics" onClick={() => setIsMobileMenuOpen(false)} />
                      <NavItem href="/admin/settings" icon={<Settings size={18} />} label="Settings" onClick={() => setIsMobileMenuOpen(false)} />
                    </nav>
                    <div className="mt-auto pt-4">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          handleLogout()
                        }}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors w-full disabled:opacity-50"
                      >
                        {isLoggingOut ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                            <span>Logging out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut size={18} />
                            <span>Logout</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-lg font-medium">Admin Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/admin/orders" className="relative">
                <BellRing size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </Link>
              <PWAInstallButton
                variant="outline"
                size="sm"
                className="hidden md:flex"
                label="Install Admin App"
                type="admin"
              />
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-current"></div>
                  ) : (
                    <LogOut size={18} />
                  )}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto">{children}</main>
        </div>
      </div>
    </AdminAuthCheck>
  )
}

function NavItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
