// ============================================
// استيراد Supabase
// ============================================
import { createClient } from '@supabase/supabase-js';

// ============================================
// إعدادات Supabase
// ============================================
const supabaseUrl = 'https://savtqajghyloevzwrzvt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase initialized');

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
// ===== ربط التصميمات المخصصة =====
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
    if (designs.length === 0) return;
    
    designs.forEach(design => {
        const exists = products.some(p => p.id === 'custom_' + design.timestamp);
        if (!exists) {
            products.push({
                id: 'custom_' + design.timestamp,
                name: design.name || 'درع مخصص',
                price: design.price || 199,
                description: design.description || 'درع مصمم حسب الطلب',
                image_url: design.image || PLACEHOLDER_IMAGE,
                stock: 99,
                category: 'مخصص',
                isCustom: true,
                currency: 'SAR'
            });
        }
    });
}

// ============================================
// ===== فتح المصمم المتقدم =====
// ============================================
function openDesignStudio(productImage, productName, productId) {
    const designData = {
        productImage: productImage || PLACEHOLDER_IMAGE,
        productName: productName || 'درع مخصص',
        productId: productId || null,
        timestamp: Date.now()
    };
    
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
    const banners = await loadBannersFromDB();
    const track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots');
    
    if (!track) {
        console.error('❌ carouselTrack غير موجود');
        return;
    }
    
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
                ${hasImage ? `<img src="${banner.image_url}" alt="${banner.title}" />` : ''}
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
        
        document.getElementById('carouselPrev')?.addEventListener('click', () => moveSlide(-1));
        document.getElementById('carouselNext')?.addEventListener('click', () => moveSlide(1));
        
        if (dots) {
            dots.querySelectorAll('.dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    const index = parseInt(dot.dataset.index);
                    goToSlide(index);
                });
            });
        }
        
        startAutoPlay();
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
    
    track.style.transform = `translateX(-${index * 100}%)`;
    currentSlide = index;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function startAutoPlay() {
    stopAutoPlay();
    slideInterval = setInterval(() => moveSlide(1), 5000);
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
    
    container.innerHTML = categories.map(cat => `
        <div class="category-item" onclick="filterByCategory('${cat.slug}')">
            ${cat.image_url ? `<img src="${cat.image_url}" alt="${cat.name}" onerror="this.src='${PLACEHOLDER_SMALL}'" />` : `<i class="fas ${cat.icon || 'fa-tag'}"></i>`}
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
    console.log('📋 البيانات المعروضة:', JSON.stringify(footerItems, null, 2));
    
    if (!footerItems || footerItems.length === 0) {
        container.innerHTML = `
            <div class="footer-column">
                <h4>📋 عن المتجر</h4>
                <p style="color:var(--gray);font-size:13px;">${storeSettings.storeInfo?.description || 'متجر متخصص في تصميم وبيع الدروع الفاخرة'}</p>
            </div>
        `;
        return;
    }
    
    const itemsPerColumn = Math.ceil(footerItems.length / 4);
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
// ===== بيانات احتياطية =====
// ============================================
function getFallbackProducts() {
    return [
        {
            id: 1,
            name: 'درع الفارس الذهبي',
            description: 'درع فاخر مطعم بالذهب عيار 24',
            price: 299,
            category: 'كلاسيكي',
            image_url: PLACEHOLDER_IMAGE,
            stock: 10,
            currency: 'SAR'
        },
        {
            id: 2,
            name: 'درع التنين الأسود',
            description: 'درع مستوحى من أساطير التنين',
            price: 399,
            category: 'خيالي',
            image_url: PLACEHOLDER_IMAGE,
            stock: 5,
            currency: 'SAR'
        },
        {
            id: 3,
            name: 'درع الصليبيين',
            description: 'تصميم كلاسيكي من العصور الوسطى',
            price: 249,
            category: 'كلاسيكي',
            image_url: PLACEHOLDER_IMAGE,
            stock: 8,
            currency: 'SAR'
        },
        {
            id: 4,
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
// ===== جلب المنتجات من Supabase =====
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
            products = data;
            console.log('✅ تم تحميل', products.length, 'منتج من Supabase');
        } else {
            console.log('⚠️ لا توجد منتجات في Supabase، استخدام البيانات الاحتياطية');
            products = getFallbackProducts();
        }
        
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

// ============================================
// ===== عرض المنتجات مع الصور المتعددة والعنوان الترويجي =====
// ============================================
function renderProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
        console.error('❌ productsGrid غير موجود');
        return;
    }
    
    if (!productsToShow || productsToShow.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--gray);">
                <i class="fas fa-box-open" style="font-size:48px;display:block;margin-bottom:20px;"></i>
                <h3>لا توجد منتجات</h3>
                <p>سيتم إضافة منتجات قريباً</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => {
        const productCurrency = product.currency || 'SAR';
        const priceDisplay = displayPrice(product.price, productCurrency);
        const oldPriceDisplay = product.old_price ? displayPrice(product.old_price, productCurrency) : '';
        
        // معالجة الصور المتعددة
        let imagesHtml = '';
        let hasMultipleImages = false;
        let productImages = [];
        
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            productImages = product.images;
            hasMultipleImages = productImages.length > 1;
        } else if (product.image_url) {
            productImages = [product.image_url];
        } else {
            productImages = [PLACEHOLDER_IMAGE];
        }
        
        // بناء معرض الصور
        if (hasMultipleImages) {
            imagesHtml = `
                <div class="product-image-gallery" data-product-id="${product.id}">
                    <div class="gallery-track" id="gallery-${product.id}">
                        ${productImages.map(img => `
                            <div class="gallery-slide">
                                <img src="${img}" alt="${product.name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" />
                            </div>
                        `).join('')}
                    </div>
                    <button class="gallery-btn prev" onclick="event.stopPropagation(); moveGallery('${product.id}', -1)">‹</button>
                    <button class="gallery-btn next" onclick="event.stopPropagation(); moveGallery('${product.id}', 1)">›</button>
                    <div class="gallery-dots">
                        ${productImages.map((_, i) => `
                            <span class="dot ${i === 0 ? 'active' : ''}" onclick="event.stopPropagation(); goToGallerySlide('${product.id}', ${i})"></span>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            imagesHtml = `
                <div class="product-image-gallery" data-product-id="${product.id}">
                    <div class="gallery-track">
                        <div class="gallery-slide">
                            <img src="${productImages[0]}" alt="${product.name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" />
                        </div>
                    </div>
                </div>
            `;
        }
        
        // معالجة العنوان الترويجي
        let promoBadge = '';
        if (product.promo_text) {
            promoBadge = `<span class="product-promo-badge">${product.promo_text}</span>`;
        } else if (product.stock < 5 && product.stock > 0) {
            promoBadge = `<span class="product-promo-badge limited">🔥 محدود</span>`;
        } else if (product.isCustom) {
            promoBadge = `<span class="product-promo-badge custom">🎨 مخصص</span>`;
        }
        
        return `
        <div class="product-card" onclick="openProductModal('${product.id}')">
            <div class="product-image-wrapper">
                ${imagesHtml}
                ${promoBadge}
                ${product.stock === 0 ? '<span class="product-badge sale">نفذ</span>' : ''}
                <div class="product-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); addToCartFromCard('${product.id}')">
                        <i class="fas fa-cart-plus"></i> أضف
                    </button>
                    <button class="action-btn quick-view" onclick="event.stopPropagation(); openProductModal('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn customize-btn" onclick="event.stopPropagation(); openDesignStudio('${product.image_url || PLACEHOLDER_IMAGE}', '${product.name}', '${product.id}')">
                        <i class="fas fa-paint-brush"></i> تخصيص
                    </button>
                </div>
            </div>
            <div class="product-info">
                ${product.category ? `<span class="product-category">${product.category}</span>` : ''}
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-price-row">
                    <span class="product-price">${priceDisplay}</span>
                    ${oldPriceDisplay ? `<span class="product-old-price">${oldPriceDisplay}</span>` : ''}
                </div>
                <div class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.stock > 0 ? `📦 متوفر (${product.stock})` : '❌ غير متوفر'}
                </div>
                <button class="customize-btn-bottom" onclick="event.stopPropagation(); openDesignStudio('${product.image_url || PLACEHOLDER_IMAGE}', '${product.name}', '${product.id}')">
                    <i class="fas fa-paint-brush"></i> 🎨 تخصيص وتصميم الدرع
                </button>
                <button class="checkout-btn-bottom" onclick="event.stopPropagation(); redirectToCheckout('${product.id}')">
                    <i class="fas fa-credit-card"></i> 💳 إتمام الطلب مباشرة
                </button>
            </div>
        </div>
    `}).join('');
    
    // تهيئة معارض الصور
    setTimeout(() => initGalleries(), 100);
    
    console.log('✅ تم عرض', productsToShow.length, 'منتج');
}

// ============================================
// ===== دوال معرض الصور المتعددة =====
// ============================================
function initGalleries() {
    document.querySelectorAll('.product-image-gallery').forEach(gallery => {
        const productId = gallery.dataset.productId;
        const track = gallery.querySelector('.gallery-track');
        if (!track) return;
        
        // إضافة مستمع لسحب الصور باللمس
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

// دالة للتنقل بين صور المنتج
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
    track.style.transform = `translateX(-${index * slideWidth}px)`;
    
    // تحديث النقاط
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    if (!galleryStates[productId]) {
        galleryStates[productId] = { currentIndex: 0 };
    }
    galleryStates[productId].currentIndex = index;
}

// ============================================
// ===== دالة التوجيه المباشر لصفحة الدفع =====
// ============================================
function redirectToCheckout(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showToast('⚠️ المنتج غير موجود', 'error');
        return;
    }
    
    if (product.stock <= 0) {
        showToast('❌ هذا المنتج نفذ من المخزون', 'error');
        return;
    }
    
    // إضافة المنتج للسلة
    const existing = cart.find(item => item.id === product.id && !item.isCustom);
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
    
    // الانتقال مباشرة لصفحة الدفع
    openCheckoutPage();
}
window.redirectToCheckout = redirectToCheckout;

// ============================================
// ===== دالة الإضافة من بطاقة المنتج =====
// ============================================
function addToCartFromCard(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        addToCart(product);
    }
}
window.addToCartFromCard = addToCartFromCard;

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

// ============================================
// ===== جلب الحقول المخصصة للمنتج من Supabase =====
// ============================================
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

// ============================================
// ===== عرض الحقول المخصصة في نافذة المنتج =====
// ============================================
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

// ============================================
// ===== جمع بيانات الحقول المخصصة =====
// ============================================
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
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('❌ Product not found:', productId);
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
                    <button onclick="changeQuantity(-1)" style="width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,215,0,0.2);background:transparent;color:var(--white);font-size:20px;cursor:pointer;">-</button>
                    <span class="quantity-number" id="modalQuantity" style="font-size:20px;font-weight:700;min-width:30px;text-align:center;">1</span>
                    <button onclick="changeQuantity(1)" style="width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,215,0,0.2);background:transparent;color:var(--white);font-size:20px;cursor:pointer;">+</button>
                </div>
                <button class="btn-primary" onclick="addFromModal('${product.id}')" style="width:100%;justify-content:center;display:flex;align-items:center;gap:10px;padding:14px 32px;background:linear-gradient(135deg,var(--gold),var(--gold-light));color:var(--dark);border:none;border-radius:50px;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.3s ease;">
                    <i class="fas fa-cart-plus"></i> أضف للسلة
                </button>
                <button class="btn-primary" onclick="openDesignStudio('${product.image_url || PLACEHOLDER_IMAGE}', '${product.name}', '${product.id}')" 
                        style="width:100%;justify-content:center;margin-top:8px;background:linear-gradient(135deg, #8B5CF6, #6D28D9);color:white;border:none;border-radius:50px;padding:14px 32px;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-paint-brush"></i> 🎨 تخصيص وتصميم الدرع
                </button>
                <button class="btn-primary" onclick="redirectToCheckout('${product.id}')" 
                        style="width:100%;justify-content:center;margin-top:8px;background:linear-gradient(135deg, #10b981, #059669);color:white;border:none;border-radius:50px;padding:14px 32px;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;gap:10px;">
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
// ===== تحديث دالة الإضافة من النافذة =====
// ============================================
function addFromModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
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
        
        console.log('📝 Adding product with custom fields:', productWithCustom.customFields);
        
        addToCart(productWithCustom);
        closeModal();
        
    } catch (error) {
        showToast(error.message, 'warning');
    }
}
window.addFromModal = addFromModal;

// ============================================
// ===== تحديث دالة الإضافة للسلة =====
// ============================================
function addToCart(product) {
    if (product.stock <= 0) {
        showToast('❌ هذا المنتج نفذ من المخزون', 'error');
        return;
    }
    
    const productWithFields = {
        ...product,
        customFields: product.customFields || []
    };
    
    if (productWithFields.customFields && productWithFields.customFields.length > 0) {
        const requiredMissing = productWithFields.customFields.filter(f => f.is_required && !f.value);
        if (requiredMissing.length > 0) {
            showToast(`⚠️ الرجاء إكمال جميع الحقول المطلوبة`, 'warning');
            return;
        }
    }
    
    const existing = cart.find(item => item.id === productWithFields.id && !item.isCustom);
    
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
    
    localStorage.setItem('tithkari_cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`✅ تم إضافة "${productWithFields.name}"`, 'success');
}
window.addToCart = addToCart;

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
                 onerror="this.src='${PLACEHOLDER_SMALL}'" />
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${priceDisplay}</div>
                <div class="cart-item-quantity">الكمية: ${item.quantity}</div>
                ${item.isCustom ? '<span style="color:#8B5CF6;font-size:11px;">🎨 مخصص</span>' : ''}
                ${customFieldsSummary}
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
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
// ===== تهيئة التطبيق =====
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 جاري تهيئة المتجر...');
    
    await loadStoreSettings();
    loadCartFromStorage();
    await loadSettings();
    await renderMenus();
    await loadCategories();
    loadProducts();
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
    
    // ===== أحداث DOM =====
    const cartToggle = document.getElementById('cartToggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCart);
    }
    
    const closeCart = document.getElementById('closeCart');
    if (closeCart) {
        closeCart.addEventListener('click', toggleCart);
    }
    
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', toggleCart);
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
    
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
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