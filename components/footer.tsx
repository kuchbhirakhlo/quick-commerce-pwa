"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"

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
              <Image src="/logo.webp" alt="Logo" width={120} height={48} />
            </Link>
            <p className="text-gray-600 md:max-w-md">
              Your one-stop shop for quick grocery delivery. Get fresh products delivered to your doorstep in minutes.
            </p>
          </div>

          {/* Quick Links */}
          <CollapsibleSection title="Quick Links">
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-emerald-600">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-emerald-600">Contact Us</Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-emerald-600">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-emerald-600">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-emerald-600">FAQs</Link>
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
              <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-emerald-100">
                <Facebook size={18} className="text-gray-700" />
              </a>
              <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-emerald-100">
                <Instagram size={18} className="text-gray-700" />
              </a>
              <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-emerald-100">
                <Twitter size={18} className="text-gray-700" />
              </a>
              <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-emerald-100">
                <Linkedin size={18} className="text-gray-700" />
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
              {/* Payment method icons */}
              <div className="flex space-x-2">
                <div className="bg-white p-1 rounded shadow-sm">
                  <svg className="h-6 w-10" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                    <rect width="38" height="24" fill="#fff" />
                    <path d="M15 7h8v10h-8z" fill="#FF5F00" />
                    <path d="M15.9 12c0-2 1-3.9 2.5-5-2.7-2.1-6.6-1.6-8.7 1.1-2.1 2.7-1.6 6.6 1.1 8.7 2.3 1.8 5.5 1.8 7.8 0-1.6-1.1-2.6-3-2.6-5z" fill="#EB001B" />
                    <path d="M30.1 12c0 3.3-2.7 6-6 6-1.8 0-3.6-.8-4.7-2.1 2.7-2.1 3.2-6 1.1-8.7-.3-.4-.7-.8-1.1-1.1 2.7-2.1 6.6-1.6 8.7 1.1 1.3 1.7 2 3.7 2 5.8z" fill="#F79E1B" />
                  </svg>
                </div>
                <div className="bg-white p-1 rounded shadow-sm">
                  <svg className="h-6 w-10" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                    <rect width="38" height="24" fill="#fff" />
                    <path d="M13 9.5h12c.8 0 1.5.7 1.5 1.5v2c0 .8-.7 1.5-1.5 1.5h-12c-.8 0-1.5-.7-1.5-1.5v-2c0-.8.7-1.5 1.5-1.5z" fill="#00A1DF" />
                    <path d="M14 15h10v1H14z" fill="#00A1DF" />
                  </svg>
                </div>
                <div className="bg-white p-1 rounded shadow-sm">
                  <svg className="h-6 w-10" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                    <rect width="38" height="24" fill="#fff" />
                    <path d="M27.4 7.2c-.5-.6-1.4-.9-2.6-.9h-4.2c-.2 0-.4.1-.5.3l-1.5 9.6c0 .2.1.3.3.3h2c.2 0 .4-.1.5-.3l.4-2.6c0-.2.2-.3.4-.3h1.3c2.1 0 3.7-1 4.2-3.1.2-1.3 0-2.2-.5-3z" fill="#003087" />
                    <path d="M14.8 7.2c-.5-.6-1.4-.9-2.6-.9H8c-.2 0-.4.1-.5.3l-1.5 9.6c0 .2.1.3.3.3h2c.2 0 .4-.1.4-.3l.4-2.6c0-.2.2-.3.4-.3h1.3c2.1 0 3.7-1 4.2-3.1.2-1.3 0-2.2-.5-3z" fill="#0070E0" />
                  </svg>
                </div>
                <div className="bg-white p-1 rounded shadow-sm">
                  <svg className="h-6 w-10" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                    <rect width="38" height="24" fill="#fff" />
                    <path d="M22.3 7.1c-.8 0-1.4.2-1.8.7-.4-.5-1-.7-1.7-.7-1.5 0-2.5 1.2-2.5 2.7v5.1h1.4v-5c0-.8.4-1.4 1.1-1.4s1.1.6 1.1 1.4v5h1.4v-5c0-.8.4-1.4 1.1-1.4s1.1.6 1.1 1.4v5h1.4v-5.1c0-1.5-1-2.7-2.5-2.7z" fill="#5F6368" />
                    <path d="M13.8 7.2l-1.9 5.1-1.9-5.1h-1.5l2.7 7.2h1.5l2.7-7.2z" fill="#5F6368" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 