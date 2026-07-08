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
    supabaseUrl: "https://savtqajghyloevzwrzvt.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww",
    supabaseServiceKey: "your_service_role_key_here",

    // ----------------------------
    // ?? Stripe - »Ê«»… «·œ›⁄
    // ----------------------------
    stripePublishableKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    stripeSecretKey: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

    // ----------------------------
    // ?? PayPal - »Ê«»… «·œ›⁄
    // ----------------------------
    paypalClientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    paypalSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

    // ----------------------------
    // ?? Email - ≈‘⁄«—«  «·»—Ìœ
    // ----------------------------
    sendgridApiKey: "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    emailFrom: "admin@tithkari.com",
    emailTo: "admin@tithkari.com",

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
    siteUrl: "https://shadad7787.github.io/tithkari-store1",
    apiUrl: "https://savtqajghyloevzwrzvt.supabase.co",
    adminEmail: "admin@tithkari.com",

    // ----------------------------
    // ??? ≈⁄œ«œ«  ≈÷«›Ì…
    // ----------------------------
    debugMode: true,
    useMockData: false,
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
