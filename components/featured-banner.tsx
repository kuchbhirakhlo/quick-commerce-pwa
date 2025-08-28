"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

export default function FeaturedBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  const buttonVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5 },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.95 },
  }

  const badgeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15,
        delay: 0.5,
      },
    },
  }

  return (
    <motion.div
      className="w-full rounded-lg overflow-hidden relative"
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
    >
      <Link href="/category/fruits-vegetables">
        <div className="relative aspect-[21/9] md:aspect-[21/6]">
          <Image
            src="https://images.unsplash.com/photo-1521566652839-697aa473761a?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Fresh Fruits & Vegetables"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center p-8">

            <motion.h1 className="text-xl md:text-5xl font-bold text-white mb-4" variants={itemVariants}>
              Grocery & vegetables
            </motion.h1>

            <motion.button
              className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-6 py-2 rounded-full w-fit"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Order now →
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
