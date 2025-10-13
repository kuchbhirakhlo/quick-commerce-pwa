import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAdminMessaging } from '@/lib/firebase/admin';

interface OrderNotificationRequest {
    orderId: string;
    vendorId: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: OrderNotificationRequest = await request.json();
        const { orderId, vendorId, orderNumber, customerName, totalAmount } = body;

        // Validate required fields
        if (!orderId || !vendorId || !orderNumber) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, vendorId, orderNumber' },
                { status: 400 }
            );
        }

        // Initialize Firebase Admin messaging
        const messaging = await getAdminMessaging();
        if (!messaging) {
            return NextResponse.json(
                { error: 'Failed to initialize Firebase Admin messaging' },
                { status: 500 }
            );
        }

        // Get vendor's FCM tokens
        const tokensRef = collection(db!, 'vendor_tokens');
        const q = query(tokensRef, where('vendorId', '==', vendorId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`No FCM tokens found for vendor ${vendorId}`);
            return NextResponse.json(
                { message: 'No registered devices for vendor' },
                { status: 200 }
            );
        }

        const tokens: string[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken) {
                tokens.push(data.fcmToken);
            }
        });

        if (tokens.length === 0) {
            console.log(`No valid FCM tokens found for vendor ${vendorId}`);
            return NextResponse.json(
                { message: 'No valid FCM tokens for vendor' },
                { status: 200 }
            );
        }

        // Prepare notification payload
        const notificationPayload = {
            title: 'New Order Received! 🎉',
            body: `Order #${orderNumber} from ${customerName} - ₹${totalAmount.toFixed(2)}`,
            icon: '/icons/vendor-icon-192x192.png',
            badge: '/icons/vendor-icon-72x72.png',
            tag: `new-order-${orderId}`,
            data: {
                orderId,
                orderNumber,
                vendorId,
                type: 'new_order',
                url: `/vendor/orders/${orderId}`,
                click_action: `/vendor/orders/${orderId}`
            },
            web_push: {
                fcm_options: {
                    link: `/vendor/orders/${orderId}`
                }
            }
        };
        const message = {
            notification: notificationPayload,
            data: notificationPayload.data,
            webpush: notificationPayload.web_push,
            tokens: tokens
        };

        const response = await messaging.sendEachForMulticast(message);

        console.log(`Notification sent to vendor ${vendorId}:`, {
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses
        });

        // Handle failed tokens (remove invalid ones)
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp: any, idx: number) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });

            if (failedTokens.length > 0) {
                console.log('Removing invalid tokens:', failedTokens);
                // TODO: Remove invalid tokens from database
            }
        }

        return NextResponse.json({
            success: true,
            message: `Notification sent to ${response.successCount} devices`,
            successCount: response.successCount,
            failureCount: response.failureCount
        });

    } catch (error) {
        console.error('Error sending vendor notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
}