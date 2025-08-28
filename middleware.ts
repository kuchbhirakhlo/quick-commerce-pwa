import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Only apply this middleware to admin routes except admin login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    // Check for session cookie
    const session = request.cookies.get("admin_session")
    
    // If no session, redirect to admin login
    if (!session) {
      const url = new URL("/admin/login", request.url)
      // Add the original URL as a query parameter for redirection after login
      url.searchParams.set('redirect', encodeURIComponent(pathname))
      return NextResponse.redirect(url)
    }
  }
  
  // Check for pincode cookie on main app routes
  if (!pathname.startsWith("/admin") && 
      !pathname.startsWith("/api") && 
      !pathname.startsWith("/_next") && 
      !pathname.startsWith("/favicon") &&
      !pathname.includes(".") && // Skip static files
      pathname !== "/coming-soon") {
    
    // Paths that don't need pincode verification
    const exemptPaths = [
      "/auth-debug",
      "/terms",
      "/privacy",
      "/about"
    ]
    
    if (!exemptPaths.includes(pathname)) {
      // Check for pincode cookie
      const pincode = request.cookies.get("user_pincode")
      
      // If no pincode, allow the page to load but the pincode selector will show
      // The component will handle forcing the user to select a pincode
      // We don't redirect here to avoid redirect loops
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
} 