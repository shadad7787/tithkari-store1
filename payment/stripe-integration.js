
// ==========================================
// تكامل Stripe للدفع الإلكتروني
// ==========================================

import { PAYMENT_CONFIG, convertCurrency, formatPrice } from './payment-config.js';

class StripePayment {
    constructor() {
        this.config = PAYMENT_CONFIG.stripe;
        this.stripe = null;
        this.elements = null;
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
                        this.stripe = window.Stripe(this.config.publicKey);
                        resolve();
                    } else {
                        setTimeout(checkStripe, 100);
                    }
                };
                checkStripe();
            });

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
            const response = await fetch('https://api.stripe.com/v1/payment_intents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.secretKey}`,
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
                            city: orderData.city,
                            country: orderData.country
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
            throw error;
        }
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

        // إنشاء عناصر الدفع
        const elements = this.stripe.elements({
            clientSecret: orderData.clientSecret
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
        `;
        container.appendChild(submitButton);

        // معالجة الدفع
        submitButton.addEventListener('click', async () => {
            submitButton.disabled = true;
            submitButton.textContent = 'جاري المعالجة...';

            try {
                const { error } = await this.stripe.confirmCardPayment(orderData.clientSecret, {
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
                alert('❌ فشل الدفع: ' + error.message);
                submitButton.disabled = false;
                submitButton.textContent = `ادفع ${formatPrice(orderData.total, orderData.currency)}`;
            }
        });

        return { stripe: this.stripe, elements, cardElement };
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
        setTimeout(() => {
            window.location.href = `${this.config.successUrl}?order=${orderData.orderNumber}`;
        }, 1500);
    }

    // ==========================================
    // حفظ الطلب
    // ==========================================
    async saveOrder(orderData) {
        // سيتم ربطها مع Supabase لاحقاً
        console.log('✅ حفظ الطلب:', orderData);
    }

    // ==========================================
    // إرسال تأكيد الطلب
    // ==========================================
    async sendOrderConfirmation(orderData) {
        // سيتم ربطها مع نظام الإشعارات لاحقاً
        console.log('📧 إرسال تأكيد الطلب:', orderData);
    }
}

// تصدير للاستخدام
export const stripePayment = new StripePayment();
export default stripePayment;