"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserNotifications } from '@/lib/hooks/use-user-notifications';
import { Bell, Volume2, VolumeX, ShoppingBag, Gift } from 'lucide-react';

export default function UserNotificationDemo() {
    const [notificationCount, setNotificationCount] = useState(0);
    const {
        permission,
        isSupported,
        isEnabled,
        showNotification,
        showOrderUpdate,
        showPromotion,
        requestPermission,
        toggleSound,
        isSoundEnabled,
    } = useUserNotifications();

    const handleOrderNotification = async () => {
        const orderId = `ORD-${Date.now()}`;
        const orderNumber = orderId.slice(-8).toUpperCase();

        await showOrderUpdate(
            orderId,
            orderNumber,
            'Confirmed - Preparing your order'
        );

        setNotificationCount(prev => prev + 1);
    };

    const handlePromotionNotification = async () => {
        await showPromotion(
            '🎉 Special Offer!',
            'Get 20% off on your next order. Limited time offer!',
            { offerId: 'PROMO-20-OFF', url: '/menu?promo=20off' }
        );

        setNotificationCount(prev => prev + 1);
    };

    const handleGeneralNotification = async () => {
        await showNotification(
            'Welcome to Buzzat!',
            'Thank you for using our app. Enjoy your shopping experience!',
            { url: '/menu', type: 'welcome' }
        );

        setNotificationCount(prev => prev + 1);
    };

    if (!isSupported) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications Not Supported
                    </CardTitle>
                    <CardDescription>
                        Your browser doesn't support notifications.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    User Notifications Demo
                </CardTitle>
                <CardDescription>
                    Test notification functionality for the user app
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Permission Status */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Permission Status:</span>
                    <Badge variant={
                        permission === 'granted' ? 'default' :
                            permission === 'denied' ? 'destructive' : 'secondary'
                    }>
                        {permission}
                    </Badge>
                </div>

                {/* Sound Toggle */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sound:</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSound()}
                        className="flex items-center gap-2"
                    >
                        {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        {isSoundEnabled ? 'On' : 'Off'}
                    </Button>
                </div>

                {/* Notification Buttons */}
                <div className="space-y-2">
                    <Button
                        onClick={handleOrderNotification}
                        className="w-full flex items-center gap-2"
                        disabled={!isEnabled}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Order Update Notification
                    </Button>

                    <Button
                        onClick={handlePromotionNotification}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                        disabled={!isEnabled}
                    >
                        <Gift className="h-4 w-4" />
                        Promotion Notification
                    </Button>

                    <Button
                        onClick={handleGeneralNotification}
                        variant="outline"
                        className="w-full"
                        disabled={!isEnabled}
                    >
                        General Notification
                    </Button>
                </div>

                {/* Request Permission Button */}
                {permission !== 'granted' && (
                    <Button
                        onClick={requestPermission}
                        className="w-full"
                        variant="outline"
                    >
                        Request Notification Permission
                    </Button>
                )}

                {/* Notification Count */}
                {notificationCount > 0 && (
                    <div className="text-center text-sm text-gray-600">
                        Notifications sent: {notificationCount}
                    </div>
                )}

                {/* Status Info */}
                <div className="text-xs text-gray-500 space-y-1">
                    <div>Status: {isEnabled ? '🟢 Enabled' : '🔴 Disabled'}</div>
                    <div>Sound: {isSoundEnabled ? '🔊 On' : '🔇 Off'}</div>
                    <div>Permission: {permission}</div>
                </div>
            </CardContent>
        </Card>
    );
}