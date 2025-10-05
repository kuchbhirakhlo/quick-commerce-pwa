"use client"

import { useState, useRef, useEffect, ChangeEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore"
import { updateProduct } from "@/lib/firebase/firestore"
import { uploadProductImage, deleteProductImage } from "@/lib/cloudinary/upload"
import { isCloudinaryConfigured } from "@/lib/cloudinary/config"
import { AlertCircle, Loader2, Upload, Info, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

interface Category {
  id: string
  name: string
  icon: string
}

interface ProductData {
  id: string
  name: string
  description: string
  category: string
  price: number
  mrp: number
  image: string
  imagePublicId?: string
  additionalImages?: Array<{
    url: string;
    path?: string;
    public_id?: string;
  }>
  unit: string
  stock: number
  vendorId: string
  pincodes: string[]
  status: "active" | "out_of_stock" | "deleted"
}

export default function EditProductPage() {
  const router = useRouter()
  const { vendor } = useVendor()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [originalProduct, setOriginalProduct] = useState<ProductData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file')
  const [imageUrl, setImageUrl] = useState<string>('')

  // Read route param id
  const params = useParams<{ id: string }>()
  const productId = (params?.id as string) || ""

  // Prevent clipboard errors in some browsers
  useEffect(() => {
    // Suppress clipboard-related errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('clipboard') || args[0].includes('Clipboard'))
      ) {
        // Ignore clipboard-related errors
        return;
      }
      originalConsoleError(...args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    mrp: "",
    stock: "",
    unit: "pcs",
  })

  // Fetch product data and categories on mount
  useEffect(() => {
    if (!vendor) return

    const fetchProductAndCategories = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // For test vendor in development
        if (process.env.NODE_ENV === 'development' && vendor.id === 'test-vendor-id') {
          // Return mock data after a short delay to simulate API call
          setTimeout(() => {
            const mockProduct: ProductData = {
              id: productId,
              name: 'Test Product',
              description: 'This is a test product description.',
              category: 'grocery',
              price: 99,
              mrp: 120,
              image: '/placeholder.svg',
              unit: 'pcs',
              stock: 100,
              vendorId: 'test-vendor-id',
              pincodes: ['123456'],
              status: 'active'
            };

            setFormData({
              name: mockProduct.name,
              description: mockProduct.description,
              category: mockProduct.category,
              price: mockProduct.price.toString(),
              mrp: mockProduct.mrp.toString(),
              stock: mockProduct.stock.toString(),
              unit: mockProduct.unit
            });

            setSelectedPincodes(mockProduct.pincodes);
            setImagePreview(mockProduct.image);
            setOriginalProduct(mockProduct);
            setIsLoading(false);
          }, 500);

          // Mock categories
          setCategories([
            { id: "fruits-vegetables", name: "Fruits & Vegetables", icon: "" },
            { id: "dairy", name: "Dairy", icon: "" },
            { id: "bakery", name: "Bakery", icon: "" },
            { id: "meat", name: "Meat & Poultry", icon: "" },
            { id: "grocery", name: "Grocery & Staples", icon: "" },
          ]);

          setLoadingCategories(false);
          return;
        }

        // Fetch the real product from Firestore
        const productDoc = await getDoc(doc(db, "products", productId));

        if (!productDoc.exists()) {
          throw new Error("Product not found");
        }

        const productData = { id: productDoc.id, ...productDoc.data() } as ProductData;

        // Verify that this product belongs to this vendor
        if (productData.vendorId !== vendor.id) {
          throw new Error("You don't have permission to edit this product");
        }

        // Set form data
        setFormData({
          name: productData.name,
          description: productData.description,
          category: productData.category || "",
          price: productData.price.toString(),
          mrp: productData.mrp.toString(),
          stock: productData.stock.toString(),
          unit: productData.unit
        });

        setSelectedPincodes(productData.pincodes || []);
        setImagePreview(productData.image || null);
        setOriginalProduct(productData);

        // Fetch categories
        const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
        const categoriesSnapshot = await getDocs(categoriesQuery)

        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[]

        setCategories(categoriesData)
        setLoadingCategories(false)

      } catch (error: any) {
        console.error("Error loading product:", error);
        setError(error.message || "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductAndCategories();
  }, [vendor, productId]);

  // Handle pincode selection
  const handlePincodeChange = (pincodeId: string) => {
    setSelectedPincodes((prev) =>
      prev.includes(pincodeId) ? prev.filter((id) => id !== pincodeId) : [...prev, pincodeId],
    )
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Handle select changes
  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Handle image upload
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }

      setImageFile(file)

      // Create a preview
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      setError(null)
    }
  }

  // Handle image URL input
  const handleImageUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)

    // If the URL is valid, update the preview
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setImagePreview(url)
      // Reset file input
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      // Clear preview if URL is invalid and it's the current preview
      if (imagePreview === url) {
        setImagePreview(null)
      }
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Validation
    if (!vendor || !vendor.id) {
      setError("Vendor information is missing. Please log in again.")
      setIsSubmitting(false)
      return
    }

    if (!originalProduct) {
      setError("Product data not found")
      setIsSubmitting(false)
      return
    }

    if (selectedPincodes.length === 0) {
      setError("Please select at least one delivery area (pincode)")
      setIsSubmitting(false)
      return
    }

    // Only check Cloudinary configuration if we're uploading a new image
    if ((imageUploadMode === 'file' && imageFile || imageUploadMode === 'url' && imageUrl) &&
      !isCloudinaryConfigured()) {
      setError("Cloudinary is not properly configured. Please contact the administrator.")
      setIsSubmitting(false)
      return
    }

    try {
      let imageUrl = originalProduct.image
      let imagePublicId = originalProduct.imagePublicId

      // If new image is uploaded or a URL is provided
      if (imageUploadMode === 'file' && imageFile) {
        setUploadProgress(10)

        // Delete old image if public_id exists
        if (originalProduct.imagePublicId) {
          try {
            await deleteProductImage(originalProduct.imagePublicId)
          } catch (error) {
            console.error("Failed to delete old image:", error)
            // Continue anyway
          }
        }

        // Upload new image file
        const uploadResult = await uploadProductImage(imageFile, vendor.id)

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error("Failed to upload product image")
        }

        imageUrl = uploadResult.url
        imagePublicId = uploadResult.public_id
        setUploadProgress(50)
      } else if (imageUploadMode === 'url' && imageUrl && imageUrl.trim()) {
        setUploadProgress(10)

        // Delete old image if public_id exists
        if (originalProduct.imagePublicId) {
          try {
            await deleteProductImage(originalProduct.imagePublicId)
          } catch (error) {
            console.error("Failed to delete old image:", error)
            // Continue anyway
          }
        }

        // Upload from URL
        try {
          const uploadResult = await fetch('/api/upload-from-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: imageUrl.trim(),
              vendorId: vendor.id
            }),
          });

          if (!uploadResult.ok) {
            const errorData = await uploadResult.json();
            throw new Error(errorData.message || 'Failed to upload from URL');
          }

          const data = await uploadResult.json();
          imageUrl = data.url;
          imagePublicId = data.public_id;
          setUploadProgress(50);
        } catch (error: any) {
          throw new Error(`Failed to upload from URL: ${error.message}`);
        }
      } else {
        setUploadProgress(50) // Skip image upload steps
      }

      // Update product in Firestore
      const updatedProduct = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        mrp: parseFloat(formData.mrp),
        stock: parseInt(formData.stock),
        unit: formData.unit,
        image: imageUrl,
        imagePublicId: imagePublicId,
        pincodes: selectedPincodes,
      }

      // For test vendor in development
      if (process.env.NODE_ENV === 'development' && vendor.id === 'test-vendor-id') {
        // Just simulate success after a short delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setUploadProgress(100)

        toast({
          title: "Product Updated",
          description: "Your product has been updated successfully",
        })

        // Redirect to products page
        router.push("/vendor/products")
        return
      }

      // Update the real product
      setUploadProgress(75)
      await updateProduct(productId, updatedProduct)
      setUploadProgress(100)

      // Show success message and redirect
      toast({
        title: "Product Updated",
        description: "Your product has been updated successfully",
      })

      // Redirect to products page
      router.push("/vendor/products")
    } catch (error: any) {
      console.error("Error updating product:", error)
      setError(error.message || "Failed to update product. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Get vendor pincodes from profile
  const vendorPincodes = vendor?.pincodes || []

  // If no vendor data, show loading
  if (!vendor) {
    return <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  }

  // If vendor has no delivery areas selected, show a message
  if (vendorPincodes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Edit Product</h1>
        </div>

        <Card className="md:max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Delivery Areas Required</CardTitle>
            <CardDescription>
              You need to set up your delivery areas before editing products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No delivery areas configured</AlertTitle>
              <AlertDescription>
                Before managing products, you need to configure which pincodes you can deliver to. This is required so customers know where your products are available.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button asChild>
                <a href="/vendor/profile/pincodes">Configure Delivery Areas</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <span className="ml-2">Loading product...</span>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Update the details of your product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCategories ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
              <CardDescription>Update the price and inventory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="mrp">MRP (₹)</Label>
                <Input
                  id="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.mrp}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit (e.g., kg, pcs, dozen)</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
              <CardDescription>Update the product image or keep the existing one.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Upload mode selector */}
              <div className="flex space-x-4 mb-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="upload-file"
                    name="upload-mode"
                    value="file"
                    className="mr-2"
                    checked={imageUploadMode === 'file'}
                    onChange={() => setImageUploadMode('file')}
                  />
                  <label htmlFor="upload-file">Upload from device</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="upload-url"
                    name="upload-mode"
                    value="url"
                    className="mr-2"
                    checked={imageUploadMode === 'url'}
                    onChange={() => setImageUploadMode('url')}
                  />
                  <label htmlFor="upload-url">Image URL</label>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                {imagePreview ? (
                  <div className="relative h-48 w-48 mb-4">
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full flex flex-col items-center justify-center bg-gray-50 rounded-md">
                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}

                {imageUploadMode === 'file' ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerFileInput}
                      className="mt-2"
                    >
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </Button>
                  </>
                ) : (
                  <div className="w-full mt-4">
                    <Label htmlFor="image-url">Image URL</Label>
                    <Input
                      id="image-url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={handleImageUrl}
                      className="w-full mt-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>Update the pincodes where this product will be available.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {vendorPincodes.map((pincode) => (
                  <div key={pincode} className="flex items-center space-x-2 p-2 border rounded-md">
                    <Checkbox
                      id={`pincode-${pincode}`}
                      checked={selectedPincodes.includes(pincode)}
                      onCheckedChange={() => handlePincodeChange(pincode)}
                    />
                    <Label
                      htmlFor={`pincode-${pincode}`}
                      className="cursor-pointer text-sm"
                    >
                      {pincode}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedPincodes.length === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  * You must select at least one delivery area
                </p>
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-2 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/vendor/products")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600"
              disabled={isSubmitting || selectedPincodes.length === 0}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadProgress < 100 ? `Updating... ${uploadProgress}%` : "Saving..."}
                </div>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
} 