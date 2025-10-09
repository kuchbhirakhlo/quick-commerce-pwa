// Register the service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Determine which manifest to use based on the URL path
    let manifestPath = '/manifest.json'; // Default manifest
    
    if (window.location.pathname.startsWith('/admin')) {
      manifestPath = '/admin-manifest.json';
    } else if (window.location.pathname.startsWith('/vendor')) {
      manifestPath = '/vendor-manifest.json';
    }
    
    // Update the manifest link
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.href = manifestPath;
    } else {
      const newManifestLink = document.createElement('link');
      newManifestLink.rel = 'manifest';
      newManifestLink.href = manifestPath;
      document.head.appendChild(newManifestLink);
    }
    
    // Register the appropriate service worker based on path
    let swPath = '/sw.js'; // Default service worker
    if (window.location.pathname.startsWith('/vendor')) {
      swPath = '/vendor-sw.js'; // Vendor-specific service worker
    }

    navigator.serviceWorker.register(swPath)
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Request notification permission if needed
        if ('Notification' in window) {
          Notification.requestPermission().then(permission => {
            console.log('Notification permission:', permission);
          });
        }
      })
      .catch(function(error) {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Function to subscribe to push notifications
function subscribeToPush() {
  if (!('PushManager' in window)) {
    console.log('Push messaging is not supported');
    return;
  }
  
  navigator.serviceWorker.ready.then(registration => {
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
    })
    .then(subscription => {
      console.log('User is subscribed:', subscription);
      // Here you would send the subscription to your server
    })
    .catch(error => {
      console.error('Failed to subscribe the user:', error);
    });
  });
}

// Helper function to convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
} 