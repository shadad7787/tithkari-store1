import KEYS from './keys.example.js';

var CONFIG = {
    supabase: { url: KEYS.supabaseUrl, anonKey: KEYS.supabaseAnonKey },
    stripe: { publishableKey: KEYS.stripePublishableKey, secretKey: KEYS.stripeSecretKey },
    paypal: { clientId: KEYS.paypalClientId, secret: KEYS.paypalSecret },
    email: { sendgridApiKey: KEYS.sendgridApiKey, from: KEYS.emailFrom, to: KEYS.adminEmail },
    analytics: { google: KEYS.googleAnalyticsId, facebook: KEYS.facebookPixelId, hotjar: KEYS.hotjarId },
    urls: { site: KEYS.siteUrl, api: KEYS.apiUrl },
    debug: { mode: KEYS.debugMode, useMockData: KEYS.useMockData },
    currency: { default: KEYS.defaultCurrency, supported: ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'KWD', 'QAR', 'BHD'] }
};

export default CONFIG;

if (typeof window !== 'undefined') {
    window.TITHKARI_CONFIG = CONFIG;
    console.log('? Config loaded');
}

