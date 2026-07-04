-- ============================================
-- 🗄️  TITHKARI - إعدادات Supabase الكاملة
-- 📅  التاريخ: 2026-07-04
-- ============================================

-- ============================================
-- 📌 1. إعدادات الدفع (payment_settings)
-- ============================================
INSERT INTO store_settings (key, value, group_name, updated_at)
VALUES (
  'payment_settings',
  '{
    "stripe": {
      "enabled": true,
      "publishableKey": "pk_test_XXXXXXXXXXXXXXXXXXXXXXXX",
      "secretKey": "sk_test_XXXXXXXXXXXXXXXXXXXXXXXX"
    },
    "paypal": {
      "enabled": true,
      "clientId": "AXpXXXXXXXXXXXXXXXXXXXXXXXX",
      "secretKey": "ELxXXXXXXXXXXXXXXXXXXXXXXXX"
    },
    "cod": {
      "enabled": true
    },
    "bankTransfer": {
      "enabled": true,
      "bankName": "البنك الأهلي السعودي",
      "accountNumber": "SA12 3456 7890 1234 5678",
      "iban": "SA12 3456 7890 1234 5678",
      "beneficiary": "مؤسسة Tithkari للتجارة"
    }
  }'::jsonb,
  'payment',
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  group_name = EXCLUDED.group_name,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- 🏪 2. هوية المتجر (branding)
-- ============================================
INSERT INTO store_settings (key, value, group_name, updated_at)
VALUES (
  'branding',
  '{
    "logo": "",
    "primary_color": "#FFD700",
    "secondary_color": "#8B0000",
    "bg_color": "#0F0F1A",
    "text_color": "#FFFFFF",
    "font_family": "Cairo",
    "font_size": 16
  }'::jsonb,
  'branding',
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  group_name = EXCLUDED.group_name,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- 📐 3. إعدادات العرض (display)
-- ============================================
INSERT INTO store_settings (key, value, group_name, updated_at)
VALUES (
  'display',
  '{
    "default_view": "grid",
    "products_per_page": 12,
    "show_categories": true
  }'::jsonb,
  'display',
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  group_name = EXCLUDED.group_name,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- 📋 4. معلومات المتجر (storeInfo)
-- ============================================
INSERT INTO store_settings (key, value, group_name, updated_at)
VALUES (
  'storeInfo',
  '{
    "name": "Tithkari",
    "description": "متجر متخصص في تصميم وبيع الدروع الفاخرة"
  }'::jsonb,
  'general',
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  group_name = EXCLUDED.group_name,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- 💰 5. إعدادات العملات (currencies)
-- ============================================
INSERT INTO store_settings (key, value, group_name, updated_at)
VALUES (
  'currencies',
  '{
    "default": "SAR",
    "available": ["SAR", "BHD", "QAR", "AED", "KWD", "OMR", "USD", "EUR"]
  }'::jsonb,
  'currencies',
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  group_name = EXCLUDED.group_name,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- 📧 6. إعدادات البريد (email_settings)
-- ============================================
INSERT INTO store_settings (key, value, group_name, updated_at)
VALUES (
  'email_settings',
  '{
    "sendgrid": {
      "enabled": true,
      "apiKey": "SG.XXXXXXXXXXXXXXXXXXXXXXXX",
      "fromEmail": "info@tithkari.com",
      "fromName": "Tithkari - متجر الدروع الفاخرة"
    },
    "adminEmail": "admin@tithkari.com",
    "subjectPrefix": "[Tithkari] "
  }'::jsonb,
  'email',
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  group_name = EXCLUDED.group_name,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- 🎫 7. الكوبونات (coupons) - مع إصلاح العمود
-- ============================================
-- 🔧 التحقق من وجود الأعمدة المطلوبة
DO $$
BEGIN
  -- التحقق من وجود عمود expiry_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'expiry_date'
  ) THEN
    ALTER TABLE coupons ADD COLUMN expiry_date TIMESTAMP;
  END IF;
  
  -- التحقق من وجود عمود valid_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'valid_until'
  ) THEN
    ALTER TABLE coupons ADD COLUMN valid_until TIMESTAMP;
  END IF;
  
  -- التحقق من وجود عمود max_uses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'max_uses'
  ) THEN
    ALTER TABLE coupons ADD COLUMN max_uses INTEGER DEFAULT 999;
  END IF;
  
  -- التحقق من وجود عمود used_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'used_count'
  ) THEN
    ALTER TABLE coupons ADD COLUMN used_count INTEGER DEFAULT 0;
  END IF;
  
  -- التحقق من وجود عمود min_order_amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'min_order_amount'
  ) THEN
    ALTER TABLE coupons ADD COLUMN min_order_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- التحقق من وجود عمود max_discount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'max_discount'
  ) THEN
    ALTER TABLE coupons ADD COLUMN max_discount DECIMAL(10,2);
  END IF;
END $$;

-- إدراج الكوبونات
INSERT INTO coupons (code, discount_type, discount_value, max_discount, min_order_amount, expiry_date, max_uses, used_count, status, created_at)
VALUES 
  ('WELCOME10', 'percentage', 10, 50, 100, '2027-01-01 23:59:59', 100, 0, 'active', NOW()),
  ('SAVE20', 'fixed', 20, NULL, 50, '2026-12-31 23:59:59', 50, 0, 'active', NOW()),
  ('FIRSTORDER', 'percentage', 15, 30, 50, '2026-12-31 23:59:59', 200, 0, 'active', NOW())
ON CONFLICT (code) 
DO UPDATE SET 
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  max_discount = EXCLUDED.max_discount,
  min_order_amount = EXCLUDED.min_order_amount,
  expiry_date = EXCLUDED.expiry_date,
  max_uses = EXCLUDED.max_uses,
  status = EXCLUDED.status;

-- ============================================
-- 📢 8. البنرات (banners)
-- ============================================
INSERT INTO banners (title, subtitle, icon, bg_color, link_url, link_text, position, display_order, is_active, created_at)
VALUES 
  (
    '🛡️ تشكيلة جديدة 2026',
    'اكتشف أحدث تصاميم الدروع الفاخرة',
    '🛡️',
    '#1A1A2E',
    '#products',
    'استعرض الآن',
    'home',
    1,
    true,
    NOW()
  ),
  (
    '🎨 صمم درعك بنفسك',
    'اختر الألوان والنقوش والرموز التي تعبر عنك',
    '🎨',
    '#2D1B4E',
    'design-studio.html',
    'ابدأ التصميم',
    'home',
    2,
    true,
    NOW()
  ),
  (
    '⚔️ دروع ملوكية فاخرة',
    'تصاميم مستوحاة من العصور الذهبية',
    '👑',
    '#3D1F00',
    '#products',
    'تسوق الآن',
    'home',
    3,
    true,
    NOW()
  );

-- ============================================
-- 📂 9. التصنيفات (categories)
-- ============================================
INSERT INTO categories (name, slug, description, icon, image_url, display_order, is_active, created_at)
VALUES 
  ('كلاسيكي', 'classic', 'تصاميم كلاسيكية عريقة', 'fa-helmet-safety', NULL, 1, true, NOW()),
  ('خيالي', 'fantasy', 'تصاميم مستوحاة من الخيال', 'fa-dragon', NULL, 2, true, NOW()),
  ('ملوكي', 'royal', 'تصاميم ملوكية فاخرة', 'fa-crown', NULL, 3, true, NOW()),
  ('حديث', 'modern', 'تصاميم عصرية حديثة', 'fa-bolt', NULL, 4, true, NOW()),
  ('مخصص', 'custom', 'تصاميم مخصصة حسب الطلب', 'fa-paint-brush', NULL, 5, true, NOW())
ON CONFLICT (slug) 
DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- ============================================
-- 🦶 10. عناصر التذييل (footer_items)
-- ============================================
INSERT INTO footer_items (label, icon, content, type, link_url, display_order, is_active, created_at)
VALUES 
  ('من نحن', 'fa-info-circle', 'متجر متخصص في تصميم وبيع الدروع الفاخرة المصنوعة يدوياً', 'text', NULL, 1, true, NOW()),
  ('سياسة المتجر', 'fa-file-contract', 'ضمان الجودة 100% وإرجاع خلال 14 يوماً', 'text', NULL, 2, true, NOW()),
  ('الشحن والتوصيل', 'fa-truck', 'شحن سريع لجميع أنحاء العالم خلال 3-5 أيام عمل', 'text', NULL, 3, true, NOW()),
  ('اتصل بنا', 'fa-envelope', 'info@tithkari.com', 'contact', NULL, 4, true, NOW()),
  ('واتساب', 'fa-whatsapp', 'تواصل معنا', 'link', 'https://wa.me/966500000000', 5, true, NOW()),
  ('انستغرام', 'fa-instagram', 'تابعنا', 'link', 'https://instagram.com/tithkari', 6, true, NOW());

-- ============================================
-- 📋 11. القوائم (menus)
-- ============================================
INSERT INTO menus (label, url, icon, position, display_order, is_active, created_at)
VALUES 
  ('الرئيسية', '#', '🏠', 'header', 1, true, NOW()),
  ('المنتجات', '#products', '🛒', 'header', 2, true, NOW()),
  ('صمم درعك', 'design-studio.html', '🎨', 'header', 3, true, NOW()),
  ('التقييمات', '#reviews', '⭐', 'header', 4, true, NOW());

-- ============================================
-- ⭐ 12. التقييمات (reviews)
-- ============================================
INSERT INTO reviews (customer_name, rating, comment, status, created_at)
VALUES 
  ('أحمد محمد', 5, 'درع رائع جداً! جودة عالية وتصميم ممتاز. شكراً لكم', 'approved', NOW()),
  ('سارة علي', 4, 'الدرع جميل ولكن تأخر الشحن قليلاً', 'approved', NOW()),
  ('خالد عبدالله', 5, 'تجربة شراء ممتازة. سأطلب مرة أخرى بالتأكيد', 'approved', NOW());

-- ============================================
-- ✅ تم الانتهاء من إعداد جميع البيانات
-- ============================================
SELECT '✅ تم إعداد جميع البيانات بنجاح!' AS result;