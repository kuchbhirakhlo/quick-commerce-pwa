"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { getProductsByPincode, getVendorById, getAllCategories, type Category } from "@/lib/firebase/firestore"
import { usePincode } from "@/lib/hooks/use-pincode"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getButtonClass } from "@/lib/utils"
import { usePathname } from "next/navigation"
import AdsenseAd from "./adsense"

interface Product {
    id: string
    name: string
    price: number
    unit: string
    image: string
    category?: string
    vendorId?: string
    vendorName?: string
}

type ViewMode = 'masonry' | 'grid' | 'compact'
type SortOption = 'name' | 'price-low' | 'price-high' | 'category'

export default function AllProductsDisplay() {
    const { addToCart } = useCart()
    const { pincode } = usePincode()
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [viewMode, setViewMode] = useState<ViewMode>('masonry')
    const [sortBy, setSortBy] = useState<SortOption>('name')
    const [groupByVendor, setGroupByVendor] = useState<boolean>(true)
    const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({})
    const pathname = usePathname()

    // Get unique categories from products (for filtering)
    const productCategories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))].filter((cat): cat is string => cat !== undefined)

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true)
            if (!pincode) {
                setProducts([])
                setFilteredProducts([])
                setIsLoading(false)
                return
            }

            try {
                const allProducts = await getProductsByPincode(pincode)

                // Get unique vendor IDs
                const vendorIds = [...new Set(allProducts.map(p => p.vendorId).filter(Boolean))]

                // Fetch vendor information
                const vendorPromises = vendorIds.map(async vendorId => {
                    const vendor = await getVendorById(vendorId)
                    return { vendorId, vendorName: vendor?.name || 'Unknown Vendor' }
                })

                const vendorData = await Promise.all(vendorPromises)
                const vendorMap = Object.fromEntries(
                    vendorData.map(v => [v.vendorId, v.vendorName])
                )

                const formattedProducts = allProducts.map(p => ({
                    id: p.id || '',
                    name: p.name,
                    price: p.price,
                    unit: p.unit,
                    image: p.image,
                    category: p.category,
                    vendorId: p.vendorId,
                    vendorName: (p.vendorId && vendorMap[p.vendorId]) || 'Unknown Vendor'
                }))

                setProducts(formattedProducts)
                setFilteredProducts(formattedProducts)
                console.log(`Fetched ${formattedProducts.length} total products for pincode ${pincode}`)
            } catch (error) {
                console.error("Error fetching products:", error)
                setProducts([])
                setFilteredProducts([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [pincode])

    // Fetch categories for display names
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const allCategories = await getAllCategories()
                const categoriesData = allCategories.map(cat => ({
                    id: cat.id,
                    name: cat.name || cat.id || 'Unnamed Category'
                }))
                setCategories(categoriesData)

                // Create mapping from category ID to name
                const map: Record<string, string> = {}
                categoriesData.forEach(cat => {
                    if (cat.id) {
                        map[cat.id] = cat.name
                    }
                })
                setCategoryMap(map)
            } catch (error) {
                console.error("Error fetching categories:", error)
            }
        }

        fetchCategories()
    }, [])

    // Filter and sort products
    useEffect(() => {
        let filtered = products

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory)
        }

        // Apply sorting - always group by vendor
        if (filtered.length > 0) {
            // Group by vendor first
            const vendorGroups: Record<string, Product[]> = {}
            filtered.forEach(product => {
                const vendorKey = product.vendorName || 'Unknown Vendor'
                if (!vendorGroups[vendorKey]) {
                    vendorGroups[vendorKey] = []
                }
                vendorGroups[vendorKey].push(product)
            })

            // Sort within each vendor group
            Object.keys(vendorGroups).forEach(vendor => {
                vendorGroups[vendor].sort((a, b) => {
                    switch (sortBy) {
                        case 'name':
                            return a.name.localeCompare(b.name)
                        case 'price-low':
                            return a.price - b.price
                        case 'price-high':
                            return b.price - a.price
                        case 'category':
                            return (a.category || '').localeCompare(b.category || '')
                        default:
                            return 0
                    }
                })
            })

            // Flatten maintaining vendor order
            filtered = Object.values(vendorGroups).flat()
        } else {
            // Regular sorting
            filtered.sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name)
                    case 'price-low':
                        return a.price - b.price
                    case 'price-high':
                        return b.price - a.price
                    case 'category':
                        return (a.category || '').localeCompare(b.category || '')
                    default:
                        return 0
                }
            })
        }

        setFilteredProducts(filtered)
    }, [products, selectedCategory, sortBy])

    const handleAddToCart = (product: Product) => {
        setLoadingProductId(product.id)
        addToCart(product)
        toast.success(`Added ${product.name} to cart`)

        setTimeout(() => {
            setLoadingProductId(null)
        }, 1500)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-gray-500">No products available for your location.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Free Delivery above ₹99 </h2>
                    <AdsenseAd slot="3968217169" />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex border rounded-lg p-1">
                        <Button
                            variant={viewMode === 'masonry' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('masonry')}
                            className="px-3"
                        >
                            <Grid size={16} />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="px-3"
                        >
                            <List size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex gap-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm"
                    >
                        {productCategories.map(categoryId => (
                            <option key={categoryId} value={categoryId}>
                                {categoryId === 'all' ? 'All Categories' : (categoryMap[categoryId] || categoryId)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-3 py-2 border rounded-lg text-sm"
                    >
                        <option value="name">Name A-Z</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="category">Category</option>
                    </select>
                </div>
            </div>

            {/* Products Display */}
            {filteredProducts.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-gray-500">No products available in this category for your location.</p>
                </div>
            ) : (
                // Always render vendor sections
                <div>
                    {Object.entries(
                        filteredProducts.reduce((groups: Record<string, Product[]>, product) => {
                            const vendorKey = product.vendorName || 'Unknown Vendor'
                            if (!groups[vendorKey]) {
                                groups[vendorKey] = []
                            }
                            groups[vendorKey].push(product)
                            return groups
                        }, {})
                    ).map(([vendorName, vendorProducts]) => (
                        <div key={vendorName} className="mb-8">
                            {/* Vendor Header */}
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                                    {vendorName}
                                </h3>
                            </div>
                            <AdsenseAd slot="3968217169" />

                            {/* Vendor Products Grid */}
                            <div className={`${viewMode === 'masonry'
                                ? 'masonry-container'
                                : viewMode === 'grid'
                                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                                    : 'space-y-2'
                                }`}>
                                {vendorProducts.map((product) => (
                                    <div key={product.id} className={`${viewMode === 'masonry'
                                        ? 'break-inside-avoid mb-4'
                                        : viewMode === 'grid'
                                            ? ''
                                            : 'flex items-center gap-4 p-3 border rounded-lg bg-white'
                                        }`}>
                                        <div className={`${viewMode === 'masonry' || viewMode === 'grid'
                                            ? 'p-4 border rounded-lg bg-white flex flex-col h-full group hover:shadow-lg transition-shadow'
                                            : 'flex-shrink-0 w-20 h-20 relative'
                                            }`}>
                                            <Link href={`/product/${product.id}`} className="flex-1">
                                                <div className={`relative overflow-hidden ${viewMode === 'compact' ? 'w-20 h-20' : 'h-32 w-full mb-2'
                                                    }`}>
                                                    <Image
                                                        src={product.image && product.image.startsWith('http') ? product.image : "/placeholder.svg"}
                                                        alt={product.name}
                                                        fill
                                                        className={`object-contain ${viewMode === 'masonry' ? 'rounded-lg' : ''}`}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/placeholder.svg";
                                                        }}
                                                    />
                                                </div>

                                                {(viewMode === 'masonry' || viewMode === 'grid') && (
                                                    <>
                                                        <h3 className={`font-medium text-gray-800 line-clamp-2 ${viewMode === 'grid' ? 'text-sm' : ''
                                                            }`}>
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">{product.unit}</p>
                                                    </>
                                                )}
                                            </Link>

                                            <div className={`flex justify-between items-center mt-auto pt-2 ${viewMode === 'compact' ? 'flex-col gap-1' : ''
                                                }`}>
                                                <span className={`font-bold ${viewMode === 'compact' ? 'text-xs' : ''}`}>
                                                    ₹{product.price}
                                                </span>

                                                <Button
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={loadingProductId === product.id}
                                                    size={viewMode === 'compact' ? 'sm' : 'sm'}
                                                    className={`${getButtonClass(pathname ?? '')} ${viewMode === 'compact' ? 'px-2 py-1' : ''
                                                        }`}
                                                >
                                                    {loadingProductId === product.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Plus size={14} />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
