import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import BottomNav from "@/components/bottom-nav"
import Footer from "@/components/footer"
import Script from "next/script"
import PincodeRequiredModal from "@/components/pincode-required-modal"
import "@/lib/env"
const fontClass = "font-sans"

// Generate metadata based on pathname
export function generateMetadata({ pathname }: { pathname?: string }): Metadata {
  const isVendor = pathname?.startsWith('/vendor');
  const isAdmin = pathname?.startsWith('/admin');

  if (isVendor) {
    return {
      title: "Quick Commerce Vendor",
      description: "Manage your vendor dashboard and orders",
      manifest: "/vendor-manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "QC Vendor",
      },
      generator: 'buzzat'
    };
  }

  if (isAdmin) {
    return {
      title: "Quick Commerce Admin",
      description: "Manage your Quick Commerce platform",
      manifest: "/admin-manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "QC Admin",
      },
      generator: 'buzzat'
    };
  }

  return {
    title: "Buzzat - Quick Commerce Delivery",
    description: "Get groceries and essentials delivered in minutes",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Buzzat",
    },
    generator: 'buzzat'
  };
}

// Generate viewport based on pathname
export function generateViewport({ pathname }: { pathname?: string }): Viewport {
  const isVendor = pathname?.startsWith('/vendor');
  const isAdmin = pathname?.startsWith('/admin');

  if (isVendor) {
    return {
      themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
        { media: "(prefers-color-scheme: dark)", color: "#f59e0b" }
      ],
    };
  }

  if (isAdmin) {
    return {
      themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
        { media: "(prefers-color-scheme: dark)", color: "#3b82f6" }
      ],
    };
  }

  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#ffffff" }
    ],
  };
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // We'll rely on client-side detection for header/footer visibility
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <head>
        {/* AdSense script */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8434537394521880"
          crossOrigin="anonymous"
        />
        <!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NBFTS824');</script>
<!-- End Google Tag Manager -->
      </head>
      <body className={`${fontClass} min-h-screen flex flex-col`}>
        <!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NBFTS824"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Providers>
            <div className="flex-grow">
              {children}
            </div>
            <div id="layout-footer-container">
              <Footer data-footer="true" />
              <div className="block sm:hidden">
                <BottomNav key="bottom-nav" data-bottom-nav="true" />
              </div>
              <PincodeRequiredModal data-pincode-modal="true" />
            </div>
          </Providers>
          <Toaster />
        </ThemeProvider>
        <Script src="/service-worker-register.js" strategy="lazyOnload" />

        {/* User notification initialization */}
        <Script id="user-notification-init" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              // Preload notification sound for user app
              const audio = new Audio('/sounds/new-order.wav');
              audio.preload = 'auto';
              audio.volume = 1.0;

              // Store audio globally for user notification service
              window.userNotificationAudio = audio;

              // Request notification permission for user app
              if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(function(permission) {
                  console.log('User notification permission:', permission);
                  if (permission === 'granted') {
                    // Play a test sound to ensure audio works
                    audio.play().catch(e => console.log('User audio test play failed:', e));
                  }
                });
              } else if ('Notification' in window && Notification.permission === 'granted') {
                console.log('User notification permission already granted');
              }
            }
          `}
        </Script>

        {/* Script to update header/footer visibility on client side */}
        <Script id="update-layout" strategy="afterInteractive">
          {`
            function updateLayoutVisibility() {
              const pathname = window.location.pathname;

              // Add appropriate class to body based on URL
              if (pathname.includes('/admin')) {
                document.body.classList.add('admin-page');
                document.body.classList.remove('vendor-page');
                updateManifest('/admin-manifest.json');
              } else if (pathname.includes('/vendor')) {
                document.body.classList.add('vendor-page');
                document.body.classList.remove('admin-page');
                updateManifest('/vendor-manifest.json');
              } else {
                document.body.classList.remove('admin-page');
                document.body.classList.remove('vendor-page');
                updateManifest('/manifest.json');
              }

              // Immediately hide footer container on vendor/admin pages
              const footerContainer = document.getElementById('layout-footer-container');
              if (footerContainer) {
                if (pathname.includes('/admin') || pathname.includes('/vendor')) {
                  footerContainer.style.display = 'none';
                } else {
                  // For other pages, check if we should show footer
                  const noHeaderFooterPaths = ['/checkout', '/auth', '/payment-success', '/payment-failure'];
                  const shouldShow = !noHeaderFooterPaths.some(path => pathname.startsWith(path));
                  footerContainer.style.display = shouldShow ? 'block' : 'none';
                }
              }
            }

            function updateManifest(manifestPath) {
              const manifestLink = document.querySelector('link[rel="manifest"]');
              if (manifestLink) {
                manifestLink.setAttribute('href', manifestPath);
              }
            }
            
            // Run on initial load
            updateLayoutVisibility();
            
            // Listen for URL changes
            window.addEventListener('popstate', updateLayoutVisibility);
            
            // For Next.js client-side navigation
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function() {
              originalPushState.apply(this, arguments);
              updateLayoutVisibility();
            };
            
            history.replaceState = function() {
              originalReplaceState.apply(this, arguments);
              updateLayoutVisibility();
            };
            
            // Also check periodically in case we miss any navigation events
            setInterval(updateLayoutVisibility, 1000);
          `}
        </Script>
      </body>
    </html>
  )
}
