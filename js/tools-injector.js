// ============================================
// أدوات الحقن التلقائي - يتم تضمينه في كل صفحة
// ============================================

(async function() {
    'use strict';
    
    // ============================================
    // إعدادات Supabase
    // ============================================
    const SUPABASE_URL = 'https://savtqajghyloevzwrzvt.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww';
    
    // ============================================
    // دالة مساعدة لإظهار الأخطاء في الكونسول فقط
    // ============================================
    function log(message, type = 'info') {
        const prefix = '🔌 [Tools Injector]';
        if (type === 'error') {
            console.error(`${prefix} ${message}`);
        } else if (type === 'warning') {
            console.warn(`${prefix} ${message}`);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }
    
    // ============================================
    // دالة لإضافة CSS ديناميكياً
    // ============================================
    function injectCSS(css) {
        if (!css) return;
        const style = document.createElement('style');
        style.id = 'tools-injected-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    // ============================================
    // دالة حقن الأداة
    // ============================================
    function injectTool(tool) {
        try {
            if (!tool || !tool.code) {
                log(`⚠️ الأداة "${tool?.name || 'غير معروفة'}" لا تحتوي على كود`, 'warning');
                return;
            }
            
            const code = tool.code || '';
            const position = tool.position || 'body_end';
            const css = tool.css || '';
            
            // استبدال المتغيرات
            let processedCode = code
                .replace(/{{TOOL_ID}}/g, tool.id || '')
                .replace(/{{TOOL_NAME}}/g, tool.name || '')
                .replace(/{{SITE_URL}}/g, window.location.origin)
                .replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear())
                .replace(/{{PAGE_URL}}/g, window.location.href)
                .replace(/{{PAGE_TITLE}}/g, document.title);
            
            // حقن CSS إذا وجد
            if (css) {
                injectCSS(css);
            }
            
            // إدراج الكود
            const container = document.createElement('div');
            container.innerHTML = processedCode;
            container.style.display = 'contents';
            
            let target;
            let method = 'append';
            
            switch (position) {
                case 'head':
                    target = document.head;
                    method = 'append';
                    break;
                    
                case 'body_start':
                    target = document.body;
                    method = 'prepend';
                    break;
                    
                case 'footer':
                    target = document.querySelector('footer') || document.body;
                    method = 'append';
                    break;
                    
                case 'custom':
                    if (tool.custom_position) {
                        const customTarget = document.querySelector(tool.custom_position);
                        if (customTarget) {
                            target = customTarget;
                            method = 'append';
                        } else {
                            log(`⚠️ الموقع المخصص "${tool.custom_position}" غير موجود، سيتم الحقن في body`, 'warning');
                            target = document.body;
                            method = 'append';
                        }
                    } else {
                        target = document.body;
                        method = 'append';
                    }
                    break;
                    
                default:
                    target = document.body;
                    method = 'append';
            }
            
            // تنفيذ الحقن
            const children = Array.from(container.children);
            if (children.length > 0) {
                if (method === 'prepend') {
                    target.prepend(...children);
                } else {
                    target.appendChild(...children);
                }
                log(`✅ تم حقن "${tool.name}" في ${position}`);
            } else {
                // إذا كان الكود لا يحتوي على عناصر HTML (مثل كود JS فقط)
                const script = document.createElement('script');
                script.textContent = processedCode;
                if (position === 'head') {
                    document.head.appendChild(script);
                } else {
                    document.body.appendChild(script);
                }
                log(`✅ تم حقن "${tool.name}" كـ script في ${position}`);
            }
            
        } catch (error) {
            log(`❌ خطأ في حقن "${tool.name}": ${error.message}`, 'error');
        }
    }
    
    // ============================================
    // دالة تحميل الأدوات من Supabase
    // ============================================
    async function loadTools() {
        try {
            // جلب الأدوات المحقونة من localStorage
            const injectedIds = JSON.parse(localStorage.getItem('tithkari_injected_tools') || '[]');
            if (injectedIds.length === 0) {
                log('📭 لا توجد أدوات محقونة', 'info');
                return;
            }
            
            log(`📋 جاري تحميل ${injectedIds.length} أداة من Supabase...`, 'info');
            
            // محاولة استخدام supabase من window إذا كان موجوداً
            let supabase = null;
            
            if (typeof window.supabase !== 'undefined' && window.supabase) {
                supabase = window.supabase;
                log('✅ باستخدام Supabase من window', 'info');
            } else {
                // محاولة تحميل supabase ديناميكياً
                try {
                    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.0');
                    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    log('✅ تم تحميل Supabase ديناميكياً', 'info');
                } catch (importError) {
                    log(`❌ فشل تحميل Supabase: ${importError.message}`, 'error');
                    return;
                }
            }
            
            if (!supabase) {
                log('❌ Supabase غير متاح', 'error');
                return;
            }
            
            // جلب الأدوات
            const { data, error } = await supabase
                .from('tools')
                .select('*')
                .in('id', injectedIds)
                .eq('status', 'active');
            
            if (error) {
                log(`❌ خطأ في جلب الأدوات: ${error.message}`, 'error');
                return;
            }
            
            if (data && data.length > 0) {
                log(`📦 تم جلب ${data.length} أداة نشطة`, 'info');
                
                // حقن كل أداة
                data.forEach((tool, index) => {
                    setTimeout(() => {
                        injectTool(tool);
                    }, index * 100); // تأخير بسيط بين الأدوات
                });
                
                log(`✅ تم حقن ${data.length} أداة بنجاح`, 'info');
            } else {
                log('📭 لا توجد أدوات نشطة للحقن', 'info');
            }
            
        } catch (error) {
            log(`❌ خطأ في تحميل الأدوات: ${error.message}`, 'error');
        }
    }
    
    // ============================================
    // دالة للتحقق من وجود أدوات جديدة كل 30 ثانية
    // ============================================
    function watchForNewTools() {
        let lastInjectedIds = localStorage.getItem('tithkari_injected_tools') || '[]';
        
        setInterval(async () => {
            try {
                const currentIds = localStorage.getItem('tithkari_injected_tools') || '[]';
                if (currentIds !== lastInjectedIds) {
                    log('🔄 تم اكتشاف تغيير في الأدوات، جاري إعادة التحميل...', 'info');
                    lastInjectedIds = currentIds;
                    await loadTools();
                }
            } catch (error) {
                // تجاهل الأخطاء في المراقبة
            }
        }, 30000); // كل 30 ثانية
    }
    
    // ============================================
    // تشغيل الحقن عند تحميل الصفحة
    // ============================================
    // انتظر حتى يتم تحميل DOM بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(loadTools, 100);
        });
    } else {
        setTimeout(loadTools, 100);
    }
    
    // بدء المراقبة بعد تحميل الصفحة
    window.addEventListener('load', function() {
        setTimeout(watchForNewTools, 5000);
    });
    
    // ============================================
    // دوال عامة للمطورين
    // ============================================
    window.__toolsInjector = {
        reload: loadTools,
        inject: injectTool,
        version: '1.0.0'
    };
    
    log('🚀 جاهز للحقن التلقائي', 'info');
    
})();