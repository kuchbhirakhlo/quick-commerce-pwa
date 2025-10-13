import { NextRequest, NextResponse } from 'next/server';
import { generatePaytmChecksum, generateOrderId, generateTransactionToken } from '@/lib/paytm/utils';
import { PAYTM_CONFIG, PAYTM_URLS } from '@/lib/paytm/config';

// Extend global object for in-memory storage
declare global {
    var paytmOrders: Map<string, any> | undefined;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, customerId, userEmail, userPhone, orderData } = body;

        // Validate required fields
        if (!amount || !customerId) {
            return NextResponse.json(
                { success: false, error: 'Amount and customer ID are required' },
                { status: 400 }
            );
        }

        // Generate unique order ID
        const orderId = generateOrderId();

        // Prepare Paytm parameters
        const paytmParams = {
            MID: PAYTM_CONFIG.MID,
            WEBSITE: PAYTM_CONFIG.WEBSITE,
            INDUSTRY_TYPE_ID: 'Retail',
            CHANNEL_ID: PAYTM_CONFIG.WEBSITE,
            ORDER_ID: orderId,
            CUST_ID: customerId,
            MOBILE_NO: userPhone || '',
            EMAIL: userEmail || '',
            TXN_AMOUNT: amount.toFixed(2),
            CALLBACK_URL: PAYTM_CONFIG.CALLBACK_URL,
        };

        // Generate checksum
        const checksum = generatePaytmChecksum(paytmParams);

        // Prepare final parameters with checksum
        const finalParams = {
            ...paytmParams,
            CHECKSUMHASH: checksum,
        };

        // Make request to Paytm
        const response = await fetch(PAYTM_URLS.INITIATE_TRANSACTION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalParams),
        });

        const paytmResponse = await response.json();

        if (paytmResponse.HEAD && paytmResponse.HEAD.responseCode === 'OK') {
            // Store order data temporarily for callback processing
            const orderInfo = {
                orderId,
                amount,
                customerId,
                orderData,
                createdAt: new Date().toISOString(),
            };

            // In production, store this in database
            // For now, using in-memory storage (will be lost on restart)
            if (!global.paytmOrders) {
                global.paytmOrders = new Map();
            }
            global.paytmOrders.set(orderId, orderInfo);

            return NextResponse.json({
                success: true,
                orderId,
                txnToken: paytmResponse.BODY.txnToken,
                amount,
                paytmParams: finalParams,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: paytmResponse.HEAD?.responseMessage || 'Failed to initiate payment'
                },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Paytm initiate error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}