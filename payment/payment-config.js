// ==========================================
// إعدادات بوابات الدفع - مستوردة من keys.example.js
// ==========================================

import KEYS from '../keys.example.js';

export const PAYMENT_CONFIG = {
    // Stripe
    stripe: {
        enabled: true,
        publicKey: KEYS.stripePublishableKey || 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX',
        secretKey: KEYS.stripeSecretKey || '',
        currency: 'usd',
        successUrl: KEYS.siteUrl ? `${KEYS.siteUrl}/thank-you.html` : 'https://shadad7787.github.io/tithkari-store1/thank-you.html',
        cancelUrl: KEYS.siteUrl ? `${KEYS.siteUrl}/checkout.html` : 'https://shadad7787.github.io/tithkari-store1/checkout.html'
    },
    
    // PayPal
    paypal: {
        enabled: true,
        clientId: KEYS.paypalClientId || 'XXXXXXXXXXXXXXXXXXXXXXXX',
        currency: 'USD',
        intent: 'capture'
    },
    
    // الدفع عند الاستلام (COD)
    cod: {
        enabled: true,
        label: 'الدفع عند الاستلام'
    },
    
    // العملات المدعومة
    currencies: {
        USD: { symbol: '$', rate: 1 },
        EUR: { symbol: '€', rate: 0.85 },
        GBP: { symbol: '£', rate: 0.73 },
        SAR: { symbol: 'ر.س', rate: 3.75 },
        AED: { symbol: 'د.إ', rate: 3.67 },
        QAR: { symbol: 'ر.ق', rate: 3.64 },
        KWD: { symbol: 'د.ك', rate: 0.31 },
        BHD: { symbol: 'د.ب', rate: 0.38 }
    }
};

console.log('🔐 Payment config loaded from keys.example.js');

// ==========================================
// دالة تحويل العملة
// ==========================================
export function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = PAYMENT_CONFIG.currencies[fromCurrency]?.rate || 1;
    const toRate = PAYMENT_CONFIG.currencies[toCurrency]?.rate || 1;
    
    return (amount / fromRate) * toRate;
}

// ==========================================
// دالة تنسيق السعر
// ==========================================
export function formatPrice(amount, currency) {
    const symbol = PAYMENT_CONFIG.currencies[currency]?.symbol || currency;
    return `${symbol} ${amount.toFixed(2)}`;
}

// ==========================================
// دالة التحقق من وجود المفاتيح
// ==========================================
export function validatePaymentKeys() {
    const missing = [];
    
    if (!PAYMENT_CONFIG.stripe.publicKey || PAYMENT_CONFIG.stripe.publicKey === 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX') {
        missing.push('Stripe Public Key');
    }
    
    if (!PAYMENT_CONFIG.paypal.clientId || PAYMENT_CONFIG.paypal.clientId === 'XXXXXXXXXXXXXXXXXXXXXXXX') {
        missing.push('PayPal Client ID');
    }
    
    if (missing.length > 0) {
        console.warn(`⚠️ مفاتيح الدفع المفقودة: ${missing.join(', ')}`);
        console.warn('📦 سيتم استخدام وضع المحاكاة للدفع');
        return false;
    }
    
    console.log('✅ جميع مفاتيح الدفع موجودة');
    return true;
}

export default PAYMENT_CONFIG;
