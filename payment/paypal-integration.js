// ==========================================
// تكامل PayPal للدفع الإلكتروني
// ==========================================

import { PAYMENT_CONFIG, formatPrice } from './payment-config.js';

class PayPalPayment {
    constructor() {
        this.config = PAYMENT_CONFIG.paypal;
        this.paypal = null;
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
                script.src = `https://www.paypal.com/sdk/js?client-id=${this.config.clientId}&currency=${this.config.currency}`;
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
                        console.log('✅ تم الدفع بنجاح:', details);
                        this.onPaymentSuccess(orderData, details);
                    });
                },

                // عند الإلغاء
                onCancel: (data) => {
                    console.log('❌ تم إلغاء الدفع');
                    alert('تم إلغاء عملية الدفع');
                },

                // عند حدوث خطأ
                onError: (err) => {
                    console.error('❌ خطأ في الدفع:', err);
                    alert('حدث خطأ في عملية الدفع. يرجى المحاولة مرة أخرى.');
                }

            }).render(container);

        } catch (error) {
            console.error('❌ فشل عرض زر PayPal:', error);
            container.innerHTML = `
                <div style="color: red; padding: 10px; background: #fee; border-radius: 4px;">
                    ⚠️ تعذر تحميل PayPal. يرجى المحاولة مرة أخرى.
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
        setTimeout(() => {
            window.location.href = `thank-you.html?order=${orderData.orderNumber}`;
        }, 1500);
    }

    // ==========================================
    // حفظ الطلب
    // ==========================================
    async saveOrder(orderData) {
        console.log('✅ حفظ الطلب (PayPal):', orderData);
    }

    // ==========================================
    // إرسال تأكيد الطلب
    // ==========================================
    async sendOrderConfirmation(orderData) {
        console.log('📧 إرسال تأكيد الطلب (PayPal):', orderData);
    }
}

// تصدير للاستخدام
export const paypalPayment = new PayPalPayment();
export default paypalPayment;