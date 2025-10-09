// Vendor-specific service worker for Quick Commerce Vendor PWA

const CACHE_NAME = 'quick-commerce-vendor-v1';

// Vendor-specific URLs to cache
const urlsToCache = [
    '/vendor',
    '/vendor/',
    '/vendor/login',
    '/vendor/orders',
    '/vendor/products',
    '/vendor/dashboard',
    '/vendor/settings',
    '/vendor-manifest.json',
    '/icons/vendor-icon-192x192.png',
    '/icons/vendor-icon-512x512.png',
    '/sounds/new-order.wav'
];

// Install event - cache the essential vendor files
self.addEventListener('install', event => {
    console.log('Vendor SW: Installing vendor service worker');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Vendor SW: Cache opened');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Vendor SW: Cache failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Vendor SW: Activating vendor service worker');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Vendor SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
    // Only handle vendor scope requests
    if (!event.request.url.includes('/vendor')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Add to cache for vendor scope only
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Avoid caching POST requests, etc.
                                if (event.request.method === 'GET' && event.request.url.includes('/vendor')) {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return response;
                    }
                );
            })
    );
});

// Push notification event for vendor
self.addEventListener('push', event => {
    console.log('Vendor SW: Push notification received');
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        console.error('Vendor SW: Error parsing push data:', e);
        return;
    }

    const options = {
        body: data.body || 'New order received',
        icon: data.icon || '/icons/vendor-icon-192x192.png',
        badge: '/icons/vendor-icon-192x192.png',
        tag: 'vendor-order',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200], // Strong vibration pattern
        data: {
            url: data.url || '/vendor/orders', // Default to vendor orders
            orderId: data.orderId || null
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'New Order!', options)
    );
});

// Notification click event - ensure it opens within vendor scope
self.addEventListener('notificationclick', event => {
    console.log('Vendor SW: Notification clicked');
    event.notification.close();

    const notificationUrl = event.notification.data.url || '/vendor/orders';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Check if vendor window is already open
                for (let client of clientList) {
                    if (client.url.includes('/vendor') && 'focus' in client) {
                        // Focus existing vendor window and navigate if needed
                        client.focus();
                        if (!client.url.includes(notificationUrl)) {
                            client.navigate(notificationUrl);
                        }
                        return;
                    }
                }

                // Open new vendor window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(notificationUrl);
                }
            })
            .catch(error => {
                console.error('Vendor SW: Error handling notification click:', error);
                // Fallback to opening vendor orders
                if (clients.openWindow) {
                    clients.openWindow('/vendor/orders');
                }
            })
    );
});