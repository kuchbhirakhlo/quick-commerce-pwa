"use client"

import { motion } from "framer-motion"

export default function LoadingAnimation() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-4 h-4 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  )
}
