import { useState, useEffect } from 'react';
import { isFirestoreConnected } from '@/lib/firebase/firebase-client';

/**
 * Hook to track Firebase connection status
 * @returns Object containing connection status information
 */
export function useFirebaseConnection() {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const checkConnection = () => {
      const isConnected = isFirestoreConnected();
      
      if (isConnected && isOffline) {
        // We just came back online
        setLastOnlineTime(new Date());
      }
      
      setIsOffline(!isConnected);
    };
    
    // Initial check
    checkConnection();
    
    // Set up listeners for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnlineTime(new Date());
      console.log("Browser went online");
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setConnectionAttempts(prev => prev + 1);
      console.log("Browser went offline");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check connection periodically
    const interval = setInterval(() => {
      checkConnection();
      if (isOffline) {
        setConnectionAttempts(prev => prev + 1);
      }
    }, 10000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOffline]);

  return {
    isOffline,
    isOnline: !isOffline,
    lastOnlineTime,
    connectionAttempts,
    // Helper function to determine if we should show a warning
    shouldShowWarning: isOffline && connectionAttempts > 2
  };
} 