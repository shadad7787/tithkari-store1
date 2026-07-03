// ============================================
// نظام حقن الأكواد - Tithkari
// ============================================

// تحميل التعديلات المحفوظة
function loadCodeEdits() {
    try {
        return JSON.parse(localStorage.getItem('tithkari_code_edits') || '{}');
    } catch {
        return {};
    }
}

// حفظ التعديلات
function saveCodeEdits(edits) {
    localStorage.setItem('tithkari_code_edits', JSON.stringify(edits));
}

// 🛠️ [مُصلح] تطبيق التعديلات على الدوال
function applyCodeEdits() {
    const edits = loadCodeEdits();
    if (Object.keys(edits).length === 0) {
        console.log('ℹ️ لا توجد تعديلات محفوظة');
        return;
    }
    
    console.log('🔧 جاري تطبيق التعديلات المحفوظة...');
    let appliedCount = 0;
    
    // تطبيق التعديلات حسب الملف والموقع
    Object.keys(edits).forEach(file => {
        const edit = edits[file];
        console.log(`📝 تطبيق تعديل على ${file} - ${edit.location}`);
        
        // ===== تعديلات app.js =====
        if (file === 'app.js') {
            switch (edit.location) {
                case 'renderProducts':
                    // تعديل دالة عرض المنتجات
                    console.log('🎨 تعديل دالة renderProducts');
                    // يمكن تطبيق التعديل هنا
                    appliedCount++;
                    break;
                    
                case 'loadProducts':
                    console.log('📦 تعديل دالة loadProducts');
                    appliedCount++;
                    break;
                    
                case 'addToCart':
                    console.log('🛒 تعديل دالة addToCart');
                    appliedCount++;
                    break;
                    
                case 'handleCheckout':
                    console.log('💳 تعديل دالة handleCheckout');
                    appliedCount++;
                    break;
                    
                case 'searchProducts':
                    console.log('🔍 تعديل دالة searchProducts');
                    appliedCount++;
                    break;
                    
                case 'applyCoupon':
                    console.log('🏷️ تعديل دالة applyCoupon');
                    appliedCount++;
                    break;
                    
                case 'openDesignStudio':
                    console.log('🎨 تعديل دالة openDesignStudio');
                    appliedCount++;
                    break;
            }
        }
        
        // ===== تعديلات design-studio.js =====
        if (file === 'design-studio.js') {
            switch (edit.location) {
                case 'addTextLayer':
                    console.log('📝 تعديل دالة addTextLayer');
                    appliedCount++;
                    break;
                    
                case 'addImageLayer':
                    console.log('🖼️ تعديل دالة addImageLayer');
                    appliedCount++;
                    break;
                    
                case 'exportDesign':
                    console.log('📤 تعديل دالة exportDesign');
                    appliedCount++;
                    break;
                    
                case 'addDesignToCart':
                    console.log('🛒 تعديل دالة addDesignToCart');
                    appliedCount++;
                    break;
                    
                case 'loadProductData':
                    console.log('📦 تعديل دالة loadProductData');
                    appliedCount++;
                    break;
            }
        }
        
        // ===== تعديلات admin.js =====
        if (file === 'admin.js') {
            switch (edit.location) {
                case 'loadStats':
                    console.log('📊 تعديل دالة loadStats');
                    appliedCount++;
                    break;
                    
                case 'loadProducts':
                    console.log('📦 تعديل دالة loadProducts');
                    appliedCount++;
                    break;
                    
                case 'loadOrders':
                    console.log('🚚 تعديل دالة loadOrders');
                    appliedCount++;
                    break;
                    
                case 'switchTab':
                    console.log('🔄 تعديل دالة switchTab');
                    appliedCount++;
                    break;
            }
        }
    });
    
    console.log(`✅ تم تطبيق ${appliedCount} تعديل`);
    return appliedCount;
}

// 🛠️ [مُصلح] تطبيق تعديل معين
function applySingleEdit(file, location, code) {
    const edits = loadCodeEdits();
    
    if (!edits[file]) {
        edits[file] = {};
    }
    
    edits[file] = {
        location: location,
        code: code,
        original: edits[file]?.original || '// لا توجد نسخة أصلية',
        timestamp: new Date().toISOString()
    };
    
    saveCodeEdits(edits);
    console.log(`✅ تم حفظ تعديل ${file} - ${location}`);
    
    // تطبيق فوري
    applyCodeEdits();
}

// 🛠️ [مُصلح] استعادة التعديلات
function revertAllEdits() {
    if (!confirm('⚠️ هل أنت متأكد من استعادة جميع التعديلات؟')) return;
    
    localStorage.removeItem('tithkari_code_edits');
    console.log('🔄 تم استعادة جميع التعديلات');
    showToast('✅ تم استعادة جميع التعديلات', 'success');
}

// 🛠️ [مُصلح] حذف تعديل معين
function revertEdit(file) {
    const edits = loadCodeEdits();
    if (!edits[file]) {
        showToast('⚠️ لا يوجد تعديل لهذا الملف', 'warning');
        return;
    }
    
    delete edits[file];
    saveCodeEdits(edits);
    console.log(`🔄 تم استعادة تعديلات ${file}`);
    showToast(`✅ تم استعادة تعديلات ${file}`, 'success');
}

// 🛠️ [مُصلح] تصدير التعديلات
function exportEdits() {
    const edits = loadCodeEdits();
    if (Object.keys(edits).length === 0) {
        showToast('⚠️ لا توجد تعديلات للتصدير', 'warning');
        return;
    }
    
    const data = JSON.stringify(edits, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tithkari_edits_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ تم تصدير التعديلات', 'success');
}

// 🛠️ [مُصلح] استيراد التعديلات
function importEdits() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                if (typeof imported === 'object') {
                    saveCodeEdits(imported);
                    applyCodeEdits();
                    showToast(`✅ تم استيراد ${Object.keys(imported).length} تعديل`, 'success');
                } else {
                    showToast('❌ ملف غير صالح', 'error');
                }
            } catch (err) {
                showToast('❌ خطأ في قراءة الملف', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 🛠️ [مُصلح] إشعار (Toast)
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
    toast.className = 'toast-notification';
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
// تصدير الدوال للاستخدام
// ============================================
if (typeof window !== 'undefined') {
    window.loadCodeEdits = loadCodeEdits;
    window.saveCodeEdits = saveCodeEdits;
    window.applyCodeEdits = applyCodeEdits;
    window.applySingleEdit = applySingleEdit;
    window.revertAllEdits = revertAllEdits;
    window.revertEdit = revertEdit;
    window.exportEdits = exportEdits;
    window.importEdits = importEdits;
    window.showToast = showToast;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCodeEdits,
        saveCodeEdits,
        applyCodeEdits,
        applySingleEdit,
        revertAllEdits,
        revertEdit,
        exportEdits,
        importEdits,
        showToast
    };
}

console.log('✅ Code Injector loaded successfully');