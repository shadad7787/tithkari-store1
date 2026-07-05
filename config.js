// ============================================
// ملف الإعدادات المركزي (Central Config)
// ============================================

export const CONFIG = {
    // ===== Supabase =====
    supabaseUrl: 'https://savtqajghyloevzwrzvt.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww',
    
    // ===== المتجر =====
    store: {
        name: 'Tithkari',
        description: 'متجر متخصص في تصميم وبيع الدروع الفاخرة',
        currency: 'SAR',
        defaultView: 'grid',
        productsPerPage: 12,
        language: 'ar'
    },
    
    // ===== إعدادات الدفع =====
    payment: {
        stripe: {
            enabled: true,
            publishableKey: '', // ضع المفتاح هنا
            secretKey: '' // ضع المفتاح هنا
        },
        paypal: {
            enabled: true,
            clientId: '', // ضع المفتاح هنا
            secretKey: '' // ضع المفتاح هنا
        },
        cod: {
            enabled: true
        },
        bankTransfer: {
            enabled: true,
            bankName: 'البنك الأهلي',
            accountNumber: 'SA0012345678901234567890',
            iban: 'SA0012345678901234567890'
        }
    },
    
    // ===== إعدادات البريد =====
    email: {
        sendgrid: {
            enabled: true,
            apiKey: '', // ضع المفتاح هنا
            fromEmail: 'info@tithkari.com',
            fromName: 'Tithkari - متجر الدروع الفاخرة'
        },
        adminEmail: 'admin@tithkari.com'
    },
    
    // ===== إعدادات الأدوات =====
    tools: {
        googleAnalytics: '', // ضع المعرف هنا
        facebookPixel: '', // ضع المعرف هنا
        clarity: '', // ضع المعرف هنا
        hotjar: '' // ضع المعرف هنا
    },
    
    // ===== العملات المدعومة =====
    currencies: {
        default: 'SAR',
        list: {
            SAR: { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', rate: 1 },
            BHD: { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني', rate: 0.1 },
            QAR: { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', rate: 0.98 },
            AED: { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', rate: 0.98 },
            KWD: { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', rate: 0.082 },
            OMR: { code: 'OMR', symbol: 'ر.ع', name: 'ريال عماني', rate: 0.1 },
            USD: { code: 'USD', symbol: '$', name: 'دولار أمريكي', rate: 0.27 },
            EUR: { code: 'EUR', symbol: '€', name: 'يورو', rate: 0.25 }
        }
    },
    
    // ===== إعدادات الشحن =====
    shipping: {
        defaultCountry: 'SA',
        countries: ['SA', 'AE', 'KW', 'QA', 'BH', 'OM'],
        freeShippingThreshold: 200 // الحد الأدنى للشحن المجاني
    },
    
    // ===== إعدادات الضرائب =====
    tax: {
        enabled: true,
        rate: 0.15, // 15% VAT
        includedInPrice: true
    },
    
    // ===== إعدادات العرض =====
    theme: {
        primary: '#8B0000',
        secondary: '#FFD700',
        dark: '#0F0F1A'
    },
    
    // ===== إعدادات API =====
    api: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
    },
    
    // ===== إعدادات واتساب =====
    whatsapp: {
        number: '966500000000', // رقم واتساب الافتراضي
        message: 'مرحباً، أريد الاستفسار عن طلبي'
    }
};

// ============================================
// دوال مساعدة للعملات
// ============================================

// الحصول على سعر الصرف
export function getExchangeRate(fromCurrency, toCurrency) {
    const currencies = CONFIG.currencies.list;
    if (!currencies[fromCurrency] || !currencies[toCurrency]) return 1;
    return currencies[toCurrency].rate / currencies[fromCurrency].rate;
}

// تحويل العملة
export function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const rate = getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
}

// تنسيق العملة
export function formatCurrency(amount, currencyCode = 'SAR') {
    const currency = CONFIG.currencies.list[currencyCode];
    if (!currency) return `${amount.toFixed(2)}`;
    return `${amount.toFixed(2)} ${currency.symbol}`;
}

// ============================================
// دوال مساعدة للإعدادات
// ============================================

// الحصول على إعداد معين
export function getConfig(path) {
    const keys = path.split('.');
    let value = CONFIG;
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }
    return value;
}

// تحديث إعداد معين
export function setConfig(path, value) {
    const keys = path.split('.');
    let target = CONFIG;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
    return true;
}

// ============================================
// دالة إنشاء عميل Supabase
// ============================================
export async function createSupabaseClient() {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
}

// ============================================
// تصدير افتراضي
// ============================================
export default CONFIG;