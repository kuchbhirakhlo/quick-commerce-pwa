// Custom type declarations for vendor-specific window properties

declare global {
  interface Window {
    vendorNotificationPermission?: 'granted' | 'denied';
    vendorNotificationAudio?: HTMLAudioElement;
    vendorNotificationAudioBackup?: HTMLAudioElement;
    vendorNotificationService?: any;
  }
}

export { };