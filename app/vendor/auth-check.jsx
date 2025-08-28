"use client"

import { useEffect, useState } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ShieldCheck, X, Check } from "lucide-react"

export default function VendorAuthCheck() {
  const { isAuthenticated, vendor, isLoading } = useVendor()
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  // Simple timer to track how long we've been on this page
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Manual navigation function using window.location
  const goToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/vendor'
    }
  }
  
  const getStatusIcon = (status) => {
    if (!status) return <AlertCircle className="h-5 w-5 text-yellow-500" />
    
    switch(status) {
      case 'active':
        return <Check className="h-5 w-5 text-green-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'blocked':
        return <X className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }
  
  const getStatusMessage = (status) => {
    if (!status) return "Unknown status"
    
    switch(status) {
      case 'active':
        return "Your account is active and you can access the vendor dashboard."
      case 'pending':
        return "Your account is pending approval from an administrator. You cannot access the dashboard until approved."
      case 'blocked':
        return "Your account has been blocked. Please contact the administrator."
      default:
        return `Account status: ${status}. Please contact the administrator.`
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Vendor Auth Check</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-semibold">Authentication Status:</p>
            <div className="flex items-center mt-1">
              {isAuthenticated ? 
                <Check className="h-5 w-5 text-green-500 mr-2" /> : 
                <X className="h-5 w-5 text-red-500 mr-2" />
              }
              <p className={isAuthenticated ? "text-green-600" : "text-red-600"}>
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-semibold">Loading State:</p>
            <p>{isLoading ? "Loading..." : "Not Loading"}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-semibold">Vendor Data:</p>
            {vendor ? (
              <div>
                <ul className="space-y-1 mt-2">
                  <li>ID: {vendor.id}</li>
                  <li>Name: {vendor.name}</li>
                  <li>Email: {vendor.email}</li>
                  <li className="flex items-center">
                    Status: 
                    <span className="ml-2 flex items-center">
                      {getStatusIcon(vendor.status)}
                      <span className={`ml-1 ${
                        vendor.status === 'active' ? 'text-green-600' : 
                        vendor.status === 'pending' ? 'text-yellow-600' : 
                        vendor.status === 'blocked' ? 'text-red-600' : ''
                      }`}>
                        {vendor.status || "Unknown"}
                      </span>
                    </span>
                  </li>
                </ul>
                
                <Alert className={`mt-4 ${
                  vendor.status === 'active' ? 'bg-green-50' : 
                  vendor.status === 'pending' ? 'bg-yellow-50' : 
                  vendor.status === 'blocked' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    {getStatusMessage(vendor.status)}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <p className="text-gray-500">No vendor data available</p>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-semibold">Time on page:</p>
            <p>{timeElapsed} seconds</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          {isAuthenticated && vendor?.status === 'active' && (
            <>
              <button 
                onClick={goToDashboard}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Go to Dashboard (window.location)
              </button>
              
              <Link href="/vendor" className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition text-center">
                Go to Dashboard (Link)
              </Link>
            </>
          )}
          
          {!isAuthenticated && (
            <Link href="/vendor/login" className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition text-center">
              Go to Login
            </Link>
          )}
          
          {isAuthenticated && vendor?.status === 'pending' && (
            <div className="text-center p-2 bg-yellow-100 text-yellow-800 rounded">
              Your account is pending approval from an administrator.
            </div>
          )}
          
          {isAuthenticated && vendor?.status === 'blocked' && (
            <div className="text-center p-2 bg-red-100 text-red-800 rounded">
              Your account has been blocked. Please contact the administrator.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 