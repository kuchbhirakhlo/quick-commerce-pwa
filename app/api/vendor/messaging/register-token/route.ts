import { NextRequest, NextResponse } from 'next/server';

// API endpoint for registering vendor FCM tokens
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, vendorId, platform } = body;

        console.log('Vendor FCM token registration:', { vendorId, platform, token: token?.substring(0, 50) + '...' });

        // In a real implementation, you would:
        // 1. Validate the vendor authentication
        // 2. Store the FCM token in your database
        // 3. Associate it with the vendor ID
        // 4. Use it for sending targeted notifications

        // For now, we'll just log it and return success
        if (!token || !vendorId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Token and vendorId are required'
                },
                { status: 400 }
            );
        }

        // Mock database storage
        console.log('Storing vendor FCM token:', {
            vendorId,
            token: token.substring(0, 50) + '...',
            platform,
            registeredAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: 'Vendor FCM token registered successfully',
            vendorId,
            platform
        });

    } catch (error) {
        console.error('Error registering vendor FCM token:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to register FCM token'
            },
            { status: 500 }
        );
    }
}