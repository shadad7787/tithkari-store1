// ============================================
// أدوات الحقن التلقائي - يتم تضمينه في كل صفحة
// ============================================

(async function() {
    try {
        // جلب الأدوات المحقونة من localStorage
        const injectedIds = JSON.parse(localStorage.getItem('tithkari_injected_tools') || '[]');
        if (injectedIds.length === 0) return;
        
        // جلب الأدوات من Supabase
        const supabaseUrl = 'https://savtqajghyloevzwrzvt.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdnRxYWpnaHlsb2V2endyenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODA1OTMsImV4cCI6MjA5ODM1NjU5M30.CBq7eKyr3RR11op_SevMBBcKQNKF7uftpaa-URemEww';
        
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.0');
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .in('id', injectedIds)
            .eq('status', 'active');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            data.forEach(tool => {
                injectTool(tool);
            });
            console.log(`✅ تم حقن ${data.length} أداة تلقائياً`);
        }
        
    } catch (error) {
        console.error('❌ خطأ في حقن الأدوات:', error);
    }
})();

function injectTool(tool) {
    try {
        const code = tool.code || '';
        const position = tool.position || 'body_end';
        
        // استبدال المتغيرات
        let processedCode = code
            .replace(/{{TOOL_ID}}/g, tool.id)
            .replace(/{{TOOL_NAME}}/g, tool.name)
            .replace(/{{SITE_URL}}/g, window.location.origin);
        
        // إدراج الكود
        const container = document.createElement('div');
        container.innerHTML = processedCode;
        container.style.display = 'contents';
        
        let target;
        switch (position) {
            case 'head':
                target = document.head;
                break;
            case 'body_start':
                target = document.body;
                document.body.prepend(...container.children);
                return;
            case 'footer':
                target = document.querySelector('footer') || document.body;
                break;
            case 'custom':
                if (tool.custom_position) {
                    target = document.querySelector(tool.custom_position) || document.body;
                } else {
                    target = document.body;
                }
                break;
            default:
                target = document.body;
        }
        
        target.appendChild(...container.children);
        
    } catch (error) {
        console.error(`❌ خطأ في حقن "${tool.name}":`, error);
    }
}