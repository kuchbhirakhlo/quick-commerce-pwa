import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves an API URL properly, handling both client and server-side environments
 * @param path The API path (e.g., '/api/upload')
 * @param baseUrl Optional base URL to use instead of window.location.origin
 * @returns The fully resolved URL
 */
export function resolveApiUrl(path: string, baseUrl?: string): string {
  // If a base URL is provided, use it
  if (baseUrl) {
    return new URL(path, baseUrl).toString();
  }
  
  // In browser environment, use window.location.origin
  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).toString();
  }
  
  // In server environment, return the path as is (will be resolved relative to current request)
  return path;
}

/**
 * Check if the current path is an admin or vendor page
 * @param pathname The current pathname
 * @returns boolean indicating if the current page is an admin or vendor page
 */
export function isAdminOrVendorPage(pathname?: string): boolean {
  if (typeof window !== 'undefined' && !pathname) {
    pathname = window.location.pathname;
  }
  
  return !!pathname && (
    pathname.startsWith('/admin') || 
    pathname.startsWith('/vendor')
  );
}

/**
 * Check if the current page should display header and footer
 * @param pathname The current pathname
 * @returns boolean indicating if the current page should show header and footer
 */
export function shouldShowHeaderFooter(pathname?: string): boolean {
  if (typeof window !== 'undefined' && !pathname) {
    pathname = window.location.pathname;
  }
  
  // Check if the path is for admin or vendor pages
  if (pathname?.includes('/admin') || pathname?.includes('/vendor')) {
    return false;
  }
  
  // List of other paths that should NOT have header and footer
  const noHeaderFooterPaths = [
    '/checkout',
    '/auth',
    '/payment-success',
    '/payment-failure'
  ];
  
  // Check if the current path starts with any of the excluded paths
  return !noHeaderFooterPaths.some(path => pathname?.startsWith(path));
}

/**
 * Get the appropriate button class based on whether it's a customer-facing page or admin/vendor page
 * @param pathname The current pathname
 * @returns string with the appropriate button class
 */
export function getButtonClass(pathname?: string): string {
  if (isAdminOrVendorPage(pathname)) {
    return "bg-green-500 hover:bg-green-600";
  } else {
    return "customer-btn"; // This class is defined in globals.css
  }
}
