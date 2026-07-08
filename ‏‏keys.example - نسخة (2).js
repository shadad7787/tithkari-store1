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
    supabaseUrl: "https://savtqajghyloevzwrzvt.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww",
    supabaseServiceKey: "your_service_role_key_here",

    // ----------------------------
    // 💳 Stripe - بوابة الدفع
    // ----------------------------
    stripePublishableKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    stripeSecretKey: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

    // ----------------------------
    // 💰 PayPal - بوابة الدفع
    // ----------------------------
    paypalClientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    paypalSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

    // ----------------------------
    // 📧 Email - إشعارات البريد
    // ----------------------------
    sendgridApiKey: "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    emailFrom: "admin@tithkari.com",
    emailTo: "admin@tithkari.com",

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
    siteUrl: "https://shadad7787.github.io/tithkari-store1",
    apiUrl: "https://savtqajghyloevzwrzvt.supabase.co",
    adminEmail: "admin@tithkari.com",

    // ----------------------------
    // 🛠️ إعدادات إضافية
    // ----------------------------
    debugMode: true,
    useMockData: false,
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