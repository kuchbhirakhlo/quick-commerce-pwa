"use client"

import { useState, useEffect } from "react"
import { 
  collection,
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy 
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { uploadProductImage, deleteProductImage, uploadImageFromUrl } from "@/lib/cloudinary/upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog,
  DialogClose,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Edit, Loader2, Plus, Trash2, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface Category {
  id: string
  name: string
  icon: string
  iconPublicId?: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" })
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  
  // File upload states
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Add image upload method state
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const [iconUrl, setIconUrl] = useState<string>("")

  // Fetch categories
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const q = query(collection(db, "categories"), orderBy("name"))
      const querySnapshot = await getDocs(q)
      
      const fetchedCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]
      
      setCategories(fetchedCategories)
    } catch (err: any) {
      setError(`Error loading categories: ${err.message}`)
      console.error("Error loading categories:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle icon file selection
  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      setIconFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
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
    try {
      let finalIconUrl = ""
      let iconPublicId = ""
      
      // Handle icon based on upload method
      if (uploadMethod === 'file' && iconFile) {
        // Upload icon file if provided
        const uploadResult = await uploadProductImage(iconFile, 'admin')
        if (!uploadResult.success) {
          throw new Error(uploadResult.errorMessage || "Failed to upload icon image")
        }
        finalIconUrl = uploadResult.url || ""
        iconPublicId = uploadResult.public_id || ""
      } else if (uploadMethod === 'url') {
        // Upload the image from the provided URL
        if (!iconUrl) {
          throw new Error("Please provide an image URL")
        }
        const uploadResult = await uploadImageFromUrl(iconUrl, 'admin')
        if (!uploadResult.success) {
          throw new Error(uploadResult.errorMessage || "Failed to upload image from URL")
        }
        finalIconUrl = uploadResult.url || ""
        iconPublicId = uploadResult.public_id || ""
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
      
      // Refresh categories
      fetchCategories()
      
      toast({
        title: "Success",
        description: "Category was added successfully"
      })
      
    } catch (err: any) {
      console.error("Error adding category:", err)
      toast({
        title: "Error",
        description: `Failed to add category: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Update category
  const handleUpdateCategory = async () => {
    if (!editCategory || !editCategory.name) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }
    
    setIsUploading(true)
    try {
      let iconUrl = editCategory.icon
      let iconPublicId = editCategory.iconPublicId
      
      // Handle icon based on upload method
      if (uploadMethod === 'file' && iconFile) {
        // Delete old icon if exists
        if (editCategory.iconPublicId) {
          await deleteProductImage(editCategory.iconPublicId)
        }
        
        // Upload new icon
        const uploadResult = await uploadProductImage(iconFile, 'admin')
        iconUrl = uploadResult.url || ""
        iconPublicId = uploadResult.public_id || ""
      } else if (uploadMethod === 'url' && iconUrl && iconUrl !== editCategory.icon) {
        // Delete old icon if exists and it's from Cloudinary
        if (editCategory.iconPublicId) {
          await deleteProductImage(editCategory.iconPublicId)
        }
        
        // Upload the image from the provided URL
        const uploadResult = await uploadImageFromUrl(iconUrl, 'admin')
        if (!uploadResult.success) {
          throw new Error(uploadResult.errorMessage || "Failed to upload image from URL")
        }
        iconUrl = uploadResult.url || ""
        iconPublicId = uploadResult.public_id || ""
      }
      
      // Update category document
      await updateDoc(doc(db, "categories", editCategory.id), {
        name: editCategory.name,
        icon: iconUrl,
        iconPublicId: iconPublicId,
        updatedAt: serverTimestamp()
      })
      
      // Reset form
      setEditCategory(null)
      setIconFile(null)
      setIconPreview(null)
      setIconUrl("")
      
      // Refresh categories
      fetchCategories()
      
      toast({
        title: "Success",
        description: "Category was updated successfully"
      })
      
    } catch (err: any) {
      console.error("Error updating category:", err)
      toast({
        title: "Error",
        description: `Failed to update category: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    
    setIsDeleting(true)
    try {
      // Delete icon if exists
      if (categoryToDelete.iconPublicId) {
        await deleteProductImage(categoryToDelete.iconPublicId)
      }
      
      // Delete category document
      await deleteDoc(doc(db, "categories", categoryToDelete.id))
      
      // Reset state
      setCategoryToDelete(null)
      
      // Refresh categories
      fetchCategories()
      
      toast({
        title: "Success",
        description: "Category was deleted successfully"
      })
      
    } catch (err: any) {
      console.error("Error deleting category:", err)
      toast({
        title: "Error",
        description: `Failed to delete category: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        
        {/* Add Category Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category for products
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input 
                  id="category-name" 
                  placeholder="e.g. Fruits & Vegetables" 
                  value={newCategory.name}
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category-icon">Category Icon</Label>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={uploadMethod === 'file' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUploadMethod('file')}
                    >
                      Upload File
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMethod === 'url' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUploadMethod('url')}
                    >
                      Image URL
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {iconPreview && (
                    <div className="relative w-16 h-16 rounded overflow-hidden border">
                      <Image src={iconPreview} alt="Icon preview" fill className="object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    {uploadMethod === 'file' ? (
                      <>
                        <Input
                          id="category-icon"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleIconFileChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("category-icon")?.click()}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Icon
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          id="icon-url"
                          placeholder="https://example.com/image.jpg"
                          value={iconUrl}
                          onChange={(e) => {
                            setIconUrl(e.target.value)
                            setIconPreview(e.target.value)
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddCategory}
                disabled={isUploading || !newCategory.name}
              >
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  "Save Category"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Categories</CardTitle>
          <CardDescription>
            Manage product categories that vendors can choose when adding products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No categories found. Add your first category.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="relative w-10 h-10 rounded overflow-hidden border bg-gray-100">
                        {category.icon ? (
                          <Image src={category.icon} alt={category.name} fill className="object-contain" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-400">
                            <span className="text-xs">No icon</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* Edit Category Dialog */}
                        <Dialog onOpenChange={(open) => {
                          if (!open) {
                            setIconFile(null)
                            setIconPreview(null)
                            setIconUrl("")
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditCategory(category)
                                setIconUrl(category.icon || "")
                                setUploadMethod(category.icon ? 'url' : 'file')
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Category</DialogTitle>
                              <DialogDescription>
                                Update category details
                              </DialogDescription>
                            </DialogHeader>
                            {editCategory && (
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-category-name">Category Name</Label>
                                  <Input 
                                    id="edit-category-name" 
                                    value={editCategory.name}
                                    onChange={e => setEditCategory({...editCategory, name: e.target.value})}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-category-icon">Category Icon</Label>
                                  <div className="flex items-center gap-4 mb-2">
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant={uploadMethod === 'file' ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setUploadMethod('file')}
                                      >
                                        Upload File
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={uploadMethod === 'url' ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setUploadMethod('url')}
                                      >
                                        Image URL
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {/* Show preview or current icon */}
                                    <div className="relative w-16 h-16 rounded overflow-hidden border">
                                      <Image 
                                        src={iconPreview || editCategory.icon || "/placeholder.svg"} 
                                        alt="Icon" 
                                        fill 
                                        className="object-contain" 
                                      />
                                    </div>
                                    <div className="flex-1">
                                      {uploadMethod === 'file' ? (
                                        <>
                                          <Input
                                            id="edit-category-icon"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleIconFileChange}
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById("edit-category-icon")?.click()}
                                            className="w-full"
                                          >
                                            <Upload className="mr-2 h-4 w-4" />
                                            Change Icon
                                          </Button>
                                        </>
                                      ) : (
                                        <div className="space-y-2">
                                          <Input
                                            id="edit-icon-url"
                                            placeholder="https://example.com/image.jpg"
                                            value={iconUrl}
                                            onChange={(e) => {
                                              setIconUrl(e.target.value)
                                              setIconPreview(e.target.value)
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button 
                                onClick={handleUpdateCategory}
                                disabled={isUploading || !editCategory?.name}
                              >
                                {isUploading ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                                ) : (
                                  "Update Category"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Delete Category Button */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setCategoryToDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Category Alert Dialog */}
      <AlertDialog 
        open={!!categoryToDelete} 
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              &quot;{categoryToDelete?.name}&quot; and remove its icon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteCategory()}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 