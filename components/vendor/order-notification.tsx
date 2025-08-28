"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
import { notificationService } from '@/lib/firebase/notification-service'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface OrderNotificationProps {
  newOrdersCount: number
  onClick?: () => void
}

export default function OrderNotification({ newOrdersCount, onClick }: OrderNotificationProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  
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
  
  // Test notification
  const testNotification = () => {
    notificationService.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification for new orders.',
    })
  }
  
  return (
    <div className="flex items-center gap-2">
      {newOrdersCount > 0 && (
        <Button 
          variant="outline" 
          className="flex items-center gap-2 relative animate-pulse"
          onClick={onClick}
        >
          <Bell className="h-4 w-4 text-orange-500" />
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center">
            {newOrdersCount}
          </Badge>
        </Button>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="h-8 w-8"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
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
              size="icon"
              onClick={notificationsEnabled ? testNotification : requestPermission}
              className="h-8 w-8"
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
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
    </div>
  )
} 