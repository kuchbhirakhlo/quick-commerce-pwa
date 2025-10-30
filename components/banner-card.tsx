"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface BannerCardProps {
  id: string
  title: string
  imageUrl: string
  link: string
  position: 'top' | 'middle' | 'bottom' | 'full'
  description?: string
  target?: '_blank' | '_self'
  className?: string
}

export default function BannerCard({ title, imageUrl, link, description, target, className }: Omit<BannerCardProps, 'id' | 'position'>) {
  return (
    <motion.div
      className={cn("rounded-lg overflow-hidden shadow-md", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={link} target={target}>
        <div className="relative aspect-[16/9] md:aspect-[21/7]">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-4">
            <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
            {description && (
              <p className="text-sm md:text-base text-white/90 mt-1">{description}</p>
            )}
            <div className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-3 py-1 rounded-full w-fit text-sm">
              {target === '_blank' ? 'Visit →' : 'Explore →'}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}