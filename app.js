// ============================================
// استيراد Supabase ونظام المفاتيح
// ============================================
import { createClient } from '@supabase/supabase-js';
import KEYS from './keys.example.js';

// ============================================
// إعدادات Supabase
// ============================================
const supabaseUrl = KEYS.supabaseUrl;
const supabaseAnonKey = KEYS.supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase initialized');

// ============================================
// الصور الافتراضية
// ============================================
function getPlaceholderSVG(text = '🛡️', width = 300, height = 300) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%231a1a2e'/%3E%3Ctext x='${width/2}' y='${height/2 + 8}' text-anchor='middle' font-size='${Math.min(width, height) * 0.4}'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
}

const PLACEHOLDER_IMAGE = getPlaceholderSVG('🛡️', 300, 300);
const PLACEHOLDER_SMALL = getPlaceholderSVG('🛡️', 60, 60);

// ============================================
// العملات
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
let currentCurrency = 'SAR';
let categories = [];
let footerItems = [];
let storeSettings = {
    storeInfo: { name: 'Tithkari', description: '', currency: 'SAR' },
    branding: { primary_color: '#FFD700', bg_color: '#0F0F1A', text_color: '#FFFFFF' },
    display: { default_view: 'grid', show_categories: true }
};

// ============================================
// ===== دوال العملات =====
// ============================================
function displayPrice(price, fromCurrency = 'SAR') {
    const currency = CURRENCIES[currentCurrency] || CURRENCIES.SAR;
    return `${price.toFixed(2)} ${currency.symbol}`;
}

function changeCurrency(currencyCode) {
    if (CURRENCIES[currencyCode]) {
        currentCurrency = currencyCode;
        localStorage.setItem('tithkari_currency', currencyCode);
        renderProducts(products);
        showToast(`✅ تم تغيير العملة`, 'success');
    }
}
window.changeCurrency = changeCurrency;

// ============================================
// ===== تحميل المنتجات من Supabase =====
// ============================================
async function loadProducts() {
    try {
        console.log('📦 جاري تحميل المنتجات...');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ خطأ:', error.message);
            products = getFallbackProducts();
        } else if (data && data.length > 0) {
            products = data.map(p => ({
                ...p,
                id: p.id || 'product_' + Date.now()
            }));
            console.log('✅ تم تحميل', products.length, 'منتج من Supabase');
        } else {
            products = getFallbackProducts();
            console.log('⚠️ استخدام البيانات الاحتياطية');
        }
        
        renderProducts(products);
        updateProductCount();
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        products = getFallbackProducts();
        renderProducts(products);
        updateProductCount();
    }
}
window.loadProducts = loadProducts;

// ============================================
// ===== البيانات الاحتياطية =====
// ============================================
function getFallbackProducts() {
    return [
        { id: 'fallback_1', name: 'درع الفارس الذهبي', description: 'درع فاخر مطعم بالذهب', price: 299, category: 'كلاسيكي', image_url: PLACEHOLDER_IMAGE, stock: 10, currency: 'SAR' },
        { id: 'fallback_2', name: 'درع التنين الأسود', description: 'درع مستوحى من الأساطير', price: 399, category: 'خيالي', image_url: PLACEHOLDER_IMAGE, stock: 5, currency: 'SAR' },
        { id: 'fallback_3', name: 'درع الصليبيين', description: 'تصميم كلاسيكي من العصور الوسطى', price: 249, category: 'كلاسيكي', image_url: PLACEHOLDER_IMAGE, stock: 8, currency: 'SAR' },
        { id: 'fallback_4', name: 'درع النسر الذهبي', description: 'درع يحمل رمز النسر الملكي', price: 349, category: 'ملوكي', image_url: PLACEHOLDER_IMAGE, stock: 6, currency: 'SAR' }
    ];
}

// ============================================
// ===== عرض المنتجات =====
// ============================================
function renderProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
        console.error('❌ productsGrid غير موجود');
        // محاولة إنشائه
        const section = document.querySelector('.products-section .container');
        if (section) {
            const newGrid = document.createElement('div');
            newGrid.id = 'productsGrid';
            newGrid.className = 'products-grid grid-view';
            section.appendChild(newGrid);
            setTimeout(() => renderProducts(productsToShow), 100);
        }
        return;
    }
    
    if (!productsToShow || productsToShow.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--gray);"><i class="fas fa-box-open" style="font-size:48px;display:block;margin-bottom:20px;"></i><h3>لا توجد منتجات</h3></div>`;
        return;
    }
    
    grid.innerHTML = productsToShow.map((product) => {
        const productId = product.id || 'product_' + Date.now();
        const priceDisplay = displayPrice(product.price || 0, product.currency || 'SAR');
        const productImage = product.image_url || product.image || PLACEHOLDER_IMAGE;
        const productName = product.name || 'منتج';
        const productDescription = product.description || '';
        const productCategory = product.category || '';
        const productStock = product.stock !== undefined ? product.stock : 99;
        
        return `
        <div class="product-card" data-product-id="${productId}">
            <div class="product-image-wrapper">
                <div class="product-image-gallery">
                    <div class="gallery-track">
                        <div class="gallery-slide">
                            <img src="${productImage}" alt="${productName}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" />
                        </div>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="action-btn" onclick="window.addToCartFromCard('${productId}')" aria-label="أضف للسلة">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                    <button class="action-btn quick-view" onclick="window.openProductModal('${productId}')" aria-label="عرض سريع">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn customize-btn" onclick="window.openDesignStudio('${productImage}', '${productName}', '${productId}')" aria-label="تخصيص">
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
                </div>
                <div class="product-stock ${productStock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${productStock > 0 ? `📦 متوفر (${productStock})` : '❌ غير متوفر'}
                </div>
                
                <button class="add-to-cart-btn" onclick="window.addToCartFromCard('${productId}')">
                    <i class="fas fa-cart-plus"></i> أضف للسلة
                </button>
                
                <button class="checkout-btn-bottom" onclick="window.redirectToCheckout('${productId}')">
                    <i class="fas fa-credit-card"></i> 💳 إتمام الطلب مباشرة
                </button>
                
                <button class="customize-btn-bottom" onclick="window.openDesignStudio('${productImage}', '${productName}', '${productId}')">
                    <i class="fas fa-paint-brush"></i> 🎨 تخصيص وتصميم الدرع
                </button>
            </div>
        </div>
    `}).join('');
    
    console.log('✅ تم عرض', productsToShow.length, 'منتج');
}
window.renderProducts = renderProducts;

// ============================================
// ===== البحث عن المنتج =====
// ============================================
function findProductById(productId) {
    if (!productId) return null;
    return products.find(p => p && (p.id === productId || p._id === productId)) || null;
}

// ============================================
// ===== دالة الإضافة من البطاقة =====
// ============================================
function addToCartFromCard(productId) {
    console.log('🛒 إضافة من البطاقة:', productId);
    const product = findProductById(productId);
    if (!product) {
        showToast('⚠️ المنتج غير موجود', 'error');
        return;
    }
    addToCart(product);
}
window.addToCartFromCard = addToCartFromCard;

// ============================================
// ===== دالة الإضافة للسلة =====
// ============================================
function addToCart(product) {
    if (!product) {
        showToast('❌ المنتج غير موجود', 'error');
        return;
    }
    
    const productId = product.id || 'temp_' + Date.now();
    const existing = cart.find(item => item && item.id === productId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ 
            ...product, 
            id: productId,
            quantity: 1,
            customFields: product.customFields || []
        });
    }
    
    localStorage.setItem('tithkari_cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`✅ تم إضافة "${product.name}"`, 'success');
}
window.addToCart = addToCart;

// ============================================
// ===== دالة الإضافة من المودال =====
// ============================================
function addFromModal(productId) {
    const product = findProductById(productId);
    if (!product) {
        showToast('❌ المنتج غير موجود', 'error');
        return;
    }
    addToCart(product);
    closeModal();
}
window.addFromModal = addFromModal;

// ============================================
// ===== دالة التوجيه للدفع =====
// ============================================
function redirectToCheckout(productId) {
    console.log('💳 التوجيه للدفع:', productId);
    const product = findProductById(productId);
    if (!product) {
        showToast('⚠️ المنتج غير موجود', 'error');
        return;
    }
    
    const existing = cart.find(item => item && item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1, customFields: [] });
    }
    
    localStorage.setItem('tithkari_cart', JSON.stringify(cart));
    updateCartUI();
    openCheckoutPage();
}
window.redirectToCheckout = redirectToCheckout;

// ============================================
// ===== فتح المصمم =====
// ============================================
function openDesignStudio(productImage, productName, productId) {
    console.log('🎨 فتح المصمم:', productId);
    localStorage.setItem('tithkari_design_data', JSON.stringify({
        productImage: productImage || PLACEHOLDER_IMAGE,
        productName: productName || 'درع مخصص',
        productId: productId || null,
        timestamp: Date.now()
    }));
    window.location.href = 'design-studio.html?productId=' + (productId || '');
}
window.openDesignStudio = openDesignStudio;

// ============================================
// ===== فتح نافذة المنتج =====
// ============================================
function openProductModal(productId) {
    console.log('🔍 فتح نافذة المنتج:', productId);
    const product = findProductById(productId);
    if (!product) {
        showToast('⚠️ المنتج غير موجود', 'error');
        return;
    }
    
    const modal = document.getElementById('productModal');
    const body = document.getElementById('modalBody');
    const priceDisplay = displayPrice(product.price || 0, product.currency || 'SAR');
    
    body.innerHTML = `
        <div class="modal-product">
            <div class="modal-image">
                <img src="${product.image_url || PLACEHOLDER_IMAGE}" alt="${product.name}" onerror="this.src='${PLACEHOLDER_IMAGE}'" />
            </div>
            <div class="modal-info">
                <h2>${product.name}</h2>
                ${product.category ? `<span class="modal-category">${product.category}</span>` : ''}
                <div class="modal-price">${priceDisplay}</div>
                <p class="modal-description">${product.description || 'لا يوجد وصف'}</p>
                <div class="modal-meta">
                    <div class="meta-item"><span>📦 المخزون</span><span>${product.stock > 0 ? product.stock + ' قطعة' : 'نفذ'}</span></div>
                </div>
                
                <button class="btn-primary" onclick="window.addFromModal('${product.id}')">
                    <i class="fas fa-cart-plus"></i> أضف للسلة
                </button>
                <button class="btn-primary" onclick="window.openDesignStudio('${product.image_url || PLACEHOLDER_IMAGE}', '${product.name}', '${product.id}')" style="background:linear-gradient(135deg,#8B5CF6,#6D28D9);">
                    <i class="fas fa-paint-brush"></i> 🎨 تخصيص الدرع
                </button>
                <button class="btn-primary" onclick="window.redirectToCheckout('${product.id}')" style="background:linear-gradient(135deg,#10b981,#059669);">
                    <i class="fas fa-credit-card"></i> 💳 إتمام الطلب
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openProductModal = openProductModal;

// ============================================
// ===== إدارة السلة =====
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
        const priceDisplay = displayPrice(item.price * item.quantity, item.currency || 'SAR');
        return `
        <div class="cart-item">
            <img src="${item.image_url || PLACEHOLDER_SMALL}" alt="${item.name}" onerror="this.src='${PLACEHOLDER_SMALL}'" />
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${priceDisplay}</div>
                <div class="cart-item-quantity">الكمية: ${item.quantity}</div>
            </div>
            <button class="cart-item-remove" onclick="window.removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `}).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalEl) totalEl.textContent = displayPrice(total);
    localStorage.setItem('tithkari_cart', JSON.stringify(cart));
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
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
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل السلة:', error);
    }
}

function toggleCart() {
    document.getElementById('cartSidebar')?.classList.toggle('open');
    document.getElementById('cartOverlay')?.classList.toggle('active');
}
window.toggleCart = toggleCart;

function openCheckoutPage() {
    if (cart.length === 0) {
        showToast('⚠️ السلة فارغة!', 'warning');
        return;
    }
    localStorage.setItem('tithkari_checkout_cart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}
window.openCheckoutPage = openCheckoutPage;

function handleCheckout() {
    if (cart.length === 0) {
        showToast('⚠️ السلة فارغة!', 'warning');
        return;
    }
    openCheckoutPage();
}
window.handleCheckout = handleCheckout;

// ============================================
// ===== الإغلاق =====
// ============================================
function closeModal() {
    document.getElementById('productModal')?.classList.remove('active');
    document.body.style.overflow = 'auto';
}
window.closeModal = closeModal;

// ============================================
// ===== الإشعارات =====
// ============================================
function showToast(message, type = 'info') {
    let toast = document.getElementById('toastContainer');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastContainer';
        toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;max-width:350px;width:100%;direction:rtl;';
        document.body.appendChild(toast);
    }
    const colors = { success: '#4CAF50', error: '#f44336', warning: '#FF9800', info: '#2196F3' };
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toastEl = document.createElement('div');
    toastEl.style.cssText = `background:#1A1A2E;color:#fff;padding:12px 16px;border-radius:12px;border-right:4px solid ${colors[type] || '#2196F3'};box-shadow:0 8px 32px rgba(0,0,0,0.4);font-size:14px;animation:slideInRight 0.3s ease;display:flex;align-items:center;gap:10px;font-family:Cairo,sans-serif;`;
    toastEl.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    toast.appendChild(toastEl);
    setTimeout(() => {
        toastEl.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => { toastEl.remove(); if (toast.children.length === 0) toast.remove(); }, 300);
    }, 3500);
}
window.showToast = showToast;

// ============================================
// ===== تحديث عدد المنتجات =====
// ============================================
function updateProductCount() {
    const grid = document.getElementById('productsGrid');
    const count = grid?.querySelectorAll('.product-card').length || 0;
    const el = document.getElementById('productCount');
    if (el) el.textContent = `${count} منتج`;
}

// ============================================
// ===== تحميل التصنيفات =====
// ============================================
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        if (error) throw error;
        categories = data || [];
        renderCategories();
        renderCategoryFilter();
    } catch (error) {
        console.error('❌ خطأ في تحميل التصنيفات:', error);
        categories = [
            { id: '1', name: 'كلاسيكي', slug: 'classic', icon: 'fa-helmet-safety' },
            { id: '2', name: 'خيالي', slug: 'fantasy', icon: 'fa-dragon' },
            { id: '3', name: 'ملوكي', slug: 'royal', icon: 'fa-crown' }
        ];
        renderCategories();
        renderCategoryFilter();
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    container.innerHTML = categories.map(cat => `
        <div class="category-item" onclick="window.filterByCategory('${cat.slug}')">
            <i class="fas ${cat.icon || 'fa-tag'}"></i>
            <span>${cat.name}</span>
        </div>
    `).join('');
}

function renderCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;
    filter.innerHTML = '<option value="">📂 جميع التصنيفات</option>';
    categories.forEach(cat => {
        filter.innerHTML += `<option value="${cat.slug}">${cat.icon || '📁'} ${cat.name}</option>`;
    });
}

function filterByCategory(slug) {
    const filter = document.getElementById('categoryFilter');
    if (filter) filter.value = slug;
    window.searchProducts();
}
window.filterByCategory = filterByCategory;

// ============================================
// ===== البحث =====
// ============================================
function searchProducts() {
    const query = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    let filtered = products;
    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)));
    }
    if (category) {
        filtered = filtered.filter(p => p.category === category || p.category_slug === category);
    }
    renderProducts(filtered);
    updateProductCount();
}
window.searchProducts = searchProducts;

// ============================================
// ===== تحميل التذييل =====
// ============================================
async function loadFooterItems() {
    try {
        const { data, error } = await supabase
            .from('footer_items')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        if (error) throw error;
        footerItems = data || [];
        renderFooter();
    } catch (error) {
        console.error('❌ خطأ في تحميل التذييل:', error);
        footerItems = [
            { id: '1', label: 'من نحن', icon: 'fa-info-circle', content: 'متجر متخصص في تصميم الدروع', type: 'text' },
            { id: '2', label: 'اتصل بنا', icon: 'fa-envelope', content: 'info@tithkari.com', type: 'contact' }
        ];
        renderFooter();
    }
}

function renderFooter() {
    const container = document.getElementById('footerColumns');
    if (!container) return;
    container.innerHTML = `
        <div class="footer-column">
            ${footerItems.map(item => `
                <div class="footer-item">
                    <i class="fas ${item.icon || 'fa-circle'}"></i>
                    <div class="item-content">
                        <strong>${item.label}</strong>
                        <span>${item.content || ''}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// ===== تحميل إعدادات المتجر =====
// ============================================
async function loadStoreSettings() {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*');
        if (error) throw error;
        data.forEach(item => {
            if (item.key === 'storeInfo' || item.key === 'branding' || item.key === 'display') {
                storeSettings[item.key] = item.value;
            }
        });
        applyStoreSettings();
    } catch (error) {
        console.error('❌ خطأ في تحميل الإعدادات:', error);
    }
}

function applyStoreSettings() {
    const branding = storeSettings.branding || {};
    if (branding.primary_color) {
        document.documentElement.style.setProperty('--gold', branding.primary_color);
    }
    if (branding.bg_color) {
        document.body.style.backgroundColor = branding.bg_color;
    }
    if (storeSettings.storeInfo?.name) {
        document.title = `🛡️ ${storeSettings.storeInfo.name}`;
        const logoText = document.querySelector('.logo .logo-text');
        if (logoText) logoText.textContent = storeSettings.storeInfo.name;
    }
}

// ============================================
// ===== تهيئة التطبيق =====
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 جاري تهيئة المتجر...');
    
    await loadStoreSettings();
    loadCartFromStorage();
    await loadCategories();
    await loadProducts();
    await loadFooterItems();
    
    // أزرار السلة
    document.getElementById('cartToggle')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', toggleCart);
    document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
    
    // المودال
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('productModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    
    // البحث
    document.getElementById('searchInput')?.addEventListener('input', function() {
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(searchProducts, 300);
    });
    document.getElementById('categoryFilter')?.addEventListener('change', searchProducts);
    
    // العملة
    const selector = document.getElementById('currencySelector');
    if (selector) {
        selector.value = currentCurrency;
        selector.addEventListener('change', function() {
            changeCurrency(this.value);
        });
    }
    
    console.log('✅ تم تهيئة المتجر بنجاح');
    console.log('📦 عدد المنتجات:', products.length);
});

console.log('✅ app.js loaded successfully');