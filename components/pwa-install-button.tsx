"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
}

declare global {
  interface Navigator {
    standalone?: boolean
  }
}

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  label?: string
  type?: "customer" | "vendor" | "admin"
}

export default function PWAInstallButton({
  variant = "default",
  className = "",
  size = "default",
  label = "Install App",
  type = "customer"
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Ensure correct manifest is linked based on type
    const ensureManifest = () => {
      const manifestPaths = {
        customer: '/manifest.json',
        vendor: '/vendor-manifest.json',
        admin: '/admin-manifest.json'
      }

      const manifestPath = manifestPaths[type]
      const existingLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement

      if (existingLink && existingLink.href !== manifestPath) {
        existingLink.href = manifestPath
      } else if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'manifest'
        link.href = manifestPath
        document.head.appendChild(link)
      }
    }

    ensureManifest()

    // Check if the app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isPWA = window.location.search.includes('source=pwa') ||
        window.location.search.includes('utm_source=homescreen') ||
        document.referrer.includes('homescreen')

      return isStandalone || isIOSStandalone || isPWA
    }

    if (checkInstalled()) {
      setIsInstalled(true)
      return
    }

    // Store the install prompt for later use
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log(`${type} PWA: beforeinstallprompt event received`)
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log(`${type} PWA was installed`)
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    // Check again after a short delay to catch any missed events
    const checkAgain = setTimeout(() => {
      if (checkInstalled()) {
        setIsInstalled(true)
      }
    }, 1000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(checkAgain)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.error(`${type} PWA: No deferred prompt available`)
      return
    }

    try {
      console.log(`${type} PWA: Showing install prompt`)

      // Show the install prompt
      deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice
      console.log(`${type} PWA: User choice result:`, choiceResult)

      if (choiceResult.outcome === 'accepted') {
        console.log(`${type} PWA: User accepted the install prompt`)
      } else {
        console.log(`${type} PWA: User dismissed the install prompt`)
      }

      // Clear the deferredPrompt as it can only be used once
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error(`${type} PWA: Error showing install prompt:`, error)
    }
  }

  // Don't show the button if the app is already installed or not installable
  if (isInstalled || !isInstallable) {
    console.log(`${type} PWA: Button hidden - isInstalled:`, isInstalled, 'isInstallable:', isInstallable)
    return null
  }

  console.log(`${type} PWA: Install button shown - isInstallable:`, isInstallable, 'hasDeferredPrompt:', !!deferredPrompt)

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleInstallClick}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
} 