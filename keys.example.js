const KEYS = {
    supabaseUrl: "https://savtqajghyloevzwrzvt.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww",
    stripePublishableKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    stripeSecretKey: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    paypalClientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    paypalSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    sendgridApiKey: "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    emailFrom: "admin@tithkari.com",
    emailTo: "admin@tithkari.com",
    googleAnalyticsId: "G-XXXXXXXXXX",
    facebookPixelId: "1234567890123456",
    hotjarId: "123456",
    siteUrl: "https://shadad7787.github.io/tithkari-store1",
    apiUrl: "https://savtqajghyloevzwrzvt.supabase.co",
    adminEmail: "admin@tithkari.com",
    debugMode: true,
    useMockData: false,
    defaultCurrency: "SAR"
};

export default KEYS;

if (typeof window !== 'undefined') {
    window.APP_KEYS = KEYS;
    console.log('✅ Keys loaded');
}
