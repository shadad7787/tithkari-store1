// ================================================================
// ?? keys.example.js - ‰„Ê–Ã ··„›« ÌÕ (Ì—›⁄ ⁄·Ï GitHub)
// ================================================================
// ?? «‰”Œ Â–« «·„·› ≈·Ï keys.example.js Ê√÷› „›« ÌÕﬂ «·ÕﬁÌﬁÌ…
// ================================================================

// ====== ?? »œ«Ì… «·„›« ÌÕ ======

const KEYS = {
    // ----------------------------
    // ?? Supabase - ﬁ«⁄œ… «·»Ì«‰« 
    // ----------------------------
    supabaseUrl: "your_supabase_url_here",
    supabaseAnonKey: "your_supabase_anon_key_here",
    supabaseServiceKey: "your_service_role_key_here",

    // ----------------------------
    // ?? Stripe - »Ê«»… «·œ›⁄
    // ----------------------------
    stripePublishableKey: "pk_test_...",
    stripeSecretKey: "sk_test_...",

    // ----------------------------
    // ?? PayPal - »Ê«»… «·œ›⁄
    // ----------------------------
    paypalClientId: "your_paypal_client_id",
    paypalSecret: "your_paypal_secret",

    // ----------------------------
    // ?? Email - ≈‘⁄«—«  «·»—Ìœ
    // ----------------------------
    sendgridApiKey: "SG.your_sendgrid_key",
    emailFrom: "admin@yourdomain.com",
    emailTo: "admin@yourdomain.com",

    // ----------------------------
    // ?? Analytics - √œÊ«  «· Õ·Ì·
    // ----------------------------
    googleAnalyticsId: "G-XXXXXXXXXX",
    googleSearchConsole: "your-verification-code",
    facebookPixelId: "1234567890123456",
    microsoftClarityId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    hotjarId: "123456",
    tiktokPixelId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

    // ----------------------------
    // ?? JWT - «· ÊÀÌﬁ
    // ----------------------------
    jwtSecret: "your-jwt-secret-change-this",
    jwtExpiry: "7d",

    // ----------------------------
    // ?? URLs - —Ê«»ÿ «·„Êﬁ⁄
    // ----------------------------
    siteUrl: "https://your-site-url.com",
    apiUrl: "https://your-api-url.com",
    adminEmail: "admin@yourdomain.com",

    // ----------------------------
    // ??? ≈⁄œ«œ«  ≈÷«›Ì…
    // ----------------------------
    debugMode: true,
    useMockData: true,
    encryptionSalt: "your-encryption-salt",
    apiVersion: "v1",
    defaultCurrency: "SAR",

    // ----------------------------
    // ?? „›« ÌÕ APIs ≈÷«›Ì…
    // ----------------------------
    // ?? √÷› „› «Õﬂ «·ÃœÌœ Â‰«
    // newApiKey: "sk-...",
    // newApiSecret: "AC...",
};

// ====== ?? ‰Â«Ì… «·„›« ÌÕ ======

export default KEYS;

// ?  ‰»ÌÂ ··„ÿÊ—
console.warn('?? Using example keys! Copy this file to keys.example.js and add your real keys.');

