-- ═══════════════════════════════════════════════════════════════
--  STORE CORE — مخطط قاعدة البيانات
--  PostgreSQL 15+ / Supabase
-- ═══════════════════════════════════════════════════════════════
--
--  التطبيق يتصل عبر مكتبة pg مباشرةً بدور postgres (مالك الجداول).
--  مالك الجدول يتجاوز RLS ما لم يُفعَّل FORCE — ولذلك:
--
--    • RLS مفعّل على كل الجداول
--    • بلا أي سياسة (السياسة الغائبة = منع كامل)
--    • FORCE معطّل عمدًا ← التطبيق يعمل، والمهاجم محجوب
--
--  ⚠️ لا تُفعّل FORCE ROW LEVEL SECURITY — ستقطع اتصال التطبيق.
--  ⚠️ لا تُضف سياسات لتسكيت تنبيهات Supabase بمستوى INFO؛
--     تلك التنبيهات صحيحة ومقصودة في هذه المعمارية.
--
--  طريقة التطبيق:
--    Supabase Dashboard ← SQL Editor ← الصق هذا الملف ← Run
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════
--  ١) التصنيفات
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  tagline     TEXT,
  color       TEXT DEFAULT '#0C1C77',
  icon        TEXT DEFAULT 'Package',
  "bannerUrl" TEXT,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

COMMENT ON COLUMN categories.slug IS 'يُفضّل بحروف لاتينية — أنظف للسيو ولمشاركة الروابط';
COMMENT ON COLUMN categories.icon IS 'اسم أيقونة من lucide-react — انظر lib/iconMap.js';

CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories("sortOrder");


-- ═══════════════════════════════════════════
--  ٢) المنتجات
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS products (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT,
  "fullDescription" TEXT,
  price             DOUBLE PRECISION NOT NULL DEFAULT 0,
  "oldPrice"        DOUBLE PRECISION,
  badge             TEXT,
  "imageUrl"        TEXT,
  "freeShipping"    BOOLEAN DEFAULT false,
  "freeInstall"     BOOLEAN DEFAULT false,
  "categoryId"      TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  published         BOOLEAN DEFAULT true,
  brand             TEXT,
  stock             TEXT DEFAULT 'in_stock',
  rating            DOUBLE PRECISION,
  "reviewCount"     INTEGER,
  "sortOrder"       INTEGER DEFAULT 0,
  "featuredOffer"   BOOLEAN DEFAULT false,
  "createdAt"       TIMESTAMPTZ DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT products_price_positive CHECK (price >= 0),
  CONSTRAINT products_oldprice_valid CHECK ("oldPrice" IS NULL OR "oldPrice" >= 0),
  CONSTRAINT products_rating_range   CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  CONSTRAINT products_stock_values   CHECK (stock IN ('in_stock','low_stock','out_of_stock','preorder'))
);

COMMENT ON COLUMN products.published     IS 'false = مخفي عن الزوار وظاهر في لوحة التحكم فقط';
COMMENT ON COLUMN products.rating        IS 'NULL = لا تظهر نجوم إطلاقًا. لا تملأه بأرقام غير حقيقية';
COMMENT ON COLUMN products."featuredOffer" IS 'تثبيت المنتج كصفقة صدارة في صفحة العروض';
COMMENT ON COLUMN products.price         IS 'صفر = «السعر حسب المواصفات» — يتحول الزر إلى طلب عرض سعر';

-- فهارس جزئية: أصغر وأسرع من الكاملة لأن الواجهة تصفّي على published دائمًا
CREATE INDEX IF NOT EXISTS idx_products_pub_cat_sort
  ON products("categoryId", "sortOrder", "createdAt" DESC) WHERE published IS NOT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_pub_sort
  ON products("sortOrder", "createdAt" DESC) WHERE published IS NOT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_discounted
  ON products("oldPrice", price) WHERE published IS NOT FALSE AND "oldPrice" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);


-- ═══════════════════════════════════════════
--  ٣) البنرات
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS banners (
  id                 TEXT PRIMARY KEY,
  placement          TEXT NOT NULL,
  "categoryId"       TEXT REFERENCES categories(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  subtitle           TEXT,
  "imageUrl"         TEXT,
  "linkCategorySlug" TEXT,
  "sortOrder"        INTEGER DEFAULT 0,
  active             BOOLEAN DEFAULT true,
  ratio              TEXT DEFAULT 'auto',
  "ctaLabel"         TEXT,
  "ctaHref"          TEXT,
  "createdAt"        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON COLUMN banners.placement IS 'home | category | shop | offers | contact | faq | maintenance | urgent | about | technician';
COMMENT ON COLUMN banners.ratio     IS 'auto = بلا قص | wide | hero | banner | wide35 | square';

CREATE INDEX IF NOT EXISTS idx_banners_placement
  ON banners(placement, "sortOrder") WHERE active IS NOT FALSE;


-- ═══════════════════════════════════════════
--  ٤) الطلبات
-- ═══════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  "orderNumber"   TEXT UNIQUE,
  "customerName"  TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerCity"  TEXT,
  "itemsJson"     TEXT NOT NULL,
  total           DOUBLE PRECISION NOT NULL DEFAULT 0,
  status          TEXT DEFAULT 'جديد',
  notes           TEXT,
  -- الإسناد التسويقي: يربط الطلب بالقناة التي جلبته
  source          TEXT,
  medium          TEXT,
  campaign        TEXT,
  "landingPath"   TEXT,
  "createdAt"     TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT orders_total_positive CHECK (total >= 0)
);

COMMENT ON COLUMN orders."itemsJson" IS 'نسخة نصية من المنتجات وقت الطلب — يبقى السجل سليمًا حتى لو حُذف المنتج';
COMMENT ON COLUMN orders.source      IS 'google | meta | snapchat | tiktok | direct …';
COMMENT ON COLUMN orders.medium      IS 'cpc | organic | paid_social | social | none';

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_orders_source  ON orders(source, medium);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);


-- ═══════════════════════════════════════════
--  ٥) الزيارات (مجهّلة الهوية)
-- ═══════════════════════════════════════════
--  لا IP ولا بصمة جهاز — فقط المصدر والمسار ومعرّف جلسة عشوائي.

CREATE TABLE IF NOT EXISTS visits (
  id          TEXT PRIMARY KEY,
  "sessionId" TEXT,
  path        TEXT,
  source      TEXT,
  medium      TEXT,
  campaign    TEXT,
  referrer    TEXT,
  device      TEXT,
  "isNew"     BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_created ON visits("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_visits_source  ON visits(source, medium);
CREATE INDEX IF NOT EXISTS idx_visits_session ON visits("sessionId");


-- ═══════════════════════════════════════════
--  ٦) الإعدادات (مفتاح/قيمة)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE settings IS 'هوية المتجر وروابط التواصل ومعرّفات التتبّع — انظر lib/settings.js';


-- ═══════════════════════════════════════════
--  ٧) الصفحات القانونية
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS legal_pages (
  slug              TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  content           TEXT,
  "metaDescription" TEXT,
  published         BOOLEAN DEFAULT true,
  "sortOrder"       INTEGER DEFAULT 0,
  "updatedAt"       TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
--  الأمان — تفعيل RLS وسحب صلاحيات الأدوار العامة
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;

-- دفاع في العمق: حتى لو أُضيفت سياسة خاطئة لاحقًا، غياب الصلاحية يمنع الوصول
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

-- أي جدول يُنشأ مستقبلًا يولد مقفلًا تلقائيًا
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;


-- ═══════════════════════════════════════════
--  البيانات الأولية
-- ═══════════════════════════════════════════

INSERT INTO legal_pages (slug, title, "sortOrder", published, content) VALUES
  ('terms',    'الشروط والأحكام',            1, false, ''),
  ('returns',  'سياسة الاستبدال والاسترجاع', 2, false, ''),
  ('shipping', 'الشحن والدفع',                3, false, '')
ON CONFLICT (slug) DO NOTHING;

-- نسخة المخطط — يقرأها التطبيق ليتخطّى الترحيلات عند كل بداية باردة
INSERT INTO settings (key, value) VALUES ('schema_version', '7')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ═══════════════════════════════════════════
--  تحسين المخطِّط
-- ═══════════════════════════════════════════

ANALYZE categories;
ANALYZE products;
ANALYZE banners;
ANALYZE orders;
ANALYZE visits;


-- ═══════════════════════════════════════════════════════════════
--  التحقق بعد التطبيق
-- ═══════════════════════════════════════════════════════════════
--
--  SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS force
--  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--  WHERE n.nspname = 'public' AND c.relkind = 'r';
--
--  المتوقع: rls = true للجميع · force = false للجميع
-- ═══════════════════════════════════════════════════════════════
