"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function VendorPincodePage() {
  const router = useRouter()

  // Automatically redirect after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/vendor/profile')
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Delivery Areas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Areas Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              Delivery areas (pincodes) are now managed exclusively by the administrator. 
              This change ensures better service coverage and coordination across all vendors.
            </AlertDescription>
          </Alert>
          
          <div className="text-gray-700">
            <p>If you need to update your delivery areas, please contact the administrator with your request.</p>
            <p className="mt-2">You will be automatically redirected to your profile page in a few seconds.</p>
          </div>
          
          <div className="flex justify-start">
            <Button 
              variant="outline" 
              onClick={() => router.push('/vendor/profile')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Return to Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 