// ==========================================
// تكامل PayPal للدفع الإلكتروني
// ==========================================

import { PAYMENT_CONFIG, formatPrice } from './payment-config.js';
import KEYS from '../keys.example.js';

class PayPalPayment {
    constructor() {
        this.config = PAYMENT_CONFIG.paypal;
        this.paypal = null;
        this.isSandbox = KEYS.debugMode !== false;
    }

    // ==========================================
    // تهيئة PayPal
    // ==========================================
    async init() {
        try {
            // تحميل PayPal SDK
            if (!document.querySelector('#paypal-sdk')) {
                const script = document.createElement('script');
                script.id = 'paypal-sdk';
                const clientId = this.config.clientId || KEYS.paypalClientId;
                script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${this.config.currency}`;
                script.setAttribute('data-namespace', 'paypal_sdk');
                document.head.appendChild(script);
            }

            // انتظار تحميل PayPal
            await new Promise(resolve => {
                const checkPaypal = () => {
                    if (window.paypal_sdk) {
                        this.paypal = window.paypal_sdk;
                        resolve();
                    } else {
                        setTimeout(checkPaypal, 100);
                    }
                };
                checkPaypal();
            });

            console.log('✅ PayPal initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ فشل تهيئة PayPal:', error);
            return false;
        }
    }

    // ==========================================
    // عرض زر PayPal
    // ==========================================
    async renderPayPalButton(containerId, orderData) {
        if (!this.paypal) {
            await this.init();
        }

        const container = document.getElementById(containerId);
        if (!container) return;

        // تنظيف الحاوية
        container.innerHTML = '';

        // إذا لم يتم تهيئة PayPal، عرض رسالة
        if (!this.paypal) {
            container.innerHTML = `
                <div style="color: #f59e0b; padding: 10px; background: #fef3c7; border-radius: 4px; border: 1px solid #f59e0b;">
                    ⚠️ جاري تحميل PayPal... يرجى الانتظار
                </div>
            `;
            return;
        }

        try {
            // إنشاء زر PayPal
            this.paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'pay'
                },

                // إنشاء الطلب
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            description: `طلب #${orderData.orderNumber}`,
                            amount: {
                                currency_code: this.config.currency,
                                value: orderData.total.toFixed(2),
                                breakdown: {
                                    item_total: {
                                        currency_code: this.config.currency,
                                        value: orderData.total.toFixed(2)
                                    }
                                }
                            },
                            items: orderData.items.map(item => ({
                                name: item.name,
                                description: item.description || '',
                                unit_amount: {
                                    currency_code: this.config.currency,
                                    value: item.price.toFixed(2)
                                },
                                quantity: item.quantity,
                                category: 'PHYSICAL_GOODS'
                            }))
                        }],
                        application_context: {
                            shipping_preference: 'SET_PROVIDED_ADDRESS'
                        }
                    });
                },

                // عند الموافقة على الدفع
                onApprove: (data, actions) => {
                    return actions.order.capture().then(details => {
                        console.log('✅ تم الدفع بنجاح عبر PayPal:', details);
                        this.onPaymentSuccess(orderData, details);
                    });
                },

                // عند الإلغاء
                onCancel: (data) => {
                    console.log('❌ تم إلغاء الدفع عبر PayPal');
                    if (typeof window.showToast === 'function') {
                        window.showToast('تم إلغاء عملية الدفع', 'warning');
                    } else {
                        alert('تم إلغاء عملية الدفع');
                    }
                },

                // عند حدوث خطأ
                onError: (err) => {
                    console.error('❌ خطأ في الدفع عبر PayPal:', err);
                    if (typeof window.showToast === 'function') {
                        window.showToast('حدث خطأ في عملية الدفع. يرجى المحاولة مرة أخرى.', 'error');
                    } else {
                        alert('حدث خطأ في عملية الدفع. يرجى المحاولة مرة أخرى.');
                    }
                }

            }).render(container);

        } catch (error) {
            console.error('❌ فشل عرض زر PayPal:', error);
            container.innerHTML = `
                <div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 4px; border: 1px solid #ef4444;">
                    ⚠️ تعذر تحميل PayPal. يرجى المحاولة مرة أخرى.
                    <br><small style="color: #6b7280;">${this.isSandbox ? 'وضع التطوير (Sandbox)' : ''}</small>
                </div>
            `;
        }
    }

    // ==========================================
    // عند نجاح الدفع
    // ==========================================
    onPaymentSuccess(orderData, paypalDetails) {
        orderData.paymentId = paypalDetails.id;
        orderData.paymentStatus = 'completed';
        orderData.paymentMethod = 'paypal';

        // حفظ الطلب في Supabase
        this.saveOrder(orderData);

        // إرسال إشعار بريد
        this.sendOrderConfirmation(orderData);

        // التوجيه إلى صفحة الشكر
        const siteUrl = KEYS.siteUrl || 'https://shadad7787.github.io/tithkari-store1';
        setTimeout(() => {
            window.location.href = `${siteUrl}/thank-you.html?order=${orderData.orderNumber}&payment=paypal`;
        }, 1500);
    }

    // ==========================================
    // حفظ الطلب
    // ==========================================
    async saveOrder(orderData) {
        try {
            // محاولة استيراد Supabase
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.0');
            const supabase = createClient(KEYS.supabaseUrl, KEYS.supabaseAnonKey);
            
            const { data, error } = await supabase
                .from('orders')
                .insert({
                    order_number: orderData.orderNumber,
                    customer_name: orderData.customerName,
                    customer_email: orderData.email,
                    customer_phone: orderData.phone,
                    shipping_address: orderData.address,
                    total_amount: orderData.total,
                    payment_method: 'paypal',
                    payment_id: orderData.paymentId,
                    payment_status: orderData.paymentStatus,
                    items: orderData.items,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            console.log('✅ تم حفظ الطلب في Supabase:', orderData.orderNumber);
            return data;
        } catch (error) {
            console.error('❌ فشل حفظ الطلب:', error);
            // حفظ في localStorage كنسخة احتياطية
            try {
                const orders = JSON.parse(localStorage.getItem('tithkari_orders') || '[]');
                orders.push({
                    ...orderData,
                    savedAt: new Date().toISOString(),
                    offline: true
                });
                localStorage.setItem('tithkari_orders', JSON.stringify(orders));
                console.log('💾 تم حفظ الطلب محلياً كنسخة احتياطية');
            } catch (e) {
                console.error('❌ فشل حتى الحفظ المحلي:', e);
            }
        }
    }

    // ==========================================
    // إرسال تأكيد الطلب
    // ==========================================
    async sendOrderConfirmation(orderData) {
        console.log('📧 إرسال تأكيد الطلب (PayPal):', orderData);
        
        try {
            // محاولة إرسال بريد باستخدام EmailJS أو SendGrid
            // سيتم تنفيذها لاحقاً عند ربط نظام الإشعارات
        } catch (error) {
            console.error('❌ فشل إرسال البريد:', error);
        }
    }
}

// تصدير للاستخدام
export const paypalPayment = new PayPalPayment();
export default paypalPayment;
