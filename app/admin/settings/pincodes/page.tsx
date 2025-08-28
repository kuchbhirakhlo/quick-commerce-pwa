"use client"

import { useState, useEffect } from "react"
import { getGlobalPincodes, addGlobalPincode, removeGlobalPincode } from "@/lib/firebase/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Loader2, Plus, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminPincodesPage() {
  const [pincodes, setPincodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPincode, setNewPincode] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch pincodes on load
  useEffect(() => {
    const fetchPincodes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const globalPincodes = await getGlobalPincodes()
        setPincodes(globalPincodes)
      } catch (err: any) {
        setError(err.message || "Failed to load pincodes")
        console.error("Error loading pincodes:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPincodes()
  }, [])

  // Handle adding a new pincode
  const handleAddPincode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPincode || newPincode.length !== 6 || !/^\d+$/.test(newPincode)) {
      toast({
        variant: "destructive",
        title: "Invalid pincode",
        description: "Pincode must be a 6-digit number",
      })
      return
    }

    if (pincodes.includes(newPincode)) {
      toast({
        variant: "destructive",
        title: "Pincode already exists",
        description: "This pincode is already in the list",
      })
      return
    }

    try {
      setIsAdding(true)
      const success = await addGlobalPincode(newPincode)
      if (success) {
        setPincodes([...pincodes, newPincode])
        setNewPincode("")
        toast({
          title: "Pincode added",
          description: `Pincode ${newPincode} has been added successfully`,
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to add pincode",
        description: err.message,
      })
    } finally {
      setIsAdding(false)
    }
  }

  // Handle removing a pincode
  const handleRemovePincode = async (pincodeToRemove: string) => {
    try {
      const success = await removeGlobalPincode(pincodeToRemove)
      if (success) {
        setPincodes(pincodes.filter(p => p !== pincodeToRemove))
        toast({
          title: "Pincode removed",
          description: `Pincode ${pincodeToRemove} has been removed`,
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove pincode",
        description: err.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Delivery Pincodes</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manage Pincodes</CardTitle>
          <CardDescription>
            Add or remove pincodes that vendors will be able to select for their delivery areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPincode} className="flex space-x-2 mb-6">
            <Input
              type="text"
              placeholder="Enter 6-digit pincode"
              value={newPincode}
              onChange={(e) => setNewPincode(e.target.value)}
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              className="max-w-xs"
            />
            <Button type="submit" disabled={isAdding || !newPincode || newPincode.length !== 6}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add
            </Button>
          </form>

          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">Available Pincodes</h3>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : pincodes.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No pincodes available. Add some using the form above.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pincodes.map((pincode) => (
                  <Badge key={pincode} variant="secondary" className="flex items-center gap-1 py-1.5">
                    {pincode}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => handleRemovePincode(pincode)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 