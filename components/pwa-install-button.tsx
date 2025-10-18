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
}

export default function PWAInstallButton({
  variant = "default",
  className = "",
  size = "default",
  label = "Install App"
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Ensure vendor manifest is linked
    const ensureVendorManifest = () => {
      const existingLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
      if (existingLink && !existingLink.href.includes('vendor-manifest.json')) {
        existingLink.href = '/vendor-manifest.json'
      } else if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'manifest'
        link.href = '/vendor-manifest.json'
        document.head.appendChild(link)
      }
    }

    ensureVendorManifest()

    // Check if the app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isVendorPWA = window.location.search.includes('source=pwa') ||
        window.location.search.includes('utm_source=homescreen') ||
        document.referrer.includes('homescreen')

      return isStandalone || isIOSStandalone || isVendorPWA
    }

    if (checkInstalled()) {
      setIsInstalled(true)
      return
    }

    // Store the install prompt for later use
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('Vendor PWA: beforeinstallprompt event received')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('Vendor PWA was installed')
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
      console.error('Vendor PWA: No deferred prompt available')
      return
    }

    try {
      console.log('Vendor PWA: Showing install prompt')

      // Show the install prompt
      deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice
      console.log('Vendor PWA: User choice result:', choiceResult)

      if (choiceResult.outcome === 'accepted') {
        console.log('Vendor PWA: User accepted the install prompt')
      } else {
        console.log('Vendor PWA: User dismissed the install prompt')
      }

      // Clear the deferredPrompt as it can only be used once
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Vendor PWA: Error showing install prompt:', error)
    }
  }

  // Don't show the button if the app is already installed or not installable
  if (isInstalled || !isInstallable) {
    console.log('Vendor PWA: Button hidden - isInstalled:', isInstalled, 'isInstallable:', isInstallable)
    return null
  }

  console.log('Vendor PWA: Install button shown - isInstallable:', isInstallable, 'hasDeferredPrompt:', !!deferredPrompt)

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