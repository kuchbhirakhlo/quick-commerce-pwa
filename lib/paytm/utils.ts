import crypto from 'crypto';
import { PAYTM_CONFIG, PAYTM_CHANNEL_ID } from './config';

// Generate Paytm Checksum
export function generatePaytmChecksum(params: any): string {
    const paramsStr = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

    const checksumStr = `${paramsStr}&KEY=${PAYTM_CONFIG.MERCHANT_KEY}`;
    const hash = crypto.createHash('sha256').update(checksumStr).digest('hex');

    return hash;
}

// Verify Paytm Checksum
export function verifyPaytmChecksum(params: any, receivedChecksum: string): boolean {
    const paramsStr = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

    const checksumStr = `${paramsStr}&KEY=${PAYTM_CONFIG.MERCHANT_KEY}`;
    const hash = crypto.createHash('sha256').update(checksumStr).digest('hex');

    return hash === receivedChecksum;
}

// Generate unique order ID for Paytm
export function generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `ORDER_${timestamp}_${random}`;
}

// Generate transaction token for Paytm
export function generateTransactionToken(orderId: string, amount: number, customerId: string): any {
    const paytmParams: any = {
        MID: PAYTM_CONFIG.MID,
        WEBSITE: PAYTM_CONFIG.WEBSITE,
        INDUSTRY_TYPE_ID: 'Retail',
        CHANNEL_ID: PAYTM_CHANNEL_ID,
        ORDER_ID: orderId,
        CUST_ID: customerId,
        MOBILE_NO: '', // Will be filled from user data
        EMAIL: '', // Will be filled from user data
        TXN_AMOUNT: amount.toFixed(2),
        CALLBACK_URL: PAYTM_CONFIG.CALLBACK_URL,
    };

    return paytmParams;
}

// Validate Paytm response
export function validatePaytmResponse(response: any): boolean {
    if (!response || !response.ORDERID || !response.TXNID) {
        return false;
    }

    // Check if required fields are present
    const requiredFields = ['ORDERID', 'TXNID', 'TXNAMOUNT', 'STATUS'];
    return requiredFields.every(field => response[field] !== undefined);
}

// Format amount for Paytm (in rupees)
export function formatAmountForPaytm(amount: number): string {
    return amount.toFixed(2);
}

// Get payment status message
export function getPaymentStatusMessage(status: string): string {
    const statusMessages: { [key: string]: string } = {
        TXN_SUCCESS: 'Payment completed successfully',
        TXN_FAILURE: 'Payment failed',
        PENDING: 'Payment is pending',
        CANCEL: 'Payment cancelled by user',
        INVALID: 'Invalid payment details',
    };

    return statusMessages[status] || 'Unknown payment status';
}