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
import Image from "next/image"

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
            console.log('Vendor PWA: Setting up manifest and PWA environment');

            // Force vendor manifest for PWA
            var link = document.querySelector('link[rel="manifest"]');
            if (link) {
              link.setAttribute('href', '/vendor-manifest.json');
              console.log('Vendor PWA: Updated existing manifest link');
            } else {
              var newLink = document.createElement('link');
              newLink.setAttribute('rel', 'manifest');
              newLink.setAttribute('href', '/vendor-manifest.json');
              document.head.appendChild(newLink);
              console.log('Vendor PWA: Created new manifest link');
            }

            // Ensure theme color for vendor app
            var themeColor = document.querySelector('meta[name="theme-color"]');
            if (themeColor) {
              themeColor.setAttribute('content', '#f59e0b');
            } else {
              var newThemeColor = document.createElement('meta');
              newThemeColor.setAttribute('name', 'theme-color');
              newThemeColor.setAttribute('content', '#f59e0b');
              document.head.appendChild(newThemeColor);
            }

            // Set vendor-specific meta tags for PWA
            var appleMobileWebAppCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
            if (!appleMobileWebAppCapable) {
              var newAppleMeta = document.createElement('meta');
              newAppleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
              newAppleMeta.setAttribute('content', 'yes');
              document.head.appendChild(newAppleMeta);
            }

            var appleMobileWebAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
            if (!appleMobileWebAppTitle) {
              var newAppleTitle = document.createElement('meta');
              newAppleTitle.setAttribute('name', 'apple-mobile-web-app-title');
              newAppleTitle.setAttribute('content', 'Buzzat Partner');
              document.head.appendChild(newAppleTitle);
            }

            console.log('Vendor PWA: Environment setup completed');

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

            // Set vendor-specific meta tags for PWA
            var appleMobileWebAppCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
            if (!appleMobileWebAppCapable) {
              var newAppleMeta = document.createElement('meta');
              newAppleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
              newAppleMeta.setAttribute('content', 'yes');
              document.head.appendChild(newAppleMeta);
            }

            var appleMobileWebAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
            if (!appleMobileWebAppTitle) {
              var newAppleTitle = document.createElement('meta');
              newAppleTitle.setAttribute('name', 'apple-mobile-web-app-title');
              newAppleTitle.setAttribute('content', 'Buzzat Partner');
              document.head.appendChild(newAppleTitle);
            }

            // Enhanced PWA launch detection and authentication check
            const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true ||
                         window.location.pathname === '/vendor-manifest.json' ||
                         window.location.search.includes('source=pwa') ||
                         window.location.search.includes('utm_source=homescreen') ||
                         document.referrer.includes('homescreen');

            if (isPWA) {
              console.log('Vendor PWA launch detected - mode:', {
                displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
                iosStandalone: (window.navigator as any).standalone,
                pathname: window.location.pathname,
                search: window.location.search,
                referrer: document.referrer
              });

              // Check vendor authentication status
              const checkVendorAuth = async function() {
                try {
                  // Check multiple authentication indicators
                  const hasVendorSession = document.cookie.includes('vendorSession') ||
                                         localStorage.getItem('vendorAuthenticated') === 'true' ||
                                         sessionStorage.getItem('vendorAuthenticated') === 'true';

                  const vendorId = localStorage.getItem('vendorId') ||
                                 sessionStorage.getItem('vendorId') ||
                                 getCookieValue('vendorId');

                  const currentPath = window.location.pathname;

                  console.log('PWA auth check:', {
                    hasVendorSession,
                    vendorId,
                    currentPath,
                    isVendorPage: currentPath.startsWith('/vendor/')
                  });

                  if (hasVendorSession && vendorId) {
                    // User appears to be authenticated, verify with server
                    try {
                      const response = await fetch('/api/vendor/auth/verify', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ vendorId })
                      });

                      if (response.ok) {
                        const data = await response.json();
                        if (data.authenticated && currentPath === '/vendor/login') {
                          console.log('PWA: Vendor authenticated, redirecting to dashboard');
                          window.location.href = '/vendor';
                        }
                      } else {
                        // Authentication invalid, redirect to login
                        if (currentPath !== '/vendor/login') {
                          console.log('PWA: Invalid authentication, redirecting to login');
                          window.location.href = '/vendor/login';
                        }
                      }
                    } catch (verifyError) {
                      console.error('PWA: Error verifying authentication:', verifyError);
                      // On error, redirect to login for security
                      if (currentPath !== '/vendor/login') {
                        window.location.href = '/vendor/login';
                      }
                    }
                  } else {
                    // Not authenticated, redirect to login
                    if (currentPath !== '/vendor/login') {
                      console.log('PWA: Not authenticated, redirecting to login');
                      window.location.href = '/vendor/login';
                    }
                  }
                } catch (error) {
                  console.error('PWA: Error checking authentication:', error);
                  // Default to login page for safety
                  if (window.location.pathname !== '/vendor/login') {
                    window.location.href = '/vendor/login';
                  }
                }
              };

              // Helper function to get cookie value
              function getCookieValue(name) {
                const value = '; ' + document.cookie;
                const parts = value.split('; ' + name + '=');
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
              }

              // Run authentication check
              checkVendorAuth();
            }
          } catch (e) { /* noop */}
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

                    <PWAInstallButton
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-blue-700"
                      label="Install App"
                    />

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
                  <Image
                    src="/icons/vlogo.gif"
                    alt=""
                    width={24}
                    height={24}
                    className=" rounded-full w-24 h-24"
                    unoptimized
                  />

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

            // Register background sync for checking new orders
            const registerBackgroundSync = async function() {
              try {
                if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                  const registration = await navigator.serviceWorker.ready;

                  // Register for one-time background sync
                  await registration.sync.register('vendor-order-check');
                  console.log('Vendor background sync registered successfully');

                  // Register for periodic background sync if supported
                  if ('periodicSync' in registration) {
                    try {
                      await (registration as any).periodicSync.register('vendor-order-check', {
                        minInterval: 60000 // Check every minute for demo (minimum is usually 1 hour in production)
                      });
                      console.log('Vendor periodic background sync registered successfully');
                    } catch (periodicError) {
                      console.log('Periodic sync not supported or failed:', periodicError);
                    }
                  }
                } else {
                  console.log('Background sync not supported');
                }
              } catch (error) {
                console.error('Error registering background sync:', error);
              }
            };

            // Register background sync when page loads
            registerBackgroundSync();

            // Also register on user interaction for better reliability
            const registerOnInteraction = function() {
              registerBackgroundSync();
              // Remove listeners after first registration
              document.removeEventListener('click', registerOnInteraction);
              document.removeEventListener('touchstart', registerOnInteraction);
            };

            document.addEventListener('click', registerOnInteraction);
            document.addEventListener('touchstart', registerOnInteraction);

            // Register vendor-specific service worker
            const registerVendorServiceWorker = async function() {
              try {
                if ('serviceWorker' in navigator) {
                  console.log('Registering vendor service worker...');
                  const registration = await navigator.serviceWorker.register('/vendor-sw.js', {
                    scope: '/vendor/'
                  });

                  console.log('Vendor service worker registered successfully:', registration.scope);

                  // Wait for service worker to be ready
                  await navigator.serviceWorker.ready;
                  console.log('Vendor service worker is ready');

                  return registration;
                } else {
                  console.log('Service workers not supported');
                }
              } catch (error) {
                console.error('Error registering vendor service worker:', error);
              }
            };

            // Register service worker when page loads
            registerVendorServiceWorker();

            // Initialize Firebase messaging for vendor notifications
            const initializeVendorMessaging = async function() {
              try {
                // Check if vendor is authenticated before initializing messaging
                const isAuthenticated = localStorage.getItem('vendorAuthenticated') === 'true' ||
                                      sessionStorage.getItem('vendorAuthenticated') === 'true' ||
                                      document.cookie.includes('vendorSession');

                if (!isAuthenticated) {
                  console.log('Vendor not authenticated, skipping messaging initialization');
                  return;
                }

                console.log('Initializing vendor Firebase messaging...');

                // Dynamic import of Firebase messaging
                const { initializeApp } = await import('firebase/app');
                const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

                // Firebase config (should match your project config)
                const firebaseConfig = {
                  apiKey: window.ENV?.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                  authDomain: window.ENV?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                  projectId: window.ENV?.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                  storageBucket: window.ENV?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                  messagingSenderId: window.ENV?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                  appId: window.ENV?.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                  measurementId: window.ENV?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
                };

                const app = initializeApp(firebaseConfig, 'vendor-app');
                const messaging = getMessaging(app);

                // Get FCM token
                const registration = await navigator.serviceWorker.ready;
                const token = await getToken(messaging, {
                  vapidKey: window.ENV?.NEXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                  serviceWorkerRegistration: registration
                });

                if (token) {
                  console.log('Vendor FCM token obtained:', token);

                  // Send token to server for order notifications
                  try {
                    await fetch('/api/vendor/messaging/register-token', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        token,
                        vendorId: localStorage.getItem('vendorId') || sessionStorage.getItem('vendorId'),
                        platform: 'web'
                      })
                    });
                    console.log('Vendor FCM token registered with server');
                  } catch (tokenError) {
                    console.error('Error registering vendor FCM token:', tokenError);
                  }
                } else {
                  console.log('No vendor FCM token available');
                }

                // Listen for foreground messages
                onMessage(messaging, (payload) => {
                  console.log('Vendor foreground message received:', payload);

                  // Show notification for new orders
                  if (payload.notification) {
                    const { title, body, icon } = payload.notification;

                    if ('Notification' in window && Notification.permission === 'granted') {
                      const notification = new Notification(title || 'New Order!', {
                        body: body || 'You have a new order',
                        icon: icon || '/icons/vendor-icon-192x192.gif',
                        badge: '/icons/vendor-icon-192x192.gif',
                        tag: 'vendor-order',
                        requireInteraction: true,
                        data: payload.data
                      });

                      // Play notification sound
                      if (window.vendorNotificationAudio) {
                        window.vendorNotificationAudio.play().catch(e => console.log('Audio play failed:', e));
                      }

                      // Handle notification click
                      notification.onclick = function() {
                        window.focus();
                        window.location.href = payload.data?.url || '/vendor/orders';
                        notification.close();
                      };
                    }
                  }
                });

                console.log('Vendor Firebase messaging initialized successfully');
              } catch (error) {
                console.error('Error initializing vendor messaging:', error);
              }
            };

            // Initialize messaging after a short delay to ensure authentication is ready
            setTimeout(initializeVendorMessaging, 2000);
          }
        `}
      </Script>
    </VendorProvider>
  )
} 