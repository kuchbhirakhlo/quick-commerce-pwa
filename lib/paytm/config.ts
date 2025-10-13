// Paytm Payment Gateway Configuration
export const PAYTM_CONFIG = {
    // Paytm Merchant Details
    MID: process.env.PAYTM_MID || 'YOUR_PAYTM_MID',
    MERCHANT_KEY: process.env.PAYTM_MERCHANT_KEY || 'YOUR_PAYTM_MERCHANT_KEY',
    WEBSITE: process.env.PAYTM_WEBSITE || 'WEBSTAGING',

    // API URLs
    PAYTM_BASE_URL: process.env.NODE_ENV === 'production'
        ? 'https://securegw.paytm.in'
        : 'https://securegw-stage.paytm.in',

    // Callback URLs
    CALLBACK_URL: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/paytm/callback`
        : 'http://localhost:3000/api/paytm/callback',

    // Frontend URLs
    SUCCESS_URL: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`
        : 'http://localhost:3000/checkout/success',

    FAILURE_URL: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failed`
        : 'http://localhost:3000/checkout/failed',
};

// Paytm Environment URLs
export const PAYTM_URLS = {
    INITIATE_TRANSACTION: `${PAYTM_CONFIG.PAYTM_BASE_URL}/theia/api/v1/initiateTransaction`,
    TRANSACTION_STATUS: `${PAYTM_CONFIG.PAYTM_BASE_URL}/order/status`,
};

// Paytm Payment Modes
export const PAYTM_PAYMENT_MODES = {
    UPI: 'UPI',
    NET_BANKING: 'NET_BANKING',
    CREDIT_CARD: 'CREDIT_CARD',
    DEBIT_CARD: 'DEBIT_CARD',
    WALLET: 'WALLET',
    PAYTM_DIGITAL_CREDIT: 'PAYTM_DIGITAL_CREDIT',
};

// Paytm Channel ID
export const PAYTM_CHANNEL_ID = process.env.NODE_ENV === 'production' ? 'WEB' : 'WEBSTAGING';