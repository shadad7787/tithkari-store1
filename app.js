// ============================================
// استيراد Supabase ونظام المفاتيح
// ============================================
import { createClient } from '@supabase/supabase-js';
import KEYS from './keys.example.js';

// ============================================
// إعدادات Supabase - مستوردة من keys.example.js فقط
// ============================================
const supabaseUrl = KEYS.supabaseUrl;
const supabaseAnonKey = KEYS.supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase initialized');
console.log('🔐 Keys loaded from keys.example.js');

// ============================================
// 🛠️ دالة مساعدة للحصول على صورة افتراضية (SVG)
// ============================================
function getPlaceholderSVG(text = '🛡️', width = 300, height = 300) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%231a1a2e'/%3E%3Ctext x='${width/2}' y='${height/2 + 8}' text-anchor='middle' font-size='${Math.min(width, height) * 0.4}'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
}

const PLACEHOLDER_IMAGE = getPlaceholderSVG('🛡️', 300, 300);
const PLACEHOLDER_SMALL = getPlaceholderSVG('🛡️', 60, 60);

// ============================================
// ===== العملات المدعومة =====
// ============================================
const CURRENCIES = {
    SAR: { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', flag: '🇸🇦', rate: 1 },
    BHD: { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني', flag: '🇧🇭', rate: 0.1 },
    QAR: { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', flag: '🇶🇦', rate: 0.98 },
    AED: { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', flag: '🇦🇪', rate: 0.98 },
    KWD: { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', flag: '🇰🇼', rate: 0.082 },
    OMR: { code: 'OMR', symbol: 'ر.ع', name: 'ريال عماني', flag: '🇴🇲', rate: 0.1 },
    USD: { code: 'USD', symbol: '$', name: 'دولار أمريكي', flag: '🇺🇸', rate: 0.27 },
    EUR: { code: 'EUR', symbol: '€', name: 'يورو', flag: '🇪🇺', rate: 0.25 }
};

// ============================================
// حالة التطبيق
// ============================================
let products = [];
let cart = [];
let appliedCoupon = null;
let searchTimeout;
let currentSlide = 0;
let slideInterval;
let siteSettings = {};
let categories = [];
let footerItems = [];
let currentCurrency = 'SAR';
let selectedPaymentMethod = 'cod';
let storeSettings = {
    storeInfo: { name: 'Tithkari', description: '', currency: 'SAR' },
    branding: { logo: '', primary_color: '#FFD700', secondary_color: '#8B0000', bg_color: '#0F0F1A', text_color: '#FFFFFF', font_family: 'Cairo', font_size: 16 },
    display: { default_view: 'grid', products_per_page: 12, show_categories: true },
    currencies: { default: 'SAR', available: ['SAR', 'BHD', 'QAR', 'AED', 'KWD', 'OMR', 'USD', 'EUR'] }
};

// ============================================
// ===== جعل المتغيرات متاحة عالمياً =====
// ============================================
window.products = products;
window.cart = cart;
window.supabase = supabase;
window.PLACEHOLDER_IMAGE = PLACEHOLDER_IMAGE;
window.PLACEHOLDER_SMALL = PLACEHOLDER_SMALL;

// ============================================
// ===== 📱 تحسينات أداء الجوال =====
// ============================================

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

function enableSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        images.forEach(img => imageObserver.observe(img));
    }
}

function initTouchOptimizations() {
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    }, { passive: true });
    
    let lastTouchY = 0;
    document.addEventListener('touchstart', function(e) {
        lastTouchY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        if (e.target.closest('.cart-sidebar') || e.target.closest('.modal-content') || e.target.closest('.custom-scroll')) {
            // السماح بالتمرير داخل العناصر
        } else {
            const touchY = e.touches[0].clientY;
            const deltaY = touchY - lastTouchY;
            if (deltaY > 0 && window.scrollY === 0) {
                e.preventDefault();
            }
            lastTouchY = touchY;
        }
    }, { passive: false });
}

function optimizeCarouselForMobile() {
    if (isMobileDevice()) {
        if (window.slideInterval) {
            clearInterval(window.slideInterval);
            window.slideInterval = setInterval(() => moveSlide(1), 8000);
        }
    }
}

function initMobileOptimizations() {
    if (isMobileDevice()) {
        document.body.classList.add('mobile-device');
        enableSmoothScroll();
        initTouchOptimizations();
        optimizeCarouselForMobile();
    }
    if (isTouchDevice()) {
        document.body.classList.add('touch-device');
    }
    initLazyLoading();
}

// ============================================
// ===== دوال العملات =====
// ============================================
function getExchangeRate(fromCurrency, toCurrency) {
    if (!CURRENCIES[fromCurrency] || !CURRENCIES[toCurrency]) return 1;
    return CURRENCIES[toCurrency].rate / CURRENCIES[fromCurrency].rate;
}

function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const rate = getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
}

function formatCurrency(amount, currencyCode = 'SAR') {
    const currency = CURRENCIES[currencyCode];
    if (!currency) return `${amount.toFixed(2)}`;
    return `${amount.toFixed(2)} ${currency.symbol}`;
}

function getPriceInCurrency(price, fromCurrency = 'SAR') {
    return convertCurrency(price, fromCurrency, currentCurrency);
}

function displayPrice(price, fromCurrency = 'SAR') {
    const converted = getPriceInCurrency(price, fromCurrency);
    return formatCurrency(converted, currentCurrency);
}

function changeCurrency(currencyCode) {
    if (CURRENCIES[currencyCode]) {
        currentCurrency = currencyCode;
        localStorage.setItem('tithkari_currency', currencyCode);
        updateCurrencyDisplay();
        renderProducts(products);
        showToast(`✅ تم تغيير العملة إلى ${CURRENCIES[currencyCode].name}`, 'success');
    }
}
window.changeCurrency = changeCurrency;

function updateCurrencyDisplay() {
    const currencySymbol = CURRENCIES[currentCurrency]?.symbol || 'ر.س';
    document.querySelectorAll('.currency-display').forEach(el => {
        el.textContent = currencySymbol;
    });
    document.querySelectorAll('.price-currency').forEach(el => {
        el.textContent = currencySymbol;
    });
    const selector = document.getElementById('currencySelector');
    if (selector) {
        selector.value = currentCurrency;
    }
}

// ============================================
// ===== تحميل إعدادات المتجر من Supabase =====
// ============================================
async function loadStoreSettings() {
    try {
        console.log('📋 جاري تحميل إعدادات المتجر...');
        const { data, error } = await supabase
            .from('store_settings')
            .select('*');
        if (error) {
            console.error('❌ خطأ في تحميل إعدادات المتجر:', error);
            return;
        }
        data.forEach(item => {
            if (item.key === 'storeInfo' || item.key === 'branding' || item.key === 'display' || item.key === 'currencies' || item.key === 'payment_settings') {
                storeSettings[item.key] = item.value;
            }
        });
        console.log('✅ تم تحميل إعدادات المتجر:', storeSettings);
        currentCurrency = storeSettings.currencies?.default || 'SAR';
        const savedCurrency = localStorage.getItem('tithkari_currency');
        if (savedCurrency && CURRENCIES[savedCurrency]) {
            currentCurrency = savedCurrency;
        }
        applyStoreSettingsToStore();
        updateCurrencyDisplay();
        return storeSettings;
    } catch (error) {
        console.error('❌ خطأ في تحميل إعدادات المتجر:', error);
        return storeSettings;
    }
}

// ============================================
// ===== تطبيق إعدادات المتجر على المتجر =====
// ============================================
function applyStoreSettingsToStore() {
    const branding = storeSettings.branding || {};
    const display = storeSettings.display || {};
    const storeInfo = storeSettings.storeInfo || {};
    console.log('🎨 جاري تطبيق إعدادات المتجر على المتجر...', branding);
    if (branding.primary_color) {
        document.documentElement.style.setProperty('--gold', branding.primary_color);
        document.documentElement.style.setProperty('--accent-color', branding.primary_color);
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', branding.primary_color);
    }
    if (branding.secondary_color) {
        document.documentElement.style.setProperty('--primary', branding.secondary_color);
    }
    if (branding.bg_color) {
        document.documentElement.style.setProperty('--dark', branding.bg_color);
        document.body.style.backgroundColor = branding.bg_color;
    }
    if (branding.text_color) {
        document.documentElement.style.setProperty('--white', branding.text_color);
        document.documentElement.style.setProperty('--text-color', branding.text_color);
    }
    if (branding.font_family) {
        document.documentElement.style.setProperty('--font-family', branding.font_family);
        document.body.style.fontFamily = `${branding.font_family}, sans-serif`;
        document.querySelectorAll('[style*="font-family"]').forEach(el => {
            el.style.fontFamily = `${branding.font_family}, sans-serif`;
        });
    }
    if (branding.font_size) {
        document.documentElement.style.fontSize = `${branding.font_size}px`;
    }
    if (branding.logo && branding.logo.startsWith('http')) {
        const logoImg = document.querySelector('.logo img');
        if (logoImg) {
            logoImg.src = branding.logo;
            logoImg.style.display = 'inline';
            logoImg.style.width = 'auto';
            logoImg.style.height = '40px';
        }
        const logoText = document.querySelector('.logo .logo-text');
        if (logoText) {
            logoText.style.display = 'none';
        }
        const logoIcon = document.querySelector('.logo i');
        if (logoIcon) {
            logoIcon.style.display = 'none';
        }
    } else {
        const logoText = document.querySelector('.logo .logo-text');
        if (logoText) {
            logoText.style.display = 'inline';
        }
        const logoIcon = document.querySelector('.logo i');
        if (logoIcon) {
            logoIcon.style.display = 'inline';
        }
        const logoImg = document.querySelector('.logo img');
        if (logoImg) {
            logoImg.style.display = 'none';
        }
    }
    if (storeInfo.name) {
        document.title = `🛡️ ${storeInfo.name} - متجر تصميم الدروع`;
        const logoText = document.querySelector('.logo .logo-text');
        if (logoText) logoText.textContent = storeInfo.name;
        const footerLogo = document.querySelector('.footer-info h3');
        if (footerLogo) footerLogo.textContent = storeInfo.name;
        const headerLogo = document.querySelector('.logo .logo-text');
        if (headerLogo) headerLogo.textContent = storeInfo.name;
    }
    if (storeInfo.description) {
        const footerDesc = document.querySelector('.footer-info p');
        if (footerDesc) footerDesc.textContent = storeInfo.description;
        document.querySelector('meta[name="description"]')?.setAttribute('content', storeInfo.description);
    }
    if (display.default_view) {
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.className = `products-grid ${display.default_view}-view`;
        }
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === display.default_view);
        });
    }
    const categoriesSection = document.getElementById('categoriesSection');
    if (categoriesSection) {
        categoriesSection.style.display = display.show_categories !== false ? 'block' : 'none';
    }
    updateCurrencyDisplay();
    if (display.products_per_page) {
        console.log(`📦 عدد المنتجات في الصفحة: ${display.products_per_page}`);
    }
    document.querySelectorAll('[style*="border-color"]').forEach(el => {
        if (el.style.borderColor && el.style.borderColor.includes('gold')) {
            el.style.borderColor = branding.primary_color || '#FFD700';
        }
    });
    console.log('✅ تم تطبيق إعدادات المتجر على المتجر بنجاح');
}

// ============================================
// ===== ربط التصميمات المخصصة (مُصلح) =====
// ============================================
function loadCustomDesigns() {
    try {
        return JSON.parse(localStorage.getItem('tithkari_custom_designs') || '[]');
    } catch {
        return [];
    }
}

function addCustomDesignsToProducts() {
    const designs = loadCustomDesigns();
    if (designs.length === 0) {
        console.log('📭 لا توجد تصميمات مخصصة للإضافة');
        return;
    }
    
    console.log('🎨 جاري إضافة', designs.length, 'تصميم مخصص...');
    
    designs.forEach((design, index) => {
        const customId = design.id || 'custom_' + design.timestamp + '_' + index;
        
        // التحقق إذا كان المنتج موجوداً بالفعل
        const exists = products.some(p => 
            p.id === customId || 
            p.id === 'custom_' + design.timestamp ||
            (p.is_custom_design && p.custom_data?.timestamp === design.timestamp)
        );
        
        if (!exists) {
            const newProduct = {
                id: customId,
                name: design.name || 'درع مخصص',
                price: design.price || 199,
                description: design.description || 'درع مصمم حسب الطلب',
                image_url: design.image || design.image_url || PLACEHOLDER_IMAGE,
                stock: 99,
                category: 'مخصص',
                isCustom: true,
                is_custom_design: true,
                currency: 'SAR',
                custom_data: design,
                images: design.image ? [design.image] : null
            };
            products.push(newProduct);
            console.log('✅ تم إضافة منتج مخصص:', customId, newProduct.name);
        } else {
            console.log('⚠️ المنتج المخصص موجود بالفعل:', customId);
        }
    });
    
    console.log('✅ عدد المنتجات الكلي بعد الإضافة:', products.length);
}

// ============================================
// ===== فتح المصمم المتقدم =====
// ============================================
function openDesignStudio(productImage, productName, productId) {
    console.log('🎨 فتح المصمم - productId:', productId);
    
    let designData = {
        productImage: productImage || PLACEHOLDER_IMAGE,
        productName: productName || 'درع مخصص',
        productId: productId || null,
        timestamp: Date.now()
    };
    
    // محاولة جلب بيانات التصميم من localStorage
    if (productId) {
        try {
            const customDesigns = JSON.parse(localStorage.getItem('tithkari_custom_designs') || '[]');
            const design = customDesigns.find(d => d.id === productId || d.timestamp === productId);
            if (design) {
                designData = {
                    ...designData,
                    productImage: design.image || design.image_url || PLACEHOLDER_IMAGE,
                    productName: design.name || 'درع مخصص',
                    productId: productId,
                    layers: design.layers || [],
                    baseImage: design.baseImage || design.image || PLACEHOLDER_IMAGE
                };
            }
        } catch (e) {
            console.warn('⚠️ خطأ في جلب بيانات التصميم:', e);
        }
    }
    
    localStorage.setItem('tithkari_design_data', JSON.stringify(designData));
    window.location.href = 'design-studio.html?productId=' + (productId || '');
}
window.openDesignStudio = openDesignStudio;

// ============================================
// ===== جلب البنرات من قاعدة البيانات =====
// ============================================
async function loadBannersFromDB() {
    try {
        console.log('📢 جاري تحميل البنرات من قاعدة البيانات...');
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .eq('position', 'home')
            .order('display_order', { ascending: true });
        if (error) {
            console.error('❌ خطأ في جلب البنرات:', error);
            return [];
        }
        console.log('✅ تم تحميل', data?.length || 0, 'بنر');
        return data || [];
    } catch (error) {
        console.error('❌ خطأ في جلب البنرات:', error);
        return [];
    }
}

// ============================================
// ===== البنرات المتحركة (Carousel) =====
// ============================================
async function initCarousel() {
    console.log('📢 تهيئة البانر المتحرك...');
    
    let track = document.getElementById('carouselTrack');
    if (!track) {
        console.log('⚠️ carouselTrack غير موجود، جاري إنشائه...');
        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
            track = document.createElement('div');
            track.id = 'carouselTrack';
            track.className = 'carousel-track';
            carouselContainer.prepend(track);
            console.log('✅ تم إنشاء carouselTrack');
        } else {
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                const container = document.createElement('div');
                container.className = 'carousel-container';
                track = document.createElement('div');
                track.id = 'carouselTrack';
                track.className = 'carousel-track';
                container.appendChild(track);
                heroSection.after(container);
                console.log('✅ تم إنشاء carousel-container و carouselTrack');
            }
        }
    }
    
    track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots');
    
    if (!track) {
        console.error('❌ carouselTrack غير موجود بعد المحاولة');
        return;
    }
    
    const banners = await loadBannersFromDB();
    
    if (!banners || banners.length === 0) {
        track.innerHTML = `
            <div class="carousel-slide">
                <div class="banner-card" style="background: #1A1A2E;">
                    <div class="banner-content">
                        <h3>📢 مرحباً بك في ${storeSettings.storeInfo?.name || 'Tithkari'}</h3>
                        <p>أضف بنرات من لوحة التحكم</p>
                    </div>
                    <div class="banner-icon">🛡️</div>
                </div>
            </div>
        `;
        return;
    }
    
    if (!Array.isArray(banners)) {
        console.error('❌ البنرات ليست مصفوفة:', banners);
        return;
    }
    
    track.innerHTML = banners.map(banner => {
        const hasImage = banner.image_url && banner.image_url.startsWith('http');
        const bannerType = banner.banner_type || 'image';
        const isProductBanner = bannerType === 'product' && banner.product_id;
        const isCategoryBanner = bannerType === 'category' && banner.category_id;
        let extraContent = '';
        if (isProductBanner) {
            extraContent = `<div class="banner-products">🔗 منتج مرتبط</div>`;
        } else if (isCategoryBanner) {
            extraContent = `<div class="banner-products">📂 تصنيف مرتبط</div>`;
        }
        return `
        <div class="carousel-slide">
            <div class="banner-card ${hasImage ? 'image-banner' : ''}" 
                 style="background: ${banner.bg_color || '#1A1A2E'}; 
                        width: ${banner.width || '100%'}; 
                        height: ${banner.height || 'auto'};">
                ${hasImage ? `<img src="${banner.image_url}" alt="${banner.title}" loading="lazy" />` : ''}
                <div class="banner-content">
                    <h3>${banner.title}</h3>
                    ${banner.subtitle ? `<p>${banner.subtitle}</p>` : ''}
                    ${extraContent}
                    ${banner.button_text && banner.button_url ? `
                        <a href="${banner.button_url}" class="banner-code" style="color: ${banner.button_color || '#FFD700'}; border-color: ${banner.button_color || '#FFD700'}40;">
                            ${banner.button_text}
                        </a>
                    ` : ''}
                </div>
                ${!hasImage ? `<div class="banner-icon">${banner.icon || '📢'}</div>` : ''}
            </div>
        </div>
    `}).join('');
    
    const slides = track.querySelectorAll('.carousel-slide');
    if (slides && slides.length > 0) {
        if (dots) {
            dots.innerHTML = Array.from(slides).map((_, i) => 
                `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
            ).join('');
        }
        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => moveSlide(-1));
            prevBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                moveSlide(-1);
            }, { passive: false });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => moveSlide(1));
            nextBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                moveSlide(1);
            }, { passive: false });
        }
        if (dots) {
            dots.querySelectorAll('.dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    const index = parseInt(dot.dataset.index);
                    goToSlide(index);
                });
                dot.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const index = parseInt(dot.dataset.index);
                    goToSlide(index);
                }, { passive: false });
            });
        }
        startAutoPlay();
        track.addEventListener('touchstart', stopAutoPlay, { passive: true });
        track.addEventListener('touchend', startAutoPlay, { passive: true });
        track.addEventListener('mouseenter', stopAutoPlay);
        track.addEventListener('mouseleave', startAutoPlay);
    }
}

function moveSlide(direction) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (!slides || slides.length === 0) return;
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    goToSlide(currentSlide);
}

function goToSlide(index) {
    const track = document.getElementById('carouselTrack');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    if (!track || !slides || slides.length === 0) return;
    track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform = `translateX(-${index * 100}%)`;
    currentSlide = index;
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function startAutoPlay() {
    stopAutoPlay();
    const delay = isMobileDevice() ? 8000 : 5000;
    slideInterval = setInterval(() => moveSlide(1), delay);
}

function stopAutoPlay() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

// ============================================
// ===== جلب الإعدادات القديمة (للتوافق) =====
// ============================================
async function loadSettings() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*');
        if (error) throw error;
        data.forEach(item => {
            siteSettings[item.key] = item.value;
        });
        console.log('✅ تم تحميل الإعدادات القديمة');
    } catch (error) {
        console.error('❌ خطأ في تحميل الإعدادات:', error);
    }
}

// ============================================
// ===== جلب القوائم من قاعدة البيانات =====
// ============================================
async function loadMenusFromDB() {
    try {
        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .eq('is_active', true)
            .eq('position', 'header')
            .order('display_order', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ خطأ في جلب القوائم:', error);
        return [];
    }
}

// ============================================
// ===== عرض القوائم في الهيدر =====
// ============================================
async function renderMenus() {
    const menus = await loadMenusFromDB();
    const menuContainer = document.getElementById('mainMenu');
    if (!menuContainer) return;
    if (menus.length === 0) {
        menuContainer.innerHTML = `
            <li><a href="#" class="active">الرئيسية</a></li>
            <li><a href="#products">المنتجات</a></li>
            <li><a href="design-studio.html">🎨 صمم درعك</a></li>
            <li><a href="#reviews">التقييمات</a></li>
        `;
        return;
    }
    menuContainer.innerHTML = menus.map(menu => `
        <li><a href="${menu.url}">${menu.icon || ''} ${menu.label}</a></li>
    `).join('');
}

// ============================================
// ===== تحميل التصنيفات من Supabase =====
// ============================================
async function loadCategories() {
    try {
        console.log('📂 جاري تحميل التصنيفات...');
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        if (error) {
            console.error('❌ خطأ في تحميل التصنيفات:', error);
            categories = getDefaultCategories();
            renderCategories();
            renderCategoryFilter();
            return;
        }
        categories = data || [];
        if (categories.length === 0) {
            categories = getDefaultCategories();
        }
        renderCategories();
        renderCategoryFilter();
        console.log('✅ تم تحميل', categories.length, 'تصنيف');
    } catch (error) {
        console.error('❌ خطأ في تحميل التصنيفات:', error);
        categories = getDefaultCategories();
        renderCategories();
        renderCategoryFilter();
    }
}

// ============================================
// ===== تصنيفات افتراضية =====
// ============================================
function getDefaultCategories() {
    return [
        { id: 'default_1', name: 'كلاسيكي', slug: 'classic', icon: 'fa-helmet-safety', description: 'تصاميم كلاسيكية عريقة', is_active: true, display_order: 1 },
        { id: 'default_2', name: 'خيالي', slug: 'fantasy', icon: 'fa-dragon', description: 'تصاميم مستوحاة من الخيال', is_active: true, display_order: 2 },
        { id: 'default_3', name: 'ملوكي', slug: 'royal', icon: 'fa-crown', description: 'تصاميم ملوكية فاخرة', is_active: true, display_order: 3 },
        { id: 'default_4', name: 'حديث', slug: 'modern', icon: 'fa-bolt', description: 'تصاميم عصرية حديثة', is_active: true, display_order: 4 },
        { id: 'default_5', name: 'مخصص', slug: 'custom', icon: 'fa-paint-brush', description: 'تصاميم مخصصة حسب الطلب', is_active: true, display_order: 5 }
    ];
}

// ============================================
// ===== عرض التصنيفات في المتجر =====
// ============================================
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    if (categories.length === 0 || storeSettings.display?.show_categories === false) {
        container.innerHTML = '';
        return;
    }
    const maxDisplay = isMobileDevice() ? 6 : categories.length;
    const displayCategories = categories.slice(0, maxDisplay);
    container.innerHTML = displayCategories.map(cat => `
        <div class="category-item" onclick="filterByCategory('${cat.slug}')" role="button" tabindex="0">
            ${cat.image_url ? `<img src="${cat.image_url}" alt="${cat.name}" loading="lazy" onerror="this.src='${PLACEHOLDER_SMALL}'" />` : `<i class="fas ${cat.icon || 'fa-tag'}"></i>`}
            <span>${cat.name}</span>
        </div>
    `).join('');
}

// ============================================
// ===== عرض التصنيفات في فلتر البحث =====
// ============================================
function renderCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;
    filter.innerHTML = '<option value="">📂 جميع التصنيفات</option>';
    categories.forEach(cat => {
        filter.innerHTML += `<option value="${cat.slug}">${cat.icon || '📁'} ${cat.name}</option>`;
    });
}

// ============================================
// ===== التصفية حسب التصنيف =====
// ============================================
function filterByCategory(slug) {
    const filter = document.getElementById('categoryFilter');
    if (filter) {
        filter.value = slug;
    }
    searchProducts();
}
window.filterByCategory = filterByCategory;

// ============================================
// ===== تحميل عناصر التذييل =====
// ============================================
async function loadFooterItems() {
    try {
        console.log('📋 جاري تحميل عناصر التذييل...');
        localStorage.removeItem('tithkari_footer_cache');
        localStorage.removeItem('tithkari_footer_items');
        localStorage.removeItem('tithkari_footer_updated');
        console.log('🔍 جلب البيانات من Supabase...');
        const { data, error } = await supabase
            .from('footer_items')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        if (error) {
            console.error('❌ خطأ في تحميل عناصر التذييل:', error);
            footerItems = getDefaultFooterItems();
            renderFooter();
            return;
        }
        console.log('✅ البيانات المسترجعة من Supabase:', data);
        console.log('📊 عدد العناصر:', data?.length || 0);
        if (data && data.length > 0) {
            footerItems = data;
            console.log('✅ استخدام البيانات من Supabase');
        } else {
            console.log('⚠️ لا توجد بيانات في Supabase، استخدام الافتراضية');
            footerItems = getDefaultFooterItems();
        }
        localStorage.setItem('tithkari_footer_items', JSON.stringify(footerItems));
        renderFooter();
        console.log('✅ تم تحميل', footerItems.length, 'عنصر تذييل');
    } catch (error) {
        console.error('❌ خطأ في تحميل عناصر التذييل:', error);
        footerItems = getDefaultFooterItems();
        renderFooter();
    }
}

// ============================================
// ===== عناصر تذييل افتراضية =====
// ============================================
function getDefaultFooterItems() {
    return [
        { id: 'default_1', label: 'من نحن', icon: 'fa-info-circle', content: 'متجر متخصص في تصميم وبيع الدروع الفاخرة', type: 'text', is_active: true, display_order: 1 },
        { id: 'default_2', label: 'سياسة المتجر', icon: 'fa-file-contract', content: 'ضمان الجودة 100% وإرجاع خلال 14 يوماً', type: 'text', is_active: true, display_order: 2 },
        { id: 'default_3', label: 'الشحن والتوصيل', icon: 'fa-truck', content: 'شحن سريع لجميع أنحاء العالم', type: 'text', is_active: true, display_order: 3 },
        { id: 'default_4', label: 'اتصل بنا', icon: 'fa-envelope', content: 'info@tithkari.com', type: 'contact', is_active: true, display_order: 4 },
        { id: 'default_5', label: 'واتساب', icon: 'fa-whatsapp', content: 'تواصل معنا', type: 'link', link_url: 'https://wa.me/966500000000', is_active: true, display_order: 5 },
        { id: 'default_6', label: 'انستغرام', icon: 'fa-instagram', content: 'تابعنا', type: 'link', link_url: 'https://instagram.com/tithkari', is_active: true, display_order: 6 }
    ];
}

// ============================================
// ===== عرض التذييل =====
// ============================================
function renderFooter() {
    const container = document.getElementById('footerColumns');
    if (!container) {
        console.error('❌ عنصر footerColumns غير موجود');
        return;
    }
    console.log('📋 جاري عرض التذييل، عدد العناصر:', footerItems.length);
    if (!footerItems || footerItems.length === 0) {
        container.innerHTML = `
            <div class="footer-column">
                <h4>📋 عن المتجر</h4>
                <p style="color:var(--gray);font-size:13px;">${storeSettings.storeInfo?.description || 'متجر متخصص في تصميم وبيع الدروع الفاخرة'}</p>
            </div>
        `;
        return;
    }
    const columnsCount = isMobileDevice() ? 2 : 4;
    const itemsPerColumn = Math.ceil(footerItems.length / columnsCount);
    const columns = [];
    for (let i = 0; i < footerItems.length; i += itemsPerColumn) {
        columns.push(footerItems.slice(i, i + itemsPerColumn));
    }
    container.innerHTML = columns.map(col => `
        <div class="footer-column">
            ${col.map(item => `
                <div class="footer-item">
                    <i class="fas ${item.icon || 'fa-circle'}"></i>
                    <div class="item-content">
                        <strong>${item.label}</strong>
                        ${item.type === 'link' ? 
                            `<a href="${item.link_url || '#'}" target="_blank">${item.content || ''}</a>` :
                            `<span>${item.content || ''}</span>`
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
    console.log('✅ تم عرض التذييل بنجاح');
}

// ============================================
// ===== بيانات احتياطية مع معرفات صحيحة =====
// ============================================
function getFallbackProducts() {
    return [
        {
            id: 'fallback_1',
            name: 'درع الفارس الذهبي',
            description: 'درع فاخر مطعم بالذهب عيار 24',
            price: 299,
            category: 'كلاسيكي',
            image_url: PLACEHOLDER_IMAGE,
            stock: 10,
            currency: 'SAR'
        },
        {
            id: 'fallback_2',
            name: 'درع التنين الأسود',
            description: 'درع مستوحى من أساطير التنين',
            price: 399,
            category: 'خيالي',
            image_url: PLACEHOLDER_IMAGE,
            stock: 5,
            currency: 'SAR'
        },
        {
            id: 'fallback_3',
            name: 'درع الصليبيين',
            description: 'تصميم كلاسيكي من العصور الوسطى',
            price: 249,
            category: 'كلاسيكي',
            image_url: PLACEHOLDER_IMAGE,
            stock: 8,
            currency: 'SAR'
        },
        {
            id: 'fallback_4',
            name: 'درع النسر الذهبي',
            description: 'درع يحمل رمز النسر الملكي',
            price: 349,
            category: 'ملوكي',
            image_url: PLACEHOLDER_IMAGE,
            stock: 6,
            currency: 'SAR'
        }
    ];
}

// ============================================
// ===== جلب المنتجات من Supabase (مُصلح) =====
// ============================================
async function loadProducts() {
    try {
        console.log('📦 جاري تحميل المنتجات...');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ خطأ في التحميل:', error.message);
            products = getFallbackProducts();
            addCustomDesignsToProducts();
            renderProducts(products);
            updateProductCount();
            return;
        }
        
        if (data && data.length > 0) {
            products = data.map(p => ({
                ...p,
                id: p.id || 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            }));
            console.log('✅ تم تحميل', products.length, 'منتج من Supabase');
        } else {
            console.log('⚠️ لا توجد منتجات في Supabase، استخدام البيانات الاحتياطية');
            products = getFallbackProducts();
        }
        
        // ✅ إضافة التصميمات المخصصة بعد تحميل المنتجات
        addCustomDesignsToProducts();
        renderProducts(products);
        updateProductCount();
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        products = getFallbackProducts();
        addCustomDesignsToProducts();
        renderProducts(products);
        updateProductCount();
    }
}
window.loadProducts = loadProducts;

// ============================================
// ===== عرض المنتجات (مُصلح بالكامل مع دعم المنتجات المخصصة) =====
// ============================================
function renderProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
        console.error('❌ productsGrid غير موجود');
        return;
    }
    
    if (!productsToShow || !Array.isArray(productsToShow) || productsToShow.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--gray);">
                <i class="fas fa-box-open" style="font-size:48px;display:block;margin-bottom:20px;"></i>
                <h3>لا توجد منتجات</h3>
                <p>سيتم إضافة منتجات قريباً</p>
                <p style="font-size:13px;margin-top:10px;">
                    💡 يمكنك إضافة منتجات من 
                    <a href="admin/admin.html" style="color:var(--gold);text-decoration:underline;">لوحة التحكم</a>
                </p>
            </div>
        `;
        return;
    }
    
    const validProducts = productsToShow.filter(p => p && (p.id || p._id));
    
    if (validProducts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--gray);">
                <i class="fas fa-exclamation-triangle" style="font-size:40px;display:block;margin-bottom:15px;opacity:0.5;"></i>
                <h3>لا توجد منتجات صالحة</h3>
                <p>المنتجات المتاحة لا تحتوي على معرف صحيح</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = validProducts.map((product, index) => {
        const productId = product.id || product._id || 'product_' + index + '_' + Date.now();
        const productCurrency = product.currency || 'SAR';
        const priceDisplay = displayPrice(product.price || 0, productCurrency);
        const oldPriceDisplay = product.old_price ? displayPrice(product.old_price, productCurrency) : '';
        const productImage = product.image_url || product.image || PLACEHOLDER_IMAGE;
        const productName = product.name || 'منتج بدون اسم';
        const productDescription = product.description || '';
        const productCategory = product.category || '';
        const productStock = product.stock !== undefined ? product.stock : 99;
        const isCustom = product.isCustom || product.is_custom_design || false;
        const isMobile = isMobileDevice();
        
        let imagesHtml = '';
        let productImages = [];
        
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            productImages = product.images;
        } else if (product.image_url) {
            productImages = [product.image_url];
        } else if (product.image) {
            productImages = [product.image];
        } else {
            productImages = [PLACEHOLDER_IMAGE];
        }
        
        const hasMultipleImages = productImages.length > 1;
        
        if (hasMultipleImages) {
            imagesHtml = `
                <div class="product-image-gallery" data-product-id="${productId}">
                    <div class="gallery-track" id="gallery-${productId}">
                        ${productImages.map(img => `
                            <div class="gallery-slide">
                                <img src="${img}" alt="${productName}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" />
                            </div>
                        `).join('')}
                    </div>
                    <button class="gallery-btn prev" onclick="event.stopPropagation(); moveGallery('${productId}', -1)" aria-label="السابق">‹</button>
                    <button class="gallery-btn next" onclick="event.stopPropagation(); moveGallery('${productId}', 1)" aria-label="التالي">›</button>
                    <div class="gallery-dots">
                        ${productImages.map((_, i) => `
                            <span class="dot ${i === 0 ? 'active' : ''}" onclick="event.stopPropagation(); goToGallerySlide('${productId}', ${i})"></span>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            imagesHtml = `
                <div class="product-image-gallery" data-product-id="${productId}">
                    <div class="gallery-track">
                        <div class="gallery-slide">
                            <img src="${productImages[0]}" alt="${productName}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" />
                        </div>
                    </div>
                </div>
            `;
        }
        
        let promoBadge = '';
        if (product.promo_text) {
            promoBadge = `<span class="product-promo-badge">${product.promo_text}</span>`;
        } else if (isCustom) {
            promoBadge = `<span class="product-promo-badge custom">🎨 مخصص</span>`;
        } else if (productStock < 5 && productStock > 0) {
            promoBadge = `<span class="product-promo-badge limited">🔥 محدود</span>`;
        }
        
        return `
        <div class="product-card" data-product-id="${productId}" onclick="openProductModal('${productId}')" role="button" tabindex="0">
            <div class="product-image-wrapper">
                ${imagesHtml}
                ${promoBadge}
                ${productStock === 0 ? '<span class="product-badge sale">نفذ</span>' : ''}
                <div class="product-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); addToCartFromCard('${productId}')" aria-label="أضف للسلة">
                        <i class="fas fa-cart-plus"></i> ${isMobile ? '' : 'أضف'}
                    </button>
                    <button class="action-btn quick-view" onclick="event.stopPropagation(); openProductModal('${productId}')" aria-label="عرض سريع">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn customize-btn" onclick="event.stopPropagation(); openDesignStudio('${productImage}', '${productName}', '${productId}')" aria-label="تخصيص">
                        <i class="fas fa-paint-brush"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                ${productCategory ? `<span class="product-category">${productCategory}</span>` : ''}
                <h3 class="product-name">${productName}</h3>
                <p class="product-description">${productDescription}</p>
                <div class="product-price-row">
                    <span class="product-price">${priceDisplay}</span>
                    ${oldPriceDisplay ? `<span class="product-old-price">${oldPriceDisplay}</span>` : ''}
                </div>
                <div class="product-stock ${productStock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${productStock > 0 ? `📦 متوفر (${productStock})` : '❌ غير متوفر'}
                </div>
                
                <!-- ✅ زر إضافة للسلة -->
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCartFromCard('${productId}')">
                    <i class="fas fa-cart-plus"></i> أضف للسلة
                </button>
                
                <!-- ✅ زر إتمام الطلب مباشرة -->
                <button class="checkout-btn-bottom" onclick="event.stopPropagation(); redirectToCheckout('${productId}')">
                    <i class="fas fa-credit-card"></i> 💳 إتمام الطلب مباشرة
                </button>
                
                <!-- ✅ زر تخصيص -->
                <button class="customize-btn-bottom" onclick="event.stopPropagation(); openDesignStudio('${productImage}', '${productName}', '${productId}')">
                    <i class="fas fa-paint-brush"></i> 🎨 تخصيص وتصميم الدرع
                </button>
            </div>
        </div>
    `}).join('');
    
    setTimeout(() => initGalleries(), 100);
    console.log('✅ تم عرض', validProducts.length, 'منتج');
}
window.renderProducts = renderProducts;

// ============================================
// ===== دوال معرض الصور المتعددة =====
// ============================================
function initGalleries() {
    document.querySelectorAll('.product-image-gallery').forEach(gallery => {
        const productId = gallery.dataset.productId;
        const track = gallery.querySelector('.gallery-track');
        if (!track) return;
        let startX = 0;
        let currentTranslate = 0;
        let isDragging = false;
        track.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });
        track.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            const diff = startX - e.touches[0].clientX;
            const slides = track.querySelectorAll('.gallery-slide');
            const slideWidth = track.offsetWidth;
            const maxTranslate = (slides.length - 1) * slideWidth;
            currentTranslate = Math.max(0, Math.min(maxTranslate, currentTranslate + diff));
            track.style.transform = `translateX(-${currentTranslate}px)`;
            startX = e.touches[0].clientX;
        }, { passive: true });
        track.addEventListener('touchend', function() {
            isDragging = false;
            const slides = track.querySelectorAll('.gallery-slide');
            const slideWidth = track.offsetWidth;
            const currentIndex = Math.round(currentTranslate / slideWidth);
            goToGallerySlide(productId, Math.max(0, Math.min(currentIndex, slides.length - 1)));
        }, { passive: true });
    });
}

let galleryStates = {};

function moveGallery(productId, direction) {
    if (!galleryStates[productId]) {
        galleryStates[productId] = { currentIndex: 0 };
    }
    const state = galleryStates[productId];
    const gallery = document.querySelector(`.product-image-gallery[data-product-id="${productId}"]`);
    if (!gallery) return;
    const slides = gallery.querySelectorAll('.gallery-slide');
    if (slides.length <= 1) return;
    state.currentIndex = (state.currentIndex + direction + slides.length) % slides.length;
    goToGallerySlide(productId, state.currentIndex);
}

function goToGallerySlide(productId, index) {
    const gallery = document.querySelector(`.product-image-gallery[data-product-id="${productId}"]`);
    if (!gallery) return;
    const track = gallery.querySelector('.gallery-track');
    const slides = gallery.querySelectorAll('.gallery-slide');
    const dots = gallery.querySelectorAll('.gallery-dots .dot');
    if (!track || slides.length === 0) return;
    const slideWidth = track.offsetWidth || 100;
    track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform = `translateX(-${index * slideWidth}px)`;
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    if (!galleryStates[productId]) {
        galleryStates[productId] = { currentIndex: 0 };
    }
    galleryStates[productId].currentIndex = index;
}

// ============================================
// ===== دوال البحث عن المنتج من أي مصدر (محسنة بالكامل) =====
// ============================================
function findProductById(productId) {
    if (!productId) return null;
    
    console.log('🔍 البحث عن المنتج:', productId);
    
    // 1. البحث في مصفوفة products العامة
    let product = products.find(p => p && (p.id === productId || p._id === productId));
    if (product) {
        console.log('✅ تم العثور على المنتج في المصفوفة:', product.name);
        return product;
    }
    
    // 2. البحث في DOM عن طريق عناصر المنتج (جميع الأنواع)
    const productElements = document.querySelectorAll('.product-item, .product-card, .section-product-card');
    for (const el of productElements) {
        const id = el.dataset.productId;
        if (id === productId) {
            console.log('✅ تم العثور على المنتج في DOM');
            const nameEl = el.querySelector('.product-name, h3, .product-info h3');
            const priceEl = el.querySelector('.product-price, .price-display');
            const descEl = el.querySelector('.product-desc, .product-description');
            const imgEl = el.querySelector('.product-image img, .gallery-slide img');
            const stockEl = el.querySelector('.product-stock, .in-stock, .out-of-stock');
            const categoryEl = el.querySelector('.product-category');
            
            let price = 0;
            if (priceEl) {
                const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
                price = parseFloat(priceText) || 0;
            }
            
            let stock = 99;
            if (stockEl) {
                const stockText = stockEl.textContent.match(/\d+/);
                if (stockText) {
                    stock = parseInt(stockText[0]) || 99;
                }
            }
            
            product = {
                id: productId,
                name: nameEl ? nameEl.textContent.trim() : 'منتج',
                price: price,
                description: descEl ? descEl.textContent.trim() : '',
                image_url: imgEl ? imgEl.src : PLACEHOLDER_IMAGE,
                stock: stock,
                category: categoryEl ? categoryEl.textContent.trim() : 'عام',
                currency: 'SAR',
                isCustom: el.dataset.isCustom === 'true' || false
            };
            
            // إضافة المنتج إلى المصفوفة العامة إذا لم يكن موجوداً
            if (!products.some(p => p && p.id === productId)) {
                products.push(product);
            }
            return product;
        }
    }
    
    // 3. البحث في المنتجات المخصصة في localStorage
    try {
        const customDesigns = JSON.parse(localStorage.getItem('tithkari_custom_designs') || '[]');
        const design = customDesigns.find(d => d.id === productId || d.timestamp === productId);
        if (design) {
            console.log('✅ تم العثور على المنتج في التصميمات المخصصة:', design.name);
            product = {
                id: productId,
                name: design.name || 'درع مخصص',
                price: design.price || 199,
                description: design.description || 'درع مصمم حسب الطلب',
                image_url: design.image || design.image_url || PLACEHOLDER_IMAGE,
                stock: 99,
                category: 'مخصص',
                isCustom: true,
                currency: 'SAR',
                custom_data: design
            };
            products.push(product);
            return product;
        }
    } catch (e) {
        console.warn('⚠️ خطأ في البحث في التصميمات المخصصة:', e);
    }
    
    console.warn('⚠️ لم يتم العثور على المنتج:', productId);
    return null;
}

/**
 * جلب المنتج من Supabase إذا لم يوجد محلياً
 */
async function fetchProductFromSupabase(productId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        if (error) {
            console.error('❌ خطأ في جلب المنتج:', error);
            return null;
        }
        if (data) {
            if (!products.some(p => p && p.id === productId)) {
                products.push(data);
            }
            return data;
        }
        return null;
    } catch (error) {
        console.error('❌ خطأ في جلب المنتج من Supabase:', error);
        return null;
    }
}

// ============================================
// ===== دالة الإضافة من بطاقة المنتج (محسنة بالكامل) =====
// ============================================
function addToCartFromCard(productId) {
    console.log('🛒 إضافة من البطاقة:', productId);
    
    if (!productId) {
        showToast('⚠️ معرف المنتج غير صالح', 'error');
        return;
    }
    
    // محاولة العثور على المنتج
    let product = findProductById(productId);
    
    if (!product) {
        // محاولة جلب المنتج من Supabase
        fetchProductFromSupabase(productId).then(fetched => {
            if (fetched) {
                addToCart(fetched);
            } else {
                showToast('⚠️ المنتج غير موجود', 'error');
            }
        });
        return;
    }
    
    addToCart(product);
}
window.addToCartFromCard = addToCartFromCard;

// ============================================
// ===== دالة الإضافة للسلة (محسنة بالكامل) =====
// ============================================
function addToCart(product) {
    if (!product) {
        showToast('❌ المنتج غير موجود', 'error');
        return;
    }
    
    const productId = product.id || 'temp_' + Date.now();
    
    // التأكد من أن المنتج له اسم
    if (!product.name || product.name === 'غير معرف' || product.name === '') {
        // محاولة جلب الاسم من DOM
        const el = document.querySelector(`[data-product-id="${productId}"]`);
        if (el) {
            const nameEl = el.querySelector('.product-name, h3, .product-info h3');
            if (nameEl) {
                product.name = nameEl.textContent.trim();
            }
        }
        // إذا لم يوجد اسم، استخدم اسم افتراضي
        if (!product.name || product.name === 'غير معرف' || product.name === '') {
            product.name = 'منتج #' + productId.substring(0, 8);
        }
    }
    
    // التأكد من وجود صورة
    if (!product.image_url || product.image_url === '') {
        const el = document.querySelector(`[data-product-id="${productId}"]`);
        if (el) {
            const imgEl = el.querySelector('.product-image img, .gallery-slide img');
            if (imgEl && imgEl.src) {
                product.image_url = imgEl.src;
            }
        }
        if (!product.image_url) {
            product.image_url = PLACEHOLDER_IMAGE;
        }
    }
    
    // التأكد من وجود سعر
    if (!product.price || product.price === 0) {
        const el = document.querySelector(`[data-product-id="${productId}"]`);
        if (el) {
            const priceEl = el.querySelector('.product-price, .price-display');
            if (priceEl) {
                const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
                product.price = parseFloat(priceText) || 199;
            }
        }
        if (!product.price || product.price === 0) {
            product.price = 199;
        }
    }
    
    // التأكد من وجود مخزون
    if (product.stock === undefined || product.stock === null) {
        product.stock = 99;
    }
    
    // التأكد من وجود عملة
    if (!product.currency) {
        product.currency = 'SAR';
    }
    
    // التحقق من المخزون
    if (product.stock <= 0) {
        showToast('❌ هذا المنتج نفذ من المخزون', 'error');
        return;
    }
    
    // الحقول المخصصة
    const productWithFields = {
        ...product,
        id: productId,
        customFields: product.customFields || []
    };
    
    // التحقق من الحقول المطلوبة
    if (productWithFields.customFields && productWithFields.customFields.length > 0) {
        const requiredMissing = productWithFields.customFields.filter(f => f.is_required && !f.value);
        if (requiredMissing.length > 0) {
            showToast(`⚠️ الرجاء إكمال جميع الحقول المطلوبة`, 'warning');
            return;
        }
    }
    
    // البحث عن المنتج في السلة
    const existing = cart.find(item => item && item.id === productId && !item.isCustom);
    
    if (existing) {
        if (existing.quantity >= productWithFields.stock) {
            showToast('❌ لا يوجد مخزون كافٍ', 'error');
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({ 
            ...productWithFields, 
            quantity: 1,
            customFields: productWithFields.customFields || []
        });
    }
    
    // حفظ في localStorage
    localStorage.setItem('tithkari_cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`✅ تم إضافة "${productWithFields.name}"`, 'success');
}
window.addToCart = addToCart;

// ============================================
// ===== دالة الإضافة من نافذة المنتج (محسنة) =====
// ============================================
// ✅ نسخة واحدة فقط من addFromModal - تم إزالة التكرار
function addFromModal(productId) {
    const product = findProductById(productId);
    if (!product) {
        showToast('❌ المنتج غير موجود', 'error');
        return;
    }
    try {
        const customData = collectCustomFields(productId);
        const quantity = window.currentModalQuantity || 1;
        const productWithCustom = {
            ...product,
            customFields: customData,
            quantity: quantity
        };
        const requiredFields = customData.filter(f => f.is_required && !f.value);
        if (requiredFields.length > 0) {
            showToast(`⚠️ الرجاء إكمال جميع الحقول المطلوبة`, 'warning');
            return;
        }
        const existing = cart.find(item => item && item.id === productId && !item.isCustom);
        if (existing) {
            if (existing.quantity >= product.stock) {
                showToast('❌ لا يوجد مخزون كافٍ', 'error');
                return;
            }
            existing.quantity += quantity;
        } else {
            cart.push(productWithCustom);
        }
        localStorage.setItem('tithkari_cart', JSON.stringify(cart));
        updateCartUI();
        closeModal();
        showToast(`✅ تم إضافة "${product.name}"`, 'success');
    } catch (error) {
        showToast(error.message, 'warning');
    }
}
window.addFromModal = addFromModal;

// ============================================
// ===== دالة التوجيه المباشر للدفع (محسنة) =====
// ============================================
function redirectToCheckout(productId) {
    console.log('💳 التوجيه المباشر للدفع:', productId);
    
    if (!productId) {
        showToast('⚠️ معرف المنتج غير صالح', 'error');
        return;
    }
    
    let product = findProductById(productId);
    
    if (!product) {
        fetchProductFromSupabase(productId).then(fetched => {
            if (fetched) {
                redirectToCheckoutWithProduct(fetched);
            } else {
                showToast('⚠️ المنتج غير موجود', 'error');
            }
        });
        return;
    }
    
    redirectToCheckoutWithProduct(product);
}

function redirectToCheckoutWithProduct(product) {
    if (!product) {
        showToast('❌ المنتج غير موجود', 'error');
        return;
    }
    
    // التأكد من وجود جميع البيانات
    if (!product.name || product.name === 'غير معرف') {
        product.name = 'منتج #' + (product.id || 'unknown').substring(0, 8);
    }
    if (!product.image_url) {
        product.image_url = PLACEHOLDER_IMAGE;
    }
    if (!product.price || product.price === 0) {
        product.price = 199;
    }
    if (!product.currency) {
        product.currency = 'SAR';
    }
    
    if (product.stock <= 0) {
        showToast('❌ هذا المنتج نفذ من المخزون', 'error');
        return;
    }
    
    const existing = cart.find(item => item && item.id === product.id && !item.isCustom);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            customFields: []
        });
    }
    
    localStorage.setItem('tithkari_cart', JSON.stringify(cart));
    updateCartUI();
    openCheckoutPage();
}
window.redirectToCheckout = redirectToCheckout;

// ============================================
// ===== البحث عن المنتجات =====
// ============================================
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    let filtered = products;
    if (query) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }
    if (category) {
        filtered = filtered.filter(p => p.category === category || p.category_slug === category);
    }
    renderProducts(filtered);
    updateProductCount();
}
window.searchProducts = searchProducts;

// ============================================
// ===== نظام الكوبونات =====
// ============================================
async function applyCoupon() {
    const input = document.getElementById('couponInput');
    const code = input.value.trim().toUpperCase();
    const message = document.getElementById('couponMessage');
    if (!code) {
        message.textContent = '⚠️ الرجاء إدخال كود الخصم';
        message.className = 'error';
        return;
    }
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('status', 'active')
            .single();
        if (error || !data) {
            message.textContent = '❌ كود غير صالح أو منتهي الصلاحية';
            message.className = 'error';
            appliedCoupon = null;
            updateCartUI();
            return;
        }
        if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
            message.textContent = '❌ انتهت صلاحية الكود';
            message.className = 'error';
            appliedCoupon = null;
            updateCartUI();
            return;
        }
        if (data.max_uses && data.used_count >= data.max_uses) {
            message.textContent = '❌ تم استخدام هذا الكود الحد الأقصى من المرات';
            message.className = 'error';
            appliedCoupon = null;
            updateCartUI();
            return;
        }
        appliedCoupon = data;
        message.textContent = `✅ تم تطبيق الخصم: ${data.discount_value}${data.discount_type === 'percentage' ? '%' : ' ر.س'}`;
        message.className = 'success';
        updateCartUI();
    } catch (error) {
        console.error('خطأ في تطبيق الكوبون:', error);
        message.textContent = '❌ حدث خطأ، حاول مرة أخرى';
        message.className = 'error';
    }
}
window.applyCoupon = applyCoupon;

function calculateDiscount(total) {
    if (!appliedCoupon) return 0;
    let discount = 0;
    if (appliedCoupon.min_order_amount && total < appliedCoupon.min_order_amount) {
        return 0;
    }
    if (appliedCoupon.discount_type === 'percentage') {
        discount = (total * appliedCoupon.discount_value) / 100;
        if (appliedCoupon.max_discount) {
            discount = Math.min(discount, appliedCoupon.max_discount);
        }
    } else {
        discount = appliedCoupon.discount_value;
    }
    return Math.min(discount, total);
}

// ============================================
// ===== نظام الحقول المخصصة للمنتجات =====
// ============================================
const FIELD_TYPES = {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    SELECT: 'select',
    FILE: 'file',
    COLOR: 'color',
    DATE: 'date'
};

async function getProductCustomFields(productId) {
    try {
        const { data, error } = await supabase
            .from('product_custom_fields')
            .select('*')
            .eq('product_id', productId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        if (error) {
            console.error('❌ خطأ في جلب الحقول المخصصة:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('❌ خطأ في جلب الحقول المخصصة:', error);
        return [];
    }
}

async function renderCustomFields(productId) {
    let container = document.getElementById('customFieldsContainer');
    if (!container) {
        const section = document.getElementById('customFieldsSection');
        if (section) {
            container = document.createElement('div');
            container.id = 'customFieldsContainer';
            section.appendChild(container);
        } else {
            console.warn('⚠️ customFieldsSection not found');
            return;
        }
    }
    const fields = await getProductCustomFields(productId);
    console.log('📋 Fields to render:', fields.length);
    if (fields.length === 0) {
        container.innerHTML = `
            <div style="color:var(--gray);font-size:13px;padding:8px 0;">
                <i class="fas fa-info-circle"></i> لا توجد تفاصيل إضافية مطلوبة لهذا المنتج
            </div>
        `;
        return;
    }
    container.innerHTML = fields.map(field => {
        let inputHtml = '';
        const fieldId = `custom_field_${field.id}`;
        switch (field.field_type) {
            case 'text':
                inputHtml = `
                    <input type="text" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="custom-field-input"
                           placeholder="${field.placeholder || ''}"
                           ${field.is_required ? 'required' : ''}
                           data-field-id="${field.id}"
                           data-field-name="${field.field_name}"
                           data-is-required="${field.is_required}"
                           data-field-type="text" />
                `;
                break;
            case 'textarea':
                inputHtml = `
                    <textarea id="${fieldId}" 
                              name="${fieldId}" 
                              class="custom-field-input"
                              placeholder="${field.placeholder || ''}"
                              rows="3"
                              ${field.is_required ? 'required' : ''}
                              data-field-id="${field.id}"
                              data-field-name="${field.field_name}"
                              data-is-required="${field.is_required}"
                              data-field-type="textarea"></textarea>
                `;
                break;
            case 'select':
                const options = field.options ? field.options.split(',') : [];
                inputHtml = `
                    <select id="${fieldId}" 
                            name="${fieldId}" 
                            class="custom-field-input"
                            ${field.is_required ? 'required' : ''}
                            data-field-id="${field.id}"
                            data-field-name="${field.field_name}"
                            data-is-required="${field.is_required}"
                            data-field-type="select">
                        <option value="">-- اختر --</option>
                        ${options.map(opt => `<option value="${opt.trim()}">${opt.trim()}</option>`).join('')}
                    </select>
                `;
                break;
            case 'file':
                inputHtml = `
                    <input type="file" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="custom-field-input"
                           accept="image/*"
                           ${field.is_required ? 'required' : ''}
                           data-field-id="${field.id}"
                           data-field-name="${field.field_name}"
                           data-is-required="${field.is_required}"
                           data-field-type="file" />
                    <small style="color:var(--gray);font-size:11px;display:block;margin-top:3px;">
                        ${field.help_text || 'يمكنك رفع صورة (jpg, png, svg)'}
                    </small>
                `;
                break;
            case 'color':
                inputHtml = `
                    <input type="color" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="custom-field-input"
                           value="#FFD700"
                           ${field.is_required ? 'required' : ''}
                           data-field-id="${field.id}"
                           data-field-name="${field.field_name}"
                           data-is-required="${field.is_required}"
                           data-field-type="color" />
                `;
                break;
            case 'date':
                inputHtml = `
                    <input type="date" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="custom-field-input"
                           ${field.is_required ? 'required' : ''}
                           data-field-id="${field.id}"
                           data-field-name="${field.field_name}"
                           data-is-required="${field.is_required}"
                           data-field-type="date" />
                `;
                break;
            default:
                inputHtml = `
                    <input type="text" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="custom-field-input"
                           placeholder="${field.placeholder || ''}"
                           ${field.is_required ? 'required' : ''}
                           data-field-id="${field.id}"
                           data-field-name="${field.field_name}"
                           data-is-required="${field.is_required}"
                           data-field-type="text" />
                `;
        }
        return `
            <div class="custom-field-group" data-field-id="${field.id}">
                <label for="${fieldId}" class="custom-field-label">
                    ${field.field_name}
                    ${field.is_required ? '<span class="required-star" style="color:#ef4444;">*</span>' : ''}
                    ${field.help_text ? `<span class="field-help" style="font-size:11px;color:var(--gray);">(${field.help_text})</span>` : ''}
                </label>
                ${inputHtml}
            </div>
        `;
    }).join('');
    console.log('✅ Custom fields rendered:', fields.length);
}

function collectCustomFields(productId) {
    const container = document.getElementById('customFieldsContainer');
    if (!container) {
        console.warn('⚠️ customFieldsContainer not found');
        return [];
    }
    const fields = container.querySelectorAll('.custom-field-input');
    const data = [];
    console.log('📋 Found fields in DOM:', fields.length);
    fields.forEach(field => {
        const fieldId = field.dataset.fieldId;
        const fieldName = field.dataset.fieldName;
        const fieldType = field.dataset.fieldType;
        const isRequired = field.dataset.isRequired === 'true';
        let value = '';
        if (fieldType === 'file') {
            if (field.files && field.files.length > 0) {
                value = field.files[0].name;
            }
        } else {
            value = field.value || '';
        }
        console.log(`  📝 ${fieldName}: ${value || '(فارغ)'}`);
        if (isRequired && !value) {
            field.style.borderColor = '#f44336';
            field.style.boxShadow = '0 0 0 2px rgba(244,67,54,0.2)';
            field.focus();
            throw new Error(`⚠️ الرجاء إكمال حقل "${fieldName}"`);
        }
        field.style.borderColor = '';
        field.style.boxShadow = '';
        data.push({
            field_id: fieldId,
            field_name: fieldName,
            field_type: fieldType,
            value: value,
            is_required: isRequired
        });
    });
    console.log('📋 Collected custom fields:', data);
    return data;
}
window.collectCustomFields = collectCustomFields;

// ============================================
// ===== اختيار طريقة الدفع =====
// ============================================
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.method === method);
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = option.dataset.method === method;
        }
    });
    const bankInfo = document.getElementById('bankTransferInfo');
    if (bankInfo) {
        bankInfo.style.display = method === 'bank' ? 'block' : 'none';
    }
}
window.selectPaymentMethod = selectPaymentMethod;

// ============================================
// ===== تحديث نافذة المنتج لعرض الحقول المخصصة =====
// ============================================
async function openProductModal(productId) {
    const product = findProductById(productId);
    if (!product) {
        console.error('❌ Product not found:', productId);
        showToast('⚠️ المنتج غير موجود', 'error');
        return;
    }
    const modal = document.getElementById('productModal');
    const body = document.getElementById('modalBody');
    const productCurrency = product.currency || 'SAR';
    const priceDisplay = displayPrice(product.price, productCurrency);
    body.innerHTML = `
        <div class="modal-product">
            <div class="modal-image">
                <img src="${product.image_url || PLACEHOLDER_IMAGE}" 
                     alt="${product.name}"
                     loading="lazy"
                     onerror="this.src='${PLACEHOLDER_IMAGE}'" />
            </div>
            <div class="modal-info">
                <h2>${product.name}</h2>
                ${product.category ? `<span class="modal-category" style="color:var(--gold);font-size:13px;background:rgba(255,215,0,0.1);padding:2px 12px;border-radius:12px;display:inline-block;">${product.category}</span>` : ''}
                ${product.isCustom ? '<span style="color:#8B5CF6;font-size:14px;display:block;margin-top:5px;">🎨 تصميم مخصص</span>' : ''}
                <div class="modal-price" style="font-size:24px;font-weight:700;color:var(--gold);margin:10px 0;">${priceDisplay}</div>
                <p class="modal-description" style="color:var(--gray);margin:10px 0;line-height:1.8;">${product.description || 'لا يوجد وصف لهذا المنتج'}</p>
                <div class="modal-meta" style="background:var(--dark);border-radius:12px;padding:12px;margin:10px 0;">
                    <div class="meta-item" style="display:flex;justify-content:space-between;color:var(--gray);padding:4px 0;">
                        <span>📦 المخزون</span>
                        <span>${product.stock > 0 ? `${product.stock} قطعة` : '⚠️ نفذ من المخزون'}</span>
                    </div>
                    <div class="meta-item" style="display:flex;justify-content:space-between;color:var(--gray);padding:4px 0;">
                        <span>🏷️ التصنيف</span>
                        <span>${product.category || 'غير مصنف'}</span>
                    </div>
                </div>
                
                <div class="custom-fields-section" id="customFieldsSection" style="margin:15px 0;padding:15px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,215,0,0.05);">
                    <h4 style="color:var(--gold);margin:0 0 12px 0;font-size:16px;display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-pencil-alt"></i> تفاصيل الطلب
                        <span style="font-size:12px;color:var(--gray);font-weight:normal;">(اختياري)</span>
                    </h4>
                    <div id="customFieldsContainer">
                        <div style="color:var(--gray);font-size:13px;padding:8px 0;">
                            <i class="fas fa-spinner fa-spin"></i> جاري تحميل الحقول...
                        </div>
                    </div>
                </div>
                
                <div class="modal-quantity" style="display:flex;align-items:center;gap:15px;margin:15px 0;">
                    <button onclick="changeQuantity(-1)" aria-label="تقليل الكمية">-</button>
                    <span class="quantity-number" id="modalQuantity" style="font-size:20px;font-weight:700;min-width:30px;text-align:center;">1</span>
                    <button onclick="changeQuantity(1)" aria-label="زيادة الكمية">+</button>
                </div>
                <button class="btn-primary" onclick="addFromModal('${product.id}')" style="width:100%;justify-content:center;display:flex;align-items:center;gap:10px;padding:14px 32px;background:linear-gradient(135deg,var(--gold),var(--gold-light));color:var(--dark);border:none;border-radius:50px;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.3s ease;min-height:52px;">
                    <i class="fas fa-cart-plus"></i> أضف للسلة
                </button>
                <button class="btn-primary" onclick="openDesignStudio('${product.image_url || PLACEHOLDER_IMAGE}', '${product.name}', '${product.id}')" 
                        style="width:100%;justify-content:center;margin-top:8px;background:linear-gradient(135deg, #8B5CF6, #6D28D9);color:white;border:none;border-radius:50px;padding:14px 32px;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;gap:10px;min-height:52px;">
                    <i class="fas fa-paint-brush"></i> 🎨 تخصيص وتصميم الدرع
                </button>
                <button class="btn-primary" onclick="redirectToCheckout('${product.id}')" 
                        style="width:100%;justify-content:center;margin-top:8px;background:linear-gradient(135deg, #10b981, #059669);color:white;border:none;border-radius:50px;padding:14px 32px;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;gap:10px;min-height:52px;">
                    <i class="fas fa-credit-card"></i> 💳 إتمام الطلب مباشرة
                </button>
            </div>
        </div>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    window.currentModalProduct = product;
    window.currentModalQuantity = 1;
    setTimeout(async function() {
        await renderCustomFields(productId);
    }, 200);
}
window.openProductModal = openProductModal;

// ============================================
// ===== عرض الحقول المخصصة في السلة =====
// ============================================
function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = count;
    const itemsContainer = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!itemsContainer) return;
    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="empty-cart">🛒 السلة فارغة</p>';
        if (totalEl) totalEl.textContent = '0.00 ر.س';
        return;
    }
    itemsContainer.innerHTML = cart.map(item => {
        const itemCurrency = item.currency || 'SAR';
        const itemTotal = item.price * item.quantity;
        const priceDisplay = displayPrice(itemTotal, itemCurrency);
        let customFieldsSummary = '';
        if (item.customFields && item.customFields.length > 0) {
            customFieldsSummary = `
                <div class="cart-item-custom-fields">
                    ${item.customFields.map(f => `
                        <span class="custom-field-tag">
                            <strong>${f.field_name}:</strong> 
                            ${f.field_type === 'file' ? '📎 ملف مرفق' : f.value || '—'}
                        </span>
                    `).join('')}
                </div>
            `;
        }
        return `
        <div class="cart-item">
            <img src="${item.image_url || PLACEHOLDER_SMALL}" 
                 alt="${item.name}" 
                 loading="lazy"
                 onerror="this.src='${PLACEHOLDER_SMALL}'" />
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${priceDisplay}</div>
                <div class="cart-item-quantity">الكمية: ${item.quantity}</div>
                ${item.isCustom ? '<span style="color:#8B5CF6;font-size:11px;">🎨 مخصص</span>' : ''}
                ${customFieldsSummary}
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" aria-label="إزالة المنتج">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `}).join('');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = calculateDiscount(total);
    const finalTotal = total - discount;
    const totalDisplay = displayPrice(finalTotal, 'SAR');
    const totalOriginalDisplay = displayPrice(total, 'SAR');
    if (totalEl) {
        if (discount > 0) {
            totalEl.innerHTML = `
                <div style="text-decoration:line-through;color:var(--gray);font-size:16px;">${totalOriginalDisplay}</div>
                <div style="color:#4CAF50;">${totalDisplay} <span class="total-discount">(خصم ${displayPrice(discount, 'SAR')})</span></div>
            `;
        } else {
            totalEl.textContent = totalDisplay;
        }
    }
    localStorage.setItem('tithkari_cart', JSON.stringify(cart));
}

// ============================================
// ===== حفظ الطلب مع البيانات المخصصة =====
// ============================================
async function saveOrder(orderId, customerName, customerEmail, customerPhone, address, cartItems, total, discount, couponCode) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert({
                order_number: orderId,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                shipping_address: address,
                notes: '',
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image_url: item.image_url,
                    isCustom: item.isCustom || false,
                    currency: item.currency || 'SAR',
                    custom_fields: item.customFields || []
                })),
                total_amount: total,
                discount_applied: discount,
                coupon_code: couponCode || null,
                currency: currentCurrency,
                payment_method: selectedPaymentMethod,
                status: 'pending',
                payment_status: 'pending',
                created_at: new Date().toISOString()
            });
        if (error) throw error;
        console.log('✅ تم حفظ الطلب:', orderId);
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ الطلب:', error);
        throw error;
    }
}

// ============================================
// ===== إدارة السلة =====
// ============================================
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    appliedCoupon = null;
    document.getElementById('couponInput').value = '';
    document.getElementById('couponMessage').textContent = '';
    localStorage.setItem('tithkari_cart', JSON.stringify(cart));
    updateCartUI();
}
window.removeFromCart = removeFromCart;

function loadCartFromStorage() {
    try {
        const savedCart = JSON.parse(localStorage.getItem('tithkari_cart') || '[]');
        if (savedCart.length > 0) {
            cart = savedCart;
            updateCartUI();
            console.log('✅ تم تحميل السلة من التخزين المحلي:', cart.length, 'عناصر');
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل السلة:', error);
    }
}

// ============================================
// ===== التحكم بالسلة =====
// ============================================
function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('cartOverlay').classList.toggle('active');
}
window.toggleCart = toggleCart;

// ============================================
// ===== أداة التصميم الأساسية =====
// ============================================
function initDesignTool() {
    const colorPicker = document.getElementById('colorPicker');
    const shieldColor = document.getElementById('shieldColor');
    const patternSelect = document.getElementById('patternSelect');
    const shieldPattern = document.getElementById('shieldPattern');
    const symbolSelect = document.getElementById('symbolSelect');
    const shieldSymbol = document.getElementById('shieldSymbol');
    const addBtn = document.getElementById('addToCartDesign');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            shieldColor.style.backgroundColor = e.target.value;
        });
    }
    if (patternSelect) {
        patternSelect.addEventListener('change', (e) => {
            shieldPattern.className = 'shield-pattern ' + e.target.value;
        });
    }
    if (symbolSelect) {
        symbolSelect.addEventListener('change', (e) => {
            shieldSymbol.textContent = e.target.value;
        });
    }
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const design = {
                id: 'design_' + Date.now(),
                name: 'درع مخصص 🛡️',
                price: 199,
                category: 'مخصص',
                image_url: PLACEHOLDER_IMAGE,
                description: `لون: ${colorPicker?.value || ''} | رمز: ${symbolSelect?.value || ''}`,
                stock: 99,
                isCustom: true,
                currency: 'SAR'
            };
            addToCart(design);
        });
    }
}

// ============================================
// ===== فتح صفحة إتمام الطلب مع الحقول المخصصة =====
// ============================================
function openCheckoutPage() {
    if (cart.length === 0) {
        showToast('⚠️ السلة فارغة! أضف منتجات أولاً', 'warning');
        return;
    }
    const cartWithFields = cart.map(item => ({
        ...item,
        customFields: item.customFields || []
    }));
    localStorage.setItem('tithkari_checkout_cart', JSON.stringify(cartWithFields));
    localStorage.setItem('tithkari_checkout_coupon', JSON.stringify(appliedCoupon));
    console.log('📦 حفظ السلة مع الحقول المخصصة:', JSON.stringify(cartWithFields.map(i => ({
        name: i.name,
        fields: i.customFields
    })), null, 2));
    window.location.href = 'checkout.html';
}
window.openCheckoutPage = openCheckoutPage;

// ============================================
// ===== معالجة الدفع =====
// ============================================
async function handleCheckout() {
    if (cart.length === 0) {
        showToast('⚠️ السلة فارغة!', 'warning');
        return;
    }
    openCheckoutPage();
}
window.handleCheckout = handleCheckout;

// ============================================
// ===== الإشعارات =====
// ============================================
function showNotification(message) {
    showToast(message, 'info');
}
window.showNotification = showNotification;

// ============================================
// ===== تحميل التقييمات =====
// ============================================
async function loadReviews() {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(10);
        if (error) throw error;
        const grid = document.getElementById('reviewsGrid');
        if (!grid) return;
        if (!data || data.length === 0) {
            grid.innerHTML = '<p style="text-align:center;color:var(--gray);grid-column:1/-1;">لا توجد تقييمات بعد. كن أول من يقيّم! ⭐</p>';
            return;
        }
        grid.innerHTML = data.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-name">${review.customer_name}</span>
                    <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                </div>
                ${review.comment ? `<p class="review-comment">${review.comment}</p>` : ''}
                <div class="review-date">${new Date(review.created_at).toLocaleDateString('ar-SA')}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل التقييمات:', error);
    }
}

// ============================================
// ===== إضافة تقييم جديد =====
// ============================================
function initReviewForm() {
    const form = document.getElementById('reviewForm');
    if (!form) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('reviewName').value.trim();
        const rating = document.querySelector('input[name="rating"]:checked');
        const comment = document.getElementById('reviewComment').value.trim();
        if (!name) {
            alert('⚠️ الرجاء إدخال اسمك');
            return;
        }
        if (!rating) {
            alert('⚠️ الرجاء اختيار تقييم');
            return;
        }
        try {
            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    customer_name: name,
                    rating: parseInt(rating.value),
                    comment: comment,
                    status: 'pending'
                })
                .select();
            if (error) throw error;
            alert('✅ شكراً لتقييمك! سيتم مراجعته قريباً.');
            this.reset();
            loadReviews();
        } catch (error) {
            console.error('خطأ في إضافة التقييم:', error);
            alert('❌ حدث خطأ، حاول مرة أخرى');
        }
    });
}

// ============================================
// ===== أزرار التصفية السريعة =====
// ============================================
function initFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            if (filter === 'all') {
                renderProducts(products);
            } else {
                const filtered = products.filter(p => p.category === filter);
                renderProducts(filtered);
            }
            updateProductCount();
        });
    });
}

// ============================================
// ===== خيارات العرض =====
// ============================================
function initViewOptions() {
    const buttons = document.querySelectorAll('.view-btn');
    const grid = document.getElementById('productsGrid');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const view = this.dataset.view;
            grid.className = `products-grid ${view}-view`;
            localStorage.setItem('preferredView', view);
        });
    });
    const savedView = localStorage.getItem('preferredView') || storeSettings.display?.default_view || 'grid';
    const activeBtn = document.querySelector(`.view-btn[data-view="${savedView}"]`);
    if (activeBtn) {
        activeBtn.click();
    }
}

// ============================================
// ===== تحديث عدد المنتجات =====
// ============================================
function updateProductCount() {
    const grid = document.getElementById('productsGrid');
    const count = grid?.querySelectorAll('.product-card').length || 0;
    const el = document.getElementById('productCount');
    if (el) {
        el.textContent = `${count} منتج`;
    }
}

// ============================================
// ===== دوال التحكم في الكمية في النافذة =====
// ============================================
function changeQuantity(delta) {
    const el = document.getElementById('modalQuantity');
    let qty = parseInt(el.textContent) + delta;
    if (qty < 1) qty = 1;
    if (window.currentModalProduct && qty > window.currentModalProduct.stock) {
        qty = window.currentModalProduct.stock;
    }
    el.textContent = qty;
    window.currentModalQuantity = qty;
}
window.changeQuantity = changeQuantity;

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}
window.closeModal = closeModal;

// ============================================
// ===== دالة Toast لعرض الإشعارات =====
// ============================================
function showToast(message, type = 'info') {
    let toast = document.getElementById('toastContainer');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastContainer';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
            width: 100%;
            direction: rtl;
        `;
        document.body.appendChild(toast);
    }
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#FF9800',
        info: '#2196F3'
    };
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    const toastEl = document.createElement('div');
    toastEl.style.cssText = `
        background: #1A1A2E;
        color: #fff;
        padding: 12px 16px;
        border-radius: 12px;
        border-right: 4px solid ${colors[type] || '#2196F3'};
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        font-size: 14px;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: Cairo, sans-serif;
    `;
    toastEl.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    toast.appendChild(toastEl);
    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    setTimeout(() => {
        toastEl.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            toastEl.remove();
            if (toast.children.length === 0) {
                toast.remove();
            }
        }, 300);
    }, 3500);
}

// ============================================
// ===== إعادة تحميل التذييل قسراً =====
// ============================================
async function forceReloadFooter() {
    console.log('🔄 جاري إعادة تحميل التذييل...');
    showToast('⏳ جاري تحديث التذييل...', 'info');
    localStorage.removeItem('tithkari_footer_cache');
    localStorage.removeItem('tithkari_footer_items');
    localStorage.removeItem('tithkari_footer_updated');
    footerItems = [];
    await loadFooterItems();
    renderFooter();
    showToast('✅ تم تحديث التذييل بنجاح!', 'success');
}
window.forceReloadFooter = forceReloadFooter;

// ============================================
// ===== مراقبة تحديثات التذييل =====
// ============================================
function watchFooterUpdates() {
    setInterval(async function() {
        const lastUpdate = localStorage.getItem('tithkari_footer_updated');
        if (lastUpdate) {
            const savedTime = parseInt(lastUpdate);
            const currentTime = Date.now();
            if (currentTime - savedTime < 10000) {
                console.log('🔄 تم اكتشاف تحديث في التذييل، جاري إعادة التحميل...');
                localStorage.removeItem('tithkari_footer_updated');
                await loadFooterItems();
                console.log('✅ تم تحديث التذييل بنجاح');
            }
        }
    }, 3000);
}

// ============================================
// ===== نظام المنتجات المحسن =====
// ============================================
let domProductsCache = {};

function updateProductsCacheFromDOM() {
    const productElements = document.querySelectorAll('.product-item, .product-card, .section-product-card');
    console.log('🔄 تحديث ذاكرة التخزين المؤقت للمنتجات من DOM، عدد العناصر:', productElements.length);
    productElements.forEach(el => {
        const id = el.dataset.productId;
        if (!id) return;
        const nameEl = el.querySelector('.product-name, h3, .product-info h3');
        const priceEl = el.querySelector('.product-price, .price-display');
        const descEl = el.querySelector('.product-desc, .product-description');
        const imgEl = el.querySelector('.product-image img, .gallery-slide img');
        const stockEl = el.querySelector('.product-stock, .in-stock, .out-of-stock');
        const categoryEl = el.querySelector('.product-category');
        let price = 0;
        if (priceEl) {
            const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
            price = parseFloat(priceText) || 0;
        }
        let stock = 99;
        if (stockEl) {
            const stockText = stockEl.textContent.match(/\d+/);
            if (stockText) {
                stock = parseInt(stockText[0]) || 99;
            }
        }
        const product = {
            id: id,
            name: nameEl ? nameEl.textContent.trim() : 'منتج',
            price: price,
            description: descEl ? descEl.textContent.trim() : '',
            image_url: imgEl ? imgEl.src : PLACEHOLDER_IMAGE,
            stock: stock,
            category: categoryEl ? categoryEl.textContent.trim() : 'عام',
            currency: 'SAR'
        };
        domProductsCache[id] = product;
        if (!products.some(p => p && p.id === id)) {
            products.push(product);
        }
    });
    console.log('✅ تم تحديث ذاكرة التخزين المؤقت، عدد المنتجات:', Object.keys(domProductsCache).length);
}

setTimeout(() => {
    updateProductsCacheFromDOM();
    console.log('✅ تم تحديث ذاكرة التخزين المؤقت للمنتجات بعد تحميل الصفحة');
}, 1000);

if (window.MutationObserver) {
    const observer = new MutationObserver(() => {
        updateProductsCacheFromDOM();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    console.log('✅ تم تفعيل مراقبة تغييرات DOM لتحديث المنتجات');
}

// ============================================
// ===== إصلاح زر استعراض المنتجات =====
// ============================================
function fixProductsLinks() {
    const viewProductsLinks = document.querySelectorAll('a[href="#products"], .hero-buttons a[href="#products"]');
    viewProductsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const productSection = document.querySelector('.product-section, .products-section, #products');
            if (productSection) {
                productSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                productSection.style.transition = 'box-shadow 0.5s ease';
                productSection.style.boxShadow = '0 0 30px rgba(255,215,0,0.2)';
                setTimeout(() => {
                    productSection.style.boxShadow = 'none';
                }, 1500);
            } else {
                window.scrollTo({
                    top: window.innerHeight * 0.8,
                    behavior: 'smooth'
                });
            }
        });
    });
    document.querySelectorAll('.view-all, a.view-all').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sections = document.querySelectorAll('.product-section');
            if (sections.length > 0) {
                sections[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                const productSection = document.querySelector('#products, .products-section');
                if (productSection) {
                    productSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

function checkAndShowProductsMessage() {
    const productSections = document.querySelectorAll('.product-section');
    const productItems = document.querySelectorAll('.product-item, .product-card');
    if (productItems.length === 0 && productSections.length > 0) {
        productSections.forEach(section => {
            const container = section.querySelector('.products-carousel, .products-grid');
            if (container && !container.querySelector('.product-item, .product-card')) {
                if (!container.querySelector('.no-products-message')) {
                    const msg = document.createElement('div');
                    msg.className = 'no-products-message';
                    msg.style.cssText = `
                        grid-column: 1/-1;
                        text-align: center;
                        padding: 40px;
                        color: var(--gray);
                    `;
                    msg.innerHTML = `
                        <i class="fas fa-box-open" style="font-size: 40px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                        <h3 style="color: var(--white);">لا توجد منتجات</h3>
                        <p>سيتم إضافة منتجات قريباً</p>
                        <p style="font-size: 13px; margin-top: 10px;">
                            💡 يمكنك إضافة منتجات من 
                            <a href="admin/admin.html" style="color: var(--gold); text-decoration: underline;">لوحة التحكم</a>
                        </p>
                    `;
                    container.appendChild(msg);
                }
            }
        });
    }
}

function ensureProductsMenuItem() {
    const mainMenu = document.getElementById('mainMenu');
    if (!mainMenu) return;
    const hasProductsLink = mainMenu.querySelector('a[href="#products"]');
    if (!hasProductsLink) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#products">المنتجات</a>`;
        const firstLi = mainMenu.querySelector('li');
        if (firstLi) {
            firstLi.after(li);
        } else {
            mainMenu.appendChild(li);
        }
    }
}

setTimeout(() => {
    fixProductsLinks();
    ensureProductsMenuItem();
    checkAndShowProductsMessage();
    console.log('✅ تم إصلاح روابط المنتجات');
}, 500);

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        fixProductsLinks();
        checkAndShowProductsMessage();
    }, 1000);
});

if (window.MutationObserver) {
    const observer = new MutationObserver(() => {
        fixProductsLinks();
        checkAndShowProductsMessage();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

console.log('✅ تم تفعيل إصلاح روابط المنتجات');

// ============================================
// ===== دالة تحديث المنتجات المخصصة يدوياً =====
// ============================================
function refreshCustomProducts() {
    console.log('🔄 تحديث المنتجات المخصصة...');
    const designs = JSON.parse(localStorage.getItem('tithkari_custom_designs') || '[]');
    console.log('📦 عدد التصميمات:', designs.length);
    
    // إزالة المنتجات المخصصة القديمة
    products = products.filter(p => !p.is_custom_design);
    
    // إعادة إضافة التصميمات
    designs.forEach((design, index) => {
        const customId = design.id || 'custom_' + design.timestamp + '_' + index;
        products.push({
            id: customId,
            name: design.name || 'درع مخصص',
            price: design.price || 199,
            description: design.description || 'درع مصمم حسب الطلب',
            image_url: design.image || design.image_url || PLACEHOLDER_IMAGE,
            stock: 99,
            category: 'مخصص',
            isCustom: true,
            is_custom_design: true,
            currency: 'SAR',
            custom_data: design
        });
    });
    
    renderProducts(products);
    updateProductCount();
    console.log('✅ تم تحديث المنتجات المخصصة، العدد:', products.length);
}
window.refreshCustomProducts = refreshCustomProducts;

// ============================================
// ===== تهيئة التطبيق =====
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 جاري تهيئة المتجر...');
    initMobileOptimizations();
    await loadStoreSettings();
    loadCartFromStorage();
    await loadSettings();
    await renderMenus();
    await loadCategories();
    await loadProducts(); // ✅ تم تغييرها إلى await لضمان تحميل المنتجات
    await initCarousel();
    await loadFooterItems();
    initDesignTool();
    initFilterButtons();
    initViewOptions();
    loadReviews();
    initReviewForm();
    const currencySelector = document.getElementById('currencySelector');
    if (currencySelector) {
        currencySelector.value = currentCurrency;
    }
    watchFooterUpdates();
    const cartToggle = document.getElementById('cartToggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCart);
        cartToggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            toggleCart();
        }, { passive: false });
    }
    const closeCart = document.getElementById('closeCart');
    if (closeCart) {
        closeCart.addEventListener('click', toggleCart);
        closeCart.addEventListener('touchstart', function(e) {
            e.preventDefault();
            toggleCart();
        }, { passive: false });
    }
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', toggleCart);
        cartOverlay.addEventListener('touchstart', function(e) {
            e.preventDefault();
            toggleCart();
        }, { passive: false });
    }
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
        checkoutBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleCheckout();
        }, { passive: false });
    }
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
        modalClose.addEventListener('touchstart', function(e) {
            e.preventDefault();
            closeModal();
        }, { passive: false });
    }
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchProducts, 300);
        });
    }
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', searchProducts);
    }
    console.log('✅ تم تهيئة المتجر بنجاح');
    console.log('📱 وضع الجوال:', isMobileDevice());
    console.log('👆 جهاز يعمل باللمس:', isTouchDevice());
    console.log('📦 عدد المنتجات المحملة:', products.length);
});

// ============================================
// ===== دوال تصحيح الأخطاء =====
// ============================================
window.debugCart = function() {
    console.log('🛒 Cart contents:');
    cart.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.name}`);
        console.log(`     customFields:`, item.customFields || []);
        console.log(`     isCustom: ${item.isCustom || false}`);
    });
};

window.debugLocalStorage = function() {
    console.log('💾 localStorage:');
    const keys = ['tithkari_cart', 'tithkari_checkout_cart'];
    keys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`  ${key}:`, value ? JSON.parse(value) : 'null');
    });
};

window.debugCustomFields = function() {
    const container = document.getElementById('customFieldsContainer');
    if (!container) {
        console.log('❌ customFieldsContainer not found');
        return;
    }
    const fields = container.querySelectorAll('.custom-field-input');
    console.log(`📋 Found ${fields.length} fields in DOM`);
    fields.forEach(f => {
        console.log(`  ${f.dataset.fieldName}: ${f.value || '(empty)'}`);
    });
};

window.debugPaymentMethod = function() {
    console.log('💳 Payment method:', selectedPaymentMethod);
};

window.debugGalleries = function() {
    console.log('🖼️ Gallery states:', galleryStates);
};

window.debugFindProduct = function(productId) {
    console.log('🔍 Searching for product:', productId);
    const product = findProductById(productId);
    console.log('📦 Found product:', product);
    return product;
};

console.log('✅ app.js loaded successfully with all features');