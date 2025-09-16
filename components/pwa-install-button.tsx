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
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) {
      setIsInstalled(true)
      return
    }

    // Store the install prompt for later use
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      console.log('PWA was installed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt as it can only be used once
    setDeferredPrompt(null)
  }

  // Don't show the button if the app is already installed or not installable
  if (isInstalled || !isInstallable) return null

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