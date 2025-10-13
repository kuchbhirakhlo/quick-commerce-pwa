import { NextRequest, NextResponse } from 'next/server';
import { verifyPaytmChecksum, validatePaytmResponse, getPaymentStatusMessage } from '@/lib/paytm/utils';
import { updateOrderStatus } from '@/lib/firebase/firestore';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Extend global object for in-memory storage
declare global {
    var paytmOrders: Map<string, any> | undefined;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const paytmResponse: any = {};

        // Convert FormData to object
        for (const [key, value] of formData.entries()) {
            paytmResponse[key] = value;
        }

        console.log('Paytm callback received:', paytmResponse);

        // Validate response
        if (!validatePaytmResponse(paytmResponse)) {
            console.error('Invalid Paytm response:', paytmResponse);
            return NextResponse.json(
                { success: false, error: 'Invalid payment response' },
                { status: 400 }
            );
        }

        // Verify checksum
        const receivedChecksum = paytmResponse.CHECKSUMHASH;
        delete paytmResponse.CHECKSUMHASH;

        if (!verifyPaytmChecksum(paytmResponse, receivedChecksum)) {
            console.error('Checksum verification failed');
            return NextResponse.json(
                { success: false, error: 'Checksum verification failed' },
                { status: 400 }
            );
        }

        const { ORDERID, STATUS, TXNID, TXNAMOUNT, BANKTXNID, CURRENCY } = paytmResponse;

        // Get order info from in-memory storage
        const orderInfo = global.paytmOrders?.get(ORDERID);

        if (!orderInfo) {
            console.error('Order not found:', ORDERID);
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        // Update order payment status in database
        try {
            const paymentStatus = STATUS === 'TXN_SUCCESS' ? 'paid' : 'failed';
            const paymentDetails = {
                paymentId: TXNID,
                paymentMethod: 'paytm',
                paymentStatus,
                paymentAmount: parseFloat(TXNAMOUNT),
                paymentCurrency: CURRENCY || 'INR',
                bankTransactionId: BANKTXNID,
                paymentResponse: paytmResponse,
                completedAt: new Date().toISOString(),
            };

            // Update payment status in the order
            const orderRef = doc(db, "orders", ORDERID);
            await updateDoc(orderRef, {
                paymentStatus,
                paymentDetails,
                updatedAt: serverTimestamp(),
            });

            // Update order status based on payment success
            const orderStatus = paymentStatus === 'paid' ? 'confirmed' : 'cancelled';
            await updateOrderStatus(ORDERID, paymentStatus, paymentDetails, orderStatus);

            // Remove from in-memory storage
            global.paytmOrders?.delete(ORDERID);

            console.log(`Payment ${paymentStatus} for order ${ORDERID}`);

            // Return success response to Paytm
            return NextResponse.json({
                success: true,
                message: 'Payment processed successfully',
                orderId: ORDERID,
                status: paymentStatus,
            });

        } catch (error) {
            console.error('Error updating order payment status:', error);

            // Still return success to Paytm to avoid retries
            return NextResponse.json({
                success: true,
                message: 'Payment received, processing may be delayed',
                orderId: ORDERID,
            });
        }

    } catch (error) {
        console.error('Paytm callback error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle GET requests for Paytm (if needed)
export async function GET() {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
    );
}