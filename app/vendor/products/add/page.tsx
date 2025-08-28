"use client"

import { useState, useRef, useEffect, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useVendor } from "@/lib/context/vendor-provider"
import { addProduct } from "@/lib/firebase/firestore"
import { uploadProductImage, uploadMultipleProductImages, uploadImageFromUrl, checkUploadConfig } from "@/lib/upload"
import { isCloudinaryConfigured } from "@/lib/cloudinary/config"
import { AlertCircle, Loader2, Upload, Info, X, Image as ImageIcon, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { resolveApiUrl } from "@/lib/utils"

interface Category {
  id: string
  name: string
  icon: string
}

export default function AddProductPage() {
  const router = useRouter()
  const { vendor } = useVendor()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfigChecking, setIsConfigChecking] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([])
  // Images
  const [primaryImage, setPrimaryImage] = useState<File | null>(null)
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalFileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file')
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string>('')
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    mrp: "",
    stock: "",
    unit: "pcs", // Default unit
  })

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
        const categoriesSnapshot = await getDocs(categoriesQuery)
        
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[]
        
        setCategories(categoriesData)
      } catch (err) {
        console.error("Error loading categories:", err)
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive"
        })
      } finally {
        setLoadingCategories(false)
      }
    }
    
    fetchCategories()
  }, [])

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

  // Handle primary image upload
  const handlePrimaryImageChange = (e: ChangeEvent<HTMLInputElement>) => {
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

      setPrimaryImage(file)

      // Create a preview
      const reader = new FileReader()
      reader.onload = () => {
        setPrimaryImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      setError(null)
    }
  }

  // Handle additional images upload
  const handleAdditionalImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files)

      // Check if we're exceeding the limit of 2 additional images
      if (additionalImages.length + newFiles.length > 2) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: "You can upload a maximum of 2 additional images"
        })
        return
      }

      // Validate all files
      const invalidFiles = newFiles.filter(file => !file.type.startsWith('image/'))
      if (invalidFiles.length > 0) {
        setError("Please select valid image files only")
        return
      }

      const largeFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024)
      if (largeFiles.length > 0) {
        setError("All images must be less than 5MB")
        return
      }

      // Add to existing images
      setAdditionalImages(prev => [...prev, ...newFiles])

      // Generate previews
      const newPreviews: string[] = []
      newFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          newPreviews.push(reader.result as string)
          if (newPreviews.length === newFiles.length) {
            setAdditionalImagePreviews(prev => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      })

      setError(null)
    }
  }

  // Remove an additional image
  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index))
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Trigger primary file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Trigger additional file input click
  const triggerAdditionalFileInput = () => {
    if (additionalFileInputRef.current) {
      additionalFileInputRef.current.click()
    }
  }

  // Check upload configuration on component mount
  useEffect(() => {
    const checkUploadServices = async () => {
      setIsConfigChecking(true);
      try {
        const uploadConfig = await checkUploadConfig();
        
        // Check specifically for Firebase Storage bucket configuration
        if (uploadConfig.firebase && !uploadConfig.firebase.bucketConfigured) {
          setConfigError("Firebase Storage bucket is not configured. Please use the URL option to add product images.");
          // Automatically switch to URL mode if file uploads won't work
          setImageUploadMode('url');
        } else if (!uploadConfig.firebase.configured && !uploadConfig.cloudinary.configured) {
          setConfigError("Warning: Image upload services are not properly configured. Please use the URL option to add product images.");
          // Automatically switch to URL mode if file uploads won't work
          setImageUploadMode('url');
      } else {
          // Clear any previous error
          setConfigError(null);
        // Show which service is being used
          console.log(`Using ${uploadConfig.primaryService} as primary upload service`);
      }
    } catch (err) {
        console.error("Error checking upload configuration:", err);
        setConfigError("Could not verify upload service configuration. You may have better results using the URL option for images.");
        // Automatically switch to URL mode if there's an error checking config
        setImageUploadMode('url');
      } finally {
        setIsConfigChecking(false);
      }
    };
    
    checkUploadServices();
  }, []);

  // Add a function to handle primary image URL input
  const handlePrimaryImageUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setPrimaryImageUrl(url)
    
    // If the URL is valid, update the preview
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setPrimaryImagePreview(url)
      // Reset file input
      setPrimaryImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      // Clear preview if URL is not valid
      if (primaryImagePreview === url) {
        setPrimaryImagePreview(null)
      }
    }
  }

  // Add a function to add additional image URL
  const handleAddAdditionalImageUrl = () => {
    if (!additionalImageUrls.length) {
      setAdditionalImageUrls([''])
    } else if (additionalImageUrls.length < 2) {
      setAdditionalImageUrls([...additionalImageUrls, ''])
    } else {
      toast({
        variant: "destructive",
        title: "Too many images",
        description: "You can add a maximum of 2 additional images"
      })
    }
  }

  // Add a function to update additional image URL
  const handleAdditionalImageUrl = (index: number, url: string) => {
    const newUrls = [...additionalImageUrls]
    newUrls[index] = url
    setAdditionalImageUrls(newUrls)
    
    // Update preview if URL is valid
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      const newPreviews = [...additionalImagePreviews]
      if (index >= newPreviews.length) {
        newPreviews.push(url)
      } else {
        newPreviews[index] = url
      }
      setAdditionalImagePreviews(newPreviews)
    } else {
      // Remove preview if URL is not valid
      const newPreviews = additionalImagePreviews.filter((_, i) => i !== index)
      setAdditionalImagePreviews(newPreviews)
    }
  }

  // Add a function to remove additional image URL
  const removeAdditionalImageUrl = (index: number) => {
    setAdditionalImageUrls(prev => prev.filter((_, i) => i !== index))
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    setUploadProgress(0)
    
    try {
      // Validate form
      if (!formData.name || !formData.category || !formData.price || !formData.stock) {
        setError("Please fill in all required fields")
        setIsSubmitting(false)
        return
      }
      
      // Validate image - either file or URL must be provided
      if (imageUploadMode === 'file' && !primaryImage) {
        setError("Please upload a primary product image")
        setIsSubmitting(false)
        return
      }
      
      if (imageUploadMode === 'url' && (!primaryImageUrl || !primaryImageUrl.trim())) {
        setError("Please provide a valid image URL")
        setIsSubmitting(false)
        return
      }
      
      if (selectedPincodes.length === 0) {
        setError("Please select at least one pincode for delivery")
        setIsSubmitting(false)
        return
      }
      
      let productImageUrl = ""
      let productImageId = ""
      let additionalImageResults: Array<{
        url: string;
        path?: string;
        public_id?: string;
      }> = [];
      
      // Check upload configuration - but don't block submission if it fails
      const uploadConfig = await checkUploadConfig().catch(() => ({
        cloudinary: { configured: false },
        firebase: { configured: false },
        primaryService: 'firebase'
      }));
      
      setUploadProgress(10)
      
      // Handle image uploads based on configuration status
      if (uploadConfig.firebase.configured || uploadConfig.cloudinary.configured) {
        // At least one service is configured, try to use it
      if (imageUploadMode === 'file' && primaryImage) {
          // Try server-side upload first to avoid CORS issues
          try {
            const formData = new FormData();
            formData.append('file', primaryImage);
            formData.append('vendorId', vendor?.id || 'unknown');
            
            console.log("Attempting server-side upload...");
            const apiUrl = resolveApiUrl('/api/firebase/upload');
            const response = await fetch(apiUrl, {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
              console.log("Server-side upload successful");
              productImageUrl = result.url || "";
              productImageId = result.path || "";
            } else {
              console.error("Server-side upload failed with error:", result.error);
              
              // Check for specific bucket configuration issues
              if (result.errorCode === 'storage/bucket-not-found' || 
                  (result.errorCode === 'storage/unknown' && result.error?.includes('bucket'))) {
                console.log("Firebase bucket configuration issue detected, using data URL directly");
                const reader = new FileReader();
                productImageUrl = await new Promise<string>((resolve) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(primaryImage);
                });
                
                toast({
                  title: "Storage Configuration Issue",
                  description: "Using embedded image data due to storage configuration issues.",
                  variant: "destructive"
                });
                
                // Skip further upload attempts
                throw new Error("Firebase bucket not configured properly");
              } else {
                // For other errors, try client-side upload
                throw new Error(result.error || "Server-side upload failed");
              }
            }
          } catch (serverError) {
            console.error("Server-side upload failed, falling back to client-side:", serverError);
            
            // Skip client-side upload if we already used data URL due to bucket issues
            if (productImageUrl && productImageUrl.startsWith('data:')) {
              console.log("Already using data URL, skipping client-side upload");
            } else {
              // Fall back to client-side upload
              try {
                const imageUploadResult = await uploadProductImage(primaryImage, vendor?.id || 'unknown');
                
                if (imageUploadResult.success) {
                  console.log("Client-side upload successful");
                  productImageUrl = imageUploadResult.url || "";
                  productImageId = imageUploadResult.public_id || imageUploadResult.path || "";
                } else {
                  console.error("Client-side upload failed, falling back to data URL");
                  throw new Error(`Client-side upload failed: ${imageUploadResult.errorMessage}`);
                }
              } catch (clientError) {
                // Last resort: Use data URL
                console.log("All upload methods failed, using data URL as fallback");
                const reader = new FileReader();
                productImageUrl = await new Promise<string>((resolve) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(primaryImage);
                });
                toast({
                  title: "Limited Upload Mode",
                  description: "Using embedded image data. This may affect performance.",
                  variant: "destructive"
                });
              }
            }
          }
      } else if (imageUploadMode === 'url' && primaryImageUrl) {
        // Upload from URL using unified service
        try {
            console.log("Attempting to upload from URL:", primaryImageUrl);
            
            // First try server-side upload
            try {
              const apiUrl = resolveApiUrl('/api/upload');
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  imageUrl: primaryImageUrl,
                  vendorId: vendor?.id || 'unknown'
                })
              });
              
              const result = await response.json();
              
              if (result.success) {
                console.log("Server-side URL upload successful");
                productImageUrl = result.url || "";
                productImageId = result.path || result.public_id || "";
              } else {
                console.error("Server-side URL upload failed:", result.error);
                throw new Error(result.error || "Server-side URL upload failed");
              }
            } catch (serverError) {
              console.error("Server-side URL upload failed, trying client-side:", serverError);
              
              // Fall back to client-side upload
              const imageUploadResult = await uploadImageFromUrl(primaryImageUrl, vendor?.id || 'unknown');
              
              if (imageUploadResult.success) {
                console.log("Client-side URL upload successful");
          productImageUrl = imageUploadResult.url || "";
          productImageId = imageUploadResult.public_id || imageUploadResult.path || "";
              } else {
                // If both server and client-side uploads fail, use the URL directly
                console.log("All upload methods failed, using URL directly");
                productImageUrl = primaryImageUrl;
                toast({
                  title: "Limited Upload Mode",
                  description: "Using direct image URL. This may affect performance if the source becomes unavailable.",
                  variant: "destructive"
                });
              }
            }
        } catch (error: any) {
            console.error("Error uploading from URL:", error);
            // Use the URL directly as a fallback
            productImageUrl = primaryImageUrl;
            toast({
              title: "Upload Error",
              description: "Using direct image URL due to upload error.",
              variant: "destructive"
            });
        }
      }
      
      // 2. Upload additional images if any
      setUploadProgress(50)
      
      if (imageUploadMode === 'file' && additionalImages.length > 0) {
          // Upload additional files using server-side API
          const additionalImagePromises = additionalImages.map(async (file) => {
            try {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('vendorId', vendor?.id || 'unknown');
              
              const apiUrl = resolveApiUrl('/api/firebase/upload');
              const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
              });
              
              const result = await response.json();
              
              if (result.success) {
                console.log(`Additional image ${file.name} uploaded successfully via server API`);
                return {
                  success: true,
                  url: result.url,
                  path: result.path
                };
              } else {
                console.error(`Failed to upload additional image ${file.name} via server API:`, result.error);
                
                // Check for bucket configuration issues
                if (result.errorCode === 'storage/bucket-not-found' || 
                    (result.errorCode === 'storage/unknown' && result.error?.includes('bucket'))) {
                  console.log(`Firebase bucket issue detected for ${file.name}, using data URL directly`);
                  const reader = new FileReader();
                  const dataUrl = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                  });
                  
                  return {
                    success: true,
                    url: dataUrl
                  };
                }
                
                // Try client-side upload for other errors
                const clientResult = await uploadProductImage(file, vendor?.id || 'unknown');
                
                if (clientResult.success) {
                  console.log(`Additional image ${file.name} uploaded successfully via client-side API`);
                  return {
                    success: true,
                    url: clientResult.url || "",
                    path: clientResult.path,
                    public_id: clientResult.public_id
                  };
                }
                
                // If client-side also fails, use data URL
                console.log(`Using data URL for additional image ${file.name}`);
                const reader = new FileReader();
                const dataUrl = await new Promise<string>((resolve) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                });
                
                return {
                  success: true,
                  url: dataUrl
                };
              }
            } catch (error) {
              console.error('Error uploading additional image:', error);
              
              // Use data URL as last resort
              try {
                console.log(`Using data URL as fallback for additional image ${file.name}`);
                const reader = new FileReader();
                const dataUrl = await new Promise<string>((resolve) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                });
                
                return {
                  success: true,
                  url: dataUrl
                };
              } catch (dataUrlError) {
                console.error('Failed to create data URL:', dataUrlError);
                return { success: false };
              }
            }
          });
          
          // Wait for all uploads to complete
          const results = await Promise.all(additionalImagePromises);
          
          // Filter successful uploads and map to the expected format
          additionalImageResults = results
            .filter(r => r.success)
            .map(r => ({
              url: r.url || "",
              path: r.path
            }));
            
          // Update progress
          setUploadProgress(80);
      } else if (imageUploadMode === 'url' && additionalImageUrls.length > 0) {
        // Upload additional URLs using unified service
        for (const url of additionalImageUrls.filter(url => url.trim())) {
          try {
              console.log(`Attempting to upload additional image from URL: ${url}`);
              
              // Try server-side upload first
              try {
                const apiUrl = resolveApiUrl('/api/upload');
                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    imageUrl: url,
                    vendorId: vendor?.id || 'unknown'
                  })
                });
                
                const result = await response.json();
                
                if (result.success) {
                  console.log("Server-side additional URL upload successful");
                  additionalImageResults.push({
                    url: result.url || "",
                    path: result.path,
                    public_id: result.public_id
                  });
                } else {
                  throw new Error(result.error || "Server-side additional URL upload failed");
                }
              } catch (serverError) {
                console.error(`Server-side upload failed for additional URL: ${url}`, serverError);
                
                // Fall back to client-side upload
            const imageUploadResult = await uploadImageFromUrl(url, vendor?.id || 'unknown');
            
            if (imageUploadResult.success) {
                  additionalImageResults.push({
                    url: imageUploadResult.url || "",
                    path: imageUploadResult.path,
                    public_id: imageUploadResult.public_id
                  });
            } else {
                  // Use the URL directly as a fallback
                  additionalImageResults.push({ url });
              console.error('Failed to upload additional image from URL:', imageUploadResult.errorMessage);
                }
            }
          } catch (error) {
            console.error('Error uploading additional image from URL:', error);
              // Use the URL directly as a fallback
              additionalImageResults.push({ url });
            }
          }
        }
      } else {
        // No upload service is configured, use direct URLs
        console.warn("No upload service is configured. Using direct URLs instead.");
        
        if (imageUploadMode === 'url' && primaryImageUrl) {
          // Use the URL directly
          productImageUrl = primaryImageUrl;
        } else if (imageUploadMode === 'file' && primaryImage) {
          // Create a data URL from the file
          const reader = new FileReader();
          productImageUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(primaryImage);
          });
        }
        
        // Handle additional images
        if (imageUploadMode === 'url' && additionalImageUrls.length > 0) {
          additionalImageResults = additionalImageUrls
            .filter(url => url.trim())
            .map(url => ({ url }));
        } else if (imageUploadMode === 'file' && additionalImages.length > 0) {
          // Create data URLs for each additional image
          for (const file of additionalImages) {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            additionalImageResults.push({ url: dataUrl });
          }
        }
      }
      
      setUploadProgress(90)
      
      // 3. Add product to Firestore
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        mrp: parseFloat(formData.mrp || formData.price),
        stock: parseInt(formData.stock),
        unit: formData.unit,
        image: productImageUrl,
        imagePublicId: productImageId,
        additionalImages: additionalImageResults,
        pincodes: selectedPincodes,
        vendorId: vendor?.id || '',
        status: "active" as const
      }
      
      // Ensure vendor ID is provided
      if (!vendor?.id) {
        throw new Error("Vendor ID is required. Please reload the page or contact support.");
      }
      
      const productId = await addProduct(productData)
      
      setUploadProgress(100)
      
      toast({
        title: "Product Added",
        description: "Your product has been added successfully."
      })
      
      // Navigate back to products page after a short delay to show 100% progress
      setTimeout(() => {
        router.push('/vendor/products')
        router.refresh() // Force Next.js to refresh the page
      }, 1000)
      
    } catch (error: any) {
      console.error("Error adding product:", error)
      
      let errorMessage = error.message || "Failed to add product"
      
      // Provide more specific error message for image upload issues
      if (errorMessage.includes("Failed to upload")) {
        errorMessage += ". This might be due to image upload service configuration issues. Please try using image URLs instead."
      }
      
      setError(errorMessage)
      setUploadProgress(0)
    } finally {
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
          <h1 className="text-2xl font-bold">Add Product</h1>
        </div>

        <Card className="md:max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Delivery Areas Required</CardTitle>
            <CardDescription>
              You need to set up your delivery areas before adding products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No delivery areas configured</AlertTitle>
              <AlertDescription>
                Before adding products, you need to configure which pincodes you can deliver to. This is required so customers know where your products are available.
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Add Product</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {configError && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{configError}</AlertDescription>
        </Alert>
      )}

      {isConfigChecking && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Checking upload configuration...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Enter the basic details of your product.</CardDescription>
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
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
              <CardDescription>Set the price and manage inventory.</CardDescription>
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
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Upload a primary image (required) and up to 2 additional images (optional).
                Max size: 5MB per image.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    disabled={!!configError && configError.includes("not properly configured")}
                  />
                  <label 
                    htmlFor="upload-file" 
                    className={!!configError && configError.includes("not properly configured") ? "text-gray-400" : ""}
                  >
                    Upload from device
                  </label>
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
                  {!!configError && configError.includes("not properly configured") && (
                    <span className="ml-2 text-xs text-green-600">
                      (Recommended)
                    </span>
                  )}
                </div>
              </div>

              {configError && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {imageUploadMode === 'url' ? 
                      "You can use direct image URLs from other websites (make sure they are publicly accessible)" :
                      "File upload might not work due to configuration issues. Consider using image URLs instead."
                    }
                  </AlertDescription>
                </Alert>
              )}

              {/* Primary Image Section */}
              <div>
                <Label className="block mb-2 font-medium">Primary Image (Required)</Label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                  {primaryImagePreview ? (
                    <div className="relative h-48 w-48 mb-4">
                      <Image
                        src={primaryImagePreview}
                        alt="Primary product preview"
                        fill
                        className="object-contain rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full flex flex-col items-center justify-center bg-gray-50 rounded-md">
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-500">Click to upload primary product image</p>
                    </div>
                  )}

                  {imageUploadMode === 'file' ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePrimaryImageChange}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFileInput}
                      >
                        {primaryImagePreview ? "Change Primary Image" : "Upload Primary Image"}
                      </Button>
                    </>
                  ) : (
                    <div className="w-full mt-4">
                      <Input
                        id="image-url"
                        placeholder="https://example.com/image.jpg"
                        value={primaryImageUrl}
                        onChange={handlePrimaryImageUrl}
                        className="w-full mb-2"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Images Section */}
              <div>
                <Label className="block mb-2 font-medium">Additional Images (Optional, max 2)</Label>

                {imageUploadMode === 'file' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Display additional image previews */}
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="relative border rounded-md p-2">
                      <div className="relative h-32 w-full">
                        <Image
                          src={preview}
                          alt={`Additional image ${index + 1}`}
                          fill
                          className="object-contain rounded-md"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/80 backdrop-blur-sm text-red-500 hover:text-red-700"
                        onClick={() => removeAdditionalImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add more images button if less than 2 */}
                  {additionalImagePreviews.length < 2 && (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center p-4 h-32 cursor-pointer hover:bg-gray-50"
                      onClick={triggerAdditionalFileInput}
                    >
                      <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Add image</p>
                    </div>
                  )}
                </div>
                ) : (
                  /* URL input mode for additional images */
                  <div className="space-y-4">
                    {additionalImageUrls.map((url, index) => (
                      <div key={index} className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="https://example.com/image.jpg"
                            value={url}
                            onChange={(e) => handleAdditionalImageUrl(index, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeAdditionalImageUrl(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {additionalImagePreviews[index] && (
                          <div className="relative h-32 w-full border rounded-md">
                            <Image
                              src={additionalImagePreviews[index]}
                              alt={`Additional image ${index + 1}`}
                              fill
                              className="object-contain rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {additionalImageUrls.length < 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={handleAddAdditionalImageUrl}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add Image URL
                      </Button>
                    )}
                  </div>
                )}

                <input
                  ref={additionalFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAdditionalImagesChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>
                Select the areas where this product will be available for delivery
              </CardDescription>
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

          <div className="md:col-span-2 flex justify-end">
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600"
              disabled={isSubmitting || selectedPincodes.length === 0 || 
                (imageUploadMode === 'file' && !primaryImage) || 
                (imageUploadMode === 'url' && !primaryImageUrl)}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Saving..."}
                </div>
              ) : (
                "Save Product"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
