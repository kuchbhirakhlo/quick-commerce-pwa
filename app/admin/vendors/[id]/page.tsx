"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  pincodes: string[]
  status: string
  productsCount: number
  joinedDate: string
}

export default function VendorDetailsPage() {
  const params = useParams()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendorDetails()
  }, [params.id])

  const fetchVendorDetails = async () => {
    try {
      const vendorDoc = await getDoc(doc(db, "vendors", params.id as string))
      if (vendorDoc.exists()) {
        setVendor({ id: vendorDoc.id, ...vendorDoc.data() } as Vendor)
      }
    } catch (error) {
      console.error("Error fetching vendor details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!vendor) {
    return <div>Vendor not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Details</h1>
        <div className="space-x-2">
          <Link href="/admin/vendors">
            <Button variant="outline">Back to Vendors</Button>
          </Link>
          <Button>Edit Vendor</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="mt-1">{vendor.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1">{vendor.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1">{vendor.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <Badge
                className={
                  vendor.status === "active"
                    ? "bg-green-100 text-green-800"
                    : vendor.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {vendor.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Service Areas</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {vendor.pincodes.map((pincode) => (
                  <Badge key={pincode} variant="outline">
                    {pincode}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Products</h3>
              <p className="mt-1">{vendor.productsCount} products listed</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Joined Date</h3>
              <p className="mt-1">{new Date(vendor.joinedDate).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No recent activity to show</p>
        </CardContent>
      </Card>
    </div>
  )
} 