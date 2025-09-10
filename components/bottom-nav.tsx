"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, ShoppingBag, ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"
import { useCart } from "@/lib/hooks/use-cart"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet"
import CartItem from "./cart-item"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/context/auth-context"
import UserMenu from "./user-menu"
import { getAllCategories } from "@/lib/firebase/firestore"

// Define user pages where bottom navbar should appear
const USER_PAGES = [
    '/', // homepage
    '/category', // category page and nested routes
    '/product', // product page and nested routes
    '/checkout', // checkout page and nested routes
    '/account/orders', // order history page
    '/account/profile', // user profile page
]

// Function to convert category name to URL-friendly slug
function createSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

// Define Category interface
interface Category {
    id: string;
    name: string;
    icon?: string;
}

export default function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const { cartItems, cartCount } = useCart()
    const [cartOpen, setCartOpen] = useState(false)
    const { user } = useAuth()
    const [firstCategorySlug, setFirstCategorySlug] = useState<string | null>(null)

    // Use useEffect to handle client-side mounting and check screen size
    useEffect(() => {
        setMounted(true)

        // Check if screen is mobile
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        // Initial check
        checkIsMobile()

        // Add event listener for window resize
        window.addEventListener('resize', checkIsMobile)

        // Fetch first category
        const fetchFirstCategory = async () => {
            try {
                const categories = await getAllCategories() as Category[];
                if (categories && categories.length > 0) {
                    const firstCategory = categories[0];
                    const slug = `${createSlug(firstCategory.name)}-${firstCategory.id}`;
                    setFirstCategorySlug(slug);
                }
            } catch (error) {
                console.error("Error fetching first category:", error);
            }
        };

        fetchFirstCategory();

        // Cleanup
        return () => window.removeEventListener('resize', checkIsMobile)
    }, [])

    // Check if current path is a user page where navbar should appear
    const shouldShowNavbar = () => {
        if (!pathname) return false
        return USER_PAGES.some(page => pathname === page || pathname.startsWith(`${page}/`))
    }

    // Don't render anything on the server side, if not on a user page, or if not mobile
    if (!mounted || !shouldShowNavbar() || !isMobile) {
        return null
    }

    const handleProceedToCheckout = () => {
        if (!user) {
            // Set a flag to redirect to checkout after login
            localStorage.setItem("redirect_to_checkout", "true")

            // Close the cart sheet first
            setCartOpen(false)
            setTimeout(() => {
                // Then show login modal after a short delay
                window.dispatchEvent(new CustomEvent('show-login-modal'))
            }, 300)
        } else {
            // Use router for navigation instead of window.location
            router.push('/checkout')
        }
    }

    return (
        <div className="mobile-bottom-nav hidden sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-20">
            <div className="flex justify-around items-center h-16 w-full">
                <NavItem
                    href="/"
                    icon={<Home size={22} />}
                    label="Home"
                    isActive={pathname === "/"}
                    onClick={() => cartOpen && setCartOpen(false)}
                />

                <NavItem
                    href={firstCategorySlug ? `/category/${firstCategorySlug}` : "/category"}
                    icon={<ShoppingBag size={22} />}
                    label="Shop"
                    isActive={pathname?.startsWith("/category") || pathname?.startsWith("/product") || false}
                    onClick={() => cartOpen && setCartOpen(false)}
                />

                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                    <SheetTrigger asChild>
                        <button className={`flex flex-col items-center justify-center w-full py-1 ${cartOpen ? "text-emerald-600" : "text-gray-500"
                            }`}>
                            <div className="flex justify-center relative">
                                <ShoppingCart size={22} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs mt-1">Cart</span>
                            {cartOpen && (
                                <div className="w-1/2 h-1 bg-emerald-600 rounded-full mt-1"></div>
                            )}
                        </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:w-[400px] h-full pt-16 px-0 overflow-y-auto z-50">
                        <div className="h-auto flex flex-col px-4 pb-6 pt-2">
                            <div className="flex justify-between items-center pb-3 border-b mb-2">
                                <h2 className="text-xl font-bold">Your Cart</h2>
                            </div>
                            {cartItems.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <ShoppingCart size={64} className="text-gray-300 mb-4" />
                                    <p className="text-gray-500">Your cart is empty</p>
                                    <Link href="/" onClick={() => setCartOpen(false)}>
                                        <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">Start Shopping</Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 overflow-y-auto pb-4 max-h-[50vh]">
                                        {cartItems.map(item => (
                                            <CartItem
                                                key={item.id}
                                                id={item.id}
                                                name={item.name}
                                                price={item.price}
                                                unit={item.unit}
                                                image={item.image}
                                                quantity={item.quantity}
                                            />
                                        ))}
                                    </div>
                                    <div className="border-t pt-4 mt-auto sticky bottom-0 bg-white">
                                        <div className="flex justify-between mb-2">
                                            <span>Subtotal</span>
                                            <span>₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between mb-4">
                                            <span>Delivery Fee</span>
                                            <span>₹40.00</span>
                                        </div>
                                        <div className="flex justify-between font-bold mb-4">
                                            <span>Total</span>
                                            <span>₹{(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 40).toFixed(2)}</span>
                                        </div>
                                        <div className="pb-20">
                                            <Button
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 fixed bottom-20 left-0 right-0 mx-4 z-10"
                                                onClick={handleProceedToCheckout}
                                            >
                                                {user ? "Proceed to Checkout" : "Login to Checkout"}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                <UserMenu
                    user={
                        user
                            ? {
                                ...user,
                                photoURL: user.photoURL === null ? undefined : user.photoURL,
                                displayName: user.displayName === null ? undefined : user.displayName,
                                email: user.email === null ? undefined : user.email,
                                phoneNumber: user.phoneNumber === null ? undefined : user.phoneNumber
                            }
                            : null
                    }
                    onNavigate={() => cartOpen && setCartOpen(false)}
                />
            </div>
        </div>
    )
}

interface NavItemProps {
    href: string
    icon: React.ReactNode
    label: string
    isActive: boolean
    onClick?: () => void
}

function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center w-full py-1 ${isActive ? "text-emerald-600" : "text-gray-500"
                }`}
            onClick={onClick}
        >
            <div className="flex justify-center">{icon}</div>
            <span className="text-xs mt-1">{label}</span>
            {isActive && (
                <div className="w-1/2 h-1 bg-emerald-600 rounded-full mt-1"></div>
            )}
        </Link>
    )
}