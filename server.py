# server.py - خادم بيثون لتشغيل المتجر
import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

PORT = 5513

# تغيير المجلد الحالي إلى مكان الملف
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# ============================================
# معالج مخصص لدعم جميع أنواع الملفات
# ============================================
class TithkariHandler(http.server.SimpleHTTPRequestHandler):
    """معالج مخصص لدعم ملفات المتجر بشكل صحيح"""
    
    # إضافة أنواع MIME إضافية
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.json': 'application/json',
        '.webp': 'image/webp',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
    }
    
    def do_GET(self):
        """معالجة طلبات GET مع دعم المسارات"""
        # إعادة توجيه الطلبات إلى الملفات الصحيحة
        if self.path == '/':
            self.path = '/index.html'
        elif self.path.startswith('/admin'):
            # دعم مسار admin
            if self.path == '/admin' or self.path == '/admin/':
                self.path = '/admin/admin.html'
        
        # دعم المسارات النسبية
        if self.path.startswith('/../'):
            # منع الوصول إلى الملفات خارج المجلد
            self.send_error(403, "Forbidden")
            return
        
        # استدعاء المعالج الأصلي
        return super().do_GET()
    
    def log_message(self, format, *args):
        """تنسيق رسائل السجل بشكل أفضل"""
        # تجاهل طلبات favicon
        if args and 'favicon.ico' in str(args):
            return
        # تجاهل طلبات التصحيح
        if args and 'sockjs' in str(args):
            return
        # تنسيق مخصص
        print(f"📡 {self.address_string()} - {format % args}")

# ============================================
# تشغيل الخادم
# ============================================
def run_server():
    """تشغيل الخادم مع معالجة الأخطاء"""
    try:
        # إنشاء الخادم مع المعالج المخصص
        with socketserver.TCPServer(("", PORT), TithkariHandler) as httpd:
            # السماح بإعادة استخدام المنفذ
            httpd.allow_reuse_address = True
            
            # عرض معلومات التشغيل
            print("=" * 55)
            print("  🛡️  Tithkari - متجر تصميم الدروع الفاخرة")
            print("=" * 55)
            print(f"  🚀 الخادم يعمل على: http://localhost:{PORT}")
            print(f"  📁 المجلد الحالي: {os.getcwd()}")
            print("=" * 55)
            print("  📋 الروابط المتاحة:")
            print(f"  🏪 المتجر الرئيسي:      http://localhost:{PORT}/")
            print(f"  🔐 لوحة التحكم:        http://localhost:{PORT}/admin.html")
            print(f"  🎨 مصمم الدروع:        http://localhost:{PORT}/design-studio.html")
            print(f"  📊 مدير القوالب:        http://localhost:{PORT}/template-manager.html")
            print("=" * 55)
            print("  ⚠️  اضغط Ctrl+C لإيقاف الخادم")
            print("=" * 55)
            
            # فتح المتجر في المتصفح تلقائياً
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("  🌐 تم فتح المتجر في المتصفح")
            except:
                pass
            
            # تشغيل الخادم
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n" + "=" * 55)
        print("  🛑 تم إيقاف الخادم")
        print("=" * 55)
        sys.exit(0)
        
    except OSError as e:
        if "Address already in use" in str(e):
            print("=" * 55)
            print("  ❌ خطأ: المنفذ", PORT, "مشغول")
            print("  💡 حاول تغيير PORT في الملف أو إيقاف الخادم الآخر")
            print("=" * 55)
            sys.exit(1)
        else:
            print("  ❌ خطأ:", e)
            sys.exit(1)

# ============================================
# تشغيل الخادم
# ============================================
if __name__ == "__main__":
    run_server()