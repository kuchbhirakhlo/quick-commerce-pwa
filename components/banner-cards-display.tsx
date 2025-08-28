"use client"

import { useEffect, useState } from "react"
import BannerCard, { BannerCardProps } from "./banner-card"
import { Skeleton } from "@/components/ui/skeleton"

interface BannerCardsDisplayProps {
  position?: 'top' | 'middle' | 'bottom'
}

export default function BannerCardsDisplay({ position }: BannerCardsDisplayProps) {
  const [bannerCards, setBannerCards] = useState<BannerCardProps[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBannerCards() {
      try {
        const response = await fetch('/api/banner-cards')
        if (!response.ok) throw new Error('Failed to fetch banner cards')
        const data = await response.json()
        setBannerCards(data)
      } catch (error) {
        console.error('Error fetching banner cards:', error)
        // Use fallback data if API fails
        setBannerCards([
          {
            id: '1',
            title: 'Fresh Fruits & Vegetables',
            imageUrl: 'https://images.unsplash.com/photo-1521566652839-697aa473761a',
            link: '/category/fruits-vegetables',
            position: 'top'
          },
          {
            id: '2',
            title: 'Dairy Products',
            imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da',
            link: '/category/dairy-bread-eggs',
            position: 'middle'
          },
          {
            id: '3',
            title: 'Grocery & Staples',
            imageUrl: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818',
            link: '/category/grocery',
            position: 'bottom'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchBannerCards()
  }, [])

  if (loading) {
    return <BannerSkeleton position={position} />
  }

  // Filter banners by position
  const filteredBanners = position 
    ? bannerCards.filter(card => card.position === position)
    : bannerCards;

  if (filteredBanners.length === 0) {
    return null;
  }

  return (
    <div className="my-4">
      {/* For top position - show all banners in desktop, single banner in mobile */}
      {position === 'top' && (
        <>
          {/* Desktop view - show all banners in a row */}
          <div className="hidden md:flex gap-4">
            {bannerCards.map(card => (
              <BannerCard 
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                link={card.link}
                className="flex-1"
              />
            ))}
          </div>
          
          {/* Mobile view - show only top banner */}
          <div className="md:hidden">
            {filteredBanners.map(card => (
              <BannerCard 
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                link={card.link}
              />
            ))}
          </div>
        </>
      )}
      
      {/* For middle position - visible only on mobile */}
      {position === 'middle' && (
        <div className="md:hidden w-full">
          {filteredBanners.map(card => (
            <BannerCard 
              key={card.id}
              title={card.title}
              imageUrl={card.imageUrl}
              link={card.link}
            />
          ))}
        </div>
      )}
      
      {/* For bottom position - visible on both mobile and desktop */}
      {position === 'bottom' && (
        <div className="w-full">
          {filteredBanners.map(card => (
            <BannerCard 
              key={card.id}
              title={card.title}
              imageUrl={card.imageUrl}
              link={card.link}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BannerSkeleton({ position }: { position?: string }) {
  if (position === 'top') {
    return (
      <>
        {/* Desktop skeleton - all banners in a row */}
        <div className="hidden md:flex gap-4 my-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[21/9] rounded-lg" />
          ))}
        </div>

        {/* Mobile skeleton - only top banner */}
        <div className="md:hidden my-4">
          <Skeleton className="w-full aspect-[16/9] rounded-lg" />
        </div>
      </>
    )
  }
  
  // Middle skeleton - visible only on mobile
  if (position === 'middle') {
    return (
      <div className="md:hidden my-4">
        <Skeleton className="w-full aspect-[16/9] rounded-lg" />
      </div>
    )
  }
  
  // Bottom skeleton - visible on both mobile and desktop
  return (
    <div className="my-4">
      <Skeleton className="w-full aspect-[16/9] rounded-lg" />
    </div>
  )
} 