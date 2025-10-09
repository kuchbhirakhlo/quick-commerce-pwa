"use client"

import { initMessaging, requestNotificationPermission } from './messaging';

// Notification sound file
const NOTIFICATION_SOUND_URL = '/sounds/new-order.wav';

// Notification contexts
export type NotificationContext = 'user' | 'vendor' | 'admin';

// Interface for notification options
interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  context?: NotificationContext;
}

/**
 * Universal Notification Service for user and vendor notifications
 */
export class NotificationService {
  private static instance: NotificationService;
  private notificationPermission: NotificationPermission = 'default';
  private soundEnabled: boolean = true;
  private audio: HTMLAudioElement | null = null;
  private currentContext: NotificationContext = 'user';

  private constructor() {
    if (typeof window !== 'undefined') {
      // Initialize audio element
      this.audio = new Audio(NOTIFICATION_SOUND_URL);

      // Set maximum volume for louder notifications
      if (this.audio) {
        this.audio.volume = 1.0; // Maximum volume for all notifications
      }

      // Check notification permission
      if ('Notification' in window) {
        this.notificationPermission = Notification.permission;
      }

      // Load sound preference from localStorage (check both user and vendor prefs)
      this.loadSoundPreferences();
    }
  }

  /**
   * Load sound preferences for current context
   */
  private loadSoundPreferences(): void {
    if (typeof window === 'undefined') return;

    // Check for both user and vendor preferences
    const userSoundPref = localStorage.getItem('notification_sound');
    const vendorSoundPref = localStorage.getItem('vendor_notification_sound');

    // Use appropriate preference based on current context
    const soundPref = this.currentContext === 'vendor' ? vendorSoundPref : userSoundPref;

    if (soundPref !== null) {
      this.soundEnabled = soundPref === 'true';
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Set notification context (user, vendor, admin)
   */
  public setContext(context: NotificationContext): void {
    this.currentContext = context;
    this.loadSoundPreferences(); // Reload preferences for new context
  }

  /**
   * Get current notification context
   */
  public getContext(): NotificationContext {
    return this.currentContext;
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const result = await requestNotificationPermission();
      this.notificationPermission = Notification.permission;
      return result.success;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  public areNotificationsEnabled(): boolean {
    return this.notificationPermission === 'granted';
  }

  /**
   * Toggle notification sound
   */
  public toggleSound(enabled?: boolean): boolean {
    if (typeof enabled === 'boolean') {
      this.soundEnabled = enabled;
    } else {
      this.soundEnabled = !this.soundEnabled;
    }

    // Save preference based on current context
    if (typeof window !== 'undefined') {
      const storageKey = this.currentContext === 'vendor'
        ? 'vendor_notification_sound'
        : 'notification_sound';
      localStorage.setItem(storageKey, this.soundEnabled.toString());
    }

    return this.soundEnabled;
  }

  /**
   * Toggle sound for specific context
   */
  public toggleSoundForContext(context: NotificationContext, enabled?: boolean): boolean {
    const previousContext = this.currentContext;
    this.setContext(context);

    if (typeof enabled === 'boolean') {
      this.soundEnabled = enabled;
    } else {
      this.soundEnabled = !this.soundEnabled;
    }

    // Save preference for this context
    if (typeof window !== 'undefined') {
      const storageKey = context === 'vendor'
        ? 'vendor_notification_sound'
        : 'notification_sound';
      localStorage.setItem(storageKey, this.soundEnabled.toString());
    }

    // Restore previous context
    this.setContext(previousContext);
    return this.soundEnabled;
  }

  /**
   * Check if sound is enabled
   */
  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Play notification sound
   */
  public playSound(): void {
    if (!this.soundEnabled || !this.audio) return;

    // Ensure maximum volume before playing
    this.audio.volume = 1.0;

    // Reset and play
    this.audio.currentTime = 0;

    // Enhanced mobile audio handling
    this.audio.play().catch(err => {
      console.error('Error playing notification sound:', err);

      // Try alternative approach for mobile devices
      if (this.isMobileDevice()) {
        this.playSoundMobile();
      }
    });
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth <= 768 && window.innerHeight <= 1024);
  }

  /**
   * Play sound specifically for mobile devices
   */
  private playSoundMobile(): void {
    if (!this.audio) return;

    // Create a new audio instance for mobile
    const mobileAudio = new Audio(NOTIFICATION_SOUND_URL);
    mobileAudio.volume = 1.0; // Maximum volume for mobile notifications

    // Use play promise for better mobile handling
    const playPromise = mobileAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Mobile notification sound played successfully');
      }).catch(error => {
        console.error('Mobile notification sound failed:', error);
        // Try system beep as fallback
        this.systemBeep();
      });
    }
  }

  /**
   * System beep as ultimate fallback
   */
  private systemBeep(): void {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('System beep failed:', error);
    }
  }

  /**
   * Play order notification sound
   * Used specifically for new orders in the dashboard
   */
  public playOrderSound(): void {
    // Only play sound if we're allowed to show notifications
    if (this.notificationPermission === 'granted') {
      this.playSound();
    }
  }

  /**
   * Show a notification
   */
  public async showNotification(options: NotificationOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    // Check permission
    if (this.notificationPermission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    try {
      // Determine icons based on context
      const context = options.context || this.currentContext;
      const defaultIcon = context === 'vendor'
        ? '/icons/vendor-icon-192x192.png'
        : '/icons/icon-192x192.png';
      const defaultBadge = context === 'vendor'
        ? '/icons/vendor-icon-72x72.png'
        : '/icons/icon-72x72.png';
      const defaultTag = `${context}-notification`;

      // Show notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || defaultIcon,
        badge: options.badge || defaultBadge,
        tag: options.tag || defaultTag,
        data: options.data || {},
        requireInteraction: options.requireInteraction ?? true,
        silent: options.silent ?? false
      });

      // Play sound and vibration for mobile (only if not silent)
      if (this.soundEnabled && !options.silent) {
        this.playSound();

        // Add vibration for mobile devices
        if (this.isMobileDevice()) {
          this.triggerVibration();
        }
      }

      // Handle notification click
      notification.onclick = () => {
        if (options.data?.url) {
          window.focus();
          window.location.href = options.data.url;
        } else {
          window.focus();
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  /**
   * Trigger vibration for mobile devices
   */
  private triggerVibration(): void {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        // Custom vibration pattern: pause-vibrate-pause-vibrate-pause
        const vibrationPattern = [200, 100, 200, 100, 200];

        // Use vibration API
        navigator.vibrate(vibrationPattern);

        // Also try to trigger haptic feedback if available
        if ('hapticFeedback' in navigator) {
          (navigator as any).hapticFeedback.impact({ style: 'medium' }).catch(() => {
            // Fallback to basic vibration if haptic feedback fails
            console.log('Haptic feedback not available, using basic vibration');
          });
        }
      } catch (error) {
        console.error('Error triggering vibration:', error);
      }
    }
  }

  /**
   * Show a new order notification for vendors
   */
  public showNewOrderNotification(orderId: string, orderNumber: string): Promise<boolean> {
    return this.showNotification({
      title: 'New Order Received!',
      body: `Order #${orderNumber} is waiting for your confirmation.`,
      data: {
        url: `/vendor/orders/${orderId}`,
        orderId
      },
      requireInteraction: true,
      context: 'vendor'
    });
  }

  /**
   * Show a new order notification for users
   */
  public showUserOrderNotification(orderId: string, orderNumber: string, status: string): Promise<boolean> {
    return this.showNotification({
      title: 'Order Update!',
      body: `Your order #${orderNumber} status: ${status}`,
      data: {
        url: `/account/orders/${orderId}`,
        orderId
      },
      requireInteraction: true,
      context: 'user'
    });
  }

  /**
   * Show a general notification for users
   */
  public showUserNotification(title: string, body: string, data?: any): Promise<boolean> {
    return this.showNotification({
      title,
      body,
      data: data || {},
      requireInteraction: false,
      context: 'user'
    });
  }

  /**
   * Show a general notification for vendors
   */
  public showVendorNotification(title: string, body: string, data?: any): Promise<boolean> {
    return this.showNotification({
      title,
      body,
      data: data || {},
      requireInteraction: false,
      context: 'vendor'
    });
  }

  /**
   * Show notification with context switching
   */
  public async showNotificationWithContext(
    title: string,
    body: string,
    context: NotificationContext,
    data?: any,
    requireInteraction: boolean = false
  ): Promise<boolean> {
    const previousContext = this.currentContext;
    this.setContext(context);

    const result = await this.showNotification({
      title,
      body,
      data: data || {},
      requireInteraction,
      context
    });

    // Restore previous context
    this.setContext(previousContext);
    return result;
  }
}

// Export singleton instance (defaults to user context)
export const notificationService = NotificationService.getInstance();

// Export vendor-specific instance
export const vendorNotificationService = (() => {
  const service = NotificationService.getInstance();
  service.setContext('vendor');
  return service;
})();

// Export user-specific instance
export const userNotificationService = (() => {
  const service = NotificationService.getInstance();
  service.setContext('user');
  return service;
})();