// ==========================================
// إعدادات البريد الإلكتروني
// ==========================================

export const EMAIL_CONFIG = {
    // استخدام SendGrid API
    sendgrid: {
        enabled: true,
        apiKey: 'SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        fromEmail: 'info@tithkari.com',
        fromName: 'Tithkari - متجر الدروع الفاخرة'
    },
    
    // استخدام EmailJS (مجاني)
    emailjs: {
        enabled: true,
        serviceId: 'service_xxxxxxxx',
        templateId: 'template_xxxxxxxx',
        publicKey: 'xxxxxxxxxxxxxxxxxxxxxxxx'
    },
    
    // إعدادات البريد الافتراضية
    defaults: {
        subjectPrefix: '[Tithkari] ',
        adminEmail: 'admin@tithkari.com'
    }
};

// ==========================================
// قوالب البريد الإلكتروني
// ==========================================
export const EMAIL_TEMPLATES = {
    // تأكيد الطلب للعميل
    orderConfirmation: (data) => ({
        subject: `✅ تأكيد الطلب #${data.orderNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background: #1a1a2e; border-radius: 10px 10px 0 0;">
                    <h1 style="color: #e6b31e; margin: 0;">🛡️ Tithkari</h1>
                    <p style="color: #fff;">متجر الدروع الفاخرة</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2>شكراً لطلبك! 🎉</h2>
                    <p>مرحباً <strong>${data.customerName}</strong>،</p>
                    <p>تم استلام طلبك بنجاح. إليك تفاصيل الطلب:</p>
                    
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>رقم الطلب:</strong> #${data.orderNumber}</p>
                        <p><strong>تاريخ الطلب:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
                        <p><strong>طريقة الدفع:</strong> ${data.paymentMethod}</p>
                    </div>
                    
                    <h3>📦 المنتجات:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                        <thead style="background: #1a1a2e; color: white;">
                            <tr>
                                <th style="padding: 10px; text-align: right;">المنتج</th>
                                <th style="padding: 10px; text-align: center;">الكمية</th>
                                <th style="padding: 10px; text-align: left;">السعر</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.items.map(item => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px; text-align: right;">${item.name}</td>
                                    <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                                    <td style="padding: 10px; text-align: left;">$${item.price.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="text-align: left; font-size: 18px; border-top: 2px solid #e6b31e; padding-top: 15px; margin-top: 15px;">
                        <p><strong>المجموع:</strong> $${data.total.toFixed(2)}</p>
                        ${data.discount ? `<p><strong>الخصم:</strong> -$${data.discount.toFixed(2)}</p>` : ''}
                        <p><strong>الإجمالي النهائي:</strong> $${data.finalTotal.toFixed(2)}</p>
                    </div>
                    
                    <div style="background: #e6b31e; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0;">📧 سيتم إرسال تحديثات الطلب إلى هذا البريد</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                        <p style="margin: 0;"><strong>📞 للتواصل:</strong></p>
                        <p style="margin: 5px 0;">واتساب: <a href="https://wa.me/966500000000">+966 50 000 0000</a></p>
                        <p style="margin: 5px 0;">بريد: <a href="mailto:info@tithkari.com">info@tithkari.com</a></p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
                        <p>© 2026 Tithkari - جميع الحقوق محفوظة</p>
                    </div>
                </div>
            </div>
        `
    }),
    
    // تأكيد الطلب للإدمن
    adminOrderNotification: (data) => ({
        subject: `🔔 طلب جديد #${data.orderNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e6b31e;">🛡️ طلب جديد!</h2>
                <p><strong>العميل:</strong> ${data.customerName}</p>
                <p><strong>البريد:</strong> ${data.email}</p>
                <p><strong>الهاتف:</strong> ${data.phone}</p>
                <p><strong>الإجمالي:</strong> $${data.finalTotal.toFixed(2)}</p>
                <p><strong>طريقة الدفع:</strong> ${data.paymentMethod}</p>
                <p style="margin-top: 20px;">
                    <a href="https://shadad7787.github.io/tithkari-store1/admin/admin.html" 
                       style="background: #e6b31e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        عرض الطلب في لوحة التحكم
                    </a>
                </p>
            </div>
        `
    }),
    
    // تحديث حالة الطلب
    orderStatusUpdate: (data) => ({
        subject: `📦 تحديث حالة الطلب #${data.orderNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>📦 تحديث حالة طلبك</h2>
                <p>مرحباً <strong>${data.customerName}</strong>،</p>
                <p>تم تحديث حالة طلبك رقم <strong>#${data.orderNumber}</strong> إلى:</p>
                <div style="background: #e6b31e; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; margin: 20px 0;">
                    ${data.status}
                </div>
                ${data.notes ? `<p><strong>ملاحظات:</strong> ${data.notes}</p>` : ''}
                <p>يمكنك متابعة طلبك في أي وقت.</p>
                <p>شكراً لتسوقك معنا! 🛡️</p>
            </div>
        `
    })
};

export default EMAIL_CONFIG;