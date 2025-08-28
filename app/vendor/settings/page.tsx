"use client"

import { useState, useEffect } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import { db, storage } from "@/lib/firebase/config"
import { doc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Image as ImageIcon, XCircle, Upload } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Define vendor profile interface
interface VendorProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status?: string
  isOpen?: boolean
  description?: string
  logo?: string
  minOrderAmount?: number
  deliveryFee?: number
  freeDeliveryThreshold?: number
  estimatedDeliveryTime?: string
  deliveryRadius?: number
  offerDelivery?: boolean
}

export default function VendorSettings() {
  const router = useRouter()
  const { vendor: vendorData, refreshVendorData } = useVendor()
  const vendor = vendorData as VendorProfile
  const [activeTab, setActiveTab] = useState("store")
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Store settings
  const [storeSettings, setStoreSettings] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    logo: "",
    minOrderAmount: 0,
    isOpen: false
  })

  // Delivery settings
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryFee: 0,
    freeDeliveryThreshold: 0,
    estimatedDeliveryTime: "",
    deliveryRadius: 0,
    offerDelivery: true
  })

  // Account settings
  const [accountSettings, setAccountSettings] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Initialize form values
  useEffect(() => {
    if (vendor) {
      setStoreSettings({
        name: vendor.name || "",
        description: vendor.description || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        address: vendor.address || "",
        logo: vendor.logo || "",
        minOrderAmount: vendor.minOrderAmount || 0,
        isOpen: vendor.isOpen || false
      })

      setDeliverySettings({
        deliveryFee: vendor.deliveryFee || 0,
        freeDeliveryThreshold: vendor.freeDeliveryThreshold || 0,
        estimatedDeliveryTime: vendor.estimatedDeliveryTime || "",
        deliveryRadius: vendor.deliveryRadius || 0,
        offerDelivery: vendor.offerDelivery !== false
      })

      setAccountSettings({
        email: vendor.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      if (vendor.logo) {
        setLogoPreview(vendor.logo)
      }
    }
  }, [vendor])

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setStoreSettings(prev => ({ ...prev, logo: "" }))
  }

  // Save store settings
  const saveStoreSettings = async () => {
    if (!vendor) return

    setSaving(true)
    try {
      let logoUrl = storeSettings.logo

      // Upload new logo if selected
      if (logoFile) {
        const logoRef = ref(storage, `vendors/${vendor.id}/logo_${Date.now()}`)
        await uploadBytes(logoRef, logoFile)
        logoUrl = await getDownloadURL(logoRef)
      }

      await updateDoc(doc(db, "vendors", vendor.id), {
        name: storeSettings.name,
        description: storeSettings.description,
        phone: storeSettings.phone,
        address: storeSettings.address,
        logo: logoUrl,
        minOrderAmount: Number(storeSettings.minOrderAmount),
        isOpen: storeSettings.isOpen
      })

      await refreshVendorData()
      toast.success("Store settings saved successfully")
    } catch (error) {
      console.error("Error saving store settings:", error)
      toast.error("Failed to save store settings")
    } finally {
      setSaving(false)
    }
  }

  // Save delivery settings
  const saveDeliverySettings = async () => {
    if (!vendor) return

    setSaving(true)
    try {
      await updateDoc(doc(db, "vendors", vendor.id), {
        deliveryFee: Number(deliverySettings.deliveryFee),
        freeDeliveryThreshold: Number(deliverySettings.freeDeliveryThreshold),
        estimatedDeliveryTime: deliverySettings.estimatedDeliveryTime,
        deliveryRadius: Number(deliverySettings.deliveryRadius),
        offerDelivery: deliverySettings.offerDelivery
      })

      await refreshVendorData()
      toast.success("Delivery settings saved successfully")
    } catch (error) {
      console.error("Error saving delivery settings:", error)
      toast.error("Failed to save delivery settings")
    } finally {
      setSaving(false)
    }
  }

  // Update password
  const updatePassword = async () => {
    if (!vendor) return

    // Simple validation
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (accountSettings.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    setSaving(true)
    try {
      // In a real implementation, you would verify the current password
      // and update the password through Firebase Auth
      // For this example, we'll just show a success message
      toast.success("Password updated successfully")

      setAccountSettings(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))
    } catch (error) {
      console.error("Error updating password:", error)
      toast.error("Failed to update password")
    } finally {
      setSaving(false)
    }
  }

  if (!vendor) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your store settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="store">Store Settings</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Options</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Update your store details and how they appear to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={storeSettings.name}
                  onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })}
                  placeholder="Your store name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-description">Description</Label>
                <Textarea
                  id="store-description"
                  value={storeSettings.description}
                  onChange={(e) => setStoreSettings({ ...storeSettings, description: e.target.value })}
                  placeholder="Describe your store"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone Number</Label>
                  <Input
                    id="store-phone"
                    value={storeSettings.phone}
                    onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                    placeholder="Contact phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-email">Email</Label>
                  <Input
                    id="store-email"
                    type="email"
                    value={storeSettings.email}
                    onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                    placeholder="Contact email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-address">Address</Label>
                <Textarea
                  id="store-address"
                  value={storeSettings.address}
                  onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  placeholder="Store address"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-order">Minimum Order Amount</Label>
                <Input
                  id="min-order"
                  type="number"
                  value={storeSettings.minOrderAmount.toString()}
                  onChange={(e) => setStoreSettings({ ...storeSettings, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Store Status</Label>
                  <p className="text-sm text-gray-500">Set your store as open or closed</p>
                </div>
                <Switch
                  checked={storeSettings.isOpen}
                  onCheckedChange={(checked) => setStoreSettings({ ...storeSettings, isOpen: checked })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveStoreSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Logo</CardTitle>
              <CardDescription>
                Upload a logo for your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {logoPreview ? (
                  <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                    <img
                      src={logoPreview}
                      alt="Store logo preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                      type="button"
                    >
                      <XCircle className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div className="w-40 h-40 border rounded-md flex items-center justify-center bg-gray-50">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  </div>
                )}

                <div>
                  <Label htmlFor="logo-upload" className="block mb-2">Upload Logo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="max-w-xs"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended size: 512x512px. Max file size: 2MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Options</CardTitle>
              <CardDescription>
                Configure your delivery settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offer Delivery</Label>
                  <p className="text-sm text-gray-500">Enable delivery for your store</p>
                </div>
                <Switch
                  checked={deliverySettings.offerDelivery}
                  onCheckedChange={(checked) => setDeliverySettings({ ...deliverySettings, offerDelivery: checked })}
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="delivery-fee">Delivery Fee ($)</Label>
                <Input
                  id="delivery-fee"
                  type="number"
                  value={deliverySettings.deliveryFee.toString()}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryFee: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={!deliverySettings.offerDelivery}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="free-delivery">Free Delivery Threshold ($)</Label>
                <Input
                  id="free-delivery"
                  type="number"
                  value={deliverySettings.freeDeliveryThreshold.toString()}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={!deliverySettings.offerDelivery}
                />
                <p className="text-xs text-gray-500">Set to 0 to never offer free delivery</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery-time">Estimated Delivery Time</Label>
                <Input
                  id="delivery-time"
                  value={deliverySettings.estimatedDeliveryTime}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, estimatedDeliveryTime: e.target.value })}
                  placeholder="e.g. 30-45 mins"
                  disabled={!deliverySettings.offerDelivery}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery-radius">Delivery Radius (km)</Label>
                <Input
                  id="delivery-radius"
                  type="number"
                  value={deliverySettings.deliveryRadius.toString()}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryRadius: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  disabled={!deliverySettings.offerDelivery}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveDeliverySettings} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your account and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-email">Email Address</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={accountSettings.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Your account email address</p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-md font-medium">Change Password</h3>

                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={accountSettings.currentPassword}
                    onChange={(e) => setAccountSettings({ ...accountSettings, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={accountSettings.newPassword}
                    onChange={(e) => setAccountSettings({ ...accountSettings, newPassword: e.target.value })}
                    placeholder="Enter your new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={accountSettings.confirmPassword}
                    onChange={(e) => setAccountSettings({ ...accountSettings, confirmPassword: e.target.value })}
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                onClick={updatePassword}
                disabled={saving || !accountSettings.currentPassword || !accountSettings.newPassword || !accountSettings.confirmPassword}
              >
                {saving ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your store account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Deactivating your store will hide it from customers and prevent new orders. This can be reversed later.
              </p>
              <Button variant="destructive">Deactivate Store</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 