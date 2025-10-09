"use client"

import { useEffect, useState } from 'react';
import { userNotificationService } from '@/lib/firebase/notification-service';
import { useToast } from '@/components/ui/use-toast';

interface UseUserNotificationsOptions {
    enabled?: boolean;
    showToasts?: boolean;
}

export function useUserNotifications(options: UseUserNotificationsOptions = {}) {
    const { enabled = true, showToasts = true } = options;
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined' && enabled) {
            // Check current permission status
            setPermission(Notification.permission);

            // Request permission if not already granted or denied
            if (Notification.permission === 'default') {
                userNotificationService.requestPermission().then(granted => {
                    setPermission(granted ? 'granted' : 'denied');
                });
            }
        }
    }, [enabled]);

    const showNotification = async (
        title: string,
        body: string,
        data?: any
    ): Promise<boolean> => {
        if (!enabled) return false;

        try {
            const result = await userNotificationService.showUserNotification(title, body, data);

            if (showToasts && result) {
                toast({
                    title,
                    description: body,
                    duration: 5000,
                });
            }

            return result;
        } catch (error) {
            console.error('Error showing user notification:', error);
            return false;
        }
    };

    const showOrderUpdate = async (
        orderId: string,
        orderNumber: string,
        status: string
    ): Promise<boolean> => {
        return showNotification(
            'Order Update!',
            `Your order #${orderNumber} status: ${status}`,
            { url: `/account/orders/${orderId}`, orderId }
        );
    };

    const showPromotion = async (
        title: string,
        message: string,
        data?: any
    ): Promise<boolean> => {
        return showNotification(
            title,
            message,
            { ...data, type: 'promotion' }
        );
    };

    return {
        permission,
        isSupported: typeof window !== 'undefined' && 'Notification' in window,
        isEnabled: permission === 'granted' && enabled,
        showNotification,
        showOrderUpdate,
        showPromotion,
        requestPermission: () => userNotificationService.requestPermission(),
        toggleSound: (enabled?: boolean) => userNotificationService.toggleSound(enabled),
        isSoundEnabled: userNotificationService.isSoundEnabled(),
    };
}