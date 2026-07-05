// ============================================
// استيراد الإعدادات من الملف المركزي
// ============================================
import { CONFIG } from '../config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================
// تهيئة Supabase
// ============================================
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

console.log('✅ Supabase initialized');

// ============================================
// التحقق من تسجيل الدخول
// ============================================
const session = localStorage.getItem('session');
if (!session) {
    window.location.href = '../login.html';
}

try {
    const parsed = JSON.parse(session);
    if (!parsed.access_token) {
        window.location.href = '../login.html';
    }
} catch (e) {
    window.location.href = '../login.html';
}

// ============================================
// تسجيل الخروج
// ============================================
window.logout = function() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('user');
        localStorage.removeItem('session');
        window.location.href = '../login.html';
    }
};

// ============================================
// التبويبات - حل بسيط ومباشر
// ============================================
const tabs = ['dashboard', 'products', 'orders', 'add-product', 'custom-fields', 'analytics', 'banners', 'menus', 'customers', 'settings', 'design-templates', 'code-editor', 'store-settings', 'advanced-settings', 'footer', 'categories', 'coupons', 'reviews', 'payment-settings', 'email-settings', 'payment-shipping', 'tools'];
const titles = {
    'dashboard': '📊 لوحة المعلومات',
    'products': '📦 المنتجات',
    'orders': '🚚 الطلبات',
    'add-product': '➕ إضافة منتج',
    'custom-fields': '📋 الحقول المخصصة',
    'analytics': '📈 التحليلات',
    'banners': '📢 البنرات',
    'menus': '📋 القوائم',
    'customers': '👥 العملاء',
    'settings': '⚙️ الإعدادات',
    'design-templates': '🎨 قوالب التصميم',
    'code-editor': '💻 محرر الأكواد',
    'store-settings': '🏪 إعدادات المتجر',
    'advanced-settings': '🎨 إعدادات متقدمة',
    'footer': '🦶 التذييل',
    'categories': '🏷️ التصنيفات',
    'coupons': '🎫 الكوبونات',
    'reviews': '⭐ التقييمات',
    'payment-settings': '💳 إعدادات الدفع',
    'email-settings': '📧 إعدادات البريد',
    'payment-shipping': '💳 إدارة الدفع والشحن',
    'tools': '🔌 إدارة الأدوات'
};

// دالة التبديل بين التبويبات - معرفة عالمياً
window.switchTab = function(tabName) {
    console.log('🔄 Switching to:', tabName);
    
    document.querySelectorAll('.admin-tab').forEach(el => {
        el.classList.remove('active');
    });
    
    const target = document.getElementById(tabName + '-tab');
    if (target) {
        target.classList.add('active');
        console.log('✅ Tab shown:', tabName);
    } else {
        console.error('❌ Tab not found:', tabName);
    }
    
    document.querySelectorAll('.admin-nav a').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav a[data-tab="' + tabName + '"]').forEach(el => {
        el.classList.add('active');
    });
    
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
        titleEl.textContent = titles[tabName] || 'لوحة التحكم';
    }
    
    // تحميل البيانات حسب التبويب
    const loaders = {
        'analytics': loadAnalytics,
        'banners': loadBanners,
        'menus': loadMenus,
        'settings': loadSettings,
        'design-templates': loadDesignTemplates,
        'code-editor': initCodeEditor,
        'store-settings': initStoreSettings,
        'advanced-settings': initAdvancedSettings,
        'customers': loadCustomers,
        'products': loadProducts,
        'dashboard': loadDashboard,
        'orders': loadOrders,
        'custom-fields': () => setTimeout(loadProductsForFieldSelector, 300),
        'footer': loadFooterItems,
        'categories': loadCategoriesForAdmin,
        'coupons': loadCoupons,
        'reviews': loadReviews,
        'payment-settings': loadPaymentSettings,
        'email-settings': loadEmailSettings,
        'payment-shipping': () => console.log('📌 Payment Shipping tab opened'),
        'tools': () => console.log('📌 Tools tab opened')
    };
    
    if (loaders[tabName]) {
        loaders[tabName]();
    }
};

// ============================================
// 🛠️ دالة مساعدة للحصول على صورة افتراضية (SVG)
// ============================================
function getPlaceholderSVG(text = '🛡️', width = 50, height = 50) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%231a1a2e'/%3E%3Ctext x='${width/2}' y='${height/2 + 8}' text-anchor='middle' font-size='${Math.min(width, height) * 0.5}'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
}

// ============================================
// تحميل الإحصائيات
// ============================================
async function loadStats() {
    try {
        const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
        
        const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });
        
        const { count: pendingCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        const { count: completedCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'delivered');
        
        document.getElementById('totalProducts').textContent = productsCount || 0;
        document.getElementById('totalOrders').textContent = ordersCount || 0;
        document.getElementById('pendingOrders').textContent = pendingCount || 0;
        document.getElementById('completedOrders').textContent = completedCount || 0;
        
        console.log('✅ Stats loaded');
    } catch (error) {
        console.error('❌ Stats error:', error);
    }
}

// ============================================
// 🛠️ [مُصلح] رفع الصور - يدعم الملفات والروابط
// ============================================
async function uploadProductImage(fileOrUrl) {
    try {
        if (typeof fileOrUrl === 'string' && fileOrUrl.startsWith('http')) {
            console.log('✅ استخدام رابط الصورة مباشرة:', fileOrUrl);
            return fileOrUrl;
        }
        
        if (typeof fileOrUrl === 'string' && fileOrUrl.startsWith('data:image')) {
            console.log('⚠️ Base64 image detected - uploading to storage...');
            const blob = dataURLToBlob(fileOrUrl);
            const fileName = 'product-' + Date.now() + '.png';
            
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
            const fileName = 'product-' + Date.now() + '.' + ext;
            
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
// تحميل المنتجات (مع حالة المنتج)
// ============================================
async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) {
            console.error('❌ productsTableBody not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#8A8A9B;">📭 لا توجد منتجات</td></tr>';
            return;
        }
        
        const placeholder = getPlaceholderSVG('🛡️', 50, 50);
        
        tbody.innerHTML = data.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>
                    <img src="${p.image_url || placeholder}" 
                         class="product-thumb" 
                         onerror="this.src='${placeholder}'" />
                </td>
                <td>${p.name}</td>
                <td>${p.category || '-'}</td>
                <td>${Number(p.price).toFixed(2)} د.ل</td>
                <td>${p.stock || 0}</td>
                <td>
                    <span class="status-badge status-${p.status || 'active'}">
                        ${p.status === 'active' ? '✅ نشط' : '❌ غير نشط'}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="openEditProductForm('${p.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct('${p.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Products loaded:', data.length);
    } catch (error) {
        console.error('❌ Products error:', error);
        showToast('خطأ في تحميل المنتجات', 'error');
    }
}

// ============================================
// تحميل الطلبات
// ============================================
async function loadOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#8A8A9B;">📭 لا توجد طلبات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(order => `
            <tr>
                <td><strong>${order.order_number}</strong></td>
                <td>${order.customer_name}</td>
                <td>${Number(order.total_amount).toFixed(2)} د.ل</td>
                <td>${order.discount_applied ? Number(order.discount_applied).toFixed(2) + ' د.ل' : '-'}</td>
                <td>
                    <span class="status-badge status-${order.status || 'pending'}">
                        ${getStatusText(order.status)}
                    </span>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    <button class="btn-view" onclick="viewOrder('${order.order_number}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <select onchange="updateOrderStatus('${order.order_number}', this.value)" 
                            style="padding:5px;border-radius:5px;background:#0F0F1A;color:#F5F0EB;border:1px solid rgba(255,215,0,0.2);font-family:'Cairo',sans-serif;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>قيد المعالجة</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                    </select>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Orders loaded:', data.length);
    } catch (error) {
        console.error('❌ Orders error:', error);
    }
}

function getStatusText(status) {
    const map = {
        'pending': 'قيد الانتظار',
        'processing': 'قيد المعالجة',
        'shipped': 'تم الشحن',
        'delivered': 'تم التسليم',
        'cancelled': 'ملغي'
    };
    return map[status] || status;
}

// ============================================
// حذف منتج
// ============================================
window.deleteProduct = async function(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف المنتج', 'success');
        loadProducts();
        loadStats();
    } catch (error) {
        console.error('❌ Delete error:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.viewOrder = function(orderNumber) {
    showToast('📦 تفاصيل الطلب: ' + orderNumber + '\nيمكنك عرض التفاصيل من Supabase Dashboard', 'info');
};

window.updateOrderStatus = async function(orderNumber, status) {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('order_number', orderNumber);
        
        if (error) throw error;
        
        loadOrders();
        loadStats();
        showToast('✅ تم تحديث حالة الطلب', 'success');
    } catch (error) {
        console.error('❌ Status update error:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

// ============================================
// التحليلات
// ============================================
let salesChartInstance = null;

async function loadAnalytics() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (!orders || orders.length === 0) {
            document.getElementById('totalSales').textContent = '0 د.ل';
            document.getElementById('avgOrder').textContent = '0 د.ل';
            document.getElementById('topProduct').textContent = '-';
            document.getElementById('totalCustomers').textContent = '0';
            return;
        }
        
        const totalSales = orders.reduce((s, o) => s + o.total_amount, 0);
        document.getElementById('totalSales').textContent = totalSales.toFixed(2) + ' د.ل';
        document.getElementById('avgOrder').textContent = (totalSales / orders.length).toFixed(2) + ' د.ل';
        
        const productCount = {};
        orders.forEach(o => {
            if (o.items && Array.isArray(o.items)) {
                o.items.forEach(item => {
                    productCount[item.name] = (productCount[item.name] || 0) + item.quantity;
                });
            }
        });
        
        const top = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('topProduct').textContent = top ? top[0] + ' (' + top[1] + ' قطعة)' : '-';
        document.getElementById('totalCustomers').textContent = new Set(orders.map(o => o.customer_email)).size;
        
        createSalesChart(orders);
        console.log('✅ Analytics loaded');
    } catch (error) {
        console.error('❌ Analytics error:', error);
    }
}

function createSalesChart(orders) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    const dailySales = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dailySales[d.toLocaleDateString('ar-SA')] = 0;
    }
    
    orders.forEach(o => {
        const key = new Date(o.created_at).toLocaleDateString('ar-SA');
        if (dailySales[key] !== undefined) {
            dailySales[key] += o.total_amount;
        }
    });
    
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }
    
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(dailySales),
            datasets: [{
                label: 'المبيعات (د.ل)',
                data: Object.values(dailySales),
                backgroundColor: 'rgba(255, 215, 0, 0.6)',
                borderColor: '#FFD700',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#8A8A9B',
                        font: { family: 'Cairo' }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#8A8A9B' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    beginAtZero: true
                },
                x: {
                    ticks: { color: '#8A8A9B' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

// ============================================
// ===== إدارة البنرات (Banners) =====
// ============================================

async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const tbody = document.getElementById('bannersTableBody');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8A8A9B;">📢 لا توجد بنرات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map((banner, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${banner.title}</td>
                <td style="font-size:28px;">${banner.icon || '📢'}</td>
                <td>
                    <button class="status-toggle ${banner.is_active ? 'active' : 'inactive'}" 
                            onclick="toggleBannerStatus('${banner.id}', ${!banner.is_active})">
                        ${banner.is_active ? '✅ نشط' : '❌ غير نشط'}
                    </button>
                </td>
                <td>
                    <button onclick="moveBanner('${banner.id}', 'up')" class="btn-edit" style="padding:2px 8px;">↑</button>
                    <button onclick="moveBanner('${banner.id}', 'down')" class="btn-edit" style="padding:2px 8px;">↓</button>
                </td>
                <td>
                    <button class="btn-edit" onclick="editBanner('${banner.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteBanner('${banner.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Banners loaded:', data.length);
    } catch (error) {
        console.error('❌ Banners error:', error);
    }
}

function openBannerForm(bannerData = null) {
    const modal = document.getElementById('bannerModal');
    const title = document.getElementById('bannerFormTitle');
    const form = document.getElementById('bannerForm');
    
    if (bannerData) {
        title.textContent = '✏️ تعديل البنر';
        document.getElementById('bannerId').value = bannerData.id;
        document.getElementById('bannerTitle').value = bannerData.title || '';
        document.getElementById('bannerSubtitle').value = bannerData.subtitle || '';
        document.getElementById('bannerIcon').value = bannerData.icon || '';
        document.getElementById('bannerBgColor').value = bannerData.bg_color || '#1A1A2E';
        document.getElementById('bannerLink').value = bannerData.link_url || '';
        document.getElementById('bannerLinkText').value = bannerData.link_text || '';
        document.getElementById('bannerPosition').value = bannerData.position || 'home';
        document.getElementById('bannerStatus').value = bannerData.is_active ? 'true' : 'false';
    } else {
        title.textContent = '➕ إضافة بنر جديد';
        form.reset();
        document.getElementById('bannerId').value = '';
        document.getElementById('bannerBgColor').value = '#1A1A2E';
        document.getElementById('bannerStatus').value = 'true';
    }
    
    modal.classList.add('active');
}
window.openBannerForm = openBannerForm;

function closeBannerForm() {
    document.getElementById('bannerModal').classList.remove('active');
}
window.closeBannerForm = closeBannerForm;

document.getElementById('bannerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('bannerId').value;
    const data = {
        title: document.getElementById('bannerTitle').value.trim(),
        subtitle: document.getElementById('bannerSubtitle').value.trim(),
        icon: document.getElementById('bannerIcon').value.trim(),
        bg_color: document.getElementById('bannerBgColor').value,
        link_url: document.getElementById('bannerLink').value.trim(),
        link_text: document.getElementById('bannerLinkText').value.trim(),
        position: document.getElementById('bannerPosition').value,
        is_active: document.getElementById('bannerStatus').value === 'true',
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
            data.display_order = 999;
            result = await supabase
                .from('banners')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث البنر' : '✅ تم إضافة البنر', 'success');
        closeBannerForm();
        loadBanners();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
});

window.editBanner = async function(id) {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        openBannerForm(data);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.deleteBanner = async function(id) {
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
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.toggleBannerStatus = async function(id, newStatus) {
    try {
        const { error } = await supabase
            .from('banners')
            .update({ is_active: newStatus })
            .eq('id', id);
        
        if (error) throw error;
        loadBanners();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.moveBanner = async function(id, direction) {
    try {
        const { data: banners } = await supabase
            .from('banners')
            .select('id, display_order')
            .order('display_order', { ascending: true });
        
        const index = banners.findIndex(b => b.id === id);
        if (index === -1) return;
        
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= banners.length) return;
        
        const temp = banners[index].display_order;
        banners[index].display_order = banners[targetIndex].display_order;
        banners[targetIndex].display_order = temp;
        
        for (const b of banners) {
            await supabase
                .from('banners')
                .update({ display_order: b.display_order })
                .eq('id', b.id);
        }
        
        loadBanners();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ في الترتيب', 'error');
    }
};

// ============================================
// ===== [جديد] إدارة البنرات المتطورة =====
// ============================================

function openAdvancedBannerForm(bannerData = null) {
    const modal = document.getElementById('advancedBannerModal');
    const title = document.getElementById('advancedBannerFormTitle');
    
    if (bannerData) {
        title.textContent = '✏️ تعديل البنر المتطور';
        document.getElementById('advBannerId').value = bannerData.id;
        document.getElementById('advBannerTitle').value = bannerData.title || '';
        document.getElementById('advBannerSubtitle').value = bannerData.subtitle || '';
        document.getElementById('advBannerType').value = bannerData.banner_type || 'image';
        document.getElementById('advBannerImage').value = bannerData.image_url || '';
        document.getElementById('advBannerBgColor').value = bannerData.bg_color || '#1A1A2E';
        document.getElementById('advBannerButtonText').value = bannerData.button_text || '';
        document.getElementById('advBannerButtonUrl').value = bannerData.button_url || '';
        document.getElementById('advBannerProductId').value = bannerData.product_id || '';
        document.getElementById('advBannerCategoryId').value = bannerData.category_id || '';
        document.getElementById('advBannerWidth').value = bannerData.width || '100%';
        document.getElementById('advBannerHeight').value = bannerData.height || 'auto';
        document.getElementById('advBannerPosition').value = bannerData.position || 'home';
        document.getElementById('advBannerStatus').value = bannerData.is_active ? 'true' : 'false';
    } else {
        title.textContent = '➕ إضافة بنر متطور';
        document.getElementById('advBannerForm').reset();
        document.getElementById('advBannerId').value = '';
        document.getElementById('advBannerBgColor').value = '#1A1A2E';
        document.getElementById('advBannerType').value = 'image';
        document.getElementById('advBannerWidth').value = '100%';
        document.getElementById('advBannerHeight').value = 'auto';
        document.getElementById('advBannerStatus').value = 'true';
    }
    
    loadProductsForSelect('advBannerProductId');
    loadCategoriesForSelect('advBannerCategoryId');
    
    modal.classList.add('active');
}
window.openAdvancedBannerForm = openAdvancedBannerForm;

function closeAdvancedBannerForm() {
    document.getElementById('advancedBannerModal').classList.remove('active');
}
window.closeAdvancedBannerForm = closeAdvancedBannerForm;

async function loadProductsForSelect(selectId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name')
            .eq('status', 'active')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">-- اختر منتج --</option>';
            data.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
            });
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
    }
}

async function loadCategoriesForSelect(selectId) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id, name')
            .eq('is_active', true)
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">-- اختر تصنيف --</option>';
            data.forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل التصنيفات:', error);
    }
}

document.getElementById('advBannerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('advBannerId').value;
    const data = {
        title: document.getElementById('advBannerTitle').value.trim(),
        subtitle: document.getElementById('advBannerSubtitle').value.trim(),
        banner_type: document.getElementById('advBannerType').value,
        image_url: document.getElementById('advBannerImage').value.trim(),
        bg_color: document.getElementById('advBannerBgColor').value,
        button_text: document.getElementById('advBannerButtonText').value.trim(),
        button_url: document.getElementById('advBannerButtonUrl').value.trim(),
        product_id: document.getElementById('advBannerProductId').value || null,
        category_id: document.getElementById('advBannerCategoryId').value || null,
        width: document.getElementById('advBannerWidth').value,
        height: document.getElementById('advBannerHeight').value,
        position: document.getElementById('advBannerPosition').value,
        is_active: document.getElementById('advBannerStatus').value === 'true',
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
            data.display_order = 999;
            result = await supabase
                .from('banners')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث البنر' : '✅ تم إضافة البنر', 'success');
        closeAdvancedBannerForm();
        loadBanners();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
});

// ============================================
// ===== إدارة القوائم (Menus) =====
// ============================================

async function loadMenus() {
    try {
        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const tbody = document.getElementById('menusTableBody');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8A8A9B;">📋 لا توجد روابط</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map((menu, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><code style="background:#0F0F1A;padding:2px 8px;border-radius:4px;">${menu.url}</code></td>
                <td>${menu.label}</td>
                <td style="font-size:20px;">${menu.icon || '🔗'}</td>
                <td>
                    <button class="status-toggle ${menu.is_active ? 'active' : 'inactive'}" 
                            onclick="toggleMenuStatus('${menu.id}', ${!menu.is_active})">
                        ${menu.is_active ? '✅ نشط' : '❌ غير نشط'}
                    </button>
                </td>
                <td>
                    <button class="btn-edit" onclick="editMenu('${menu.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteMenu('${menu.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Menus loaded:', data.length);
    } catch (error) {
        console.error('❌ Menus error:', error);
    }
}

function openMenuForm(menuData = null) {
    const modal = document.getElementById('menuModal');
    const title = document.getElementById('menuFormTitle');
    const form = document.getElementById('menuForm');
    
    if (menuData) {
        title.textContent = '✏️ تعديل الرابط';
        document.getElementById('menuId').value = menuData.id;
        document.getElementById('menuLabel').value = menuData.label || '';
        document.getElementById('menuUrl').value = menuData.url || '';
        document.getElementById('menuIcon').value = menuData.icon || '';
        document.getElementById('menuPosition').value = menuData.position || 'header';
        document.getElementById('menuStatus').value = menuData.is_active ? 'true' : 'false';
    } else {
        title.textContent = '➕ إضافة رابط جديد';
        form.reset();
        document.getElementById('menuId').value = '';
        document.getElementById('menuStatus').value = 'true';
    }
    
    modal.classList.add('active');
}
window.openMenuForm = openMenuForm;

function closeMenuForm() {
    document.getElementById('menuModal').classList.remove('active');
}
window.closeMenuForm = closeMenuForm;

document.getElementById('menuForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('menuId').value;
    const data = {
        label: document.getElementById('menuLabel').value.trim(),
        url: document.getElementById('menuUrl').value.trim(),
        icon: document.getElementById('menuIcon').value.trim(),
        position: document.getElementById('menuPosition').value,
        is_active: document.getElementById('menuStatus').value === 'true',
        updated_at: new Date().toISOString()
    };
    
    if (!data.label || !data.url) {
        showToast('⚠️ الرجاء تعبئة جميع الحقول المطلوبة', 'warning');
        return;
    }
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('menus')
                .update(data)
                .eq('id', parseInt(id));
        } else {
            data.display_order = 999;
            result = await supabase
                .from('menus')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث الرابط' : '✅ تم إضافة الرابط', 'success');
        closeMenuForm();
        loadMenus();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
});

window.editMenu = async function(id) {
    try {
        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        openMenuForm(data);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.deleteMenu = async function(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الرابط؟')) return;
    
    try {
        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف الرابط', 'success');
        loadMenus();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.toggleMenuStatus = async function(id, newStatus) {
    try {
        const { error } = await supabase
            .from('menus')
            .update({ is_active: newStatus })
            .eq('id', id);
        
        if (error) throw error;
        loadMenus();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

// ============================================
// ===== الإعدادات العامة (Settings) =====
// ============================================

async function loadSettings() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .order('group_name', { ascending: true })
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const container = document.getElementById('settingsFields');
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#8A8A9B;">لا توجد إعدادات</p>';
            return;
        }
        
        const groups = {};
        data.forEach(setting => {
            const group = setting.group_name || 'general';
            if (!groups[group]) groups[group] = [];
            groups[group].push(setting);
        });
        
        container.innerHTML = Object.entries(groups).map(([groupName, settings]) => `
            <div class="setting-group">
                <h4>${getGroupLabel(groupName)}</h4>
                ${settings.map(setting => `
                    <div class="form-group">
                        <label for="setting_${setting.key}">${setting.label || setting.key}</label>
                        ${getSettingInput(setting)}
                    </div>
                `).join('')}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Settings error:', error);
    }
}

function getGroupLabel(group) {
    const labels = {
        'general': '📋 عام',
        'design': '🎨 التصميم',
        'contact': '📞 التواصل'
    };
    return labels[group] || group;
}

function getSettingInput(setting) {
    const value = setting.value || '';
    const id = `setting_${setting.key}`;
    
    if (setting.key.includes('color') || setting.key.includes('bg')) {
        return `<input type="color" id="${id}" value="${value}" />`;
    }
    
    return `<input type="text" id="${id}" value="${value}" />`;
}

document.getElementById('settingsForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const inputs = this.querySelectorAll('input');
    const updates = [];
    
    inputs.forEach(input => {
        if (input.id && input.id.startsWith('setting_')) {
            const key = input.id.replace('setting_', '');
            updates.push({
                key: key,
                value: input.value
            });
        }
    });
    
    try {
        for (const update of updates) {
            const { error } = await supabase
                .from('settings')
                .update({ value: update.value, updated_at: new Date().toISOString() })
                .eq('key', update.key);
            
            if (error) throw error;
        }
        
        showToast('✅ تم حفظ الإعدادات بنجاح', 'success');
        loadSettings();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
});

// ============================================
// ===== [جديد] الإعدادات المتقدمة =====
// ============================================

async function loadStoreSettings() {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*');
        
        if (error) throw error;
        
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });
        
        return settings;
    } catch (error) {
        console.error('❌ خطأ في تحميل إعدادات المتجر:', error);
        return {};
    }
}

async function saveStoreSettings(key, value) {
    try {
        console.log('💾 محاولة حفظ:', key);
        
        const { data: existing, error: findError } = await supabase
            .from('store_settings')
            .select('key')
            .eq('key', key)
            .maybeSingle();
        
        if (findError && findError.code !== 'PGRST116') {
            console.error('❌ خطأ في البحث:', findError);
            throw findError;
        }
        
        let result;
        
        if (existing) {
            console.log('🔄 تحديث المفتاح:', key);
            result = await supabase
                .from('store_settings')
                .update({ 
                    value: value,
                    updated_at: new Date().toISOString()
                })
                .eq('key', key);
        } else {
            console.log('➕ إدراج مفتاح جديد:', key);
            result = await supabase
                .from('store_settings')
                .insert({ 
                    key: key, 
                    value: value,
                    group_name: getGroupName(key),
                    updated_at: new Date().toISOString()
                });
        }
        
        if (result.error) {
            console.error('❌ خطأ في الحفظ:', result.error);
            throw result.error;
        }
        
        console.log('✅ تم حفظ:', key);
        showToast('✅ تم حفظ الإعدادات', 'success');
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الإعدادات:', error);
        
        try {
            console.log('🔄 محاولة الحل الأخير...');
            await supabase.from('store_settings').delete().eq('key', key);
            
            const { error: insertError } = await supabase
                .from('store_settings')
                .insert({ 
                    key: key, 
                    value: value,
                    group_name: getGroupName(key),
                    updated_at: new Date().toISOString()
                });
            
            if (insertError) throw insertError;
            
            console.log('✅ تم الحفظ بعد الحذف والإدراج');
            showToast('✅ تم حفظ الإعدادات', 'success');
            return true;
            
        } catch (retryError) {
            console.error('❌ فشل الحل الأخير:', retryError);
            showToast('❌ حدث خطأ: ' + error.message, 'error');
            return false;
        }
    }
}

function getGroupName(key) {
    const groups = {
        'branding': 'branding',
        'display': 'display',
        'storeInfo': 'general',
        'currencies': 'currencies'
    };
    return groups[key] || 'general';
}

async function initAdvancedSettings() {
    const settings = await loadStoreSettings();
    const container = document.getElementById('advancedSettingsContainer');
    if (!container) return;
    
    const branding = settings.branding || {};
    const display = settings.display || {};
    const storeInfo = settings.storeInfo || {};
    const currencies = settings.currencies || { default: 'SAR', available: ['SAR', 'BHD', 'QAR', 'AED', 'KWD', 'OMR', 'USD', 'EUR'] };
    
    container.innerHTML = `
        <div class="settings-section">
            <h3>🏪 هوية المتجر</h3>
            <div class="form-group">
                <label>اسم المتجر</label>
                <input type="text" id="storeName" value="${storeInfo.name || 'Tithkari'}" />
            </div>
            <div class="form-group">
                <label>وصف المتجر</label>
                <textarea id="storeDescription" rows="2">${storeInfo.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>🖼️ شعار المتجر</label>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <input type="file" id="storeLogoFile" accept="image/*" />
                    <input type="url" id="storeLogoUrl" placeholder="أو أدخل رابط الصورة" value="${branding.logo || ''}" style="flex:1;" />
                </div>
                <div id="storeLogoPreview" style="margin-top:8px;">
                    ${branding.logo ? `<img src="${branding.logo}" style="max-width:120px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" />` : ''}
                </div>
            </div>
        </div>
        
        <div class="settings-section">
            <h3>🎨 الألوان والثيم</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>اللون الأساسي (الذهبي)</label>
                    <input type="color" id="primaryColor" value="${branding.primary_color || '#FFD700'}" />
                </div>
                <div class="form-group">
                    <label>اللون الثانوي</label>
                    <input type="color" id="secondaryColor" value="${branding.secondary_color || '#8B0000'}" />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>لون الخلفية</label>
                    <input type="color" id="bgColor" value="${branding.bg_color || '#0F0F1A'}" />
                </div>
                <div class="form-group">
                    <label>لون النص الأساسي</label>
                    <input type="color" id="textColor" value="${branding.text_color || '#FFFFFF'}" />
                </div>
            </div>
        </div>
        
        <div class="settings-section">
            <h3>🔤 الخطوط</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>نوع الخط</label>
                    <select id="fontFamily">
                        <option value="Cairo" ${branding.font_family === 'Cairo' ? 'selected' : ''}>كايرو (Cairo)</option>
                        <option value="Tajawal" ${branding.font_family === 'Tajawal' ? 'selected' : ''}>تجول (Tajawal)</option>
                        <option value="Amiri" ${branding.font_family === 'Amiri' ? 'selected' : ''}>أميري (Amiri)</option>
                        <option value="Reem Kufi" ${branding.font_family === 'Reem Kufi' ? 'selected' : ''}>ريم كوفي (Reem Kufi)</option>
                        <option value="Changa" ${branding.font_family === 'Changa' ? 'selected' : ''}>شانغا (Changa)</option>
                        <option value="Almarai" ${branding.font_family === 'Almarai' ? 'selected' : ''}>المراعي (Almarai)</option>
                        <option value="El Messiri" ${branding.font_family === 'El Messiri' ? 'selected' : ''}>المسيري (El Messiri)</option>
                        <option value="Lemonada" ${branding.font_family === 'Lemonada' ? 'selected' : ''}>ليمونادة (Lemonada)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>حجم الخط الأساسي (px)</label>
                    <input type="number" id="fontSize" value="${branding.font_size || 16}" min="12" max="24" />
                </div>
            </div>
        </div>
        
        <div class="settings-section">
            <h3>📐 طريقة العرض</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>طريقة العرض الافتراضية</label>
                    <select id="defaultView">
                        <option value="grid" ${display.default_view === 'grid' ? 'selected' : ''}>شبكة (Grid)</option>
                        <option value="list" ${display.default_view === 'list' ? 'selected' : ''}>قائمة (List)</option>
                        <option value="compact" ${display.default_view === 'compact' ? 'selected' : ''}>مدمج (Compact)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>عدد المنتجات في الصفحة</label>
                    <input type="number" id="productsPerPage" value="${display.products_per_page || 12}" min="4" max="48" />
                </div>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="showCategories" ${display.show_categories !== false ? 'checked' : ''} />
                    عرض التصنيفات
                </label>
            </div>
        </div>
        
        <div class="settings-section">
            <h3>💰 العملات</h3>
            <div class="form-group">
                <label>العملة الافتراضية</label>
                <select id="defaultCurrency">
                    <option value="SAR" ${currencies.default === 'SAR' ? 'selected' : ''}>🇸🇦 ريال سعودي (SAR)</option>
                    <option value="BHD" ${currencies.default === 'BHD' ? 'selected' : ''}>🇧🇭 دينار بحريني (BHD)</option>
                    <option value="QAR" ${currencies.default === 'QAR' ? 'selected' : ''}>🇶🇦 ريال قطري (QAR)</option>
                    <option value="AED" ${currencies.default === 'AED' ? 'selected' : ''}>🇦🇪 درهم إماراتي (AED)</option>
                    <option value="KWD" ${currencies.default === 'KWD' ? 'selected' : ''}>🇰🇼 دينار كويتي (KWD)</option>
                    <option value="OMR" ${currencies.default === 'OMR' ? 'selected' : ''}>🇴🇲 ريال عماني (OMR)</option>
                    <option value="USD" ${currencies.default === 'USD' ? 'selected' : ''}>🇺🇸 دولار أمريكي (USD)</option>
                    <option value="EUR" ${currencies.default === 'EUR' ? 'selected' : ''}>🇪🇺 يورو (EUR)</option>
                </select>
            </div>
            <div class="form-group">
                <label>العملات المتاحة للزبائن</label>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    ${['SAR', 'BHD', 'QAR', 'AED', 'KWD', 'OMR', 'USD', 'EUR'].map(code => {
                        const names = { SAR: '🇸🇦 ريال سعودي', BHD: '🇧🇭 دينار بحريني', QAR: '🇶🇦 ريال قطري', AED: '🇦🇪 درهم إماراتي', KWD: '🇰🇼 دينار كويتي', OMR: '🇴🇲 ريال عماني', USD: '🇺🇸 دولار أمريكي', EUR: '🇪🇺 يورو' };
                        const checked = currencies.available?.includes(code) !== false;
                        return `
                            <label style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.03);padding:4px 10px;border-radius:6px;">
                                <input type="checkbox" class="currency-checkbox" value="${code}" ${checked ? 'checked' : ''} />
                                ${names[code] || code}
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        
        <div class="settings-section" style="margin-top:30px;padding-top:30px;border-top:1px solid rgba(255,215,0,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:15px;">
                <h3>📋 إدارة التذييل</h3>
                <button class="btn-primary" onclick="openFooterItemForm()" style="padding:8px 16px;font-size:14px;">
                    <i class="fas fa-plus"></i> إضافة عنصر
                </button>
            </div>
            <div id="footerItemsContainer">
            </div>
        </div>
        
        <div class="settings-section" style="margin-top:30px;padding-top:30px;border-top:1px solid rgba(255,215,0,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:15px;">
                <h3>📢 البنرات المتطورة</h3>
                <button class="btn-primary" onclick="openAdvancedBannerForm()" style="padding:8px 16px;font-size:14px;">
                    <i class="fas fa-plus"></i> إضافة بنر متطور
                </button>
            </div>
            <div id="advancedBannersContainer">
            </div>
        </div>
        
        <div class="settings-section" style="margin-top:30px;padding-top:30px;border-top:1px solid rgba(255,215,0,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:15px;">
                <h3>📂 إدارة التصنيفات</h3>
                <button class="btn-primary" onclick="openCategoryForm()" style="padding:8px 16px;font-size:14px;">
                    <i class="fas fa-plus"></i> إضافة تصنيف
                </button>
                <button class="btn-secondary" onclick="loadCategoriesForAdmin()" style="padding:8px 16px;font-size:14px;">
                    <i class="fas fa-sync"></i> تحديث
                </button>
            </div>
            <div id="categoriesContainer" style="margin-top:10px;">
            </div>
        </div>
        
        <button class="btn-primary" onclick="saveAdvancedSettings()" style="margin-top:20px;width:100%;justify-content:center;">
            <i class="fas fa-save"></i> حفظ جميع الإعدادات
        </button>
    `;
    
    document.getElementById('storeLogoFile')?.addEventListener('change', function(e) {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                document.getElementById('storeLogoPreview').innerHTML = 
                    `<img src="${ev.target.result}" style="max-width:120px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" />`;
                document.getElementById('storeLogoUrl').value = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    document.getElementById('storeLogoUrl')?.addEventListener('input', function() {
        const url = this.value.trim();
        if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
            document.getElementById('storeLogoPreview').innerHTML = 
                `<img src="${url}" style="max-width:120px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" onerror="this.style.display='none'" />`;
        }
    });
    
    loadFooterItems();
    loadBannersForAdvanced();
    loadCategoriesForAdmin();
}
window.initAdvancedSettings = initAdvancedSettings;

// ============================================
// ===== [جديد] إدارة التصنيفات (Categories) =====
// ============================================

async function loadCategoriesForAdmin() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const container = document.getElementById('categoriesContainer');
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:var(--gray);">لا توجد تصنيفات</p>';
            return;
        }
        
        container.innerHTML = data.map(cat => `
            <div class="category-admin-card" style="display:flex;justify-content:space-between;align-items:center;padding:10px 15px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:5px;border:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex;align-items:center;gap:10px;flex:1;">
                    ${cat.image_url ? `<img src="${cat.image_url}" style="width:40px;height:40px;object-fit:contain;border-radius:8px;" onerror="this.style.display='none'" />` : `<span style="font-size:24px;">${cat.icon ? '📁' : '📂'}</span>`}
                    <div>
                        <strong>${cat.name}</strong>
                        <p style="color:var(--gray);font-size:12px;margin:0;">${cat.slug || 'لا يوجد slug'} - ${cat.is_active ? '✅ نشط' : '❌ غير نشط'}</p>
                    </div>
                </div>
                <div style="display:flex;gap:5px;">
                    <button class="btn-edit" onclick="openCategoryFormForEdit('${cat.id}')" style="padding:4px 10px;border-radius:4px;background:#3b82f6;color:white;border:none;cursor:pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteCategory('${cat.id}')" style="padding:4px 10px;border-radius:4px;background:#ef4444;color:white;border:none;cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-secondary" onclick="toggleCategoryStatus('${cat.id}')" style="padding:4px 10px;border-radius:4px;background:${cat.is_active ? '#f59e0b' : '#10b981'};color:white;border:none;cursor:pointer;font-size:11px;">
                        ${cat.is_active ? 'إلغاء النشط' : 'تفعيل'}
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('✅ تم تحميل التصنيفات للوحة التحكم:', data.length);
    } catch (error) {
        console.error('❌ خطأ في تحميل التصنيفات:', error);
        showToast('❌ حدث خطأ في تحميل التصنيفات', 'error');
    }
}
window.loadCategoriesForAdmin = loadCategoriesForAdmin;

function openCategoryForm(categoryData = null) {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryFormTitle');
    
    if (categoryData) {
        title.textContent = '✏️ تعديل التصنيف';
        document.getElementById('categoryId').value = categoryData.id;
        document.getElementById('categoryName').value = categoryData.name || '';
        document.getElementById('categorySlug').value = categoryData.slug || '';
        document.getElementById('categoryDescription').value = categoryData.description || '';
        document.getElementById('categoryIcon').value = categoryData.icon || '';
        document.getElementById('categoryImageUrl').value = categoryData.image_url || '';
        document.getElementById('categoryDisplayOrder').value = categoryData.display_order || 0;
        document.getElementById('categoryStatus').value = categoryData.is_active ? 'true' : 'false';
    } else {
        title.textContent = '➕ إضافة تصنيف جديد';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('categorySlug').value = '';
        document.getElementById('categoryDisplayOrder').value = 0;
        document.getElementById('categoryStatus').value = 'true';
    }
    
    modal.classList.add('active');
}
window.openCategoryForm = openCategoryForm;

window.openCategoryFormForEdit = async function(id) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        openCategoryForm(data);
    } catch (error) {
        console.error('❌ خطأ في تحميل التصنيف:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

function closeCategoryForm() {
    document.getElementById('categoryModal').classList.remove('active');
}
window.closeCategoryForm = closeCategoryForm;

document.getElementById('categoryForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    const slug = document.getElementById('categorySlug').value.trim() || generateSlug(name);
    const description = document.getElementById('categoryDescription').value.trim();
    const icon = document.getElementById('categoryIcon').value.trim();
    const image_url = document.getElementById('categoryImageUrl').value.trim();
    const display_order = parseInt(document.getElementById('categoryDisplayOrder').value) || 0;
    const is_active = document.getElementById('categoryStatus').value === 'true';
    
    if (!name) {
        showToast('⚠️ الرجاء إدخال اسم التصنيف', 'warning');
        return;
    }
    
    const data = {
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        description,
        icon: icon || 'fa-tag',
        image_url: image_url || null,
        display_order,
        is_active,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('categories')
                .update(data)
                .eq('id', id);
        } else {
            data.created_at = new Date().toISOString();
            result = await supabase
                .from('categories')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث التصنيف' : '✅ تم إضافة التصنيف', 'success');
        closeCategoryForm();
        loadCategoriesForAdmin();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
});

function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
}

window.deleteCategory = async function(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا التصنيف؟ سيتم حذف جميع المنتجات المرتبطة به.')) return;
    
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف التصنيف', 'success');
        loadCategoriesForAdmin();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.toggleCategoryStatus = async function(id) {
    try {
        const { data, error: fetchError } = await supabase
            .from('categories')
            .select('is_active')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        const newStatus = !data.is_active;
        
        const { error } = await supabase
            .from('categories')
            .update({ is_active: newStatus })
            .eq('id', id);
        
        if (error) throw error;
        
        showToast(`✅ تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} التصنيف`, 'success');
        loadCategoriesForAdmin();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

// ============================================
// ===== [جديد] إدارة التذييل =====
// ============================================

async function loadFooterItems() {
    try {
        const { data, error } = await supabase
            .from('footer_items')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const container = document.getElementById('footerItemsContainer');
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:var(--gray);">لا توجد عناصر في التذييل</p>';
            return;
        }
        
        container.innerHTML = data.map(item => `
            <div class="footer-item-card" style="display:flex;justify-content:space-between;align-items:center;padding:10px 15px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:5px;border:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex;align-items:center;gap:10px;flex:1;">
                    <span style="font-size:24px;">${item.icon || '📄'}</span>
                    <div>
                        <strong>${item.label}</strong>
                        <p style="color:var(--gray);font-size:12px;margin:0;">${item.type || 'نص'} - ${item.is_active ? '✅ نشط' : '❌ غير نشط'}</p>
                    </div>
                </div>
                <div style="display:flex;gap:5px;">
                    <button class="btn-edit" onclick="editFooterItem('${item.id}')" style="padding:4px 10px;border-radius:4px;background:#3b82f6;color:white;border:none;cursor:pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteFooterItem('${item.id}')" style="padding:4px 10px;border-radius:4px;background:#ef4444;color:white;border:none;cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('✅ تم تحميل عناصر التذييل:', data.length);
    } catch (error) {
        console.error('❌ خطأ في تحميل عناصر التذييل:', error);
    }
}
window.loadFooterItems = loadFooterItems;

function openFooterItemForm(itemData = null) {
    const modal = document.getElementById('footerItemModal');
    const title = document.getElementById('footerItemFormTitle');
    
    if (itemData) {
        title.textContent = '✏️ تعديل عنصر التذييل';
        document.getElementById('footerItemId').value = itemData.id;
        document.getElementById('footerItemLabel').value = itemData.label || '';
        document.getElementById('footerItemIcon').value = itemData.icon || '';
        document.getElementById('footerItemContent').value = itemData.content || '';
        document.getElementById('footerItemType').value = itemData.type || 'text';
        document.getElementById('footerItemLink').value = itemData.link_url || '';
        document.getElementById('footerItemStatus').value = itemData.is_active ? 'true' : 'false';
    } else {
        title.textContent = '➕ إضافة عنصر تذييل جديد';
        document.getElementById('footerItemForm').reset();
        document.getElementById('footerItemId').value = '';
        document.getElementById('footerItemType').value = 'text';
        document.getElementById('footerItemStatus').value = 'true';
    }
    
    modal.classList.add('active');
}
window.openFooterItemForm = openFooterItemForm;

function closeFooterItemForm() {
    document.getElementById('footerItemModal').classList.remove('active');
}
window.closeFooterItemForm = closeFooterItemForm;

document.getElementById('footerItemForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('footerItemId').value;
    const data = {
        label: document.getElementById('footerItemLabel').value.trim(),
        icon: document.getElementById('footerItemIcon').value.trim(),
        content: document.getElementById('footerItemContent').value.trim(),
        type: document.getElementById('footerItemType').value,
        link_url: document.getElementById('footerItemLink').value.trim(),
        is_active: document.getElementById('footerItemStatus').value === 'true',
        updated_at: new Date().toISOString()
    };
    
    if (!data.label) {
        showToast('⚠️ الرجاء إدخال اسم العنصر', 'warning');
        return;
    }
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('footer_items')
                .update(data)
                .eq('id', id);
        } else {
            data.display_order = 999;
            result = await supabase
                .from('footer_items')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث العنصر' : '✅ تم إضافة العنصر', 'success');
        closeFooterItemForm();
        loadFooterItems();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
});

window.deleteFooterItem = async function(id) {
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
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.editFooterItem = async function(id) {
    try {
        const { data, error } = await supabase
            .from('footer_items')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        openFooterItemForm(data);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

// ============================================
// ===== [جديد] تحميل البنرات للعرض المتقدم =====
// ============================================

async function loadBannersForAdvanced() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const container = document.getElementById('advancedBannersContainer');
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:var(--gray);">لا توجد بنرات</p>';
            return;
        }
        
        container.innerHTML = data.map(banner => `
            <div class="banner-item-card" style="display:flex;justify-content:space-between;align-items:center;padding:10px 15px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:5px;border:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex;align-items:center;gap:10px;flex:1;">
                    ${banner.image_url ? `<img src="${banner.image_url}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'" />` : `<span style="font-size:24px;">${banner.icon || '📢'}</span>`}
                    <div>
                        <strong>${banner.title}</strong>
                        <p style="color:var(--gray);font-size:12px;margin:0;">${banner.banner_type || 'image'} - ${banner.is_active ? '✅ نشط' : '❌ غير نشط'}</p>
                    </div>
                </div>
                <div style="display:flex;gap:5px;">
                    <button class="btn-edit" onclick="openAdvancedBannerFormForEdit('${banner.id}')" style="padding:4px 10px;border-radius:4px;background:#3b82f6;color:white;border:none;cursor:pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteBanner('${banner.id}')" style="padding:4px 10px;border-radius:4px;background:#ef4444;color:white;border:none;cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('✅ تم تحميل البنرات للعرض المتقدم:', data.length);
    } catch (error) {
        console.error('❌ خطأ في تحميل البنرات:', error);
    }
}

window.openAdvancedBannerFormForEdit = async function(id) {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        openAdvancedBannerForm(data);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

// ============================================
// 🛠️ [مُصلح] حفظ الإعدادات المتقدمة
// ============================================

async function saveAdvancedSettings() {
    const branding = {
        logo: document.getElementById('storeLogoUrl')?.value || '',
        primary_color: document.getElementById('primaryColor')?.value || '#FFD700',
        secondary_color: document.getElementById('secondaryColor')?.value || '#8B0000',
        bg_color: document.getElementById('bgColor')?.value || '#0F0F1A',
        text_color: document.getElementById('textColor')?.value || '#FFFFFF',
        font_family: document.getElementById('fontFamily')?.value || 'Cairo',
        font_size: parseInt(document.getElementById('fontSize')?.value) || 16
    };
    
    const display = {
        default_view: document.getElementById('defaultView')?.value || 'grid',
        products_per_page: parseInt(document.getElementById('productsPerPage')?.value) || 12,
        show_categories: document.getElementById('showCategories')?.checked !== false
    };
    
    const storeInfo = {
        name: document.getElementById('storeName')?.value || 'Tithkari',
        description: document.getElementById('storeDescription')?.value || ''
    };
    
    const currencyCheckboxes = document.querySelectorAll('.currency-checkbox:checked');
    const currencies = {
        default: document.getElementById('defaultCurrency')?.value || 'SAR',
        available: Array.from(currencyCheckboxes).map(cb => cb.value)
    };
    
    let allSuccess = true;
    
    const sections = [
        { key: 'branding', value: branding },
        { key: 'display', value: display },
        { key: 'storeInfo', value: storeInfo },
        { key: 'currencies', value: currencies }
    ];
    
    for (const section of sections) {
        console.log(`📝 جاري حفظ: ${section.key}`);
        const success = await saveStoreSettings(section.key, section.value);
        if (!success) {
            allSuccess = false;
            console.error(`❌ فشل حفظ: ${section.key}`);
            break;
        }
    }
    
    if (allSuccess) {
        showToast('✅ تم حفظ جميع الإعدادات بنجاح!', 'success');
        setTimeout(() => {
            if (confirm('✅ تم حفظ الإعدادات! هل تريد تحديث المتجر لرؤية التغييرات؟')) {
                window.location.reload();
            }
        }, 1000);
    } else {
        showToast('⚠️ حدث خطأ في حفظ بعض الإعدادات', 'error');
    }
}
window.saveAdvancedSettings = saveAdvancedSettings;

// ============================================
// ===== إدارة قوالب التصميم (Design Templates) =====
// ============================================

async function loadDesignTemplates() {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('templatesTableBody');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#8A8A9B;">🎨 لا توجد قوالب تصميم</td></tr>';
            return;
        }
        
        const placeholder = getPlaceholderSVG('🛡️', 50, 50);
        
        tbody.innerHTML = data.map((t, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>
                    <img src="${t.image_url || placeholder}" 
                         alt="${t.name}" 
                         style="width:50px;height:50px;object-fit:cover;border-radius:8px;"
                         onerror="this.src='${placeholder}'" />
                </td>
                <td>${t.name}</td>
                <td>
                    <button class="status-toggle ${t.status === 'active' ? 'active' : 'inactive'}" 
                            onclick="toggleTemplateStatus('${t.id}', '${t.status === 'active' ? 'inactive' : 'active'}')">
                        ${t.status === 'active' ? '✅ نشط' : '❌ غير نشط'}
                    </button>
                </td>
                <td>
                    <button class="btn-edit" onclick="editTemplate('${t.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteTemplate('${t.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Design templates loaded from Supabase:', data.length);
    } catch (error) {
        console.error('❌ Error loading design templates:', error);
        showToast('خطأ في تحميل القوالب', 'error');
    }
}

function openTemplateForm(templateData = null) {
    const modal = document.getElementById('templateModal');
    const title = document.getElementById('templateFormTitle');
    const form = document.getElementById('templateForm');
    
    if (templateData) {
        title.textContent = '✏️ تعديل القالب';
        document.getElementById('templateId').value = templateData.id;
        document.getElementById('templateName').value = templateData.name || '';
        document.getElementById('templateImage').value = templateData.image_url || '';
        document.getElementById('templateRef').value = templateData.ref_url || '';
        document.getElementById('templateStatus').value = templateData.status || 'active';
    } else {
        title.textContent = '➕ إضافة قالب جديد';
        form.reset();
        document.getElementById('templateId').value = '';
        document.getElementById('templateStatus').value = 'active';
    }
    
    modal.classList.add('active');
}
window.openTemplateForm = openTemplateForm;

function closeTemplateForm() {
    document.getElementById('templateModal').classList.remove('active');
}
window.closeTemplateForm = closeTemplateForm;

window.addTemplate = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('templateName').value.trim();
    const image_url = document.getElementById('templateImage').value.trim();
    const ref_url = document.getElementById('templateRef').value.trim();
    const status = document.getElementById('templateStatus').value;
    
    if (!name || !image_url) {
        showToast('⚠️ الرجاء تعبئة جميع الحقول المطلوبة', 'warning');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('templates')
            .insert([{ 
                name: name, 
                image_url: image_url, 
                ref_url: ref_url || image_url, 
                status: status 
            }]);
        
        if (error) throw error;
        
        showToast('✅ تم إضافة القالب بنجاح!', 'success');
        closeTemplateForm();
        loadDesignTemplates();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.deleteTemplate = async function(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا القالب؟')) return;
    
    try {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف القالب', 'success');
        loadDesignTemplates();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.editTemplate = async function(id) {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('templateId').value = data.id;
        document.getElementById('templateName').value = data.name;
        document.getElementById('templateImage').value = data.image_url;
        document.getElementById('templateRef').value = data.ref_url || '';
        document.getElementById('templateStatus').value = data.status || 'active';
        
        document.getElementById('templateFormTitle').textContent = '✏️ تعديل القالب';
        document.getElementById('templateModal').classList.add('active');
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.toggleTemplateStatus = async function(id, newStatus) {
    try {
        const { error } = await supabase
            .from('templates')
            .update({ status: newStatus })
            .eq('id', id);
        
        if (error) throw error;
        loadDesignTemplates();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

document.getElementById('templateForm')?.addEventListener('submit', window.addTemplate);

// ============================================
// ===== إعدادات المتجر (Store Settings) =====
// ============================================

function loadStoreSettingsLocal() {
    try {
        const settings = JSON.parse(localStorage.getItem('tithkari_store_settings') || '{}');
        return settings;
    } catch {
        return {};
    }
}

function saveStoreSettingsLocal(settings) {
    localStorage.setItem('tithkari_store_settings', JSON.stringify(settings));
    applyStoreSettings(settings);
    showToast('✅ تم حفظ إعدادات المتجر', 'success');
}

function applyStoreSettings(settings) {
    if (settings.storeName) {
        document.querySelectorAll('.store-name').forEach(el => el.textContent = settings.storeName);
        document.title = settings.storeName + ' - متجر تصميم الدروع';
    }
    
    if (settings.primaryColor) {
        document.documentElement.style.setProperty('--gold', settings.primaryColor);
        document.documentElement.style.setProperty('--accent-color', settings.primaryColor);
    }
    if (settings.secondaryColor) {
        document.documentElement.style.setProperty('--primary', settings.secondaryColor);
    }
    if (settings.bgColor) {
        document.documentElement.style.setProperty('--dark', settings.bgColor);
    }
    
    if (settings.fontFamily) {
        document.documentElement.style.setProperty('--font-family', settings.fontFamily);
        document.body.style.fontFamily = settings.fontFamily + ', sans-serif';
    }
    if (settings.fontSize) {
        document.documentElement.style.fontSize = settings.fontSize + 'px';
    }
    
    if (settings.logo) {
        document.querySelectorAll('.store-logo').forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = settings.logo;
            }
        });
    }
    
    if (settings.socialLinks) {
        const socialContainer = document.querySelector('.social-links');
        if (socialContainer) {
            socialContainer.innerHTML = '';
            const icons = {
                facebook: 'fab fa-facebook',
                instagram: 'fab fa-instagram',
                twitter: 'fab fa-twitter',
                youtube: 'fab fa-youtube',
                whatsapp: 'fab fa-whatsapp',
                tiktok: 'fab fa-tiktok',
                snapchat: 'fab fa-snapchat'
            };
            Object.entries(settings.socialLinks).forEach(([platform, url]) => {
                if (url) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.innerHTML = `<i class="${icons[platform] || 'fas fa-link'}"></i>`;
                    socialContainer.appendChild(a);
                }
            });
        }
    }
    
    console.log('🎨 تم تطبيق إعدادات المتجر');
}

function initStoreSettings() {
    const settings = loadStoreSettingsLocal();
    const container = document.getElementById('storeSettingsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="store-settings-grid">
            <div class="setting-group">
                <h4>📋 هوية المتجر</h4>
                <div class="form-group">
                    <label>اسم المتجر</label>
                    <input type="text" id="storeName" value="${settings.storeName || 'Tithkari'}" placeholder="اسم المتجر" />
                </div>
                <div class="form-group">
                    <label>وصف المتجر</label>
                    <textarea id="storeDescription" rows="2" placeholder="وصف المتجر">${settings.storeDescription || 'متجر متخصص في تصميم وبيع الدروع الفاخرة'}</textarea>
                </div>
                <div class="form-group">
                    <label>🖼️ شعار المتجر (صورة)</label>
                    <input type="file" id="storeLogoFile" accept="image/*" />
                    <div id="storeLogoPreview" style="margin-top:8px;">
                        ${settings.logo ? `<img src="${settings.logo}" style="max-width:150px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" />` : ''}
                    </div>
                    <input type="text" id="storeLogoUrl" value="${settings.logo || ''}" placeholder="أو أدخل رابط الصورة" style="margin-top:5px;" />
                </div>
            </div>
            
            <div class="setting-group">
                <h4>🎨 الألوان والتصميم</h4>
                <div class="form-group">
                    <label>اللون الأساسي (الذهبي)</label>
                    <input type="color" id="primaryColor" value="${settings.primaryColor || '#FFD700'}" />
                </div>
                <div class="form-group">
                    <label>اللون الثانوي</label>
                    <input type="color" id="secondaryColor" value="${settings.secondaryColor || '#8B0000'}" />
                </div>
                <div class="form-group">
                    <label>لون الخلفية</label>
                    <input type="color" id="bgColor" value="${settings.bgColor || '#0F0F1A'}" />
                </div>
            </div>
            
            <div class="setting-group">
                <h4>🔤 الخطوط</h4>
                <div class="form-group">
                    <label>نوع الخط</label>
                    <select id="fontFamily">
                        <option value="Cairo" ${settings.fontFamily === 'Cairo' ? 'selected' : ''}>كايرو (Cairo)</option>
                        <option value="Tajawal" ${settings.fontFamily === 'Tajawal' ? 'selected' : ''}>تجول (Tajawal)</option>
                        <option value="Amiri" ${settings.fontFamily === 'Amiri' ? 'selected' : ''}>أميري (Amiri)</option>
                        <option value="Reem Kufi" ${settings.fontFamily === 'Reem Kufi' ? 'selected' : ''}>ريم كوفي (Reem Kufi)</option>
                        <option value="Changa" ${settings.fontFamily === 'Changa' ? 'selected' : ''}>شانغا (Changa)</option>
                        <option value="Almarai" ${settings.fontFamily === 'Almarai' ? 'selected' : ''}>المراعي (Almarai)</option>
                        <option value="El Messiri" ${settings.fontFamily === 'El Messiri' ? 'selected' : ''}>المسيري (El Messiri)</option>
                        <option value="Lemonada" ${settings.fontFamily === 'Lemonada' ? 'selected' : ''}>ليمونادة (Lemonada)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>حجم الخط الأساسي (px)</label>
                    <input type="number" id="fontSize" value="${settings.fontSize || 16}" min="12" max="24" />
                </div>
            </div>
            
            <div class="setting-group">
                <h4>📱 روابط التواصل الاجتماعي</h4>
                <div class="form-group">
                    <label>فيسبوك</label>
                    <input type="url" id="socialFacebook" value="${settings.socialLinks?.facebook || ''}" placeholder="https://facebook.com/..." />
                </div>
                <div class="form-group">
                    <label>انستغرام</label>
                    <input type="url" id="socialInstagram" value="${settings.socialLinks?.instagram || ''}" placeholder="https://instagram.com/..." />
                </div>
                <div class="form-group">
                    <label>تويتر / X</label>
                    <input type="url" id="socialTwitter" value="${settings.socialLinks?.twitter || ''}" placeholder="https://twitter.com/..." />
                </div>
                <div class="form-group">
                    <label>يوتيوب</label>
                    <input type="url" id="socialYoutube" value="${settings.socialLinks?.youtube || ''}" placeholder="https://youtube.com/..." />
                </div>
                <div class="form-group">
                    <label>واتساب</label>
                    <input type="url" id="socialWhatsapp" value="${settings.socialLinks?.whatsapp || ''}" placeholder="https://wa.me/..." />
                </div>
            </div>
            
            <div class="setting-group">
                <h4>🔘 الأزرار والعبارات</h4>
                <div class="form-group">
                    <label>نص زر الشراء</label>
                    <input type="text" id="btnBuyText" value="${settings.buttonTexts?.buy || 'اشتر الآن'}" />
                </div>
                <div class="form-group">
                    <label>نص زر التخصيص</label>
                    <input type="text" id="btnCustomizeText" value="${settings.buttonTexts?.customize || 'صمم درعك'}" />
                </div>
                <div class="form-group">
                    <label>نص زر السلة</label>
                    <input type="text" id="btnCartText" value="${settings.buttonTexts?.cart || 'أضف للسلة'}" />
                </div>
                <div class="form-group">
                    <label>نص زر الدفع</label>
                    <input type="text" id="btnCheckoutText" value="${settings.buttonTexts?.checkout || 'إتمام الشراء'}" />
                </div>
            </div>
            
            <div class="setting-group" style="grid-column: 1 / -1;">
                <h4>📋 نص التذييل</h4>
                <div class="form-group">
                    <label>نص حقوق النشر</label>
                    <input type="text" id="footerCopyright" value="${settings.footer?.copyright || 'جميع الحقوق محفوظة'}" />
                </div>
                <div class="form-group">
                    <label>نص إضافي في التذييل</label>
                    <textarea id="footerText" rows="2">${settings.footer?.text || ''}</textarea>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('storeLogoFile')?.addEventListener('change', function(e) {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                document.getElementById('storeLogoPreview').innerHTML = 
                    `<img src="${ev.target.result}" style="max-width:150px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" />`;
                document.getElementById('storeLogoUrl').value = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

function saveAllStoreSettings() {
    const settings = {
        storeName: document.getElementById('storeName')?.value || 'Tithkari',
        storeDescription: document.getElementById('storeDescription')?.value || '',
        logo: document.getElementById('storeLogoUrl')?.value || '',
        primaryColor: document.getElementById('primaryColor')?.value || '#FFD700',
        secondaryColor: document.getElementById('secondaryColor')?.value || '#8B0000',
        bgColor: document.getElementById('bgColor')?.value || '#0F0F1A',
        fontFamily: document.getElementById('fontFamily')?.value || 'Cairo',
        fontSize: parseInt(document.getElementById('fontSize')?.value) || 16,
        socialLinks: {
            facebook: document.getElementById('socialFacebook')?.value || '',
            instagram: document.getElementById('socialInstagram')?.value || '',
            twitter: document.getElementById('socialTwitter')?.value || '',
            youtube: document.getElementById('socialYoutube')?.value || '',
            whatsapp: document.getElementById('socialWhatsapp')?.value || ''
        },
        buttonTexts: {
            buy: document.getElementById('btnBuyText')?.value || 'اشتر الآن',
            customize: document.getElementById('btnCustomizeText')?.value || 'صمم درعك',
            cart: document.getElementById('btnCartText')?.value || 'أضف للسلة',
            checkout: document.getElementById('btnCheckoutText')?.value || 'إتمام الشراء'
        },
        footer: {
            copyright: document.getElementById('footerCopyright')?.value || 'جميع الحقوق محفوظة',
            text: document.getElementById('footerText')?.value || ''
        }
    };
    
    saveStoreSettingsLocal(settings);
    applyStoreSettings(settings);
    showToast('✅ تم حفظ جميع إعدادات المتجر بنجاح!', 'success');
}
window.saveAllStoreSettings = saveAllStoreSettings;

// ============================================
// ===== [جديد] إدارة الكوبونات =====
// ============================================

async function loadCoupons() {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('couponsTableBody');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#8A8A9B;">🎫 لا توجد كوبونات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map((coupon, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><strong style="color:#ffd700;">${coupon.code}</strong></td>
                <td>${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} د.ل`}</td>
                <td>${coupon.discount_type === 'percentage' ? 'نسبة مئوية' : 'قيمة ثابتة'}</td>
                <td>${coupon.min_order_amount ? `${coupon.min_order_amount} د.ل` : '-'}</td>
                <td>${coupon.used_count || 0} / ${coupon.max_uses || '∞'}</td>
                <td>
                    <span class="status-badge status-${coupon.status || 'active'}">
                        ${coupon.status === 'active' ? '✅ نشط' : coupon.status === 'expired' ? '⏰ منتهي' : '❌ غير نشط'}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editCoupon('${coupon.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteCoupon('${coupon.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Coupons loaded:', data.length);
    } catch (error) {
        console.error('❌ Coupons error:', error);
    }
}
window.loadCoupons = loadCoupons;

function openCouponForm(couponData = null) {
    const modal = document.getElementById('couponModal');
    const title = document.getElementById('couponFormTitle');
    
    if (couponData) {
        title.textContent = '✏️ تعديل الكوبون';
        document.getElementById('couponId').value = couponData.id;
        document.getElementById('couponCode').value = couponData.code || '';
        document.getElementById('couponType').value = couponData.discount_type || 'percentage';
        document.getElementById('couponValue').value = couponData.discount_value || '';
        document.getElementById('couponMaxDiscount').value = couponData.max_discount || '';
        document.getElementById('couponMinOrder').value = couponData.min_order_amount || '';
        document.getElementById('couponExpiryDate').value = couponData.expiry_date || '';
        document.getElementById('couponMaxUses').value = couponData.max_uses || '';
        document.getElementById('couponStatus').value = couponData.status || 'active';
    } else {
        title.textContent = '➕ إضافة كوبون جديد';
        document.getElementById('couponForm').reset();
        document.getElementById('couponId').value = '';
        document.getElementById('couponType').value = 'percentage';
        document.getElementById('couponStatus').value = 'active';
    }
    
    toggleCouponFields();
    modal.classList.add('active');
}
window.openCouponForm = openCouponForm;

function closeCouponForm() {
    document.getElementById('couponModal').classList.remove('active');
}
window.closeCouponForm = closeCouponForm;

function toggleCouponFields() {
    const type = document.getElementById('couponType')?.value;
    const group = document.getElementById('maxDiscountGroup');
    if (group) {
        group.style.display = type === 'percentage' ? 'block' : 'none';
    }
}
window.toggleCouponFields = toggleCouponFields;

document.getElementById('couponForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('couponId').value;
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const discount_type = document.getElementById('couponType').value;
    const discount_value = parseFloat(document.getElementById('couponValue').value);
    const max_discount = document.getElementById('couponMaxDiscount').value ? parseFloat(document.getElementById('couponMaxDiscount').value) : null;
    const min_order_amount = document.getElementById('couponMinOrder').value ? parseFloat(document.getElementById('couponMinOrder').value) : null;
    const expiry_date = document.getElementById('couponExpiryDate').value || null;
    const max_uses = document.getElementById('couponMaxUses').value ? parseInt(document.getElementById('couponMaxUses').value) : null;
    const status = document.getElementById('couponStatus').value;
    
    if (!code || !discount_value || discount_value <= 0) {
        showToast('⚠️ الرجاء إدخال كود وقيمة صحيحة', 'warning');
        return;
    }
    
    const data = {
        code,
        discount_type,
        discount_value,
        max_discount,
        min_order_amount,
        expiry_date,
        max_uses,
        status,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('coupons')
                .update(data)
                .eq('id', id);
        } else {
            data.created_at = new Date().toISOString();
            data.used_count = 0;
            result = await supabase
                .from('coupons')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث الكوبون' : '✅ تم إضافة الكوبون', 'success');
        closeCouponForm();
        loadCoupons();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
});

window.editCoupon = async function(id) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        openCouponForm(data);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.deleteCoupon = async function(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الكوبون؟')) return;
    
    try {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف الكوبون', 'success');
        loadCoupons();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

// ============================================
// ===== [جديد] إدارة التقييمات =====
// ============================================

async function loadReviews() {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('reviewsTableBody');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#8A8A9B;">⭐ لا توجد تقييمات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map((review, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${review.customer_name || 'زائر'}</td>
                <td>${'⭐'.repeat(Math.round(review.rating || 0))}</td>
                <td>${review.comment ? review.comment.substring(0, 50) + (review.comment.length > 50 ? '...' : '') : '-'}</td>
                <td>
                    <span class="status-badge status-${review.status || 'pending'}">
                        ${review.status === 'approved' ? '✅ مقبول' : review.status === 'rejected' ? '❌ مرفوض' : '⏳ قيد المراجعة'}
                    </span>
                </td>
                <td>${new Date(review.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    <button class="btn-edit" onclick="editReview('${review.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteReview('${review.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Reviews loaded:', data.length);
    } catch (error) {
        console.error('❌ Reviews error:', error);
    }
}
window.loadReviews = loadReviews;

function openReviewForm(reviewData = null) {
    const modal = document.getElementById('reviewModal');
    const title = document.getElementById('reviewFormTitle');
    
    if (reviewData) {
        title.textContent = '✏️ تعديل التقييم';
        document.getElementById('reviewId').value = reviewData.id;
        document.getElementById('reviewRating').value = reviewData.rating || 5;
        document.getElementById('reviewComment').value = reviewData.comment || '';
        document.getElementById('reviewStatus').value = reviewData.status || 'pending';
    } else {
        title.textContent = '✏️ تعديل التقييم';
        document.getElementById('reviewForm').reset();
        document.getElementById('reviewId').value = '';
        document.getElementById('reviewRating').value = 5;
        document.getElementById('reviewStatus').value = 'pending';
    }
    
    modal.classList.add('active');
}
window.openReviewForm = openReviewForm;

function closeReviewForm() {
    document.getElementById('reviewModal').classList.remove('active');
}
window.closeReviewForm = closeReviewForm;

document.getElementById('reviewForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('reviewId').value;
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value.trim();
    const status = document.getElementById('reviewStatus').value;
    
    const data = {
        rating,
        comment: comment || null,
        status,
        updated_at: new Date().toISOString()
    };
    
    try {
        const { error } = await supabase
            .from('reviews')
            .update(data)
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم تحديث التقييم', 'success');
        closeReviewForm();
        loadReviews();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
});

window.editReview = async function(id) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        openReviewForm(data);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

window.deleteReview = async function(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا التقييم؟')) return;
    
    try {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم حذف التقييم', 'success');
        loadReviews();
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
};

// ============================================
// ===== [جديد] إعدادات الدفع =====
// ============================================

async function loadPaymentSettings() {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .in('key', ['payment_settings']);
        
        if (error) throw error;
        
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });
        
        const paymentSettings = settings.payment_settings || {};
        
        document.getElementById('stripePublishableKey').value = paymentSettings.stripe?.publishableKey || '';
        document.getElementById('stripeSecretKey').value = paymentSettings.stripe?.secretKey || '';
        document.getElementById('stripeEnabled').checked = paymentSettings.stripe?.enabled !== false;
        
        document.getElementById('paypalClientId').value = paymentSettings.paypal?.clientId || '';
        document.getElementById('paypalSecretKey').value = paymentSettings.paypal?.secretKey || '';
        document.getElementById('paypalEnabled').checked = paymentSettings.paypal?.enabled !== false;
        
        document.getElementById('codEnabled').checked = paymentSettings.cod?.enabled !== false;
        
        document.getElementById('bankTransferEnabled').checked = paymentSettings.bankTransfer?.enabled !== false;
        document.getElementById('bankName').value = paymentSettings.bankTransfer?.bankName || '';
        document.getElementById('bankAccountNumber').value = paymentSettings.bankTransfer?.accountNumber || '';
        document.getElementById('bankIban').value = paymentSettings.bankTransfer?.iban || '';
        document.getElementById('bankBeneficiary').value = paymentSettings.bankTransfer?.beneficiary || '';
        
        console.log('✅ Payment settings loaded');
    } catch (error) {
        console.error('❌ Payment settings error:', error);
    }
}
window.loadPaymentSettings = loadPaymentSettings;

async function savePaymentSettings() {
    const paymentSettings = {
        stripe: {
            publishableKey: document.getElementById('stripePublishableKey').value.trim(),
            secretKey: document.getElementById('stripeSecretKey').value.trim(),
            enabled: document.getElementById('stripeEnabled').checked
        },
        paypal: {
            clientId: document.getElementById('paypalClientId').value.trim(),
            secretKey: document.getElementById('paypalSecretKey').value.trim(),
            enabled: document.getElementById('paypalEnabled').checked
        },
        cod: {
            enabled: document.getElementById('codEnabled').checked
        },
        bankTransfer: {
            enabled: document.getElementById('bankTransferEnabled').checked,
            bankName: document.getElementById('bankName').value.trim(),
            accountNumber: document.getElementById('bankAccountNumber').value.trim(),
            iban: document.getElementById('bankIban').value.trim(),
            beneficiary: document.getElementById('bankBeneficiary').value.trim()
        }
    };
    
    const success = await saveStoreSettings('payment_settings', paymentSettings);
    
    if (success) {
        showToast('✅ تم حفظ إعدادات الدفع بنجاح!', 'success');
    }
}
window.savePaymentSettings = savePaymentSettings;

// ============================================
// ===== [جديد] إعدادات البريد =====
// ============================================

async function loadEmailSettings() {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .in('key', ['email_settings']);
        
        if (error) throw error;
        
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });
        
        const emailSettings = settings.email_settings || {};
        
        document.getElementById('sendgridApiKey').value = emailSettings.sendgrid?.apiKey || '';
        document.getElementById('sendgridFromEmail').value = emailSettings.sendgrid?.fromEmail || '';
        document.getElementById('sendgridFromName').value = emailSettings.sendgrid?.fromName || '';
        document.getElementById('sendgridEnabled').checked = emailSettings.sendgrid?.enabled !== false;
        
        document.getElementById('adminEmail').value = emailSettings.adminEmail || '';
        document.getElementById('emailSubjectPrefix').value = emailSettings.subjectPrefix || '';
        
        console.log('✅ Email settings loaded');
    } catch (error) {
        console.error('❌ Email settings error:', error);
    }
}
window.loadEmailSettings = loadEmailSettings;

async function saveEmailSettings() {
    const emailSettings = {
        sendgrid: {
            apiKey: document.getElementById('sendgridApiKey').value.trim(),
            fromEmail: document.getElementById('sendgridFromEmail').value.trim(),
            fromName: document.getElementById('sendgridFromName').value.trim(),
            enabled: document.getElementById('sendgridEnabled').checked
        },
        adminEmail: document.getElementById('adminEmail').value.trim(),
        subjectPrefix: document.getElementById('emailSubjectPrefix').value.trim()
    };
    
    const success = await saveStoreSettings('email_settings', emailSettings);
    
    if (success) {
        showToast('✅ تم حفظ إعدادات البريد بنجاح!', 'success');
    }
}
window.saveEmailSettings = saveEmailSettings;

async function sendTestEmail() {
    const email = document.getElementById('testEmailInput').value.trim();
    if (!email) {
        showToast('⚠️ الرجاء إدخال بريد إلكتروني', 'warning');
        return;
    }
    
    if (!email.includes('@')) {
        showToast('⚠️ الرجاء إدخال بريد إلكتروني صحيح', 'warning');
        return;
    }
    
    showToast('📧 جاري إرسال البريد التجريبي...', 'info');
    
    try {
        const { data: emailSettingsData } = await supabase
            .from('store_settings')
            .select('value')
            .eq('key', 'email_settings')
            .single();
        
        const emailSettings = emailSettingsData?.value || {};
        const sendgrid = emailSettings.sendgrid || {};
        
        if (!sendgrid.apiKey) {
            showToast('⚠️ الرجاء إدخال مفتاح SendGrid أولاً', 'warning');
            return;
        }
        
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgrid.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: email }] }],
                from: { email: sendgrid.fromEmail || 'info@tithkari.com', name: sendgrid.fromName || 'Tithkari' },
                subject: '📧 بريد تجريبي من Tithkari',
                content: [{ type: 'text/html', value: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
                        <div style="text-align: center; padding: 20px; background: #1a1a2e; border-radius: 10px 10px 0 0;">
                            <h1 style="color: #e6b31e; margin: 0;">🛡️ Tithkari</h1>
                            <p style="color: #fff;">متجر الدروع الفاخرة</p>
                        </div>
                        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #1a1a2e;">✅ بريد تجريبي ناجح!</h2>
                            <p>تم إرسال هذا البريد بنجاح من نظام Tithkari.</p>
                            <p style="color: #666;">تم الإرسال في: ${new Date().toLocaleString('ar-SA')}</p>
                            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0;"><strong>📧 إعدادات البريد تعمل بشكل صحيح</strong></p>
                            </div>
                            <p style="color: #666; font-size: 14px;">هذا بريد تجريبي من لوحة تحكم Tithkari</p>
                        </div>
                    </div>
                `}]
            })
        });
        
        if (!response.ok) {
            throw new Error(`SendGrid error: ${response.status}`);
        }
        
        showToast('✅ تم إرسال البريد التجريبي بنجاح!', 'success');
    } catch (error) {
        console.error('❌ خطأ في إرسال البريد التجريبي:', error);
        showToast('❌ فشل إرسال البريد: ' + error.message, 'error');
    }
}
window.sendTestEmail = sendTestEmail;

// ============================================
// ===== محرر الأكواد =====
// ============================================

const availableFiles = [
    { id: 'app.js', name: 'app.js', icon: '📄', path: '../app.js' },
    { id: 'index.html', name: 'index.html', icon: '🌐', path: '../index.html' },
    { id: 'design-studio.js', name: 'design-studio.js', icon: '🎨', path: '../design-studio.js' },
    { id: 'design-studio.html', name: 'design-studio.html', icon: '🖌️', path: '../design-studio.html' },
    { id: 'style.css', name: 'style.css', icon: '🎨', path: '../style.css' },
    { id: 'admin.js', name: 'admin.js (الإدارة)', icon: '⚙️', path: 'admin.js' },
    { id: 'admin.css', name: 'admin.css (الإدارة)', icon: '🎨', path: '../css/admin.css' },
    { id: 'login.html', name: 'login.html', icon: '🔐', path: '../login.html' }
];

const editLocations = {
    'app.js': {
        locations: [
            { id: 'renderProducts', description: 'دالة عرض المنتجات' },
            { id: 'loadProducts', description: 'دالة تحميل المنتجات' },
            { id: 'addToCart', description: 'دالة الإضافة للسلة' },
            { id: 'handleCheckout', description: 'دالة الدفع' },
            { id: 'searchProducts', description: 'دالة البحث' },
            { id: 'applyCoupon', description: 'دالة الكوبونات' },
            { id: 'openDesignStudio', description: 'دالة فتح المصمم' }
        ]
    },
    'design-studio.js': {
        locations: [
            { id: 'addTextLayer', description: 'دالة إضافة نص' },
            { id: 'addImageLayer', description: 'دالة إضافة صورة' },
            { id: 'exportDesign', description: 'دالة تصدير التصميم' },
            { id: 'addDesignToCart', description: 'دالة إضافة التصميم للسلة' },
            { id: 'loadProductData', description: 'دالة تحميل بيانات المنتج' }
        ]
    },
    'index.html': {
        locations: [
            { id: 'hero-section', description: 'قسم البانر الرئيسي' },
            { id: 'products-grid', description: 'شبكة المنتجات' },
            { id: 'header-menu', description: 'القائمة العلوية' },
            { id: 'footer-links', description: 'روابط التذييل' }
        ]
    },
    'design-studio.html': {
        locations: [
            { id: 'preview-area', description: 'منطقة المعاينة' },
            { id: 'sidebar-controls', description: 'أدوات التحكم الجانبية' },
            { id: 'canvas-frame', description: 'إطار القماش' }
        ]
    },
    'style.css': {
        locations: [
            { id: 'colors', description: 'الألوان العامة' },
            { id: 'buttons', description: 'تنسيقات الأزرار' },
            { id: 'product-card', description: 'بطاقات المنتجات' },
            { id: 'responsive', description: 'التحسينات المتجاوبة' }
        ]
    },
    'admin.js': {
        locations: [
            { id: 'loadStats', description: 'تحميل الإحصائيات' },
            { id: 'loadProducts', description: 'تحميل المنتجات' },
            { id: 'loadOrders', description: 'تحميل الطلبات' },
            { id: 'switchTab', description: 'دالة التبديل بين التبويبات' }
        ]
    },
    'admin.css': {
        locations: [
            { id: 'sidebar', description: 'تنسيق القائمة الجانبية' },
            { id: 'tables', description: 'تنسيق الجداول' },
            { id: 'buttons', description: 'تنسيقات الأزرار' },
            { id: 'modals', description: 'تنسيق النوافذ المنبثقة' }
        ]
    },
    'login.html': {
        locations: [
            { id: 'login-form', description: 'نموذج تسجيل الدخول' },
            { id: 'login-style', description: 'تنسيقات صفحة الدخول' },
            { id: 'login-script', description: 'كود تسجيل الدخول' }
        ]
    }
};

let savedEdits = JSON.parse(localStorage.getItem('tithkari_code_edits') || '{}');
let currentSelectedFile = null;

function loadFileList() {
    const container = document.getElementById('fileList');
    if (!container) return;
    
    container.innerHTML = availableFiles.map(file => `
        <div class="file-item ${currentSelectedFile === file.id ? 'active' : ''}" 
             onclick="selectFile('${file.id}')">
            <i class="${file.icon}"></i>
            ${file.name}
        </div>
    `).join('');
}

function selectFile(fileId) {
    currentSelectedFile = fileId;
    loadFileList();
    
    const file = availableFiles.find(f => f.id === fileId);
    document.getElementById('currentFileDisplay').textContent = `📄 ${file.name}`;
    
    const locations = editLocations[fileId]?.locations || [];
    const locationInput = document.getElementById('editLocation');
    locationInput.placeholder = locations.length > 0 ? 'اختر موقع تعديل...' : 'لا توجد مواقع محددة';
    
    const datalistId = 'editLocationsList';
    let datalist = document.getElementById(datalistId);
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = datalistId;
        locationInput.setAttribute('list', datalistId);
        locationInput.parentNode.appendChild(datalist);
    }
    
    datalist.innerHTML = locations.map(loc => `
        <option value="${loc.id}">${loc.id} - ${loc.description}</option>
    `).join('');
    
    const savedEdit = savedEdits[fileId];
    if (savedEdit) {
        document.getElementById('editLocation').value = savedEdit.location || '';
        document.getElementById('codeEditor').value = savedEdit.code || '';
        document.getElementById('originalCodeDisplay').value = savedEdit.original || '// لم يتم حفظ النسخة الأصلية';
        document.getElementById('editStatus').textContent = '✅ تم حفظ تعديلات سابقة';
        document.getElementById('editStatus').style.color = '#4CAF50';
    } else {
        document.getElementById('editLocation').value = '';
        document.getElementById('codeEditor').value = '';
        document.getElementById('originalCodeDisplay').value = '// لا توجد تعديلات محفوظة لهذا الملف';
        document.getElementById('editStatus').textContent = '';
    }
    
    showEditLocations(fileId);
}

function showEditLocations(fileId) {
    const container = document.getElementById('editLocationsHint');
    if (!container) return;
    
    const locations = editLocations[fileId]?.locations || [];
    if (locations.length === 0) {
        container.innerHTML = `
            <h4>📌 مواقع التعديل المتاحة</h4>
            <p style="color: var(--gray); font-size: 13px;">لا توجد مواقع محددة لهذا الملف</p>
        `;
        return;
    }
    
    container.innerHTML = `
        <h4>📌 مواقع التعديل المتاحة</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
            ${locations.map(loc => `
                <span class="location-tag" onclick="document.getElementById('editLocation').value = '${loc.id}'; document.getElementById('editLocation').focus();">
                    ${loc.id}
                </span>
            `).join('')}
        </div>
        <p style="color: var(--gray); font-size: 12px; margin-top: 5px;">👆 انقر على أي موقع لاستخدامه</p>
    `;
}

function saveCodeChanges() {
    if (!currentSelectedFile) {
        showToast('⚠️ الرجاء اختيار ملف أولاً', 'warning');
        return;
    }
    
    const location = document.getElementById('editLocation').value.trim();
    const code = document.getElementById('codeEditor').value;
    const original = document.getElementById('originalCodeDisplay').value;
    
    if (!location) {
        showToast('⚠️ الرجاء تحديد موقع التعديل', 'warning');
        return;
    }
    
    if (!code) {
        showToast('⚠️ الرجاء كتابة الكود الجديد', 'warning');
        return;
    }
    
    savedEdits[currentSelectedFile] = {
        location: location,
        code: code,
        original: original || '// لا توجد نسخة أصلية محفوظة',
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('tithkari_code_edits', JSON.stringify(savedEdits));
    
    document.getElementById('editStatus').textContent = '✅ تم حفظ التعديلات';
    document.getElementById('editStatus').style.color = '#4CAF50';
    
    showToast('✅ تم حفظ التعديلات وتطبيقها بنجاح!', 'success');
}
window.saveCodeChanges = saveCodeChanges;

function previewChanges() {
    if (!currentSelectedFile) {
        showToast('⚠️ الرجاء اختيار ملف أولاً', 'warning');
        return;
    }
    
    const code = document.getElementById('codeEditor').value;
    if (!code) {
        showToast('⚠️ لا يوجد كود للمعاينة', 'warning');
        return;
    }
    
    const location = document.getElementById('editLocation').value || 'غير محدد';
    const file = availableFiles.find(f => f.id === currentSelectedFile);
    
    const previewWindow = window.open('', '_blank', 'width=900,height=650');
    previewWindow.document.write(`
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>معاينة الكود - Tithkari</title>
            <style>
                body { background: #0a0a14; color: #e2e8f0; font-family: 'Courier New', monospace; padding: 20px; direction: rtl; }
                .preview-header { background: #1a1a2e; padding: 15px; border-radius: 8px; border: 1px solid #d4af37; margin-bottom: 20px; }
                .preview-header h2 { color: #d4af37; margin: 0; }
                .preview-header p { color: #8a8a9b; margin: 5px 0 0; }
                .code-block { background: #0f0f1a; padding: 15px; border-radius: 8px; border: 1px solid #1e1e2e; white-space: pre-wrap; font-size: 13px; line-height: 1.8; max-height: 70vh; overflow: auto; }
                .badge { display: inline-block; background: #d4af37; color: #0a0a14; padding: 2px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; }
                .file-badge { background: #3b82f6; color: white; }
            </style>
        </head>
        <body>
            <div class="preview-header">
                <h2>📄 معاينة الكود - ${file?.name || currentSelectedFile}</h2>
                <p>📍 موقع التعديل: <span class="badge">${location}</span> &nbsp;|&nbsp; 📂 الملف: <span class="badge file-badge">${file?.name || currentSelectedFile}</span></p>
            </div>
            <div class="code-block">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <p style="color: #8a8a9b; margin-top: 15px; font-size: 12px;">⚠️ هذه معاينة للكود فقط، التغييرات لا تؤثر على الموقع الفعلي حتى يتم حفظها.</p>
            <button onclick="window.close()" style="background: #d4af37; color: #0a0a14; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; margin-top: 10px;">إغلاق</button>
        </body>
        </html>
    `);
    previewWindow.document.close();
}
window.previewChanges = previewChanges;

function resetToOriginal() {
    if (!currentSelectedFile) {
        showToast('⚠️ الرجاء اختيار ملف أولاً', 'warning');
        return;
    }
    
    if (!confirm('⚠️ هل أنت متأكد من استعادة النسخة الأصلية؟ سيتم حذف جميع التعديلات لهذا الملف.')) return;
    
    delete savedEdits[currentSelectedFile];
    localStorage.setItem('tithkari_code_edits', JSON.stringify(savedEdits));
    
    document.getElementById('editLocation').value = '';
    document.getElementById('codeEditor').value = '';
    document.getElementById('originalCodeDisplay').value = '// تم استعادة النسخة الأصلية';
    document.getElementById('editStatus').textContent = '🔄 تم استعادة النسخة الأصلية';
    document.getElementById('editStatus').style.color = '#F44336';
    
    showToast('✅ تم استعادة النسخة الأصلية', 'success');
}
window.resetToOriginal = resetToOriginal;

function initCodeEditor() {
    loadFileList();
    document.getElementById('editStatus').textContent = '';
    document.getElementById('currentFileDisplay').textContent = '📄 اختر ملفاً للتعديل';
    if (currentSelectedFile) {
        selectFile(currentSelectedFile);
    }
}
window.initCodeEditor = initCodeEditor;

// ============================================
// 🛠️ [مُصلح بالكامل] نموذج إضافة المنتج
// ============================================
function initAddProductForm() {
    const form = document.getElementById('addProductForm');
    if (!form) {
        console.warn('⚠️ addProductForm not found');
        return;
    }
    
    console.log('✅ initAddProductForm called');
    
    const productImageFile = document.getElementById('productImageFile');
    if (productImageFile) {
        productImageFile.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const preview = document.getElementById('imagePreview');
                    if (preview) {
                        preview.innerHTML = 
                            '<img src="' + ev.target.result + '" style="max-width:200px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" />' +
                            '<p style="font-size:11px;color:#4CAF50;margin-top:4px;">✅ تم تحميل الصورة</p>';
                    }
                    const urlInput = document.getElementById('productImage');
                    if (urlInput) {
                        urlInput.value = ev.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('input', function() {
            const url = this.value.trim();
            const preview = document.getElementById('imagePreview');
            if (preview && url && (url.startsWith('http') || url.startsWith('data:image'))) {
                preview.innerHTML = 
                    '<img src="' + url + '" style="max-width:200px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<p style=\\\'color:#ef4444;font-size:12px;\\\'>⚠️ رابط غير صالح</p>\'" />' +
                    '<p style="font-size:11px;color:#3b82f6;margin-top:4px;">📎 رابط مباشر</p>';
            }
        });
    }
    
    const templateImageFile = document.getElementById('templateImageFile');
    if (templateImageFile) {
        templateImageFile.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const preview = document.getElementById('templatePreview');
                    if (preview) {
                        preview.innerHTML = 
                            '<img src="' + ev.target.result + '" style="max-width:200px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" />' +
                            '<p style="font-size:11px;color:#4CAF50;margin-top:4px;">✅ تم تحميل قالب التصميم</p>';
                    }
                    const urlInput = document.getElementById('templateImageUrl');
                    if (urlInput) {
                        urlInput.value = ev.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    const templateImageUrlInput = document.getElementById('templateImageUrl');
    if (templateImageUrlInput) {
        templateImageUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            const preview = document.getElementById('templatePreview');
            if (preview && url && (url.startsWith('http') || url.startsWith('data:image'))) {
                preview.innerHTML = 
                    '<img src="' + url + '" style="max-width:200px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<p style=\\\'color:#ef4444;font-size:12px;\\\'>⚠️ رابط غير صالح</p>\'" />' +
                    '<p style="font-size:11px;color:#3b82f6;margin-top:4px;">📎 رابط مباشر</p>';
            }
        });
    }
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', window.addProduct);
    console.log('✅ Add product form initialized');
}

// ============================================
// 🛠️ [مُصلح] دالة إضافة المنتج - معرفة عالمياً
// ============================================
window.addProduct = async function(event) {
    event.preventDefault();
    console.log('🔵 addProduct called');
    
    const btn = document.getElementById('addProductBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> جاري الإضافة...';
    }
    
    try {
        const nameInput = document.getElementById('productName');
        const descriptionInput = document.getElementById('productDescription');
        const categoryInput = document.getElementById('productCategory');
        const priceInput = document.getElementById('productPrice');
        const stockInput = document.getElementById('productStock');
        const imageUrlInput = document.getElementById('productImage');
        const templateUrlInput = document.getElementById('templateImageUrl');
        const imageFileInput = document.getElementById('productImageFile');
        const templateFileInput = document.getElementById('templateImageFile');
        
        if (!nameInput || !priceInput || !stockInput) {
            showToast('⚠️ بعض العناصر غير موجودة في الصفحة', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> إضافة منتج';
            }
            return;
        }
        
        const name = nameInput.value.trim();
        const description = descriptionInput ? descriptionInput.value.trim() : '';
        const category = categoryInput ? categoryInput.value : 'كلاسيكي';
        const price = parseFloat(priceInput.value);
        const stock = parseInt(stockInput.value);
        let image_url = imageUrlInput ? imageUrlInput.value.trim() : '';
        let template_image = templateUrlInput ? templateUrlInput.value.trim() : '';
        
        if (!name || !price || isNaN(stock)) {
            showToast('⚠️ الرجاء تعبئة جميع الحقول المطلوبة', 'warning');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> إضافة منتج';
            }
            return;
        }
        
        if (imageFileInput && imageFileInput.files[0]) {
            const uploaded = await uploadProductImage(imageFileInput.files[0]);
            if (uploaded) {
                image_url = uploaded;
            }
        } else if (!image_url) {
            image_url = getPlaceholderSVG('🛡️', 300, 300);
        }
        
        if (templateFileInput && templateFileInput.files[0]) {
            const uploaded = await uploadProductImage(templateFileInput.files[0]);
            if (uploaded) {
                template_image = uploaded;
            }
        }
        
        const { error } = await supabase
            .from('products')
            .insert({
                name,
                description,
                category,
                price,
                image_url,
                template_image: template_image || null,
                stock,
                status: 'active'
            });
        
        if (error) throw error;
        
        showToast('✅ تم إضافة المنتج بنجاح!', 'success');
        
        if (nameInput) nameInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (priceInput) priceInput.value = '';
        if (stockInput) stockInput.value = '';
        if (imageUrlInput) imageUrlInput.value = '';
        if (templateUrlInput) templateUrlInput.value = '';
        if (imageFileInput) imageFileInput.value = '';
        if (templateFileInput) templateFileInput.value = '';
        
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) imagePreview.innerHTML = '';
        
        const templatePreview = document.getElementById('templatePreview');
        if (templatePreview) templatePreview.innerHTML = '';
        
        loadProducts();
        loadStats();
        window.switchTab('products');
        
    } catch (error) {
        console.error('❌ Add product error:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> إضافة منتج';
    }
};

// ============================================
// ===== دوال الحقول المخصصة (Custom Fields) =====
// ============================================

async function loadProductsForFieldSelector() {
    console.log('🔵 loadProductsForFieldSelector called');
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, status')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const select = document.getElementById('fieldProductSelector');
        if (!select) {
            console.warn('⚠️ fieldProductSelector not found');
            return;
        }
        
        select.innerHTML = '<option value="">-- اختر منتج --</option>';
        
        if (data && data.length > 0) {
            data.forEach(product => {
                select.innerHTML += `<option value="${product.id}">${product.name} ${product.status === 'active' ? '✅' : '❌'}</option>`;
            });
            console.log('✅ تم تحميل المنتجات لقائمة الاختيار:', data.length);
        } else {
            console.log('⚠️ لا توجد منتجات للعرض');
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
        showToast('❌ حدث خطأ في تحميل المنتجات', 'error');
    }
}
window.loadProductsForFieldSelector = loadProductsForFieldSelector;

async function loadProductFields() {
    const productId = document.getElementById('fieldProductSelector')?.value;
    const tbody = document.getElementById('fieldsTableBody');
    
    if (!tbody) {
        console.warn('⚠️ fieldsTableBody not found');
        return;
    }
    
    if (!productId) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);">اختر منتجاً لعرض حقوله المخصصة</td></tr>';
        return;
    }
    
    console.log('🔵 loadProductFields called for product:', productId);
    
    try {
        const { data, error } = await supabase
            .from('product_custom_fields')
            .select('*')
            .eq('product_id', productId)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);">لا توجد حقول مخصصة لهذا المنتج</td></tr>';
            return;
        }
        
        const typeLabels = {
            text: '📝 نص قصير',
            textarea: '📄 نص طويل',
            select: '📋 قائمة منسدلة',
            file: '📎 رفع ملف',
            color: '🎨 اختيار لون',
            date: '📅 تاريخ'
        };
        
        tbody.innerHTML = data.map((field, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${field.field_name}</strong></td>
                <td>${typeLabels[field.field_type] || field.field_type}</td>
                <td>${field.is_required ? '🔴 مطلوب' : '⚪ اختياري'}</td>
                <td>${field.display_order || 0}</td>
                <td>
                    <span class="status-badge ${field.is_active ? 'status-active' : 'status-inactive'}">
                        ${field.is_active ? '✅ نشط' : '❌ غير نشط'}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editCustomField('${field.id}')" style="padding:4px 10px;border-radius:4px;background:#3b82f6;color:white;border:none;cursor:pointer;font-size:11px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteCustomField('${field.id}')" style="padding:4px 10px;border-radius:4px;background:#ef4444;color:white;border:none;cursor:pointer;font-size:11px;">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-toggle" onclick="toggleCustomField('${field.id}', ${field.is_active})" style="padding:4px 10px;border-radius:4px;background:${field.is_active ? '#f59e0b' : '#10b981'};color:white;border:none;cursor:pointer;font-size:11px;">
                        ${field.is_active ? 'إلغاء' : 'تفعيل'}
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ تم تحميل الحقول:', data.length);
    } catch (error) {
        console.error('❌ خطأ في تحميل الحقول:', error);
        showToast('❌ حدث خطأ في تحميل الحقول', 'error');
    }
}
window.loadProductFields = loadProductFields;

function openCustomFieldForm(fieldData = null) {
    console.log('🔵 openCustomFieldForm called');
    const modal = document.getElementById('customFieldModal');
    const title = document.getElementById('customFieldFormTitle');
    
    if (!modal) {
        console.warn('⚠️ customFieldModal not found');
        showToast('⚠️ النافذة غير موجودة', 'error');
        return;
    }
    
    const productId = document.getElementById('fieldProductSelector')?.value;
    if (!productId) {
        showToast('⚠️ الرجاء اختيار منتج أولاً', 'warning');
        return;
    }
    
    if (fieldData) {
        title.textContent = '✏️ تعديل حقل مخصص';
        document.getElementById('customFieldId').value = fieldData.id;
        document.getElementById('customFieldProductId').value = fieldData.product_id;
        document.getElementById('customFieldName').value = fieldData.field_name || '';
        document.getElementById('customFieldType').value = fieldData.field_type || 'text';
        document.getElementById('customFieldOptions').value = fieldData.options || '';
        document.getElementById('customFieldHelp').value = fieldData.help_text || '';
        document.getElementById('customFieldPlaceholder').value = fieldData.placeholder || '';
        document.getElementById('customFieldRequired').checked = fieldData.is_required || false;
        document.getElementById('customFieldActive').checked = fieldData.is_active !== false;
        document.getElementById('customFieldOrder').value = fieldData.display_order || 0;
        
        const optionsGroup = document.getElementById('fieldOptionsGroup');
        if (optionsGroup) {
            optionsGroup.style.display = fieldData.field_type === 'select' ? 'block' : 'none';
        }
    } else {
        title.textContent = '➕ إضافة حقل مخصص';
        document.getElementById('customFieldForm').reset();
        document.getElementById('customFieldId').value = '';
        document.getElementById('customFieldProductId').value = productId;
        document.getElementById('customFieldType').value = 'text';
        document.getElementById('customFieldRequired').checked = true;
        document.getElementById('customFieldActive').checked = true;
        document.getElementById('customFieldOrder').value = 0;
        const optionsGroup = document.getElementById('fieldOptionsGroup');
        if (optionsGroup) {
            optionsGroup.style.display = 'none';
        }
    }
    
    modal.classList.add('active');
    console.log('✅ customFieldModal opened');
}
window.openCustomFieldForm = openCustomFieldForm;

function closeCustomFieldForm() {
    const modal = document.getElementById('customFieldModal');
    if (modal) {
        modal.classList.remove('active');
    }
}
window.closeCustomFieldForm = closeCustomFieldForm;

async function saveCustomField(event) {
    event.preventDefault();
    console.log('🔵 saveCustomField called');
    
    const id = document.getElementById('customFieldId').value;
    const product_id = document.getElementById('customFieldProductId').value;
    const field_name = document.getElementById('customFieldName').value.trim();
    const field_type = document.getElementById('customFieldType').value;
    const options = document.getElementById('customFieldOptions').value.trim();
    const help_text = document.getElementById('customFieldHelp').value.trim();
    const placeholder = document.getElementById('customFieldPlaceholder').value.trim();
    const is_required = document.getElementById('customFieldRequired').checked;
    const is_active = document.getElementById('customFieldActive').checked;
    const display_order = parseInt(document.getElementById('customFieldOrder').value) || 0;
    
    if (!field_name) {
        showToast('⚠️ الرجاء إدخال اسم الحقل', 'warning');
        return;
    }
    
    if (!product_id) {
        showToast('⚠️ الرجاء اختيار منتج', 'warning');
        return;
    }
    
    const data = {
        product_id,
        field_name,
        field_type,
        display_order,
        help_text: help_text || null,
        placeholder: placeholder || null,
        is_required,
        is_active,
        options: field_type === 'select' ? (options || null) : null,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('product_custom_fields')
                .update(data)
                .eq('id', id);
        } else {
            data.created_at = new Date().toISOString();
            result = await supabase
                .from('product_custom_fields')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث الحقل' : '✅ تم إضافة الحقل', 'success');
        closeCustomFieldForm();
        loadProductFields();
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الحقل:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.saveCustomField = saveCustomField;

async function editCustomField(fieldId) {
    try {
        const { data, error } = await supabase
            .from('product_custom_fields')
            .select('*')
            .eq('id', fieldId)
            .single();
        
        if (error) throw error;
        openCustomFieldForm(data);
    } catch (error) {
        console.error('❌ خطأ في تحميل الحقل:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.editCustomField = editCustomField;

async function deleteCustomField(fieldId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الحقل؟')) return;
    
    try {
        const { error } = await supabase
            .from('product_custom_fields')
            .delete()
            .eq('id', fieldId);
        
        if (error) throw error;
        
        showToast('✅ تم حذف الحقل', 'success');
        loadProductFields();
    } catch (error) {
        console.error('❌ خطأ في حذف الحقل:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.deleteCustomField = deleteCustomField;

async function toggleCustomField(fieldId, currentStatus) {
    try {
        const { error } = await supabase
            .from('product_custom_fields')
            .update({ is_active: !currentStatus })
            .eq('id', fieldId);
        
        if (error) throw error;
        
        showToast('✅ تم تحديث حالة الحقل', 'success');
        loadProductFields();
    } catch (error) {
        console.error('❌ خطأ في تبديل الحالة:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.toggleCustomField = toggleCustomField;

// ============================================
// دوال مساعدة
// ============================================
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || '#10b981'};
        color: white;
        padding: 14px 30px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 99999;
        box-shadow: 0 4px 25px rgba(0,0,0,0.4);
        animation: slideUp 0.5s ease;
        font-size: 15px;
        font-family: 'Cairo', sans-serif;
        direction: rtl;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(30px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// ===== إدارة القوالب المخصصة =====
// ============================================

function loadCustomTemplates() {
    try {
        const templates = JSON.parse(localStorage.getItem('tithkari_design_templates') || '[]');
        const customProducts = JSON.parse(localStorage.getItem('tithkari_custom_products') || '[]');
        return { templates, customProducts };
    } catch {
        return { templates: [], customProducts: [] };
    }
}

function renderCustomTemplates() {
    const grid = document.getElementById('customTemplatesGrid');
    if (!grid) return;
    
    const templates = JSON.parse(localStorage.getItem('tithkari_design_templates') || '[]');
    const customTemplates = templates.filter(t => t.isCustom === true);
    
    if (customTemplates.length === 0) {
        grid.innerHTML = '<p style="color:var(--gray);grid-column:1/-1;text-align:center;">لا توجد قوالب مخصصة</p>';
        return;
    }
    
    const placeholder = getPlaceholderSVG('🛡️', 200, 150);
    
    grid.innerHTML = customTemplates.map(t => `
        <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:15px;border:1px solid rgba(255,215,0,0.08);">
            <img src="${t.baseImage || t.image || placeholder}" style="width:100%;height:150px;object-fit:contain;border-radius:8px;background:#0a0a12;" 
                 onerror="this.src='${placeholder}'" />
            <h4 style="color:#f5f0eb;margin:8px 0 4px;font-size:14px;">${t.name}</h4>
            <p style="color:#8a8a9b;font-size:11px;margin:0;">
                ${t.linkedProductName ? '🔗 ' + t.linkedProductName : 'غير مرتبط'}
                ${t.version ? ' | v' + t.version : ''}
            </p>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                <button onclick="editCustomTemplate('${t.id}')" style="background:#8B5CF6;color:white;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button onclick="deleteCustomTemplate('${t.id}')" style="background:rgba(239,68,68,0.2);color:#ef4444;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="injectTemplateToStore('${t.id}')" style="background:#10b981;color:white;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;">
                    <i class="fas fa-upload"></i> حقن
                </button>
            </div>
        </div>
    `).join('');
}

function editCustomTemplate(templateId) {
    localStorage.setItem('tithkari_edit_template_id', templateId);
    window.open('design-studio.html', '_blank');
}

function deleteCustomTemplate(templateId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا القالب؟')) return;
    
    let templates = JSON.parse(localStorage.getItem('tithkari_design_templates') || '[]');
    templates = templates.filter(t => t.id !== templateId);
    localStorage.setItem('tithkari_design_templates', JSON.stringify(templates));
    
    renderCustomTemplates();
    showToast('✅ تم حذف القالب', 'success');
}

async function injectTemplateToStore(templateId) {
    const templates = JSON.parse(localStorage.getItem('tithkari_design_templates') || '[]');
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
        showToast('⚠️ القالب غير موجود', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('templates')
            .insert([{
                name: template.name,
                image_url: template.baseImage || template.image,
                ref_url: template.baseImage || template.image,
                status: 'active',
                is_custom: true,
                layers_data: template.layers || []
            }]);
        
        if (error) throw error;
        
        await supabase
            .from('products')
            .insert([{
                name: template.name,
                description: 'درع مخصص - ' + template.name,
                price: 199,
                image_url: template.baseImage || template.image,
                template_image: template.baseImage || template.image,
                category: 'مخصص',
                stock: 99,
                is_custom_template: true
            }]);
        
        showToast('✅ تم حقن القالب في المتجر بنجاح!', 'success');
        renderCustomTemplates();
        loadDesignTemplates();
        loadProducts();
        
    } catch (error) {
        console.error('❌ خطأ في الحقن:', error);
        showToast('❌ خطأ: ' + error.message, 'error');
    }
}

function syncCustomTemplates() {
    renderCustomTemplates();
    showToast('✅ تم تحديث القوالب', 'success');
}

async function injectTemplatesToAdmin() {
    const { templates, customProducts } = loadCustomTemplates();
    
    if (templates.length === 0 && customProducts.length === 0) {
        showToast('⚠️ لا توجد قوالب مخصصة للحقن', 'warning');
        return;
    }
    
    let injectedCount = 0;
    
    try {
        for (const template of templates) {
            if (template.status === 'inactive') continue;
            
            const { data: existing } = await supabase
                .from('templates')
                .select('id')
                .eq('id', template.id)
                .maybeSingle();
            
            if (!existing) {
                const { error } = await supabase
                    .from('templates')
                    .insert([{
                        id: template.id,
                        name: template.name || 'قالب مخصص',
                        image_url: template.image,
                        ref_url: template.ref || template.image,
                        status: template.status || 'active',
                        is_custom: true
                    }]);
                
                if (error) throw error;
                injectedCount++;
            }
        }
        
        for (const product of customProducts) {
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .eq('id', product.id)
                .maybeSingle();
            
            if (!existing) {
                const { error } = await supabase
                    .from('products')
                    .insert([{
                        id: product.id,
                        name: product.name || 'درع مخصص',
                        description: product.description || 'درع مصمم حسب الطلب',
                        price: product.price || 199,
                        image_url: product.image_url,
                        template_image: product.template_image || product.image_url,
                        category: product.category || 'مخصص',
                        stock: product.stock || 99,
                        is_custom_template: true
                    }]);
                
                if (error) throw error;
                injectedCount++;
            }
        }
        
        if (injectedCount > 0) {
            showToast(`✅ تم حقن ${injectedCount} قالب/منتج بنجاح!`, 'success');
            loadDesignTemplates();
            loadProducts();
        } else {
            showToast('⚠️ جميع القوالب موجودة بالفعل', 'info');
        }
        
    } catch (error) {
        console.error('❌ خطأ في حقن القوالب:', error);
        showToast('❌ خطأ في الحقن: ' + error.message, 'error');
    }
}

function syncTemplatesToLocal() {
    const { templates, customProducts } = loadCustomTemplates();
    
    if (templates.length === 0 && customProducts.length === 0) {
        showToast('⚠️ لا توجد قوالب للمزامنة', 'warning');
        return;
    }
    
    localStorage.setItem('tithkari_templates_backup', JSON.stringify({
        templates: templates,
        customProducts: customProducts,
        syncedAt: new Date().toISOString()
    }));
    
    showToast('✅ تمت المزامنة بنجاح!', 'success');
}

// ============================================
// ===== تعديل المنتج =====
// ============================================

window.openEditProductForm = async function(productId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('editProductId').value = data.id;
        document.getElementById('editProductName').value = data.name || '';
        document.getElementById('editProductDescription').value = data.description || '';
        document.getElementById('editProductCategory').value = data.category || 'كلاسيكي';
        document.getElementById('editProductPrice').value = data.price || '';
        document.getElementById('editProductImage').value = data.image_url || '';
        document.getElementById('editProductTemplateImage').value = data.template_image || '';
        document.getElementById('editProductStock').value = data.stock || 0;
        document.getElementById('editProductStatus').value = data.status || 'active';
        
        if (data.image_url) {
            document.getElementById('editImagePreview').innerHTML = 
                '<img src="' + data.image_url + '" style="max-width:150px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" onerror="this.style.display=\'none\'" />';
        }
        if (data.template_image) {
            document.getElementById('editTemplatePreview').innerHTML = 
                '<img src="' + data.template_image + '" style="max-width:150px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" onerror="this.style.display=\'none\'" />';
        }
        
        document.getElementById('editProductModal').classList.add('active');
        
        document.getElementById('editProductImageFile')?.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    document.getElementById('editImagePreview').innerHTML = 
                        '<img src="' + ev.target.result + '" style="max-width:150px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" />' +
                        '<p style="font-size:10px;color:#4CAF50;">✅ تم التحميل</p>';
                    document.getElementById('editProductImage').value = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        document.getElementById('editTemplateImageFile')?.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    document.getElementById('editTemplatePreview').innerHTML = 
                        '<img src="' + ev.target.result + '" style="max-width:150px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" />' +
                        '<p style="font-size:10px;color:#4CAF50;">✅ تم التحميل</p>';
                    document.getElementById('editProductTemplateImage').value = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        document.getElementById('editProductImage')?.addEventListener('input', function() {
            const url = this.value.trim();
            if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
                document.getElementById('editImagePreview').innerHTML = 
                    '<img src="' + url + '" style="max-width:150px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" onerror="this.style.display=\'none\'" />';
            }
        });
        
        document.getElementById('editProductTemplateImage')?.addEventListener('input', function() {
            const url = this.value.trim();
            if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
                document.getElementById('editTemplatePreview').innerHTML = 
                    '<img src="' + url + '" style="max-width:150px;border-radius:8px;border:1px solid rgba(255,215,0,0.2);" onerror="this.style.display=\'none\'" />';
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتج:', error);
        showToast('❌ حدث خطأ في تحميل المنتج', 'error');
    }
};

window.closeEditProductForm = function() {
    document.getElementById('editProductModal').classList.remove('active');
};

window.updateProduct = async function(event) {
    event.preventDefault();
    
    const btn = document.getElementById('editProductBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> جاري التحديث...';
    
    try {
        const id = document.getElementById('editProductId').value;
        const name = document.getElementById('editProductName').value.trim();
        const description = document.getElementById('editProductDescription').value.trim();
        const category = document.getElementById('editProductCategory').value;
        const price = parseFloat(document.getElementById('editProductPrice').value);
        let image_url = document.getElementById('editProductImage').value.trim();
        let template_image = document.getElementById('editProductTemplateImage').value.trim();
        const stock = parseInt(document.getElementById('editProductStock').value);
        const status = document.getElementById('editProductStatus').value;
        
        if (!name || !price || isNaN(stock)) {
            showToast('⚠️ الرجاء تعبئة جميع الحقول المطلوبة', 'warning');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> تحديث المنتج';
            return;
        }
        
        const imageFile = document.getElementById('editProductImageFile')?.files[0];
        const templateFile = document.getElementById('editTemplateImageFile')?.files[0];
        
        if (imageFile) {
            const uploaded = await uploadProductImage(imageFile);
            if (uploaded) image_url = uploaded;
        }
        
        if (templateFile) {
            const uploaded = await uploadProductImage(templateFile);
            if (uploaded) template_image = uploaded;
        }
        
        const updateData = {
            name,
            description,
            category,
            price,
            image_url: image_url || null,
            template_image: template_image || null,
            stock,
            status,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ تم تحديث المنتج بنجاح!', 'success');
        closeEditProductForm();
        loadProducts();
        loadDashboard();
        
    } catch (error) {
        console.error('❌ خطأ في تحديث المنتج:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> تحديث المنتج';
};

// ============================================
// ===== إدارة العملاء =====
// ============================================

window.loadCustomers = async function() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('customer_name, customer_email, customer_phone, total_amount, created_at, status, order_number')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const customersMap = {};
        orders.forEach(order => {
            const key = order.customer_email || order.customer_phone || order.customer_name;
            if (!customersMap[key]) {
                customersMap[key] = {
                    name: order.customer_name || 'زائر',
                    email: order.customer_email || '-',
                    phone: order.customer_phone || '-',
                    orders: [],
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrder: order.created_at
                };
            }
            customersMap[key].orders.push(order);
            customersMap[key].totalOrders += 1;
            customersMap[key].totalSpent += order.total_amount || 0;
            if (new Date(order.created_at) > new Date(customersMap[key].lastOrder)) {
                customersMap[key].lastOrder = order.created_at;
            }
        });
        
        const customers = Object.values(customersMap);
        customers.sort((a, b) => new Date(b.lastOrder) - new Date(a.lastOrder));
        
        renderCustomers(customers);
        window._customersData = customers;
        
    } catch (error) {
        console.error('❌ خطأ في تحميل العملاء:', error);
        showToast('❌ حدث خطأ في تحميل العملاء', 'error');
    }
};

function renderCustomers(customers) {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    
    if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray);">👥 لا يوجد عملاء</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map((c, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${c.name}</strong></td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td><span style="color:#ffd700;">${c.totalOrders}</span></td>
            <td><span style="color:#10b981;">${c.totalSpent.toFixed(2)} د.ل</span></td>
            <td>${new Date(c.lastOrder).toLocaleDateString('ar-EG')}</td>
            <td>
                <button class="btn-view" onclick="viewCustomerDetails('${c.email}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-edit" onclick="sendCustomerMessage('${c.email}')">
                    <i class="fas fa-envelope"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.filterCustomers = function() {
    const search = document.getElementById('customerSearch').value.toLowerCase().trim();
    const data = window._customersData || [];
    
    if (!search) {
        renderCustomers(data);
        return;
    }
    
    const filtered = data.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.includes(search)
    );
    
    renderCustomers(filtered);
};

window.viewCustomerDetails = async function(email) {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_email', email)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const customer = window._customersData.find(c => c.email === email);
        if (!customer) {
            showToast('⚠️ العميل غير موجود', 'error');
            return;
        }
        
        const content = document.getElementById('customerDetailsContent');
        content.innerHTML = `
            <div class="customer-info">
                <p><strong>👤 الاسم:</strong> ${customer.name}</p>
                <p><strong>📧 البريد:</strong> ${customer.email}</p>
                <p><strong>📱 الهاتف:</strong> ${customer.phone}</p>
                <p><strong>📦 عدد الطلبات:</strong> ${customer.totalOrders}</p>
                <p><strong>💰 إجمالي المشتريات:</strong> ${customer.totalSpent.toFixed(2)} د.ل</p>
            </div>
            <h4 style="color:var(--gold);margin-bottom:10px;">📋 سجل الطلبات</h4>
            <div style="max-height:300px;overflow-y:auto;">
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>المجموع</th>
                            <th>الحالة</th>
                            <th>التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>${order.order_number}</td>
                                <td>${order.total_amount.toFixed(2)} د.ل</td>
                                <td>
                                    <span style="color:${order.status === 'delivered' ? '#10b981' : order.status === 'pending' ? '#f59e0b' : '#ef4444'};">
                                        ${order.status === 'delivered' ? '✅ مكتمل' : order.status === 'pending' ? '⏳ قيد الانتظار' : '❌ ملغي'}
                                    </span>
                                </td>
                                <td>${new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('customerDetailsModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ في تحميل تفاصيل العميل', 'error');
    }
};

window.closeCustomerDetails = function() {
    document.getElementById('customerDetailsModal').classList.remove('active');
};

window.sendCustomerMessage = function(email) {
    window.location.href = 'mailto:' + email;
    showToast('📧 تم فتح البريد الإلكتروني', 'info');
};

window.exportCustomersCSV = function() {
    const data = window._customersData || [];
    if (data.length === 0) {
        showToast('⚠️ لا يوجد عملاء للتصدير', 'warning');
        return;
    }
    
    let csv = 'الاسم,البريد الإلكتروني,رقم الهاتف,عدد الطلبات,إجمالي المشتريات,آخر طلب\n';
    data.forEach(c => {
        csv += `"${c.name}","${c.email}","${c.phone}",${c.totalOrders},${c.totalSpent.toFixed(2)},"${new Date(c.lastOrder).toLocaleDateString('ar-EG')}"\n`;
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `العملاء_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('✅ تم تصدير العملاء بنجاح!', 'success');
};

// ============================================
// ===== لوحة المعلومات (Dashboard) =====
// ============================================
window.loadDashboard = async function() {
    try {
        await loadStats();
        
        const { data: recentOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!ordersError) {
            const tbody = document.getElementById('recentOrdersBody');
            if (tbody) {
                if (!recentOrders || recentOrders.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray);">لا توجد طلبات حديثة</td></tr>';
                } else {
                    tbody.innerHTML = recentOrders.map(order => `
                        <tr>
                            <td>${order.order_number}</td>
                            <td>${order.customer_name || 'زائر'}</td>
                            <td>${Number(order.total_amount).toFixed(2)} د.ل</td>
                            <td><span class="status-badge status-${order.status || 'pending'}">${getStatusText(order.status)}</span></td>
                            <td>${new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                        </tr>
                    `).join('');
                }
            }
        }
        
        const { data: lowStockProducts, error: stockError } = await supabase
            .from('products')
            .select('name, stock, price')
            .lt('stock', 10)
            .order('stock', { ascending: true })
            .limit(5);
        
        if (!stockError) {
            const tbody = document.getElementById('lowStockBody');
            if (tbody) {
                if (!lowStockProducts || lowStockProducts.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--gray);">✅ جميع المنتجات متوفرة</td></tr>';
                } else {
                    tbody.innerHTML = lowStockProducts.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td style="color:${p.stock === 0 ? '#ef4444' : '#f59e0b'};font-weight:700;">${p.stock}</td>
                            <td>${Number(p.price).toFixed(2)} د.ل</td>
                        </tr>
                    `).join('');
                }
            }
        }
        
        console.log('✅ Dashboard loaded');
    } catch (error) {
        console.error('❌ Dashboard error:', error);
    }
};

// ============================================
// جعل الدوال العامة متاحة
// ============================================
window.loadDashboard = loadDashboard;
window.loadDesignTemplates = loadDesignTemplates;
window.loadProducts = loadProducts;
window.loadOrders = loadOrders;
window.loadBanners = loadBanners;
window.loadMenus = loadMenus;
window.loadSettings = loadSettings;
window.loadStats = loadStats;
window.loadAnalytics = loadAnalytics;
window.showToast = showToast;
window.selectFile = selectFile;
window.initStoreSettings = initStoreSettings;
window.initCodeEditor = initCodeEditor;
window.renderCustomTemplates = renderCustomTemplates;
window.editCustomTemplate = editCustomTemplate;
window.deleteCustomTemplate = deleteCustomTemplate;
window.injectTemplateToStore = injectTemplateToStore;
window.syncCustomTemplates = syncCustomTemplates;
window.injectTemplatesToAdmin = injectTemplatesToAdmin;
window.syncTemplatesToLocal = syncTemplatesToLocal;
window.loadCustomTemplates = loadCustomTemplates;
window.loadCustomers = loadCustomers;
window.renderCustomers = renderCustomers;
window.filterCustomers = filterCustomers;
window.viewCustomerDetails = viewCustomerDetails;
window.closeCustomerDetails = closeCustomerDetails;
window.sendCustomerMessage = sendCustomerMessage;
window.exportCustomersCSV = exportCustomersCSV;
window.openEditProductForm = openEditProductForm;
window.closeEditProductForm = closeEditProductForm;
window.updateProduct = updateProduct;
window.uploadProductImage = uploadProductImage;
window.addProduct = addProduct;
window.getPlaceholderSVG = getPlaceholderSVG;
window.initAdvancedSettings = initAdvancedSettings;
window.saveAdvancedSettings = saveAdvancedSettings;
window.openAdvancedBannerForm = openAdvancedBannerForm;
window.closeAdvancedBannerForm = closeAdvancedBannerForm;
window.openFooterItemForm = openFooterItemForm;
window.closeFooterItemForm = closeFooterItemForm;
window.editFooterItem = editFooterItem;
window.deleteFooterItem = deleteFooterItem;
window.loadFooterItems = loadFooterItems;
window.loadCategoriesForAdmin = loadCategoriesForAdmin;
window.openCategoryForm = openCategoryForm;
window.openCategoryFormForEdit = openCategoryFormForEdit;
window.closeCategoryForm = closeCategoryForm;
window.deleteCategory = deleteCategory;
window.toggleCategoryStatus = toggleCategoryStatus;
window.saveStoreSettings = saveStoreSettings;
window.loadCoupons = loadCoupons;
window.openCouponForm = openCouponForm;
window.closeCouponForm = closeCouponForm;
window.editCoupon = editCoupon;
window.deleteCoupon = deleteCoupon;
window.loadReviews = loadReviews;
window.openReviewForm = openReviewForm;
window.closeReviewForm = closeReviewForm;
window.editReview = editReview;
window.deleteReview = deleteReview;
window.loadPaymentSettings = loadPaymentSettings;
window.savePaymentSettings = savePaymentSettings;
window.loadEmailSettings = loadEmailSettings;
window.saveEmailSettings = saveEmailSettings;
window.sendTestEmail = sendTestEmail;

// ============================================
// بدء التشغيل
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Panel Starting...');
    
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const nameEl = document.getElementById('adminName');
            if (nameEl && user.email) {
                nameEl.textContent = user.email.split('@')[0];
            }
        } catch (e) {}
    }
    
    document.querySelectorAll('.admin-nav a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var tab = this.getAttribute('data-tab');
            if (tab) {
                console.log('🔘 Clicked:', tab);
                window.switchTab(tab);
            }
        });
    });
    
    initAddProductForm();
    
    loadStats();
    loadProducts();
    loadOrders();
    loadAnalytics();
    loadBanners();
    loadMenus();
    loadSettings();
    loadDesignTemplates();
    initStoreSettings();
    initCodeEditor();
    loadCustomers();
    loadDashboard();
    
    setTimeout(function() {
        loadProductsForFieldSelector();
    }, 1000);
    
    const productSelector = document.getElementById('fieldProductSelector');
    if (productSelector) {
        productSelector.addEventListener('change', loadProductFields);
        console.log('✅ fieldProductSelector event bound');
    } else {
        console.warn('⚠️ fieldProductSelector not found in DOM');
    }
    
    const fieldTypeSelect = document.getElementById('customFieldType');
    if (fieldTypeSelect) {
        fieldTypeSelect.addEventListener('change', function() {
            const optionsGroup = document.getElementById('fieldOptionsGroup');
            if (optionsGroup) {
                optionsGroup.style.display = this.value === 'select' ? 'block' : 'none';
            }
        });
        console.log('✅ customFieldType event bound');
    }
    
    const addFieldBtn = document.getElementById('addFieldBtn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', function() {
            openCustomFieldForm();
        });
        console.log('✅ addFieldBtn event bound');
    }
    
    const customFieldForm = document.getElementById('customFieldForm');
    if (customFieldForm) {
        const newForm = customFieldForm.cloneNode(true);
        customFieldForm.parentNode.replaceChild(newForm, customFieldForm);
        newForm.addEventListener('submit', saveCustomField);
        console.log('✅ customFieldForm event bound');
    }
    
    setTimeout(function() {
        renderCustomTemplates();
    }, 1500);
    
    console.log('✅ Admin Panel Ready');
    console.log('📋 Available tabs:', ['dashboard', 'products', 'orders', 'add-product', 'custom-fields', 'analytics', 'banners', 'menus', 'customers', 'settings', 'design-templates', 'code-editor', 'store-settings', 'advanced-settings', 'footer', 'categories', 'coupons', 'reviews', 'payment-settings', 'email-settings', 'payment-shipping', 'tools'].join(', '));
});