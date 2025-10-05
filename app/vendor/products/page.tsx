"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Trash2, Edit, ShoppingBag, Package } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { deleteProductImage } from "@/lib/cloudinary/upload"

interface Product {
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
  pincodes?: string[]
  status: "active" | "out_of_stock" | "deleted"
  categoryName?: string
}

interface Category {
  id: string
  name: string
  icon: string
}

export default function VendorProductsPage() {
  const { vendor } = useVendor()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Record<string, Category>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<{ id: string, price: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesQuery = query(collection(db, "categories"))
        const snapshot = await getDocs(categoriesQuery)
        
        const categoriesData: Record<string, Category> = {}
        snapshot.docs.forEach(doc => {
          categoriesData[doc.id] = { id: doc.id, ...doc.data() } as Category
        })
        
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }
    
    fetchCategories()
  }, [])

  // Fetch products for this vendor
  useEffect(() => {
    if (!vendor) return

    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const productsQuery = query(
          collection(db, "products"),
          where("vendorId", "==", vendor.id),
          where("status", "!=", "deleted")
        )

        const productsSnapshot = await getDocs(productsQuery)
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[]

        // Enhance products with category names
        const enhancedProducts = productsData.map(product => {
          // If the category is a valid category ID and exists in our categories object
          if (categories[product.category]) {
            return {
              ...product,
              categoryName: categories[product.category].name
            }
          }
          return product
        })

        setProducts(enhancedProducts)
      } catch (error: any) {
        setError(`Error loading products: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [vendor, categories])

  // Toggle product status (in stock / out of stock)
  const toggleProductStatus = async (productId: string, currentStatus: Product["status"]) => {
    try {
      const newStatus = currentStatus === "active" ? "out_of_stock" : "active"

      await updateDoc(doc(db, "products", productId), {
        status: newStatus
      })

      // Update local state
      setProducts(products.map(product =>
        product.id === productId
          ? { ...product, status: newStatus }
          : product
      ))

      toast({
        title: "Status updated",
        description: `Product is now ${newStatus === "active" ? "in stock" : "out of stock"}.`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error.message,
      })
    }
  }

  // Start editing product price
  const startEditingPrice = (productId: string, currentPrice: number) => {
    setEditingProduct({ id: productId, price: currentPrice })
  }

  // Update product price
  const updateProductPrice = async () => {
    if (!editingProduct) return

    try {
      await updateDoc(doc(db, "products", editingProduct.id), {
        price: editingProduct.price
      })

      // Update local state
      setProducts(products.map(product =>
        product.id === editingProduct.id
          ? { ...product, price: editingProduct.price }
          : product
      ))

      toast({
        title: "Price updated",
        description: "Product price has been updated successfully.",
      })

      // Clear editing state
      setEditingProduct(null)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update price",
        description: error.message,
      })
    }
  }

  // Delete product
  const deleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);

    try {
      // First, delete the product image from Cloudinary if it exists
      if (productToDelete.imagePublicId) {
        try {
          await deleteProductImage(productToDelete.imagePublicId);
        } catch (error) {
          console.error("Error deleting product image:", error);
          // Continue with product deletion even if image deletion fails
        }
      }

      // Delete any additional images if they exist
      if (productToDelete.additionalImages && Array.isArray(productToDelete.additionalImages)) {
        for (const img of productToDelete.additionalImages) {
          // Handle both Cloudinary public_id and Firebase path
          const imageId = img.public_id || img.path;
          if (imageId) {
            try {
              await deleteProductImage(imageId);
            } catch (error) {
              console.error("Error deleting additional image:", error);
              // Continue anyway
            }
          }
        }
      }

      // Then delete the product from Firestore
      await deleteDoc(doc(db, "products", productToDelete.id));

      // Update local state
      setProducts(products.filter(p => p.id !== productToDelete.id));

      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete product",
        description: error.message,
      });
    } finally {
      setProductToDelete(null);
      setIsDeleting(false);
    }
  };

  if (!vendor) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/vendor/products/add">Add Product</Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-center">No products found</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Get started by adding your first product.
            </p>
            <Button asChild className="mt-4">
              <Link href="/vendor/products/add">Add Product</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile view - card list */}
          <div className="grid gap-4 md:hidden">
            {products.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex items-center p-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden mr-4 flex-shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-gray-100 flex items-center justify-center h-full w-full">
                        <ShoppingBag className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{product.categoryName || product.category}</p>
                    <div className="flex items-center mt-1">
                      <span className="font-medium text-base">₹{product.price}</span>
                      {product.mrp > product.price && (
                        <span className="ml-2 text-xs text-gray-500 line-through">₹{product.mrp}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={product.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {product.status === "active" ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <div className="border-t flex divide-x">
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-none h-12"
                    asChild
                  >
                    <Link href={`/vendor/products/edit/${product.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-none h-12"
                    onClick={() => startEditingPrice(product.id, product.price)}
                  >
                    Price
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-none h-12"
                    onClick={() => toggleProductStatus(product.id, product.status)}
                  >
                    {product.status === "active" ? "Out" : "In"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-none h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setProductToDelete(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop view - table */}
          <div className="hidden md:block border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 rounded-md overflow-hidden">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="bg-gray-100 flex items-center justify-center h-full w-full">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.unit}</div>
                    </TableCell>
                    <TableCell>{product.categoryName || product.category}</TableCell>
                    <TableCell>
                      {editingProduct && editingProduct.id === product.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                            className="w-24"
                            min={1}
                          />
                          <Button size="sm" onClick={updateProductPrice}>Save</Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>₹{product.price}</span>
                          {product.mrp > product.price && (
                            <span className="text-xs text-gray-500 line-through">₹{product.mrp}</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingPrice(product.id, product.price)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={product.status === "active"}
                          onCheckedChange={() => toggleProductStatus(product.id, product.status)}
                        />
                        <span className={product.status === "active" ? "text-green-600" : "text-red-600"}>
                          {product.status === "active" ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/vendor/products/edit/${product.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProductToDelete(product)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!productToDelete} onOpenChange={() => !isDeleting && setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium">{productToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
