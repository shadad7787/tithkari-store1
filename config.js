// ============================================
// ملف الإعدادات المركزي (Central Config)
// ============================================

export const CONFIG = {
    supabaseUrl: 'https://savtqajghyloevzwrzvt.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww',
    
    // ===== العملات المدعومة =====
    currencies: {
        SAR: { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', rate: 1 },
        BHD: { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني', rate: 0.1 },
        QAR: { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', rate: 0.98 },
        AED: { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', rate: 0.98 },
        KWD: { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', rate: 0.082 },
        OMR: { code: 'OMR', symbol: 'ر.ع', name: 'ريال عماني', rate: 0.1 },
        USD: { code: 'USD', symbol: '$', name: 'دولار أمريكي', rate: 0.27 },
        EUR: { code: 'EUR', symbol: '€', name: 'يورو', rate: 0.25 }
    },
    
    // ===== الإعدادات الافتراضية =====
    defaults: {
        currency: 'SAR',
        view: 'grid',
        productsPerPage: 12,
        language: 'ar'
    },
    
    site: {
        name: 'Tithkari',
        description: 'متجر متخصص في تصميم وبيع الدروع الفاخرة'
    }
};

// ============================================
// دوال مساعدة للعملات
// ============================================

// الحصول على سعر الصرف
export function getExchangeRate(fromCurrency, toCurrency) {
    const rates = CONFIG.currencies;
    if (!rates[fromCurrency] || !rates[toCurrency]) return 1;
    return rates[toCurrency].rate / rates[fromCurrency].rate;
}

// تحويل العملة
export function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const rate = getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
}

// تنسيق العملة
export function formatCurrency(amount, currencyCode = 'SAR') {
    const currency = CONFIG.currencies[currencyCode];
    if (!currency) return `${amount.toFixed(2)}`;
    return `${amount.toFixed(2)} ${currency.symbol}`;
}

// ============================================
// دالة إنشاء عميل Supabase
// ============================================
export async function createSupabaseClient() {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
}