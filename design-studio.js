// ============================================
// محرك تصميم الدروع - Tithkari Studio
// ============================================

// ===== استيراد Supabase =====
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ===== إعدادات Supabase =====
const SUPABASE_URL = 'https://savtqajghyloevzwrzvt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase initialized in Design Studio');

// ===== الحالة =====
var layers = [];
var activeLayerId = null;
var layerCounter = 0;
var undoStack = [];
var redoStack = [];
var currentTemplate = 'shield_1';
var currentTemplateId = null;
var isDragging = false;
var isResizing = false;
var isEditing = false;
var currentHandle = '';
var dragStartX = 0;
var dragStartY = 0;
var dragStartLeft = 0;
var dragStartTop = 0;
var dragStartWidth = 0;
var dragStartHeight = 0;
var activeResizeLayer = null;
var currentProductId = null;
var touchStartTime = 0;

// ===== القوالب الافتراضية =====
var defaultTemplates = [
    { id: 'shield_1', name: 'درع الفارس الذهبي', image: 'https://i.ibb.co/vxn3p7C7/Gemini-Generated-Image-g2xtelg2xtelg2xt.png' },
    { id: 'shield_2', name: 'درع التنين الأسود', image: 'https://i.ibb.co/dwkh437W/Gemini-Generated-Image-bt95o2bt95o2bt95-1.png' },
    { id: 'shield_3', name: 'درع الوفاء الفخم', image: 'https://i.ibb.co/Y7Xm6f8f/Gemini-Generated-Image-bt95o2bt95o2bt95.png' },
    { id: 'shield_4', name: 'درع التكريم الكلاسيكي', image: 'https://i.ibb.co/v6yX3Wf4/Gemini-Generated-Image-g2xtelg2xtelg2xt-1.png' }
];

// ===== العبارات الجاهزة =====
var presetQuotes = [
    { name: 'شكر وتقدير', text: 'بكل فخر واعتزاز، نقدم هذا الدرع تعبيراً عن شكرنا وتقديرنا لجهودكم المتميزة.' },
    { name: 'وفاء وعرفان', text: 'من وفاء وولاء، نهديكم هذا الدرع رمزاً للعرفان والامتنان على عطائكم المستمر.' },
    { name: 'تميز وإبداع', text: 'تميزتم فأبدعتم، وهذا الدرع شهادة على إخلاصكم وتفانيكم في العمل.' },
    { name: 'تكريم وتقدير', text: 'تقديراً لعطائكم وإخلاصكم، نمنحكم هذا الدرع كرمز للفخر والاعتزاز.' },
    { name: 'مسيرة عطاء', text: 'مسيرة عطاء حافلة بالإنجازات، وهذا الدرع تكريم لمسيرتكم المباركة.' }
];

// ============================================
// التهيئة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadProductData();
    loadTemplates();
    renderQuoteButtons();
    
    // إضافة الطبقات الافتراضية
    addTextLayer('المناسبة أو الرتبة', '35%', '5%', '90%', '35px');
    addTextLayer('اسم صاحب الإهداء', '42%', '5%', '90%', '45px');
    addTextLayer('عبارة الإهداء أو التكريم', '52%', '5%', '90%', '30%');
    
    updateLayerCount();
    saveState();
    setupDragListeners();
    loadProductsForLinking();
    
    var urlParams = new URLSearchParams(window.location.search);
    var productId = urlParams.get('productId');
    if (productId) {
        setTimeout(function() {
            loadProductWithTemplate(productId);
        }, 500);
    }
    
    var editTemplateId = localStorage.getItem('tithkari_edit_template_id');
    if (editTemplateId) {
        setTimeout(function() {
            loadTemplateForEdit(editTemplateId);
            localStorage.removeItem('tithkari_edit_template_id');
        }, 600);
    }
});

// ============================================
// تحميل بيانات المنتج
// ============================================
function loadProductData() {
    try {
        var data = JSON.parse(localStorage.getItem('tithkari_design_data') || '{}');
        if (data.productImage) {
            document.getElementById('referenceImage').src = data.productImage;
            
            if (data.templateImage) {
                document.getElementById('baseImage').src = data.templateImage;
            } else {
                document.getElementById('baseImage').src = data.productImage;
            }
            
            document.getElementById('productNameDisplay').textContent = data.productName || 'درع مخصص';
            currentProductId = data.productId || null;
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات المنتج:', error);
    }
}

// ============================================
// تحميل بيانات قالب
// ============================================
function loadTemplateData(templateData) {
    layers.forEach(function(l) { l.element.remove(); });
    layers = [];
    layerCounter = 0;
    
    if (templateData.baseImage) {
        document.getElementById('baseImage').src = templateData.baseImage;
    }
    
    if (templateData.templateId) {
        currentTemplateId = templateData.templateId;
    }
    
    if (templateData.layers) {
        templateData.layers.forEach(function(layerData) {
            if (layerData.type === 'text') {
                var layer = addTextLayer(
                    layerData.text || 'نص',
                    layerData.top || '20%',
                    layerData.left || '10%',
                    layerData.width || '80%',
                    layerData.height || '40px'
                );
                
                if (layerData.style) {
                    var content = layer.element.querySelector('.text-content');
                    if (content) {
                        content.style.fontSize = layerData.style.fontSize || '18px';
                        content.style.fontFamily = layerData.style.fontFamily || 'Cairo';
                        content.style.color = layerData.style.color || '#d4af37';
                        content.style.backgroundColor = layerData.style.backgroundColor || 'rgba(0,0,0,0.7)';
                    }
                }
            } else if (layerData.type === 'image') {
                addImageLayer(
                    layerData.src || '',
                    layerData.top || '30%',
                    layerData.left || '30%',
                    layerData.width || '120px',
                    layerData.height || '120px'
                );
            }
        });
    }
    
    updateLayerCount();
    saveState();
}

// ============================================
// تحميل المنتجات لربط القالب
// ============================================
async function loadProductsForLinking() {
    try {
        // جلب المنتجات من Supabase
        var { data: products, error } = await supabase
            .from('products')
            .select('id, name, image_url, template_image, template_data')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // إضافة منتجات localStorage أيضاً
        var localProducts = JSON.parse(localStorage.getItem('tithkari_custom_products') || '[]');
        var allProducts = [...(products || []), ...localProducts];
        
        var select = document.getElementById('productLinkSelect');
        if (select) {
            select.innerHTML = '<option value="">-- غير مرتبط بمنتج --</option>';
            allProducts.forEach(function(p) {
                var selected = (currentProductId === p.id) ? 'selected' : '';
                var isFromSupabase = p.image_url ? ' (من المتجر)' : '';
                select.innerHTML += '<option value="' + p.id + '" ' + selected + '>' + p.name + isFromSupabase + '</option>';
            });
        }
    } catch (error) {
        console.log('⚠️ لا يمكن تحميل المنتجات:', error);
    }
}

// ============================================
// إعداد مستمعات السحب (محسنة للجوال)
// ============================================
function setupDragListeners() {
    // للماوس
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // للجوال - استخدام { passive: false } للسماح بـ preventDefault
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('touchcancel', onTouchEnd, { passive: false });
}

function onMouseMove(e) {
    handleDrag(e.clientX, e.clientY);
}

function onTouchMove(e) {
    e.preventDefault();
    var touch = e.touches[0];
    if (touch) {
        handleDrag(touch.clientX, touch.clientY);
    }
}

function handleDrag(clientX, clientY) {
    // ===== السحب =====
    if (isDragging && activeLayerId) {
        var layerData = getActiveLayer();
        if (!layerData) return;
        
        var frame = document.getElementById('canvasFrame');
        var rect = frame.getBoundingClientRect();
        var layer = layerData.element;
        
        var parentWidth = rect.width;
        var parentHeight = rect.height;
        
        var layerWidth = parseFloat(layer.style.width) || 20;
        var layerHeight = parseFloat(layer.style.height) || 20;
        
        var newLeft = ((clientX - rect.left - dragStartX) / parentWidth) * 100;
        var newTop = ((clientY - rect.top - dragStartY) / parentHeight) * 100;
        
        newLeft = Math.max(0, Math.min(100 - layerWidth, newLeft));
        newTop = Math.max(0, Math.min(100 - layerHeight, newTop));
        
        layer.style.left = newLeft + '%';
        layer.style.top = newTop + '%';
        layerData.left = layer.style.left;
        layerData.top = layer.style.top;
    }
    
    // ===== التحجيم =====
    if (isResizing && activeResizeLayer) {
        var frame = document.getElementById('canvasFrame');
        var rect = frame.getBoundingClientRect();
        var layer = activeResizeLayer;
        var layerData = layers.find(function(l) { return l.element === layer; });
        if (!layerData) return;
        
        var newWidth = dragStartWidth + (clientX - dragStartX);
        var newHeight = dragStartHeight + (clientY - dragStartY);
        
        newWidth = Math.max(30, newWidth);
        newHeight = Math.max(30, newHeight);
        
        var maxWidth = rect.width * 0.9;
        var maxHeight = rect.height * 0.9;
        newWidth = Math.min(maxWidth, newWidth);
        newHeight = Math.min(maxHeight, newHeight);
        
        var pctWidth = (newWidth / rect.width) * 100;
        var pctHeight = (newHeight / rect.height) * 100;
        
        layer.style.width = Math.min(90, pctWidth) + '%';
        layer.style.height = Math.min(90, pctHeight) + '%';
        layerData.width = layer.style.width;
        layerData.height = layer.style.height;
    }
}

function onMouseUp(e) {
    if (isDragging || isResizing) {
        isDragging = false;
        isResizing = false;
        activeResizeLayer = null;
        saveState();
    }
}

function onTouchEnd(e) {
    if (isDragging || isResizing) {
        isDragging = false;
        isResizing = false;
        activeResizeLayer = null;
        saveState();
    }
}

// ============================================
// تحميل القوالب
// ============================================
function loadTemplates() {
    var templates = JSON.parse(localStorage.getItem('tithkari_design_templates') || '[]');
    
    if (templates.length === 0) {
        templates = defaultTemplates.map(function(t) {
            return { id: t.id, name: t.name, image: t.image, status: 'active', isCustom: false };
        });
        localStorage.setItem('tithkari_design_templates', JSON.stringify(templates));
    }
    
    renderTemplates(templates);
}

function renderTemplates(templates) {
    var grid = document.getElementById('templatesGrid');
    var activeTemplates = templates.filter(function(t) { return t.status !== 'inactive'; });
    
    if (activeTemplates.length === 0) {
        grid.innerHTML = '<p style="color:#9ca3af; font-size:11px; grid-column:1/-1; text-align:center;">لا توجد قوالب نشطة</p>';
        return;
    }
    
    grid.innerHTML = '';
    activeTemplates.forEach(function(t) {
        var activeClass = (t.id === currentTemplate) ? 'active' : '';
        var customIcon = t.isCustom ? '<span style="color:#8B5CF6;font-size:8px;">✏️</span>' : '';
        grid.innerHTML += `
            <div class="template-thumb ${activeClass}" onclick="selectTemplate('${t.id}')">
                <img src="${t.image}" alt="${t.name}">
                <span>${t.name}</span>
                ${customIcon}
            </div>
        `;
    });
}

function selectTemplate(id) {
    currentTemplate = id;
    var templates = JSON.parse(localStorage.getItem('tithkari_design_templates') || '[]');
    var template = templates.find(function(t) { return t.id === id; });
    
    if (template) {
        if (template.isCustom && template.layers) {
            loadTemplateData(template);
            showToast('✅ تم تحميل القالب المخصص: ' + template.name);
        } else {
            document.getElementById('baseImage').src = template.image;
            showToast('✅ تم تغيير القالب: ' + template.name);
        }
        
        renderTemplates(templates);
        saveState();
    }
}

// ============================================
// العبارات الجاهزة
// ============================================
function renderQuoteButtons() {
    var container = document.getElementById('quoteButtons');
    if (!container) return;
    
    container.innerHTML = '';
    presetQuotes.forEach(function(q) {
        var btn = document.createElement('button');
        btn.className = 'quote-btn';
        btn.textContent = q.name;
        btn.onclick = function() { applyQuote(q.text); };
        container.appendChild(btn);
    });
}

function applyQuote(text) {
    var activeLayer = getActiveLayer();
    if (activeLayer && activeLayer.type === 'text') {
        var content = activeLayer.element.querySelector('.text-content');
        if (content) {
            content.textContent = text;
            document.getElementById('textContent').value = text;
            saveState();
            showToast('✅ تم تطبيق العبارة', 'success');
        }
    } else {
        addTextLayer(text, '50%', '10%', '80%', '30%');
        showToast('✅ تم إضافة العبارة', 'success');
    }
}

function applyPresetQuote(value) {
    if (!value) return;
    applyQuote(value);
}

// ============================================
// إضافة طبقات - مع دعم السحب والتحجيم
// ============================================
function addTextLayer(text, top, left, width, height) {
    text = text || 'نص جديد';
    top = top || '20%';
    left = left || '10%';
    width = width || '80%';
    height = height || '40px';
    
    var surface = document.getElementById('layersSurface');
    var id = 'layer_' + (++layerCounter);

    var layer = document.createElement('div');
    layer.id = id;
    layer.className = 'layer';
    layer.style.cssText = 'top:' + top + '; left:' + left + '; width:' + width + '; height:' + height + '; z-index:' + (10 + layerCounter) + '; touch-action:none;';

    var content = document.createElement('div');
    content.className = 'text-content';
    content.style.cssText = 'width:100%; height:100%; display:flex; align-items:center; justify-content:center; text-align:center; padding:4px; font-weight:700; font-size:18px; color:#d4af37; background:rgba(0,0,0,0.7); border-radius:4px; font-family:Cairo, sans-serif; white-space:pre-wrap; word-break:break-word; cursor:text; min-height:20px; min-width:20px; touch-action:none;';
    content.textContent = text;

    // التعديل المباشر بالضغط المزدوج
    content.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        startEditing(this);
    });

    // الضغط المطول للجوال
    var pressTimer = null;
    content.addEventListener('touchstart', function(e) {
        pressTimer = setTimeout(function() {
            e.preventDefault();
            startEditing(content);
        }, 500);
    }, { passive: true });
    content.addEventListener('touchend', function() {
        clearTimeout(pressTimer);
    }, { passive: true });
    content.addEventListener('touchmove', function() {
        clearTimeout(pressTimer);
    }, { passive: true });

    // مقابض التحجيم
    var handles = ['se', 'e', 's'];
    handles.forEach(function(h) {
        var handle = document.createElement('div');
        handle.className = 'resize-handle resize-' + h;
        handle.style.touchAction = 'none';
        handle.style.pointerEvents = 'auto';
        handle.style.zIndex = '30';
        
        handle.addEventListener('mousedown', function(e) { 
            e.stopPropagation(); 
            e.preventDefault();
            startResize(e, layer, h); 
        });
        
        handle.addEventListener('touchstart', function(e) { 
            e.stopPropagation(); 
            e.preventDefault(); 
            startResize(e, layer, h); 
        }, { passive: false });
        
        layer.appendChild(handle);
    });

    layer.appendChild(content);
    
    // أحداث السحب للطبقة
    layer.addEventListener('mousedown', function(e) { 
        if (!e.target.classList.contains('resize-handle')) {
            e.preventDefault();
            startDrag(e, layer); 
        }
    });
    
    layer.addEventListener('touchstart', function(e) { 
        if (!e.target.classList.contains('resize-handle')) {
            e.preventDefault();
            startDrag(e, layer); 
        }
    }, { passive: false });

    surface.appendChild(layer);

    var layerData = {
        id: id,
        type: 'text',
        element: layer,
        content: content,
        text: text,
        top: top,
        left: left,
        width: width,
        height: height
    };

    layers.push(layerData);
    selectLayer(id);
    updateLayerCount();
    saveState();
    return layerData;
}

// ============================================
// بدء التعديل المباشر للنص
// ============================================
function startEditing(contentElement) {
    if (isEditing) return;
    isEditing = true;
    
    var layer = contentElement.closest('.layer');
    var layerData = layers.find(function(l) { return l.element === layer; });
    if (!layerData) return;
    
    contentElement.classList.add('editing');
    contentElement.contentEditable = true;
    contentElement.focus();
    
    var range = document.createRange();
    range.selectNodeContents(contentElement);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    var finishEditing = function() {
        contentElement.classList.remove('editing');
        contentElement.contentEditable = false;
        isEditing = false;
        layerData.text = contentElement.textContent;
        document.getElementById('textContent').value = contentElement.textContent;
        saveState();
        contentElement.removeEventListener('blur', finishEditing);
        contentElement.removeEventListener('keydown', onKeyDown);
    };
    
    var onKeyDown = function(e) {
        if (e.key === 'Escape') {
            contentElement.textContent = layerData.text || 'نص';
            contentElement.blur();
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            contentElement.blur();
        }
    };
    
    contentElement.addEventListener('blur', finishEditing);
    contentElement.addEventListener('keydown', onKeyDown);
}

// ============================================
// بدء السحب (محسن للجوال)
// ============================================
function startDrag(e, layer) {
    if (isEditing) return;
    if (e.target.classList.contains('resize-handle')) return;
    
    e.preventDefault();
    selectLayer(layer.id);
    
    var frame = document.getElementById('canvasFrame');
    var rect = frame.getBoundingClientRect();
    var layerRect = layer.getBoundingClientRect();
    
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStartX = clientX - layerRect.left;
    dragStartY = clientY - layerRect.top;
    
    isDragging = true;
    saveState();
}

// ============================================
// بدء التحجيم (محسن للجوال)
// ============================================
function startResize(e, layer, handle) {
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    
    selectLayer(layer.id);
    activeResizeLayer = layer;
    currentHandle = handle;
    isResizing = true;
    
    var frame = document.getElementById('canvasFrame');
    var rect = frame.getBoundingClientRect();
    var layerRect = layer.getBoundingClientRect();
    
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStartX = clientX;
    dragStartY = clientY;
    dragStartWidth = layerRect.width;
    dragStartHeight = layerRect.height;
    
    saveState();
}

// ============================================
// إضافة طبقة صورة
// ============================================
function addImageLayer(src, top, left, width, height) {
    src = src || '';
    top = top || '30%';
    left = left || '30%';
    width = width || '120px';
    height = height || '120px';
    
    var surface = document.getElementById('layersSurface');
    var id = 'layer_' + (++layerCounter);

    var layer = document.createElement('div');
    layer.id = id;
    layer.className = 'layer';
    layer.style.cssText = 'top:' + top + '; left:' + left + '; width:' + width + '; height:' + height + '; z-index:' + (10 + layerCounter) + '; touch-action:none;';

    var placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.style.cssText = 'width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; border-radius:6px; touch-action:none;';

    if (src) {
        var img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width:100%; height:100%; object-fit:contain;';
        placeholder.appendChild(img);
    } else {
        placeholder.innerHTML = '<div style="text-align:center; color:#9ca3af; font-size:10px; padding:6px; touch-action:none;"><i class="fas fa-image" style="font-size:18px; display:block; margin-bottom:2px;"></i>انقر لرفع صورة</div>';
        placeholder.onclick = function() { triggerImageUpload(); };
    }

    var handles = ['se', 'e', 's'];
    handles.forEach(function(h) {
        var handle = document.createElement('div');
        handle.className = 'resize-handle resize-' + h;
        handle.style.touchAction = 'none';
        handle.style.pointerEvents = 'auto';
        handle.style.zIndex = '30';
        
        handle.addEventListener('mousedown', function(e) { 
            e.stopPropagation(); 
            e.preventDefault();
            startResize(e, layer, h); 
        });
        
        handle.addEventListener('touchstart', function(e) { 
            e.stopPropagation(); 
            e.preventDefault(); 
            startResize(e, layer, h); 
        }, { passive: false });
        
        layer.appendChild(handle);
    });

    layer.appendChild(placeholder);
    
    layer.addEventListener('mousedown', function(e) { 
        if (!e.target.classList.contains('resize-handle')) {
            e.preventDefault();
            startDrag(e, layer); 
        }
    });
    
    layer.addEventListener('touchstart', function(e) { 
        if (!e.target.classList.contains('resize-handle')) {
            e.preventDefault();
            startDrag(e, layer); 
        }
    }, { passive: false });

    surface.appendChild(layer);

    var layerData = {
        id: id,
        type: 'image',
        element: layer,
        placeholder: placeholder,
        src: src || null,
        top: top,
        left: left,
        width: width,
        height: height
    };

    layers.push(layerData);
    selectLayer(id);
    updateLayerCount();
    saveState();
    return layerData;
}

// ============================================
// رفع الصور
// ============================================
function triggerImageUpload() {
    document.getElementById('imageUploader').click();
}

function handleImageUpload(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            addImageLayer(e.target.result);
            showToast('✅ تم رفع الصورة');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

// ============================================
// اختيار الطبقة
// ============================================
function selectLayer(id) {
    document.querySelectorAll('.layer').forEach(function(l) { l.classList.remove('focused'); });

    var layerData = layers.find(function(l) { return l.id === id; });
    if (!layerData) return;

    activeLayerId = id;
    layerData.element.classList.add('focused');

    var textControls = document.getElementById('textControls');
    if (layerData.type === 'text') {
        textControls.style.display = 'block';
        document.getElementById('textContent').value = layerData.text || '';
        var content = layerData.element.querySelector('.text-content');
        if (content) {
            document.getElementById('fontSize').value = parseFloat(content.style.fontSize) || 18;
            document.getElementById('fontSizeDisplay').textContent = document.getElementById('fontSize').value;
            document.getElementById('textColor').value = rgbToHex(content.style.color) || '#d4af37';
            document.getElementById('textBgColor').value = rgbToHex(content.style.backgroundColor) || '#000000';
            document.getElementById('textBgToggle').checked = content.style.backgroundColor !== 'transparent';
        }
    } else {
        textControls.style.display = 'none';
    }
    
    updateLayersList();
}

function deselectLayer(e) {
    if (isEditing) return;
    if (e.target.id === 'canvasFrame' || e.target.closest('.base-layer')) {
        document.querySelectorAll('.layer').forEach(function(l) { l.classList.remove('focused'); });
        activeLayerId = null;
        document.getElementById('textControls').style.display = 'none';
        updateLayersList();
    }
}

function getActiveLayer() {
    return layers.find(function(l) { return l.id === activeLayerId; }) || null;
}

// ============================================
// تحديث النص
// ============================================
function updateActiveText() {
    var layerData = getActiveLayer();
    if (!layerData || layerData.type !== 'text') return;

    var content = layerData.element.querySelector('.text-content');
    if (!content) return;

    var text = document.getElementById('textContent').value;
    var fontSize = document.getElementById('fontSize').value;
    var fontFamily = document.getElementById('fontFamily').value;
    var color = document.getElementById('textColor').value;
    var bgColor = document.getElementById('textBgColor').value;
    var bgToggle = document.getElementById('textBgToggle').checked;

    content.textContent = text;
    content.style.fontSize = fontSize + 'px';
    content.style.fontFamily = fontFamily + ', sans-serif';
    content.style.color = color;
    content.style.backgroundColor = bgToggle ? bgColor : 'transparent';

    layerData.text = text;
    document.getElementById('fontSizeDisplay').textContent = fontSize;
    saveState();
}

// ============================================
// تحويل 3D
// ============================================
function updateTransform() {
    var layerData = getActiveLayer();
    if (!layerData) return;

    var tiltX = document.getElementById('tiltX').value;
    var tiltY = document.getElementById('tiltY').value;
    var rotateZ = document.getElementById('rotateZ').value;

    layerData.element.style.transform = 'perspective(600px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) rotateZ(' + rotateZ + 'deg)';
    saveState();
}

function resetTransform() {
    document.getElementById('tiltX').value = 0;
    document.getElementById('tiltY').value = 0;
    document.getElementById('rotateZ').value = 0;
    updateTransform();
}

// ============================================
// حذف الطبقات
// ============================================
function deleteActiveLayer() {
    var layerData = getActiveLayer();
    if (!layerData) {
        showToast('⚠️ اختر طبقة أولاً', 'error');
        return;
    }

    if (!confirm('هل أنت متأكد من حذف هذه الطبقة؟')) return;

    layerData.element.remove();
    layers = layers.filter(function(l) { return l.id !== layerData.id; });
    activeLayerId = null;
    document.getElementById('textControls').style.display = 'none';
    updateLayerCount();
    updateLayersList();
    saveState();
    showToast('🗑️ تم حذف الطبقة');
}

function clearAllLayers() {
    if (layers.length === 0) {
        showToast('⚠️ لا توجد طبقات لحذفها', 'error');
        return;
    }

    if (!confirm('هل أنت متأكد من مسح جميع الطبقات؟')) return;

    layers.forEach(function(l) { l.element.remove(); });
    layers = [];
    activeLayerId = null;
    document.getElementById('textControls').style.display = 'none';
    updateLayerCount();
    updateLayersList();
    saveState();
    showToast('🗑️ تم مسح جميع الطبقات');
}

// ============================================
// تحديث عدد الطبقات وقائمة الطبقات
// ============================================
function updateLayerCount() {
    document.getElementById('layerCount').textContent = layers.length + ' طبقة';
    updateLayersList();
}

function updateLayersList() {
    var container = document.getElementById('layersList');
    if (!container) return;
    
    if (layers.length === 0) {
        container.innerHTML = '<p style="color:var(--studio-muted);font-size:9px;">لا توجد طبقات</p>';
        return;
    }
    
    container.innerHTML = '';
    layers.forEach(function(l) {
        var activeClass = (l.id === activeLayerId) ? 'active' : '';
        var typeIcon = (l.type === 'text') ? '📝' : '🖼️';
        var typeColor = (l.type === 'text') ? '#d4af37' : '#3b82f6';
        var textDisplay = (l.type === 'text') ? (l.text || 'نص').substring(0, 15) : 'صورة';
        container.innerHTML += `
            <div class="layer-item ${activeClass}" onclick="selectLayer('${l.id}')">
                <span>
                    <span style="color:${typeColor}">${typeIcon}</span>
                    ${textDisplay}
                    ${l.id === activeLayerId ? ' 👈' : ''}
                </span>
                <span class="layer-delete" onclick="event.stopPropagation(); deleteLayer('${l.id}')">
                    <i class="fas fa-times"></i>
                </span>
            </div>
        `;
    });
}

function deleteLayer(layerId) {
    var layerData = layers.find(function(l) { return l.id === layerId; });
    if (!layerData) return;
    
    layerData.element.remove();
    layers = layers.filter(function(l) { return l.id !== layerId; });
    if (activeLayerId === layerId) activeLayerId = null;
    updateLayerCount();
    updateLayersList();
    saveState();
    showToast('🗑️ تم حذف الطبقة');
}

// ============================================
// Undo/Redo
// ============================================
function saveState() {
    var state = {
        layers: layers.map(function(l) {
            var data = {
                id: l.id,
                type: l.type,
                html: l.element.outerHTML,
                top: l.top,
                left: l.left,
                width: l.width,
                height: l.height,
                text: l.text || null,
                src: l.src || null
            };
            if (l.type === 'text') {
                var content = l.element.querySelector('.text-content');
                if (content) {
                    data.style = {
                        fontSize: content.style.fontSize,
                        fontFamily: content.style.fontFamily,
                        color: content.style.color,
                        backgroundColor: content.style.backgroundColor
                    };
                }
            }
            return data;
        }),
        activeId: activeLayerId,
        baseImage: document.getElementById('baseImage').src,
        templateId: currentTemplateId
    };
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
}

function restoreState(stateJson) {
    var state = JSON.parse(stateJson);

    layers.forEach(function(l) { l.element.remove(); });
    layers = [];

    if (state.baseImage) {
        document.getElementById('baseImage').src = state.baseImage;
    }

    state.layers.forEach(function(layerData) {
        var surface = document.getElementById('layersSurface');
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = layerData.html;
        var element = tempDiv.firstElementChild;
        surface.appendChild(element);

        var newLayer = {
            id: layerData.id,
            type: layerData.type,
            element: element,
            top: layerData.top,
            left: layerData.left,
            width: layerData.width,
            height: layerData.height,
            text: layerData.text || null,
            src: layerData.src || null
        };

        if (layerData.type === 'text') {
            newLayer.content = element.querySelector('.text-content');
            if (newLayer.content) {
                newLayer.content.addEventListener('dblclick', function(e) {
                    e.stopPropagation();
                    startEditing(this);
                });
            }
        } else if (layerData.type === 'image') {
            newLayer.placeholder = element.querySelector('.image-placeholder');
        }

        element.addEventListener('mousedown', function(e) { 
            if (!e.target.classList.contains('resize-handle')) {
                e.preventDefault();
                startDrag(e, element); 
            }
        });
        
        element.addEventListener('touchstart', function(e) { 
            if (!e.target.classList.contains('resize-handle')) {
                e.preventDefault();
                startDrag(e, element); 
            }
        }, { passive: false });
        
        element.querySelectorAll('.resize-handle').forEach(function(h) {
            var handleClass = [...h.classList].find(function(c) { return c.startsWith('resize-'); });
            if (handleClass) {
                var handleType = handleClass.replace('resize-', '');
                h.addEventListener('mousedown', function(e) { 
                    e.stopPropagation(); 
                    e.preventDefault();
                    startResize(e, element, handleType); 
                });
                h.addEventListener('touchstart', function(e) { 
                    e.stopPropagation(); 
                    e.preventDefault(); 
                    startResize(e, element, handleType); 
                }, { passive: false });
            }
        });

        layers.push(newLayer);
    });

    if (state.activeId) {
        var found = layers.find(function(l) { return l.id === state.activeId; });
        if (found) selectLayer(found.id);
    }
    updateLayerCount();
    updateLayersList();
}

function undoAction() {
    if (undoStack.length <= 1) {
        showToast('⚠️ لا يوجد تراجع', 'error');
        return;
    }
    redoStack.push(undoStack.pop());
    restoreState(undoStack[undoStack.length - 1]);
    showToast('↩️ تراجع');
}

function redoAction() {
    if (redoStack.length === 0) {
        showToast('⚠️ لا يوجد تقدم', 'error');
        return;
    }
    var state = redoStack.pop();
    undoStack.push(state);
    restoreState(state);
    showToast('↪️ تقدم');
}

// ============================================
// 🛠️ [مُصلح] حفظ القالب
// ============================================
function saveCurrentTemplate() {
    // ✅ التأكد من وجود طبقات
    if (layers.length === 0) {
        showToast('⚠️ لا توجد طبقات لحفظها، أضف طبقات أولاً', 'error');
        return;
    }

    var layersData = layers.map(function(l) {
        var data = {
            type: l.type,
            top: l.top,
            left: l.left,
            width: l.width,
            height: l.height
        };
        
        if (l.type === 'text') {
            var content = l.element.querySelector('.text-content');
            data.text = l.text || (content ? content.textContent : '');
            if (content) {
                data.style = {
                    fontSize: content.style.fontSize || '18px',
                    fontFamily: content.style.fontFamily || 'Cairo',
                    color: content.style.color || '#d4af37',
                    backgroundColor: content.style.backgroundColor || 'rgba(0,0,0,0.7)'
                };
            }
        } else if (l.type === 'image') {
            var img = l.element.querySelector('img');
            data.src = img ? img.src : (l.src || '');
        }
        
        return data;
    });
    
    var templateName = prompt('🏷️ أدخل اسم القالب:', 'قالب مخصص ' + new Date().toLocaleDateString('ar-SA'));
    if (!templateName) {
        showToast('⚠️ تم إلغاء الحفظ', 'warning');
        return;
    }
    
    // ✅ التحقق من وجود عنصر productLinkSelect
    var productLink = document.getElementById('productLinkSelect');
    var linkedProductId = null;
    var linkedProductName = '';
    
    if (productLink) {
        linkedProductId = productLink.value || null;
        linkedProductName = productLink.options[productLink.selectedIndex]?.text || '';
    }
    
    var templateData = {
        id: 'template_' + Date.now(),
        name: templateName,
        baseImage: document.getElementById('baseImage').src,
        layers: layersData,
        linkedProductId: linkedProductId,
        linkedProductName: linkedProductName,
        isCustom: true,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    // ✅ جلب القوالب الموجودة وحفظ الجديد
    var templates = JSON.parse(localStorage.getItem('tithkari_design_templates') || '[]');
    templates.push(templateData);
    localStorage.setItem('tithkari_design_templates', JSON.stringify(templates));
    
    showToast('✅ تم حفظ القالب "' + templateName + '" بنجاح!', 'success');
    
    // ✅ تحديث عرض القوالب
    loadTemplates();
    showExportOptions(templateData);
    
    // ✅ حفظ في المنتج المرتبط
    if (linkedProductId) {
        saveToLinkedProduct(templateData, linkedProductId);
    }
    
    // ✅ حفظ الحالة للتراجع
    saveState();
}

// ============================================
// حفظ في المنتج المرتبط
// ============================================
function saveToLinkedProduct(templateData, productId) {
    var customProducts = JSON.parse(localStorage.getItem('tithkari_custom_products') || '[]');
    
    var productIndex = customProducts.findIndex(function(p) { return p.id === productId; });
    
    var productData = {
        id: productId,
        name: templateData.name,
        price: 199,
        description: 'درع مخصص - ' + templateData.name,
        image_url: templateData.baseImage,
        template_image: templateData.baseImage,
        template_data: templateData,
        category: 'مخصص',
        stock: 99,
        isCustomTemplate: true,
        updatedAt: new Date().toISOString()
    };
    
    if (productIndex !== -1) {
        customProducts[productIndex] = { ...customProducts[productIndex], ...productData };
    } else {
        customProducts.push(productData);
    }
    
    localStorage.setItem('tithkari_custom_products', JSON.stringify(customProducts));
    console.log('✅ تم حفظ القالب في المنتج المرتبط:', productId);
}

// ============================================
// 🛠️ [مُحسَّن] تحميل قالب للتعديل
// ============================================
function loadTemplateForEdit(templateId) {
    if (!templateId) {
        showToast('⚠️ معرف القالب غير موجود', 'error');
        return;
    }
    
    var templates = JSON.parse(localStorage.getItem('tithkari_design_templates') || '[]');
    var template = templates.find(function(t) { return t.id === templateId; });
    
    if (!template) {
        showToast('⚠️ القالب غير موجود', 'error');
        return;
    }
    
    // ✅ تحميل بيانات القالب
    loadTemplateData(template);
    currentTemplateId = templateId;
    document.getElementById('productNameDisplay').textContent = template.name;
    
    showToast('✅ تم تحميل القالب للتعديل: ' + template.name);
    saveState();
}

// ============================================
// عرض خيارات التصدير
// ============================================
function showExportOptions(templateData) {
    var canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    var ctx = canvas.getContext('2d');
    
    var bgImg = document.getElementById('baseImage');
    var bg = new Image();
    bg.crossOrigin = 'anonymous';
    bg.src = bgImg.src;
    bg.onload = function() {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        
        var rect = document.getElementById('canvasFrame').getBoundingClientRect();
        layers.forEach(function(layer) {
            var layerRect = layer.element.getBoundingClientRect();
            var x = ((layerRect.left - rect.left) / rect.width) * canvas.width;
            var y = ((layerRect.top - rect.top) / rect.height) * canvas.height;
            var w = (layerRect.width / rect.width) * canvas.width;
            var h = (layerRect.height / rect.height) * canvas.height;
            
            if (layer.type === 'text') {
                var content = layer.element.querySelector('.text-content');
                if (content) {
                    var style = window.getComputedStyle(content);
                    var fontSize = parseFloat(style.fontSize) * (canvas.width / rect.width);
                    ctx.save();
                    ctx.font = 'bold ' + fontSize + 'px ' + (style.fontFamily || 'Cairo');
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = style.color || '#d4af37';
                    
                    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
                        ctx.fillStyle = style.backgroundColor;
                        var lines = content.textContent.split('\n');
                        var lineHeight = fontSize * 1.4;
                        var totalHeight = lines.length * lineHeight;
                        var textWidth = ctx.measureText(content.textContent).width;
                        var padding = fontSize * 0.5;
                        ctx.fillRect(x - textWidth/2 - padding, y - totalHeight/2 - padding, textWidth + padding*2, totalHeight + padding*2);
                        ctx.fillStyle = style.color || '#d4af37';
                    }
                    
                    var lines = content.textContent.split('\n');
                    lines.forEach(function(line, i) {
                        ctx.fillText(line, x + w/2, y + h/2 + (i - (lines.length-1)/2) * fontSize * 1.4);
                    });
                    ctx.restore();
                }
            } else if (layer.type === 'image') {
                var img = layer.element.querySelector('img');
                if (img) {
                    var imgObj = new Image();
                    imgObj.crossOrigin = 'anonymous';
                    imgObj.src = img.src;
                    imgObj.onload = function() {
                        ctx.drawImage(imgObj, x, y, w, h);
                    };
                }
            }
        });
        
        setTimeout(function() {
            var imageData = canvas.toDataURL('image/png', 0.9);
            showExportModal(imageData, templateData);
        }, 300);
    };
}

function showExportModal(imageData, templateData) {
    var modal = document.createElement('div');
    modal.id = 'exportModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;justify-content:center;align-items:center;padding:20px;backdrop-filter:blur(5px);';
    
    modal.innerHTML = `
        <div style="background:#1A1A2E;border-radius:16px;max-width:500px;width:100%;padding:30px;border:1px solid rgba(255,215,0,0.15);max-height:90vh;overflow-y:auto;">
            <div style="text-align:center;">
                <h3 style="color: #d4af37; margin-bottom:10px;">✅ تم حفظ القالب!</h3>
                <img src="${imageData}" style="max-width:180px; border-radius:8px; margin-bottom:15px; border:1px solid rgba(255,215,0,0.2);" />
                <p style="color: #f5f0eb; font-size:14px; margin-bottom:5px;">${templateData.name}</p>
                ${templateData.linkedProductName ? '<p style="color: #8a8a9b; font-size:12px;">🔗 مرتبط بـ: ' + templateData.linkedProductName + '</p>' : ''}
                
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button onclick="loadTemplateForEdit('${templateData.id}')" 
                            style="background: #8B5CF6; color:white; border:none; padding:12px; border-radius:8px; font-weight:700; cursor:pointer; font-size:15px; width:100%;">
                        <i class="fas fa-edit"></i> تعديل القالب
                    </button>
                    <button onclick="downloadTemplateImage()" 
                            style="background: #d4af37; color:#000; border:none; padding:12px; border-radius:8px; font-weight:700; cursor:pointer; font-size:15px; width:100%;">
                        <i class="fas fa-download"></i> تحميل الصورة PNG
                    </button>
                    <button onclick="sendViaWhatsApp()" 
                            style="background: #25D366; color:white; border:none; padding:12px; border-radius:8px; font-weight:700; cursor:pointer; font-size:15px; width:100%;">
                        <i class="fab fa-whatsapp"></i> إتمام الطلب عبر واتساب
                    </button>
                    <button onclick="closeExportModal()" 
                            style="background: transparent; color: #8a8a9b; border:1px solid #444; padding:10px; border-radius:8px; cursor:pointer; width:100%;">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    window._exportImageData = imageData;
    window._exportTemplateData = templateData;
}

// ============================================
// تحميل الصورة
// ============================================
function downloadTemplateImage() {
    if (window._exportImageData) {
        var link = document.createElement('a');
        link.download = 'قالب_' + Date.now() + '.png';
        link.href = window._exportImageData;
        link.click();
        showToast('✅ تم تحميل الصورة', 'success');
    }
}

// ============================================
// إتمام الطلب عبر واتساب
// ============================================
function sendViaWhatsApp() {
    var whatsappNumber = localStorage.getItem('tithkari_whatsapp_link') || '966500000000';
    whatsappNumber = whatsappNumber.replace('https://wa.me/', '').replace(/[^0-9]/g, '');
    
    var templateName = window._exportTemplateData?.name || document.getElementById('productNameDisplay').textContent || 'درع مخصص';
    
    var message = encodeURIComponent(
        '🛡️ طلب تصميم درع مخصص\n\n' +
        '📝 اسم التصميم: ' + templateName + '\n' +
        '📅 التاريخ: ' + new Date().toLocaleDateString('ar-SA') + '\n\n' +
        '🔗 تم تصميم هذا الدرع باستخدام Tithkari Studio\n' +
        '📸 الصورة مرفقة في المحادثة'
    );
    
    window.open('https://wa.me/' + whatsappNumber + '?text=' + message, '_blank');
    showToast('✅ تم فتح واتساب', 'success');
}

// ============================================
// إغلاق نافذة التصدير
// ============================================
function closeExportModal() {
    var modal = document.getElementById('exportModal');
    if (modal) modal.remove();
    window._exportImageData = null;
    window._exportTemplateData = null;
}

// ============================================
// تصدير التصميم (PNG)
// ============================================
function exportDesign() {
    showToast('⏳ جاري تحضير الصورة...', 'info');
    
    var frame = document.getElementById('canvasFrame');
    var rect = frame.getBoundingClientRect();

    var canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var bgImg = document.getElementById('baseImage');
    var bg = new Image();
    bg.crossOrigin = 'anonymous';
    bg.src = bgImg.src;
    bg.onload = function() {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        var renderedCount = 0;
        var totalLayers = layers.length;

        if (totalLayers === 0) {
            finishExport(canvas);
            return;
        }

        layers.forEach(function(layer) {
            var layerRect = layer.element.getBoundingClientRect();
            var x = ((layerRect.left - rect.left) / rect.width) * canvas.width;
            var y = ((layerRect.top - rect.top) / rect.height) * canvas.height;
            var w = (layerRect.width / rect.width) * canvas.width;
            var h = (layerRect.height / rect.height) * canvas.height;

            if (layer.type === 'text') {
                var content = layer.element.querySelector('.text-content');
                if (content) {
                    var style = window.getComputedStyle(content);
                    var fontSize = parseFloat(style.fontSize) * (canvas.width / rect.width);
                    ctx.save();
                    ctx.font = 'bold ' + fontSize + 'px ' + (style.fontFamily || 'Cairo');
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = style.color || '#d4af37';

                    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
                        ctx.fillStyle = style.backgroundColor;
                        var lines = content.textContent.split('\n');
                        var lineHeight = fontSize * 1.4;
                        var totalHeight = lines.length * lineHeight;
                        var textWidth = ctx.measureText(content.textContent).width;
                        var padding = fontSize * 0.5;
                        ctx.fillRect(x - textWidth/2 - padding, y - totalHeight/2 - padding, textWidth + padding*2, totalHeight + padding*2);
                        ctx.fillStyle = style.color || '#d4af37';
                    }

                    var lines = content.textContent.split('\n');
                    lines.forEach(function(line, i) {
                        ctx.fillText(line, x + w/2, y + h/2 + (i - (lines.length-1)/2) * fontSize * 1.4);
                    });
                    ctx.restore();
                }
                renderedCount++;
                if (renderedCount === totalLayers) finishExport(canvas);
            } else if (layer.type === 'image') {
                var img = layer.element.querySelector('img');
                if (img) {
                    var imgObj = new Image();
                    imgObj.crossOrigin = 'anonymous';
                    imgObj.src = img.src;
                    imgObj.onload = function() {
                        ctx.drawImage(imgObj, x, y, w, h);
                        renderedCount++;
                        if (renderedCount === totalLayers) finishExport(canvas);
                    };
                    imgObj.onerror = function() {
                        renderedCount++;
                        if (renderedCount === totalLayers) finishExport(canvas);
                    };
                } else {
                    renderedCount++;
                    if (renderedCount === totalLayers) finishExport(canvas);
                }
            } else {
                renderedCount++;
                if (renderedCount === totalLayers) finishExport(canvas);
            }
        });
    };
    bg.onerror = function() {
        showToast('⚠️ خطأ في تحميل الصورة، حاول مرة أخرى', 'error');
    };

    function finishExport(canvas) {
        var link = document.createElement('a');
        link.download = 'درع_مخصص_' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        showToast('✅ تم تصدير التصميم بنجاح!', 'success');
    }
}

// ============================================
// إضافة التصميم للسلة
// ============================================
function addDesignToCart() {
    showToast('⏳ جاري إضافة التصميم للسلة...', 'info');
    
    var frame = document.getElementById('canvasFrame');
    var rect = frame.getBoundingClientRect();

    var canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var bgImg = document.getElementById('baseImage');
    var bg = new Image();
    bg.crossOrigin = 'anonymous';
    bg.src = bgImg.src;
    bg.onload = function() {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        var renderedCount = 0;
        var totalLayers = layers.length;

        if (totalLayers === 0) {
            finishAddToCart(canvas);
            return;
        }

        layers.forEach(function(layer) {
            var layerRect = layer.element.getBoundingClientRect();
            var x = ((layerRect.left - rect.left) / rect.width) * canvas.width;
            var y = ((layerRect.top - rect.top) / rect.height) * canvas.height;
            var w = (layerRect.width / rect.width) * canvas.width;
            var h = (layerRect.height / rect.height) * canvas.height;

            if (layer.type === 'text') {
                var content = layer.element.querySelector('.text-content');
                if (content) {
                    var style = window.getComputedStyle(content);
                    var fontSize = parseFloat(style.fontSize) * (canvas.width / rect.width);
                    ctx.save();
                    ctx.font = 'bold ' + fontSize + 'px ' + (style.fontFamily || 'Cairo');
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = style.color || '#d4af37';

                    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
                        ctx.fillStyle = style.backgroundColor;
                        var lines = content.textContent.split('\n');
                        var lineHeight = fontSize * 1.4;
                        var totalHeight = lines.length * lineHeight;
                        var textWidth = ctx.measureText(content.textContent).width;
                        var padding = fontSize * 0.5;
                        ctx.fillRect(x - textWidth/2 - padding, y - totalHeight/2 - padding, textWidth + padding*2, totalHeight + padding*2);
                        ctx.fillStyle = style.color || '#d4af37';
                    }

                    var lines = content.textContent.split('\n');
                    lines.forEach(function(line, i) {
                        ctx.fillText(line, x + w/2, y + h/2 + (i - (lines.length-1)/2) * fontSize * 1.4);
                    });
                    ctx.restore();
                }
                renderedCount++;
                if (renderedCount === totalLayers) finishAddToCart(canvas);
            } else if (layer.type === 'image') {
                var img = layer.element.querySelector('img');
                if (img) {
                    var imgObj = new Image();
                    imgObj.crossOrigin = 'anonymous';
                    imgObj.src = img.src;
                    imgObj.onload = function() {
                        ctx.drawImage(imgObj, x, y, w, h);
                        renderedCount++;
                        if (renderedCount === totalLayers) finishAddToCart(canvas);
                    };
                    imgObj.onerror = function() {
                        renderedCount++;
                        if (renderedCount === totalLayers) finishAddToCart(canvas);
                    };
                } else {
                    renderedCount++;
                    if (renderedCount === totalLayers) finishAddToCart(canvas);
                }
            } else {
                renderedCount++;
                if (renderedCount === totalLayers) finishAddToCart(canvas);
            }
        });
    };
    bg.onerror = function() {
        showToast('⚠️ خطأ في تحميل الصورة', 'error');
    };

    function finishAddToCart(canvas) {
        var imageData = canvas.toDataURL('image/png', 0.9);
        
        var designData = {
            name: document.getElementById('productNameDisplay').textContent || 'درع مخصص 🛡️',
            price: 199,
            description: 'درع مصمم حسب الطلب',
            image: imageData,
            isCustom: true,
            timestamp: Date.now()
        };

        var savedDesigns = JSON.parse(localStorage.getItem('tithkari_custom_designs') || '[]');
        savedDesigns.push(designData);
        localStorage.setItem('tithkari_custom_designs', JSON.stringify(savedDesigns));

        var cart = JSON.parse(localStorage.getItem('tithkari_cart') || '[]');
        cart.push({
            id: 'custom_' + Date.now(),
            name: designData.name,
            price: designData.price,
            image: imageData,
            quantity: 1,
            isCustom: true,
            designData: designData
        });
        localStorage.setItem('tithkari_cart', JSON.stringify(cart));

        var count = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
        var countEl = document.getElementById('cartCount');
        if (countEl) countEl.textContent = count;

        showToast('✅ تم إضافة التصميم للسلة! 🛒', 'success');
        
        setTimeout(function() {
            if (confirm('✅ تم إضافة التصميم للسلة! هل تريد الذهاب إلى المتجر الآن؟')) {
                window.location.href = 'index.html';
            }
        }, 500);
    }
}

// ============================================
// ربط المنتج بالقالب (من Supabase مباشرة)
// ============================================
async function loadProductWithTemplate(productId) {
    try {
        console.log('🔍 جاري البحث عن المنتج:', productId);
        showToast('⏳ جاري تحميل المنتج...', 'info');
        
        // 1. جلب المنتج من Supabase مباشرة
        var { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) {
            console.error('❌ خطأ في جلب المنتج:', error);
            
            // محاولة البحث في localStorage كحل بديل
            var localProducts = JSON.parse(localStorage.getItem('tithkari_custom_products') || '[]');
            product = localProducts.find(function(p) { return p.id == productId; });
            
            if (!product) {
                showToast('⚠️ المنتج غير موجود', 'error');
                return;
            }
        }
        
        if (!product) {
            showToast('⚠️ المنتج غير موجود', 'error');
            return;
        }
        
        console.log('✅ تم العثور على المنتج:', product.name);
        loadProductDataToStudio(product);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتج مع القالب:', error);
        showToast('❌ خطأ في تحميل المنتج', 'error');
    }
}

// ============================================
// 🛠️ [مُحسَّن] تحميل بيانات المنتج إلى الاستوديو
// ============================================
function loadProductDataToStudio(product) {
    if (!product) {
        showToast('⚠️ المنتج غير موجود', 'error');
        return;
    }
    
    console.log('📦 تحميل المنتج:', product.name);
    
    document.getElementById('productNameDisplay').textContent = product.name || 'درع مخصص';
    
    // الصورة المرجعية = صورة المنتج
    if (product.image_url) {
        document.getElementById('referenceImage').src = product.image_url;
        console.log('✅ تم تحميل الصورة المرجعية');
    }
    
    // ✅ التحقق من وجود template_data
    var hasTemplateData = product.template_data && typeof product.template_data === 'object' && Object.keys(product.template_data).length > 0;
    
    if (hasTemplateData) {
        // بيانات قالب كاملة
        loadTemplateData(product.template_data);
        currentTemplateId = product.template_data.id || null;
        showToast('✅ تم تحميل القالب المرتبط بالمنتج: ' + product.name);
        console.log('✅ تم تحميل بيانات القالب الكاملة');
    } else if (product.template_image) {
        // صورة قالب فقط
        document.getElementById('baseImage').src = product.template_image;
        showToast('✅ تم تحميل صورة القالب للمنتج: ' + product.name);
        console.log('✅ تم تحميل صورة القالب');
    } else {
        // استخدام صورة المنتج كقالب
        document.getElementById('baseImage').src = product.image_url;
        showToast('✅ تم تحميل المنتج: ' + product.name);
        console.log('✅ استخدام صورة المنتج كقالب');
    }
    
    currentProductId = product.id;
    
    // تحديث قائمة المنتجات
    loadProductsForLinking();
    
    // حفظ في localStorage للاستخدام السريع
    var designData = {
        productImage: product.image_url,
        productName: product.name,
        productId: product.id,
        templateImage: product.template_image || product.image_url,
        timestamp: Date.now()
    };
    localStorage.setItem('tithkari_design_data', JSON.stringify(designData));
    
    console.log('✅ تم تحميل المنتج بنجاح');
}

// ============================================
// دوال مساعدة
// ============================================
function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#000000';
    var match = rgb.match(/\d+/g);
    if (!match) return '#000000';
    return '#' + match.slice(0, 3).map(function(c) {
        var hex = parseInt(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function showToast(message, type) {
    type = type || 'success';
    var existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast-notification ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(30px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(function() { toast.remove(); }, 400);
    }, 3000);
}

// ============================================
// جعل الدوال العامة
// ============================================
window.addTextLayer = addTextLayer;
window.triggerImageUpload = triggerImageUpload;
window.handleImageUpload = handleImageUpload;
window.updateActiveText = updateActiveText;
window.updateTransform = updateTransform;
window.resetTransform = resetTransform;
window.applyPresetQuote = applyPresetQuote;
window.undoAction = undoAction;
window.redoAction = redoAction;
window.deleteActiveLayer = deleteActiveLayer;
window.clearAllLayers = clearAllLayers;
window.selectTemplate = selectTemplate;
window.deselectLayer = deselectLayer;
window.startEditing = startEditing;
window.saveCurrentTemplate = saveCurrentTemplate;
window.loadTemplateForEdit = loadTemplateForEdit;
window.downloadTemplateImage = downloadTemplateImage;
window.sendViaWhatsApp = sendViaWhatsApp;
window.closeExportModal = closeExportModal;
window.showExportOptions = showExportOptions;
window.loadTemplateData = loadTemplateData;
window.exportDesign = exportDesign;
window.addDesignToCart = addDesignToCart;
window.loadProductWithTemplate = loadProductWithTemplate;
window.loadProductDataToStudio = loadProductDataToStudio;
window.applyQuote = applyQuote;
window.deleteLayer = deleteLayer;
window.updateLayersList = updateLayersList;
window.loadProductsForLinking = loadProductsForLinking;

console.log('✅ Design Studio loaded successfully');