import { NextRequest, NextResponse } from 'next/server';
import { generatePaytmChecksum } from '@/lib/paytm/utils';
import { PAYTM_CONFIG, PAYTM_URLS } from '@/lib/paytm/config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Prepare status check parameters
        const statusParams = {
            MID: PAYTM_CONFIG.MID,
            ORDERID: orderId,
        };

        // Generate checksum for status check
        const checksum = generatePaytmChecksum(statusParams);

        // Make request to Paytm for status
        const response = await fetch(PAYTM_URLS.TRANSACTION_STATUS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...statusParams,
                CHECKSUMHASH: checksum,
            }),
        });

        const statusResponse = await response.json();

        if (statusResponse.HEAD && statusResponse.HEAD.responseCode === 'OK') {
            const { STATUS, TXNID, TXNAMOUNT, BANKTXNID, CURRENCY } = statusResponse.BODY;

            return NextResponse.json({
                success: true,
                paymentStatus: STATUS,
                transactionId: TXNID,
                amount: TXNAMOUNT,
                bankTransactionId: BANKTXNID,
                currency: CURRENCY,
                response: statusResponse.BODY,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: statusResponse.HEAD?.responseMessage || 'Failed to get payment status'
                },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Paytm status check error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}