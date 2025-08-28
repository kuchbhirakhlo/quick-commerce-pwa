"use client"

import { useState, useEffect } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import AddCategoryDialog from "@/components/vendor/add-category-dialog"
import ManageCategoryDialog from "@/components/vendor/manage-category-dialog"
import ImportCategoriesDialog from "@/components/vendor/import-categories-dialog"
import Image from "next/image"

interface Category {
  id: string
  name: string
  icon?: string
  productCount: number
  pincodes: string[]
}

interface DbCategory {
  id: string
  name: string
  icon: string
  iconPublicId?: string
}

interface Product {
  id: string
  category: string
  pincodes: string[]
  [key: string]: any
}

export default function VendorCategoriesPage() {
  const { vendor } = useVendor()
  const [categories, setCategories] = useState<Category[]>([])
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPincode, setSelectedPincode] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Fetch categories for this vendor based on pincode
  useEffect(() => {
    if (!vendor) return

    const fetchCategoriesForVendor = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First, fetch global categories from database to use for mapping
        const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
        const categoriesSnapshot = await getDocs(categoriesQuery)
        const fetchedCategories = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DbCategory[]
        setDbCategories(fetchedCategories)
        
        // Create a mapping of category IDs to names and icons for quick lookup
        const categoryMap: Record<string, {name: string, icon?: string}> = {}
        fetchedCategories.forEach(cat => {
          categoryMap[cat.id] = {
            name: cat.name,
            icon: cat.icon
          }
        })
        
        // Then, fetch vendor's products
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

        // Extract categories and count products per category
        const vendorCategoryMap = new Map<string, Category>()

        productsData.forEach(product => {
          const categoryId = product.category
          const categoryInfo = categoryMap[categoryId] || { name: categoryId }
          const pincodes = product.pincodes || []
          
          if (!vendorCategoryMap.has(categoryId)) {
            vendorCategoryMap.set(categoryId, {
              id: categoryId,
              name: categoryInfo.name,
              icon: categoryInfo.icon,
              productCount: 1,
              pincodes: [...pincodes]
            })
          } else {
            const existingCategory = vendorCategoryMap.get(categoryId)!
            existingCategory.productCount++
            
            // Add unique pincodes
            pincodes.forEach((pincode: string) => {
              if (!existingCategory.pincodes.includes(pincode)) {
                existingCategory.pincodes.push(pincode)
              }
            })
          }
        })

        const categoriesData = Array.from(vendorCategoryMap.values())
        setCategories(categoriesData)

        // Set default pincode if available
        if (vendor.pincodes && vendor.pincodes.length > 0) {
          setSelectedPincode(vendor.pincodes[0])
        }
        
      } catch (error: any) {
        setError(`Error loading categories: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoriesForVendor()
  }, [vendor])

  // Filter categories based on selected pincode
  const filteredCategories = selectedPincode
    ? categories.filter(category => category.pincodes.includes(selectedPincode))
    : categories

  // Filter global categories based on search term
  const filteredDbCategories = searchTerm
    ? dbCategories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : dbCategories

  // Handler to refresh data after adding a new category
  const handleCategoryAdded = () => {
    if (vendor) {
      // Re-fetch all categories
      const fetchGlobalCategories = async () => {
        try {
          const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
          const categoriesSnapshot = await getDocs(categoriesQuery)
          const fetchedCategories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as DbCategory[]
          setDbCategories(fetchedCategories)
        } catch (error) {
          console.error("Error refreshing categories:", error)
        }
      }
      
      fetchGlobalCategories()
    }
  }

  if (!vendor) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Categories</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <ImportCategoriesDialog onSuccess={handleCategoryAdded} />
          <AddCategoryDialog onSuccess={handleCategoryAdded} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories by Pincode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCategories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Global Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbCategories.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="max-w-xs">
          <Label htmlFor="pincode-filter">Filter by Pincode</Label>
          <select
            id="pincode-filter"
            className="w-full p-2 border rounded"
            value={selectedPincode}
            onChange={(e) => setSelectedPincode(e.target.value)}
          >
            <option value="">All Pincodes</option>
            {vendor.pincodes?.map(pincode => (
              <option key={pincode} value={pincode}>{pincode}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : filteredCategories.length > 0 ? (
          <>
            {/* Mobile view - cards */}
            <div className="grid gap-4 md:hidden">
              {filteredCategories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {category.icon && (
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 flex-shrink-0">
                            <Image
                              src={category.icon}
                              alt={category.name}
                              width={20}
                              height={20}
                            />
                          </div>
                        )}
                        <h3 className="font-medium">{category.name}</h3>
                      </div>
                      <Badge variant="outline">{category.productCount} products</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Available in:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.pincodes.slice(0, 3).map(pincode => (
                          <Badge key={pincode} variant="outline" className="text-xs">{pincode}</Badge>
                        ))}
                        {category.pincodes.length > 3 && (
                          <span className="text-xs text-gray-500">+{category.pincodes.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Category ID: <span className="font-mono">{category.id}</span></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Desktop view - table */}
            <div className="hidden md:block border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Category ID</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Pincodes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {category.icon && (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                              <Image
                                src={category.icon}
                                alt={category.name}
                                width={20}
                                height={20}
                              />
                            </div>
                          )}
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{category.id}</TableCell>
                      <TableCell>{category.productCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {category.pincodes.slice(0, 3).map(pincode => (
                            <Badge key={pincode} variant="outline">{pincode}</Badge>
                          ))}
                          {category.pincodes.length > 3 && (
                            <span className="text-xs text-gray-500">+{category.pincodes.length - 3} more</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 border rounded-md bg-gray-50">
            <p className="text-gray-500">No categories found for the selected pincode</p>
          </div>
        )}
      </div>

      <div className="space-y-4 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-lg font-medium">Global Categories</h2>
          <div className="w-full sm:w-64">
            <Input
              type="search"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Mobile view - cards */}
        <div className="grid gap-4 md:hidden">
          {filteredDbCategories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  {category.icon && (
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <Image
                        src={category.icon}
                        alt={category.name}
                        width={24}
                        height={24}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-xs text-gray-500">ID: {category.id}</p>
                  </div>
                  <div className="ml-auto">
                    <ManageCategoryDialog 
                      category={category} 
                      onSuccess={handleCategoryAdded}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop view - table */}
        <div className="hidden md:block border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDbCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    <p className="text-gray-500">No categories found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDbCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.icon && (
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Image
                            src={category.icon}
                            alt={category.name}
                            width={20}
                            height={20}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="font-mono text-xs">{category.id}</TableCell>
                    <TableCell className="text-right">
                      <ManageCategoryDialog 
                        category={category} 
                        onSuccess={handleCategoryAdded}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 