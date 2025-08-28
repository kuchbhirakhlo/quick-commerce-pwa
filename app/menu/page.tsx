"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ShoppingBag, 
  User, 
  Home, 
  Clock, 
  MapPin, 
  Heart, 
  HelpCircle, 
  Info, 
  PhoneCall, 
  Settings,
  Loader2
} from "lucide-react"
import Header from "@/components/header"
import { getAllCategories } from "@/lib/firebase/firestore"

// Define Category interface
interface Category {
  id: string;
  name: string;
  icon?: string;
}

// Function to convert category name to URL-friendly slug
function createSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function MenuPage() {
  const [firstCategorySlug, setFirstCategorySlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFirstCategory();
  }, []);
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 px-4">
        <h1 className="text-2xl font-bold mb-6">Menu</h1>
        
        <div className="bg-white rounded-lg shadow-sm divide-y">
          <MenuItem 
            href="/"
            icon={<Home className="text-emerald-600" size={20} />}
            label="Home"
          />
          {isLoading ? (
            <div className="flex items-center py-4 px-4">
              <div className="mr-3"><ShoppingBag className="text-emerald-600" size={20} /></div>
              <span className="font-medium">Shop by Category</span>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            </div>
          ) : (
            <MenuItem 
              href={firstCategorySlug ? `/category/${firstCategorySlug}` : "/category"}
              icon={<ShoppingBag className="text-emerald-600" size={20} />}
              label="Shop by Category"
            />
          )}
          <MenuItem 
            href="/account/profile"
            icon={<User className="text-emerald-600" size={20} />}
            label="My Account"
          />
          <MenuItem 
            href="/account/orders"
            icon={<Clock className="text-emerald-600" size={20} />}
            label="My Orders"
          />
          <MenuItem 
            href="/account/addresses"
            icon={<MapPin className="text-emerald-600" size={20} />}
            label="My Addresses"
          />
          <MenuItem 
            href="/wishlist"
            icon={<Heart className="text-emerald-600" size={20} />}
            label="My Wishlist"
          />
        </div>
        
        <h2 className="text-lg font-semibold mt-8 mb-4">Help & Settings</h2>
        <div className="bg-white rounded-lg shadow-sm divide-y">
          <MenuItem 
            href="/help"
            icon={<HelpCircle className="text-gray-600" size={20} />}
            label="Help Center"
          />
          <MenuItem 
            href="/about"
            icon={<Info className="text-gray-600" size={20} />}
            label="About Us"
          />
          <MenuItem 
            href="/contact"
            icon={<PhoneCall className="text-gray-600" size={20} />}
            label="Contact Us"
          />
          <MenuItem 
            href="/settings"
            icon={<Settings className="text-gray-600" size={20} />}
            label="App Settings"
          />
        </div>
      </div>
    </main>
  )
}

interface MenuItemProps {
  href: string
  icon: React.ReactNode
  label: string
}

function MenuItem({ href, icon, label }: MenuItemProps) {
  return (
    <Link 
      href={href}
      className="flex items-center py-4 px-4 hover:bg-gray-50"
    >
      <div className="mr-3">{icon}</div>
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-gray-400">›</span>
    </Link>
  )
} 