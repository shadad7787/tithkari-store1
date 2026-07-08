// ==========================================
// تكامل Stripe للدفع الإلكتروني
// ==========================================

import { PAYMENT_CONFIG, convertCurrency, formatPrice } from './payment-config.js';
import KEYS from '../keys.js';

class StripePayment {
    constructor() {
        this.config = PAYMENT_CONFIG.stripe;
        this.stripe = null;
        this.elements = null;
        this.isSandbox = KEYS.debugMode !== false;
    }

    // ==========================================
    // تهيئة Stripe
    // ==========================================
    async init() {
        try {
            // تحميل Stripe.js
            if (!document.querySelector('#stripe-js')) {
                const script = document.createElement('script');
                script.id = 'stripe-js';
                script.src = 'https://js.stripe.com/v3/';
                document.head.appendChild(script);
            }

            // انتظار تحميل Stripe
            await new Promise(resolve => {
                const checkStripe = () => {
                    if (window.Stripe) {
                        const publicKey = this.config.publicKey || KEYS.stripePublishableKey;
                        this.stripe = window.Stripe(publicKey);
                        resolve();
                    } else {
                        setTimeout(checkStripe, 100);
                    }
                };
                checkStripe();
            });

            console.log('✅ Stripe initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ فشل تهيئة Stripe:', error);
            return false;
        }
    }

    // ==========================================
    // إنشاء جلسة دفع
    // ==========================================
    async createPaymentSession(orderData) {
        try {
            // استخدام Secret Key من keys.js
            const secretKey = this.config.secretKey || KEYS.stripeSecretKey;
            
            if (!secretKey || secretKey === 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
                console.warn('⚠️ Stripe Secret Key غير موجودة، استخدام وضع المحاكاة');
                return this.createMockSession(orderData);
            }

            const response = await fetch('https://api.stripe.com/v1/payment_intents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    amount: Math.round(orderData.total * 100), // بالسنات
                    currency: this.config.currency,
                    payment_method_types: 'card',
                    description: `طلب #${orderData.orderNumber}`,
                    shipping: {
                        name: orderData.customerName,
                        address: {
                            city: orderData.city || 'Riyadh',
                            country: orderData.country || 'SA'
                        }
                    }
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }

            return {
                clientSecret: data.client_secret,
                paymentIntentId: data.id
            };
        } catch (error) {
            console.error('❌ فشل إنشاء جلسة الدفع:', error);
            // استخدام وضع المحاكاة في حالة الفشل
            return this.createMockSession(orderData);
        }
    }

    // ==========================================
    // جلسة دفع تجريبية (للتطوير)
    // ==========================================
    createMockSession(orderData) {
        console.log('🧪 استخدام وضع المحاكاة للدفع');
        return {
            clientSecret: 'pi_mock_' + Date.now(),
            paymentIntentId: 'pi_mock_' + Date.now(),
            isMock: true
        };
    }

    // ==========================================
    // عرض نموذج الدفع
    // ==========================================
    async renderPaymentForm(containerId, orderData) {
        if (!this.stripe) {
            await this.init();
        }

        const container = document.getElementById(containerId);
        if (!container) return;

        // تنظيف الحاوية
        container.innerHTML = '';

        // التحقق من Stripe
        if (!this.stripe) {
            container.innerHTML = `
                <div style="color: #f59e0b; padding: 10px; background: #fef3c7; border-radius: 4px; border: 1px solid #f59e0b;">
                    ⚠️ جاري تحميل Stripe... يرجى الانتظار
                </div>
            `;
            return;
        }

        try {
            // إنشاء جلسة دفع
            const session = await this.createPaymentSession(orderData);
            
            // إذا كانت محاكاة، عرض زر تجريبي
            if (session.isMock) {
                container.innerHTML = `
                    <div style="color: #6b7280; padding: 15px; background: #f3f4f6; border-radius: 8px; border: 1px dashed #6b7280; text-align: center;">
                        <h4 style="margin: 0 0 10px 0;">🧪 وضع المحاكاة</h4>
                        <p style="font-size: 14px; margin: 0 0 15px 0;">
                            Stripe في وضع التطوير. لن يتم خصم أي مبلغ.
                        </p>
                        <button onclick="window.stripePayment.completeMockPayment('${orderData.orderNumber}')" 
                                style="background: #10b981; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600;">
                            ✅ تأكيد الدفع التجريبي
                        </button>
                    </div>
                `;
                return;
            }

            // إنشاء عناصر الدفع
            const elements = this.stripe.elements({
                clientSecret: session.clientSecret
            });

            // عنصر رقم البطاقة
            const cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#32325d',
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        '::placeholder': {
                            color: '#aab7c4'
                        }
                    }
                }
            });

            cardElement.mount(container);

            // زر الدفع
            const submitButton = document.createElement('button');
            submitButton.className = 'stripe-pay-btn';
            submitButton.textContent = `ادفع ${formatPrice(orderData.total, orderData.currency)}`;
            submitButton.style.cssText = `
                background: #5469d4;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
                margin-top: 20px;
                transition: all 0.3s ease;
            `;
            submitButton.onmouseover = () => { submitButton.style.background = '#4353b3'; };
            submitButton.onmouseout = () => { submitButton.style.background = '#5469d4'; };
            container.appendChild(submitButton);

            // معالجة الدفع
            submitButton.addEventListener('click', async () => {
                submitButton.disabled = true;
                submitButton.textContent = 'جاري المعالجة...';

                try {
                    const { error } = await this.stripe.confirmCardPayment(session.clientSecret, {
                        payment_method: {
                            card: cardElement,
                            billing_details: {
                                name: orderData.customerName,
                                email: orderData.email,
                                phone: orderData.phone
                            }
                        }
                    });

                    if (error) {
                        throw new Error(error.message);
                    }

                    // نجاح الدفع
                    this.onPaymentSuccess(orderData);
                } catch (error) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('❌ فشل الدفع: ' + error.message, 'error');
                    } else {
                        alert('❌ فشل الدفع: ' + error.message);
                    }
                    submitButton.disabled = false;
                    submitButton.textContent = `ادفع ${formatPrice(orderData.total, orderData.currency)}`;
                }
            });

            return { stripe: this.stripe, elements, cardElement, session };

        } catch (error) {
            console.error('❌ فشل عرض نموذج الدفع:', error);
            container.innerHTML = `
                <div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 4px; border: 1px solid #ef4444;">
                    ⚠️ تعذر تحميل Stripe. يرجى المحاولة مرة أخرى.
                    <br><small style="color: #6b7280;">${this.isSandbox ? 'وضع التطوير (Sandbox)' : ''}</small>
                </div>
            `;
        }
    }

    // ==========================================
    // إكمال الدفع التجريبي
    // ==========================================
    completeMockPayment(orderNumber) {
        const orderData = {
            orderNumber: orderNumber,
            paymentId: 'mock_' + Date.now(),
            paymentStatus: 'completed',
            paymentMethod: 'stripe_mock'
        };
        this.onPaymentSuccess(orderData);
    }

    // ==========================================
    // عند نجاح الدفع
    // ==========================================
    onPaymentSuccess(orderData) {
        // حفظ الطلب في Supabase
        this.saveOrder(orderData);

        // إرسال إشعار بريد
        this.sendOrderConfirmation(orderData);

        // التوجيه إلى صفحة الشكر
        const siteUrl = KEYS.siteUrl || 'https://shadad7787.github.io/tithkari-store1';
        setTimeout(() => {
            window.location.href = `${siteUrl}/thank-you.html?order=${orderData.orderNumber}&payment=stripe`;
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
                    payment_method: orderData.paymentMethod || 'stripe',
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
        console.log('📧 إرسال تأكيد الطلب (Stripe):', orderData);
        
        try {
            // محاولة إرسال بريد باستخدام EmailJS أو SendGrid
            // سيتم تنفيذها لاحقاً عند ربط نظام الإشعارات
        } catch (error) {
            console.error('❌ فشل إرسال البريد:', error);
        }
    }
}

// تصدير للاستخدام
export const stripePayment = new StripePayment();

// إضافة دالة المحاكاة للنافذة
if (typeof window !== 'undefined') {
    window.stripePayment = stripePayment;
    window.stripePayment.completeMockPayment = function(orderNumber) {
        stripePayment.completeMockPayment(orderNumber);
    };
}

export default stripePayment;