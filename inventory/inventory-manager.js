// ==========================================
// نظام إدارة المخزون
// ==========================================

import { supabase } from '../config.js';

class InventoryManager {
    constructor() {
        this.lowStockThreshold = 5;
        this.criticalStockThreshold = 2;
    }

    // ==========================================
    // التحقق من المخزون
    // ==========================================
    async checkStock(productId, quantity) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('stock, name')
                .eq('id', productId)
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error('المنتج غير موجود');
            }

            const available = data.stock >= quantity;
            
            return {
                available,
                currentStock: data.stock,
                requestedQuantity: quantity,
                productName: data.name
            };
        } catch (error) {
            console.error('❌ فشل التحقق من المخزون:', error);
            throw error;
        }
    }

    // ==========================================
    // خصم المخزون
    // ==========================================
    async deductStock(productId, quantity) {
        try {
            // التحقق من المخزون أولاً
            const check = await this.checkStock(productId, quantity);
            if (!check.available) {
                throw new Error(`المخزون غير كافي. المتوفر: ${check.currentStock}`);
            }

            // خصم المخزون
            const { data, error } = await supabase
                .from('products')
                .update({
                    stock: check.currentStock - quantity
                })
                .eq('id', productId)
                .select();

            if (error) throw error;

            console.log(`✅ تم خصم ${quantity} من ${check.productName}`);
            
            // التحقق من الحدود الدنيا
            await this.checkLowStock(productId);

            return {
                success: true,
                newStock: check.currentStock - quantity,
                productName: check.productName
            };
        } catch (error) {
            console.error('❌ فشل خصم المخزون:', error);
            throw error;
        }
    }

    // ==========================================
    // إعادة المخزون (عند إلغاء الطلب)
    // ==========================================
    async restoreStock(productId, quantity) {
        try {
            const { data, error } = await supabase
                .from('products')
                .update({
                    stock: supabase.raw(`stock + ${quantity}`)
                })
                .eq('id', productId)
                .select();

            if (error) throw error;

            console.log(`✅ تم إعادة ${quantity} إلى المخزون`);
            return { success: true };
        } catch (error) {
            console.error('❌ فشل إعادة المخزون:', error);
            throw error;
        }
    }

    // ==========================================
    // التحقق من المخزون المنخفض
    // ==========================================
    async checkLowStock(productId) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, stock')
                .eq('id', productId)
                .single();

            if (error) throw error;

            if (data.stock <= this.criticalStockThreshold) {
                // تنبيه حرج
                this.sendStockAlert(data, 'critical');
            } else if (data.stock <= this.lowStockThreshold) {
                // تنبيه منخفض
                this.sendStockAlert(data, 'low');
            }

            return data;
        } catch (error) {
            console.error('❌ فشل التحقق من المخزون:', error);
        }
    }

    // ==========================================
    // إرسال تنبيه المخزون
    // ==========================================
    sendStockAlert(product, level) {
        const alerts = {
            low: {
                color: '#ff9800',
                message: `⚠️ المخزون منخفض: ${product.name} (${product.stock} متبقي)`
            },
            critical: {
                color: '#f44336',
                message: `🚨 مخزون حرج: ${product.name} (${product.stock} متبقي - يلزم إعادة تخزين فورية)`
            }
        };

        const alert = alerts[level];
        console.log(alert.message);

        // عرض تنبيه في لوحة التحكم
        if (window.adminUI) {
            window.adminUI.showNotification(alert.message, alert.color);
        }

        // إرسال بريد للإدمن
        this.sendEmailAlert(product, level);
    }

    // ==========================================
    // إرسال بريد تنبيه المخزون
    // ==========================================
    async sendEmailAlert(product, level) {
        const subject = level === 'critical' 
            ? `🚨 تنبيه عاجل: مخزون حرج!` 
            : `⚠️ تنبيه: مخزون منخفض`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: ${level === 'critical' ? '#f44336' : '#ff9800'};">${subject}</h2>
                <p><strong>المنتج:</strong> ${product.name}</p>
                <p><strong>المخزون المتبقي:</strong> ${product.stock}</p>
                <p><strong>الحالة:</strong> ${level === 'critical' ? '🚨 حرج - يلزم تدخل فوري' : '⚠️ منخفض - يفضل إعادة التخزين'}</p>
                <a href="https://shadad7787.github.io/tithkari-store1/admin/admin.html" 
                   style="background: #e6b31e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    إدارة المخزون
                </a>
            </div>
        `;

        // إرسال للإدمن
        const { emailService } = await import('../email/email-service.js');
        await emailService.sendViaSendGrid(
            'admin@tithkari.com',
            subject,
            html
        );
    }

    // ==========================================
    // الحصول على جميع المنتجات مع المخزون
    // ==========================================
    async getAllInventory() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, stock, price, status')
                .order('name');

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('❌ فشل جلب المخزون:', error);
            throw error;
        }
    }

    // ==========================================
    // تحديث المخزون يدوياً
    // ==========================================
    async updateStock(productId, newStock) {
        try {
            const { data, error } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', productId)
                .select();

            if (error) throw error;

            // التحقق من المخزون
            await this.checkLowStock(productId);

            return { success: true, data };
        } catch (error) {
            console.error('❌ فشل تحديث المخزون:', error);
            throw error;
        }
    }
}

// تصدير للاستخدام
export const inventoryManager = new InventoryManager();
export default inventoryManager;