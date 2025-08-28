"use client"

import { Suspense } from "react"
import Header from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"
import DynamicCategorySlider from "@/components/dynamic-category-slider"
import CheckPincodeRedirect from "@/components/check-pincode-redirect"
import BannerCardsDisplay from "@/components/banner-cards-display"
import MobileCategoryGrid from "@/components/mobile-category-grid"
import dynamic from "next/dynamic"
import { getButtonClass } from "@/lib/utils"

// Dynamically import the PWA install button with no SSR
const PWAInstallButton = dynamic(() => import("@/components/pwa-install-button"), {
  ssr: false
})

// Define categories to be displayed on the homepage
const featuredCategories = [
  {
    id: "fruits-vegetables",
    name: "Fruits & Vegetables"
  },
  {
    id: "dairy-bread-eggs",
    name: "Dairy, Bread & Eggs"
  },
  {
    id: "grocery",
    name: "Grocery & Staples"
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-2 px-4">
        {/* Check if pincode is serviceable and redirect if not */}
        <CheckPincodeRedirect />
        
        {/* PWA Install Button */}
        <div className="fixed bottom-20 right-4 z-50 md:bottom-8">
          <PWAInstallButton 
            variant="default" 
            className="customer-btn shadow-lg"
            label="Install App" 
          />
        </div>
        
        {/* Top banners */}
        <div className="my-4">
          <Suspense fallback={<BannerSkeleton />}>
            <BannerCardsDisplay position="top" />
          </Suspense>
        </div>

        {/* Mobile Categories Grid */}
        <div className="my-6">
          <Suspense fallback={<CategorySkeleton />}>
            <MobileCategoryGrid />
          </Suspense>
        </div>

        {/* Middle banners - where categories grid used to be */}
        <div className="my-6">
          <Suspense fallback={<BannerSkeleton />}>
            <BannerCardsDisplay position="middle" />
          </Suspense>
        </div>

        {/* Dynamic Category Slider that shows only categories with available products */}
        <div className="my-8">
          <Suspense fallback={<ProductSliderSkeleton />}>
            <DynamicCategorySlider />
          </Suspense>
        </div>
        
        {/* Bottom banners */}
        <div className="my-6">
          <Suspense fallback={<BannerSkeleton />}>
            <BannerCardsDisplay position="bottom" />
          </Suspense>
        </div>
      </div>
    </main>
  )
}

function BannerSkeleton() {
  return <Skeleton className="w-full h-32 md:h-48 rounded-lg" />
}

function CategorySkeleton() {
  return (
    <div className="md:hidden">
      <Skeleton className="h-6 w-40 mb-3" />
      <div className="grid grid-cols-3 gap-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="w-16 h-16 rounded-full mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductSliderSkeleton() {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="w-44 flex-shrink-0">
            <Skeleton className="h-44 w-44 rounded-lg" />
            <Skeleton className="h-4 w-32 mt-2" />
            <Skeleton className="h-4 w-16 mt-1" />
            <div className="flex justify-between mt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        ))}
    </div>
  )
}
