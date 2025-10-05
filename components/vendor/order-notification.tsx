"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Volume2, VolumeX, Smartphone } from 'lucide-react'
import { notificationService } from '@/lib/firebase/notification-service'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'

interface OrderNotificationProps {
  newOrdersCount: number
  onClick?: () => void
}

export default function OrderNotification({ newOrdersCount, onClick }: OrderNotificationProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const isMobile = useIsMobile()

  // Initialize notification state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check notification permission
      if ('Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted')
      }

      // Get sound preference
      setSoundEnabled(notificationService.isSoundEnabled())
    }
  }, [])

  // Request notification permission
  const requestPermission = async () => {
    const granted = await notificationService.requestPermission()
    setNotificationsEnabled(granted)
  }

  // Toggle sound
  const toggleSound = () => {
    const enabled = notificationService.toggleSound()
    setSoundEnabled(enabled)
  }

  // Test notification with mobile enhancements
  const testNotification = () => {
    notificationService.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification for new orders.',
    })
  }

  return (
    <div className={`flex items-center gap-2 ${isMobile ? 'gap-1' : 'gap-2'}`}>
      {newOrdersCount > 0 && (
        <Button
          variant="outline"
          className={`flex items-center relative animate-pulse ${isMobile
            ? 'gap-1 px-2 py-1 h-8 text-xs'
            : 'gap-2 px-3 py-2'
            }`}
          onClick={onClick}
        >
          <Bell className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-orange-500`} />
          <span className={isMobile ? 'text-xs font-medium' : ''}>
            {newOrdersCount} New
          </span>
          <Badge
            variant="destructive"
            className={`absolute ${isMobile ? '-top-1 -right-1 h-4 min-w-4 text-xs' : '-top-2 -right-2 h-5 min-w-5'
              } flex items-center justify-center`}
          >
            {newOrdersCount}
          </Badge>
        </Button>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={toggleSound}
              className={`${isMobile ? 'h-8 px-2' : 'h-8 w-8'}`}
            >
              {soundEnabled ? (
                <Volume2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              ) : (
                <VolumeX className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              )}
              {isMobile && (
                <span className="ml-1 text-xs">
                  {soundEnabled ? 'On' : 'Off'}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {soundEnabled ? 'Disable notification sound' : 'Enable notification sound'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={notificationsEnabled ? testNotification : requestPermission}
              className={`${isMobile ? 'h-8 px-2' : 'h-8 w-8'}`}
            >
              {notificationsEnabled ? (
                <Bell className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              ) : (
                <BellOff className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              )}
              {isMobile && (
                <span className="ml-1 text-xs">
                  {notificationsEnabled ? 'Test' : 'Enable'}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {notificationsEnabled
              ? 'Test notification'
              : 'Enable browser notifications'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Mobile vibration indicator */}
      {isMobile && notificationsEnabled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Smartphone className="h-3 w-3 text-green-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Mobile vibration enabled
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

