// ==========================================
// خدمة إرسال البريد الإلكتروني
// ==========================================

import { EMAIL_CONFIG, EMAIL_TEMPLATES } from './email-config.js';

class EmailService {
    constructor() {
        this.config = EMAIL_CONFIG;
    }

    // ==========================================
    // إرسال بريد باستخدام SendGrid
    // ==========================================
    async sendViaSendGrid(to, subject, html, from = null) {
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.sendgrid.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [
                        {
                            to: [{ email: to }],
                            subject: subject
                        }
                    ],
                    from: {
                        email: from || this.config.sendgrid.fromEmail,
                        name: this.config.sendgrid.fromName
                    },
                    content: [
                        {
                            type: 'text/html',
                            value: html
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`SendGrid error: ${response.status}`);
            }

            console.log(`✅ بريد إلكتروني أرسل إلى ${to}`);
            return true;
        } catch (error) {
            console.error('❌ فشل إرسال البريد (SendGrid):', error);
            return false;
        }
    }

    // ==========================================
    // إرسال بريد باستخدام EmailJS
    // ==========================================
    async sendViaEmailJS(to, template, data) {
        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service_id: this.config.emailjs.serviceId,
                    template_id: this.config.emailjs.templateId,
                    user_id: this.config.emailjs.publicKey,
                    template_params: {
                        to_email: to,
                        ...data
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`EmailJS error: ${response.status}`);
            }

            console.log(`✅ بريد إلكتروني أرسل إلى ${to} (EmailJS)`);
            return true;
        } catch (error) {
            console.error('❌ فشل إرسال البريد (EmailJS):', error);
            return false;
        }
    }

    // ==========================================
    // إرسال تأكيد الطلب للعميل
    // ==========================================
    async sendOrderConfirmation(orderData) {
        const template = EMAIL_TEMPLATES.orderConfirmation(orderData);
        
        // محاولة إرسال عبر SendGrid أولاً
        let sent = await this.sendViaSendGrid(
            orderData.email,
            template.subject,
            template.html
        );

        // إذا فشل، جرب EmailJS
        if (!sent && this.config.emailjs.enabled) {
            sent = await this.sendViaEmailJS(
                orderData.email,
                'order_confirmation',
                {
                    order_number: orderData.orderNumber,
                    customer_name: orderData.customerName,
                    total: orderData.total,
                    items: orderData.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
                }
            );
        }

        // إرسال إشعار للإدمن
        if (sent) {
            const adminTemplate = EMAIL_TEMPLATES.adminOrderNotification(orderData);
            await this.sendViaSendGrid(
                this.config.defaults.adminEmail,
                adminTemplate.subject,
                adminTemplate.html
            );
        }

        return sent;
    }

    // ==========================================
    // إرسال تحديث حالة الطلب
    // ==========================================
    async sendOrderStatusUpdate(orderData) {
        const template = EMAIL_TEMPLATES.orderStatusUpdate(orderData);
        
        return await this.sendViaSendGrid(
            orderData.email,
            template.subject,
            template.html
        );
    }

    // ==========================================
    // إرسال بريد ترحيبي للعميل الجديد
    // ==========================================
    async sendWelcomeEmail(customerData) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #e6b31e;">🛡️ أهلاً بك في Tithkari!</h1>
                <p>مرحباً <strong>${customerData.name}</strong>،</p>
                <p>نشكرك على انضمامك إلى عائلة Tithkari. نحن هنا لتقديم أفضل الدروع الفاخرة لك.</p>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p>🎁 استخدم كود الخصم: <strong>WELCOME10</strong> للحصول على 10% خصم على أول طلب!</p>
                </div>
                <p>لا تتردد في التواصل معنا لأي استفسار.</p>
                <p>فريق Tithkari 🛡️</p>
            </div>
        `;

        return await this.sendViaSendGrid(
            customerData.email,
            '🎉 أهلاً بك في Tithkari',
            html
        );
    }
}

// تصدير للاستخدام
export const emailService = new EmailService();
export default emailService;