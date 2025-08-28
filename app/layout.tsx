import type React from "react"
import type { Metadata } from "next"
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

export const metadata: Metadata = {
  title: "Buzzat - Quick Commerce Delivery",
  description: "Get groceries and essentials delivered in minutes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Buzzat",
  },
  generator: 'buzzat'
}

export const viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // We'll rely on client-side detection for header/footer visibility
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <body className={`${fontClass} min-h-screen flex flex-col`}>
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
        {/* Script to update header/footer visibility on client side */}
        <Script id="update-layout" strategy="afterInteractive">
          {`
            function updateLayoutVisibility() {
              const pathname = window.location.pathname;
              
              // Add appropriate class to body based on URL
              if (pathname.includes('/admin')) {
                document.body.classList.add('admin-page');
                document.body.classList.remove('vendor-page');
              } else if (pathname.includes('/vendor')) {
                document.body.classList.add('vendor-page');
                document.body.classList.remove('admin-page');
              } else {
                document.body.classList.remove('admin-page');
                document.body.classList.remove('vendor-page');
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
