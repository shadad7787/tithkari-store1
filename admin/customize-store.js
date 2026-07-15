// ============================================
// تخصيص المتجر - Tithkari Customize Store
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import KEYS from '../keys.example.js';

// ============================================
// تهيئة Supabase
// ============================================
const supabase = createClient(KEYS.supabaseUrl, KEYS.supabaseAnonKey);

console.log('✅ Supabase initialized in customize-store');

// ============================================
// المتغيرات العامة
// ============================================
let currentTab = 'themes';
let banners = [];
let footerItems = [];
let advancedBanners = [];
let productSections = [];
let sectionProductsMap = {};
let selectedTheme = 'dark';
let selectedLayout = 'default';
let customColors = {};
let customFonts = {};
let displaySettings = {};
let isLoading = false;
let allColors = {};
let customCSSContent = '';
let customJSContent = '';

// ============================================
// صورة افتراضية للمنتجات
// ============================================
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%231a1a2e\'/%3E%3Ctext x=\'100\' y=\'110\' text-anchor=\'middle\' font-size=\'80\'%3E🛡️%3C/text%3E%3C/svg%3E';

// ============================================
// دالة الإشعارات
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(newContainer);
        return showToast(message, type);
    }
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#fbbf24',
        info: '#3b82f6'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #1A1A2E;
        border: 1px solid ${colors[type] || '#3b82f6'};
        border-radius: 8px;
        padding: 12px 24px;
        color: #fff;
        font-size: 14px;
        font-family: 'Cairo', sans-serif;
        animation: slideUp 0.4s ease;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        max-width: 90%;
        text-align: center;
        display: flex;
        align-items: center;
        gap: 10px;
        pointer-events: auto;
    `;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
window.showToast = showToast;

// ============================================
// دالة رفع الصور
// ============================================
async function uploadProductImage(fileOrUrl) {
    try {
        if (typeof fileOrUrl === 'string' && fileOrUrl.startsWith('http')) {
            return fileOrUrl;
        }
        
        if (typeof fileOrUrl === 'string' && fileOrUrl.startsWith('data:image')) {
            const blob = dataURLToBlob(fileOrUrl);
            const fileName = 'banner-' + Date.now() + '.png';
            
            const { error } = await supabase.storage
                .from('product-images')
                .upload(fileName, blob, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
            
            return data.publicUrl;
        }
        
        if (fileOrUrl && typeof fileOrUrl === 'object' && fileOrUrl instanceof File) {
            const ext = fileOrUrl.name.split('.').pop();
            const fileName = 'banner-' + Date.now() + '.' + ext;
            
            const { error } = await supabase.storage
                .from('product-images')
                .upload(fileName, fileOrUrl, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
            
            return data.publicUrl;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Upload error:', error);
        return null;
    }
}
window.uploadProductImage = uploadProductImage;

function dataURLToBlob(dataURL) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// ============================================
// تحميل الإعدادات من Supabase
// ============================================
async function loadSettingsFromSupabase() {
    try {
        isLoading = true;
        console.log('📥 جاري تحميل الإعدادات من Supabase...');
        
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('is_active', true);
        
        if (error) throw error;
        
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });
        
        console.log('✅ تم تحميل الإعدادات:', Object.keys(settings));
        
        if (settings.theme) {
            selectedTheme = settings.theme.name || 'dark';
            applyTheme(selectedTheme);
        }
        
        if (settings.layout) {
            selectedLayout = settings.layout.name || 'default';
            applyLayout(selectedLayout);
        }
        
        if (settings.colors) {
            allColors = settings.colors;
            customColors = settings.colors;
            applyColorsToPage(settings.colors);
            renderAdvancedColors();
        }
        
        if (settings.fonts) {
            customFonts = settings.fonts;
            applyFontsToPage(settings.fonts);
            updateFontPreview();
        }
        
        if (settings.display) {
            displaySettings = settings.display;
            if (displaySettings.mode) {
                applyDisplayMode(displaySettings.mode);
            }
        }
        
        if (settings.branding) {
            applyBrandingImmediately(settings.branding);
        }
        
        if (settings.background) {
            applyBackgroundImmediately(settings.background);
        }
        
        if (settings.icons) {
            applyIconsImmediately(settings.icons);
        }
        
        if (settings.product_enhancements) {
            applyProductEnhancementsImmediately(settings.product_enhancements);
        }
        
        if (settings.custom_css) {
            customCSSContent = settings.custom_css;
            const editor = document.getElementById('customCssEditor');
            if (editor) {
                editor.value = settings.custom_css;
            }
            const preview = document.getElementById('customCssPreview');
            if (preview) {
                preview.textContent = settings.custom_css || '// لا يوجد كود CSS مخصص';
            }
        }
        
        if (settings.custom_js) {
            customJSContent = settings.custom_js;
            const editor = document.getElementById('customJsEditor');
            if (editor) {
                editor.value = settings.custom_js;
            }
            const preview = document.getElementById('customJsPreview');
            if (preview) {
                preview.textContent = settings.custom_js || '// لا يوجد كود JavaScript مخصص';
            }
        }
        
        if (settings.display_settings) {
            loadDisplaySettingsFromData(settings.display_settings);
        }
        
        return settings;
    } catch (error) {
        console.error('❌ خطأ في تحميل الإعدادات:', error);
        loadSettingsFromLocal();
        return null;
    } finally {
        isLoading = false;
    }
}
window.loadSettingsFromSupabase = loadSettingsFromSupabase;

// ============================================
// حفظ الإعدادات في Supabase
// ============================================
async function saveSettingsToSupabase(key, value) {
    try {
        console.log(`💾 جاري حفظ ${key} في Supabase...`);
        
        const { data, error } = await supabase
            .from('store_settings')
            .upsert({
                key: key,
                value: value,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });
        
        if (error) throw error;
        
        console.log(`✅ تم حفظ ${key} بنجاح`);
        return true;
    } catch (error) {
        console.error(`❌ خطأ في حفظ ${key}:`, error);
        return false;
    }
}
window.saveSettingsToSupabase = saveSettingsToSupabase;

// ============================================
// حفظ جميع الإعدادات في Supabase
// ============================================
async function saveAllSettingsToSupabase() {
    try {
        showToast('⏳ جاري حفظ الإعدادات...', 'info');
        
        const settings = {
            theme: {
                name: selectedTheme,
                colors: THEMES[selectedTheme]?.colors || customColors
            },
            layout: {
                name: selectedLayout
            },
            colors: allColors,
            fonts: customFonts,
            display: displaySettings
        };
        
        const results = await Promise.all([
            saveSettingsToSupabase('theme', settings.theme),
            saveSettingsToSupabase('layout', settings.layout),
            saveSettingsToSupabase('colors', settings.colors),
            saveSettingsToSupabase('fonts', settings.fonts),
            saveSettingsToSupabase('display', settings.display)
        ]);
        
        const allSaved = results.every(r => r === true);
        
        if (allSaved) {
            showToast('✅ تم حفظ جميع الإعدادات في Supabase بنجاح!', 'success');
            localStorage.setItem('tithkari_store_settings', JSON.stringify(settings));
        } else {
            showToast('⚠️ حدث خطأ في حفظ بعض الإعدادات', 'warning');
        }
        
        return allSaved;
    } catch (error) {
        console.error('❌ خطأ في حفظ الإعدادات:', error);
        showToast('❌ حدث خطأ في حفظ الإعدادات', 'error');
        return false;
    }
}
window.saveAllSettingsToSupabase = saveAllSettingsToSupabase;

// ============================================
// تحميل الإعدادات من التخزين المحلي (بديل)
// ============================================
function loadSettingsFromLocal() {
    try {
        const saved = JSON.parse(localStorage.getItem('tithkari_store_settings') || '{}');
        if (saved.theme) {
            selectedTheme = saved.theme.name || 'dark';
            applyTheme(selectedTheme);
        }
        if (saved.layout) {
            selectedLayout = saved.layout.name || 'default';
            applyLayout(selectedLayout);
        }
        if (saved.colors) {
            allColors = saved.colors;
            customColors = saved.colors;
            applyColorsToPage(saved.colors);
        }
        if (saved.fonts) {
            customFonts = saved.fonts;
            applyFontsToPage(saved.fonts);
        }
        if (saved.display) {
            displaySettings = saved.display;
            if (displaySettings.mode) {
                applyDisplayMode(displaySettings.mode);
            }
        }
        console.log('✅ تم تحميل الإعدادات من التخزين المحلي');
        return saved;
    } catch (e) {
        console.log('⚠️ لا توجد إعدادات محفوظة محلياً');
        return {};
    }
}

// ============================================
// الثيمات
// ============================================
const THEMES = {
    dark: {
        name: 'داكن',
        icon: '🌙',
        colors: {
            primary: '#1E88E5',
            primaryDark: '#1565C0',
            primaryLight: '#64B5F6',
            secondary: '#FF6F00',
            secondaryDark: '#E65100',
            secondaryLight: '#FFA726',
            background: '#0A0A0F',
            backgroundSecondary: '#14141E',
            surface: '#1A1A2E',
            surfaceLight: '#252540',
            text: '#FFFFFF',
            textSecondary: '#8A8A9B',
            textMuted: '#6B6B7B',
            border: 'rgba(255,255,255,0.08)',
            borderLight: 'rgba(255,255,255,0.05)',
            shadow: '0 8px 32px rgba(0,0,0,0.4)',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            cardBackground: '#1A1A2E',
            cardBorder: 'rgba(255,255,255,0.05)',
            buttonPrimary: '#1E88E5',
            buttonPrimaryText: '#FFFFFF',
            buttonSecondary: '#FF6F00',
            buttonSecondaryText: '#FFFFFF',
            buttonHover: '#1565C0',
            linkColor: '#64B5F6',
            linkHover: '#1E88E5'
        }
    },
    light: {
        name: 'فاتح',
        icon: '☀️',
        colors: {
            primary: '#1976D2',
            primaryDark: '#0D47A1',
            primaryLight: '#42A5F5',
            secondary: '#E65100',
            secondaryDark: '#BF360C',
            secondaryLight: '#FF8A65',
            background: '#F5F5F5',
            backgroundSecondary: '#EEEEEE',
            surface: '#FFFFFF',
            surfaceLight: '#FAFAFA',
            text: '#212121',
            textSecondary: '#757575',
            textMuted: '#9E9E9E',
            border: 'rgba(0,0,0,0.08)',
            borderLight: 'rgba(0,0,0,0.05)',
            shadow: '0 8px 32px rgba(0,0,0,0.1)',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            cardBackground: '#FFFFFF',
            cardBorder: 'rgba(0,0,0,0.05)',
            buttonPrimary: '#1976D2',
            buttonPrimaryText: '#FFFFFF',
            buttonSecondary: '#E65100',
            buttonSecondaryText: '#FFFFFF',
            buttonHover: '#0D47A1',
            linkColor: '#42A5F5',
            linkHover: '#1976D2'
        }
    },
    royal: {
        name: 'ملوكي',
        icon: '👑',
        colors: {
            primary: '#C9A84C',
            primaryDark: '#A6883A',
            primaryLight: '#D4B86A',
            secondary: '#800020',
            secondaryDark: '#5A0015',
            secondaryLight: '#A0002A',
            background: '#0A0510',
            backgroundSecondary: '#120820',
            surface: '#1A0D2E',
            surfaceLight: '#2A1540',
            text: '#F5E6D3',
            textSecondary: '#B8A99A',
            textMuted: '#8A7B6C',
            border: 'rgba(201,168,76,0.2)',
            borderLight: 'rgba(201,168,76,0.1)',
            shadow: '0 8px 32px rgba(201,168,76,0.2)',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            cardBackground: '#1A0D2E',
            cardBorder: 'rgba(201,168,76,0.15)',
            buttonPrimary: '#C9A84C',
            buttonPrimaryText: '#0A0510',
            buttonSecondary: '#800020',
            buttonSecondaryText: '#F5E6D3',
            buttonHover: '#A6883A',
            linkColor: '#D4B86A',
            linkHover: '#C9A84C'
        }
    },
    modern: {
        name: 'حديث',
        icon: '⚡',
        colors: {
            primary: '#00D4FF',
            primaryDark: '#0099CC',
            primaryLight: '#66E5FF',
            secondary: '#FF6B6B',
            secondaryDark: '#CC4444',
            secondaryLight: '#FF9999',
            background: '#0A0A0A',
            backgroundSecondary: '#141414',
            surface: '#1A1A1A',
            surfaceLight: '#2A2A2A',
            text: '#FFFFFF',
            textSecondary: '#888888',
            textMuted: '#666666',
            border: 'rgba(255,255,255,0.05)',
            borderLight: 'rgba(255,255,255,0.02)',
            shadow: '0 8px 32px rgba(0,0,0,0.5)',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            cardBackground: '#1A1A1A',
            cardBorder: 'rgba(255,255,255,0.05)',
            buttonPrimary: '#00D4FF',
            buttonPrimaryText: '#0A0A0A',
            buttonSecondary: '#FF6B6B',
            buttonSecondaryText: '#FFFFFF',
            buttonHover: '#0099CC',
            linkColor: '#66E5FF',
            linkHover: '#00D4FF'
        }
    }
};

// ============================================
// دوال تطبيق الألوان على الصفحة
// ============================================
function applyColorsToPage(colors) {
    const root = document.documentElement;
    if (!colors) return;
    Object.entries(colors).forEach(([key, value]) => {
        if (value) {
            root.style.setProperty(`--${key}`, value);
            if (key === 'primary') {
                document.querySelectorAll('.btn-primary, .btn-save').forEach(el => {
                    el.style.background = `linear-gradient(135deg, ${value}, ${colors.primaryDark || value})`;
                });
            }
            if (key === 'background') document.body.style.background = value;
            if (key === 'text') document.body.style.color = value;
        }
    });
    console.log('✅ تم تطبيق الألوان على الصفحة');
}

function applyFontsToPage(fonts) {
    if (!fonts) return;
    const primaryFont = fonts.primary || 'Cairo';
    const secondaryFont = fonts.secondary || 'Tajawal';
    document.body.style.fontFamily = primaryFont + ', sans-serif';
    document.querySelectorAll('h1,h2,h3,h4,.logo-text,.section-title').forEach(el => {
        el.style.fontFamily = primaryFont + ', sans-serif';
    });
    document.querySelectorAll('p,span,a,button,input,textarea,select,label').forEach(el => {
        if (!el.closest('h1,h2,h3,h4,.logo-text,.section-title')) {
            el.style.fontFamily = secondaryFont + ', sans-serif';
        }
    });
}

function applyBrandingToPage(branding) {
    if (!branding) return;
    if (branding.storeName) {
        document.querySelectorAll('.logo-text, .store-name').forEach(el => el.textContent = branding.storeName);
        document.title = `🎨 تخصيص المتجر - ${branding.storeName}`;
    }
    if (branding.logo) {
        const logoImg = document.querySelector('.store-logo');
        if (logoImg) { logoImg.src = branding.logo; logoImg.style.display = 'block'; }
    }
}

// ============================================
// الألوان المتقدمة
// ============================================
function renderAdvancedColors() {
    const container = document.getElementById('advancedColorsContainer');
    if (!container) return;
    
    const colorGroups = {
        'الأساسية': ['primary', 'primaryDark', 'primaryLight', 'secondary', 'secondaryDark', 'secondaryLight'],
        'الخلفيات': ['background', 'backgroundSecondary', 'surface', 'surfaceLight'],
        'النصوص': ['text', 'textSecondary', 'textMuted'],
        'الحدود والظلال': ['border', 'borderLight', 'shadow'],
        'الحالات': ['success', 'warning', 'error', 'info'],
        'البطاقات': ['cardBackground', 'cardBorder'],
        'الأزرار': ['buttonPrimary', 'buttonPrimaryText', 'buttonSecondary', 'buttonSecondaryText', 'buttonHover'],
        'الروابط': ['linkColor', 'linkHover']
    };
    
    const colorLabels = {
        primary: 'الرئيسي', primaryDark: 'الرئيسي غامق', primaryLight: 'الرئيسي فاتح',
        secondary: 'الثانوي', secondaryDark: 'الثانوي غامق', secondaryLight: 'الثانوي فاتح',
        background: 'الخلفية', backgroundSecondary: 'الخلفية الثانوية', surface: 'السطح', surfaceLight: 'السطح الفاتح',
        text: 'النص', textSecondary: 'النص الثانوي', textMuted: 'النص الباهت',
        border: 'الحدود', borderLight: 'الحدود الفاتحة', shadow: 'الظل',
        success: 'نجاح', warning: 'تحذير', error: 'خطأ', info: 'معلومات',
        cardBackground: 'خلفية البطاقة', cardBorder: 'حدود البطاقة',
        buttonPrimary: 'الزر الرئيسي', buttonPrimaryText: 'نص الزر الرئيسي', buttonSecondary: 'الزر الثانوي', buttonSecondaryText: 'نص الزر الثانوي', buttonHover: 'الزر عند التمرير',
        linkColor: 'الرابط', linkHover: 'الرابط عند التمرير'
    };
    
    allColors = allColors || {};
    
    let html = '';
    Object.entries(colorGroups).forEach(([groupName, keys]) => {
        html += `<div class="settings-section"><h4>🎨 ${groupName}</h4><div class="color-row">`;
        keys.forEach(key => {
            const value = allColors[key] || '#000000';
            html += `
                <div class="color-item">
                    <label>${colorLabels[key] || key}</label>
                    <input type="color" id="color_${key}" value="${value}" onchange="updateColor('${key}', this.value)" />
                    <input type="text" value="${value}" style="font-size:11px;padding:2px 4px;min-height:28px;text-align:center;" onchange="document.getElementById('color_${key}').value=this.value;updateColor('${key}',this.value)" />
                </div>
            `;
        });
        html += `</div></div>`;
    });
    
    container.innerHTML = html;
}
window.renderAdvancedColors = renderAdvancedColors;

function updateColor(key, value) {
    allColors[key] = value;
    applyColorsToPage(allColors);
    document.documentElement.style.setProperty(`--${key}`, value);
}
window.updateColor = updateColor;

async function saveAdvancedColors() {
    const result = await saveSettingsToSupabase('colors', allColors);
    if (result) {
        showToast('✅ تم حفظ جميع الألوان بنجاح!', 'success');
        applyColorsToPage(allColors);
    } else {
        showToast('❌ حدث خطأ في حفظ الألوان', 'error');
    }
}
window.saveAdvancedColors = saveAdvancedColors;

// ============================================
// دوال التبويبات
// ============================================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tab}`);
    });
}

// ============================================
// دوال الثيمات
// ============================================
function renderThemes() {
    const grid = document.getElementById('themesGrid');
    if (!grid) return;
    
    const savedTheme = localStorage.getItem('tithkari_theme') || 'dark';
    selectedTheme = savedTheme;
    
    grid.innerHTML = Object.entries(THEMES).map(([key, theme]) => {
        const isActive = key === savedTheme;
        const colors = Object.values(theme.colors).slice(0, 3);
        
        return `
            <div class="theme-card ${isActive ? 'active' : ''}" 
                 data-theme="${key}"
                 onclick="applyTheme('${key}')">
                <div class="theme-preview" style="background: ${theme.colors.background};">
                    <div class="theme-sample" style="color: ${theme.colors.text};">
                        <div class="theme-sample-header" style="background: ${theme.colors.surface};">
                            <span style="color: ${theme.colors.primary};">${theme.icon}</span>
                            <span>${theme.name}</span>
                        </div>
                        <div class="theme-sample-body">
                            <div style="background: ${theme.colors.primary};"></div>
                            <div style="background: ${theme.colors.secondary};"></div>
                            <div style="background: ${theme.colors.surface};"></div>
                            <div style="background: ${theme.colors.text}; opacity: 0.1;"></div>
                        </div>
                    </div>
                </div>
                <div class="theme-info">
                    <h4>${theme.icon} ${theme.name}</h4>
                    <p>${colors.join(' • ')}</p>
                </div>
            </div>
        `;
    }).join('');
}

async function applyTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;
    
    selectedTheme = themeName;
    
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.theme === themeName);
    });
    
    // تطبيق الألوان الفورية
    applyColorsImmediately(theme.colors);
    
    localStorage.setItem('tithkari_theme', themeName);
    
    await saveSettingsToSupabase('theme', {
        name: themeName,
        colors: theme.colors
    });
    
    showToast(`✅ تم تطبيق الثيم: ${theme.name}`, 'success');
}
window.applyTheme = applyTheme;

// ============================================
// دوال التخطيط
// ============================================
const LAYOUTS = {
    default: {
        name: 'افتراضي',
        icon: 'fa-th-large',
        description: 'تخطيط شبكي افتراضي'
    },
    compact: {
        name: 'مضغوط',
        icon: 'fa-th',
        description: 'تخطيط مضغوط لعرض المزيد'
    },
    wide: {
        name: 'عريض',
        icon: 'fa-arrows-alt-h',
        description: 'تخطيط عريض لعرض أفضل'
    },
    sidebar: {
        name: 'شريط جانبي',
        icon: 'fa-columns',
        description: 'تخطيط مع شريط جانبي'
    }
};

function renderLayouts() {
    const grid = document.getElementById('layoutsGrid');
    if (!grid) return;
    
    const savedLayout = localStorage.getItem('tithkari_layout') || 'default';
    selectedLayout = savedLayout;
    
    grid.innerHTML = Object.entries(LAYOUTS).map(([key, layout]) => {
        const isActive = key === savedLayout;
        
        return `
            <div class="layout-card ${isActive ? 'active' : ''}" 
                 data-layout="${key}"
                 onclick="applyLayout('${key}')">
                <div class="layout-preview">
                    <i class="fas ${layout.icon}"></i>
                    <span style="font-size:12px;color:var(--gray);">${layout.name}</span>
                </div>
                <div class="layout-info">
                    <h4>${layout.name}</h4>
                    <p>${layout.description}</p>
                </div>
            </div>
        `;
    }).join('');
}

async function applyLayout(layoutName) {
    const layout = LAYOUTS[layoutName];
    if (!layout) return;
    
    selectedLayout = layoutName;
    
    document.querySelectorAll('.layout-card').forEach(card => {
        card.classList.toggle('active', card.dataset.layout === layoutName);
    });
    
    localStorage.setItem('tithkari_layout', layoutName);
    
    await saveSettingsToSupabase('layout', {
        name: layoutName
    });
    
    showToast(`✅ تم تطبيق التخطيط: ${layout.name}`, 'success');
}
window.applyLayout = applyLayout;

// ============================================
// دوال الخطوط
// ============================================
function renderFonts() {
    const grid = document.getElementById('fontsGrid');
    if (!grid) return;
    
    const savedFonts = JSON.parse(localStorage.getItem('tithkari_custom_fonts') || '{}');
    customFonts = savedFonts;
    
    const fontFields = [
        { key: 'primary', label: 'الخط الأساسي', default: 'Cairo' },
        { key: 'secondary', label: 'الخط الثانوي', default: 'Tajawal' }
    ];
    
    const fontOptions = ['Cairo', 'Tajawal', 'Amiri', 'Changa', 'Reem Kufi', 'Almarai', 'El Messiri', 'Lemonada'];
    
    grid.innerHTML = fontFields.map(field => `
        <div class="font-group">
            <label>${field.label}</label>
            <select id="font_${field.key}" onchange="updateFont('${field.key}', this.value)">
                ${fontOptions.map(font => `
                    <option value="${font}" ${(savedFonts[field.key] || field.default) === font ? 'selected' : ''}>
                        ${font}
                    </option>
                `).join('')}
            </select>
            <div class="font-size-control">
                <label style="font-size:12px;">حجم الخط</label>
                <input type="range" id="font_size_${field.key}" 
                       min="14" max="24" value="${savedFonts[`${field.key}_size`] || 16}"
                       oninput="updateFontSize('${field.key}', this.value)" />
                <span id="font_size_${field.key}_display">${savedFonts[`${field.key}_size`] || 16}px</span>
            </div>
        </div>
    `).join('');
    
    updateFontPreview();
}

function updateFont(key, value) {
    customFonts[key] = value;
    applyFontsImmediately(customFonts);
}
window.updateFont = updateFont;

function updateFontSize(key, value) {
    customFonts[`${key}_size`] = parseInt(value);
    document.getElementById(`font_size_${key}_display`).textContent = `${value}px`;
    applyFontsImmediately(customFonts);
}
window.updateFontSize = updateFontSize;

function updateFontPreview() {
    const preview = document.getElementById('previewText');
    if (!preview) return;
    
    const primaryFont = customFonts.primary || 'Cairo';
    const secondaryFont = customFonts.secondary || 'Tajawal';
    const primarySize = customFonts.primary_size || 16;
    const secondarySize = customFonts.secondary_size || 14;
    
    preview.style.fontFamily = primaryFont;
    preview.querySelectorAll('p').forEach((p, index) => {
        if (index === 0) {
            p.style.fontFamily = primaryFont;
            p.style.fontSize = `${primarySize + 8}px`;
        } else if (index === 1) {
            p.style.fontFamily = secondaryFont;
            p.style.fontSize = `${primarySize}px`;
        } else {
            p.style.fontFamily = secondaryFont;
            p.style.fontSize = `${secondarySize}px`;
        }
    });
}

async function saveFonts() {
    localStorage.setItem('tithkari_custom_fonts', JSON.stringify(customFonts));
    await saveSettingsToSupabase('fonts', customFonts);
    showToast('✅ تم حفظ وتطبيق الخطوط بنجاح', 'success');
}
window.saveFonts = saveFonts;

// ============================================
// دوال عرض المنتجات
// ============================================
const DISPLAY_MODES = {
    grid: {
        name: 'شبكة',
        icon: 'fa-th',
        description: 'عرض المنتجات في شبكة مرتبة'
    },
    list: {
        name: 'قائمة',
        icon: 'fa-list',
        description: 'عرض المنتجات كقائمة مع تفاصيل'
    },
    compact: {
        name: 'مضغوط',
        icon: 'fa-th-list',
        description: 'عرض مضغوط للمنتجات'
    },
    gallery: {
        name: 'معرض',
        icon: 'fa-images',
        description: 'عرض كمعرض صور'
    }
};

function renderDisplayOptions() {
    const container = document.getElementById('displayOptions');
    if (!container) return;
    
    const savedMode = localStorage.getItem('tithkari_display_mode') || 'grid';
    displaySettings.mode = savedMode;
    
    container.innerHTML = Object.entries(DISPLAY_MODES).map(([key, mode]) => {
        const isActive = key === savedMode;
        
        return `
            <div class="display-option ${isActive ? 'active' : ''}" 
                 data-mode="${key}"
                 onclick="applyDisplayMode('${key}')">
                <i class="fas ${mode.icon}"></i>
                <h4>${mode.name}</h4>
                <p>${mode.description}</p>
            </div>
        `;
    }).join('');
    
    renderProductsPreview(savedMode);
}

async function applyDisplayMode(mode) {
    displaySettings.mode = mode;
    
    document.querySelectorAll('.display-option').forEach(option => {
        option.classList.toggle('active', option.dataset.mode === mode);
    });
    
    localStorage.setItem('tithkari_display_mode', mode);
    renderProductsPreview(mode);
    
    await saveSettingsToSupabase('display', displaySettings);
    
    const modeName = DISPLAY_MODES[mode]?.name || mode;
    showToast(`✅ تم تطبيق عرض: ${modeName}`, 'success');
}
window.applyDisplayMode = applyDisplayMode;

function renderProductsPreview(mode) {
    const container = document.getElementById('productsPreview');
    if (!container) return;
    
    const count = mode === 'list' ? 3 : mode === 'compact' ? 6 : 4;
    const products = Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `منتج تجريبي ${i + 1}`,
        price: (99 + i * 50),
        description: 'وصف المنتج التجريبي'
    }));
    
    let gridClass = 'grid-view';
    if (mode === 'list') gridClass = 'list-view';
    else if (mode === 'compact') gridClass = 'compact-view';
    else if (mode === 'gallery') gridClass = 'gallery-view';
    
    container.innerHTML = `
        <div class="preview-grid ${gridClass}">
            ${products.map(product => `
                <div class="preview-product">
                    <div class="preview-image"></div>
                    <div class="preview-info">
                        <h4>${product.name}</h4>
                        <p>${product.description}</p>
                        <p style="color:var(--gold);font-weight:700;">${product.price} ر.س</p>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="text-align:center;margin-top:15px;color:var(--gray);font-size:13px;">
            💡 هذه معاينة لطريقة عرض المنتجات
        </div>
    `;
}

// ============================================
// دوال التذييل
// ============================================
async function loadFooterItems() {
    try {
        const { data, error } = await supabase
            .from('footer_items')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        footerItems = data || [];
        renderFooterItems();
        renderFooterPreview();
    } catch (error) {
        console.error('❌ خطأ في تحميل عناصر التذييل:', error);
        showToast('❌ حدث خطأ في تحميل عناصر التذييل', 'error');
    }
}
window.loadFooterItems = loadFooterItems;

function renderFooterItems() {
    const container = document.getElementById('footerItems');
    if (!container) return;
    
    if (footerItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center;padding:40px;color:var(--gray);">
                <i class="fas fa-shoe-prints" style="font-size:40px;display:block;margin-bottom:10px;opacity:0.3;"></i>
                <h3>لا توجد عناصر في التذييل</h3>
                <p>أضف عنصراً جديداً بالضغط على زر "إضافة عنصر"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = footerItems.map(item => `
        <div class="footer-item">
            <div class="item-info">
                ${item.icon ? `<div class="item-icon"><i class="fas ${item.icon}"></i></div>` : ''}
                <div class="item-details">
                    <h4>${item.label}</h4>
                    <p>${item.type || 'نص'} ${item.is_active ? '• ✅ نشط' : '• ❌ غير نشط'}</p>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-edit" onclick="editFooterItem('${item.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteFooterItem('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderFooterPreview() {
    const container = document.getElementById('footerPreview');
    if (!container) return;
    
    const activeItems = footerItems.filter(item => item.is_active);
    
    if (activeItems.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--gray);font-size:13px;">
                لا توجد عناصر نشطة لعرضها في التذييل
            </div>
        `;
        return;
    }
    
    const columns = Math.min(activeItems.length, 4);
    const itemsPerColumn = Math.ceil(activeItems.length / columns);
    const grouped = [];
    
    for (let i = 0; i < activeItems.length; i += itemsPerColumn) {
        grouped.push(activeItems.slice(i, i + itemsPerColumn));
    }
    
    container.innerHTML = `
        <div class="preview-footer">
            <div class="footer-grid">
                ${grouped.map((column, colIndex) => `
                    <div class="footer-column">
                        <h4>${column[0]?.label || 'عمود'}</h4>
                        ${column.map(item => `
                            <p>${item.icon ? `<i class="fas ${item.icon}"></i> ` : ''}${item.content || item.label}</p>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            <div style="text-align:center;margin-top:15px;color:var(--gray);font-size:12px;">
                © 2026 Tithkari - معاينة التذييل
            </div>
        </div>
    `;
}

async function saveFooterItem(event) {
    event.preventDefault();
    
    const id = document.getElementById('editFooterItemId').value;
    const label = document.getElementById('footerItemLabel').value.trim();
    const icon = document.getElementById('footerItemIcon').value.trim();
    const content = document.getElementById('footerItemContent').value.trim();
    const type = document.getElementById('footerItemType').value;
    const link_url = document.getElementById('footerItemLink').value.trim();
    const is_active = document.getElementById('footerItemStatus').value === 'true';
    const display_order = parseInt(document.getElementById('footerItemOrder').value) || 0;
    
    if (!label) {
        showToast('⚠️ الرجاء إدخال اسم العنصر', 'warning');
        return;
    }
    
    const data = {
        label,
        icon: icon || null,
        content: content || null,
        type,
        link_url: link_url || null,
        is_active,
        display_order,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('footer_items')
                .update(data)
                .eq('id', id);
        } else {
            data.created_at = new Date().toISOString();
            result = await supabase
                .from('footer_items')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث العنصر' : '✅ تم إضافة العنصر', 'success');
        closeFooterItemModal();
        loadFooterItems();
    } catch (error) {
        console.error('❌ خطأ في حفظ العنصر:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.saveFooterItem = saveFooterItem;

async function editFooterItem(id) {
    try {
        const item = footerItems.find(f => f.id === id);
        if (!item) {
            showToast('⚠️ العنصر غير موجود', 'warning');
            return;
        }
        
        document.getElementById('footerItemModalTitle').textContent = '✏️ تعديل عنصر التذييل';
        document.getElementById('editFooterItemId').value = item.id;
        document.getElementById('footerItemLabel').value = item.label || '';
        document.getElementById('footerItemIcon').value = item.icon || '';
        document.getElementById('footerItemContent').value = item.content || '';
        document.getElementById('footerItemType').value = item.type || 'text';
        document.getElementById('footerItemLink').value = item.link_url || '';
        document.getElementById('footerItemStatus').value = item.is_active ? 'true' : 'false';
        document.getElementById('footerItemOrder').value = item.display_order || 0;
        
        document.getElementById('footerItemModal').classList.add('active');
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.editFooterItem = editFooterItem;

async function deleteFooterItem(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
        const { error } = await supabase
            .from('footer_items')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف العنصر', 'success');
        loadFooterItems();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.deleteFooterItem = deleteFooterItem;

// ============================================
// دوال البنرات العادية
// ============================================
async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        banners = data || [];
        renderBanners();
    } catch (error) {
        console.error('❌ خطأ في تحميل البنرات:', error);
        showToast('❌ حدث خطأ في تحميل البنرات', 'error');
    }
}
window.loadBanners = loadBanners;

function renderBanners() {
    const container = document.getElementById('bannersList');
    if (!container) return;
    
    if (banners.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center;padding:40px;color:var(--gray);">
                <i class="fas fa-images" style="font-size:40px;display:block;margin-bottom:10px;opacity:0.3;"></i>
                <h3>لا توجد بنرات</h3>
                <p>أضف بنراً جديداً بالضغط على زر "إضافة بنر"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = banners.map(banner => `
        <div class="banner-item">
            <div class="banner-info">
                ${banner.image_url ? `<img src="${banner.image_url}" class="banner-thumb" onerror="this.style.display='none'" />` : ''}
                <div class="banner-details">
                    <h4>${banner.title}</h4>
                    <p>${banner.subtitle || 'لا يوجد وصف'} • ${banner.position || 'home'}</p>
                    <p style="font-size:11px;color:${banner.is_active ? '#10b981' : '#ef4444'};">
                        ${banner.is_active ? '✅ نشط' : '❌ غير نشط'}
                    </p>
                </div>
            </div>
            <div class="banner-actions">
                <button class="btn-toggle ${banner.is_active ? '' : 'inactive'}" onclick="toggleBanner('${banner.id}')">
                    ${banner.is_active ? 'إيقاف' : 'تفعيل'}
                </button>
                <button class="btn-edit" onclick="editBanner('${banner.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn-delete" onclick="deleteBanner('${banner.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function saveBanner(event) {
    event.preventDefault();
    
    const id = document.getElementById('editBannerId').value;
    const title = document.getElementById('bannerTitle').value.trim();
    const subtitle = document.getElementById('bannerSubtitle').value.trim();
    const image_url = document.getElementById('bannerImage').value.trim();
    const bg_color = document.getElementById('bannerBgColor').value;
    const text_color = document.getElementById('bannerTextColor').value;
    const link_url = document.getElementById('bannerLink').value.trim();
    const button_text = document.getElementById('bannerButtonText').value.trim();
    const position = document.getElementById('bannerPosition').value;
    const is_active = document.getElementById('bannerStatus').value === 'true';
    const display_order = parseInt(document.getElementById('bannerOrder').value) || 0;
    
    if (!title) {
        showToast('⚠️ الرجاء إدخال عنوان البنر', 'warning');
        return;
    }
    
    const data = {
        title,
        subtitle: subtitle || null,
        image_url: image_url || null,
        bg_color,
        text_color,
        link_url: link_url || null,
        button_text: button_text || null,
        position,
        is_active,
        display_order,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('banners')
                .update(data)
                .eq('id', id);
        } else {
            data.created_at = new Date().toISOString();
            result = await supabase
                .from('banners')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث البنر' : '✅ تم إضافة البنر', 'success');
        closeBannerModal();
        loadBanners();
    } catch (error) {
        console.error('❌ خطأ في حفظ البنر:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.saveBanner = saveBanner;

async function editBanner(id) {
    try {
        const banner = banners.find(b => b.id === id);
        if (!banner) {
            showToast('⚠️ البنر غير موجود', 'warning');
            return;
        }
        
        document.getElementById('bannerModalTitle').textContent = '✏️ تعديل البنر';
        document.getElementById('editBannerId').value = banner.id;
        document.getElementById('bannerTitle').value = banner.title || '';
        document.getElementById('bannerSubtitle').value = banner.subtitle || '';
        document.getElementById('bannerImage').value = banner.image_url || '';
        document.getElementById('bannerBgColor').value = banner.bg_color || '#1A1A2E';
        document.getElementById('bannerTextColor').value = banner.text_color || '#FFFFFF';
        document.getElementById('bannerLink').value = banner.link_url || '';
        document.getElementById('bannerButtonText').value = banner.button_text || '';
        document.getElementById('bannerPosition').value = banner.position || 'home';
        document.getElementById('bannerStatus').value = banner.is_active ? 'true' : 'false';
        document.getElementById('bannerOrder').value = banner.display_order || 0;
        
        document.getElementById('bannerModal').classList.add('active');
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.editBanner = editBanner;

async function deleteBanner(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا البنر؟')) return;
    
    try {
        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف البنر', 'success');
        loadBanners();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.deleteBanner = deleteBanner;

async function toggleBanner(id) {
    try {
        const banner = banners.find(b => b.id === id);
        if (!banner) return;
        
        const { error } = await supabase
            .from('banners')
            .update({ is_active: !banner.is_active })
            .eq('id', id);
        
        if (error) throw error;
        
        loadBanners();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.toggleBanner = toggleBanner;

// ============================================
// ===== إدارة البنرات المتطورة =====
// ============================================

async function loadAdvancedBanners() {
    try {
        const { data, error } = await supabase
            .from('advanced_banners')
            .select('*')
            .order('section_order', { ascending: true });
        
        if (error) throw error;
        
        advancedBanners = data || [];
        renderAdvancedBanners();
    } catch (error) {
        console.error('❌ خطأ في تحميل البنرات:', error);
        showToast('❌ حدث خطأ في تحميل البنرات', 'error');
    }
}
window.loadAdvancedBanners = loadAdvancedBanners;

function renderAdvancedBanners() {
    const container = document.getElementById('advancedBannersList');
    if (!container) return;
    
    if (advancedBanners.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>لا توجد بنرات</h3>
                <p>أضف بنراً جديداً بالضغط على زر "إضافة بنر"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = advancedBanners.map((banner) => `
        <div class="banner-item" style="border-right: 3px solid ${banner.is_active ? '#10b981' : '#ef4444'};">
            <div class="banner-info">
                ${banner.images && banner.images.length > 0 ? `
                    <div class="banner-thumb" style="background-image:url('${banner.images[0]}');"></div>
                ` : banner.image_url ? `
                    <div class="banner-thumb" style="background-image:url('${banner.image_url}');"></div>
                ` : `
                    <div class="banner-thumb" style="background:${banner.bg_color};display:flex;align-items:center;justify-content:center;font-size:24px;color:${banner.text_color};">
                        🖼️
                    </div>
                `}
                <div class="banner-details">
                    <h4>${banner.title}</h4>
                    <p>${banner.subtitle || 'لا يوجد وصف'} • ${banner.position || 'home'} • ${banner.banner_type || 'image'}</p>
                    <p style="font-size:11px;color:${banner.is_active ? '#10b981' : '#ef4444'};">
                        ${banner.is_active ? '✅ نشط' : '❌ غير نشط'} • ترتيب: ${banner.section_order || 0}
                        ${banner.images && banner.images.length > 0 ? ` • ${banner.images.length} صور` : ''}
                    </p>
                </div>
            </div>
            <div class="banner-actions">
                <button class="btn-toggle ${banner.is_active ? '' : 'inactive'}" onclick="toggleAdvancedBanner('${banner.id}')">
                    ${banner.is_active ? 'إيقاف' : 'تفعيل'}
                </button>
                <button class="btn-edit" onclick="editAdvancedBanner('${banner.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn-delete" onclick="deleteAdvancedBanner('${banner.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <div style="display:flex;gap:4px;margin-right:4px;">
                    <button class="btn-edit" onclick="moveAdvancedBanner('${banner.id}', -1)" style="padding:4px 8px;font-size:11px;" title="رفع">↑</button>
                    <button class="btn-edit" onclick="moveAdvancedBanner('${banner.id}', 1)" style="padding:4px 8px;font-size:11px;" title="خفض">↓</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function saveAdvancedBanner(event) {
    event.preventDefault();
    
    const id = document.getElementById('advBannerId').value;
    const title = document.getElementById('advBannerTitle').value.trim();
    const subtitle = document.getElementById('advBannerSubtitle').value.trim();
    let image_url = document.getElementById('advBannerImageUrl').value.trim();
    const bg_color = document.getElementById('advBannerBgColor').value;
    const text_color = document.getElementById('advBannerTextColor').value;
    const height = document.getElementById('advBannerHeight').value;
    const width = document.getElementById('advBannerWidth').value;
    const button_text = document.getElementById('advBannerButtonText').value.trim();
    const button_color = document.getElementById('advBannerButtonColor').value;
    const link_url = document.getElementById('advBannerLinkUrl').value.trim();
    const position = document.getElementById('advBannerPosition').value;
    const section_order = parseInt(document.getElementById('advBannerOrder').value) || 0;
    const is_active = document.getElementById('advBannerStatus').value === 'true';
    const banner_type = document.getElementById('advBannerType').value;
    const speed = parseInt(document.getElementById('advBannerSpeed').value) || 4;
    
    if (!title) {
        showToast('⚠️ الرجاء إدخال عنوان البنر', 'warning');
        return;
    }
    
    // جمع الصور من المعاينة
    const images = [];
    document.querySelectorAll('#advBannerImagesPreview .image-item img').forEach(img => {
        images.push(img.src);
    });
    
    // إذا كانت هناك صورة من الرابط
    if (image_url && images.length === 0) {
        images.push(image_url);
    }
    
    const data = {
        title,
        subtitle: subtitle || null,
        image_url: images.length > 0 ? images[0] : null,
        images: images,
        bg_color,
        text_color,
        height,
        width,
        button_text: button_text || null,
        button_color: button_color || '#FFD700',
        link_url: link_url || null,
        position,
        section_order,
        is_active,
        banner_type,
        speed,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('advanced_banners')
                .update(data)
                .eq('id', id);
        } else {
            data.created_at = new Date().toISOString();
            result = await supabase
                .from('advanced_banners')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث البنر' : '✅ تم إضافة البنر', 'success');
        closeAdvancedBannerModal();
        loadAdvancedBanners();
    } catch (error) {
        console.error('❌ خطأ في حفظ البنر:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.saveAdvancedBanner = saveAdvancedBanner;

async function editAdvancedBanner(id) {
    try {
        const { data, error } = await supabase
            .from('advanced_banners')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        openAdvancedBannerForm(data);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.editAdvancedBanner = editAdvancedBanner;

async function deleteAdvancedBanner(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا البنر؟')) return;
    
    try {
        const { error } = await supabase
            .from('advanced_banners')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف البنر', 'success');
        loadAdvancedBanners();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.deleteAdvancedBanner = deleteAdvancedBanner;

async function toggleAdvancedBanner(id) {
    try {
        const banner = advancedBanners.find(b => b.id === id);
        if (!banner) return;
        
        const { error } = await supabase
            .from('advanced_banners')
            .update({ is_active: !banner.is_active })
            .eq('id', id);
        
        if (error) throw error;
        loadAdvancedBanners();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.toggleAdvancedBanner = toggleAdvancedBanner;

async function moveAdvancedBanner(id, direction) {
    try {
        const { data: banners } = await supabase
            .from('advanced_banners')
            .select('id, section_order')
            .order('section_order', { ascending: true });
        
        const index = banners.findIndex(b => b.id === id);
        if (index === -1) return;
        
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= banners.length) return;
        
        const temp = banners[index].section_order;
        banners[index].section_order = banners[targetIndex].section_order;
        banners[targetIndex].section_order = temp;
        
        for (const b of banners) {
            await supabase
                .from('advanced_banners')
                .update({ section_order: b.section_order })
                .eq('id', b.id);
        }
        
        loadAdvancedBanners();
        showToast('✅ تم تحديث الترتيب', 'success');
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.moveAdvancedBanner = moveAdvancedBanner;

function openAdvancedBannerForm(data) {
    const modal = document.getElementById('advancedBannerModal');
    const title = document.getElementById('advancedBannerModalTitle');
    
    if (data) {
        title.textContent = '✏️ تعديل البنر';
        document.getElementById('advBannerId').value = data.id || '';
        document.getElementById('advBannerTitle').value = data.title || '';
        document.getElementById('advBannerSubtitle').value = data.subtitle || '';
        document.getElementById('advBannerImageUrl').value = data.image_url || '';
        document.getElementById('advBannerBgColor').value = data.bg_color || '#1A1A2E';
        document.getElementById('advBannerTextColor').value = data.text_color || '#FFFFFF';
        document.getElementById('advBannerHeight').value = data.height || '300px';
        document.getElementById('advBannerWidth').value = data.width || '100%';
        document.getElementById('advBannerButtonText').value = data.button_text || '';
        document.getElementById('advBannerButtonColor').value = data.button_color || '#FFD700';
        document.getElementById('advBannerLinkUrl').value = data.link_url || '';
        document.getElementById('advBannerPosition').value = data.position || 'home';
        document.getElementById('advBannerOrder').value = data.section_order || 0;
        document.getElementById('advBannerStatus').value = data.is_active ? 'true' : 'false';
        document.getElementById('advBannerType').value = data.banner_type || 'image';
        document.getElementById('advBannerSpeed').value = data.speed || 4;
        
        // عرض الصور
        const images = data.images || [];
        if (images.length > 0) {
            document.getElementById('advBannerImagesPreview').innerHTML = images.map(img => `
                <div class="image-item"><img src="${img}" /><button class="remove-image" onclick="removeBannerImage(this, '${img}')">×</button></div>
            `).join('');
        }
    } else {
        title.textContent = '➕ إضافة بنر متطور';
        document.getElementById('advancedBannerForm').reset();
        document.getElementById('advBannerId').value = '';
        document.getElementById('advBannerBgColor').value = '#1A1A2E';
        document.getElementById('advBannerTextColor').value = '#FFFFFF';
        document.getElementById('advBannerButtonColor').value = '#FFD700';
        document.getElementById('advBannerHeight').value = '300px';
        document.getElementById('advBannerWidth').value = '100%';
        document.getElementById('advBannerStatus').value = 'true';
        document.getElementById('advBannerOrder').value = 0;
        document.getElementById('advBannerSpeed').value = 4;
        document.getElementById('advBannerImagesPreview').innerHTML = '';
    }
    
    modal.classList.add('active');
}
window.openAdvancedBannerForm = openAdvancedBannerForm;

function closeAdvancedBannerModal() {
    document.getElementById('advancedBannerModal').classList.remove('active');
}
window.closeAdvancedBannerModal = closeAdvancedBannerModal;

// ============================================
// ===== إدارة أقسام المنتجات (معاينة مبسطة للإدارة) =====
// ============================================

/**
 * دالة جلب المنتجات المرتبطة بالقسم (للمعاينة المبسطة فقط)
 */
async function getProductsForSectionPreview(sectionId) {
    try {
        // جلب المنتجات المرتبطة بالقسم
        const { data: sectionProducts, error: spError } = await supabase
            .from('section_products')
            .select('product_id')
            .eq('section_id', sectionId)
            .order('display_order', { ascending: true });
        
        if (spError) throw spError;
        
        const productIds = sectionProducts?.map(p => p.product_id) || [];
        
        // جلب بيانات المنتجات (محدودة للمعاينة)
        let query = supabase
            .from('products')
            .select('id, name, image_url')
            .eq('status', 'active')
            .limit(10);
        
        if (productIds.length > 0) {
            query = query.in('id', productIds);
        }
        
        const { data: products, error: pError } = await query;
        
        if (pError) throw pError;
        
        return products || [];
    } catch (error) {
        console.error('❌ خطأ في جلب منتجات القسم للمعاينة:', error);
        return [];
    }
}

/**
 * دالة عرض أقسام المنتجات (معاينة مبسطة للإدارة فقط)
 */
async function renderProductSections() {
    const container = document.getElementById('productSectionsList');
    if (!container) return;
    
    // عرض مؤشر تحميل
    container.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--gray);">
            <i class="fas fa-spinner fa-spin" style="font-size:24px;"></i>
            <p>جاري تحميل الأقسام...</p>
        </div>
    `;
    
    try {
        // جلب الأقسام من Supabase
        const { data: sections, error: sectionsError } = await supabase
            .from('product_sections')
            .select('*')
            .order('section_order', { ascending: true });
        
        if (sectionsError) throw sectionsError;
        
        productSections = sections || [];
        
        if (productSections.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-boxes"></i>
                    <h3>لا توجد أقسام</h3>
                    <p>أضف قسم منتجات جديداً بالضغط على زر "إضافة قسم"</p>
                </div>
            `;
            return;
        }
        
        const displayTypes = {
            grid: 'شبكة',
            list: 'قائمة',
            carousel: 'سلايدر',
            compact: 'مضغوط'
        };
        
        let html = '';
        
        for (const section of productSections) {
            // جلب منتجات القسم (معاينة مبسطة)
            const products = await getProductsForSectionPreview(section.id);
            
            // بناء معاينة المنتجات (مبسطة للإدارة)
            let productsPreviewHtml = '';
            if (products && products.length > 0) {
                productsPreviewHtml = `
                    <div class="section-products-preview">
                        ${products.slice(0, 8).map(product => `
                            <div class="product-preview-item" title="${product.name}">
                                <img src="${product.image_url || PLACEHOLDER_IMAGE}" alt="${product.name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" />
                                <span>${product.name}</span>
                            </div>
                        `).join('')}
                        ${products.length > 8 ? `<div class="product-preview-more">+${products.length - 8}</div>` : ''}
                    </div>
                `;
            } else {
                productsPreviewHtml = `
                    <div class="section-products-empty">
                        <p style="color:var(--gray);font-size:12px;margin:5px 0;">
                            <i class="fas fa-box-open"></i> لا توجد منتجات في هذا القسم
                        </p>
                    </div>
                `;
            }
            
            html += `
                <div class="section-card" style="border-right: 3px solid ${section.is_active ? '#10b981' : '#ef4444'}; margin-bottom:20px;">
                    <div class="section-header-info">
                        <div style="display:flex;align-items:center;gap:12px;flex:1;">
                            <div class="section-icon">📦</div>
                            <div>
                                <h4 class="section-title-text">${section.title}</h4>
                                <p class="section-subtitle-text">
                                    ${section.subtitle || 'لا يوجد وصف'} • 
                                    ${displayTypes[section.display_type] || section.display_type} •
                                    ${section.products_per_page || 8} منتج
                                    ${section.category_filter ? `• ${section.category_filter}` : ''}
                                </p>
                                <p class="section-status ${section.is_active ? 'active' : 'inactive'}">
                                    ${section.is_active ? '✅ نشط' : '❌ غير نشط'} • ترتيب: ${section.section_order || 0}
                                    • ${products ? products.length : 0} منتج
                                </p>
                            </div>
                        </div>
                        <div class="section-actions">
                            <button class="btn-toggle ${section.is_active ? '' : 'inactive'}" onclick="toggleProductSection('${section.id}')">
                                ${section.is_active ? 'إيقاف' : 'تفعيل'}
                            </button>
                            <button class="btn-edit" onclick="editProductSection('${section.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="deleteProductSection('${section.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                            <div style="display:flex;gap:4px;">
                                <button class="btn-edit" onclick="moveProductSection('${section.id}', -1)" style="padding:4px 8px;font-size:11px;" title="رفع">↑</button>
                                <button class="btn-edit" onclick="moveProductSection('${section.id}', 1)" style="padding:4px 8px;font-size:11px;" title="خفض">↓</button>
                            </div>
                        </div>
                    </div>
                    ${productsPreviewHtml}
                </div>
            `;
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('❌ خطأ في عرض أقسام المنتجات:', error);
        container.innerHTML = `
            <div class="empty-state" style="border:1px solid #ef4444;border-radius:8px;padding:20px;">
                <i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i>
                <h3>حدث خطأ في تحميل الأقسام</h3>
                <p style="color:var(--gray);">${error.message || 'يرجى المحاولة مرة أخرى'}</p>
                <button class="btn-save" onclick="loadProductSections()" style="margin-top:10px;">
                    <i class="fas fa-sync"></i> إعادة المحاولة
                </button>
            </div>
        `;
    }
}
window.renderProductSections = renderProductSections;

async function loadProductSections() {
    await renderProductSections();
}
window.loadProductSections = loadProductSections;

async function saveProductSection(event) {
    event.preventDefault();
    
    const id = document.getElementById('sectionId').value;
    const title = document.getElementById('sectionTitle').value.trim();
    const subtitle = document.getElementById('sectionSubtitle').value.trim();
    const display_type = document.getElementById('sectionDisplayType').value;
    const products_per_page = parseInt(document.getElementById('sectionProductsPerPage').value) || 8;
    const category_filter = document.getElementById('sectionCategoryFilter').value;
    const sort_by = document.getElementById('sectionSortBy').value;
    const sort_order = document.getElementById('sectionSortOrder').value;
    const section_order = parseInt(document.getElementById('sectionOrder').value) || 0;
    const is_active = document.getElementById('sectionStatus').value === 'true';
    const show_arrows = document.getElementById('sectionShowArrows').checked;
    const show_dots = document.getElementById('sectionShowDots').checked;
    const autoplay = document.getElementById('sectionAutoplay').checked;
    const autoplay_speed = parseInt(document.getElementById('sectionAutoplaySpeed').value) || 3000;
    const bg_color = document.getElementById('sectionBgColor').value;
    const text_color = document.getElementById('sectionTextColor').value;
    
    if (!title) {
        showToast('⚠️ الرجاء إدخال عنوان القسم', 'warning');
        return;
    }
    
    const data = {
        title,
        subtitle: subtitle || null,
        display_type,
        products_per_page,
        category_filter: category_filter || null,
        sort_by,
        sort_order,
        section_order,
        is_active,
        show_arrows,
        show_dots,
        autoplay,
        autoplay_speed,
        bg_color: bg_color || null,
        text_color: text_color || null,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        let sectionId = id;
        
        if (id) {
            result = await supabase
                .from('product_sections')
                .update(data)
                .eq('id', id);
        } else {
            data.created_at = new Date().toISOString();
            result = await supabase
                .from('product_sections')
                .insert(data)
                .select();
            
            if (result.data && result.data.length > 0) {
                sectionId = result.data[0].id;
            }
        }
        
        if (result.error) throw result.error;
        
        if (sectionId) {
            await supabase
                .from('section_products')
                .delete()
                .eq('section_id', sectionId);
            
            const select = document.getElementById('sectionProductSelector');
            const selectedProducts = Array.from(select.selectedOptions).map(opt => opt.value);
            
            if (selectedProducts.length > 0) {
                const productsToInsert = selectedProducts.map((productId, index) => ({
                    section_id: sectionId,
                    product_id: productId,
                    display_order: index
                }));
                
                await supabase
                    .from('section_products')
                    .insert(productsToInsert);
            }
        }
        
        showToast(id ? '✅ تم تحديث القسم' : '✅ تم إضافة القسم', 'success');
        closeProductSectionModal();
        loadProductSections();
    } catch (error) {
        console.error('❌ خطأ في حفظ القسم:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.saveProductSection = saveProductSection;

async function editProductSection(id) {
    try {
        const { data, error } = await supabase
            .from('product_sections')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const { data: products } = await supabase
            .from('section_products')
            .select('product_id')
            .eq('section_id', id);
        
        const productIds = products?.map(p => p.product_id) || [];
        
        openProductSectionForm(data);
        
        setTimeout(() => {
            const select = document.getElementById('sectionProductSelector');
            if (select) {
                Array.from(select.options).forEach(option => {
                    option.selected = productIds.includes(option.value);
                });
            }
        }, 300);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.editProductSection = editProductSection;

async function deleteProductSection(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا القسم؟')) return;
    
    try {
        const { error } = await supabase
            .from('product_sections')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف القسم', 'success');
        loadProductSections();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.deleteProductSection = deleteProductSection;

async function toggleProductSection(id) {
    try {
        const section = productSections.find(s => s.id === id);
        if (!section) return;
        
        const { error } = await supabase
            .from('product_sections')
            .update({ is_active: !section.is_active })
            .eq('id', id);
        
        if (error) throw error;
        loadProductSections();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.toggleProductSection = toggleProductSection;

async function moveProductSection(id, direction) {
    try {
        const { data: sections } = await supabase
            .from('product_sections')
            .select('id, section_order')
            .order('section_order', { ascending: true });
        
        const index = sections.findIndex(s => s.id === id);
        if (index === -1) return;
        
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= sections.length) return;
        
        const temp = sections[index].section_order;
        sections[index].section_order = sections[targetIndex].section_order;
        sections[targetIndex].section_order = temp;
        
        for (const s of sections) {
            await supabase
                .from('product_sections')
                .update({ section_order: s.section_order })
                .eq('id', s.id);
        }
        
        loadProductSections();
        showToast('✅ تم تحديث الترتيب', 'success');
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.moveProductSection = moveProductSection;

function openProductSectionForm(data) {
    const modal = document.getElementById('productSectionModal');
    const title = document.getElementById('productSectionModalTitle');
    
    if (data) {
        title.textContent = '✏️ تعديل قسم المنتجات';
        document.getElementById('sectionId').value = data.id || '';
        document.getElementById('sectionTitle').value = data.title || '';
        document.getElementById('sectionSubtitle').value = data.subtitle || '';
        document.getElementById('sectionDisplayType').value = data.display_type || 'grid';
        document.getElementById('sectionProductsPerPage').value = data.products_per_page || 8;
        document.getElementById('sectionCategoryFilter').value = data.category_filter || '';
        document.getElementById('sectionSortBy').value = data.sort_by || 'created_at';
        document.getElementById('sectionSortOrder').value = data.sort_order || 'desc';
        document.getElementById('sectionOrder').value = data.section_order || 0;
        document.getElementById('sectionStatus').value = data.is_active ? 'true' : 'false';
        document.getElementById('sectionShowArrows').checked = data.show_arrows !== false;
        document.getElementById('sectionShowDots').checked = data.show_dots !== false;
        document.getElementById('sectionAutoplay').checked = data.autoplay || false;
        document.getElementById('sectionAutoplaySpeed').value = data.autoplay_speed || 3000;
        document.getElementById('sectionBgColor').value = data.bg_color || '#0A0A0F';
        document.getElementById('sectionTextColor').value = data.text_color || '#FFFFFF';
        document.getElementById('autoplaySpeedGroup').style.display = data.autoplay ? 'block' : 'none';
    } else {
        title.textContent = '➕ إضافة قسم منتجات';
        document.getElementById('productSectionForm').reset();
        document.getElementById('sectionId').value = '';
        document.getElementById('sectionDisplayType').value = 'grid';
        document.getElementById('sectionProductsPerPage').value = 8;
        document.getElementById('sectionOrder').value = 0;
        document.getElementById('sectionStatus').value = 'true';
        document.getElementById('sectionShowArrows').checked = true;
        document.getElementById('sectionShowDots').checked = true;
        document.getElementById('sectionAutoplay').checked = false;
        document.getElementById('sectionAutoplaySpeed').value = 3000;
        document.getElementById('sectionBgColor').value = '#0A0A0F';
        document.getElementById('sectionTextColor').value = '#FFFFFF';
        document.getElementById('autoplaySpeedGroup').style.display = 'none';
    }
    
    loadCategoriesForSelect('sectionCategoryFilter');
    loadProductsForSelect('sectionProductSelector');
    
    modal.classList.add('active');
}
window.openProductSectionForm = openProductSectionForm;

function closeProductSectionModal() {
    document.getElementById('productSectionModal').classList.remove('active');
}
window.closeProductSectionModal = closeProductSectionModal;

// ============================================
// تحميل التصنيفات والمنتجات للقوائم
// ============================================

async function loadCategoriesForSelect(selectId) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">جميع التصنيفات</option>';
            data.forEach(cat => {
                select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
            });
            if (currentValue) select.value = currentValue;
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل التصنيفات:', error);
    }
}
window.loadCategoriesForSelect = loadCategoriesForSelect;

async function loadProductsForSelect(selectId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '';
            data.forEach(product => {
                select.innerHTML += `<option value="${product.id}">${product.name}</option>`;
            });
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
    }
}
window.loadProductsForSelect = loadProductsForSelect;

// ============================================
// دوال التصدير والحفظ العامة
// ============================================
async function saveAllCustomizations() {
    await saveAdvancedColors();
    await saveFonts();
    await saveAllSettingsToSupabase();
    showToast('✅ تم حفظ جميع التخصيصات', 'success');
}
window.saveAllCustomizations = saveAllCustomizations;

function resetAllSettings() {
    if (!confirm('⚠️ هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) return;
    
    localStorage.removeItem('tithkari_theme');
    localStorage.removeItem('tithkari_layout');
    localStorage.removeItem('tithkari_custom_colors');
    localStorage.removeItem('tithkari_custom_fonts');
    localStorage.removeItem('tithkari_display_mode');
    localStorage.removeItem('tithkari_store_settings');
    localStorage.removeItem('tithkari_custom_css');
    localStorage.removeItem('tithkari_custom_js');
    localStorage.removeItem('tithkari_custom_theme');
    localStorage.removeItem('tithkari_display_settings');
    localStorage.removeItem('tithkari_branding');
    localStorage.removeItem('tithkari_background');
    localStorage.removeItem('tithkari_icons');
    localStorage.removeItem('tithkari_product_enhancements');
    
    if (confirm('هل تريد حذف الإعدادات من Supabase أيضاً؟')) {
        supabase.from('store_settings').delete().neq('id', '');
    }
    
    location.reload();
}
window.resetAllSettings = resetAllSettings;

function exportSettings() {
    const settings = {
        theme: selectedTheme,
        layout: selectedLayout,
        colors: allColors,
        fonts: customFonts,
        display: displaySettings,
        customCSS: customCSSContent,
        customJS: customJSContent,
        exportedAt: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tithkari_settings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ تم تصدير الإعدادات بنجاح', 'success');
}
window.exportSettings = exportSettings;

function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const settings = JSON.parse(event.target.result);
                
                if (settings.theme) {
                    await applyTheme(settings.theme);
                }
                if (settings.layout) {
                    await applyLayout(settings.layout);
                }
                if (settings.colors) {
                    allColors = settings.colors;
                    localStorage.setItem('tithkari_custom_colors', JSON.stringify(allColors));
                    await saveSettingsToSupabase('colors', allColors);
                    applyColorsToPage(allColors);
                    renderAdvancedColors();
                }
                if (settings.fonts) {
                    customFonts = settings.fonts;
                    localStorage.setItem('tithkari_custom_fonts', JSON.stringify(customFonts));
                    await saveSettingsToSupabase('fonts', customFonts);
                    applyFontsToPage(customFonts);
                }
                if (settings.display?.mode) {
                    await applyDisplayMode(settings.display.mode);
                }
                if (settings.customCSS) {
                    document.getElementById('customCssEditor').value = settings.customCSS;
                    document.getElementById('customCssPreview').textContent = settings.customCSS;
                    await saveSettingsToSupabase('custom_css', settings.customCSS);
                }
                if (settings.customJS) {
                    document.getElementById('customJsEditor').value = settings.customJS;
                    document.getElementById('customJsPreview').textContent = settings.customJS;
                    await saveSettingsToSupabase('custom_js', settings.customJS);
                }
                
                showToast('✅ تم استيراد الإعدادات بنجاح', 'success');
            } catch (err) {
                showToast('❌ ملف غير صالح', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
window.importSettings = importSettings;

// ============================================
// دوال إغلاق النوافذ
// ============================================
function closeBannerModal() {
    document.getElementById('bannerModal').classList.remove('active');
}
window.closeBannerModal = closeBannerModal;

function closeFooterItemModal() {
    document.getElementById('footerItemModal').classList.remove('active');
}
window.closeFooterItemModal = closeFooterItemModal;

// ============================================
// ===== دوال تطبيق الإعدادات الفورية =====
// ============================================

// ===== تطبيق الألوان الفورية =====
function applyColorsImmediately(colors) {
    const root = document.documentElement;
    
    if (!colors) return;
    
    Object.entries(colors).forEach(([key, value]) => {
        if (value) {
            root.style.setProperty(`--${key}`, value);
            
            if (key === 'primary') {
                document.querySelectorAll('.btn-primary, .btn-save, .gold-text').forEach(el => {
                    if (el.classList.contains('btn-primary') || el.classList.contains('btn-save')) {
                        el.style.background = `linear-gradient(135deg, ${value}, ${value}dd)`;
                    }
                    if (el.classList.contains('gold-text')) {
                        el.style.color = value;
                    }
                });
                document.querySelectorAll('.customize-header h1, .section-header h3, .settings-section h4, .theme-card.active').forEach(el => {
                    el.style.color = value;
                });
            }
            
            if (key === 'background') {
                document.body.style.background = value;
                document.querySelectorAll('.color-preview, .preview-body').forEach(el => {
                    el.style.background = value;
                });
            }
            
            if (key === 'surface') {
                document.querySelectorAll('.preview-card, .preview-header, .preview-footer, .settings-section, .section-card, .theme-card').forEach(el => {
                    el.style.background = value;
                });
            }
            
            if (key === 'text') {
                document.querySelectorAll('.preview-header span, .preview-info h4, .section-title-text, .theme-info h4').forEach(el => {
                    el.style.color = value;
                });
            }
            
            if (key === 'textSecondary') {
                document.querySelectorAll('.preview-info p, .preview-footer span, .section-subtitle-text, .theme-info p').forEach(el => {
                    el.style.color = value;
                });
            }
        }
    });
    
    updateColorPreview();
    console.log('✅ تم تطبيق الألوان الفورية');
}
window.applyColorsImmediately = applyColorsImmediately;

// ============================================
// ===== دالة تحديث معاينة الألوان =====
// ============================================
function updateColorPreview() {
    const preview = document.querySelector('.color-preview .preview-box');
    if (!preview) return;
    
    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue('--primary').trim() || '#FFD700';
    const background = root.getPropertyValue('--background').trim() || '#0F0F1A';
    const surface = root.getPropertyValue('--surface').trim() || '#1A1A2E';
    const text = root.getPropertyValue('--text').trim() || '#FFFFFF';
    const textSecondary = root.getPropertyValue('--textSecondary').trim() || '#8A8A9B';
    const border = root.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.08)';
    
    // تحديث معاينة الألوان في واجهة التخصيص
    const previewHeader = preview.querySelector('.preview-header');
    const previewBody = preview.querySelector('.preview-body');
    const previewFooter = preview.querySelector('.preview-footer');
    const previewCard = preview.querySelector('.preview-card');
    const previewCardInfo = preview.querySelector('.preview-card .preview-info');
    const previewCardPrice = preview.querySelector('.preview-card .preview-price');
    const previewCardBtn = preview.querySelector('.preview-card .preview-card-btn');
    const previewLogo = preview.querySelector('.preview-logo');
    const previewNav = preview.querySelector('.preview-nav');
    
    if (previewHeader) {
        previewHeader.style.background = surface;
        previewHeader.style.borderBottom = `1px solid ${border}`;
        if (previewLogo) previewLogo.style.color = primary;
        if (previewNav) previewNav.style.color = textSecondary;
    }
    
    if (previewBody) {
        previewBody.style.background = background;
    }
    
    if (previewFooter) {
        previewFooter.style.background = surface;
        previewFooter.style.color = textSecondary;
        previewFooter.style.borderTop = `1px solid ${border}`;
    }
    
    if (previewCard) {
        previewCard.style.background = surface;
        previewCard.style.borderColor = border;
    }
    
    if (previewCardInfo) {
        const h4 = previewCardInfo.querySelector('h4');
        const p = previewCardInfo.querySelector('p');
        if (h4) h4.style.color = text;
        if (p) p.style.color = textSecondary;
    }
    
    if (previewCardPrice) {
        previewCardPrice.style.color = primary;
    }
    
    if (previewCardBtn) {
        previewCardBtn.style.background = primary;
        previewCardBtn.style.color = '#FFFFFF';
    }
    
    console.log('✅ تم تحديث معاينة الألوان');
}
window.updateColorPreview = updateColorPreview;

// ===== تطبيق الخطوط الفورية =====
function applyFontsImmediately(fonts) {
    if (!fonts) return;
    
    const primaryFont = fonts.primary || 'Cairo';
    const secondaryFont = fonts.secondary || 'Tajawal';
    const primarySize = fonts.primary_size || 16;
    const secondarySize = fonts.secondary_size || 14;
    
    document.body.style.fontFamily = primaryFont + ', sans-serif';
    
    document.querySelectorAll('h1, h2, h3, h4, .logo-text, .section-title, .theme-info h4, .section-title-text').forEach(el => {
        el.style.fontFamily = primaryFont + ', sans-serif';
    });
    
    document.querySelectorAll('p, span, a, button, input, textarea, select, label, .subtitle, .section-subtitle-text, .theme-info p').forEach(el => {
        if (!el.closest('h1, h2, h3, h4, .logo-text, .section-title')) {
            el.style.fontFamily = secondaryFont + ', sans-serif';
        }
    });
    
    document.querySelectorAll('.preview-text p:first-child, h1, h2, .section-title').forEach(el => {
        el.style.fontSize = (primarySize + 8) + 'px';
    });
    document.querySelectorAll('.preview-text p:nth-child(2), p, .subtitle').forEach(el => {
        el.style.fontSize = primarySize + 'px';
    });
    document.querySelectorAll('.preview-text p:last-child, small, .help-text, .section-subtitle-text').forEach(el => {
        el.style.fontSize = secondarySize + 'px';
    });
    
    updateFontPreview();
    console.log('✅ تم تطبيق الخطوط الفورية');
}
window.applyFontsImmediately = applyFontsImmediately;

// ===== تطبيق هوية المتجر الفورية =====
function applyBrandingImmediately(branding) {
    if (!branding) return;
    
    if (branding.storeName) {
        document.querySelectorAll('.logo-text, .store-name, .customize-header h1 span').forEach(el => {
            el.textContent = branding.storeName;
        });
        document.title = `🎨 تخصيص المتجر - ${branding.storeName}`;
    }
    
    if (branding.logo) {
        const logoImg = document.querySelector('.store-logo');
        if (logoImg) {
            logoImg.src = branding.logo;
            logoImg.style.display = 'block';
            const logoIcon = document.querySelector('.logo i');
            if (logoIcon) logoIcon.style.display = 'none';
        }
        document.getElementById('advLogoPreview').innerHTML = `
            <img src="${branding.logo}" style="max-width:150px;max-height:100px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" />
        `;
    }
    
    if (branding.storeDescription) {
        document.querySelectorAll('.store-description, .hero-description').forEach(el => {
            el.textContent = branding.storeDescription;
        });
    }
    
    if (branding.storeSlogan) {
        document.querySelectorAll('.store-slogan, .hero-title').forEach(el => {
            el.textContent = branding.storeSlogan;
        });
    }
    
    console.log('✅ تم تطبيق هوية المتجر الفورية');
}
window.applyBrandingImmediately = applyBrandingImmediately;

// ===== تطبيق الخلفية الفورية =====
function applyBackgroundImmediately(background) {
    if (!background) return;
    
    if (background.type === 'color' && background.color) {
        document.body.style.background = background.color;
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundSize = 'auto';
        document.body.style.backgroundAttachment = 'auto';
    } else if (background.type === 'gradient' && background.gradient) {
        const [start, end] = background.gradient.split(',');
        document.body.style.background = `linear-gradient(135deg, ${start}, ${end})`;
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundSize = 'auto';
        document.body.style.backgroundAttachment = 'auto';
    } else if (background.type === 'image' && background.image) {
        document.body.style.background = `url('${background.image}') center/cover fixed`;
        document.body.style.backgroundAttachment = 'fixed';
    } else if (background.type === 'pattern') {
        document.body.style.background = `url('${background.image || ''}') repeat`;
        document.body.style.backgroundSize = 'auto';
        document.body.style.backgroundAttachment = 'auto';
    }
    
    if (background.image) {
        document.getElementById('advBgImagePreview').innerHTML = `
            <img src="${background.image}" style="max-width:200px;max-height:120px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" />
        `;
    }
    
    console.log('✅ تم تطبيق الخلفية الفورية');
}
window.applyBackgroundImmediately = applyBackgroundImmediately;

// ===== تطبيق الأيقونات الفورية =====
function applyIconsImmediately(icons) {
    if (!icons) return;
    
    const iconColor = icons.color || '#FFD700';
    const iconSize = icons.size || 'medium';
    const isRounded = icons.rounded !== false;
    const hasGlow = icons.glow || false;
    const style = icons.style || 'solid';
    
    const sizes = { small: '14px', medium: '18px', large: '24px', xlarge: '32px' };
    
    document.querySelectorAll('.fa, .fas, .far, .fal, .fab, .fa-solid, .fa-regular, .fa-light, .fa-duotone').forEach(icon => {
        icon.style.color = iconColor;
        icon.style.fontSize = sizes[iconSize] || '18px';
        
        if (isRounded) {
            icon.style.borderRadius = '50%';
            icon.style.padding = '6px';
            icon.style.background = `rgba(255,215,0,0.05)`;
        } else {
            icon.style.borderRadius = '0';
            icon.style.padding = '0';
            icon.style.background = 'transparent';
        }
        
        if (hasGlow) {
            icon.style.filter = `drop-shadow(0 0 12px ${iconColor})`;
        } else {
            icon.style.filter = 'none';
        }
    });
    
    document.documentElement.style.setProperty('--icon-color', iconColor);
    console.log('✅ تم تطبيق الأيقونات الفورية');
}
window.applyIconsImmediately = applyIconsImmediately;

// ===== تطبيق تحسينات المنتجات الفورية =====
function applyProductEnhancementsImmediately(enhancements) {
    if (!enhancements) return;
    
    document.querySelectorAll('.customize-btn-bottom, .customize-btn-small, .customize-btn, .action-btn.customize-btn').forEach(el => {
        el.style.display = enhancements.show_customize_button !== false ? 'flex' : 'none';
    });
    
    const descLines = enhancements.description_lines || 2;
    document.querySelectorAll('.product-desc, .product-info p.description, .preview-info p').forEach(el => {
        if (descLines > 0) {
            el.style.display = '-webkit-box';
            el.style.webkitLineClamp = descLines;
            el.style.webkitBoxOrient = 'vertical';
            el.style.overflow = 'hidden';
        } else {
            el.style.display = 'block';
            el.style.webkitLineClamp = 'unset';
            el.style.overflow = 'visible';
        }
    });
    
    const imgSize = enhancements.image_size || 'medium';
    const sizes = { small: '150px', medium: '220px', large: '280px' };
    document.querySelectorAll('.product-image, .product-card .product-image, .preview-image').forEach(el => {
        el.style.height = sizes[imgSize] || '220px';
        el.style.minHeight = sizes[imgSize] || '220px';
    });
    
    const cardStyle = enhancements.card_style || 'default';
    document.querySelectorAll('.product-card, .preview-card').forEach(el => {
        el.className = el.className.replace(/card-style-\w+/g, '').trim() + ` card-style-${cardStyle}`;
        if (cardStyle === 'compact') {
            el.style.padding = '8px';
            el.style.borderRadius = '8px';
            el.style.gap = '4px';
        } else if (cardStyle === 'elegant') {
            el.style.border = '2px solid var(--gold)';
            el.style.boxShadow = '0 0 30px rgba(255,215,0,0.05)';
            el.style.borderRadius = '12px';
            el.style.padding = '16px';
        } else if (cardStyle === 'modern') {
            el.style.borderRadius = '0';
            el.style.borderBottom = '3px solid var(--gold)';
            el.style.padding = '12px';
            el.style.background = 'rgba(255,255,255,0.02)';
        } else {
            el.style.border = '1px solid rgba(255,215,0,0.05)';
            el.style.borderRadius = '12px';
            el.style.boxShadow = 'none';
            el.style.padding = '';
            el.style.background = '';
        }
    });
    
    document.querySelectorAll('.product-promo-badge, .discount-badge, .sale-badge, .badge-discount').forEach(el => {
        el.style.display = enhancements.show_discount_badge !== false ? 'block' : 'none';
    });
    
    document.querySelectorAll('.quick-view-btn, .quick-view, .btn-quick-view').forEach(el => {
        el.style.display = enhancements.show_quick_view !== false ? 'block' : 'none';
    });
    
    document.querySelectorAll('.stock-display, .product-stock, .stock-badge').forEach(el => {
        el.style.display = enhancements.show_stock ? 'block' : 'none';
    });
    
    document.querySelectorAll('.rating-display, .product-rating, .rating-stars').forEach(el => {
        el.style.display = enhancements.show_rating !== false ? 'block' : 'none';
    });
    
    console.log('✅ تم تطبيق تحسينات المنتجات الفورية');
}
window.applyProductEnhancementsImmediately = applyProductEnhancementsImmediately;

// ============================================
// ===== الإعدادات المتقدمة =====
// ============================================

async function loadAdvancedSettings() {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .in('key', ['branding', 'background', 'icons', 'product_enhancements', 'custom_css', 'custom_js', 'display_settings']);
        
        if (error) throw error;
        
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });
        
        applyAdvancedSettingsToForm(settings);
        
        if (settings.branding) {
            applyBrandingImmediately(settings.branding);
            localStorage.setItem('tithkari_branding', JSON.stringify(settings.branding));
        }
        if (settings.background) {
            applyBackgroundImmediately(settings.background);
            localStorage.setItem('tithkari_background', JSON.stringify(settings.background));
        }
        if (settings.icons) {
            applyIconsImmediately(settings.icons);
            localStorage.setItem('tithkari_icons', JSON.stringify(settings.icons));
        }
        if (settings.product_enhancements) {
            applyProductEnhancementsImmediately(settings.product_enhancements);
            localStorage.setItem('tithkari_product_enhancements', JSON.stringify(settings.product_enhancements));
        }
        if (settings.custom_css) {
            document.getElementById('customCssEditor').value = settings.custom_css;
            document.getElementById('customCssPreview').textContent = settings.custom_css;
        }
        if (settings.custom_js) {
            document.getElementById('customJsEditor').value = settings.custom_js;
            document.getElementById('customJsPreview').textContent = settings.custom_js;
        }
        if (settings.display_settings) {
            loadDisplaySettingsFromData(settings.display_settings);
        }
        
        return settings;
    } catch (error) {
        console.error('❌ خطأ في تحميل الإعدادات المتقدمة:', error);
        loadAdvancedSettingsFromStorage();
        return {};
    }
}
window.loadAdvancedSettings = loadAdvancedSettings;

function applyAdvancedSettingsToForm(settings) {
    if (settings.branding) {
        document.getElementById('advStoreName').value = settings.branding.storeName || '';
        document.getElementById('advLogoUrl').value = settings.branding.logo || '';
        document.getElementById('advFavicon').value = settings.branding.favicon || '';
        document.getElementById('advStoreDescription').value = settings.branding.storeDescription || '';
        document.getElementById('advStoreSlogan').value = settings.branding.storeSlogan || '';
        document.getElementById('advContactEmail').value = settings.branding.contactEmail || '';
        document.getElementById('advContactPhone').value = settings.branding.contactPhone || '';
        
        if (settings.branding.logo) {
            document.getElementById('advLogoPreview').innerHTML = `
                <img src="${settings.branding.logo}" style="max-width:150px;max-height:100px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" />
            `;
        }
    }
    
    if (settings.background) {
        document.getElementById('advBgType').value = settings.background.type || 'color';
        document.getElementById('advBgColor').value = settings.background.color || '#0F0F1A';
        if (settings.background.gradient) {
            const [start, end] = settings.background.gradient.split(',');
            document.getElementById('advBgGradientStart').value = start || '#0F0F1A';
            document.getElementById('advBgGradientEnd').value = end || '#1A1A2E';
        }
        document.getElementById('advBgImageUrl').value = settings.background.image || '';
        toggleBgFields(settings.background.type || 'color');
    }
    
    if (settings.icons) {
        document.getElementById('advIconStyle').value = settings.icons.style || 'solid';
        document.getElementById('advIconColor').value = settings.icons.color || '#FFD700';
        document.getElementById('advIconSize').value = settings.icons.size || 'medium';
        document.getElementById('advIconRounded').checked = settings.icons.rounded !== false;
        document.getElementById('advIconGlow').checked = settings.icons.glow || false;
    }
    
    if (settings.product_enhancements) {
        document.getElementById('advShowDiscount').checked = settings.product_enhancements.show_discount_badge !== false;
        document.getElementById('advShowCustomize').checked = settings.product_enhancements.show_customize_button !== false;
        document.getElementById('advShowQuickView').checked = settings.product_enhancements.show_quick_view !== false;
        document.getElementById('advImageZoom').checked = settings.product_enhancements.image_zoom !== false;
        document.getElementById('advImageGallery').checked = settings.product_enhancements.image_gallery !== false;
        document.getElementById('advDescriptionLines').value = settings.product_enhancements.description_lines || 2;
        document.getElementById('advImageSize').value = settings.product_enhancements.image_size || 'medium';
        document.getElementById('advCardStyle').value = settings.product_enhancements.card_style || 'default';
        document.getElementById('advShowStock').checked = settings.product_enhancements.show_stock || false;
        document.getElementById('advShowRating').checked = settings.product_enhancements.show_rating !== false;
    }
    
    if (settings.custom_css) {
        customCSSContent = settings.custom_css;
        document.getElementById('customCssEditor').value = settings.custom_css;
        document.getElementById('customCssPreview').textContent = settings.custom_css || '// لا يوجد كود CSS مخصص';
    }
    
    if (settings.custom_js) {
        customJSContent = settings.custom_js;
        document.getElementById('customJsEditor').value = settings.custom_js;
        document.getElementById('customJsPreview').textContent = settings.custom_js || '// لا يوجد كود JavaScript مخصص';
    }
    
    if (settings.display_settings) {
        loadDisplaySettingsFromData(settings.display_settings);
    }
}

function toggleBgFields(type) {
    document.getElementById('advBgColorGroup').style.display = type === 'color' ? 'block' : 'none';
    document.getElementById('advBgGradientGroup').style.display = type === 'gradient' ? 'block' : 'none';
    document.getElementById('advBgImageGroup').style.display = type === 'image' || type === 'pattern' ? 'block' : 'none';
}

// ===== دالة حفظ وتطبيق الإعدادات المتقدمة =====
async function saveAdvancedSettings() {
    try {
        showToast('⏳ جاري حفظ وتطبيق الإعدادات...', 'info');
        
        const branding = {
            storeName: document.getElementById('advStoreName')?.value?.trim() || '',
            logo: document.getElementById('advLogoUrl')?.value?.trim() || '',
            favicon: document.getElementById('advFavicon')?.value?.trim() || '',
            storeDescription: document.getElementById('advStoreDescription')?.value?.trim() || '',
            storeSlogan: document.getElementById('advStoreSlogan')?.value?.trim() || '',
            contactEmail: document.getElementById('advContactEmail')?.value?.trim() || '',
            contactPhone: document.getElementById('advContactPhone')?.value?.trim() || ''
        };
        
        const logoFile = document.getElementById('advLogoFile')?.files[0];
        if (logoFile) {
            const uploaded = await uploadProductImage(logoFile);
            if (uploaded) {
                branding.logo = uploaded;
            }
        }
        
        const background = {
            type: document.getElementById('advBgType')?.value || 'color',
            color: document.getElementById('advBgColor')?.value || '#0F0F1A',
            gradient: `${document.getElementById('advBgGradientStart')?.value || '#0F0F1A'},${document.getElementById('advBgGradientEnd')?.value || '#1A1A2E'}`,
            image: document.getElementById('advBgImageUrl')?.value?.trim() || ''
        };
        
        const bgFile = document.getElementById('advBgImageFile')?.files[0];
        if (bgFile) {
            const uploaded = await uploadProductImage(bgFile);
            if (uploaded) {
                background.image = uploaded;
            }
        }
        
        const icons = {
            style: document.getElementById('advIconStyle')?.value || 'solid',
            color: document.getElementById('advIconColor')?.value || '#FFD700',
            size: document.getElementById('advIconSize')?.value || 'medium',
            rounded: document.getElementById('advIconRounded')?.checked !== false,
            glow: document.getElementById('advIconGlow')?.checked || false
        };
        
        const product_enhancements = {
            show_discount_badge: document.getElementById('advShowDiscount')?.checked !== false,
            show_customize_button: document.getElementById('advShowCustomize')?.checked !== false,
            show_quick_view: document.getElementById('advShowQuickView')?.checked !== false,
            image_zoom: document.getElementById('advImageZoom')?.checked !== false,
            image_gallery: document.getElementById('advImageGallery')?.checked !== false,
            description_lines: parseInt(document.getElementById('advDescriptionLines')?.value) || 2,
            image_size: document.getElementById('advImageSize')?.value || 'medium',
            card_style: document.getElementById('advCardStyle')?.value || 'default',
            show_stock: document.getElementById('advShowStock')?.checked || false,
            show_rating: document.getElementById('advShowRating')?.checked !== false
        };
        
        // تطبيق الإعدادات فوراً
        applyBrandingImmediately(branding);
        applyBackgroundImmediately(background);
        applyIconsImmediately(icons);
        applyProductEnhancementsImmediately(product_enhancements);
        
        // حفظ في Supabase
        const results = await Promise.all([
            saveSettingsToSupabase('branding', branding),
            saveSettingsToSupabase('background', background),
            saveSettingsToSupabase('icons', icons),
            saveSettingsToSupabase('product_enhancements', product_enhancements)
        ]);
        
        const allSaved = results.every(r => r === true);
        
        if (allSaved) {
            showToast('✅ تم حفظ وتطبيق جميع الإعدادات بنجاح!', 'success');
            if (window.parent && window.parent.applyAdvancedSettingsToStore) {
                window.parent.applyAdvancedSettingsToStore({ branding, background, icons, product_enhancements });
            }
        } else {
            showToast('⚠️ حدث خطأ في حفظ بعض الإعدادات', 'warning');
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ الإعدادات:', error);
        showToast('❌ حدث خطأ في حفظ الإعدادات', 'error');
    }
}
window.saveAdvancedSettings = saveAdvancedSettings;

// ============================================
// معاينة الصور عند الرفع
// ============================================
function setupImagePreviews() {
    const logoFile = document.getElementById('advLogoFile');
    if (logoFile) {
        logoFile.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    document.getElementById('advLogoUrl').value = ev.target.result;
                    document.getElementById('advLogoPreview').innerHTML = `
                        <img src="${ev.target.result}" style="max-width:150px;max-height:100px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" />
                    `;
                    applyBrandingImmediately({ logo: ev.target.result });
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    const bgFile = document.getElementById('advBgImageFile');
    if (bgFile) {
        bgFile.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    document.getElementById('advBgImageUrl').value = ev.target.result;
                    document.getElementById('advBgImagePreview').innerHTML = `
                        <img src="${ev.target.result}" style="max-width:200px;max-height:120px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" />
                    `;
                    applyBackgroundImmediately({ image: ev.target.result, type: 'image' });
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// ============================================
// ===== تخصيص الثيم المتقدم =====
// ============================================

// الألوان الافتراضية للثيم
const DEFAULT_THEME_COLORS = {
    primary: '#1E88E5',
    primaryDark: '#1565C0',
    primaryLight: '#64B5F6',
    secondary: '#FF6F00',
    secondaryDark: '#E65100',
    secondaryLight: '#FFA726',
    background: '#0A0A0F',
    backgroundSecondary: '#14141E',
    surface: '#1A1A2E',
    surfaceLight: '#252540',
    text: '#FFFFFF',
    textSecondary: '#8A8A9B',
    textMuted: '#6B6B7B',
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.05)',
    shadow: '0 8px 32px rgba(0,0,0,0.4)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    cardBackground: '#1A1A2E',
    cardBorder: 'rgba(255,255,255,0.05)',
    buttonPrimary: '#1E88E5',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: '#FF6F00',
    buttonSecondaryText: '#FFFFFF',
    buttonHover: '#1565C0',
    linkColor: '#64B5F6',
    linkHover: '#1E88E5'
};

// تحميل ألوان الثيم المخصص
function loadCustomThemeColors() {
    try {
        const saved = JSON.parse(localStorage.getItem('tithkari_custom_theme') || '{}');
        return { ...DEFAULT_THEME_COLORS, ...saved };
    } catch (e) {
        return DEFAULT_THEME_COLORS;
    }
}
window.loadCustomThemeColors = loadCustomThemeColors;

// تطبيق ألوان الثيم المخصص
function applyCustomThemeColors(colors) {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
        if (value) {
            root.style.setProperty(`--${key}`, value);
        }
    });
    updateThemePreview(colors);
}
window.applyCustomThemeColors = applyCustomThemeColors;

// تحديث لون الثيم
function updateThemeColor(key, value) {
    const customTheme = loadCustomThemeColors();
    customTheme[key] = value;
    localStorage.setItem('tithkari_custom_theme', JSON.stringify(customTheme));
    
    document.documentElement.style.setProperty(`--${key}`, value);
    updateThemePreview(customTheme);
    
    const textInput = document.getElementById(`tc_${key}_text`);
    if (textInput) {
        textInput.value = value;
    }
    
    // تحديث لون الأزرار في المعاينة
    if (key === 'buttonPrimary') {
        document.querySelectorAll('.preview-card-btn').forEach(btn => {
            btn.style.background = value;
        });
    }
    if (key === 'buttonPrimaryText') {
        document.querySelectorAll('.preview-card-btn').forEach(btn => {
            btn.style.color = value;
        });
    }
    if (key === 'buttonHover') {
        document.querySelectorAll('.preview-card-btn').forEach(btn => {
            btn.style.background = value;
        });
    }
    
    console.log(`✅ تم تحديث اللون ${key} إلى ${value}`);
}
window.updateThemeColor = updateThemeColor;

// تحديث معاينة الثيم
function updateThemePreview(colors) {
    const previewHeader = document.querySelector('.preview-header');
    if (previewHeader) {
        previewHeader.style.background = colors.surface || '#1A1A2E';
        previewHeader.style.borderBottom = `1px solid ${colors.border || 'rgba(255,255,255,0.05)'}`;
    }
    
    const previewLogo = document.querySelector('.preview-logo');
    if (previewLogo) {
        previewLogo.style.color = colors.primary || '#FFD700';
    }
    
    const previewNav = document.querySelector('.preview-nav');
    if (previewNav) {
        previewNav.style.color = colors.textSecondary || '#8A8A9B';
    }
    
    const previewBody = document.querySelector('.preview-body');
    if (previewBody) {
        previewBody.style.background = colors.background || '#0F0F1A';
    }
    
    document.querySelectorAll('.preview-card').forEach(card => {
        card.style.background = colors.cardBackground || '#1A1A2E';
        card.style.borderColor = colors.cardBorder || 'rgba(255,255,255,0.05)';
    });
    
    document.querySelectorAll('.preview-card-content h4').forEach(el => {
        el.style.color = colors.text || '#FFFFFF';
    });
    
    document.querySelectorAll('.preview-card-content p').forEach(el => {
        el.style.color = colors.textSecondary || '#8A8A9B';
    });
    
    document.querySelectorAll('.preview-card-price').forEach(el => {
        el.style.color = colors.primary || '#FFD700';
    });
    
    document.querySelectorAll('.preview-card-btn').forEach(btn => {
        btn.style.background = colors.buttonPrimary || '#1E88E5';
        btn.style.color = colors.buttonPrimaryText || '#FFFFFF';
    });
    
    const previewFooter = document.querySelector('.preview-footer');
    if (previewFooter) {
        previewFooter.style.background = colors.surface || '#1A1A2E';
        previewFooter.style.color = colors.textSecondary || '#8A8A9B';
        previewFooter.style.borderTop = `1px solid ${colors.border || 'rgba(255,255,255,0.05)'}`;
    }
}
window.updateThemePreview = updateThemePreview;

// ============================================
// تحميل الألوان في نموذج التخصيص (مع تصفية القيم غير الصالحة)
// ============================================
function loadThemeColorsToForm() {
    const colors = loadCustomThemeColors();
    const container = document.getElementById('themeCustomizerGrid');
    if (!container) return;
    
    // دالة للتحقق من صحة قيمة اللون
    function isValidColor(value) {
        if (!value) return false;
        // التحقق من صيغة hex (#RRGGBB)
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) return true;
        // التحقق من صيغة hex المختصرة (#RGB)
        if (/^#[0-9A-Fa-f]{3}$/.test(value)) return true;
        // القيم التي تبدأ بـ rgb أو rgba غير مدعومة في input[type="color"]
        if (/^rgb/.test(value)) return false;
        // القيم التي تحتوي على مسافات أو كلمات مثل shadow غير مدعومة
        if (/\s/.test(value)) return false;
        return false;
    }
    
    // دالة للحصول على قيمة لون صالحة
    function getValidColor(value, defaultValue = '#000000') {
        if (isValidColor(value)) return value;
        return defaultValue;
    }
    
    const colorGroups = {
        'الأساسية': ['primary', 'primaryDark', 'primaryLight', 'secondary', 'secondaryDark', 'secondaryLight'],
        'الخلفيات': ['background', 'backgroundSecondary', 'surface', 'surfaceLight'],
        'النصوص': ['text', 'textSecondary', 'textMuted'],
        'الحدود والظلال': ['border', 'borderLight', 'shadow'],
        'الحالات': ['success', 'warning', 'error', 'info'],
        'البطاقات': ['cardBackground', 'cardBorder'],
        'الأزرار': ['buttonPrimary', 'buttonPrimaryText', 'buttonSecondary', 'buttonSecondaryText', 'buttonHover'],
        'الروابط': ['linkColor', 'linkHover']
    };
    
    const colorLabels = {
        primary: 'الرئيسي', primaryDark: 'الرئيسي غامق', primaryLight: 'الرئيسي فاتح',
        secondary: 'الثانوي', secondaryDark: 'الثانوي غامق', secondaryLight: 'الثانوي فاتح',
        background: 'الخلفية', backgroundSecondary: 'الخلفية الثانوية', surface: 'السطح', surfaceLight: 'السطح الفاتح',
        text: 'النص', textSecondary: 'النص الثانوي', textMuted: 'النص الباهت',
        border: 'الحدود', borderLight: 'الحدود الفاتحة', shadow: 'الظل',
        success: 'نجاح', warning: 'تحذير', error: 'خطأ', info: 'معلومات',
        cardBackground: 'خلفية البطاقة', cardBorder: 'حدود البطاقة',
        buttonPrimary: 'الزر الرئيسي', buttonPrimaryText: 'نص الزر الرئيسي', buttonSecondary: 'الزر الثانوي', buttonSecondaryText: 'نص الزر الثانوي', buttonHover: 'الزر عند التمرير',
        linkColor: 'الرابط', linkHover: 'الرابط عند التمرير'
    };
    
    let html = '';
    Object.entries(colorGroups).forEach(([groupName, keys]) => {
        html += `<div class="customizer-section"><h4>🎨 ${groupName}</h4><div class="color-group">`;
        keys.forEach(key => {
            const originalValue = colors[key] || '#000000';
            const validValue = getValidColor(originalValue, '#000000');
            // إذا كانت القيمة غير صالحة، سجل تحذيراً
            if (originalValue !== validValue) {
                console.warn(`⚠️ قيمة غير صالحة للون ${key}: "${originalValue}"، تم استبدالها بـ "${validValue}"`);
            }
            html += `
                <div class="color-item">
                    <label>${colorLabels[key] || key}</label>
                    <input type="color" id="tc_${key}" value="${validValue}" onchange="updateThemeColor('${key}', this.value)" />
                    <input type="text" id="tc_${key}_text" value="${validValue}" onchange="document.getElementById('tc_${key}').value=this.value;updateThemeColor('${key}',this.value)" />
                </div>
            `;
        });
        html += `</div></div>`;
    });
    
    container.innerHTML = html;
    applyCustomThemeColors(colors);
}
window.loadThemeColorsToForm = loadThemeColorsToForm;

// حفظ الثيم المخصص
async function saveCustomTheme() {
    const colors = {};
    const colorKeys = Object.keys(DEFAULT_THEME_COLORS);
    colorKeys.forEach(key => {
        const input = document.getElementById(`tc_${key}`);
        if (input) {
            colors[key] = input.value;
        }
    });
    
    localStorage.setItem('tithkari_custom_theme', JSON.stringify(colors));
    
    await saveSettingsToSupabase('theme', {
        name: 'custom',
        colors: colors
    });
    
    showToast('✅ تم حفظ الثيم المخصص بنجاح!', 'success');
    applyCustomThemeColors(colors);
}
window.saveCustomTheme = saveCustomTheme;

// إعادة تعيين الثيم
function resetCustomTheme() {
    if (!confirm('⚠️ هل أنت متأكد من إعادة تعيين الثيم إلى الإعدادات الافتراضية؟')) return;
    
    localStorage.removeItem('tithkari_custom_theme');
    
    const colorKeys = Object.keys(DEFAULT_THEME_COLORS);
    colorKeys.forEach(key => {
        const value = DEFAULT_THEME_COLORS[key];
        const colorInput = document.getElementById(`tc_${key}`);
        const textInput = document.getElementById(`tc_${key}_text`);
        if (colorInput) {
            colorInput.value = value;
        }
        if (textInput) {
            textInput.value = value;
        }
    });
    
    applyCustomThemeColors(DEFAULT_THEME_COLORS);
    showToast('✅ تم إعادة تعيين الثيم إلى الإعدادات الافتراضية', 'success');
    
    saveSettingsToSupabase('theme', {
        name: 'dark',
        colors: THEMES.dark.colors
    });
}
window.resetCustomTheme = resetCustomTheme;

// تصدير الثيم
function exportCustomTheme() {
    const colors = loadCustomThemeColors();
    const themeData = {
        name: 'custom',
        colors: colors,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tithkari_theme_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ تم تصدير الثيم بنجاح', 'success');
}
window.exportCustomTheme = exportCustomTheme;

// استيراد الثيم
function importCustomTheme() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const themeData = JSON.parse(event.target.result);
                if (themeData.colors) {
                    const colors = { ...DEFAULT_THEME_COLORS, ...themeData.colors };
                    localStorage.setItem('tithkari_custom_theme', JSON.stringify(colors));
                    
                    const colorKeys = Object.keys(colors);
                    colorKeys.forEach(key => {
                        const value = colors[key];
                        const colorInput = document.getElementById(`tc_${key}`);
                        const textInput = document.getElementById(`tc_${key}_text`);
                        if (colorInput) {
                            colorInput.value = value;
                        }
                        if (textInput) {
                            textInput.value = value;
                        }
                    });
                    
                    applyCustomThemeColors(colors);
                    showToast('✅ تم استيراد الثيم بنجاح', 'success');
                } else {
                    showToast('❌ ملف غير صالح', 'error');
                }
            } catch (err) {
                showToast('❌ ملف غير صالح', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
window.importCustomTheme = importCustomTheme;

// ============================================
// ===== CSS مخصص =====
// ============================================

function loadCustomCSS() {
    try {
        const saved = localStorage.getItem('tithkari_custom_css') || '';
        customCSSContent = saved;
        const editor = document.getElementById('customCssEditor');
        if (editor) {
            editor.value = saved;
        }
        document.getElementById('customCssPreview').textContent = saved || '// لا يوجد كود CSS مخصص';
        return saved;
    } catch (e) {
        return '';
    }
}
window.loadCustomCSS = loadCustomCSS;

async function saveCustomCSS() {
    const editor = document.getElementById('customCssEditor');
    const css = editor.value;
    customCSSContent = css;
    localStorage.setItem('tithkari_custom_css', css);
    document.getElementById('customCssPreview').textContent = css || '// لا يوجد كود CSS مخصص';
    await saveSettingsToSupabase('custom_css', css);
    showToast('✅ تم حفظ CSS المخصص بنجاح!', 'success');
}
window.saveCustomCSS = saveCustomCSS;

function previewCustomCSS() {
    const css = document.getElementById('customCssEditor').value;
    const style = document.getElementById('customCssPreviewStyle') || (() => {
        const s = document.createElement('style');
        s.id = 'customCssPreviewStyle';
        document.head.appendChild(s);
        return s;
    })();
    style.textContent = css;
    showToast('👀 تم تطبيق CSS للمعاينة', 'info');
}
window.previewCustomCSS = previewCustomCSS;

function applyCustomCSS() {
    const css = document.getElementById('customCssEditor').value;
    const style = document.getElementById('customCssStyle') || (() => {
        const s = document.createElement('style');
        s.id = 'customCssStyle';
        document.head.appendChild(s);
        return s;
    })();
    style.textContent = css;
    localStorage.setItem('tithkari_custom_css', css);
    showToast('✅ تم تطبيق CSS المخصص بنجاح!', 'success');
}
window.applyCustomCSS = applyCustomCSS;

function exportCustomCSS() {
    const css = document.getElementById('customCssEditor').value;
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-style-${Date.now()}.css`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ تم تصدير CSS بنجاح', 'success');
}
window.exportCustomCSS = exportCustomCSS;

function resetCustomCSS() {
    if (!confirm('⚠️ هل أنت متأكد من إعادة تعيين CSS المخصص؟')) return;
    document.getElementById('customCssEditor').value = '';
    localStorage.removeItem('tithkari_custom_css');
    document.getElementById('customCssPreview').textContent = '// لا يوجد كود CSS مخصص';
    const style = document.getElementById('customCssStyle');
    if (style) style.textContent = '';
    showToast('✅ تم إعادة تعيين CSS المخصص', 'success');
}
window.resetCustomCSS = resetCustomCSS;

function loadCSSExample(type) {
    const examples = {
        modern: `.product-card {\n    border-radius: 16px;\n    background: linear-gradient(145deg, var(--surface), var(--surfaceLight));\n    box-shadow: 0 8px 32px rgba(0,0,0,0.3);\n    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);\n}\n.product-card:hover {\n    transform: translateY(-10px) scale(1.02);\n    box-shadow: 0 20px 60px rgba(0,0,0,0.4);\n}\n.btn-primary {\n    background: linear-gradient(135deg, var(--primary), var(--primaryDark));\n    border-radius: 50px;\n    padding: 12px 30px;\n    font-weight: 700;\n    letter-spacing: 1px;\n    text-transform: uppercase;\n    transition: all 0.3s ease;\n}\n.btn-primary:hover {\n    transform: translateY(-3px);\n    box-shadow: 0 10px 30px rgba(30,136,229,0.4);\n}`,
        glass: `.product-card {\n    background: rgba(255,255,255,0.05);\n    backdrop-filter: blur(20px);\n    -webkit-backdrop-filter: blur(20px);\n    border: 1px solid rgba(255,255,255,0.1);\n    border-radius: 20px;\n    box-shadow: 0 8px 32px rgba(0,0,0,0.2);\n}\n.product-card:hover {\n    background: rgba(255,255,255,0.08);\n    border-color: rgba(255,255,255,0.2);\n}\n.product-image {\n    border-radius: 16px 16px 0 0;\n    overflow: hidden;\n}\n.btn-primary {\n    background: rgba(255,255,255,0.1);\n    backdrop-filter: blur(10px);\n    border: 1px solid rgba(255,255,255,0.2);\n    border-radius: 50px;\n    color: white;\n}\n.btn-primary:hover {\n    background: rgba(255,255,255,0.2);\n}`,
        minimal: `.product-card {\n    border: none;\n    border-radius: 0;\n    background: transparent;\n    box-shadow: none;\n    padding: 10px;\n}\n.product-card:hover {\n    transform: translateY(-5px);\n}\n.product-image {\n    border-radius: 8px;\n    overflow: hidden;\n}\n.product-info h3 {\n    font-size: 14px;\n    font-weight: 400;\n}\n.product-price {\n    font-size: 18px;\n    font-weight: 300;\n}\n.btn-primary {\n    background: transparent;\n    border: 1px solid var(--text);\n    color: var(--text);\n    border-radius: 0;\n    padding: 8px 20px;\n    font-weight: 400;\n}\n.btn-primary:hover {\n    background: var(--text);\n    color: var(--background);\n}`,
        dark: `.product-card {\n    background: #0A0A0A;\n    border: 1px solid #1A1A1A;\n    border-radius: 12px;\n}\n.product-card:hover {\n    border-color: var(--primary);\n}\n.product-info h3 {\n    color: #FFFFFF;\n}\n.product-price {\n    color: var(--primary);\n}\n.btn-primary {\n    background: linear-gradient(135deg, #1A1A1A, #2A2A2A);\n    color: #FFFFFF;\n    border: 1px solid #333;\n    border-radius: 8px;\n}\n.btn-primary:hover {\n    background: var(--primary);\n    color: #0A0A0A;\n}`,
        neon: `.product-card {\n    background: #0A0A0A;\n    border: 2px solid #00FF41;\n    border-radius: 12px;\n    box-shadow: 0 0 20px rgba(0,255,65,0.1);\n}\n.product-card:hover {\n    box-shadow: 0 0 40px rgba(0,255,65,0.3);\n    border-color: #00FF41;\n}\n.product-info h3 {\n    color: #00FF41;\n    text-shadow: 0 0 10px rgba(0,255,65,0.3);\n}\n.product-price {\n    color: #00FF41;\n    text-shadow: 0 0 15px rgba(0,255,65,0.5);\n}\n.btn-primary {\n    background: #00FF41;\n    color: #0A0A0A;\n    border: none;\n    border-radius: 4px;\n    font-weight: 700;\n    text-transform: uppercase;\n    letter-spacing: 2px;\n}\n.btn-primary:hover {\n    box-shadow: 0 0 30px rgba(0,255,65,0.5);\n    transform: scale(1.05);\n}`
    };
    
    const editor = document.getElementById('customCssEditor');
    if (editor && examples[type]) {
        editor.value = examples[type];
        document.getElementById('customCssPreview').textContent = examples[type];
        showToast(`✅ تم تحميل مثال CSS: ${type}`, 'success');
    }
}
window.loadCSSExample = loadCSSExample;

// ============================================
// ===== JavaScript مخصص =====
// ============================================

function loadCustomJS() {
    try {
        const saved = localStorage.getItem('tithkari_custom_js') || '';
        customJSContent = saved;
        const editor = document.getElementById('customJsEditor');
        if (editor) {
            editor.value = saved;
        }
        document.getElementById('customJsPreview').textContent = saved || '// لا يوجد كود JavaScript مخصص';
        return saved;
    } catch (e) {
        return '';
    }
}
window.loadCustomJS = loadCustomJS;

async function saveCustomJS() {
    const editor = document.getElementById('customJsEditor');
    const js = editor.value;
    customJSContent = js;
    localStorage.setItem('tithkari_custom_js', js);
    document.getElementById('customJsPreview').textContent = js || '// لا يوجد كود JavaScript مخصص';
    await saveSettingsToSupabase('custom_js', js);
    showToast('✅ تم حفظ JavaScript المخصص بنجاح!', 'success');
}
window.saveCustomJS = saveCustomJS;

function previewCustomJS() {
    const js = document.getElementById('customJsEditor').value;
    try {
        const script = document.getElementById('customJsPreviewScript') || (() => {
            const s = document.createElement('script');
            s.id = 'customJsPreviewScript';
            document.head.appendChild(s);
            return s;
        })();
        script.textContent = js;
        showToast('👀 تم تنفيذ JavaScript للمعاينة', 'info');
    } catch (e) {
        showToast('❌ خطأ في تنفيذ JavaScript: ' + e.message, 'error');
    }
}
window.previewCustomJS = previewCustomJS;

function applyCustomJS() {
    const js = document.getElementById('customJsEditor').value;
    try {
        const script = document.getElementById('customJsScript') || (() => {
            const s = document.createElement('script');
            s.id = 'customJsScript';
            document.head.appendChild(s);
            return s;
        })();
        script.textContent = js;
        localStorage.setItem('tithkari_custom_js', js);
        showToast('✅ تم تطبيق JavaScript المخصص بنجاح!', 'success');
    } catch (e) {
        showToast('❌ خطأ في تطبيق JavaScript: ' + e.message, 'error');
    }
}
window.applyCustomJS = applyCustomJS;

function exportCustomJS() {
    const js = document.getElementById('customJsEditor').value;
    const blob = new Blob([js], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-script-${Date.now()}.js`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ تم تصدير JavaScript بنجاح', 'success');
}
window.exportCustomJS = exportCustomJS;

function resetCustomJS() {
    if (!confirm('⚠️ هل أنت متأكد من إعادة تعيين JavaScript المخصص؟')) return;
    document.getElementById('customJsEditor').value = '';
    localStorage.removeItem('tithkari_custom_js');
    document.getElementById('customJsPreview').textContent = '// لا يوجد كود JavaScript مخصص';
    const script = document.getElementById('customJsScript');
    if (script) script.textContent = '';
    showToast('✅ تم إعادة تعيين JavaScript المخصص', 'success');
}
window.resetCustomJS = resetCustomJS;

function loadJSExample(type) {
    const examples = {
        animations: `// مؤثرات حركية على البطاقات\ndocument.querySelectorAll('.product-card').forEach(card => {\n    card.addEventListener('mouseenter', function() {\n        this.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';\n        this.style.transform = 'scale(1.05) rotateY(5deg)';\n        this.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';\n    });\n    card.addEventListener('mouseleave', function() {\n        this.style.transform = 'scale(1) rotateY(0deg)';\n        this.style.boxShadow = 'none';\n    });\n});\n\nconst observer = new IntersectionObserver((entries) => {\n    entries.forEach(entry => {\n        if (entry.isIntersecting) {\n            entry.target.style.opacity = '1';\n            entry.target.style.transform = 'translateY(0)';\n        }\n    });\n}, { threshold: 0.1 });\n\ndocument.querySelectorAll('.product-card, .banner-item').forEach(el => {\n    el.style.opacity = '0';\n    el.style.transform = 'translateY(30px)';\n    el.style.transition = 'all 0.6s ease';\n    observer.observe(el);\n});`,
        interactions: `// تفاعلات متقدمة\ndocument.querySelectorAll('.add-to-cart-btn, .btn-primary').forEach(btn => {\n    btn.addEventListener('click', function(e) {\n        e.preventDefault();\n        const originalText = this.innerHTML;\n        this.innerHTML = '✅ تم الإضافة!';\n        this.style.background = '#10b981';\n        this.style.transform = 'scale(0.95)';\n        setTimeout(() => {\n            this.innerHTML = originalText;\n            this.style.background = '';\n            this.style.transform = '';\n        }, 1500);\n    });\n});\n\ndocument.querySelectorAll('.product-image img').forEach(img => {\n    img.addEventListener('mousemove', function(e) {\n        const rect = this.getBoundingClientRect();\n        const x = (e.clientX - rect.left) / rect.width * 100;\n        const y = (e.clientY - rect.top) / rect.height * 100;\n        this.style.transform = \`scale(1.1) translate(\${(x - 50) * 0.2}px, \${(y - 50) * 0.2}px)\`;\n    });\n    img.addEventListener('mouseleave', function() {\n        this.style.transform = 'scale(1) translate(0, 0)';\n    });\n});`,
        analytics: `// تتبع التفاعلات\ndocument.querySelectorAll('.product-card, .product-item').forEach((item, index) => {\n    item.addEventListener('click', function() {\n        const productName = this.querySelector('h3, .product-title')?.textContent || 'منتج غير معروف';\n        console.log(\`📊 تم النقر على المنتج: \${productName} (رقم \${index + 1})\`);\n        if (typeof gtag !== 'undefined') {\n            gtag('event', 'product_click', {\n                'product_name': productName,\n                'product_index': index + 1\n            });\n        }\n    });\n});\n\nlet startTime = Date.now();\ndocument.addEventListener('visibilitychange', function() {\n    if (document.hidden) {\n        const timeSpent = Math.round((Date.now() - startTime) / 1000);\n        console.log(\`⏱️ وقت التصفح: \${timeSpent} ثانية\`);\n        if (typeof gtag !== 'undefined') {\n            gtag('event', 'time_spent', { 'seconds': timeSpent });\n        }\n    }\n});`,
        customization: `// تخصيص واجهة المستخدم\nfunction applyCustomColors(colors) {\n    const root = document.documentElement;\n    Object.entries(colors).forEach(([key, value]) => {\n        root.style.setProperty(\`--\${key}\`, value);\n    });\n}\n\nwindow.addEventListener('scroll', function() {\n    const scrollY = window.scrollY;\n    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;\n    const progress = scrollY / maxScroll;\n    const r = Math.round(10 + progress * 20);\n    const g = Math.round(10 + progress * 15);\n    const b = Math.round(15 + progress * 25);\n    document.body.style.background = \`rgb(\${r}, \${g}, \${b})\`;\n});\n\nconst scrollBtn = document.createElement('button');\nscrollBtn.innerHTML = '⬆';\nscrollBtn.style.cssText = \`\n    position: fixed;\n    bottom: 20px;\n    right: 20px;\n    background: var(--primary);\n    color: white;\n    border: none;\n    border-radius: 50%;\n    width: 50px;\n    height: 50px;\n    font-size: 24px;\n    cursor: pointer;\n    opacity: 0;\n    transition: all 0.3s ease;\n    z-index: 999;\n    box-shadow: 0 4px 20px rgba(0,0,0,0.3);\n\`;\nscrollBtn.addEventListener('click', () => {\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n});\ndocument.body.appendChild(scrollBtn);\n\nwindow.addEventListener('scroll', () => {\n    scrollBtn.style.opacity = window.scrollY > 300 ? '1' : '0';\n});`
    };
    
    const editor = document.getElementById('customJsEditor');
    if (editor && examples[type]) {
        editor.value = examples[type];
        document.getElementById('customJsPreview').textContent = examples[type];
        showToast(`✅ تم تحميل مثال JavaScript: ${type}`, 'success');
    }
}
window.loadJSExample = loadJSExample;

// ============================================
// ===== طرق العرض المتقدمة =====
// ============================================

function renderDisplayModes() {
    const grid = document.getElementById('displayModesGrid');
    if (!grid) return;
    
    const displayModes = [
        { id: 'grid', name: 'شبكة', icon: 'fa-th', description: 'عرض المنتجات في شبكة مرتبة' },
        { id: 'list', name: 'قائمة', icon: 'fa-list', description: 'عرض المنتجات كقائمة مع تفاصيل' },
        { id: 'compact', name: 'مضغوط', icon: 'fa-th-list', description: 'عرض مضغوط للمنتجات' },
        { id: 'gallery', name: 'معرض', icon: 'fa-images', description: 'عرض كمعرض صور' },
        { id: 'masonry', name: 'ماسونري', icon: 'fa-arrows-alt-v', description: 'عرض بتنسيق الماسونري' },
        { id: 'carousel', name: 'سلايدر', icon: 'fa-arrow-right', description: 'عرض كسلايدر متحرك' },
        { id: 'waterfall', name: 'شلال', icon: 'fa-water', description: 'عرض بتنسيق الشلال' },
        { id: 'timeline', name: 'جدول زمني', icon: 'fa-clock', description: 'عرض كجدول زمني' }
    ];
    
    const currentMode = localStorage.getItem('tithkari_display_mode') || 'grid';
    
    grid.innerHTML = displayModes.map(mode => `
        <div class="display-mode-card ${mode.id === currentMode ? 'active' : ''}" 
             onclick="selectDisplayMode('${mode.id}')">
            <i class="fas ${mode.icon}"></i>
            <h4>${mode.name}</h4>
            <p>${mode.description}</p>
            ${mode.id === currentMode ? `<span class="active-badge">✓ نشط</span>` : ''}
        </div>
    `).join('');
}
window.renderDisplayModes = renderDisplayModes;

function selectDisplayMode(modeId) {
    localStorage.setItem('tithkari_display_mode', modeId);
    renderDisplayModes();
    if (window.parent && window.parent.applyDisplayMode) {
        window.parent.applyDisplayMode(modeId);
    }
    showToast(`✅ تم تغيير طريقة العرض إلى: ${modeId}`, 'success');
}
window.selectDisplayMode = selectDisplayMode;

function loadDisplaySettingsFromData(settings) {
    if (settings) {
        document.getElementById('gridColumns').value = settings.gridColumns || '4';
        document.getElementById('imageSize').value = settings.imageSize || 'medium';
        document.getElementById('cardStyle').value = settings.cardStyle || 'default';
        document.getElementById('hoverEffect').value = settings.hoverEffect || 'scale';
        document.getElementById('showQuickView').checked = settings.showQuickView !== false;
        document.getElementById('showWishlist').checked = settings.showWishlist || false;
        document.getElementById('showCompare').checked = settings.showCompare || false;
    }
}

function loadDisplaySettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('tithkari_display_settings') || '{}');
        loadDisplaySettingsFromData(saved);
        return saved;
    } catch (e) {
        return {};
    }
}
window.loadDisplaySettings = loadDisplaySettings;

async function saveDisplaySettings() {
    const settings = {
        gridColumns: document.getElementById('gridColumns').value,
        imageSize: document.getElementById('imageSize').value,
        cardStyle: document.getElementById('cardStyle').value,
        hoverEffect: document.getElementById('hoverEffect').value,
        showQuickView: document.getElementById('showQuickView').checked,
        showWishlist: document.getElementById('showWishlist').checked,
        showCompare: document.getElementById('showCompare').checked
    };
    
    localStorage.setItem('tithkari_display_settings', JSON.stringify(settings));
    await saveSettingsToSupabase('display_settings', settings);
    
    applyDisplaySettingsToStore(settings);
    showToast('✅ تم حفظ إعدادات العرض بنجاح!', 'success');
}
window.saveDisplaySettings = saveDisplaySettings;

function applyDisplaySettingsToStore(settings) {
    // تطبيق عدد الأعمدة
    const grid = document.querySelector('.products-grid, .product-grid');
    if (grid) {
        grid.style.gridTemplateColumns = `repeat(${settings.gridColumns || 4}, 1fr)`;
    }
    
    // تطبيق حجم الصورة
    const sizes = { small: '150px', medium: '220px', large: '280px', xlarge: '350px' };
    document.querySelectorAll('.product-image').forEach(el => {
        el.style.height = sizes[settings.imageSize || 'medium'] || '220px';
    });
    
    // تطبيق نمط البطاقة
    const cardStyle = settings.cardStyle || 'default';
    document.querySelectorAll('.product-card').forEach(el => {
        el.className = `product-card card-style-${cardStyle}`;
    });
    
    // تطبيق تأثير التمرير
    document.querySelectorAll('.product-card').forEach(el => {
        const effects = {
            scale: 'scale(1.05)',
            glow: 'scale(1.02)',
            lift: 'translateY(-10px)',
            none: 'none'
        };
        const transform = effects[settings.hoverEffect] || 'scale(1.05)';
        el.addEventListener('mouseenter', function() {
            this.style.transform = transform;
        });
        el.addEventListener('mouseleave', function() {
            this.style.transform = 'none';
        });
    });
    
    // إظهار/إخفاء الأزرار
    document.querySelectorAll('.quick-view-btn, .quick-view').forEach(el => {
        el.style.display = settings.showQuickView !== false ? 'block' : 'none';
    });
    document.querySelectorAll('.wishlist-btn, .wishlist').forEach(el => {
        el.style.display = settings.showWishlist ? 'block' : 'none';
    });
    document.querySelectorAll('.compare-btn, .compare').forEach(el => {
        el.style.display = settings.showCompare ? 'block' : 'none';
    });
}
window.applyDisplaySettingsToStore = applyDisplaySettingsToStore;

// ============================================
// ===== دوال الإعدادات المتقدمة (حفظ وتطبيق) =====
// ============================================

function loadAdvancedSettingsFromStorage() {
    try {
        const branding = JSON.parse(localStorage.getItem('tithkari_branding') || '{}');
        if (branding.storeName) document.getElementById('advStoreName').value = branding.storeName;
        if (branding.logo) {
            document.getElementById('advLogoUrl').value = branding.logo;
            document.getElementById('advLogoPreview').innerHTML = `<img src="${branding.logo}" style="max-width:150px;max-height:100px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" />`;
        }
        if (branding.favicon) document.getElementById('advFavicon').value = branding.favicon;
        if (branding.storeDescription) document.getElementById('advStoreDescription').value = branding.storeDescription;
        if (branding.storeSlogan) document.getElementById('advStoreSlogan').value = branding.storeSlogan;
        if (branding.contactEmail) document.getElementById('advContactEmail').value = branding.contactEmail;
        if (branding.contactPhone) document.getElementById('advContactPhone').value = branding.contactPhone;
    } catch (e) {}
    
    try {
        const background = JSON.parse(localStorage.getItem('tithkari_background') || '{}');
        if (background.type) document.getElementById('advBgType').value = background.type;
        if (background.color) document.getElementById('advBgColor').value = background.color;
        if (background.gradient) {
            const [start, end] = background.gradient.split(',');
            document.getElementById('advBgGradientStart').value = start || '#0F0F1A';
            document.getElementById('advBgGradientEnd').value = end || '#1A1A2E';
        }
        if (background.image) {
            document.getElementById('advBgImageUrl').value = background.image;
            document.getElementById('advBgImagePreview').innerHTML = `<img src="${background.image}" style="max-width:200px;max-height:120px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" />`;
        }
        toggleBgFields(background.type || 'color');
    } catch (e) {}
    
    try {
        const icons = JSON.parse(localStorage.getItem('tithkari_icons') || '{}');
        if (icons.style) document.getElementById('advIconStyle').value = icons.style;
        if (icons.color) document.getElementById('advIconColor').value = icons.color;
        if (icons.size) document.getElementById('advIconSize').value = icons.size;
        if (icons.rounded !== undefined) document.getElementById('advIconRounded').checked = icons.rounded;
        if (icons.glow !== undefined) document.getElementById('advIconGlow').checked = icons.glow;
    } catch (e) {}
    
    try {
        const enhancements = JSON.parse(localStorage.getItem('tithkari_product_enhancements') || '{}');
        if (enhancements.show_discount_badge !== undefined) document.getElementById('advShowDiscount').checked = enhancements.show_discount_badge;
        if (enhancements.show_customize_button !== undefined) document.getElementById('advShowCustomize').checked = enhancements.show_customize_button;
        if (enhancements.show_quick_view !== undefined) document.getElementById('advShowQuickView').checked = enhancements.show_quick_view;
        if (enhancements.image_zoom !== undefined) document.getElementById('advImageZoom').checked = enhancements.image_zoom;
        if (enhancements.image_gallery !== undefined) document.getElementById('advImageGallery').checked = enhancements.image_gallery;
        if (enhancements.description_lines) document.getElementById('advDescriptionLines').value = enhancements.description_lines;
        if (enhancements.image_size) document.getElementById('advImageSize').value = enhancements.image_size;
        if (enhancements.card_style) document.getElementById('advCardStyle').value = enhancements.card_style;
        if (enhancements.show_stock !== undefined) document.getElementById('advShowStock').checked = enhancements.show_stock;
        if (enhancements.show_rating !== undefined) document.getElementById('advShowRating').checked = enhancements.show_rating;
    } catch (e) {}
}
window.loadAdvancedSettingsFromStorage = loadAdvancedSettingsFromStorage;

// ============================================
// ===== دالة تطبيق جميع الإعدادات المتقدمة (معدلة لمنع التكرار اللانهائي) =====
// ============================================
function applyAllAdvancedSettings() {
    console.log('🔄 جاري تطبيق جميع الإعدادات على المتجر...');
    
    // منع التكرار اللانهائي
    if (window._applyingSettings) {
        console.log('⏳ جاري تطبيق الإعدادات بالفعل...');
        return;
    }
    
    window._applyingSettings = true;
    
    try {
        // تطبيق الإعدادات الفورية
        const branding = JSON.parse(localStorage.getItem('tithkari_branding') || '{}');
        const background = JSON.parse(localStorage.getItem('tithkari_background') || '{}');
        const icons = JSON.parse(localStorage.getItem('tithkari_icons') || '{}');
        const enhancements = JSON.parse(localStorage.getItem('tithkari_product_enhancements') || '{}');
        
        if (branding && Object.keys(branding).length > 0) {
            applyBrandingImmediately(branding);
        }
        if (background && Object.keys(background).length > 0) {
            applyBackgroundImmediately(background);
        }
        if (icons && Object.keys(icons).length > 0) {
            applyIconsImmediately(icons);
        }
        if (enhancements && Object.keys(enhancements).length > 0) {
            applyProductEnhancementsImmediately(enhancements);
        }
        
        showToast('✅ تم تطبيق جميع الإعدادات على المتجر', 'success');
    } catch (error) {
        console.error('❌ خطأ في تطبيق الإعدادات:', error);
        showToast('❌ حدث خطأ في تطبيق الإعدادات', 'error');
    } finally {
        // إعادة تعيين العلم بعد 500ms لمنع التكرار
        setTimeout(() => {
            window._applyingSettings = false;
        }, 500);
    }
}
window.applyAllAdvancedSettings = applyAllAdvancedSettings;

// ============================================
// 🔧 إصلاح المنتجات المخصصة - ربطها مع Supabase
// ============================================

/**
 * دالة لحفظ المنتجات المخصصة في Supabase
 * بحيث تظهر في المتجر مثل أي منتج عادي
 */
async function syncCustomProductsToSupabase() {
    try {
        console.log('🔄 جاري مزامنة المنتجات المخصصة مع Supabase...');
        
        // جلب التصميمات المخصصة من localStorage
        const designs = JSON.parse(localStorage.getItem('tithkari_custom_designs') || '[]');
        if (designs.length === 0) {
            console.log('📭 لا توجد منتجات مخصصة للمزامنة');
            showToast('📭 لا توجد منتجات مخصصة للمزامنة', 'info');
            return;
        }
        
        console.log(`📦 جاري مزامنة ${designs.length} منتج مخصص...`);
        showToast(`⏳ جاري مزامنة ${designs.length} منتج...`, 'info');
        
        let syncedCount = 0;
        
        for (const design of designs) {
            // إنشاء معرف فريد للمنتج المخصص
            const customId = design.id || 'custom_' + design.timestamp + '_' + Date.now();
            
            // التحقق إذا كان المنتج موجوداً بالفعل في Supabase
            const { data: existing, error: checkError } = await supabase
                .from('products')
                .select('id')
                .eq('id', customId)
                .maybeSingle();
            
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('❌ خطأ في التحقق من المنتج:', checkError);
                continue;
            }
            
            // إذا كان المنتج موجوداً، تخطى
            if (existing) {
                console.log(`⏭️ المنتج المخصص "${design.name}" موجود بالفعل`);
                continue;
            }
            
            // إعداد بيانات المنتج
            const productData = {
                id: customId,
                name: design.name || 'درع مخصص',
                description: design.description || 'درع مصمم حسب الطلب',
                price: design.price || 199,
                image_url: design.image || design.image_url || PLACEHOLDER_IMAGE,
                category: 'مخصص',
                stock: 99,
                currency: 'SAR',
                status: 'active',
                is_custom: true,
                is_custom_design: true,
                promo_text: '🎨 مخصص',
                promo_type: 'custom',
                template_data: {
                    layers: design.layers || [],
                    baseImage: design.baseImage || design.image || '',
                    referenceImage: design.referenceImage || '',
                    designData: design
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // إدراج المنتج في Supabase
            const { error: insertError } = await supabase
                .from('products')
                .insert(productData);
            
            if (insertError) {
                console.error(`❌ خطأ في إضافة المنتج "${design.name}":`, insertError);
            } else {
                syncedCount++;
                console.log(`✅ تم إضافة المنتج المخصص: "${design.name}"`);
            }
        }
        
        if (syncedCount > 0) {
            showToast(`✅ تم مزامنة ${syncedCount} منتج مخصص مع المتجر`, 'success');
            
            // تحديث المنتجات في المتجر
            if (typeof window.loadProducts === 'function') {
                window.loadProducts();
            }
            
            // إعادة تحميل الصفحة بعد 2 ثانية
            setTimeout(() => {
                if (confirm('✅ تمت المزامنة بنجاح! هل تريد تحديث المتجر لرؤية التغييرات؟')) {
                    window.location.reload();
                }
            }, 1000);
        } else {
            showToast('⚠️ لا توجد منتجات جديدة للمزامنة', 'info');
        }
        
    } catch (error) {
        console.error('❌ خطأ في مزامنة المنتجات المخصصة:', error);
        showToast('❌ حدث خطأ في مزامنة المنتجات', 'error');
    }
}
window.syncCustomProductsToSupabase = syncCustomProductsToSupabase;

/**
 * دالة لحذف جميع المنتجات المخصصة من Supabase
 */
async function clearCustomProductsFromSupabase() {
    if (!confirm('⚠️ هل أنت متأكد من حذف جميع المنتجات المخصصة من قاعدة البيانات؟')) return;
    
    try {
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('is_custom_design', true);
        
        if (error) throw error;
        
        showToast('✅ تم حذف جميع المنتجات المخصصة', 'success');
        
        // تحديث المنتجات
        if (typeof window.loadProducts === 'function') {
            window.loadProducts();
        }
        
    } catch (error) {
        console.error('❌ خطأ في حذف المنتجات المخصصة:', error);
        showToast('❌ حدث خطأ في حذف المنتجات', 'error');
    }
}
window.clearCustomProductsFromSupabase = clearCustomProductsFromSupabase;

/**
 * دالة لإضافة زر المزامنة في واجهة التخصيص
 */
function addSyncButtonToCustomizer() {
    // البحث عن قسم الإعدادات المتقدمة
    const advancedSection = document.querySelector('#tab-advanced .settings-sections');
    if (!advancedSection) {
        console.warn('⚠️ قسم الإعدادات المتقدمة غير موجود');
        return;
    }
    
    // إنشاء قسم جديد للمزامنة
    const syncSection = document.createElement('div');
    syncSection.className = 'settings-section';
    syncSection.style.borderColor = 'rgba(139, 92, 246, 0.3)';
    syncSection.innerHTML = `
        <h4 style="color: #8B5CF6;">🔄 مزامنة المنتجات المخصصة</h4>
        <p style="color: var(--textSecondary, #8A8A9B); font-size: 13px; margin-bottom: 12px;">
            قم بمزامنة التصميمات المخصصة من جهازك إلى قاعدة البيانات لتظهر في المتجر.
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn-save" onclick="syncCustomProductsToSupabase()" style="background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: white;">
                <i class="fas fa-cloud-upload-alt"></i> مزامنة المنتجات المخصصة
            </button>
            <button class="btn-danger" onclick="clearCustomProductsFromSupabase()">
                <i class="fas fa-trash"></i> حذف الكل
            </button>
            <button class="btn-secondary" onclick="window.location.reload()">
                <i class="fas fa-sync"></i> تحديث الصفحة
            </button>
        </div>
        <div style="margin-top: 10px; padding: 10px; background: rgba(255, 255, 255, 0.02); border-radius: 6px; border: 1px solid rgba(255, 215, 0, 0.05);">
            <p style="color: var(--textSecondary, #8A8A9B); font-size: 12px; margin: 0;">
                💡 <strong>ملاحظة:</strong> بعد المزامنة، ستظهر المنتجات المخصصة في المتجر مثل أي منتج عادي.
                يمكنك إدارتها من لوحة التحكم.
            </p>
        </div>
    `;
    
    // إضافة القسم قبل آخر قسم
    advancedSection.appendChild(syncSection);
    console.log('✅ تم إضافة زر مزامنة المنتجات المخصصة');
}

// تشغيل الدالة عند تحميل الصفحة
setTimeout(addSyncButtonToCustomizer, 1000);

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎨 Tithkari - تخصيص المتجر');
    console.log('🔐 Keys loaded from keys.example.js');
    
    initTabs();
    
    renderThemes();
    renderLayouts();
    renderAdvancedColors();
    renderFonts();
    renderDisplayOptions();
    loadBanners();
    loadFooterItems();
    
    setupImagePreviews();
    
    await loadSettingsFromSupabase();
    
    const settings = loadSettingsFromLocal();
    
    if (!settings || Object.keys(settings).length === 0) {
        await saveAllSettingsToSupabase();
    }
    
    if (document.getElementById('tab-banners')?.classList.contains('active')) {
        loadAdvancedBanners();
    }
    if (document.getElementById('tab-sections')?.classList.contains('active')) {
        loadProductSections();
    }
    if (document.getElementById('tab-theme-customizer')?.classList.contains('active')) {
        loadThemeColorsToForm();
    }
    if (document.getElementById('tab-custom-css')?.classList.contains('active')) {
        loadCustomCSS();
    }
    if (document.getElementById('tab-custom-js')?.classList.contains('active')) {
        loadCustomJS();
    }
    if (document.getElementById('tab-display-modes')?.classList.contains('active')) {
        renderDisplayModes();
        loadDisplaySettings();
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (tab === 'banners') {
                loadAdvancedBanners();
            } else if (tab === 'sections') {
                loadProductSections();
            } else if (tab === 'colors') {
                renderAdvancedColors();
            } else if (tab === 'advanced') {
                loadAdvancedSettings();
            } else if (tab === 'theme-customizer') {
                setTimeout(loadThemeColorsToForm, 100);
            } else if (tab === 'custom-css') {
                setTimeout(loadCustomCSS, 100);
            } else if (tab === 'custom-js') {
                setTimeout(loadCustomJS, 100);
            } else if (tab === 'display-modes') {
                setTimeout(() => {
                    renderDisplayModes();
                    loadDisplaySettings();
                }, 100);
            }
        });
    });
    
    // إظهار/إخفاء حقول الخلفية حسب النوع
    document.getElementById('advBgType')?.addEventListener('change', function() {
        toggleBgFields(this.value);
    });
    
    // معاينة الشعار عند تغيير الرابط
    document.getElementById('advLogoUrl')?.addEventListener('input', function() {
        const url = this.value.trim();
        if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
            document.getElementById('advLogoPreview').innerHTML = `
                <img src="${url}" style="max-width:150px;max-height:100px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" onerror="this.style.display='none'" />
            `;
        }
    });
    
    // معاينة صورة الخلفية
    document.getElementById('advBgImageUrl')?.addEventListener('input', function() {
        const url = this.value.trim();
        if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
            document.getElementById('advBgImagePreview').innerHTML = `
                <img src="${url}" style="max-width:200px;max-height:120px;border-radius:8px;border:1px solid rgba(255,215,0,0.1);" onerror="this.style.display='none'" />
            `;
        }
    });
    
    // إظهار/إخفاء سرعة التشغيل التلقائي
    document.getElementById('sectionAutoplay')?.addEventListener('change', function() {
        document.getElementById('autoplaySpeedGroup').style.display = this.checked ? 'block' : 'none';
    });
    
    // تطبيق الإعدادات المحفوظة عند التحميل
    const savedAdvanced = await loadAdvancedSettings();
    if (savedAdvanced) {
        applyAllAdvancedSettings();
    }
    
    console.log('✅ تم تهيئة صفحة التخصيص بنجاح مع جميع الإضافات');
});

// ============================================
// جعل الدوال عامة
// ============================================
window.applyTheme = applyTheme;
window.applyLayout = applyLayout;
window.applyDisplayMode = applyDisplayMode;
window.updateColor = updateColor;
window.updateFont = updateFont;
window.updateFontSize = updateFontSize;
window.saveAllCustomizations = saveAllCustomizations;
window.saveAllSettingsToSupabase = saveAllSettingsToSupabase;
window.loadSettingsFromSupabase = loadSettingsFromSupabase;
window.resetAllSettings = resetAllSettings;
window.exportSettings = exportSettings;
window.importSettings = importSettings;
window.saveFonts = saveFonts;
window.saveBanner = saveBanner;
window.editBanner = editBanner;
window.deleteBanner = deleteBanner;
window.toggleBanner = toggleBanner;
window.saveFooterItem = saveFooterItem;
window.editFooterItem = editFooterItem;
window.deleteFooterItem = deleteFooterItem;
window.closeBannerModal = closeBannerModal;
window.closeFooterItemModal = closeFooterItemModal;
window.showToast = showToast;
window.uploadProductImage = uploadProductImage;

// دوال البنرات المتطورة
window.loadAdvancedBanners = loadAdvancedBanners;
window.saveAdvancedBanner = saveAdvancedBanner;
window.editAdvancedBanner = editAdvancedBanner;
window.deleteAdvancedBanner = deleteAdvancedBanner;
window.toggleAdvancedBanner = toggleAdvancedBanner;
window.moveAdvancedBanner = moveAdvancedBanner;
window.openAdvancedBannerForm = openAdvancedBannerForm;
window.closeAdvancedBannerModal = closeAdvancedBannerModal;

// دوال أقسام المنتجات
window.loadProductSections = loadProductSections;
window.saveProductSection = saveProductSection;
window.editProductSection = editProductSection;
window.deleteProductSection = deleteProductSection;
window.toggleProductSection = toggleProductSection;
window.moveProductSection = moveProductSection;
window.openProductSectionForm = openProductSectionForm;
window.closeProductSectionModal = closeProductSectionModal;
window.loadCategoriesForSelect = loadCategoriesForSelect;
window.loadProductsForSelect = loadProductsForSelect;
window.renderProductSections = renderProductSections;

// دوال الإعدادات المتقدمة والألوان
window.loadAdvancedSettings = loadAdvancedSettings;
window.saveAdvancedSettings = saveAdvancedSettings;
window.applyColorsImmediately = applyColorsImmediately;
window.applyFontsImmediately = applyFontsImmediately;
window.applyBrandingImmediately = applyBrandingImmediately;
window.applyBackgroundImmediately = applyBackgroundImmediately;
window.applyIconsImmediately = applyIconsImmediately;
window.applyProductEnhancementsImmediately = applyProductEnhancementsImmediately;
window.renderAdvancedColors = renderAdvancedColors;
window.saveAdvancedColors = saveAdvancedColors;
window.updateColorPreview = updateColorPreview;

// دوال تخصيص الثيم
window.loadCustomThemeColors = loadCustomThemeColors;
window.applyCustomThemeColors = applyCustomThemeColors;
window.updateThemeColor = updateThemeColor;
window.updateThemePreview = updateThemePreview;
window.loadThemeColorsToForm = loadThemeColorsToForm;
window.saveCustomTheme = saveCustomTheme;
window.resetCustomTheme = resetCustomTheme;
window.exportCustomTheme = exportCustomTheme;
window.importCustomTheme = importCustomTheme;

// دوال CSS/JS مخصص
window.loadCustomCSS = loadCustomCSS;
window.saveCustomCSS = saveCustomCSS;
window.previewCustomCSS = previewCustomCSS;
window.applyCustomCSS = applyCustomCSS;
window.exportCustomCSS = exportCustomCSS;
window.resetCustomCSS = resetCustomCSS;
window.loadCSSExample = loadCSSExample;

window.loadCustomJS = loadCustomJS;
window.saveCustomJS = saveCustomJS;
window.previewCustomJS = previewCustomJS;
window.applyCustomJS = applyCustomJS;
window.exportCustomJS = exportCustomJS;
window.resetCustomJS = resetCustomJS;
window.loadJSExample = loadJSExample;

// دوال طرق العرض
window.renderDisplayModes = renderDisplayModes;
window.selectDisplayMode = selectDisplayMode;
window.saveDisplaySettings = saveDisplaySettings;
window.loadDisplaySettings = loadDisplaySettings;
window.applyDisplaySettingsToStore = applyDisplaySettingsToStore;

// دوال الإعدادات المتقدمة
window.loadAdvancedSettingsFromStorage = loadAdvancedSettingsFromStorage;
window.applyAllAdvancedSettings = applyAllAdvancedSettings;

// دوال مزامنة المنتجات المخصصة
window.syncCustomProductsToSupabase = syncCustomProductsToSupabase;
window.clearCustomProductsFromSupabase = clearCustomProductsFromSupabase;
window.addSyncButtonToCustomizer = addSyncButtonToCustomizer;

console.log('✅ customize-store.js loaded successfully with all features');