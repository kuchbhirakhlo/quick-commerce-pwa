"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { FacebookIcon, Instagram, Twitter, ChevronRight, ChevronDown, ChevronUp, Heart } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"

interface Category {
  id: string
  name: string
  icon: string
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

// Mobile-friendly collapsible section component
const CollapsibleSection = ({ title, children }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b md:border-none pb-2 md:pb-0">
      <div
        className="flex justify-between items-center py-3 md:py-0 cursor-pointer md:cursor-default"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-bold md:mb-4">{title}</h3>
        <span className="md:hidden">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>
      <div className={`${isOpen ? 'block' : 'hidden'} md:block pb-3 md:pb-0`}>
        {children}
      </div>
    </div>
  );
};

export default function Footer(props: React.HTMLAttributes<HTMLElement>) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const currentYear = new Date().getFullYear()

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesQuery = query(
          collection(db, "categories"),
          orderBy("name"),
          limit(10) // Limit to 10 categories for the footer
        )
        const categoriesSnapshot = await getDocs(categoriesQuery)

        const fetchedCategories: Category[] = []
        categoriesSnapshot.forEach(doc => {
          fetchedCategories.push({
            id: doc.id,
            name: doc.data().name,
            icon: doc.data().icon
          })
        })

        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Error fetching categories for footer:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <footer className="bg-gray-50 border-t pb-20 sm:pb-0" {...props}>
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Logo and description - always visible */}
        {/* <div className="mb-6 md:mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image src="/logo.webp" alt="Logo" width={120} height={48} />
          </Link>
          <p className="text-gray-600 md:max-w-md">
            Your one-stop shop for quick grocery delivery. Get fresh products delivered to your doorstep in minutes.
          </p>
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8">
          {/* Logo and description - always visible */}
          <div className="mb-6 md:mb-8">
            <Link href="/" className="inline-block mb-4">
              <Image src="/icons/dlogo.gif" className="rounded-full" alt="Logo" width={120} height={48} />
            </Link>
            <p className="text-gray-600 md:max-w-md">
              Your one-stop shop for quick grocery delivery. Get fresh products delivered to your doorstep in minutes.
            </p>
          </div>

          {/* Quick Links */}
          <CollapsibleSection title="Quick Links">
            <ul className="space-y-2">
              <li>
                <Link href="/about-us" className="text-gray-600 hover:text-emerald-600">About Us</Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-gray-600 hover:text-emerald-600">Contact Us</Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-emerald-600">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-emerald-600">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-600 hover:text-emerald-600">FAQs</Link>
              </li>
              <li>
                <Link href="/vendor" className="text-gray-600 hover:text-emerald-600">Vendor</Link>
              </li>
            </ul>
          </CollapsibleSection>

          {/* Categories (Dynamic) */}
          <CollapsibleSection title="Categories">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-5 bg-gray-200 rounded w-3/4"></div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <ul className="space-y-2">
                {categories.map(category => (
                  <li key={category.id}>
                    <Link
                      href={`/category/${category.id}`}
                      className="text-gray-600 hover:text-emerald-600 flex items-center"
                    >
                      <ChevronRight size={14} className="mr-1" />
                      {category.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/category"
                    className="text-emerald-600 font-medium hover:underline flex items-center mt-2"
                  >
                    View All Categories
                  </Link>
                </li>
              </ul>
            ) : (
              <p className="text-gray-500">No categories available</p>
            )}
          </CollapsibleSection>

          {/* Social Links */}
          <CollapsibleSection title="Connect With Us">
            <div className="flex space-x-3 mb-4">
              <a href="https://www.facebook.com/profile.php?id=61571924386565" className="bg-gray-200 p-2 rounded-full hover:bg-emerald-100">
                <FacebookIcon size={18} className="text-gray-700" />
              </a>
              <a href="https://www.instagram.com/buzzatstore/" className="bg-gray-200 p-2 rounded-full hover:bg-emerald-100">
                <Instagram size={18} className="text-gray-700" />
              </a>
              <a href="https://wa.me/8383811977?text=नमस्ते%20Buzzat%20Team!%20मैं%20आपके%20प्लेटफ़ॉर्म%20पर%20वेंडर%20बनना%20चाहता%20हूं।" className="bg-gray-200 p-2 rounded-full hover:bg-emerald-100">
                <FaWhatsapp size={18} className="text-gray-700" />
              </a>
            </div>
            <p className="text-sm text-gray-600">
              Subscribe to our newsletter for exclusive offers and updates.
            </p>
          </CollapsibleSection>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-6 md:mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm mb-4 md:mb-0">
              © {currentYear} Quick Commerce. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              {/* Make in India icons */}
              <p className="text-gray-600 flex flex-row text-red-500 text-sm mb-4 md:mb-0">
                <Heart /> Make in India by <a href="procotech.in" className="text-blue-300" > Proco Technologies</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 