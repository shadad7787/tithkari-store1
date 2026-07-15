// ============================================
// إعدادات المتجر - Tithkari Store Settings
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import KEYS from '../keys.example.js';

// ============================================
// تهيئة Supabase
// ============================================
const supabase = createClient(KEYS.supabaseUrl, KEYS.supabaseAnonKey);

let storeSettings = {
    theme: null,
    layout: null,
    colors: null,
    fonts: null,
    display: null
};

let isLoaded = false;

// ============================================
// تحميل الإعدادات من Supabase
// ============================================
async function loadStoreSettings() {
    try {
        console.log('📥 جاري تحميل إعدادات المتجر من Supabase...');
        
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('is_active', true);
        
        if (error) throw error;
        
        data.forEach(item => {
            storeSettings[item.key] = item.value;
        });
        
        isLoaded = true;
        console.log('✅ تم تحميل إعدادات المتجر بنجاح');
        return storeSettings;
    } catch (error) {
        console.error('❌ خطأ في تحميل إعدادات المتجر:', error);
        // محاولة تحميل من localStorage كحل بديل
        return loadSettingsFromLocal();
    }
}

// ============================================
// تحميل الإعدادات من localStorage (بديل)
// ============================================
function loadSettingsFromLocal() {
    try {
        const saved = JSON.parse(localStorage.getItem('tithkari_store_settings') || '{}');
        Object.keys(saved).forEach(key => {
            storeSettings[key] = saved[key];
        });
        isLoaded = true;
        console.log('✅ تم تحميل الإعدادات من التخزين المحلي');
        return storeSettings;
    } catch (e) {
        console.log('⚠️ لا توجد إعدادات محفوظة');
        return storeSettings;
    }
}

// ============================================
// تطبيق الإعدادات على الصفحة
// ============================================
function applyStoreSettings(settings) {
    if (!settings) return;
    
    const root = document.documentElement;
    
    // تطبيق الألوان
    if (settings.colors) {
        Object.entries(settings.colors).forEach(([key, value]) => {
            if (value) {
                root.style.setProperty(`--${key}`, value);
            }
        });
    }
    
    // تطبيق الثيم
    if (settings.theme?.colors) {
        Object.entries(settings.theme.colors).forEach(([key, value]) => {
            if (value) {
                root.style.setProperty(`--${key}`, value);
            }
        });
    }
    
    // تطبيق الخطوط
    if (settings.fonts) {
        const primaryFont = settings.fonts.primary || 'Cairo';
        const secondaryFont = settings.fonts.secondary || 'Tajawal';
        const primarySize = settings.fonts.primary_size || 16;
        
        document.body.style.fontFamily = primaryFont + ', sans-serif';
        root.style.setProperty('--font-primary', primaryFont);
        root.style.setProperty('--font-secondary', secondaryFont);
        root.style.setProperty('--font-size-base', primarySize + 'px');
    }
    
    // تطبيق عرض المنتجات
    if (settings.display) {
        const mode = settings.display.mode || 'grid';
        const productsGrid = document.querySelector('.products-grid');
        if (productsGrid) {
            if (mode === 'list') {
                productsGrid.classList.add('list-view');
                productsGrid.classList.remove('grid-view', 'compact-view');
            } else if (mode === 'compact') {
                productsGrid.classList.add('compact-view');
                productsGrid.classList.remove('grid-view', 'list-view');
            } else {
                productsGrid.classList.add('grid-view');
                productsGrid.classList.remove('list-view', 'compact-view');
            }
        }
        
        // عدد المنتجات في الصفحة
        const perPage = settings.display.products_per_page || 12;
        const productItems = document.querySelectorAll('.product-item');
        if (productItems.length > perPage) {
            productItems.forEach((item, index) => {
                item.style.display = index < perPage ? 'block' : 'none';
            });
        }
    }
    
    console.log('✅ تم تطبيق إعدادات المتجر بنجاح');
}

// ============================================
// تهيئة إعدادات المتجر
// ============================================
async function initStoreSettings() {
    const settings = await loadStoreSettings();
    applyStoreSettings(settings);
    return settings;
}

// ============================================
// جعل الدوال عامة
// ============================================
window.storeSettings = {
    load: loadStoreSettings,
    apply: applyStoreSettings,
    init: initStoreSettings,
    get: () => storeSettings,
    isLoaded: () => isLoaded
};

console.log('✅ store-settings.js loaded successfully');

export { loadStoreSettings, applyStoreSettings, initStoreSettings, storeSettings };