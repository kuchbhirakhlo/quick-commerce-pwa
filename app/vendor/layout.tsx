"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, Home, Package, Settings, ShoppingBag, User, Menu, X, BellRing, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import PWAInstallButton from "@/components/pwa-install-button"
import { VendorProvider, useVendor } from "@/lib/context/vendor-provider"
import { Sidebar } from "@/components/vendor/sidebar"
import Spinner from "@/components/ui/spinner"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"

// Redirect component that handles vendor authentication status
function VendorAuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, vendor } = useVendor()
  const pathname = usePathname()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Skip auth check for login and auth-check pages
  const isAuthPage = pathname === "/vendor/login" || pathname === "/vendor/auth-check"

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isLoading) {
      // If not authenticated and not on auth page, redirect to login
      if (!isAuthenticated && !isAuthPage) {
        console.log("Redirecting to login page")
        router.push("/vendor/login")
      }
      // If authenticated but not active status and not on auth check page
      else if (isAuthenticated && vendor && vendor.status !== "active" && pathname !== "/vendor/auth-check") {
        console.log(`Redirecting to auth check page. Vendor status: ${vendor.status}`)
        router.push("/vendor/auth-check")
      }
      // If on login page but already authenticated, redirect to dashboard
      else if (isAuthenticated && pathname === "/vendor/login") {
        console.log("Already authenticated, redirecting to dashboard")
        router.push("/vendor")
      }
    }
  }, [isAuthenticated, isLoading, isClient, pathname, router, vendor])

  // Show loading when auth state is being determined
  if (isLoading || !isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // For login page or auth check page, just render the page
  if (isAuthPage) {
    return <>{children}</>
  }

  // For protected pages, check if authenticated and active
  if (!isAuthenticated) {
    return null // Will redirect on mount
  }

  // If user is authenticated but not active, redirect to auth check
  if (vendor && vendor.status !== "active") {
    return null // Will redirect on mount
  }

  // Otherwise, render the protected children
  return <>{children}</>
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { vendor } = useVendor()
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  // Check if it's the login page
  const isLoginPage = pathname === "/vendor/login"
  const isAuthCheckPage = pathname === "/vendor/auth-check"

  // Check for new orders
  useEffect(() => {
    if (vendor && vendor.pincodes && vendor.pincodes.length > 0) {
      // This would be replaced with actual order checking logic
      // For demo purposes, we'll just set a random count
      setNewOrdersCount(Math.floor(Math.random() * 3))
    }
  }, [vendor])

  return (
    <VendorProvider>
      <Script id="force-vendor-manifest" strategy="beforeInteractive">
        {`
          try {
            var link = document.querySelector('link[rel="manifest"]');
            if (link) {
              link.setAttribute('href', '/vendor-manifest.json');
            } else {
              var newLink = document.createElement('link');
              newLink.setAttribute('rel', 'manifest');
              newLink.setAttribute('href', '/vendor-manifest.json');
              document.head.appendChild(newLink);
            }

            // Update theme color for vendor app
            var themeColor = document.querySelector('meta[name="theme-color"]');
            if (themeColor) {
              themeColor.setAttribute('content', '#f59e0b');
            } else {
              var newThemeColor = document.createElement('meta');
              newThemeColor.setAttribute('name', 'theme-color');
              newThemeColor.setAttribute('content', '#f59e0b');
              document.head.appendChild(newThemeColor);
            }
          } catch (e) { /* noop */ }
        `}
      </Script>
      <VendorAuthRedirect>
        {isLoginPage || isAuthCheckPage ? (
          <main className="h-screen">{children}</main>
        ) : (
          <div className="flex min-h-screen flex-col">
            {/* Mobile Header with hamburger menu */}
            <header className="sticky top-0 z-40 border-b bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-md md:hidden">
              <div className="flex h-16 items-center px-4">
                <div className="flex items-center justify-between w-full">
                  <Link href="/vendor" className="font-semibold text-lg flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    <span>Buzzat Partner</span>
                  </Link>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Link href="/vendor/orders" className="relative">
                      <BellRing className="h-5 w-5 text-white hover:text-blue-200 transition-colors" />
                      {newOrdersCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                          {newOrdersCount > 9 ? '9+' : newOrdersCount}
                        </span>
                      )}
                    </Link>

                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-blue-700">
                          <Menu className="h-5 w-5" />
                          <span className="sr-only">Toggle Menu</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="pr-0 sm:max-w-xs bg-gradient-to-b from-indigo-50 to-white">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <div className="px-2">
                          <Sidebar onNavItemClick={() => setSidebarOpen(false)} />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </header>

            <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              {/* Desktop sidebar - hidden on mobile */}
              <aside className="fixed top-0 z-30 hidden h-screen w-[220px] border-r bg-gradient-to-b from-indigo-50 via-blue-50 to-white px-2 py-4 md:sticky md:block lg:w-[240px]">
                <div className="mb-6 flex items-center px-4">
                  <ShoppingBag className="h-6 w-6 text-indigo-600 mr-2" />
                  <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent">
                    Vendor Portal
                  </h2>
                </div>
                <Sidebar />
              </aside>

              <main className="relative flex-1 py-6 md:gap-10 md:py-8">
                {children}
              </main>
            </div>
          </div>
        )}
      </VendorAuthRedirect>
      <Toaster />

      {/* Enhanced notification sound preload and service initialization */}
      <Script id="notification-preload" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined') {
            // Create multiple audio instances for louder, more reliable playback
            const createLoudAudio = function() {
              const audio = new Audio('/sounds/new-order.wav');
              audio.preload = 'auto';
              audio.volume = 1.0; // Maximum volume

              // Enable audio enhancements for louder sound
              audio.mozPreservesPitch = false;
              audio.webkitPreservesPitch = false;

              return audio;
            };

            // Create primary audio and backup audio for redundancy
            window.vendorNotificationAudio = createLoudAudio();
            window.vendorNotificationAudioBackup = createLoudAudio();

            // Initialize vendor notification service
            window.vendorNotificationService = null;

            // Enhanced notification permission request with audio unlock
            const requestVendorNotificationPermission = function() {
              if ('Notification' in window && Notification.permission === 'default') {
                return Notification.requestPermission().then(function(permission) {
                  console.log('Vendor notification permission:', permission);

                  if (permission === 'granted') {
                    // Try to unlock audio context and play test sound
                    try {
                      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                      if (audioContext.state === 'suspended') {
                        audioContext.resume();
                      }

                      // Play test sound to ensure audio works
                      const testAudio = createLoudAudio();
                      testAudio.play().then(() => {
                        console.log('Vendor audio test successful');
                      }).catch(e => {
                        console.log('Vendor audio test failed, but continuing:', e);
                      });
                    } catch (e) {
                      console.log('Audio context not available');
                    }

                    window.vendorNotificationPermission = 'granted';
                    return 'granted';
                  } else {
                    window.vendorNotificationPermission = 'denied';
                    return 'denied';
                  }
                });
              } else if ('Notification' in window && Notification.permission === 'granted') {
                console.log('Vendor notification permission already granted');
                window.vendorNotificationPermission = 'granted';
                return Promise.resolve('granted');
              } else {
                window.vendorNotificationPermission = 'denied';
                return Promise.resolve('denied');
              }
            };

            // Request permission immediately
            requestVendorNotificationPermission();

            // Also try to unlock audio on user interaction
            const unlockAudio = function() {
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (audioContext.state === 'suspended') {
                  audioContext.resume();
                }

                // Play a very short silent sound to unlock audio
                const unlockAudio = createLoudAudio();
                unlockAudio.volume = 0.01; // Very quiet for unlock
                unlockAudio.play().then(() => {
                  console.log('Vendor audio unlocked successfully');
                }).catch(e => console.log('Audio unlock failed:', e));
              } catch (e) {
                console.log('Audio unlock not supported');
              }

              // Remove listeners after first use
              document.removeEventListener('click', unlockAudio);
              document.removeEventListener('touchstart', unlockAudio);
              document.removeEventListener('keydown', unlockAudio);
            };

            // Add listeners for user interaction to unlock audio
            document.addEventListener('click', unlockAudio);
            document.addEventListener('touchstart', unlockAudio);
            document.addEventListener('keydown', unlockAudio);
          }
        `}
      </Script>
    </VendorProvider>
  )
} 