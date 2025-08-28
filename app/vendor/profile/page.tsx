"use client"

import { useState, useEffect } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Loader2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VendorProfilePage() {
  const { vendor, refreshVendorData } = useVendor()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pincode: "",
    fssai: "",
    gstin: "",
    isOpen: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form data from vendor profile
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        pincode: vendor.pincode || "",
        fssai: vendor.fssai || "",
        gstin: vendor.gstin || "",
        isOpen: vendor.isOpen || false
      })
    }
  }, [vendor])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setIsSaved(false)
  }

  // Handle switch changes
  const handleSwitchChange = (value: boolean) => {
    setFormData(prev => ({ ...prev, isOpen: value }))
    setIsSaved(false)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendor) return

    setIsLoading(true)
    setError(null)
    setIsSaved(false)

    try {
      await updateDoc(doc(db, "vendors", vendor.id), {
        name: formData.name,
        address: formData.address,
        fssai: formData.fssai,
        gstin: formData.gstin,
        isOpen: formData.isOpen
      })

      // Refresh vendor data in context
      await refreshVendorData()

      setIsSaved(true)
      toast({
        title: "Profile updated",
        description: "Your store profile has been updated successfully.",
      })
    } catch (error: any) {
      setError(`Failed to update profile: ${error.message}`)
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!vendor) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSaved && (
        <Alert className="bg-green-50 mb-4">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">Profile saved successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Profile</CardTitle>
            <CardDescription>Update your store information that will be shown to customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled // Email cannot be changed
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  disabled // Phone cannot be changed
                />
                <p className="text-xs text-gray-500">Phone cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Store Pincode</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  disabled // Pincode cannot be changed
                />
                <p className="text-xs text-gray-500">Pincode cannot be changed</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Store Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>

            <Alert className="bg-blue-50 mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Delivery Areas</span>
                  <span className="text-sm">
                    {vendor.pincodes?.length ?
                      `Your store serves ${vendor.pincodes.length} delivery areas: ${vendor.pincodes.join(', ')}` :
                      "No delivery areas assigned to your store yet"}
                  </span>
                  <span className="text-xs italic mt-1">Delivery areas are managed by the administrator. Contact support to update your delivery areas.</span>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Add your FSSAI license, GSTIN, and other details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fssai">FSSAI License Number</Label>
              <Input
                id="fssai"
                name="fssai"
                value={formData.fssai}
                onChange={handleChange}
                placeholder="e.g., 12345678901234"
              />
              <p className="text-xs text-gray-500">Required for food products</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                placeholder="e.g., 22AAAAA0000A1Z5"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="isOpen">Store Status</Label>
                <Switch
                  id="isOpen"
                  checked={formData.isOpen}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
              <p className="text-xs text-gray-500">
                {formData.isOpen
                  ? "Your store is open and accepting orders"
                  : "Your store is closed and not accepting orders"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 