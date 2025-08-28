"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { uploadProductImage, uploadImageFromUrl } from "@/lib/upload"
import { resolveApiUrl } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AddCategoryDialog({ onSuccess }: { onSuccess?: () => void }) {
  // Form states
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file")
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconUrl, setIconUrl] = useState<string>("")
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Handle icon file selection
  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setUploadError(null)
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError("Please select a valid image file");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("Image size must be less than 2MB");
        return;
      }

      setIconFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle icon URL input
  const handleIconUrlChange = (url: string) => {
    setIconUrl(url)
    setUploadError(null)
    
    // If URL is valid, show preview
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      // For preview, use proxy for external URLs to avoid CORS issues
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      setIconPreview(proxyUrl)
    } else {
      setIconPreview(null)
    }
  }

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }
    
    setIsUploading(true)
    setUploadError(null)
    
    try {
      let finalIconUrl = ""
      let iconPublicId = ""
      
      // Handle icon based on upload method
      if (uploadMethod === 'file' && iconFile) {
        // Try server-side upload first
        try {
          const formData = new FormData()
          formData.append('file', iconFile)
          formData.append('vendorId', 'categories')
          
          const apiUrl = resolveApiUrl('/api/upload')
          const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
          })
          
          const result = await response.json()
          
          if (result.success) {
            console.log("Server-side category icon upload successful")
            finalIconUrl = result.url || ""
            iconPublicId = result.path || result.public_id || ""
          } else {
            throw new Error(result.error || "Server-side upload failed")
          }
        } catch (serverError) {
          console.error("Server-side upload failed, falling back to client-side:", serverError)
          
          // Fall back to client-side upload
          const uploadResult = await uploadProductImage(iconFile, 'categories')
          
          if (uploadResult.success) {
            finalIconUrl = uploadResult.url || ""
            iconPublicId = uploadResult.public_id || uploadResult.path || ""
          } else {
          throw new Error(uploadResult.errorMessage || "Failed to upload icon image")
          }
        }
      } else if (uploadMethod === 'url' && iconUrl) {
        // Try server-side URL upload first
        try {
          const apiUrl = resolveApiUrl('/api/upload')
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imageUrl: iconUrl,
              vendorId: 'categories'
            })
          })
          
          const result = await response.json()
          
          if (result.success) {
            console.log("Server-side URL upload successful")
            finalIconUrl = result.url || ""
            iconPublicId = result.path || result.public_id || ""
          } else {
            console.log("Server-side URL upload failed:", result.error)
            
            // If server-side upload fails with a 404, try using the proxy
            if (result.error?.includes('404') || result.error?.includes('not found')) {
              console.log("Attempting upload with proxy URL")
              const proxyUrl = resolveApiUrl(`/api/proxy-image?url=${encodeURIComponent(iconUrl)}`)
              
              const proxyResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  imageUrl: proxyUrl,
                  vendorId: 'categories'
                })
              })
              
              const proxyResult = await proxyResponse.json()
              
              if (proxyResult.success) {
                console.log("Proxy URL upload successful")
                finalIconUrl = proxyResult.url || ""
                iconPublicId = proxyResult.path || proxyResult.public_id || ""
              } else {
                throw new Error(proxyResult.error || "Server-side upload failed with proxy")
              }
            } else {
              throw new Error(result.error || "Server-side URL upload failed")
            }
          }
        } catch (serverError) {
          console.error("Server-side URL upload failed, falling back to client-side:", serverError)
          
          // Fall back to client-side upload
          try {
            const uploadResult = await uploadImageFromUrl(iconUrl, 'categories')
            
            if (uploadResult.success) {
              finalIconUrl = uploadResult.url || ""
              iconPublicId = uploadResult.public_id || uploadResult.path || ""
            } else {
              // Try with proxy URL as a last resort
              console.log("Client-side upload failed, trying with proxy URL")
              const proxyUrl = resolveApiUrl(`/api/proxy-image?url=${encodeURIComponent(iconUrl)}`)
              const proxyResult = await uploadImageFromUrl(proxyUrl, 'categories')
              
              if (proxyResult.success) {
                finalIconUrl = proxyResult.url || ""
                iconPublicId = proxyResult.public_id || proxyResult.path || ""
              } else {
                // If all upload methods fail, use the URL directly
                console.log("All upload methods failed, using direct URL")
                finalIconUrl = iconUrl
                toast({
                  title: "Limited Upload Mode",
                  description: "Using direct image URL. This may affect performance.",
                  variant: "destructive"
                })
              }
            }
          } catch (clientError) {
            console.error("Client-side upload failed:", clientError)
            // If all upload methods fail, use the URL directly
            finalIconUrl = iconUrl
            toast({
              title: "Limited Upload Mode",
              description: "Using direct image URL. This may affect performance.",
              variant: "destructive"
            })
          }
        }
      } else {
        // Use default icon if none provided
        finalIconUrl = "/icons/grocery.svg"
      }
      
      // Create category document
      await addDoc(collection(db, "categories"), {
        name: newCategory.name,
        icon: finalIconUrl,
        iconPublicId: iconPublicId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Reset form
      setNewCategory({ name: "", icon: "" })
      setIconFile(null)
      setIconPreview(null)
      setIconUrl("")
      setIsDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Category was added successfully"
      })
      
      // Call the success callback
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (err: any) {
      console.error("Error adding category:", err)
      setUploadError(err.message || "Failed to add category")
      toast({
        title: "Error",
        description: `Failed to add category: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new product category with name and icon.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              placeholder="e.g. Fruits & Vegetables"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
          </div>
          
          {uploadError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="file" onValueChange={(v) => setUploadMethod(v as "file" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="url">Image URL</TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="iconFile">Icon (Optional)</Label>
                <Input
                  id="iconFile"
                  type="file"
                  accept="image/*"
                  onChange={handleIconFileChange}
                />
                <p className="text-xs text-gray-500">Recommended size: 64x64px, Max: 2MB</p>
              </div>
              {iconPreview && (
                <div className="mt-2 flex justify-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded border">
                    <Image
                      src={iconPreview}
                      alt="Icon Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="iconUrl">Icon URL (Optional)</Label>
                <Input
                  id="iconUrl"
                  type="url"
                  placeholder="https://example.com/icon.png"
                  value={iconUrl}
                  onChange={(e) => handleIconUrlChange(e.target.value)}
                />
                <p className="text-xs text-gray-500">Enter a direct URL to an image</p>
              </div>
              {iconPreview && uploadMethod === 'url' && (
                <div className="mt-2 flex justify-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded border">
                    <Image
                      src={iconPreview}
                      alt="Icon Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleAddCategory} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isUploading ? "Adding..." : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 