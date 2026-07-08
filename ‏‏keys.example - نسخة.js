// ================================================================
// 📄 keys.example.js - نموذج للمفاتيح (يرفع على GitHub)
// ================================================================
// ⚠️ انسخ هذا الملف إلى keys.js وأضف مفاتيحك الحقيقية
// ================================================================

// ====== 🔑 بداية المفاتيح ======

const KEYS = {
    // ----------------------------
    // 🔗 Supabase - قاعدة البيانات
    // ----------------------------
    supabaseUrl: "your_supabase_url_here",
    supabaseAnonKey: "your_supabase_anon_key_here",
    supabaseServiceKey: "your_service_role_key_here",

    // ----------------------------
    // 💳 Stripe - بوابة الدفع
    // ----------------------------
    stripePublishableKey: "pk_test_...",
    stripeSecretKey: "sk_test_...",

    // ----------------------------
    // 💰 PayPal - بوابة الدفع
    // ----------------------------
    paypalClientId: "your_paypal_client_id",
    paypalSecret: "your_paypal_secret",

    // ----------------------------
    // 📧 Email - إشعارات البريد
    // ----------------------------
    sendgridApiKey: "SG.your_sendgrid_key",
    emailFrom: "admin@yourdomain.com",
    emailTo: "admin@yourdomain.com",

    // ----------------------------
    // 📊 Analytics - أدوات التحليل
    // ----------------------------
    googleAnalyticsId: "G-XXXXXXXXXX",
    googleSearchConsole: "your-verification-code",
    facebookPixelId: "1234567890123456",
    microsoftClarityId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    hotjarId: "123456",
    tiktokPixelId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

    // ----------------------------
    // 🔐 JWT - التوثيق
    // ----------------------------
    jwtSecret: "your-jwt-secret-change-this",
    jwtExpiry: "7d",

    // ----------------------------
    // 🌐 URLs - روابط الموقع
    // ----------------------------
    siteUrl: "https://your-site-url.com",
    apiUrl: "https://your-api-url.com",
    adminEmail: "admin@yourdomain.com",

    // ----------------------------
    // 🛠️ إعدادات إضافية
    // ----------------------------
    debugMode: true,
    useMockData: true,
    encryptionSalt: "your-encryption-salt",
    apiVersion: "v1",
    defaultCurrency: "SAR",

    // ----------------------------
    // 📦 مفاتيح APIs إضافية
    // ----------------------------
    // 👇 أضف مفتاحك الجديد هنا
    // newApiKey: "sk-...",
    // newApiSecret: "AC...",
};

// ====== 🏁 نهاية المفاتيح ======

export default KEYS;

// ✅ تنبيه للمطور
console.warn('⚠️ Using example keys! Copy this file to keys.js and add your real keys.');
