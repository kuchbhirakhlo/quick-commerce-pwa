// Vendor-specific service worker for Quick Commerce Vendor PWA

const CACHE_NAME = 'quick-commerce-vendor-v2';

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

// Background sync for checking new orders
const BACKGROUND_SYNC_TAG = 'vendor-order-check';

// Minimum interval for periodic background sync (in milliseconds)
const MIN_PERIODIC_SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes minimum

// API endpoint for checking new orders (this should be implemented)
const ORDERS_API_ENDPOINT = '/api/vendor/orders/check-new';

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
        icon: data.icon || '/icons/vendor-icon-192x192.gif',
        badge: '/icons/vendor-icon-192x192.gif',
        tag: 'vendor-order',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 200], // Enhanced vibration pattern for lock screen
        silent: false, // Ensure sound plays even on lock screen
        data: {
            url: data.url || '/vendor/orders', // Default to vendor orders
            orderId: data.orderId || null
        },
        // Enhanced notification settings for lock screen visibility
        actions: [
            {
                action: 'view',
                title: 'View Order',
                icon: '/icons/vendor-icon-192x192.gif'
            },
            {
                action: 'accept',
                title: 'Accept Order',
                icon: '/icons/vendor-icon-192x192.gif'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'New Order!', options)
    );
});

// Background sync for checking new orders
self.addEventListener('sync', event => {
    console.log('Vendor SW: Background sync triggered:', event.tag);

    if (event.tag === BACKGROUND_SYNC_TAG) {
        event.waitUntil(checkForNewOrders());
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    console.log('Vendor SW: Periodic sync triggered:', event.tag);

    if (event.tag === BACKGROUND_SYNC_TAG) {
        event.waitUntil(checkForNewOrders());
    }
});

// Function to check for new orders
async function checkForNewOrders() {
    try {
        console.log('Vendor SW: Checking for new orders...');

        // Get all vendor clients
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        if (clients.length === 0) {
            console.log('Vendor SW: No active vendor clients found');
            return;
        }

        // Find authenticated vendor clients
        const vendorClients = clients.filter(client =>
            client.url.includes('/vendor') &&
            !client.url.includes('/vendor/login')
        );

        if (vendorClients.length === 0) {
            console.log('Vendor SW: No authenticated vendor clients found');
            return;
        }

        // Get the first vendor client to extract vendor info
        const vendorClient = vendorClients[0];

        // In a real implementation, you would need to pass vendor authentication
        // For now, we'll use a simple approach
        const response = await fetch(ORDERS_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: Date.now(),
                source: 'background-sync'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Vendor SW: Order check response:', data);

            if (data.hasNewOrders && data.orders && data.orders.length > 0) {
                console.log('Vendor SW: New orders found:', data.orders.length);

                // Show notification for new orders
                await showNewOrdersNotification(data.orders);
            }
        } else {
            console.error('Vendor SW: Failed to check for new orders:', response.status);
        }
    } catch (error) {
        console.error('Vendor SW: Error checking for new orders:', error);
    }
}

// Function to show new orders notification
async function showNewOrdersNotification(orders) {
    try {
        const newOrdersCount = orders.length;
        const firstOrder = orders[0];

        const options = {
            body: `You have ${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''} waiting for confirmation`,
            icon: '/icons/vendor-icon-192x192.gif',
            badge: '/icons/vendor-icon-192x192.gif',
            tag: 'vendor-new-orders',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            data: {
                url: '/vendor/orders',
                orderCount: newOrdersCount,
                orders: orders
            },
            actions: [
                {
                    action: 'view',
                    title: 'View Orders',
                    icon: '/icons/vendor-icon-192x192.gif'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };

        await self.registration.showNotification(
            `New Order${newOrdersCount > 1 ? 's' : ''}!`,
            options
        );

        // Play notification sound if supported
        try {
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'PLAY_NOTIFICATION_SOUND',
                    sound: 'new-order'
                });
            });
        } catch (soundError) {
            console.error('Vendor SW: Error playing notification sound:', soundError);
        }
    } catch (error) {
        console.error('Vendor SW: Error showing new orders notification:', error);
    }
}

// Notification click event - ensure it opens within vendor scope
self.addEventListener('notificationclick', event => {
    console.log('Vendor SW: Notification clicked, action:', event.action);
    event.notification.close();

    const notificationUrl = event.notification.data.url || '/vendor/orders';
    const action = event.action;

    // Handle notification actions
    if (action === 'dismiss') {
        console.log('Vendor SW: Notification dismissed');
        return;
    }

    if (action === 'accept') {
        console.log('Vendor SW: Order accept action clicked');
        // Handle order acceptance - could trigger API call
        // For now, just open the orders page
    }

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