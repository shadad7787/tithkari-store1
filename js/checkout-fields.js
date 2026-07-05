// ============================================
// نظام إدارة حقول الطلب الديناميكية
// ============================================

// ============================================
// إعدادات Supabase
// ============================================
const SUPABASE_URL = 'https://savtqajghyloevzwrzvt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww';

// ============================================
// تهيئة Supabase
// ============================================
let supabaseClient = null;

function initSupabase() {
    try {
        if (typeof window.supabase !== 'undefined' && window.supabase) {
            supabaseClient = window.supabase;
        } else if (typeof supabase !== 'undefined') {
            supabaseClient = supabase;
        } else {
            // محاولة تحميل ديناميكي
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = function() {
                if (window.supabase) {
                    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    console.log('✅ Supabase client initialized dynamically');
                }
            };
            document.head.appendChild(script);
            return false;
        }
        return true;
    } catch (error) {
        console.error('❌ خطأ في تهيئة Supabase:', error);
        return false;
    }
}

// تهيئة Supabase فوراً
initSupabase();

// ============================================
// تحميل حقول الطلب من Supabase
// ============================================
async function loadCheckoutFields() {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase client not ready');
            return [];
        }
        
        const { data, error } = await supabaseClient
            .from('checkout_fields')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) {
            console.error('❌ خطأ في تحميل حقول الطلب:', error);
            return [];
        }
        
        console.log('✅ تم تحميل', data?.length || 0, 'حقل طلب');
        return data || [];
        
    } catch (error) {
        console.error('❌ خطأ في تحميل حقول الطلب:', error);
        return [];
    }
}

// ============================================
// عرض حقول الطلب في النموذج
// ============================================
async function renderCheckoutFields(containerId, fields = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`⚠️ Container "${containerId}" not found`);
        return;
    }
    
    // تحميل الحقول إذا لم تمرر
    if (fields === null) {
        fields = await loadCheckoutFields();
    }
    
    // تنظيف الحاوية
    container.innerHTML = '';
    
    if (fields.length === 0) {
        container.innerHTML = `
            <div style="color: var(--gray); font-size: 13px; padding: 10px 0; text-align: center;">
                <i class="fas fa-info-circle"></i> لا توجد تفاصيل إضافية مطلوبة
            </div>
        `;
        return;
    }
    
    // أنواع الحقول المدعومة مع أيقونات
    const typeIcons = {
        text: '📝',
        textarea: '📄',
        select: '📋',
        file: '📎',
        number: '🔢',
        email: '📧',
        phone: '📱',
        date: '📅',
        time: '⏰',
        map: '🗺️',
        checkbox: '☑️',
        radio: '⭕'
    };
    
    // عرض الحقول
    let html = '';
    let currentRow = 0;
    let rowWidth = 0;
    
    fields.forEach((field, index) => {
        const fieldId = `field_${field.slug || 'field_' + index}`;
        const fieldWidth = field.width || 2;
        const icon = typeIcons[field.field_type] || '📝';
        
        let inputHtml = '';
        const requiredAttr = field.is_required ? 'required' : '';
        const requiredStar = field.is_required ? '<span class="required-star" style="color:#ef4444;">*</span>' : '';
        
        switch (field.field_type) {
            case 'text':
                inputHtml = `
                    <input type="text" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="checkout-field-input" 
                           placeholder="${field.placeholder || ''}" 
                           ${requiredAttr}
                           data-field-id="${field.id}"
                           data-field-type="text" />
                `;
                break;
                
            case 'textarea':
                inputHtml = `
                    <textarea id="${fieldId}" 
                              name="${fieldId}" 
                              class="checkout-field-input" 
                              placeholder="${field.placeholder || ''}" 
                              rows="3"
                              ${requiredAttr}
                              data-field-id="${field.id}"
                              data-field-type="textarea"></textarea>
                `;
                break;
                
            case 'select':
                const options = field.options ? field.options.split(',').map(o => o.trim()) : [];
                inputHtml = `
                    <select id="${fieldId}" 
                            name="${fieldId}" 
                            class="checkout-field-input" 
                            ${requiredAttr}
                            data-field-id="${field.id}"
                            data-field-type="select">
                        <option value="">-- اختر --</option>
                        ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                `;
                break;
                
            case 'file':
                inputHtml = `
                    <input type="file" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="checkout-field-input" 
                           accept="image/*,application/pdf"
                           ${requiredAttr}
                           data-field-id="${field.id}"
                           data-field-type="file" />
                    <small style="color:var(--gray);font-size:11px;display:block;margin-top:3px;">
                        ${field.help_text || 'يمكنك رفع صورة أو ملف PDF'}
                    </small>
                `;
                break;
                
            case 'number':
                inputHtml = `
                    <input type="number" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="checkout-field-input" 
                           placeholder="${field.placeholder || ''}" 
                           step="1"
                           ${requiredAttr}
                           data-field-id="${field.id}"
                           data-field-type="number" />
                `;
                break;
                
            case 'email':
                inputHtml = `
                    <input type="email" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="checkout-field-input" 
                           placeholder="${field.placeholder || 'example@email.com'}" 
                           ${requiredAttr}
                           data-field-id="${field.id}"
                           data-field-type="email" />
                `;
                break;
                
            case 'phone':
                inputHtml = `
                    <input type="tel" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="checkout-field-input" 
                           placeholder="${field.placeholder || '05xxxxxxxx'}" 
                           ${requiredAttr}
                           data-field-id="${field.id}"
                           data-field-type="phone" />
                `;
                break;
                
            case 'date':
                inputHtml = `
                    <input type="date" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="checkout-field-input" 
                           ${requiredAttr}
                           data-field-id="${field.id}"
                           data-field-type="date" />
                `;
                break;
                
            case 'time':
                inputHtml = `
                    <input type="time" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="checkout-field-input" 
                           ${requiredAttr}
                           data-field-id="${field.id}"
                           data-field-type="time" />
                `;
                break;
                
            case 'map':
                inputHtml = `
                    <div id="${fieldId}-map" class="map-container" style="height:200px;background:#0F0F1A;border-radius:8px;border:1px solid rgba(255,215,0,0.1);"></div>
                    <input type="hidden" id="${fieldId}" name="${fieldId}" data-field-id="${field.id}" data-field-type="map" />
                    <button type="button" onclick="getLocationFromBrowser('${fieldId}')" class="btn-secondary" style="margin-top:5px;padding:6px 14px;font-size:12px;">
                        <i class="fas fa-map-marker-alt"></i> تحديد الموقع الحالي
                    </button>
                    <small style="color:var(--gray);font-size:11px;display:block;margin-top:3px;">
                        ${field.help_text || 'اضغط لتحديد موقعك بدقة'}
                    </small>
                `;
                break;
                
            case 'checkbox':
                inputHtml = `
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                        <input type="checkbox" 
                               id="${fieldId}" 
                               name="${fieldId}" 
                               class="checkout-field-input" 
                               style="width:auto;"
                               ${requiredAttr}
                               data-field-id="${field.id}"
                               data-field-type="checkbox" />
                        ${field.placeholder || 'أوافق على الشروط'}
                    </label>
                `;
                break;
                
            case 'radio':
                const radioOptions = field.options ? field.options.split(',').map(o => o.trim()) : [];
                inputHtml = `
                    <div style="display:flex;flex-wrap:wrap;gap:10px;">
                        ${radioOptions.map(opt => `
                            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;">
                                <input type="radio" 
                                       name="${fieldId}" 
                                       value="${opt}" 
                                       class="checkout-field-input" 
                                       style="width:auto;"
                                       ${requiredAttr}
                                       data-field-id="${field.id}"
                                       data-field-type="radio" />
                                ${opt}
                            </label>
                        `).join('')}
                    </div>
                `;
                break;
                
            default:
                inputHtml = `
                    <input type="text" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="checkout-field-input" 
                           placeholder="${field.placeholder || ''}" 
                           ${requiredAttr}
                           data-field-id="${field.id}"
                           data-field-type="text" />
                `;
        }
        
        html += `
            <div class="form-group" style="grid-column: span ${fieldWidth};">
                <label for="${fieldId}" class="custom-field-label">
                    ${icon} ${field.field_name} ${requiredStar}
                    ${field.help_text ? `<span class="field-help" style="font-size:11px;color:var(--gray);font-weight:400;">(${field.help_text})</span>` : ''}
                </label>
                ${inputHtml}
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // تهيئة الخرائط إذا وجدت
    fields.forEach(field => {
        if (field.field_type === 'map') {
            const fieldId = `field_${field.slug || field.id}`;
            initMap(fieldId);
        }
    });
    
    console.log('✅ تم عرض', fields.length, 'حقل طلب');
}

// ============================================
// دالة تحديد الموقع من المتصفح
// ============================================
function getLocationFromBrowser(fieldId) {
    if (!navigator.geolocation) {
        showNotification('⚠️ متصفحك لا يدعم تحديد الموقع', 'warning');
        return;
    }
    
    showNotification('📡 جاري تحديد موقعك...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const locationStr = `${lat},${lng}`;
            document.getElementById(fieldId).value = locationStr;
            
            // تحديث الخريطة
            updateMap(fieldId, lat, lng);
            
            showNotification(`✅ تم تحديد موقعك: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
        },
        function(error) {
            let message = '⚠️ لم نتمكن من تحديد موقعك';
            if (error.code === 1) {
                message = '⚠️ تم رفض الوصول إلى الموقع';
            } else if (error.code === 2) {
                message = '⚠️ الموقع غير متاح حالياً';
            } else if (error.code === 3) {
                message = '⚠️ انتهت مهلة تحديد الموقع';
            }
            showNotification(message, 'warning');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}
window.getLocationFromBrowser = getLocationFromBrowser;

// ============================================
// دالة تهيئة الخريطة (تستخدم مكتبة Leaflet أو OpenStreetMap)
// ============================================
function initMap(fieldId) {
    const mapContainer = document.getElementById(`${fieldId}-map`);
    if (!mapContainer) return;
    
    // تحميل Leaflet إذا لم يكن موجوداً
    if (typeof L === 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = function() {
            createMap(fieldId);
        };
        document.head.appendChild(script);
    } else {
        createMap(fieldId);
    }
}

function createMap(fieldId) {
    const mapContainer = document.getElementById(`${fieldId}-map`);
    if (!mapContainer) return;
    
    // موقع افتراضي (مكة المكرمة)
    const defaultLat = 21.4225;
    const defaultLng = 39.8262;
    
    const map = L.map(mapContainer).setView([defaultLat, defaultLng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // إضافة علامة
    const marker = L.marker([defaultLat, defaultLng], {
        draggable: true
    }).addTo(map);
    
    marker.on('dragend', function() {
        const pos = marker.getLatLng();
        document.getElementById(fieldId).value = `${pos.lat},${pos.lng}`;
    });
    
    // النقر على الخريطة
    map.on('click', function(e) {
        const pos = e.latlng;
        marker.setLatLng(pos);
        document.getElementById(fieldId).value = `${pos.lat},${pos.lng}`;
    });
    
    // تخزين الخريطة للاستخدام لاحقاً
    window._maps = window._maps || {};
    window._maps[fieldId] = { map, marker };
}

function updateMap(fieldId, lat, lng) {
    const mapData = window._maps && window._maps[fieldId];
    if (!mapData) return;
    
    const { map, marker } = mapData;
    map.setView([lat, lng], 13);
    marker.setLatLng([lat, lng]);
}

// ============================================
// جمع بيانات الحقول
// ============================================
function collectCheckoutFields(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`⚠️ Container "${containerId}" not found`);
        return {};
    }
    
    const fields = container.querySelectorAll('.checkout-field-input, input[type="hidden"][data-field-type="map"]');
    const data = {};
    let hasError = false;
    
    fields.forEach(field => {
        const fieldId = field.id;
        const fieldName = field.getAttribute('data-field-name') || fieldId;
        const fieldType = field.dataset.fieldType || 'text';
        const isRequired = field.hasAttribute('required');
        
        let value = '';
        
        if (fieldType === 'checkbox') {
            value = field.checked ? 'نعم' : 'لا';
        } else if (fieldType === 'file') {
            if (field.files && field.files.length > 0) {
                value = field.files[0].name;
            }
        } else if (fieldType === 'map') {
            // الخريطة تستخدم hidden input
            value = field.value || '';
        } else {
            value = field.value || '';
        }
        
        // التحقق من الحقول المطلوبة
        if (isRequired && !value && fieldType !== 'checkbox') {
            field.style.borderColor = '#ef4444';
            field.style.boxShadow = '0 0 0 2px rgba(244,67,54,0.2)';
            hasError = true;
        } else {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }
        
        data[fieldId] = {
            name: fieldName,
            value: value,
            type: fieldType,
            required: isRequired
        };
    });
    
    if (hasError) {
        showNotification('⚠️ الرجاء إكمال جميع الحقول المطلوبة', 'warning');
        return null;
    }
    
    return data;
}
window.collectCheckoutFields = collectCheckoutFields;

// ============================================
// عرض الحقول المجمعة في صفحة الدفع
// ============================================
function renderCheckoutSummaryFields(fieldsData) {
    if (!fieldsData || Object.keys(fieldsData).length === 0) {
        return '';
    }
    
    let html = `
        <div class="checkout-custom-fields-summary" style="margin:10px 0;padding:12px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,215,0,0.05);">
            <h4 style="color:var(--gold);font-size:14px;margin-bottom:8px;">📋 تفاصيل الطلب الإضافية</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;">
    `;
    
    Object.values(fieldsData).forEach(field => {
        if (field.value && field.value !== '—') {
            html += `
                <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;color:var(--gray);border-bottom:1px solid rgba(255,255,255,0.03);">
                    <span style="color:var(--gold);">${field.name}:</span>
                    <span style="color:var(--white);">${field.value}</span>
                </div>
            `;
        }
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}
window.renderCheckoutSummaryFields = renderCheckoutSummaryFields;

// ============================================
// دوال الإشعارات
// ============================================
function showNotification(message, type = 'info') {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#FF9800',
        info: '#2196F3'
    };
    
    // استخدام Toast إذا كان موجوداً
    if (typeof showToast === 'function') {
        showToast(message, type);
        return;
    }
    
    // إنشاء Toast مؤقت
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1A1A2E;
        color: #fff;
        padding: 12px 20px;
        border-radius: 12px;
        border-right: 4px solid ${colors[type] || '#2196F3'};
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        font-size: 14px;
        z-index: 99999;
        font-family: 'Cairo', sans-serif;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
        direction: rtl;
        max-width: 350px;
    `;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ============================================
// تهيئة النظام
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Checkout Fields System initialized');
});

// ============================================
// تصدير الدوال للاستخدام العام
// ============================================
window.__checkoutFields = {
    load: loadCheckoutFields,
    render: renderCheckoutFields,
    collect: collectCheckoutFields,
    renderSummary: renderCheckoutSummaryFields,
    getLocation: getLocationFromBrowser,
    version: '1.0.0'
};