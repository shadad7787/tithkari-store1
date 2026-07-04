// ============================================
// إدارة الأدوات والتطبيقات
// ============================================

import { CONFIG } from '../config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

// ============================================
// المتغيرات
// ============================================
let tools = [];
let editingToolId = null;

// ============================================
// الأدوات الافتراضية
// ============================================
const DEFAULT_TOOLS = [
    {
        name: 'Google Analytics',
        description: 'تحليلات جوجل لمراقبة الزوار والسلوك',
        icon: 'fa-google',
        category: 'analytics',
        code: `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>`,
        position: 'head',
        status: 'inactive',
        inject_automatically: true,
        display_order: 1
    },
    {
        name: 'Google Search Console',
        description: 'أداة تحسين محركات البحث من جوجل',
        icon: 'fa-google',
        category: 'seo',
        code: `<meta name="google-site-verification" content="VERIFICATION_CODE" />`,
        position: 'head',
        status: 'inactive',
        inject_automatically: true,
        display_order: 2
    },
    {
        name: 'Microsoft Clarity',
        description: 'تحليل سلوك الزوار وتسجيل الجلسات',
        icon: 'fa-chart-line',
        category: 'analytics',
        code: `<!-- Microsoft Clarity -->
<script>
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "CLARITY_PROJECT_ID");
</script>`,
        position: 'body_end',
        status: 'inactive',
        inject_automatically: true,
        display_order: 3
    },
    {
        name: 'Facebook Pixel',
        description: 'تتبع التحويلات وإعادة الاستهداف من فيسبوك',
        icon: 'fa-facebook',
        category: 'marketing',
        code: `<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=PIXEL_ID&ev=PageView&noscript=1"
/></noscript>`,
        position: 'body_end',
        status: 'inactive',
        inject_automatically: true,
        display_order: 4
    },
    {
        name: 'Hotjar',
        description: 'تحليل سلوك الزوار والخريطة الحرارية',
        icon: 'fa-fire',
        category: 'analytics',
        code: `<!-- Hotjar Tracking Code -->
<script>
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:HOTJAR_ID,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`,
        position: 'head',
        status: 'inactive',
        inject_automatically: true,
        display_order: 5
    },
    {
        name: 'TikTok Pixel',
        description: 'تتبع التحويلات من إعلانات تيك توك',
        icon: 'fa-tiktok',
        category: 'marketing',
        code: `<!-- TikTok Pixel Code -->
<script>
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load('PIXEL_ID');
    ttq.page();
  }(window, document, 'ttq');
</script>`,
        position: 'body_end',
        status: 'inactive',
        inject_automatically: true,
        display_order: 6
    },
    {
        name: 'Stripe',
        description: 'بوابة الدفع الإلكتروني Stripe',
        icon: 'fa-stripe',
        category: 'payment',
        code: `<script src="https://js.stripe.com/v3/"></script>
<script>
  const stripe = Stripe('PUBLISHABLE_KEY');
</script>`,
        position: 'head',
        status: 'inactive',
        inject_automatically: true,
        display_order: 7
    },
    {
        name: 'WhatsApp Widget',
        description: 'زر واتساب للتواصل السريع مع العملاء',
        icon: 'fa-whatsapp',
        category: 'support',
        code: `<!-- WhatsApp Widget -->
<div id="whatsapp-widget" style="position:fixed;bottom:20px;left:20px;z-index:999;">
  <a href="https://wa.me/PHONE_NUMBER?text=مرحباً" target="_blank" 
     style="display:flex;align-items:center;gap:10px;background:#25D366;color:white;padding:12px 20px;border-radius:50px;text-decoration:none;font-weight:600;box-shadow:0 4px 15px rgba(37,211,102,0.3);">
    <i class="fab fa-whatsapp" style="font-size:24px;"></i>
    <span>تواصل معنا</span>
  </a>
</div>`,
        position: 'body_end',
        status: 'inactive',
        inject_automatically: true,
        display_order: 8
    }
];

// ============================================
// تحميل الأدوات من Supabase
// ============================================
async function loadTools() {
    try {
        console.log('📋 جاري تحميل الأدوات...');
        
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) {
            // إذا كان الجدول غير موجود، قم بإنشائه
            if (error.code === '42P01') {
                await createToolsTable();
                return loadTools();
            }
            throw error;
        }
        
        if (data && data.length > 0) {
            tools = data;
            console.log('✅ تم تحميل', tools.length, 'أداة');
        } else {
            // إضافة الأدوات الافتراضية
            await insertDefaultTools();
            return loadTools();
        }
        
        renderTools();
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الأدوات:', error);
        showToast('❌ حدث خطأ في تحميل الأدوات', 'error');
    }
}
window.loadTools = loadTools;

// ============================================
// إنشاء جدول الأدوات
// ============================================
async function createToolsTable() {
    try {
        const { error } = await supabase.rpc('create_tools_table');
        if (error) {
            // إذا لم تكن RPC موجودة، استخدم SQL مباشر
            console.log('⚠️ استخدام SQL مباشر لإنشاء الجدول');
        }
    } catch (error) {
        console.error('❌ خطأ في إنشاء الجدول:', error);
    }
}

// ============================================
// إضافة الأدوات الافتراضية
// ============================================
async function insertDefaultTools() {
    try {
        const toolsToInsert = DEFAULT_TOOLS.map(tool => ({
            ...tool,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
            .from('tools')
            .insert(toolsToInsert);
        
        if (error) throw error;
        
        console.log('✅ تم إضافة الأدوات الافتراضية');
        
    } catch (error) {
        console.error('❌ خطأ في إضافة الأدوات الافتراضية:', error);
    }
}

// ============================================
// عرض الأدوات
// ============================================
function renderTools() {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;
    
    if (tools.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#8A8A9B;">
                <i class="fas fa-plug" style="font-size:48px;display:block;margin-bottom:20px;opacity:0.3;"></i>
                <h3>لا توجد أدوات</h3>
                <p>أضف أداتك الأولى بالضغط على "إضافة أداة جديدة"</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = tools.map(tool => {
        const isActive = tool.status === 'active';
        const statusClass = isActive ? 'active' : 'inactive';
        const statusText = isActive ? '✅ نشط' : tool.status === 'draft' ? '📝 مسودة' : '❌ غير نشط';
        const icon = tool.icon || 'fa-plug';
        
        let fieldsHtml = '';
        if (tool.code) {
            fieldsHtml = `
                <div class="tool-fields">
                    <div class="field-group">
                        <label>📋 الكود المحقون</label>
                        <textarea readonly style="font-size:11px;min-height:40px;">${tool.code.substring(0, 150)}${tool.code.length > 150 ? '...' : ''}</textarea>
                    </div>
                    <div class="field-group">
                        <label>📍 موقع الحقن: ${tool.position || 'غير محدد'}</label>
                    </div>
                </div>
            `;
        }
        
        return `
        <div class="tool-card">
            <div class="tool-header">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div class="tool-icon"><i class="fas ${icon}"></i></div>
                    <div>
                        <div class="tool-name">${tool.name}</div>
                        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                            <span style="font-size:11px;color:#8A8A9B;">${tool.category || '📦 أخرى'}</span>
                            <span class="tool-status ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <button class="btn-success" onclick="toggleToolStatus('${tool.id}')" style="padding:4px 10px;font-size:11px;">
                        ${isActive ? 'إيقاف' : 'تفعيل'}
                    </button>
                </div>
            </div>
            <div class="tool-desc">${tool.description || 'لا يوجد وصف'}</div>
            ${fieldsHtml}
            <div class="tool-actions">
                <button class="btn-secondary" onclick="editTool('${tool.id}')" style="padding:4px 12px;font-size:11px;">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn-success" onclick="injectTool('${tool.id}')" style="padding:4px 12px;font-size:11px;">
                    <i class="fas fa-code"></i> حقن
                </button>
                <button class="btn-secondary" onclick="previewToolCode('${tool.id}')" style="padding:4px 12px;font-size:11px;">
                    <i class="fas fa-eye"></i> معاينة
                </button>
                <button class="btn-danger" onclick="deleteTool('${tool.id}')" style="padding:4px 12px;font-size:11px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `}).join('');
}

// ============================================
// فتح نافذة إضافة أداة
// ============================================
function openAddToolModal() {
    editingToolId = null;
    document.getElementById('toolModalTitle').innerHTML = '<i class="fas fa-plus"></i> إضافة أداة جديدة';
    document.getElementById('toolForm').reset();
    document.getElementById('toolId').value = '';
    document.getElementById('toolStatus').value = 'inactive';
    document.getElementById('toolInjectAutomatically').checked = true;
    document.getElementById('customPositionGroup').style.display = 'none';
    document.getElementById('toolModal').classList.add('active');
}
window.openAddToolModal = openAddToolModal;

// ============================================
// فتح نافذة تعديل أداة
// ============================================
async function editTool(toolId) {
    try {
        const tool = tools.find(t => t.id === toolId);
        if (!tool) {
            showToast('⚠️ الأداة غير موجودة', 'warning');
            return;
        }
        
        editingToolId = toolId;
        document.getElementById('toolModalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل الأداة';
        document.getElementById('toolId').value = tool.id;
        document.getElementById('toolName').value = tool.name || '';
        document.getElementById('toolDescription').value = tool.description || '';
        document.getElementById('toolIcon').value = tool.icon || 'fa-plug';
        document.getElementById('toolCategory').value = tool.category || 'other';
        document.getElementById('toolCode').value = tool.code || '';
        document.getElementById('toolPosition').value = tool.position || 'body_end';
        document.getElementById('toolStatus').value = tool.status || 'inactive';
        document.getElementById('toolOrder').value = tool.display_order || 0;
        document.getElementById('toolInjectAutomatically').checked = tool.inject_automatically !== false;
        
        if (tool.position === 'custom') {
            document.getElementById('customPositionGroup').style.display = 'block';
            document.getElementById('toolCustomPosition').value = tool.custom_position || '';
        } else {
            document.getElementById('customPositionGroup').style.display = 'none';
        }
        
        document.getElementById('toolModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.editTool = editTool;

// ============================================
// إغلاق نافذة الأداة
// ============================================
function closeToolModal() {
    document.getElementById('toolModal').classList.remove('active');
}
window.closeToolModal = closeToolModal;

// ============================================
// حفظ الأداة
// ============================================
async function saveTool(event) {
    event.preventDefault();
    
    const id = document.getElementById('toolId').value;
    const name = document.getElementById('toolName').value.trim();
    const description = document.getElementById('toolDescription').value.trim();
    const icon = document.getElementById('toolIcon').value;
    const category = document.getElementById('toolCategory').value;
    const code = document.getElementById('toolCode').value.trim();
    const position = document.getElementById('toolPosition').value;
    const status = document.getElementById('toolStatus').value;
    const display_order = parseInt(document.getElementById('toolOrder').value) || 0;
    const inject_automatically = document.getElementById('toolInjectAutomatically').checked;
    const custom_position = document.getElementById('toolCustomPosition').value.trim();
    
    if (!name) {
        showToast('⚠️ الرجاء إدخال اسم الأداة', 'warning');
        return;
    }
    
    if (!code) {
        showToast('⚠️ الرجاء إدخال الكود', 'warning');
        return;
    }
    
    const data = {
        name,
        description: description || null,
        icon,
        category,
        code,
        position,
        status,
        display_order,
        inject_automatically,
        custom_position: position === 'custom' ? custom_position : null,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        if (id) {
            result = await supabase
                .from('tools')
                .update(data)
                .eq('id', id);
        } else {
            data.created_at = new Date().toISOString();
            result = await supabase
                .from('tools')
                .insert(data);
        }
        
        if (result.error) throw result.error;
        
        showToast(id ? '✅ تم تحديث الأداة' : '✅ تم إضافة الأداة', 'success');
        closeToolModal();
        loadTools();
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الأداة:', error);
        showToast('❌ حدث خطأ: ' + error.message, 'error');
    }
}
window.saveTool = saveTool;

// ============================================
// تبديل حالة الأداة
// ============================================
async function toggleToolStatus(toolId) {
    try {
        const tool = tools.find(t => t.id === toolId);
        if (!tool) return;
        
        const newStatus = tool.status === 'active' ? 'inactive' : 'active';
        
        const { error } = await supabase
            .from('tools')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', toolId);
        
        if (error) throw error;
        
        showToast(`✅ تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الأداة`, 'success');
        loadTools();
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.toggleToolStatus = toggleToolStatus;

// ============================================
// حذف أداة
// ============================================
async function deleteTool(toolId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الأداة؟')) return;
    
    try {
        const { error } = await supabase
            .from('tools')
            .delete()
            .eq('id', toolId);
        
        if (error) throw error;
        
        showToast('✅ تم حذف الأداة', 'success');
        loadTools();
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        showToast('❌ حدث خطأ', 'error');
    }
}
window.deleteTool = deleteTool;

// ============================================
// معاينة الكود
// ============================================
function previewToolCode(toolId) {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) {
        showToast('⚠️ الأداة غير موجودة', 'warning');
        return;
    }
    
    const content = document.getElementById('injectedCodeContent');
    content.innerHTML = `
        <div style="margin-bottom:10px;">
            <strong style="color:#FFD700;">📌 ${tool.name}</strong>
            <span style="color:#8A8A9B;font-size:12px;margin-right:10px;">${tool.position || 'body_end'}</span>
        </div>
        <pre style="background:#0a0a12;padding:15px;border-radius:6px;overflow:auto;font-size:12px;color:#e0e0e0;font-family:'Courier New',monospace;white-space:pre-wrap;">${tool.code}</pre>
    `;
    
    document.getElementById('injectedCodeModal').classList.add('active');
}
window.previewToolCode = previewToolCode;

// ============================================
// نسخ الكود
// ============================================
function copyInjectedCode() {
    const content = document.getElementById('injectedCodeContent');
    const code = content.querySelector('pre')?.textContent || '';
    
    navigator.clipboard.writeText(code).then(() => {
        showToast('✅ تم نسخ الكود', 'success');
    }).catch(() => {
        // طريقة بديلة
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        showToast('✅ تم نسخ الكود', 'success');
    });
}
window.copyInjectedCode = copyInjectedCode;

// ============================================
// إغلاق نافذة الكود
// ============================================
function closeInjectedCodeModal() {
    document.getElementById('injectedCodeModal').classList.remove('active');
}
window.closeInjectedCodeModal = closeInjectedCodeModal;

// ============================================
// حقن أداة واحدة
// ============================================
async function injectTool(toolId) {
    try {
        const tool = tools.find(t => t.id === toolId);
        if (!tool) {
            showToast('⚠️ الأداة غير موجودة', 'warning');
            return;
        }
        
        if (tool.status !== 'active') {
            showToast('⚠️ الأداة غير نشطة، قم بتفعيلها أولاً', 'warning');
            return;
        }
        
        // حفظ الأداة في localStorage للتطبيق
        const injected = JSON.parse(localStorage.getItem('tithkari_injected_tools') || '[]');
        if (!injected.includes(toolId)) {
            injected.push(toolId);
            localStorage.setItem('tithkari_injected_tools', JSON.stringify(injected));
        }
        
        // تحديث حالة الحقن في Supabase
        const { error } = await supabase
            .from('tools')
            .update({ 
                injected_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', toolId);
        
        if (error) throw error;
        
        showToast(`✅ تم حقن "${tool.name}" بنجاح`, 'success');
        
        // تطبيق الحقن الفوري
        applyToolInjection(tool);
        
    } catch (error) {
        console.error('❌ خطأ في الحقن:', error);
        showToast('❌ حدث خطأ في الحقن', 'error');
    }
}
window.injectTool = injectTool;

// ============================================
// حقن جميع الأدوات النشطة
// ============================================
async function injectAllTools() {
    try {
        const activeTools = tools.filter(t => t.status === 'active');
        if (activeTools.length === 0) {
            showToast('⚠️ لا توجد أدوات نشطة للحقن', 'warning');
            return;
        }
        
        const injected = [];
        for (const tool of activeTools) {
            // حفظ في localStorage
            const injectedList = JSON.parse(localStorage.getItem('tithkari_injected_tools') || '[]');
            if (!injectedList.includes(tool.id)) {
                injectedList.push(tool.id);
                localStorage.setItem('tithkari_injected_tools', JSON.stringify(injectedList));
            }
            
            // تحديث في Supabase
            await supabase
                .from('tools')
                .update({ 
                    injected_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', tool.id);
            
            injected.push(tool.name);
            
            // تطبيق الحقن
            applyToolInjection(tool);
        }
        
        showToast(`✅ تم حقن ${injected.length} أداة: ${injected.join(', ')}`, 'success');
        
    } catch (error) {
        console.error('❌ خطأ في الحقن:', error);
        showToast('❌ حدث خطأ في حقن الأدوات', 'error');
    }
}
window.injectAllTools = injectAllTools;

// ============================================
// تطبيق حقن أداة في الصفحة الحالية
// ============================================
function applyToolInjection(tool) {
    try {
        const code = tool.code || '';
        const position = tool.position || 'body_end';
        
        // استبدال المتغيرات
        let processedCode = code
            .replace(/{{TOOL_ID}}/g, tool.id)
            .replace(/{{TOOL_NAME}}/g, tool.name)
            .replace(/{{SITE_URL}}/g, window.location.origin);
        
        let element;
        switch (position) {
            case 'head':
                element = document.head;
                break;
            case 'body_start':
                element = document.body;
                // إدراج في بداية body
                const script = document.createElement('div');
                script.innerHTML = processedCode;
                document.body.prepend(...script.children);
                return;
            case 'footer':
                element = document.querySelector('footer') || document.body;
                break;
            case 'custom':
                if (tool.custom_position) {
                    element = document.querySelector(tool.custom_position) || document.body;
                } else {
                    element = document.body;
                }
                break;
            default:
                element = document.body;
        }
        
        // إدراج الكود
        const container = document.createElement('div');
        container.innerHTML = processedCode;
        container.style.display = 'contents';
        element.appendChild(...container.children);
        
        console.log(`✅ تم حقن "${tool.name}" في ${position}`);
        
    } catch (error) {
        console.error(`❌ خطأ في حقن "${tool.name}":`, error);
    }
}

// ============================================
// تحميل الأدوات المحقونة عند تحميل الصفحة
// ============================================
async function loadInjectedTools() {
    try {
        const injectedIds = JSON.parse(localStorage.getItem('tithkari_injected_tools') || '[]');
        if (injectedIds.length === 0) return;
        
        // جلب الأدوات المحقونة من Supabase
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .in('id', injectedIds)
            .eq('status', 'active');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            data.forEach(tool => applyToolInjection(tool));
            console.log(`✅ تم تحميل ${data.length} أداة محقونة`);
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الأدوات المحقونة:', error);
    }
}

// ============================================
// إظهار الإشعارات (Toast)
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
window.showToast = showToast;

// ============================================
// تحديث موقع الحقن المخصص
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const positionSelect = document.getElementById('toolPosition');
    if (positionSelect) {
        positionSelect.addEventListener('change', function() {
            const customGroup = document.getElementById('customPositionGroup');
            if (customGroup) {
                customGroup.style.display = this.value === 'custom' ? 'block' : 'none';
            }
        });
    }
    
    // تحميل الأدوات
    loadTools();
    
    // تحميل الأدوات المحقونة
    loadInjectedTools();
});

// ============================================
// دالة لإضافة زر "إدارة الأدوات" في لوحة التحكم
// ============================================
function addToolsMenuItem() {
    const nav = document.querySelector('.admin-nav');
    if (nav) {
        const toolsLink = document.createElement('a');
        toolsLink.href = '#';
        toolsLink.onclick = function(e) {
            e.preventDefault();
            window.location.href = 'tools-manager.html';
        };
        toolsLink.innerHTML = `
            <i class="fas fa-plug" style="color: #8B5CF6;"></i>
            <span style="color: #8B5CF6;">إدارة الأدوات</span>
        `;
        toolsLink.style.background = 'rgba(139, 92, 246, 0.1)';
        toolsLink.style.borderRight = '2px solid #8B5CF6';
        nav.appendChild(toolsLink);
    }
}

// إضافة الرابط بعد تحميل الصفحة
setTimeout(addToolsMenuItem, 1000);