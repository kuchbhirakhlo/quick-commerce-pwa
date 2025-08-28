"use client"

import { useVendor } from "@/lib/context/vendor-provider"
import { useEffect, useState } from "react"

export default function LoginDebug() {
  const { vendor, isAuthenticated, isLoading } = useVendor()
  const [isVisible, setIsVisible] = useState(false)

  // Update the debug info every 500ms to catch state changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Force a re-render to reflect latest state
      setIsVisible(prev => !prev)
      setIsVisible(prev => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
      <div className="mb-1 font-bold">Debug Info:</div>
      <div>isAuthenticated: {String(isAuthenticated)}</div>
      <div>isLoading: {String(isLoading)}</div>
      <div>Vendor ID: {vendor ? (vendor.id || 'null') : 'null'}</div>
      <div>Vendor UID: {vendor ? (vendor.uid || 'null') : 'null'}</div>
      <div>Vendor Email: {vendor ? (vendor.email || 'null') : 'null'}</div>
      <div>Vendor Status: {vendor ? (vendor.status || 'null') : 'null'}</div>
      {vendor && (
        <div className="mt-1">
          <details>
            <summary>Full vendor data</summary>
            <pre className="text-[10px] mt-1 whitespace-pre-wrap">
              {JSON.stringify(vendor, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
} 