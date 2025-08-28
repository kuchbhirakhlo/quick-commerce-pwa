"use client"

import { useState, useEffect } from "react"
import { 
  collection,
  getDocs, 
  query,
  where,
  orderBy
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { AlertCircle, Loader2, SearchIcon, ShoppingBag } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  mrp: number
  image: string
  unit: string
  stock: number
  vendorId: string
  vendorName?: string
  status: "active" | "out_of_stock" | "deleted"
}

interface Category {
  id: string
  name: string
  icon: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  
  // Store unique vendors
  const [vendors, setVendors] = useState<{id: string, name: string}[]>([])
  
  // Fetch products and categories
  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .finally(() => setIsLoading(false))
  }, [])
  
  const fetchProducts = async () => {
    setError(null)
    
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("status", "!=", "deleted"),
        orderBy("status"),
        orderBy("name")
      )
      const productsSnapshot = await getDocs(productsQuery)
      
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      
      // Fetch vendor names
      const vendorIds = [...new Set(productsData.map(p => p.vendorId))]
      const vendorPromises = vendorIds.map(async vendorId => {
        const vendorSnapshot = await getDocs(
          query(collection(db, "vendors"), where("id", "==", vendorId))
        )
        if (!vendorSnapshot.empty) {
          return { 
            vendorId, 
            vendorName: vendorSnapshot.docs[0].data().name || "Unknown Vendor" 
          }
        }
        return { vendorId, vendorName: "Unknown Vendor" }
      })
      
      const vendorData = await Promise.all(vendorPromises)
      const vendorMap = Object.fromEntries(
        vendorData.map(v => [v.vendorId, v.vendorName])
      )
      
      // Create list of unique vendors for filter
      const uniqueVendors = Array.from(new Set(vendorIds)).map(id => ({
        id,
        name: vendorMap[id] || "Unknown Vendor"
      })).sort((a, b) => a.name.localeCompare(b.name))
      
      setVendors(uniqueVendors)
      
      // Add vendor names to products
      const productsWithVendors = productsData.map(product => ({
        ...product,
        vendorName: vendorMap[product.vendorId] || "Unknown Vendor"
      }))
      
      setProducts(productsWithVendors)
      
    } catch (err: any) {
      setError(`Error loading products: ${err.message}`)
      console.error("Error loading products:", err)
    }
  }
  
  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
      const categoriesSnapshot = await getDocs(categoriesQuery)
      
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]
      
      setCategories(categoriesData)
      
    } catch (err: any) {
      console.error("Error loading categories:", err)
    }
  }
  
  // Filter products
  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.vendorName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || 
      product.category === categoryFilter
    
    // Status filter
    const matchesStatus = statusFilter === "all" || 
      product.status === statusFilter
    
    // Vendor filter
    const matchesVendor = vendorFilter === "all" ||
      product.vendorId === vendorFilter
    
    return matchesSearch && matchesCategory && matchesStatus && matchesVendor
  })
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.status === "out_of_stock").length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            View and filter products from all vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products or vendors..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Select 
                value={categoryFilter} 
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectGroup>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={vendorFilter} 
                onValueChange={setVendorFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  <SelectGroup>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Products Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found matching your filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-md overflow-hidden">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.unit}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {categories.find(c => c.id === product.category)?.name || 
                        product.category.split("-").map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(" ")
                      }
                    </TableCell>
                    <TableCell>₹{product.price}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                      >
                        {product.status === "active" ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.vendorName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 