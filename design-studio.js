// ============================================
// محرك تصميم الدروع - Tithkari Studio (محسن)
// ============================================

// ===== استيراد Supabase ونظام المفاتيح =====
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import KEYS from './keys.js';

// ===== إعدادات Supabase =====
const SUPABASE_URL = KEYS.supabaseUrl;
const SUPABASE_KEY = KEYS.supabaseAnonKey;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase initialized in Design Studio');

// ============================================
// الحالة العامة
// ============================================
let layers = [];
let activeLayerId = null;
let nextId = 1;
let history = [];
let historyIndex = -1;
let designImages = [];
let currentProductId = null;
let currentProductData = null;
let currentTemplateId = null;
let isAdminUser = false;
let currentCustomer = null;
let isUsingProductImage = false;
let isEditing = false;
let isDragging = false;
let isResizing = false;
let adminQuotes = [];
let productsList = [];
let resizeData = null;
let autoSaveTimer = null;
let animationFrame = null;
let layerCounter = 0;

// ============================================
// دوال مساعدة محسنة
// ============================================
function showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast-notification ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) translateY(30px)';
        el.style.transition = 'all 0.4s ease';
        setTimeout(() => el.remove(), 400);
    }, 3000);
}
window.showToast = showToast;

function getLayersSurface() { 
    return document.getElementById('layersSurface'); 
}

function getActiveLayer() {
    return layers.find(l => l.id === activeLayerId) || null;
}

function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#000000';
    const match = rgb.match(/\d+/g);
    if (!match) return '#000000';
    return '#' + match.slice(0, 3).map(c => {
        const hex = parseInt(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
window.rgbToHex = rgbToHex;

// ============================================
// دوال إدارة الطبقات المحسنة
// ============================================
function updateLayerCount() { 
    const count = document.getElementById('layerCount');
    if (count) count.textContent = layers.length + ' طبقة'; 
}

function updateLayersList() {
    const container = document.getElementById('layersList');
    if (!container) return;
    if (layers.length === 0) {
        container.innerHTML = '<p style="color:var(--studio-muted);font-size:9px;">لا توجد طبقات</p>';
        return;
    }
    container.innerHTML = '';
    layers.forEach(layer => {
        const item = document.createElement('div');
        item.className = 'layer-item' + (layer.id === activeLayerId ? ' active' : '');
        item.innerHTML = `
            <span>${layer.type === 'text' ? '✍️' : '🖼️'} ${layer.type === 'text' ? (layer.content || '').substring(0, 12) : 'صورة'}</span>
            <span class="layer-type ${layer.type}">${layer.type === 'text' ? 'نص' : 'صورة'}</span>
            <span class="layer-delete" onclick="event.stopPropagation();deleteLayer(${layer.id})"><i class="fas fa-times"></i></span>
        `;
        item.onclick = () => selectLayer(layer.id);
        container.appendChild(item);
    });
}

function renderLayersOptimized() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
        renderLayers();
        animationFrame = null;
    });
}

function updateAll() { 
    updateLayerCount(); 
    updateLayersList(); 
    renderLayersOptimized(); 
}

// ============================================
// دوال الطبقات الأساسية المحسنة
// ============================================
function renderLayers() {
    const surface = getLayersSurface();
    if (!surface) return;
    surface.innerHTML = '';
    
    layers.forEach(layer => {
        const el = document.createElement('div');
        el.className = 'layer' + (layer.id === activeLayerId ? ' focused' : '');
        el.dataset.id = layer.id;
        el.style.left = (layer.x || 20) + '%';
        el.style.top = (layer.y || 20) + '%';
        el.style.width = (layer.width || 30) + '%';
        el.style.height = (layer.height || 15) + '%';
        el.style.transform = `rotate(${layer.rotation || 0}deg)`;
        el.style.zIndex = layer.zIndex || 10;
        el.style.touchAction = 'none';
        el.style.position = 'absolute';
        el.style.cursor = 'grab';
        el.style.border = '2px solid transparent';
        el.style.padding = '2px';
        el.style.transition = 'box-shadow 0.3s ease';
        el.style.opacity = layer.opacity !== undefined ? layer.opacity : 1;

        layer.element = el;

        if (layer.type === 'text') {
            const textDiv = document.createElement('div');
            textDiv.className = 'text-content';
            textDiv.textContent = layer.content || 'نص';
            textDiv.style.fontFamily = layer.fontFamily || 'Cairo';
            textDiv.style.fontSize = (layer.fontSize || 18) + 'px';
            textDiv.style.color = layer.color || '#d4af37';
            if (layer.bgEnabled !== false) {
                textDiv.style.backgroundColor = layer.bgColor || '#000000';
                textDiv.style.padding = '4px 8px';
                textDiv.style.borderRadius = '4px';
            } else {
                textDiv.style.backgroundColor = 'transparent';
            }
            textDiv.style.width = '100%';
            textDiv.style.height = '100%';
            textDiv.style.display = 'flex';
            textDiv.style.alignItems = 'center';
            textDiv.style.justifyContent = 'center';
            textDiv.style.textAlign = 'center';
            textDiv.style.cursor = 'text';
            textDiv.style.userSelect = 'text';
            textDiv.style.minHeight = '20px';
            textDiv.style.minWidth = '20px';
            textDiv.style.wordBreak = 'break-word';
            textDiv.style.whiteSpace = 'pre-wrap';
            textDiv.style.pointerEvents = 'auto';
            
            textDiv.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                startEditingText(this);
            });
            
            let pressTimer = null;
            textDiv.addEventListener('touchstart', function(e) {
                pressTimer = setTimeout(function() {
                    e.preventDefault();
                    startEditingText(textDiv);
                }, 600);
            }, { passive: true });
            textDiv.addEventListener('touchend', function() {
                clearTimeout(pressTimer);
            }, { passive: true });
            textDiv.addEventListener('touchmove', function() {
                clearTimeout(pressTimer);
            }, { passive: true });
            
            textDiv.contentEditable = false;
            el.appendChild(textDiv);
            layer.contentElement = textDiv;
            
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.style.cssText = 'width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; border-radius:6px; cursor:pointer; transition:0.3s; touch-action:manipulation; position:relative;';
            
            if (layer.imageData) {
                placeholder.style.border = 'none';
                placeholder.style.background = 'transparent';
                const img = document.createElement('img');
                img.src = layer.imageData;
                img.style.cssText = 'width:100%; height:100%; object-fit:contain; pointer-events:none;';
                placeholder.appendChild(img);
            } else {
                placeholder.style.border = '2px dashed rgba(212,175,55,0.3)';
                placeholder.style.background = 'rgba(212,175,55,0.03)';
                placeholder.innerHTML = `
                    <div style="text-align:center; color:#9ca3af; font-size:10px; padding:6px; pointer-events:none;">
                        <i class="fas fa-image" style="font-size:20px; display:block; margin-bottom:4px;"></i>
                        انقر لرفع صورة
                    </div>
                `;
            }
            
            placeholder.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                triggerImageUploadForLayer(layer.id);
            });
            
            el.appendChild(placeholder);
            layer.placeholder = placeholder;
        }

        ['se', 'e', 's'].forEach(dir => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${dir}`;
            handle.dataset.dir = dir;
            handle.style.touchAction = 'none';
            handle.style.pointerEvents = 'auto';
            handle.style.zIndex = '30';
            handle.style.position = 'absolute';
            handle.style.width = '12px';
            handle.style.height = '12px';
            handle.style.background = 'var(--studio-gold)';
            handle.style.border = '2px solid #fff';
            handle.style.borderRadius = '50%';
            handle.style.boxShadow = '0 0 10px rgba(212,175,55,0.3)';
            handle.style.transition = 'transform 0.3s ease';
            
            if (dir === 'se') {
                handle.style.right = '-6px';
                handle.style.bottom = '-6px';
                handle.style.cursor = 'se-resize';
            } else if (dir === 'e') {
                handle.style.right = '-6px';
                handle.style.top = '50%';
                handle.style.transform = 'translateY(-50%)';
                handle.style.cursor = 'ew-resize';
            } else if (dir === 's') {
                handle.style.bottom = '-6px';
                handle.style.left = '50%';
                handle.style.transform = 'translateX(-50%)';
                handle.style.cursor = 'ns-resize';
            }
            
            handle.addEventListener('mouseenter', function() {
                this.style.transform = this.style.transform.includes('scale') ? this.style.transform : this.style.transform + ' scale(1.3)';
            });
            handle.addEventListener('mouseleave', function() {
                this.style.transform = this.style.transform.replace(' scale(1.3)', '');
            });
            
            handle.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.preventDefault();
                startResize(e, layer.id, dir);
            });
            
            handle.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                e.preventDefault();
                startResize(e, layer.id, dir);
            }, { passive: false });
            
            el.appendChild(handle);
        });

        el.addEventListener('mousedown', function(e) {
            if (e.target.closest('.text-content') || e.target.closest('.image-placeholder')) {
                return;
            }
            if (e.target.classList.contains('resize-handle')) return;
            e.preventDefault();
            startDrag(e, layer.id);
        });
        
        el.addEventListener('touchstart', function(e) {
            if (e.target.closest('.text-content') || e.target.closest('.image-placeholder')) {
                return;
            }
            if (e.target.classList.contains('resize-handle')) return;
            e.preventDefault();
            startDrag(e, layer.id);
        }, { passive: false });

        surface.appendChild(el);
    });
}
window.renderLayers = renderLayers;

// ============================================
// دوال السحب والتحجيم المحسنة
// ============================================
function startDrag(e, layerId) {
    if (isEditing) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const frame = document.getElementById('canvasFrame');
    const rect = frame.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const offsetXPercent = ((clientX - rect.left) / rect.width) * 100 - layer.x;
    const offsetYPercent = ((clientY - rect.top) / rect.height) * 100 - layer.y;
    
    isDragging = true;
    selectLayer(layerId);
    
    if (layer.element) {
        layer.element.style.cursor = 'grabbing';
    }
    
    function onMove(ev) {
        if (!isDragging) return;
        const moveX = ev.touches ? ev.touches[0].clientX : ev.clientX;
        const moveY = ev.touches ? ev.touches[0].clientY : ev.clientY;
        
        let newX = ((moveX - rect.left) / rect.width) * 100 - offsetXPercent;
        let newY = ((moveY - rect.top) / rect.height) * 100 - offsetYPercent;
        
        newX = Math.min(100 - layer.width, Math.max(0, newX));
        newY = Math.min(100 - layer.height, Math.max(0, newY));
        
        layer.x = newX;
        layer.y = newY;
        
        if (layer.element) {
            layer.element.style.left = newX + '%';
            layer.element.style.top = newY + '%';
        }
    }
    
    function onUp() {
        isDragging = false;
        if (layer.element) {
            layer.element.style.cursor = 'grab';
        }
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
        saveState();
    }
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp, { passive: true });
}
window.startDrag = startDrag;

function startResize(e, layerId, dir) {
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const frame = document.getElementById('canvasFrame');
    const rect = frame.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    resizeData = {
        layerId: layerId,
        dir: dir,
        startX: clientX,
        startY: clientY,
        startWidth: layer.width,
        startHeight: layer.height,
        startLeft: layer.x,
        startTop: layer.y,
        rectWidth: rect.width,
        rectHeight: rect.height
    };
    
    isResizing = true;
    selectLayer(layerId);
    
    function onMove(ev) {
        if (!isResizing || !resizeData) return;
        const moveX = ev.touches ? ev.touches[0].clientX : ev.clientX;
        const moveY = ev.touches ? ev.touches[0].clientY : ev.clientY;
        
        const dx = ((moveX - resizeData.startX) / resizeData.rectWidth) * 100;
        const dy = ((moveY - resizeData.startY) / resizeData.rectHeight) * 100;
        
        const layerRef = layers.find(l => l.id === resizeData.layerId);
        if (!layerRef) return;
        
        let newWidth = resizeData.startWidth;
        let newHeight = resizeData.startHeight;
        
        if (dir === 'se') {
            newWidth = Math.min(80, Math.max(5, resizeData.startWidth + dx));
            newHeight = Math.min(80, Math.max(5, resizeData.startHeight + dy));
        } else if (dir === 'e') {
            newWidth = Math.min(80, Math.max(5, resizeData.startWidth + dx));
        } else if (dir === 's') {
            newHeight = Math.min(80, Math.max(5, resizeData.startHeight + dy));
        }
        
        layerRef.width = newWidth;
        layerRef.height = newHeight;
        
        if (layerRef.element) {
            layerRef.element.style.width = newWidth + '%';
            layerRef.element.style.height = newHeight + '%';
        }
    }
    
    function onUp() {
        isResizing = false;
        resizeData = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
        saveState();
    }
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp, { passive: true });
}
window.startResize = startResize;

// ============================================
// دوال تحسينات جديدة
// ============================================

function duplicateLayer() {
    if (activeLayerId === null) {
        showToast('⚠️ اختر طبقة أولاً', 'warning');
        return;
    }
    const original = layers.find(l => l.id === activeLayerId);
    if (!original) return;
    
    const copy = {
        ...original,
        id: nextId++,
        x: (original.x || 20) + 5,
        y: (original.y || 20) + 5,
        content: original.content ? original.content + ' (نسخة)' : 'نص',
        element: null,
        contentElement: null,
        placeholder: null
    };
    
    layers.push(copy);
    activeLayerId = copy.id;
    updateAll();
    saveState();
    showToast('✅ تم نسخ الطبقة', 'success');
}
window.duplicateLayer = duplicateLayer;

function bringToFront() {
    if (activeLayerId === null) {
        showToast('⚠️ اختر طبقة أولاً', 'warning');
        return;
    }
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;
    
    const maxZIndex = Math.max(...layers.map(l => l.zIndex || 0));
    layer.zIndex = maxZIndex + 1;
    updateAll();
    saveState();
    showToast('✅ تم نقل الطبقة للأمام', 'success');
}
window.bringToFront = bringToFront;

function sendToBack() {
    if (activeLayerId === null) {
        showToast('⚠️ اختر طبقة أولاً', 'warning');
        return;
    }
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;
    
    const minZIndex = Math.min(...layers.map(l => l.zIndex || 0));
    layer.zIndex = minZIndex - 1;
    updateAll();
    saveState();
    showToast('✅ تم نقل الطبقة للخلف', 'success');
}
window.sendToBack = sendToBack;

function bringForward() {
    if (activeLayerId === null) {
        showToast('⚠️ اختر طبقة أولاً', 'warning');
        return;
    }
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;
    
    const currentZ = layer.zIndex || 0;
    const nextZ = currentZ + 1;
    
    const conflict = layers.find(l => l.id !== activeLayerId && (l.zIndex || 0) === nextZ);
    if (conflict) {
        conflict.zIndex = currentZ;
    }
    layer.zIndex = nextZ;
    updateAll();
    saveState();
    showToast('✅ تم نقل الطبقة خطوة للأمام', 'success');
}
window.bringForward = bringForward;

function sendBackward() {
    if (activeLayerId === null) {
        showToast('⚠️ اختر طبقة أولاً', 'warning');
        return;
    }
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;
    
    const currentZ = layer.zIndex || 0;
    const prevZ = currentZ - 1;
    
    const conflict = layers.find(l => l.id !== activeLayerId && (l.zIndex || 0) === prevZ);
    if (conflict) {
        conflict.zIndex = currentZ;
    }
    layer.zIndex = prevZ;
    updateAll();
    saveState();
    showToast('✅ تم نقل الطبقة خطوة للخلف', 'success');
}
window.sendBackward = sendBackward;

function updateLayerOpacity() {
    if (activeLayerId === null) {
        showToast('⚠️ اختر طبقة أولاً', 'warning');
        return;
    }
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;
    
    const opacityInput = document.getElementById('layerOpacity');
    const opacityDisplay = document.getElementById('opacityDisplay');
    if (!opacityInput) return;
    
    const value = parseInt(opacityInput.value);
    
    if (opacityDisplay) opacityDisplay.textContent = value + '%';
    
    const opacity = value / 100;
    if (layer.element) {
        layer.element.style.opacity = opacity;
    }
    layer.opacity = opacity;
    saveState();
}
window.updateLayerOpacity = updateLayerOpacity;

function enable3DPreview() {
    const frame = document.getElementById('canvasFrame');
    if (frame) {
        const currentTransform = frame.style.transform || '';
        if (currentTransform.includes('perspective') && !currentTransform.includes('0deg')) {
            frame.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
            showToast('✅ تم إلغاء المعاينة ثلاثية الأبعاد', 'info');
        } else {
            frame.style.transform = 'perspective(1000px) rotateY(-15deg) rotateX(5deg)';
            showToast('✅ تم تفعيل المعاينة ثلاثية الأبعاد', 'success');
        }
    }
}
window.enable3DPreview = enable3DPreview;

function setTextColor(color) {
    const colorInput = document.getElementById('textColor');
    if (colorInput) {
        colorInput.value = color;
        updateActiveText();
        
        document.querySelectorAll('.color-btn').forEach(btn => {
            const bgColor = btn.style.background || btn.style.backgroundColor;
            btn.classList.toggle('active', bgColor === color);
        });
    }
}
window.setTextColor = setTextColor;

function startEditingText(contentElement) {
    if (isEditing) return;
    isEditing = true;
    
    const layer = contentElement.closest('.layer');
    const layerData = layers.find(l => l.element === layer);
    if (!layerData) return;
    
    contentElement.classList.add('editing');
    contentElement.contentEditable = true;
    contentElement.focus();
    
    const range = document.createRange();
    range.selectNodeContents(contentElement);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    const finishEditing = function() {
        contentElement.classList.remove('editing');
        contentElement.contentEditable = false;
        isEditing = false;
        
        const newText = contentElement.textContent.trim() || 'نص';
        layerData.content = newText;
        layerData.text = newText;
        document.getElementById('textContent').value = newText;
        
        if (activeLayerId === layerData.id) {
            loadLayerControls(layerData.id);
        }
        
        saveState();
        contentElement.removeEventListener('blur', finishEditing);
        contentElement.removeEventListener('keydown', onKeyDown);
        showToast('✅ تم تحديث النص', 'success');
    };
    
    const onKeyDown = function(e) {
        if (e.key === 'Escape') {
            contentElement.textContent = layerData.content || 'نص';
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
window.startEditingText = startEditingText;

function triggerImageUploadForLayer(layerId) {
    const layerData = layers.find(l => l.id === layerId);
    if (!layerData || layerData.type !== 'image') {
        showToast('⚠️ هذه الطبقة ليست صورة', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) {
            document.body.removeChild(input);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(ev) {
            layerData.imageData = ev.target.result;
            layerData.isEmpty = false;
            renderLayersOptimized();
            showToast('✅ تم رفع الصورة بنجاح', 'success');
            saveState();
            document.body.removeChild(input);
        };
        reader.readAsDataURL(file);
        document.body.removeChild(input);
    };
    
    input.click();
}
window.triggerImageUploadForLayer = triggerImageUploadForLayer;

function enableAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (layers.length > 0 && currentTemplateId && isAdminUser) {
            updateAndSaveTemplate();
            console.log('💾 Auto-save performed');
        }
    }, 30000);
}
window.enableAutoSave = enableAutoSave;

function disableAutoSave() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
    }
}
window.disableAutoSave = disableAutoSave;

function restoreSession() {
    try {
        const saved = localStorage.getItem('tithkari_design_session');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.layers && data.layers.length > 0) {
                layers = data.layers;
                currentTemplateId = data.templateId;
                updateAll();
                showToast('🔄 تم استعادة الجلسة السابقة', 'info');
                return true;
            }
        }
    } catch (e) {
        console.warn('⚠️ لا يمكن استعادة الجلسة:', e);
    }
    return false;
}
window.restoreSession = restoreSession;

function saveSession() {
    try {
        const data = {
            layers: layers.map(l => ({ ...l })),
            templateId: currentTemplateId,
            timestamp: Date.now()
        };
        localStorage.setItem('tithkari_design_session', JSON.stringify(data));
    } catch (e) {
        console.warn('⚠️ لا يمكن حفظ الجلسة:', e);
    }
}
window.saveSession = saveSession;

// ============================================
// دوال الطبقات الأساسية
// ============================================
function addDefaultTextLayer() {
    const layer = {
        id: nextId++,
        type: 'text',
        content: 'المناسبة أو الرتبة',
        x: 25,
        y: 10,
        width: 50,
        height: 18,
        rotation: 0,
        zIndex: 1,
        fontFamily: 'Cairo',
        fontSize: 22,
        color: '#d4af37',
        bgColor: '#000000',
        bgEnabled: true,
        opacity: 1
    };
    layers.push(layer);
    return layer;
}
window.addDefaultTextLayer = addDefaultTextLayer;

function selectLayer(id) {
    if (activeLayerId === id) { 
        activeLayerId = null; 
        updateAll(); 
        return; 
    }
    activeLayerId = id;
    updateAll();
    loadLayerControls(id);
}
window.selectLayer = selectLayer;

function loadLayerControls(id) {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.type !== 'text') return;
    
    const textContent = document.getElementById('textContent');
    const fontFamily = document.getElementById('fontFamily');
    const fontSize = document.getElementById('fontSize');
    const fontSizeDisplay = document.getElementById('fontSizeDisplay');
    const textColor = document.getElementById('textColor');
    const textBgColor = document.getElementById('textBgColor');
    const textBgToggle = document.getElementById('textBgToggle');
    
    if (textContent) textContent.value = layer.content || '';
    if (fontFamily) fontFamily.value = layer.fontFamily || 'Cairo';
    if (fontSize) {
        fontSize.value = layer.fontSize || 18;
        if (fontSizeDisplay) fontSizeDisplay.textContent = layer.fontSize || 18;
    }
    if (textColor) textColor.value = layer.color || '#d4af37';
    if (textBgColor) textBgColor.value = layer.bgColor || '#000000';
    if (textBgToggle) textBgToggle.checked = layer.bgEnabled !== false;
}

function deselectLayer(e) { 
    if (e && e.target === e.currentTarget) { 
        activeLayerId = null; 
        updateAll(); 
    } 
}
window.deselectLayer = deselectLayer;

function deleteLayer(id) { 
    layers = layers.filter(l => l.id !== id); 
    if (activeLayerId === id) activeLayerId = null; 
    updateAll(); 
    showToast('تم حذف الطبقة', 'warning'); 
}
window.deleteLayer = deleteLayer;

function addTextLayer() {
    const layer = { 
        id: nextId++, 
        type: 'text', 
        content: 'نص جديد', 
        x: 20 + Math.random() * 30, 
        y: 20 + Math.random() * 30, 
        width: 30, 
        height: 15, 
        rotation: 0, 
        zIndex: layers.length + 1, 
        fontFamily: 'Cairo', 
        fontSize: 18, 
        color: '#d4af37', 
        bgColor: '#000000', 
        bgEnabled: true,
        opacity: 1
    };
    layers.push(layer);
    activeLayerId = layer.id;
    updateAll();
    loadLayerControls(layer.id);
    saveState();
    showToast('✅ تم إضافة طبقة نص - اسحب لتغيير المكان', 'success');
    return layer;
}
window.addTextLayer = addTextLayer;

function triggerImageUpload() { 
    const uploader = document.getElementById('imageUploader');
    if (uploader) uploader.click(); 
}
window.triggerImageUpload = triggerImageUpload;

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        const layer = { 
            id: nextId++, 
            type: 'image', 
            imageData: ev.target.result, 
            x: 20 + Math.random() * 30, 
            y: 20 + Math.random() * 30, 
            width: 30, 
            height: 30, 
            rotation: 0, 
            zIndex: layers.length + 1,
            opacity: 1
        };
        layers.push(layer);
        activeLayerId = layer.id;
        updateAll();
        saveState();
        showToast('✅ تم إضافة طبقة صورة - اسحب لتغيير المكان', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}
window.handleImageUpload = handleImageUpload;

function addEmptyImageLayer() {
    const layer = { 
        id: nextId++, 
        type: 'image', 
        imageData: null, 
        x: 20 + Math.random() * 30, 
        y: 20 + Math.random() * 30, 
        width: 30, 
        height: 30, 
        rotation: 0, 
        zIndex: layers.length + 1,
        opacity: 1
    };
    layers.push(layer);
    activeLayerId = layer.id;
    updateAll();
    saveState();
    showToast('✅ تم إضافة طبقة صورة فارغة - اسحب لتغيير المكان، انقر لرفع صورة', 'success');
    return layer;
}
window.addEmptyImageLayer = addEmptyImageLayer;

function updateActiveText() {
    if (activeLayerId === null) { 
        showToast('اختر طبقة نص أولاً', 'error'); 
        return; 
    }
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer || layer.type !== 'text') { 
        showToast('الطبقة المحددة ليست نصية', 'error'); 
        return; 
    }
    
    const textContent = document.getElementById('textContent');
    const fontFamily = document.getElementById('fontFamily');
    const fontSize = document.getElementById('fontSize');
    const fontSizeDisplay = document.getElementById('fontSizeDisplay');
    const textColor = document.getElementById('textColor');
    const textBgColor = document.getElementById('textBgColor');
    const textBgToggle = document.getElementById('textBgToggle');
    
    if (textContent) layer.content = textContent.value;
    if (fontFamily) layer.fontFamily = fontFamily.value;
    if (fontSize) {
        layer.fontSize = parseInt(fontSize.value);
        if (fontSizeDisplay) fontSizeDisplay.textContent = layer.fontSize;
    }
    if (textColor) layer.color = textColor.value;
    if (textBgColor) layer.bgColor = textBgColor.value;
    if (textBgToggle) layer.bgEnabled = textBgToggle.checked;
    
    renderLayersOptimized();
    saveState();
}
window.updateActiveText = updateActiveText;

// ============================================
// دوال التراجع والتقدم المحسنة
// ============================================
function saveState() {
    const state = {
        layers: layers.map(l => ({ 
            ...l, 
            element: null, 
            contentElement: null, 
            placeholder: null 
        })),
        activeId: activeLayerId
    };
    history.push(JSON.stringify(state));
    if (history.length > 50) history.shift();
    historyIndex = history.length - 1;
    saveSession();
}
window.saveState = saveState;

function undoAction() {
    if (historyIndex <= 0) { 
        showToast('⚠️ لا يوجد تراجع', 'warning'); 
        return; 
    }
    historyIndex--;
    restoreState(history[historyIndex]);
    showToast('↩️ تراجع', 'info');
}
window.undoAction = undoAction;

function redoAction() {
    if (historyIndex >= history.length - 1) { 
        showToast('⚠️ لا يوجد تقدم', 'warning'); 
        return; 
    }
    historyIndex++;
    restoreState(history[historyIndex]);
    showToast('↪️ تقدم', 'info');
}
window.redoAction = redoAction;

function restoreState(stateJson) {
    const state = JSON.parse(stateJson);
    layers = state.layers.map(l => ({ ...l }));
    activeLayerId = state.activeId;
    updateAll();
}
window.restoreState = restoreState;

// ============================================
// دوال التحويل
// ============================================
function updateTransform() {
    const tiltX = document.getElementById('tiltX');
    const tiltY = document.getElementById('tiltY');
    const rotateZ = document.getElementById('rotateZ');
    const canvasFrame = document.getElementById('canvasFrame');
    if (tiltX && tiltY && rotateZ && canvasFrame) {
        const x = tiltX.value, y = tiltY.value, z = rotateZ.value;
        canvasFrame.style.transform = `perspective(800px) rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;
    }
}
window.updateTransform = updateTransform;

function resetTransform() {
    const tiltX = document.getElementById('tiltX');
    const tiltY = document.getElementById('tiltY');
    const rotateZ = document.getElementById('rotateZ');
    const canvasFrame = document.getElementById('canvasFrame');
    if (tiltX) tiltX.value = 0;
    if (tiltY) tiltY.value = 0;
    if (rotateZ) rotateZ.value = 0;
    if (canvasFrame) canvasFrame.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    showToast('تم تصفير التحويل', 'success');
}
window.resetTransform = resetTransform;

// ============================================
// دوال العبارات
// ============================================
function applyQuote(text) {
    if (activeLayerId === null) { 
        showToast('اختر طبقة نص أولاً', 'error'); 
        return; 
    }
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer || layer.type !== 'text') { 
        showToast('الطبقة المحددة ليست نصية', 'error'); 
        return; 
    }
    layer.content = text;
    const textContent = document.getElementById('textContent');
    if (textContent) textContent.value = text;
    renderLayersOptimized();
    saveState();
    showToast('تم تطبيق العبارة', 'success');
}
window.applyQuote = applyQuote;

// ============================================
// ==== دوال التصدير المحسنة (إصلاح نهائي) ====
// ============================================

/**
 * تصدير التصميم كصورة PNG بجودة عالية
 * مع الحفاظ على جميع التعديلات والتنسيقات - إصلاح نهائي
 */
function exportDesignPNG() {
    showToast('⏳ جاري التقاط الصورة...', 'info');
    
    const frame = document.getElementById('canvasFrame');
    const rect = frame.getBoundingClientRect();
    
    // نسبة التكبير للحصول على جودة عالية
    const scale = 3;
    
    const canvas = document.createElement('canvas');
    const targetWidth = rect.width * scale;
    const targetHeight = rect.height * scale;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    
    // خلفية بيضاء
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // رسم الصورة الأساسية (الخلفية)
    const bgImg = document.getElementById('baseImage');
    const bg = new Image();
    bg.crossOrigin = 'anonymous';
    bg.src = bgImg.src;
    
    bg.onload = function() {
        // رسم الخلفية بحجم مناسب
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        drawAllLayers();
    };
    
    bg.onerror = function() {
        console.warn('⚠️ خطأ في تحميل الصورة الأساسية، استخدام الصورة الحالية');
        const imgElement = document.getElementById('baseImage');
        if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
            drawAllLayers();
        } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawAllLayers();
        }
    };
    
    function drawAllLayers() {
        if (layers.length === 0) {
            finishExport(canvas);
            return;
        }
        
        // ترتيب الطبقات حسب z-index
        const sortedLayers = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        let renderedCount = 0;
        const totalLayers = sortedLayers.length;
        
        sortedLayers.forEach(function(layer) {
            // الحصول على عنصر الطبقة
            const layerEl = layer.element;
            if (!layerEl) {
                renderedCount++;
                if (renderedCount === totalLayers) finishExport(canvas);
                return;
            }
            
            // حساب موقع وحجم الطبقة بالنسبة للإطار
            const layerRect = layerEl.getBoundingClientRect();
            
            // حساب الإحداثيات بالنسبة للإطار
            const x = ((layerRect.left - rect.left) / rect.width) * canvas.width;
            const y = ((layerRect.top - rect.top) / rect.height) * canvas.height;
            const w = (layerRect.width / rect.width) * canvas.width;
            const h = (layerRect.height / rect.height) * canvas.height;
            
            // تطبيق الشفافية
            ctx.globalAlpha = layer.opacity || 1;
            
            if (layer.type === 'text') {
                const contentEl = layer.contentElement || layerEl.querySelector('.text-content');
                if (contentEl) {
                    // الحصول على الخصائص المحسوبة من العنصر الفعلي
                    const style = window.getComputedStyle(contentEl);
                    
                    // الحصول على خصائص النص من العنصر الفعلي
                    const fontSize = parseFloat(style.fontSize) * scale;
                    const fontFamily = style.fontFamily || 'Cairo, sans-serif';
                    const fontWeight = style.fontWeight || '700';
                    const color = style.color || '#d4af37';
                    const textAlign = style.textAlign || 'center';
                    const bgColor = style.backgroundColor;
                    const hasBg = bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)';
                    const padding = style.padding || '4px 8px';
                    const text = contentEl.textContent || '';
                    const lines = text.split('\n');
                    
                    // حساب أبعاد النص
                    ctx.save();
                    
                    // تعيين الخط لحساب الأبعاد
                    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                    
                    // حساب عرض كل سطر
                    const lineWidths = lines.map(line => {
                        return ctx.measureText(line).width || fontSize * 0.5;
                    });
                    const maxLineWidth = Math.max(...lineWidths);
                    
                    // حساب ارتفاع النص الكلي
                    const lineHeight = fontSize * 1.4;
                    const totalTextHeight = lines.length * lineHeight;
                    
                    // حساب الهوامش الداخلية من العنصر الفعلي
                    const paddingValues = padding.split(' ');
                    let paddingX = fontSize * 0.4;
                    let paddingY = fontSize * 0.3;
                    
                    if (paddingValues.length >= 2) {
                        paddingY = parseFloat(paddingValues[0]) * scale || paddingY;
                        paddingX = parseFloat(paddingValues[1]) * scale || paddingX;
                    }
                    
                    // حساب أبعاد الخلفية
                    const bgWidth = maxLineWidth + paddingX * 2;
                    const bgHeight = totalTextHeight + paddingY * 2;
                    
                    // حساب موقع الخلفية (مركزية داخل مربع الطبقة)
                    const bgX = x + (w - bgWidth) / 2;
                    const bgY = y + (h - bgHeight) / 2;
                    
                    // تطبيق التدوير
                    if (layer.rotation) {
                        const centerX = x + w/2;
                        const centerY = y + h/2;
                        ctx.translate(centerX, centerY);
                        ctx.rotate((layer.rotation || 0) * Math.PI / 180);
                        ctx.translate(-centerX, -centerY);
                    }
                    
                    // رسم خلفية النص
                    if (hasBg) {
                        ctx.fillStyle = bgColor;
                        // رسم مستطيل الخلفية
                        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
                    }
                    
                    // رسم النص
                    ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    ctx.shadowBlur = 8;
                    ctx.fillStyle = color;
                    ctx.textAlign = textAlign;
                    ctx.textBaseline = 'middle';
                    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                    
                    // رسم كل سطر على حدة مع محاذاة مركزية
                    const startX = x + w / 2;
                    const startY = y + (h - totalTextHeight) / 2 + lineHeight / 2;
                    
                    lines.forEach(function(line, i) {
                        ctx.fillText(line, startX, startY + i * lineHeight);
                    });
                    
                    ctx.restore();
                }
                renderedCount++;
                if (renderedCount === totalLayers) finishExport(canvas);
                
            } else if (layer.type === 'image') {
                const imgElement = layerEl.querySelector('img');
                if (imgElement && imgElement.src) {
                    const imgObj = new Image();
                    imgObj.crossOrigin = 'anonymous';
                    imgObj.src = imgElement.src;
                    
                    imgObj.onload = function() {
                        // رسم الصورة مع الحفاظ على النسبة
                        const aspectRatio = imgObj.naturalWidth / imgObj.naturalHeight;
                        let drawW = w;
                        let drawH = h;
                        
                        if (w / h > aspectRatio) {
                            drawW = h * aspectRatio;
                        } else {
                            drawH = w / aspectRatio;
                        }
                        
                        const offsetX = (w - drawW) / 2;
                        const offsetY = (h - drawH) / 2;
                        
                        ctx.drawImage(imgObj, x + offsetX, y + offsetY, drawW, drawH);
                        
                        renderedCount++;
                        if (renderedCount === totalLayers) finishExport(canvas);
                    };
                    
                    imgObj.onerror = function() {
                        ctx.fillStyle = 'rgba(200,200,200,0.3)';
                        ctx.fillRect(x, y, w, h);
                        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, w, h);
                        renderedCount++;
                        if (renderedCount === totalLayers) finishExport(canvas);
                    };
                } else {
                    ctx.fillStyle = 'rgba(200,200,200,0.1)';
                    ctx.fillRect(x, y, w, h);
                    ctx.strokeStyle = 'rgba(200,200,200,0.3)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(x, y, w, h);
                    ctx.setLineDash([]);
                    renderedCount++;
                    if (renderedCount === totalLayers) finishExport(canvas);
                }
            } else {
                renderedCount++;
                if (renderedCount === totalLayers) finishExport(canvas);
            }
        });
    }
    
    function finishExport(canvas) {
        const link = document.createElement('a');
        const name = document.getElementById('productNameDisplay').textContent || 'درع_مخصص';
        const cleanName = name.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
        link.download = cleanName + '_' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        showToast('✅ تم تصدير التصميم بنجاح!', 'success');
    }
}
window.exportDesignPNG = exportDesignPNG;

/**
 * التقاط صورة التصميم (للاستخدام الداخلي) - نسخة محسنة نهائياً
 */
function captureDesignImage() {
    return new Promise(function(resolve, reject) {
        try {
            const frame = document.getElementById('canvasFrame');
            const rect = frame.getBoundingClientRect();
            
            const scale = 2;
            const canvas = document.createElement('canvas');
            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;
            const ctx = canvas.getContext('2d');
            
            // خلفية بيضاء
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const bgImg = document.getElementById('baseImage');
            const bg = new Image();
            bg.crossOrigin = 'anonymous';
            bg.src = bgImg.src;
            
            bg.onload = function() {
                ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
                drawLayersForCapture();
            };
            
            bg.onerror = function() {
                console.warn('⚠️ خطأ في تحميل الصورة الأساسية');
                drawLayersForCapture();
            };
            
            function drawLayersForCapture() {
                if (layers.length === 0) {
                    resolve(canvas.toDataURL('image/png', 0.95));
                    return;
                }
                
                const sortedLayers = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
                let rendered = 0;
                const total = sortedLayers.length;
                
                sortedLayers.forEach(function(layer) {
                    const layerEl = layer.element;
                    if (!layerEl) {
                        rendered++;
                        if (rendered === total) {
                            ctx.globalAlpha = 1;
                            resolve(canvas.toDataURL('image/png', 0.95));
                        }
                        return;
                    }
                    
                    const layerRect = layerEl.getBoundingClientRect();
                    const x = ((layerRect.left - rect.left) / rect.width) * canvas.width;
                    const y = ((layerRect.top - rect.top) / rect.height) * canvas.height;
                    const w = (layerRect.width / rect.width) * canvas.width;
                    const h = (layerRect.height / rect.height) * canvas.height;
                    
                    ctx.globalAlpha = layer.opacity || 1;
                    
                    if (layer.type === 'text') {
                        const contentEl = layer.contentElement || layerEl.querySelector('.text-content');
                        if (contentEl) {
                            const style = window.getComputedStyle(contentEl);
                            
                            const fontSize = parseFloat(style.fontSize) * scale;
                            const fontFamily = style.fontFamily || 'Cairo, sans-serif';
                            const fontWeight = style.fontWeight || '700';
                            const color = style.color || '#d4af37';
                            const textAlign = style.textAlign || 'center';
                            const bgColor = style.backgroundColor;
                            const hasBg = bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)';
                            const padding = style.padding || '4px 8px';
                            const text = contentEl.textContent || '';
                            const lines = text.split('\n');
                            
                            ctx.save();
                            
                            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                            
                            const lineWidths = lines.map(line => {
                                return ctx.measureText(line).width || fontSize * 0.5;
                            });
                            const maxLineWidth = Math.max(...lineWidths);
                            
                            const lineHeight = fontSize * 1.4;
                            const totalTextHeight = lines.length * lineHeight;
                            
                            const paddingValues = padding.split(' ');
                            let paddingX = fontSize * 0.4;
                            let paddingY = fontSize * 0.3;
                            
                            if (paddingValues.length >= 2) {
                                paddingY = parseFloat(paddingValues[0]) * scale || paddingY;
                                paddingX = parseFloat(paddingValues[1]) * scale || paddingX;
                            }
                            
                            const bgWidth = maxLineWidth + paddingX * 2;
                            const bgHeight = totalTextHeight + paddingY * 2;
                            
                            const bgX = x + (w - bgWidth) / 2;
                            const bgY = y + (h - bgHeight) / 2;
                            
                            if (layer.rotation) {
                                const centerX = x + w/2;
                                const centerY = y + h/2;
                                ctx.translate(centerX, centerY);
                                ctx.rotate((layer.rotation || 0) * Math.PI / 180);
                                ctx.translate(-centerX, -centerY);
                            }
                            
                            if (hasBg) {
                                ctx.fillStyle = bgColor;
                                ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
                            }
                            
                            ctx.shadowColor = 'rgba(0,0,0,0.3)';
                            ctx.shadowBlur = 8;
                            ctx.fillStyle = color;
                            ctx.textAlign = textAlign;
                            ctx.textBaseline = 'middle';
                            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                            
                            const startX = x + w / 2;
                            const startY = y + (h - totalTextHeight) / 2 + lineHeight / 2;
                            
                            lines.forEach(function(line, i) {
                                ctx.fillText(line, startX, startY + i * lineHeight);
                            });
                            
                            ctx.restore();
                        }
                        rendered++;
                        if (rendered === total) {
                            ctx.globalAlpha = 1;
                            resolve(canvas.toDataURL('image/png', 0.95));
                        }
                        
                    } else if (layer.type === 'image') {
                        const imgElement = layerEl.querySelector('img');
                        if (imgElement && imgElement.src) {
                            const imgObj = new Image();
                            imgObj.crossOrigin = 'anonymous';
                            imgObj.src = imgElement.src;
                            
                            imgObj.onload = function() {
                                const aspectRatio = imgObj.naturalWidth / imgObj.naturalHeight;
                                let drawW = w;
                                let drawH = h;
                                
                                if (w / h > aspectRatio) {
                                    drawW = h * aspectRatio;
                                } else {
                                    drawH = w / aspectRatio;
                                }
                                
                                const offsetX = (w - drawW) / 2;
                                const offsetY = (h - drawH) / 2;
                                
                                ctx.drawImage(imgObj, x + offsetX, y + offsetY, drawW, drawH);
                                
                                rendered++;
                                if (rendered === total) {
                                    ctx.globalAlpha = 1;
                                    resolve(canvas.toDataURL('image/png', 0.95));
                                }
                            };
                            
                            imgObj.onerror = function() {
                                rendered++;
                                if (rendered === total) {
                                    ctx.globalAlpha = 1;
                                    resolve(canvas.toDataURL('image/png', 0.95));
                                }
                            };
                        } else {
                            rendered++;
                            if (rendered === total) {
                                ctx.globalAlpha = 1;
                                resolve(canvas.toDataURL('image/png', 0.95));
                            }
                        }
                    } else {
                        rendered++;
                        if (rendered === total) {
                            ctx.globalAlpha = 1;
                            resolve(canvas.toDataURL('image/png', 0.95));
                        }
                    }
                });
            }
        } catch (error) {
            reject(error);
        }
    });
}
window.captureDesignImage = captureDesignImage;

/**
 * معاينة التصدير قبل الحفظ
 */
function previewExport() {
    showToast('⏳ جاري تحضير المعاينة...', 'info');
    
    const frame = document.getElementById('canvasFrame');
    const rect = frame.getBoundingClientRect();
    
    const scale = 1.5;
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const bgImg = document.getElementById('baseImage');
    const bg = new Image();
    bg.crossOrigin = 'anonymous';
    bg.src = bgImg.src;
    
    bg.onload = function() {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        drawPreviewLayers();
    };
    
    bg.onerror = function() {
        drawPreviewLayers();
    };
    
    function drawPreviewLayers() {
        const sortedLayers = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        sortedLayers.forEach(function(layer) {
            const layerEl = layer.element;
            if (!layerEl) return;
            
            const layerRect = layerEl.getBoundingClientRect();
            const x = ((layerRect.left - rect.left) / rect.width) * canvas.width;
            const y = ((layerRect.top - rect.top) / rect.height) * canvas.height;
            const w = (layerRect.width / rect.width) * canvas.width;
            const h = (layerRect.height / rect.height) * canvas.height;
            
            ctx.globalAlpha = layer.opacity || 1;
            
            if (layer.type === 'text') {
                const contentEl = layer.contentElement || layerEl.querySelector('.text-content');
                if (contentEl) {
                    const style = window.getComputedStyle(contentEl);
                    const fontSize = parseFloat(style.fontSize) * scale;
                    const fontFamily = style.fontFamily || 'Cairo, sans-serif';
                    const fontWeight = style.fontWeight || '700';
                    const color = style.color || '#d4af37';
                    const textAlign = style.textAlign || 'center';
                    const bgColor = style.backgroundColor;
                    const hasBg = bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)';
                    const padding = style.padding || '4px 8px';
                    const text = contentEl.textContent || '';
                    const lines = text.split('\n');
                    
                    ctx.save();
                    
                    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                    
                    const lineWidths = lines.map(line => {
                        return ctx.measureText(line).width || fontSize * 0.5;
                    });
                    const maxLineWidth = Math.max(...lineWidths);
                    
                    const lineHeight = fontSize * 1.4;
                    const totalTextHeight = lines.length * lineHeight;
                    
                    const paddingValues = padding.split(' ');
                    let paddingX = fontSize * 0.4;
                    let paddingY = fontSize * 0.3;
                    
                    if (paddingValues.length >= 2) {
                        paddingY = parseFloat(paddingValues[0]) * scale || paddingY;
                        paddingX = parseFloat(paddingValues[1]) * scale || paddingX;
                    }
                    
                    const bgWidth = maxLineWidth + paddingX * 2;
                    const bgHeight = totalTextHeight + paddingY * 2;
                    
                    const bgX = x + (w - bgWidth) / 2;
                    const bgY = y + (h - bgHeight) / 2;
                    
                    if (layer.rotation) {
                        const centerX = x + w/2;
                        const centerY = y + h/2;
                        ctx.translate(centerX, centerY);
                        ctx.rotate((layer.rotation || 0) * Math.PI / 180);
                        ctx.translate(-centerX, -centerY);
                    }
                    
                    if (hasBg) {
                        ctx.fillStyle = bgColor;
                        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
                    }
                    
                    ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    ctx.shadowBlur = 8;
                    ctx.fillStyle = color;
                    ctx.textAlign = textAlign;
                    ctx.textBaseline = 'middle';
                    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                    
                    const startX = x + w / 2;
                    const startY = y + (h - totalTextHeight) / 2 + lineHeight / 2;
                    
                    lines.forEach(function(line, i) {
                        ctx.fillText(line, startX, startY + i * lineHeight);
                    });
                    
                    ctx.restore();
                }
            } else if (layer.type === 'image') {
                const imgElement = layerEl.querySelector('img');
                if (imgElement && imgElement.src) {
                    const imgObj = new Image();
                    imgObj.crossOrigin = 'anonymous';
                    imgObj.src = imgElement.src;
                    
                    imgObj.onload = function() {
                        const aspectRatio = imgObj.naturalWidth / imgObj.naturalHeight;
                        let drawW = w;
                        let drawH = h;
                        
                        if (w / h > aspectRatio) {
                            drawW = h * aspectRatio;
                        } else {
                            drawH = w / aspectRatio;
                        }
                        
                        const offsetX = (w - drawW) / 2;
                        const offsetY = (h - drawH) / 2;
                        
                        ctx.drawImage(imgObj, x + offsetX, y + offsetY, drawW, drawH);
                    };
                    
                    imgObj.onerror = function() {
                        ctx.fillStyle = 'rgba(200,200,200,0.3)';
                        ctx.fillRect(x, y, w, h);
                        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, w, h);
                    };
                }
            }
        });
        
        // عرض المعاينة في نافذة منبثقة
        const previewWindow = window.open('', 'معاينة التصميم', 'width=400,height=500');
        if (previewWindow) {
            previewWindow.document.write(`
                <html dir="rtl">
                <head><title>معاينة التصميم</title>
                <style>
                    body { margin: 0; display: flex; justify-content: center; align-items: center; background: #0a0a12; min-height: 100vh; }
                    img { max-width: 100%; max-height: 100vh; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
                </style>
                </head>
                <body>
                    <img src="${canvas.toDataURL('image/png', 0.95)}" alt="معاينة التصميم" />
                </body>
                </html>
            `);
            previewWindow.document.close();
            showToast('✅ تم فتح نافذة المعاينة', 'success');
        } else {
            showToast('⚠️ تم حظر النافذة المنبثقة، يرجى السماح بها', 'warning');
        }
    }
}
window.previewExport = previewExport;

// ============================================
// دوال إتمام الطلب
// ============================================
async function checkoutDirectly() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.classList.add('active');
    
    try {
        if (layers.length === 0) {
            showToast('⚠️ لا توجد طبقات لحفظها، أضف طبقات أولاً', 'error');
            if (loading) loading.classList.remove('active');
            return;
        }
        
        const designImage = await captureDesignImage();
        const layersData = collectLayersData();
        const productName = document.getElementById('productNameDisplay').textContent || 'درع مخصص';
        const productPrice = parseFloat(document.getElementById('designPrice').value) || 199;
        
        const customizedProduct = {
            id: currentProductId || 'custom_' + Date.now(),
            name: productName,
            price: productPrice,
            description: document.getElementById('designDescription').value || 'درع مخصص حسب الطلب',
            image_url: designImage,
            template_id: currentTemplateId,
            isCustomized: true,
            customizationData: {
                layers: layersData,
                baseImage: document.getElementById('baseImage').src,
                referenceImage: document.getElementById('referenceImage').src,
                templateId: currentTemplateId,
                productId: currentProductId
            },
            quantity: 1,
            status: 'active'
        };
        
        console.log('📦 المنتج المخصص:', customizedProduct);
        
        let cart = JSON.parse(localStorage.getItem('tithkari_cart') || '[]');
        cart.push(customizedProduct);
        localStorage.setItem('tithkari_cart', JSON.stringify(cart));
        
        const designData = {
            id: 'design_' + Date.now(),
            customerName: 'زبون',
            date: new Date().toISOString(),
            layers: layers.map(l => ({ ...l })),
            baseImage: document.getElementById('baseImage').src,
            referenceImage: document.getElementById('referenceImage').src,
            productName: productName,
            productId: currentProductId,
            designImage: designImage
        };
        
        let designs = JSON.parse(localStorage.getItem('tithkari_customer_designs') || '[]');
        designs.push(designData);
        localStorage.setItem('tithkari_customer_designs', JSON.stringify(designs));
        
        showToast('✅ تم إضافة التصميم للسلة! جاري التوجيه...', 'success');
        
        setTimeout(function() {
            window.location.href = 'checkout.html?product=' + encodeURIComponent(JSON.stringify(customizedProduct));
        }, 1000);
        
    } catch (error) {
        console.error('❌ خطأ في إتمام الطلب:', error);
        showToast('❌ حدث خطأ في إتمام الطلب: ' + error.message, 'error');
    } finally {
        if (loading) loading.classList.remove('active');
    }
}
window.checkoutDirectly = checkoutDirectly;

function addDesignToCart() {
    showToast('🛒 تم إضافة التصميم إلى السلة', 'success');
}
window.addDesignToCart = addDesignToCart;

// ============================================
// دوال جمع بيانات الطبقات
// ============================================
function collectLayersData() {
    return layers.map(l => ({
        id: l.id,
        type: l.type,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        rotation: l.rotation || 0,
        zIndex: l.zIndex || 1,
        content: l.content || null,
        fontFamily: l.fontFamily || 'Cairo',
        fontSize: l.fontSize || 18,
        color: l.color || '#d4af37',
        bgColor: l.bgColor || '#000000',
        bgEnabled: l.bgEnabled !== false,
        imageData: l.imageData || null,
        opacity: l.opacity || 1
    }));
}
window.collectLayersData = collectLayersData;

// ============================================
// دوال القوالب المحسنة (مختصرة للحفاظ على المساحة)
// ============================================
async function updateAndSaveTemplate() {
    if (!isAdminUser) {
        showToast('⚠️ فقط المسؤول يمكنه تحديث القوالب', 'error');
        return;
    }
    
    if (layers.length === 0) {
        showToast('⚠️ لا توجد طبقات لحفظها', 'error');
        return;
    }

    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.classList.add('active');

    try {
        const productSelect = document.getElementById('productSelect');
        const linkedProductId = productSelect ? productSelect.value : currentProductId;
        
        if (!linkedProductId) {
            showToast('⚠️ يرجى اختيار منتج أولاً', 'warning');
            if (loading) loading.classList.remove('active');
            return;
        }

        const name = document.getElementById('designName').value.trim() || document.getElementById('productNameDisplay').textContent || 'قالب مخصص';
        const layersData = collectLayersData();
        
        const templateData = {
            name: name,
            image_url: document.getElementById('baseImage').src,
            base_image: document.getElementById('baseImage').src,
            reference_image: document.getElementById('referenceImage').src,
            layers: layersData,
            linked_product_id: linkedProductId,
            price: parseFloat(document.getElementById('designPrice').value) || 199,
            promo_text: document.getElementById('promoText').value || '',
            promo_type: document.getElementById('promoType').value || 'custom',
            status: 'active',
            is_custom: true,
            version: '2.0',
            updated_at: new Date().toISOString()
        };

        const desc = document.getElementById('designDescription').value || '';
        if (desc) {
            templateData.description = desc;
        }

        console.log('📦 حفظ/تحديث القالب:', templateData);

        let result;
        let isUpdate = false;

        if (currentTemplateId) {
            const { error } = await supabase
                .from('templates')
                .update(templateData)
                .eq('id', currentTemplateId);

            if (error) {
                console.error('❌ خطأ في تحديث القالب:', error);
                if (error.message && error.message.includes('description')) {
                    delete templateData.description;
                    const { error: error2 } = await supabase
                        .from('templates')
                        .update(templateData)
                        .eq('id', currentTemplateId);
                    if (error2) {
                        throw new Error(error2.message);
                    }
                } else {
                    throw new Error(error.message);
                }
            }
            isUpdate = true;
            result = { id: currentTemplateId };
        } else {
            const { data, error } = await supabase
                .from('templates')
                .insert(templateData)
                .select()
                .single();

            if (error) {
                console.error('❌ خطأ في حفظ القالب:', error);
                if (error.message && error.message.includes('description')) {
                    delete templateData.description;
                    const { data: data2, error: error2 } = await supabase
                        .from('templates')
                        .insert(templateData)
                        .select()
                        .single();
                    if (error2) {
                        throw new Error(error2.message);
                    }
                    result = data2;
                } else {
                    throw new Error(error.message);
                }
            } else {
                result = data;
            }
            currentTemplateId = result.id;
        }

        await linkTemplateToProduct(result.id, linkedProductId);

        const { error: productError } = await supabase
            .from('products')
            .update({
                template_id: result.id,
                template_image: document.getElementById('baseImage').src,
                updated_at: new Date().toISOString()
            })
            .eq('id', linkedProductId);

        if (productError) {
            console.warn('⚠️ تحديث المنتج:', productError);
        }

        await loadTemplates();
        await loadProductsList();
        
        document.getElementById('productNameDisplay').textContent = name;
        
        showToast(`✅ ${isUpdate ? 'تم تحديث' : 'تم حفظ'} القالب "${name}" وربطه بالمنتج بنجاح!`, 'success');
        
        if (result.id) {
            await loadTemplateForEdit(result.id);
        }

    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    } finally {
        if (loading) loading.classList.remove('active');
    }
}
window.updateAndSaveTemplate = updateAndSaveTemplate;

async function saveCurrentTemplate() {
    await updateAndSaveTemplate();
}
window.saveCurrentTemplate = saveCurrentTemplate;

async function deleteCurrentTemplate() {
    if (!isAdminUser) {
        showToast('⚠️ فقط المسؤول يمكنه حذف القوالب', 'error');
        return;
    }
    
    if (!currentTemplateId) {
        showToast('⚠️ اختر قالباً للحذف', 'warning');
        return;
    }

    if (!confirm('⚠️ هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع!')) return;

    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.classList.add('active');

    try {
        const { error } = await supabase
            .from('templates')
            .update({ status: 'inactive' })
            .eq('id', currentTemplateId);

        if (error) {
            showToast('❌ خطأ في حذف القالب: ' + error.message, 'error');
        } else {
            showToast('✅ تم حذف القالب بنجاح', 'success');
            currentTemplateId = null;
            loadTemplates();
            loadProductsList();
        }
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    } finally {
        if (loading) loading.classList.remove('active');
    }
}
window.deleteCurrentTemplate = deleteCurrentTemplate;

async function loadTemplates() {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ خطأ في تحميل القوالب:', error);
            return;
        }

        renderTemplates(data || []);
        console.log('✅ تم تحميل ' + (data ? data.length : 0) + ' قالب من Supabase');
    } catch (error) {
        console.error('❌ خطأ:', error);
    }
}
window.loadTemplates = loadTemplates;

function renderTemplates(templates) {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;
    
    if (!templates || templates.length === 0) {
        grid.innerHTML = '<p style="color:#9ca3af;font-size:9px;">لا توجد قوالب</p>';
        return;
    }
    
    grid.innerHTML = '';
    templates.forEach(t => {
        const div = document.createElement('div');
        div.className = 'template-thumb';
        const imgSrc = t.image_url || t.base_image || t.image || 'https://i.ibb.co/vxn3p7C7/Gemini-Generated-Image-g2xtelg2xtelg2xt.png';
        div.innerHTML = `<img src="${imgSrc}" alt="${t.name}"><span>${t.name}</span>`;
        div.onclick = () => loadTemplateForEdit(t.id);
        grid.appendChild(div);
    });
}
window.renderTemplates = renderTemplates;

async function loadTemplateForEdit(templateId) {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (error || !data) {
            showToast('⚠️ القالب غير موجود', 'error');
            return;
        }

        currentTemplateId = data.id;
        isUsingProductImage = false;
        
        const imgSrc = data.image_url || data.base_image || data.image || 'https://i.ibb.co/vxn3p7C7/Gemini-Generated-Image-g2xtelg2xtelg2xt.png';
        document.getElementById('baseImage').src = imgSrc;
        document.getElementById('referenceImage').src = data.reference_image || data.referenceImage || imgSrc;
        document.getElementById('productNameDisplay').textContent = data.name;
        document.getElementById('designName').value = data.name || '';
        document.getElementById('designDescription').value = data.description || '';
        document.getElementById('designPrice').value = data.price || 199;
        document.getElementById('promoText').value = data.promo_text || '';
        document.getElementById('promoType').value = data.promo_type || 'custom';

        layers = [];
        activeLayerId = null;
        nextId = 1;

        if (data.layers && data.layers.length > 0) {
            data.layers.forEach(layerData => {
                if (layerData.type === 'text') {
                    layers.push({
                        id: nextId++,
                        type: 'text',
                        content: layerData.content || layerData.text || 'نص',
                        x: layerData.x || 20,
                        y: layerData.y || 30,
                        width: layerData.width || 60,
                        height: layerData.height || 15,
                        rotation: layerData.rotation || 0,
                        zIndex: layerData.zIndex || layers.length + 1,
                        fontFamily: layerData.fontFamily || 'Cairo',
                        fontSize: layerData.fontSize || 18,
                        color: layerData.color || '#d4af37',
                        bgColor: layerData.bgColor || '#000000',
                        bgEnabled: layerData.bgEnabled !== false,
                        opacity: layerData.opacity || 1
                    });
                } else if (layerData.type === 'image') {
                    layers.push({
                        id: nextId++,
                        type: 'image',
                        imageData: layerData.imageData || null,
                        x: layerData.x || 20,
                        y: layerData.y || 30,
                        width: layerData.width || 30,
                        height: layerData.height || 30,
                        rotation: layerData.rotation || 0,
                        zIndex: layerData.zIndex || layers.length + 1,
                        opacity: layerData.opacity || 1
                    });
                }
            });
        }

        updateAll();
        if (layers.length > 0) {
            activeLayerId = layers[0].id;
            loadLayerControls(layers[0].id);
            updateAll();
        }
        saveState();
        showToast('✅ تم تحميل القالب: ' + data.name, 'success');
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ في تحميل القالب', 'error');
    }
}
window.loadTemplateForEdit = loadTemplateForEdit;

async function loadProductsList() {
    const select = document.getElementById('productSelect');
    if (!select) return;
    
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, price, image_url, template_image, template_data, template_id')
            .eq('status', 'active')
            .order('name');
        
        if (error) {
            console.error('❌ خطأ في تحميل المنتجات:', error);
            return;
        }
        
        productsList = products || [];
        
        select.innerHTML = '<option value="">-- اختر منتجاً لعرض قالبـه --</option>';
        if (products && products.length > 0) {
            products.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                const hasTemplate = p.template_id || p.template_image || p.template_data;
                option.textContent = p.name + ' (' + (p.price || 0) + ' ر.س)' + (hasTemplate ? ' ✅' : '');
                select.appendChild(option);
            });
        }
        
        const quoteProductsSelect = document.getElementById('adminQuoteProducts');
        if (quoteProductsSelect) {
            quoteProductsSelect.innerHTML = '<option value="all">جميع المنتجات</option>';
            if (products && products.length > 0) {
                products.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.name;
                    quoteProductsSelect.appendChild(opt);
                });
            }
        }
        
        const linkSelect = document.getElementById('productLinkSelect');
        if (linkSelect) {
            linkSelect.innerHTML = '<option value="">-- غير مرتبط بمنتج --</option>';
            if (products && products.length > 0) {
                products.forEach(p => {
                    linkSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
                });
            }
        }
        
        console.log('✅ تم تحميل ' + (products ? products.length : 0) + ' منتج من Supabase');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
        showToast('⚠️ خطأ في تحميل المنتجات', 'error');
    }
}
window.loadProductsList = loadProductsList;

async function loadProductForCustomization(productId) {
    if (!productId) {
        showToast('⚠️ يرجى اختيار منتج', 'warning');
        return;
    }
    
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.classList.add('active');
    
    try {
        console.log('📦 تحميل المنتج من Supabase:', productId);
        showToast('⏳ جاري تحميل المنتج...', 'info');
        
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error || !product) {
            showToast('⚠️ المنتج غير موجود', 'error');
            if (loading) loading.classList.remove('active');
            return;
        }
        
        console.log('✅ تم العثور على المنتج:', product.name);
        
        document.getElementById('productNameDisplay').textContent = product.name || 'درع مخصص';
        document.getElementById('productPrice').textContent = product.price || '-';
        document.getElementById('productStatus').textContent = product.status || 'متوفر';
        currentProductId = product.id;
        currentProductData = product;
        
        if (product.image_url) {
            document.getElementById('referenceImage').src = product.image_url;
        }
        
        renderQuoteButtons();
        
        let templateLoaded = false;
        
        if (product.template_id) {
            const { data: template, error: templateError } = await supabase
                .from('templates')
                .select('*')
                .eq('id', product.template_id)
                .single();
            
            if (!templateError && template) {
                await loadTemplateForEdit(template.id);
                templateLoaded = true;
                console.log('✅ تم تحميل القالب المرتبط بالمنتج:', template.name);
            }
        }
        
        if (!templateLoaded && product.template_data) {
            const templateData = typeof product.template_data === 'string' 
                ? JSON.parse(product.template_data) 
                : product.template_data;
            
            if (templateData && templateData.layers && templateData.layers.length > 0) {
                applyTemplateData(templateData);
                templateLoaded = true;
            }
        }
        
        if (!templateLoaded && product.template_image) {
            document.getElementById('baseImage').src = product.template_image;
            templateLoaded = true;
            showToast('✅ تم تحميل صورة القالب', 'success');
        }
        
        if (!templateLoaded) {
            isUsingProductImage = true;
            const productImage = product.image_url || 'https://i.ibb.co/vxn3p7C7/Gemini-Generated-Image-g2xtelg2xtelg2xt.png';
            document.getElementById('baseImage').src = productImage;
            document.getElementById('referenceImage').src = productImage;
            showToast('✅ تم تحميل صورة المنتج كقالب', 'success');
            
            layers = [];
            activeLayerId = null;
            nextId = 1;
            addDefaultTextLayer();
            addTextLayer('اسم صاحب الإهداء', '42%', '5%', '90%', '45px');
            addTextLayer('عبارة الإهداء أو التكريم', '52%', '5%', '90%', '30%');
            updateAll();
            saveState();
        }
        
        const select = document.getElementById('productSelect');
        if (select) select.value = productId;
        
        const designName = document.getElementById('designName');
        if (designName) designName.value = product.name;
        const designPrice = document.getElementById('designPrice');
        if (designPrice) designPrice.value = product.price || 199;
        
        saveSession();
        
        console.log('✅ تم تحميل المنتج بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتج:', error);
        showToast('❌ حدث خطأ في تحميل المنتج: ' + error.message, 'error');
    } finally {
        if (loading) loading.classList.remove('active');
    }
}
window.loadProductForCustomization = loadProductForCustomization;

async function linkTemplateToProduct(templateId, productId) {
    if (!templateId || !productId) {
        console.warn('⚠️ لا يمكن الربط: templateId أو productId غير موجود');
        return false;
    }

    try {
        console.log('🔗 ربط القالب بالمنتج:', { templateId, productId });
        
        const { error } = await supabase
            .from('products')
            .update({ 
                template_id: templateId,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId);

        if (error) {
            console.error('❌ خطأ في ربط القالب:', error);
            return false;
        }

        console.log('✅ تم ربط القالب بالمنتج بنجاح');
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في ربط القالب:', error);
        return false;
    }
}
window.linkTemplateToProduct = linkTemplateToProduct;

function syncTemplateToProduct() {
    if (!isAdminUser) {
        showToast('⚠️ فقط المسؤول يمكنه ربط القوالب', 'error');
        return;
    }
    
    if (!currentTemplateId) {
        showToast('⚠️ اختر قالباً أولاً', 'warning');
        return;
    }
    
    const productSelect = document.getElementById('productSelect');
    const productId = productSelect ? productSelect.value : null;
    
    if (!productId) {
        showToast('⚠️ اختر منتجاً للربط', 'warning');
        return;
    }
    
    linkTemplateToProduct(currentTemplateId, productId);
}
window.syncTemplateToProduct = syncTemplateToProduct;

function onProductSelectChange() {
    const select = document.getElementById('productSelect');
    const productId = select.value;
    if (productId) {
        currentProductId = productId;
        loadProductForCustomization(productId);
        renderQuoteButtons();
    }
}
window.onProductSelectChange = onProductSelectChange;

function loadSelectedProductTemplate() {
    const select = document.getElementById('productSelect');
    const productId = select.value;
    if (productId) {
        currentProductId = productId;
        loadProductForCustomization(productId);
        renderQuoteButtons();
    } else {
        showToast('⚠️ يرجى اختيار منتج أولاً', 'warning');
    }
}
window.loadSelectedProductTemplate = loadSelectedProductTemplate;

function applyTemplateData(templateData) {
    if (!templateData) return;
    
    layers = [];
    activeLayerId = null;
    nextId = 1;
    
    if (templateData.image_url || templateData.base_image || templateData.image) {
        document.getElementById('baseImage').src = templateData.image_url || templateData.base_image || templateData.image;
    }
    
    if (templateData.reference_image || templateData.referenceImage) {
        document.getElementById('referenceImage').src = templateData.reference_image || templateData.referenceImage;
    }
    
    if (templateData.name) {
        document.getElementById('productNameDisplay').textContent = templateData.name;
    }
    
    const layersData = templateData.layers || [];
    if (layersData.length > 0) {
        layersData.forEach(layerData => {
            if (layerData.type === 'text') {
                layers.push({
                    id: nextId++,
                    type: 'text',
                    content: layerData.content || layerData.text || 'نص',
                    x: layerData.x || 20,
                    y: layerData.y || 30,
                    width: layerData.width || 60,
                    height: layerData.height || 15,
                    rotation: layerData.rotation || 0,
                    zIndex: layerData.zIndex || layers.length + 1,
                    fontFamily: layerData.fontFamily || 'Cairo',
                    fontSize: layerData.fontSize || 18,
                    color: layerData.color || '#d4af37',
                    bgColor: layerData.bgColor || '#000000',
                    bgEnabled: layerData.bgEnabled !== false,
                    opacity: layerData.opacity || 1
                });
            } else if (layerData.type === 'image') {
                layers.push({
                    id: nextId++,
                    type: 'image',
                    imageData: layerData.imageData || null,
                    x: layerData.x || 20,
                    y: layerData.y || 30,
                    width: layerData.width || 30,
                    height: layerData.height || 30,
                    rotation: layerData.rotation || 0,
                    zIndex: layerData.zIndex || layers.length + 1,
                    opacity: layerData.opacity || 1
                });
            }
        });
    }
    
    updateAll();
    if (layers.length > 0) {
        activeLayerId = layers[0].id;
        loadLayerControls(layers[0].id);
        updateAll();
    }
    saveState();
    showToast('✅ تم تطبيق القالب بنجاح', 'success');
}
window.applyTemplateData = applyTemplateData;

function loadProductFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');
    
    if (productId) {
        console.log('📦 تحميل المنتج من الرابط:', productId);
        setTimeout(() => {
            loadProductForCustomization(productId);
        }, 500);
        return true;
    }
    return false;
}
window.loadProductFromUrl = loadProductFromUrl;

// ============================================
// دوال إدارة العبارات (مختصرة)
// ============================================
function loadAdminQuotes() {
    try {
        const saved = localStorage.getItem('tithkari_admin_quotes');
        if (saved) {
            adminQuotes = JSON.parse(saved);
        } else {
            adminQuotes = [
                { id: 'q1', text: 'بكل فخر واعتزاز، نقدم هذا الدرع تعبيراً عن شكرنا وتقديرنا لجهودكم المتميزة.', tags: ['شكر', 'تقدير'], products: ['all'] },
                { id: 'q2', text: 'من وفاء وولاء، نهديكم هذا الدرع رمزاً للعرفان والامتنان على عطائكم المستمر.', tags: ['وفاء', 'عرفان'], products: ['all'] },
                { id: 'q3', text: 'تميزتم فأبدعتم، وهذا الدرع شهادة على إخلاصكم وتفانيكم في العمل.', tags: ['تميز', 'إبداع'], products: ['all'] },
                { id: 'q4', text: 'تقديراً لعطائكم وإخلاصكم، نمنحكم هذا الدرع كرمز للفخر والاعتزاز.', tags: ['تكريم', 'تقدير'], products: ['all'] },
                { id: 'q5', text: 'مسيرة عطاء حافلة بالإنجازات، وهذا الدرع تكريم لمسيرتكم المباركة.', tags: ['مسيرة', 'عطاء'], products: ['all'] }
            ];
            localStorage.setItem('tithkari_admin_quotes', JSON.stringify(adminQuotes));
        }
        renderAdminQuotes();
        renderQuoteButtons();
    } catch (e) {
        console.error('❌ خطأ في تحميل العبارات:', e);
    }
}
window.loadAdminQuotes = loadAdminQuotes;

function renderAdminQuotes() {
    const container = document.getElementById('adminQuotesList');
    if (!container) return;
    
    if (adminQuotes.length === 0) {
        container.innerHTML = '<p style="color:var(--studio-muted);font-size:9px;">لا توجد عبارات مضافة</p>';
        return;
    }
    
    container.innerHTML = '';
    adminQuotes.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = 'quote-item-admin';
        div.innerHTML = `
            <span class="quote-text">${q.text.substring(0, 50)}${q.text.length > 50 ? '...' : ''}</span>
            <span class="quote-tags">${q.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</span>
            <div class="quote-actions">
                <button onclick="applyQuote('${q.text.replace(/'/g, "\\'")}')" title="تطبيق"><i class="fas fa-check"></i></button>
                <button class="delete" onclick="deleteAdminQuote(${index})" title="حذف"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}
window.renderAdminQuotes = renderAdminQuotes;

function renderQuoteButtons() {
    const container = document.getElementById('quoteButtonsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const currentProduct = currentProductId || 'all';
    
    let filteredQuotes = adminQuotes.filter(q => 
        q.products.includes('all') || q.products.includes(currentProduct)
    );
    
    if (filteredQuotes.length === 0) {
        const emptyMsg = document.createElement('span');
        emptyMsg.style.cssText = 'color:var(--studio-muted);font-size:8px;';
        emptyMsg.textContent = 'لا توجد عبارات لهذا المنتج';
        container.appendChild(emptyMsg);
        return;
    }
    
    filteredQuotes.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'btn-sm btn-dark';
        const displayText = q.text.length > 25 ? q.text.substring(0, 25) + '...' : q.text;
        btn.textContent = '📝 ' + displayText;
        btn.title = q.text + '\n🏷️ ' + q.tags.join(', ');
        btn.onclick = () => applyQuote(q.text);
        container.appendChild(btn);
    });
}
window.renderQuoteButtons = renderQuoteButtons;

function addAdminQuote() {
    if (!isAdminUser) {
        showToast('⚠️ فقط المسؤول يمكنه إضافة عبارات', 'error');
        return;
    }
    
    const text = document.getElementById('adminQuoteText').value.trim();
    const tagsInput = document.getElementById('adminQuoteTags').value.trim();
    const productsSelect = document.getElementById('adminQuoteProducts');
    const selectedProducts = Array.from(productsSelect.selectedOptions).map(opt => opt.value);
    
    if (!text) {
        showToast('⚠️ الرجاء كتابة العبارة', 'warning');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : ['عام'];
    const products = selectedProducts.length > 0 ? selectedProducts : ['all'];
    
    const newQuote = {
        id: 'q_' + Date.now(),
        text: text,
        tags: tags,
        products: products,
        created_at: new Date().toISOString()
    };
    
    adminQuotes.push(newQuote);
    localStorage.setItem('tithkari_admin_quotes', JSON.stringify(adminQuotes));
    
    document.getElementById('adminQuoteText').value = '';
    document.getElementById('adminQuoteTags').value = '';
    
    saveQuotesToSupabase();
    
    renderAdminQuotes();
    renderQuoteButtons();
    showToast('✅ تم إضافة العبارة وتحديثها للزبائن', 'success');
}
window.addAdminQuote = addAdminQuote;

function deleteAdminQuote(index) {
    if (!isAdminUser) {
        showToast('⚠️ فقط المسؤول يمكنه حذف العبارات', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذه العبارة؟')) return;
    adminQuotes.splice(index, 1);
    localStorage.setItem('tithkari_admin_quotes', JSON.stringify(adminQuotes));
    
    saveQuotesToSupabase();
    
    renderAdminQuotes();
    renderQuoteButtons();
    showToast('🗑️ تم حذف العبارة', 'warning');
}
window.deleteAdminQuote = deleteAdminQuote;

async function saveQuotesToSupabase() {
    try {
        await supabase
            .from('quotes')
            .delete()
            .neq('id', 'none');
        
        if (adminQuotes.length > 0) {
            const { error } = await supabase
                .from('quotes')
                .insert(
                    adminQuotes.map(q => ({
                        id: q.id,
                        text: q.text,
                        tags: q.tags || ['عام'],
                        products: q.products || ['all'],
                        created_at: q.created_at || new Date().toISOString()
                    }))
                );
            
            if (error) {
                console.error('❌ خطأ في حفظ العبارات:', error);
            } else {
                console.log('✅ تم حفظ العبارات في قاعدة البيانات');
            }
        }
    } catch (e) {
        console.error('❌ خطأ في حفظ العبارات:', e);
    }
}
window.saveQuotesToSupabase = saveQuotesToSupabase;

async function loadQuotesFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.warn('⚠️ خطأ في تحميل العبارات:', error);
            return;
        }
        
        if (data && data.length > 0) {
            adminQuotes = data.map(q => ({
                id: q.id,
                text: q.text,
                tags: q.tags || ['عام'],
                products: q.products || ['all'],
                created_at: q.created_at
            }));
            localStorage.setItem('tithkari_admin_quotes', JSON.stringify(adminQuotes));
            renderAdminQuotes();
            renderQuoteButtons();
            console.log('✅ تم تحميل ' + adminQuotes.length + ' عبارات من قاعدة البيانات');
        }
    } catch (e) {
        console.error('❌ خطأ في تحميل العبارات:', e);
    }
}
window.loadQuotesFromSupabase = loadQuotesFromSupabase;

// ============================================
// دوال الصور الإضافية
// ============================================
function handleDesignImagesUpload(e) {
    const files = Array.from(e.target.files);
    if (designImages.length + files.length > 5) {
        showToast('⚠️ الحد الأقصى 5 صور', 'error');
        return;
    }
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
            designImages.push(ev.target.result);
            renderDesignImages();
        };
        reader.readAsDataURL(file);
    });
    showToast('✅ تم رفع الصور', 'success');
}
window.handleDesignImagesUpload = handleDesignImagesUpload;

function renderDesignImages() {
    const container = document.getElementById('designImagesPreview');
    if (!container) return;
    container.innerHTML = '';
    designImages.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.innerHTML = `
            <img src="${img}" alt="صورة">
            <button class="remove-btn" onclick="removeDesignImage(${i})"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    });
}
window.renderDesignImages = renderDesignImages;

function removeDesignImage(index) {
    designImages.splice(index, 1);
    renderDesignImages();
}
window.removeDesignImage = removeDesignImage;

function uploadTemplateImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('baseImage').src = e.target.result;
        isUsingProductImage = false;
        showToast('✅ تم رفع صورة القالب', 'success');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}
window.uploadTemplateImage = uploadTemplateImage;

function applyTemplateImageUrl() {
    const url = document.getElementById('templateImageUrl').value.trim();
    if (!url) {
        showToast('⚠️ الرجاء إدخال رابط صورة', 'warning');
        return;
    }
    document.getElementById('baseImage').src = url;
    isUsingProductImage = false;
    showToast('✅ تم تطبيق الرابط', 'success');
}
window.applyTemplateImageUrl = applyTemplateImageUrl;

function uploadReferenceImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('referenceImage').src = e.target.result;
        showToast('✅ تم رفع الصورة المرجعية', 'success');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}
window.uploadReferenceImage = uploadReferenceImage;

function applyReferenceImageUrl() {
    const url = document.getElementById('referenceImageUrl').value.trim();
    if (!url) {
        showToast('⚠️ الرجاء إدخال رابط صورة', 'warning');
        return;
    }
    document.getElementById('referenceImage').src = url;
    showToast('✅ تم تطبيق الرابط', 'success');
}
window.applyReferenceImageUrl = applyReferenceImageUrl;

// ============================================
// دوال حساب العميل
// ============================================
function saveCustomerDesign() {
    const customerName = prompt('👤 أدخل اسمك لحفظ التصميم:');
    if (!customerName) {
        showToast('⚠️ تم إلغاء الحفظ', 'warning');
        return;
    }
    
    const designData = {
        id: 'design_' + Date.now(),
        customerName: customerName,
        date: new Date().toISOString(),
        layers: layers.map(l => ({ ...l })),
        baseImage: document.getElementById('baseImage').src,
        referenceImage: document.getElementById('referenceImage').src,
        productName: document.getElementById('productNameDisplay').textContent
    };
    
    const designs = JSON.parse(localStorage.getItem('tithkari_customer_designs') || '[]');
    designs.push(designData);
    localStorage.setItem('tithkari_customer_designs', JSON.stringify(designs));
    
    showToast('✅ تم حفظ التصميم باسم "' + customerName + '"', 'success');
    loadCustomerDesigns();
}
window.saveCustomerDesign = saveCustomerDesign;

function loadCustomerDesigns() {
    const designs = JSON.parse(localStorage.getItem('tithkari_customer_designs') || '[]');
    const container = document.getElementById('customerDesignsList');
    if (!container) return;
    
    if (designs.length === 0) {
        container.innerHTML = '<p style="color:var(--studio-muted);font-size:9px;">لا توجد تصميمات محفوظة</p>';
        return;
    }
    
    container.innerHTML = '';
    designs.forEach((d, i) => {
        const div = document.createElement('div');
        div.className = 'layer-item';
        div.innerHTML = `
            <span>📁 ${d.customerName} - ${new Date(d.date).toLocaleDateString('ar-SA')}</span>
            <span>
                <button class="btn-sm btn-dark" onclick="loadCustomerDesign(${i})">📂 تحميل</button>
                <button class="btn-sm btn-danger" onclick="deleteCustomerDesign(${i})">🗑️</button>
            </span>
        `;
        container.appendChild(div);
    });
}
window.loadCustomerDesigns = loadCustomerDesigns;

function loadCustomerDesign(index) {
    const designs = JSON.parse(localStorage.getItem('tithkari_customer_designs') || '[]');
    const design = designs[index];
    if (!design) return;
    
    layers = design.layers.map(l => ({ ...l }));
    activeLayerId = null;
    nextId = layers.length + 1;
    document.getElementById('baseImage').src = design.baseImage;
    document.getElementById('referenceImage').src = design.referenceImage;
    document.getElementById('productNameDisplay').textContent = design.productName || 'درع مخصص';
    
    updateAll();
    saveState();
    showToast('✅ تم تحميل التصميم بنجاح', 'success');
}
window.loadCustomerDesign = loadCustomerDesign;

function deleteCustomerDesign(index) {
    if (!confirm('هل أنت متأكد من حذف هذا التصميم؟')) return;
    const designs = JSON.parse(localStorage.getItem('tithkari_customer_designs') || '[]');
    designs.splice(index, 1);
    localStorage.setItem('tithkari_customer_designs', JSON.stringify(designs));
    loadCustomerDesigns();
    showToast('🗑️ تم حذف التصميم', 'warning');
}
window.deleteCustomerDesign = deleteCustomerDesign;

function customerLogin() {
    const name = prompt('👤 أدخل اسمك:');
    if (!name) return;
    currentCustomer = name;
    document.getElementById('customerInfo').innerHTML = `
        <p style="color:var(--studio-gold);font-size:10px;">👋 مرحباً ${name}</p>
        <button class="btn-sm btn-danger" onclick="customerLogout()">تسجيل خروج</button>
    `;
    document.getElementById('customerDesignsSection').style.display = 'block';
    loadCustomerDesigns();
    showToast('✅ تم تسجيل الدخول بنجاح', 'success');
}
window.customerLogin = customerLogin;

function customerLogout() {
    currentCustomer = null;
    document.getElementById('customerInfo').innerHTML = `
        <p style="color:var(--studio-muted);font-size:10px;">سجل الدخول لحفظ تصميماتك</p>
        <button class="btn-gold btn-sm" onclick="customerLogin()" style="margin-top:4px;">
            <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
        </button>
    `;
    document.getElementById('customerDesignsSection').style.display = 'none';
    showToast('👋 تم تسجيل الخروج', 'info');
}
window.customerLogout = customerLogout;

// ============================================
// دوال إدارة المسؤول
// ============================================
function checkAdminAccess() {
    const password = prompt('🔐 أدخل كلمة المرور للمسؤول:');
    if (password === 'admin123') {
        isAdminUser = true;
        updateAdminUI(true);
        showToast('🔐 تم تفعيل وضع المسؤول', 'success');
        loadQuotesFromSupabase();
        enableAutoSave();
    } else {
        showToast('❌ كلمة المرور غير صحيحة', 'error');
    }
}
window.checkAdminAccess = checkAdminAccess;

function adminLogout() {
    isAdminUser = false;
    updateAdminUI(false);
    disableAutoSave();
    showToast('👋 تم تسجيل الخروج من وضع المسؤول', 'info');
}
window.adminLogout = adminLogout;

function updateAdminUI(adminStatus) {
    const adminTab = document.getElementById('adminDesignTab');
    const adminControls = document.querySelectorAll('.admin-controls');
    const adminOnly = document.querySelectorAll('.admin-only');
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    
    if (adminTab) {
        adminTab.style.display = adminStatus ? 'inline-block' : 'none';
    }
    
    adminControls.forEach(el => {
        el.style.display = adminStatus ? 'block' : 'none';
        if (adminStatus) {
            el.classList.add('show');
        } else {
            el.classList.remove('show');
        }
    });
    
    adminOnly.forEach(el => {
        el.style.display = adminStatus ? 'block' : 'none';
    });
    
    if (loginBtn) {
        loginBtn.style.display = adminStatus ? 'none' : 'inline-flex';
    }
    if (logoutBtn) {
        logoutBtn.style.display = adminStatus ? 'inline-flex' : 'none';
    }
}
window.updateAdminUI = updateAdminUI;

function isAdmin() {
    return isAdminUser || localStorage.getItem('is_admin') === 'true';
}
window.isAdmin = isAdmin;

// ============================================
// نافذة التصدير
// ============================================
function showExportOptions(templateData) {
    const modal = document.getElementById('exportModal');
    const previewImg = document.getElementById('exportPreviewImage');
    const nameEl = document.getElementById('exportTemplateName');
    const linkedEl = document.getElementById('exportLinkedProduct');
    
    if (!modal || !previewImg) return;
    
    captureDesignImage().then(imageData => {
        previewImg.src = imageData;
        nameEl.textContent = templateData.name || 'قالب مخصص';
        linkedEl.textContent = templateData.linkedProductName ? '🔗 مرتبط بـ: ' + templateData.linkedProductName : '';
        
        window._exportImageData = imageData;
        window._exportTemplateData = templateData;
        
        modal.classList.add('active');
    }).catch(err => {
        console.error('❌ خطأ في التقاط الصورة:', err);
        showToast('❌ حدث خطأ في التقاط الصورة', 'error');
    });
}
window.showExportOptions = showExportOptions;

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('active');
    window._exportImageData = null;
    window._exportTemplateData = null;
}
window.closeExportModal = closeExportModal;

function downloadTemplateImage() {
    if (window._exportImageData) {
        const link = document.createElement('a');
        link.download = 'قالب_' + Date.now() + '.png';
        link.href = window._exportImageData;
        link.click();
        showToast('✅ تم تحميل الصورة', 'success');
    }
}
window.downloadTemplateImage = downloadTemplateImage;

function sendViaWhatsApp() {
    const whatsappNumber = localStorage.getItem('tithkari_whatsapp_link') || '966500000000';
    const cleanNumber = whatsappNumber.replace('https://wa.me/', '').replace(/[^0-9]/g, '');
    
    const templateName = window._exportTemplateData?.name || document.getElementById('productNameDisplay').textContent || 'درع مخصص';
    
    const message = encodeURIComponent(
        '🛡️ طلب تصميم درع مخصص\n\n' +
        '📝 اسم التصميم: ' + templateName + '\n' +
        '📅 التاريخ: ' + new Date().toLocaleDateString('ar-SA') + '\n\n' +
        '🔗 تم تصميم هذا الدرع باستخدام Tithkari Studio\n' +
        '📸 الصورة مرفقة في المحادثة'
    );
    
    window.open('https://wa.me/' + cleanNumber + '?text=' + message, '_blank');
    showToast('✅ تم فتح واتساب', 'success');
}
window.sendViaWhatsApp = sendViaWhatsApp;

// ============================================
// التهيئة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Design Studio - Initializing...');
    
    loadProductsList();
    loadTemplates();
    loadAdminQuotes();
    loadQuotesFromSupabase();
    loadCustomerDesigns();
    
    addDefaultTextLayer();
    addTextLayer('اسم صاحب الإهداء', '42%', '5%', '90%', '45px');
    addTextLayer('عبارة الإهداء أو التكريم', '52%', '5%', '90%', '30%');
    
    updateAll();
    
    const session = localStorage.getItem('session');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdminFromStorage = session && (user?.email === 'admin@tithkari.com' || user?.role === 'admin' || localStorage.getItem('is_admin') === 'true');
    
    if (isAdminFromStorage) {
        isAdminUser = true;
        updateAdminUI(true);
        enableAutoSave();
    }

    const tabsNav = document.getElementById('tabsNav');
    const tabPanels = document.querySelectorAll('.tab-panel');
    if (tabsNav) {
        tabsNav.addEventListener('click', function(e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            tabsNav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabPanels.forEach(p => p.classList.remove('active'));
            const tabId = btn.dataset.tab;
            const target = document.getElementById('tab-' + tabId);
            if (target) target.classList.add('active');
        });
    }

    if (!loadProductFromUrl()) {
        restoreSession();
    }

    console.log('✅ Design Studio initialized successfully');
    console.log('🔐 Connected to Supabase');
    console.log('👑 Admin mode:', isAdminUser);
    console.log('💾 Auto-save:', !!autoSaveTimer);
});

console.log('✅ All functions registered to window');