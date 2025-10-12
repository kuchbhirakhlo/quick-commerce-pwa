"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Search, Filter, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/hooks/use-cart"
import { getProductsByPincode } from "@/lib/firebase/firestore"
import { usePincode } from "@/lib/hooks/use-pincode"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getButtonClass } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface Product {
    id: string
    name: string
    price: number
    unit: string
    image: string
    category?: string
}

type ViewMode = 'masonry' | 'grid' | 'compact'
type SortOption = 'name' | 'price-low' | 'price-high' | 'category'

export default function AllProductsDisplay() {
    const { addToCart } = useCart()
    const { pincode } = usePincode()
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [viewMode, setViewMode] = useState<ViewMode>('masonry')
    const [sortBy, setSortBy] = useState<SortOption>('name')
    const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
    const pathname = usePathname()

    // Get unique categories from products
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

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

                const formattedProducts = allProducts.map(p => ({
                    id: p.id || '',
                    name: p.name,
                    price: p.price,
                    unit: p.unit,
                    image: p.image,
                    category: p.category
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

    // Filter and sort products
    useEffect(() => {
        let filtered = products

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory)
        }

        // Apply sorting
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

        setFilteredProducts(filtered)
    }, [products, searchTerm, selectedCategory, sortBy])

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
            {/* Header with title and view controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">All Products</h2>
                    <p className="text-gray-600">{filteredProducts.length} products available</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
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

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm"
                    >
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category === 'all' ? 'All Categories' : category}
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
                    <p className="text-gray-500">No products match your search criteria.</p>
                </div>
            ) : (
                <div className={`${viewMode === 'masonry'
                    ? 'masonry-container'
                    : viewMode === 'grid'
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                        : 'space-y-2'
                    }`}>
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className={`${viewMode === 'masonry'
                                ? 'break-inside-avoid mb-4'
                                : viewMode === 'grid'
                                    ? ''
                                    : 'flex items-center gap-4 p-3 border rounded-lg bg-white'
                                }`}
                        >
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
            )}
        </div>
    )
}