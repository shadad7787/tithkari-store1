// ==========================================
// خدمة إرسال البريد الإلكتروني
// ==========================================

import KEYS from '../keys.js';

class EmailService {
    constructor() {
        // ===== إعدادات البريد من keys.js =====
        this.config = {
            sendgrid: {
                apiKey: KEYS.sendgridApiKey || '',
                fromEmail: KEYS.emailFrom || 'info@tithkari.com',
                fromName: KEYS.storeName || 'Tithkari'
            },
            defaults: {
                adminEmail: KEYS.adminEmail || KEYS.emailTo || 'admin@tithkari.com'
            }
        };
        
        // ===== التحقق من وجود المفاتيح =====
        this.isConfigured = !!(this.config.sendgrid.apiKey && this.config.sendgrid.apiKey !== 'SG.your_sendgrid_key');
        
        if (this.isConfigured) {
            console.log('✅ Email service initialized with keys from keys.js');
        } else {
            console.warn('⚠️ Email service not configured - missing SendGrid API key');
            console.warn('💡 To enable email, add sendgridApiKey to keys.js');
        }
    }

    // ==========================================
    // إرسال بريد باستخدام SendGrid
    // ==========================================
    async sendViaSendGrid(to, subject, html, from = null) {
        try {
            // التحقق من وجود المفتاح
            if (!this.config.sendgrid.apiKey) {
                console.warn('⚠️ SendGrid API key not configured, using console fallback');
                console.log(`📧 [FALLBACK] To: ${to}, Subject: ${subject}`);
                console.log(`📧 [FALLBACK] HTML: ${html.substring(0, 200)}...`);
                return true; // محاكاة النجاح في وضع التطوير
            }

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
                const errorText = await response.text();
                throw new Error(`SendGrid error: ${response.status} - ${errorText}`);
            }

            console.log(`✅ Email sent to ${to}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to send email (SendGrid):', error);
            // محاولة استخدام البديل
            return await this.fallbackSend(to, subject, html);
        }
    }

    // ==========================================
    // طريقة بديلة للإرسال (console + localStorage)
    // ==========================================
    async fallbackSend(to, subject, html) {
        try {
            // حفظ في localStorage كنسخة احتياطية
            const emails = JSON.parse(localStorage.getItem('tithkari_emails') || '[]');
            emails.push({
                to,
                subject,
                html,
                sentAt: new Date().toISOString()
            });
            localStorage.setItem('tithkari_emails', JSON.stringify(emails));
            
            console.log(`💾 Email saved to localStorage (fallback) for ${to}`);
            console.log(`📧 Subject: ${subject}`);
            
            // محاولة إرسال باستخدام mailto (فتح عميل البريد)
            if (to && to.includes('@')) {
                const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(html.replace(/<[^>]*>/g, '').substring(0, 500))}`;
                // لا نفتح تلقائياً لتجنب الإزعاج
                console.log(`📧 mailto: ${mailtoLink.substring(0, 100)}...`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Fallback send failed:', error);
            return false;
        }
    }

    // ==========================================
    // إرسال تأكيد الطلب للعميل
    // ==========================================
    async sendOrderConfirmation(orderData) {
        const template = this.generateOrderConfirmationTemplate(orderData);
        
        // محاولة إرسال عبر SendGrid
        let sent = await this.sendViaSendGrid(
            orderData.email,
            template.subject,
            template.html
        );

        // إرسال إشعار للإدمن
        if (sent) {
            const adminTemplate = this.generateAdminNotificationTemplate(orderData);
            await this.sendViaSendGrid(
                this.config.defaults.adminEmail,
                adminTemplate.subject,
                adminTemplate.html
            );
        }

        return sent;
    }

    // ==========================================
    // إنشاء قالب تأكيد الطلب
    // ==========================================
    generateOrderConfirmationTemplate(orderData) {
        const itemsHtml = orderData.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: left;">${orderData.currency || 'SAR'} ${Number(item.price).toFixed(2)}</td>
            </tr>
        `).join('');

        const total = orderData.total || orderData.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        return {
            subject: `✅ تأكيد طلبك #${orderData.orderNumber} - Tithkari`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f5f0eb; border-radius: 16px; border: 1px solid rgba(255,215,0,0.1);">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid rgba(255,215,0,0.2);">
                        <h1 style="color: #ffd700; margin: 0; font-size: 28px;">🛡️ Tithkari</h1>
                        <p style="color: #8899aa; margin: 5px 0 0;">دروعك الفاخرة بتصميمك الخاص</p>
                    </div>
                    
                    <div style="padding: 20px 0;">
                        <h2 style="color: #ffd700; font-size: 20px;">✅ تم تأكيد طلبك!</h2>
                        <p style="color: #8899aa;">شكراً لك <strong style="color: #f5f0eb;">${orderData.customerName || 'عميلنا العزيز'}</strong> على طلبك.</p>
                        
                        <div style="background: rgba(255,215,0,0.05); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(255,215,0,0.08);">
                            <p style="margin: 5px 0;"><strong style="color: #ffd700;">📦 رقم الطلب:</strong> ${orderData.orderNumber}</p>
                            <p style="margin: 5px 0;"><strong style="color: #ffd700;">📅 التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
                            <p style="margin: 5px 0;"><strong style="color: #ffd700;">💳 طريقة الدفع:</strong> ${orderData.paymentMethod || 'الدفع عند الاستلام'}</p>
                        </div>
                        
                        <h3 style="color: #f5f0eb; margin: 20px 0 10px;">📋 تفاصيل الطلب</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background: rgba(255,215,0,0.05);">
                                    <th style="padding: 10px; text-align: right; color: #ffd700;">المنتج</th>
                                    <th style="padding: 10px; text-align: center; color: #ffd700;">الكمية</th>
                                    <th style="padding: 10px; text-align: left; color: #ffd700;">السعر</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 12px; text-align: left; font-weight: bold; color: #f5f0eb;">المجموع</td>
                                    <td style="padding: 12px; text-align: left; font-weight: bold; color: #ffd700; font-size: 18px;">
                                        ${orderData.currency || 'SAR'} ${Number(total).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        ${orderData.discountApplied ? `
                            <div style="background: rgba(16, 185, 129, 0.1); padding: 10px 15px; border-radius: 8px; margin: 10px 0; border: 1px solid rgba(16, 185, 129, 0.2);">
                                <p style="margin: 0; color: #10b981;">🎫 تم تطبيق خصم: ${orderData.currency || 'SAR'} ${Number(orderData.discountApplied).toFixed(2)}</p>
                            </div>
                        ` : ''}
                        
                        <div style="background: rgba(255,215,0,0.05); padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(255,215,0,0.08);">
                            <h4 style="color: #ffd700; margin: 0 0 8px;">🚚 معلومات الشحن</h4>
                            <p style="margin: 3px 0; color: #8899aa;">
                                ${orderData.address || 'سيتم تحديد عنوان الشحن لاحقاً'}
                                ${orderData.city ? `, ${orderData.city}` : ''}
                            </p>
                            <p style="margin: 3px 0; color: #8899aa;">📱 ${orderData.phone || 'لم يتم توفير رقم هاتف'}</p>
                            <p style="margin: 3px 0; color: #8899aa;">📧 ${orderData.email}</p>
                        </div>
                        
                        ${orderData.customizationNotes ? `
                            <div style="background: rgba(139, 92, 246, 0.1); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(139, 92, 246, 0.2);">
                                <h4 style="color: #8B5CF6; margin: 0 0 8px;">🎨 ملاحظات التخصيص</h4>
                                <p style="margin: 0; color: #8899aa;">${orderData.customizationNotes}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="text-align: center; padding: 15px; border-top: 1px solid rgba(255,215,0,0.1); color: #667788; font-size: 13px;">
                        <p style="margin: 0;">📧 هذا بريد إلكتروني تلقائي، الرجاء عدم الرد عليه.</p>
                        <p style="margin: 5px 0 0;">للتواصل: <a href="mailto:${this.config.sendgrid.fromEmail}" style="color: #ffd700; text-decoration: none;">${this.config.sendgrid.fromEmail}</a></p>
                    </div>
                </div>
            `
        };
    }

    // ==========================================
    // إنشاء قالب إشعار الإدمن
    // ==========================================
    generateAdminNotificationTemplate(orderData) {
        const itemsList = orderData.items.map(item => 
            `- ${item.name} (x${item.quantity}) - ${orderData.currency || 'SAR'} ${Number(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        const total = orderData.total || orderData.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        return {
            subject: `🛡️ طلب جديد #${orderData.orderNumber} - Tithkari`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f5f0eb; border-radius: 16px; border: 1px solid rgba(255,215,0,0.1);">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid rgba(255,215,0,0.2);">
                        <h1 style="color: #ffd700; margin: 0; font-size: 28px;">🛡️ Tithkari</h1>
                        <p style="color: #8899aa; margin: 5px 0 0;">🔔 طلب جديد!</p>
                    </div>
                    
                    <div style="padding: 20px 0;">
                        <h2 style="color: #ffd700; font-size: 20px;">📦 طلب جديد #${orderData.orderNumber}</h2>
                        
                        <div style="background: rgba(255,215,0,0.05); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(255,215,0,0.08);">
                            <p style="margin: 5px 0;"><strong style="color: #ffd700;">👤 العميل:</strong> ${orderData.customerName || 'غير محدد'}</p>
                            <p style="margin: 5px 0;"><strong style="color: #ffd700;">📧 البريد:</strong> ${orderData.email || 'غير محدد'}</p>
                            <p style="margin: 5px 0;"><strong style="color: #ffd700;">📱 الهاتف:</strong> ${orderData.phone || 'غير محدد'}</p>
                            <p style="margin: 5px 0;"><strong style="color: #ffd700;">📅 التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
                            <p style="margin: 5px 0;"><strong style="color: #ffd700;">💳 طريقة الدفع:</strong> ${orderData.paymentMethod || 'الدفع عند الاستلام'}</p>
                        </div>
                        
                        <h3 style="color: #f5f0eb; margin: 15px 0 10px;">📋 المنتجات:</h3>
                        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; margin: 10px 0;">
                            <pre style="color: #8899aa; margin: 0; white-space: pre-wrap; font-family: inherit;">${itemsList}</pre>
                        </div>
                        
                        <div style="background: rgba(255,215,0,0.05); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(255,215,0,0.08);">
                            <p style="margin: 0; font-size: 18px; color: #ffd700;">
                                💰 المجموع: ${orderData.currency || 'SAR'} ${Number(total).toFixed(2)}
                            </p>
                        </div>
                        
                        ${orderData.address ? `
                            <div style="background: rgba(255,215,0,0.05); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(255,215,0,0.08);">
                                <h4 style="color: #ffd700; margin: 0 0 8px;">🚚 عنوان الشحن</h4>
                                <p style="margin: 3px 0; color: #8899aa;">${orderData.address}</p>
                                <p style="margin: 3px 0; color: #8899aa;">${orderData.city || ''}</p>
                            </div>
                        ` : ''}
                        
                        ${orderData.customizationNotes ? `
                            <div style="background: rgba(139, 92, 246, 0.1); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(139, 92, 246, 0.2);">
                                <h4 style="color: #8B5CF6; margin: 0 0 8px;">🎨 ملاحظات التخصيص</h4>
                                <p style="margin: 0; color: #8899aa;">${orderData.customizationNotes}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="text-align: center; padding: 15px; border-top: 1px solid rgba(255,215,0,0.1); color: #667788; font-size: 13px;">
                        <p style="margin: 0;">🔔 قم بمراجعة الطلب في لوحة التحكم</p>
                        <p style="margin: 5px 0 0;">
                            <a href="${KEYS.siteUrl || 'https://shadad7787.github.io/tithkari-store1'}/admin/admin.html" 
                               style="color: #ffd700; text-decoration: none;">📊 لوحة التحكم</a>
                        </p>
                    </div>
                </div>
            `
        };
    }

    // ==========================================
    // إرسال تحديث حالة الطلب
    // ==========================================
    async sendOrderStatusUpdate(orderData) {
        const statusMap = {
            'pending': '⏳ قيد الانتظار',
            'processing': '🔧 قيد المعالجة',
            'shipped': '🚚 تم الشحن',
            'delivered': '✅ تم التسليم',
            'cancelled': '❌ ملغي'
        };

        const statusText = statusMap[orderData.status] || orderData.status;

        const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f5f0eb; border-radius: 16px; border: 1px solid rgba(255,215,0,0.1);">
                <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid rgba(255,215,0,0.2);">
                    <h1 style="color: #ffd700; margin: 0; font-size: 24px;">🛡️ Tithkari</h1>
                </div>
                
                <div style="padding: 20px 0;">
                    <h2 style="color: #ffd700; font-size: 18px;">📦 تحديث حالة الطلب</h2>
                    <p>مرحباً <strong style="color: #f5f0eb;">${orderData.customerName || 'عميلنا العزيز'}</strong>،</p>
                    
                    <div style="background: rgba(255,215,0,0.05); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid rgba(255,215,0,0.08); text-align: center;">
                        <p style="margin: 0; font-size: 20px; color: #ffd700;">${statusText}</p>
                        <p style="margin: 5px 0 0; color: #8899aa; font-size: 14px;">رقم الطلب: ${orderData.orderNumber}</p>
                    </div>
                    
                    <div style="background: rgba(255,215,0,0.03); padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <p style="margin: 0; color: #8899aa; text-align: center;">
                            ${orderData.status === 'shipped' ? '🚚 تم شحن طلبك وسيصل قريباً' : 
                              orderData.status === 'delivered' ? '✅ تم تسليم طلبك بنجاح! نشكرك على ثقتك بنا.' :
                              orderData.status === 'processing' ? '🔧 جاري تجهيز طلبك' :
                              '⏳ طلبك قيد الانتظار' }
                        </p>
                    </div>
                    
                    <p style="color: #667788; font-size: 13px; text-align: center; margin: 20px 0 0;">
                        📧 هذا بريد إلكتروني تلقائي
                    </p>
                </div>
            </div>
        `;

        return await this.sendViaSendGrid(
            orderData.email,
            `📦 تحديث حالة الطلب #${orderData.orderNumber} - Tithkari`,
            html
        );
    }

    // ==========================================
    // إرسال بريد ترحيبي للعميل الجديد
    // ==========================================
    async sendWelcomeEmail(customerData) {
        const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e17; color: #f5f0eb; border-radius: 16px; border: 1px solid rgba(255,215,0,0.1);">
                <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid rgba(255,215,0,0.2);">
                    <h1 style="color: #ffd700; margin: 0; font-size: 28px;">🛡️ Tithkari</h1>
                    <p style="color: #8899aa; margin: 5px 0 0;">دروعك الفاخرة بتصميمك الخاص</p>
                </div>
                
                <div style="padding: 20px 0;">
                    <h2 style="color: #ffd700; font-size: 20px;">🎉 أهلاً بك في Tithkari!</h2>
                    <p>مرحباً <strong style="color: #f5f0eb;">${customerData.name || 'عميلنا العزيز'}</strong>،</p>
                    <p style="color: #8899aa;">نشكرك على انضمامك إلى عائلة Tithkari. نحن هنا لتقديم أفضل الدروع الفاخرة لك.</p>
                    
                    <div style="background: rgba(255,215,0,0.05); padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(255,215,0,0.08); text-align: center;">
                        <p style="margin: 0; color: #ffd700; font-size: 18px;">🎁 كود الخصم: <strong>WELCOME10</strong></p>
                        <p style="margin: 5px 0 0; color: #8899aa; font-size: 13px;">احصل على 10% خصم على أول طلب!</p>
                    </div>
                    
                    <div style="background: rgba(255,215,0,0.03); padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <h4 style="color: #f5f0eb; margin: 0 0 10px;">✨ ماذا نقدم لك؟</h4>
                        <ul style="color: #8899aa; padding-right: 20px; line-height: 1.8;">
                            <li>🛡️ دروع فاخرة بتصاميم حصرية</li>
                            <li>🎨 مصمم دروع متقدم لتخصيص درعك</li>
                            <li>🚚 شحن سريع لجميع أنحاء العالم</li>
                            <li>💳 طرق دفع متعددة وآمنة</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${KEYS.siteUrl || 'https://shadad7787.github.io/tithkari-store1'}" 
                           style="display: inline-block; background: #ffd700; color: #0a0e17; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 700;">
                            🛍️ استكشف المتجر الآن
                        </a>
                    </div>
                    
                    <p style="color: #667788; font-size: 13px; text-align: center; margin: 20px 0 0;">
                        لا تتردد في التواصل معنا لأي استفسار.<br>
                        فريق Tithkari 🛡️
                    </p>
                </div>
            </div>
        `;

        return await this.sendViaSendGrid(
            customerData.email,
            '🎉 أهلاً بك في Tithkari',
            html
        );
    }

    // ==========================================
    // التحقق من حالة الخدمة
    // ==========================================
    getStatus() {
        return {
            configured: this.isConfigured,
            hasApiKey: !!this.config.sendgrid.apiKey,
            fromEmail: this.config.sendgrid.fromEmail,
            adminEmail: this.config.defaults.adminEmail,
            mode: this.isConfigured ? 'live' : 'development'
        };
    }
}

// تصدير للاستخدام
export const emailService = new EmailService();
export default emailService;