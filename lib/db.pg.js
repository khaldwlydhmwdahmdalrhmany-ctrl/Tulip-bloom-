import pg from "pg";
import crypto from "crypto";
import { STORE } from "../config/store.config.js";

const { Pool } = pg;

const globalForDb = globalThis;
function getPool() {
  if (globalForDb.__areejPgPool) return globalForDb.__areejPgPool;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },      // مطلوب للاتصال بـ Supabase

    // بيئة Vercel تشغّل نسخًا كثيرة قصيرة العمر؛ عدد اتصالات كبير لكل نسخة
    // يستنفد حصة القاعدة. Supavisor يجمّع الاتصالات أصلًا، فيكفي القليل.
    max: 3,
    idleTimeoutMillis: 10_000,               // إغلاق الخامل بدل إبقائه محجوزًا
    connectionTimeoutMillis: 8_000,          // فشل سريع بدل تعليق الصفحة
    keepAlive: true,                         // يتفادى إعادة مصافحة TLS كاملة
    allowExitOnIdle: true,
  });

  // خطأ في اتصال خامل يجب ألا يُسقط العملية كلها
  pool.on("error", (err) => console.error("[pg] خطأ في اتصال خامل:", err.message));
  globalForDb.__areejPgPool = pool;
  return pool;
}

/**
 * نسخة المخطط. ارفع الرقم كلما أضفت جدولًا أو عمودًا أو فهرسًا جديدًا،
 * وسيُطبَّق التعديل تلقائيًا عند أول تشغيل بعد النشر.
 */
const SCHEMA_VERSION = "14";

let schemaReady = null;

/**
 * تهيئة المخطط — بفحص نسخة سريع بدل تنفيذ الـ DDL في كل مرة.
 *
 * المشكلة قبل هذا: 32 عبارة DDL (CREATE TABLE / ADD COLUMN / CREATE INDEX)
 * كانت تُنفَّذ عند كل بداية باردة لكل نسخة دالة. كلها `IF NOT EXISTS` فلا
 * تُغيّر شيئًا، لكن كلًّا منها يطلب قفلًا على فهرس النظام — والتأخير يتراكم
 * قبل أن يعود أي استعلام بيانات، فتبدو الصفحة الأولى بطيئة.
 *
 * الآن: استعلام واحد خفيف يقرأ رقم النسخة. إن طابق، نتخطّى الـ DDL كليًا.
 */
async function ensureSchema() {
  if (schemaReady) return schemaReady;
  const pool = getPool();

  schemaReady = (async () => {
    try {
      const { rows } = await pool.query(
        `SELECT value FROM settings WHERE key = 'schema_version' LIMIT 1`
      );
      if (rows[0]?.value === SCHEMA_VERSION) return true;   // محدَّث — لا شيء ليُنفَّذ
    } catch {
      // جدول settings غير موجود بعد (تشغيل أول) — نكمل للتهيئة الكاملة
    }
    return runMigrations(pool);
  })();

  return schemaReady;
}

async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tagline TEXT,
      color TEXT DEFAULT '#0C1C77',
      icon TEXT DEFAULT 'Package',
      "bannerUrl" TEXT,
      "sortOrder" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      "fullDescription" TEXT DEFAULT '',
      price DOUBLE PRECISION NOT NULL,
      "oldPrice" DOUBLE PRECISION,
      badge TEXT,
      "imageUrl" TEXT,
      "freeShipping" BOOLEAN DEFAULT false,
      "freeInstall" BOOLEAN DEFAULT false,
      published BOOLEAN DEFAULT true,
      brand TEXT,
      stock TEXT DEFAULT 'in_stock',
      "sortOrder" INTEGER DEFAULT 0,
      "featuredOffer" BOOLEAN DEFAULT false,
      rating DOUBLE PRECISION,
      "reviewCount" INTEGER,
      "categoryId" TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      placement TEXT NOT NULL,
      "categoryId" TEXT,
      title TEXT NOT NULL,
      subtitle TEXT,
      "imageUrl" TEXT,
      "linkCategorySlug" TEXT,
      "sortOrder" INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true,
      ratio TEXT DEFAULT 'auto',
      "ctaLabel" TEXT,
      "ctaHref" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      "customerName" TEXT NOT NULL,
      "customerPhone" TEXT NOT NULL,
      "customerCity" TEXT,
      "itemsJson" TEXT NOT NULL,
      total DOUBLE PRECISION NOT NULL,
      status TEXT DEFAULT 'جديد',
      "orderNumber" TEXT,
      notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now()
    );
    CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      "sessionId" TEXT,
      path TEXT,
      source TEXT,
      medium TEXT,
      campaign TEXT,
      referrer TEXT,
      device TEXT,
      "isNew" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_visits_created ON visits("createdAt" DESC);
    CREATE INDEX IF NOT EXISTS idx_visits_source ON visits(source, medium);
    CREATE TABLE IF NOT EXISTS legal_pages (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      "metaDescription" TEXT,
      published BOOLEAN DEFAULT true,
      "sortOrder" INTEGER DEFAULT 0,
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS brand TEXT,
      ADD COLUMN IF NOT EXISTS stock TEXT DEFAULT 'in_stock',
      ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER,
      ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "featuredOffer" BOOLEAN DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_products_pub_cat_sort
      ON products("categoryId", "sortOrder", "createdAt" DESC) WHERE published IS NOT FALSE;
    CREATE INDEX IF NOT EXISTS idx_products_pub_sort
      ON products("sortOrder", "createdAt" DESC) WHERE published IS NOT FALSE;
    CREATE INDEX IF NOT EXISTS idx_banners_placement
      ON banners(placement, "sortOrder") WHERE active IS NOT FALSE;
    CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories("sortOrder");
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders("createdAt" DESC);
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS "orderNumber" TEXT,
      ADD COLUMN IF NOT EXISTS source TEXT,
      ADD COLUMN IF NOT EXISTS medium TEXT,
      ADD COLUMN IF NOT EXISTS campaign TEXT,
      ADD COLUMN IF NOT EXISTS "landingPath" TEXT;
    ALTER TABLE banners
      ADD COLUMN IF NOT EXISTS ratio TEXT DEFAULT 'auto',
      ADD COLUMN IF NOT EXISTS "ctaLabel" TEXT,
      ADD COLUMN IF NOT EXISTS "ctaHref" TEXT;
  `);


  /* ═══════════════════════════════════════════════════════════
   *  v8 — حسابات العملاء
   * ═══════════════════════════════════════════════════════════
   *  جداول جديدة فقط. الجداول القائمة لا تُمسّ عدا عمود
   *  `customerId` قابل للإفراغ في orders — الطلبات القديمة
   *  والطلبات كضيف تبقى صالحة بلا حساب.
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id              TEXT PRIMARY KEY,
      email           TEXT UNIQUE NOT NULL,
      "passwordHash"  TEXT NOT NULL,
      name            TEXT,
      phone           TEXT,
      "emailVerified" BOOLEAN DEFAULT false,
      "marketingOptIn" BOOLEAN DEFAULT false,
      status          TEXT DEFAULT 'active',
      "failedAttempts" INTEGER DEFAULT 0,
      "lockedUntil"   TIMESTAMPTZ,
      "lastLoginAt"   TIMESTAMPTZ,
      "createdAt"     TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT customers_status_values CHECK (status IN ('active','blocked'))
    );
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_created ON customers("createdAt" DESC);

    -- الجلسات تُخزَّن مجزّأة ليكون إبطالها ممكنًا؛ الرمز الخام لا يُحفظ أبدًا
    CREATE TABLE IF NOT EXISTS customer_sessions (
      id           TEXT PRIMARY KEY,
      "tokenHash"  TEXT UNIQUE NOT NULL,
      "customerId" TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      "userAgent"  TEXT,
      "expiresAt"  TIMESTAMPTZ NOT NULL,
      "createdAt"  TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_csessions_token ON customer_sessions("tokenHash");
    CREATE INDEX IF NOT EXISTS idx_csessions_customer ON customer_sessions("customerId");

    -- عناوين التسليم المحفوظة
    CREATE TABLE IF NOT EXISTS customer_addresses (
      id           TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      label        TEXT,
      city         TEXT,
      district     TEXT,
      street       TEXT,
      notes        TEXT,
      "isDefault"  BOOLEAN DEFAULT false,
      "createdAt"  TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_caddr_customer ON customer_addresses("customerId");

    -- دفتر المستلمين: من نرسل له الورد، لا من يشتريه
    CREATE TABLE IF NOT EXISTS customer_recipients (
      id            TEXT PRIMARY KEY,
      "customerId"  TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      relation      TEXT,
      phone         TEXT,
      city          TEXT,
      district      TEXT,
      street        TEXT,
      notes         TEXT,
      "createdAt"   TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_crecip_customer ON customer_recipients("customerId");

    -- تذكيرات المناسبات: التاريخ يُحفظ شهرًا ويومًا فقط (يتكرّر سنويًا)
    CREATE TABLE IF NOT EXISTS customer_reminders (
      id            TEXT PRIMARY KEY,
      "customerId"  TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      "recipientId" TEXT REFERENCES customer_recipients(id) ON DELETE SET NULL,
      title         TEXT NOT NULL,
      occasion      TEXT,
      month         INTEGER NOT NULL,
      day           INTEGER NOT NULL,
      "leadDays"    INTEGER DEFAULT 3,
      active        BOOLEAN DEFAULT true,
      "createdAt"   TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT reminders_month_range CHECK (month BETWEEN 1 AND 12),
      CONSTRAINT reminders_day_range   CHECK (day BETWEEN 1 AND 31)
    );
    CREATE INDEX IF NOT EXISTS idx_crem_customer ON customer_reminders("customerId");
    CREATE INDEX IF NOT EXISTS idx_crem_date ON customer_reminders(month, day) WHERE active IS NOT FALSE;

    -- رموز إعادة التعيين: مجزّأة، صالحة مرة واحدة
    CREATE TABLE IF NOT EXISTS password_resets (
      id           TEXT PRIMARY KEY,
      "tokenHash"  TEXT UNIQUE NOT NULL,
      "customerId" TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      "expiresAt"  TIMESTAMPTZ NOT NULL,
      "usedAt"     TIMESTAMPTZ,
      "createdAt"  TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_presets_token ON password_resets("tokenHash");

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS "customerId" TEXT;
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders("customerId");
  `);


  /* ── v9: المفضّلة ──
   * القيد الفريد على (customerId, productId) يمنع التكرار على
   * مستوى القاعدة لا الكود — الضغط المزدوج السريع يُنتج طلبين
   * متوازيين، والتحقّق في الكود وحده يسمح بمرورهما معًا.
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_favorites (
      id           TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      "productId"  TEXT NOT NULL,
      "createdAt"  TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT uq_fav UNIQUE ("customerId", "productId")
    );
    CREATE INDEX IF NOT EXISTS idx_fav_customer ON customer_favorites("customerId");
    CREATE INDEX IF NOT EXISTS idx_fav_product  ON customer_favorites("productId");
  `);


  /* ── v10: سجلّ استعلامات البحث ──
   * `normalized` هو الصورة المطبَّعة — بها نجمّع «هدية» و«هديه»
   * و«الهدية» في صفّ واحد بدل ثلاثة صفوف تبدو استعلامات مختلفة.
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS search_queries (
      id           TEXT PRIMARY KEY,
      raw          TEXT NOT NULL,
      normalized   TEXT NOT NULL,
      "resultCount" INTEGER DEFAULT 0,
      "customerId" TEXT,
      "createdAt"  TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_sq_norm ON search_queries(normalized);
    CREATE INDEX IF NOT EXISTS idx_sq_created ON search_queries("createdAt" DESC);
    CREATE INDEX IF NOT EXISTS idx_sq_zero ON search_queries(normalized) WHERE "resultCount" = 0;
  `);


  /* ── v11: التسويق والنمو ── */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id                 TEXT PRIMARY KEY,
      code               TEXT UNIQUE NOT NULL,
      type               TEXT NOT NULL DEFAULT 'percent',
      value              DOUBLE PRECISION NOT NULL DEFAULT 0,
      "minOrder"         DOUBLE PRECISION DEFAULT 0,
      "maxUses"          INTEGER,
      "usedCount"        INTEGER DEFAULT 0,
      "perCustomerLimit" INTEGER,
      "categorySlug"     TEXT,
      "startsAt"         TIMESTAMPTZ,
      "endsAt"           TIMESTAMPTZ,
      active             BOOLEAN DEFAULT true,
      note               TEXT,
      "createdAt"        TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT coupons_type_values CHECK (type IN ('percent','fixed','free_shipping')),
      CONSTRAINT coupons_value_range CHECK (value >= 0)
    );
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id           TEXT PRIMARY KEY,
      "couponId"   TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      "orderId"    TEXT,
      "customerId" TEXT,
      phone        TEXT,
      amount       DOUBLE PRECISION DEFAULT 0,
      "createdAt"  TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_redeem_coupon ON coupon_redemptions("couponId");
    CREATE INDEX IF NOT EXISTS idx_redeem_phone ON coupon_redemptions(phone);

    /* السلات المتروكة: مفتاحها الجلسة لا العميل — أغلب من يترك
       سلة لم يسجّل دخولًا أصلًا. */
    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id           TEXT PRIMARY KEY,
      "sessionId"  TEXT UNIQUE NOT NULL,
      "customerId" TEXT,
      "itemsJson"  TEXT NOT NULL,
      total        DOUBLE PRECISION DEFAULT 0,
      "contactName" TEXT,
      "contactPhone" TEXT,
      status       TEXT DEFAULT 'open',
      "recoveredOrderId" TEXT,
      source       TEXT,
      campaign     TEXT,
      "createdAt"  TIMESTAMPTZ DEFAULT now(),
      "updatedAt"  TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT ac_status_values CHECK (status IN ('open','contacted','recovered','dismissed'))
    );
    CREATE INDEX IF NOT EXISTS idx_ac_status ON abandoned_carts(status, "updatedAt" DESC);

    CREATE TABLE IF NOT EXISTS campaigns (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      source      TEXT NOT NULL,
      medium      TEXT,
      campaign    TEXT NOT NULL,
      "landingPath" TEXT DEFAULT '/',
      note        TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
      ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION DEFAULT 0;
  `);


  /* ── v12: إدارة علاقات العملاء ──
   *
   * ⚠️ `contactKey` نصّ حرّ لا مفتاح أجنبي، بصيغتين:
   *      c:<customerId>   لحساب مسجّل
   *      p:<digits>       لجوال (ضيف بلا حساب)
   *
   * السبب: أغلب طلبات متجر الورد تأتي من ضيوف. ربط ملاحظات
   * ومهام CRM بجدول `customers` وحده يجعلها عديمة الفائدة —
   * لا يمكنك تدوين ملاحظة عن أكثر عملائك.
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crm_notes (
      id           TEXT PRIMARY KEY,
      "contactKey" TEXT NOT NULL,
      body         TEXT NOT NULL,
      author       TEXT,
      "createdAt"  TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_crmnotes_key ON crm_notes("contactKey", "createdAt" DESC);

    CREATE TABLE IF NOT EXISTS crm_tasks (
      id           TEXT PRIMARY KEY,
      "contactKey" TEXT NOT NULL,
      title        TEXT NOT NULL,
      "dueAt"      TIMESTAMPTZ,
      done         BOOLEAN DEFAULT false,
      "createdAt"  TIMESTAMPTZ DEFAULT now(),
      "completedAt" TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_crmtasks_key ON crm_tasks("contactKey");
    CREATE INDEX IF NOT EXISTS idx_crmtasks_due ON crm_tasks("dueAt") WHERE done IS NOT TRUE;

    CREATE TABLE IF NOT EXISTS crm_tags (
      id           TEXT PRIMARY KEY,
      "contactKey" TEXT NOT NULL,
      tag          TEXT NOT NULL,
      "createdAt"  TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT uq_crmtag UNIQUE ("contactKey", tag)
    );
    CREATE INDEX IF NOT EXISTS idx_crmtags_key ON crm_tags("contactKey");
  `);


  /* ── v13: SEO المتقدّم ── */
  await pool.query(`
    /* تجاوزات لكل مسار: العنوان والوصف والصورة ومنع الفهرسة.
       المفتاح هو المسار لا معرّف المنتج — فيغطّي الصفحات الثابتة
       والتصنيفات والمنتجات بجدول واحد. */
    CREATE TABLE IF NOT EXISTS seo_overrides (
      id            TEXT PRIMARY KEY,
      path          TEXT UNIQUE NOT NULL,
      title         TEXT,
      description   TEXT,
      "ogImage"     TEXT,
      keywords      TEXT,
      "noIndex"     BOOLEAN DEFAULT false,
      canonical     TEXT,
      "updatedAt"   TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_seo_path ON seo_overrides(path);

    /* تحويلات دائمة — ضرورية عند تغيير سلَغ تصنيف أو حذف منتج
       مفهرس. بدونها يفقد المتجر ترتيبه ويورّث الزوّار صفحة 404. */
    CREATE TABLE IF NOT EXISTS seo_redirects (
      id          TEXT PRIMARY KEY,
      "fromPath"  TEXT UNIQUE NOT NULL,
      "toPath"    TEXT NOT NULL,
      permanent   BOOLEAN DEFAULT true,
      hits        INTEGER DEFAULT 0,
      "createdAt" TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_redirect_from ON seo_redirects("fromPath");
  `);


  /* ── v14: منشئ الصفحات ──
   * `blocksJson` مصفوفة بلوكات { type, props } — لا HTML خام.
   * القرار مقصود: تخزين HTML يعني قبول ما يكتبه المحرّر حرفيًا
   * وحقنه في الصفحة، وهي أوسع ثغرة XSS في أي نظام محتوى.
   * البلوك المهيكل يُصيَّر بمكوّن معروف بحقول معروفة.
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pages (
      id             TEXT PRIMARY KEY,
      slug           TEXT UNIQUE NOT NULL,
      title          TEXT NOT NULL,
      status         TEXT DEFAULT 'draft',
      "blocksJson"   TEXT DEFAULT '[]',
      "seoTitle"     TEXT,
      "seoDescription" TEXT,
      "ogImage"      TEXT,
      "noIndex"      BOOLEAN DEFAULT false,
      "showInFooter" BOOLEAN DEFAULT false,
      "showInHeader" BOOLEAN DEFAULT false,
      "sortOrder"    INTEGER DEFAULT 0,
      "publishedAt"  TIMESTAMPTZ,
      "createdAt"    TIMESTAMPTZ DEFAULT now(),
      "updatedAt"    TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT pages_status_values CHECK (status IN ('draft','published'))
    );
    CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
    CREATE INDEX IF NOT EXISTS idx_pages_pub ON pages(status, "sortOrder");
  `);

  // تسجيل النسخة — أي بداية باردة لاحقة تقرأها وتتخطّى كل ما سبق
  await pool.query(
    `INSERT INTO settings (key, value, "updatedAt") VALUES ('schema_version', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()`,
    [SCHEMA_VERSION]
  );

  return true;
}

const newId = () => crypto.randomBytes(12).toString("hex");

// يحوّل القيم الفارغة إلى NULL بدل 0 — مهم للتقييمات:
// تقييم غير مُدخل يجب ألا يُعرض إطلاقًا، لا أن يظهر كصفر.
const numOrNull = (v) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v);

/* ============ التصنيفات ============ */
export async function getCategories() {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(`SELECT * FROM categories ORDER BY "sortOrder" ASC`);
  const counts = await pool.query(`SELECT "categoryId", COUNT(*) as n FROM products GROUP BY "categoryId"`);
  const countMap = Object.fromEntries(counts.rows.map((r) => [r.categoryId, Number(r.n)]));
  return rows.map((c) => ({ ...c, _count: { products: countMap[c.id] || 0 } }));
}

export async function getCategoryBySlug(slug) {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT * FROM categories WHERE slug = $1`, [slug]);
  return rows[0] || null;
}

export async function createCategory({ name, slug, tagline, color, icon }) {
  await ensureSchema();
  const pool = getPool();
  const id = newId();
  const { rows: countRows } = await pool.query(`SELECT COUNT(*) as n FROM categories`);
  const sortOrder = Number(countRows[0].n) + 1;
  await pool.query(
    `INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, slug, name, tagline || null, color || "#0C1C77", icon || "Package", sortOrder]
  );
  const { rows } = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return rows[0];
}

export async function updateCategory(id, { name, tagline, color, icon, bannerUrl, sortOrder }) {
  await ensureSchema();
  await getPool().query(
    `UPDATE categories SET name=$1, tagline=$2, color=$3, icon=$4, "bannerUrl"=$5, "sortOrder"=$6 WHERE id=$7`,
    [name, tagline || null, color || "#0C1C77", icon || "Package", bannerUrl || null, sortOrder ?? 0, id]
  );
  const { rows } = await getPool().query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return rows[0];
}

export async function deleteCategory(id) {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(`SELECT COUNT(*) as n FROM products WHERE "categoryId" = $1`, [id]);
  const inUse = Number(rows[0].n);
  if (inUse > 0) throw new Error(`لا يمكن حذف هذا التصنيف لأنه يحتوي على ${inUse} منتج`);
  await pool.query(`DELETE FROM categories WHERE id = $1`, [id]);
}

/* ============ البنرات ============ */
export async function getBanners({ placement } = {}) {
  await ensureSchema();
  const pool = getPool();
  const { rows } = placement
    ? await pool.query(`SELECT * FROM banners WHERE placement = $1 ORDER BY "sortOrder" ASC`, [placement])
    : await pool.query(`SELECT * FROM banners ORDER BY "sortOrder" ASC`);
  return rows;
}

export async function createBanner(data) {
  await ensureSchema();
  const id = newId();
  await getPool().query(
    `INSERT INTO banners (id, placement, "categoryId", title, subtitle, "imageUrl", "linkCategorySlug", "sortOrder", active, ratio, "ctaLabel", "ctaHref")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [id, data.placement, data.categoryId || null, data.title, data.subtitle || null, data.imageUrl || null, data.linkCategorySlug || null, data.sortOrder ?? 0, data.active !== false, data.ratio || "auto", data.ctaLabel || null, data.ctaHref || null]
  );
  const { rows } = await getPool().query(`SELECT * FROM banners WHERE id = $1`, [id]);
  return rows[0];
}

export async function updateBanner(id, data) {
  await ensureSchema();
  await getPool().query(
    `UPDATE banners SET placement=$1, "categoryId"=$2, title=$3, subtitle=$4, "imageUrl"=$5, "linkCategorySlug"=$6, "sortOrder"=$7, active=$8, ratio=$9, "ctaLabel"=$10, "ctaHref"=$11 WHERE id=$12`,
    [data.placement, data.categoryId || null, data.title, data.subtitle || null, data.imageUrl || null, data.linkCategorySlug || null, data.sortOrder ?? 0, data.active !== false, data.ratio || "auto", data.ctaLabel || null, data.ctaHref || null, id]
  );
  const { rows } = await getPool().query(`SELECT * FROM banners WHERE id = $1`, [id]);
  return rows[0];
}

export async function deleteBanner(id) {
  await ensureSchema();
  await getPool().query(`DELETE FROM banners WHERE id = $1`, [id]);
}

/* ============ المنتجات ============ */
/**
 * جلب المنتجات.
 * افتراضيًا تُستبعد المنتجات المخفية (published = false) — واجهة المتجر
 * يجب ألا تعرضها أبدًا. لوحة التحكم تمرّر includeHidden لرؤيتها كلها.
 * الترتيب: sortOrder اليدوي أولًا، ثم الأحدث.
 */
/**
 * أعمدة صفحات القوائم — بلا `fullDescription`.
 * ذلك الحقل يشكّل ٦٦٪ من حجم صف المنتج ولا يُعرض إلا في صفحة المنتج الواحد،
 * فجلبه في قوائم من ٥٠٠ منتج يهدر مئات الكيلوبايتات في كل طلب.
 */
const LIST_COLS = `
  p.id, p.name, p.description, p.price, p."oldPrice", p.badge, p."imageUrl",
  p."freeShipping", p."freeInstall", p."categoryId", p.published, p.brand, p.stock,
  p.rating, p."reviewCount", p."sortOrder", p."featuredOffer", p."createdAt", p."updatedAt"
`;

export async function getProducts({ categorySlug, includeHidden = false } = {}) {
  await ensureSchema();
  const pool = getPool();
  const visible = includeHidden ? "" : "AND p.published IS NOT FALSE";
  const order = `ORDER BY p."sortOrder" ASC NULLS LAST, p."createdAt" DESC`;

  const query = categorySlug
    ? {
        text: `SELECT ${LIST_COLS}, c.name as "categoryName", c.slug as "categorySlug", c.color as "categoryColor", c.icon as "categoryIcon"
               FROM products p JOIN categories c ON p."categoryId" = c.id
               WHERE c.slug = $1 ${visible} ${order}`,
        values: [categorySlug],
      }
    : {
        text: `SELECT ${LIST_COLS}, c.name as "categoryName", c.slug as "categorySlug", c.color as "categoryColor", c.icon as "categoryIcon"
               FROM products p JOIN categories c ON p."categoryId" = c.id
               WHERE true ${visible} ${order}`,
        values: [],
      };
  const { rows } = await pool.query(query);
  return rows.map((r) => ({
    ...r,
    category: { name: r.categoryName, slug: r.categorySlug, color: r.categoryColor, icon: r.categoryIcon },
  }));
}

export async function getProductById(id) {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT * FROM products WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createProduct(data) {
  await ensureSchema();
  const pool = getPool();
  const id = newId();
  await pool.query(
    `INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      id, data.name, data.description || "", data.fullDescription || "", Number(data.price),
      data.oldPrice ? Number(data.oldPrice) : null, data.badge || null, data.imageUrl || null,
      !!data.freeShipping, !!data.freeInstall, data.categoryId,
      data.brand || null, data.stock || "in_stock",
      numOrNull(data.rating), numOrNull(data.reviewCount),
      Number(data.sortOrder) || 0, !!data.featuredOffer,
    ]
  );
  return await getProductById(id);
}

export async function updateProduct(id, data) {
  await ensureSchema();
  const current = await getProductById(id);
  if (!current) throw new Error("المنتج غير موجود");
  const merged = { ...current, ...data };
  await getPool().query(
    `UPDATE products SET name=$1, description=$2, "fullDescription"=$3, price=$4, "oldPrice"=$5, badge=$6, "imageUrl"=$7, "freeShipping"=$8, "freeInstall"=$9, "categoryId"=$10, published=$11, brand=$12, stock=$13, rating=$14, "reviewCount"=$15, "sortOrder"=$16, "featuredOffer"=$17, "updatedAt"=now()
     WHERE id=$18`,
    [
      merged.name, merged.description, merged.fullDescription, Number(merged.price),
      merged.oldPrice === "" || merged.oldPrice === null || merged.oldPrice === undefined ? null : Number(merged.oldPrice),
      merged.badge || null, merged.imageUrl || null, !!merged.freeShipping, !!merged.freeInstall,
      merged.categoryId, !!merged.published,
      merged.brand || null, merged.stock || "in_stock",
      numOrNull(merged.rating), numOrNull(merged.reviewCount),
      Number(merged.sortOrder) || 0, !!merged.featuredOffer,
      id,
    ]
  );
  return await getProductById(id);
}

export async function deleteProduct(id) {
  await ensureSchema();
  await getPool().query(`DELETE FROM products WHERE id = $1`, [id]);
}

export async function countProducts() {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT COUNT(*) as n FROM products`);
  return Number(rows[0].n);
}
export async function countCategories() {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT COUNT(*) as n FROM categories`);
  return Number(rows[0].n);
}
export async function countOrders() {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT COUNT(*) as n FROM orders`);
  return Number(rows[0].n);
}

/* ============ الطلبات ============ */
export async function getOrders() {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT * FROM orders ORDER BY "createdAt" DESC`);
  return rows;
}

export const ORDER_STATUSES = ["جديد", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];

export async function updateOrderStatus(id, status, notes) {
  await ensureSchema();
  if (!ORDER_STATUSES.includes(status)) throw new Error("حالة طلب غير معروفة");
  await getPool().query(
    `UPDATE orders SET status = $1, notes = COALESCE($2, notes) WHERE id = $3`,
    [status, notes ?? null, id]
  );
  const { rows } = await getPool().query(`SELECT * FROM orders WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createOrder(data) {
  await ensureSchema();
  const { customerName, customerPhone, customerCity, items, total } = data;
  const id = newId();
  await getPool().query(
    `INSERT INTO orders (id, "orderNumber", "customerName", "customerPhone", "customerCity", "itemsJson", total, source, medium, campaign, "landingPath", "couponCode", discount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, await nextOrderNumber(), customerName, customerPhone, customerCity || null, JSON.stringify(items), Number(total),
     data.source || null, data.medium || null, data.campaign || null, data.landingPath || null,
     data.couponCode || null, Number(data.discount) || 0]
  );
  const { rows } = await getPool().query(`SELECT * FROM orders WHERE id = $1`, [id]);
  return rows[0];
}


/* ============ الإعدادات العامة ============ */

export async function getSettings() {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT key, value FROM settings`);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function saveSettings(entries) {
  await ensureSchema();
  const pool = getPool();
  for (const [key, value] of Object.entries(entries)) {
    await pool.query(
      `INSERT INTO settings (key, value, "updatedAt") VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()`,
      [key, value ?? null]
    );
  }
  return getSettings();
}

/** رقم طلب مقروء: {orderPrefix}-YYMM-1001 */
export async function nextOrderNumber() {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT nextval('order_number_seq') AS n`);
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  // ⚠️ إصلاح خلل نواة: كانت البادئة "AR-" مثبّتة (أريج النقاء) في كل متجر
  return `${STORE.orderPrefix || "OR"}-${yy}${mm}-${rows[0].n}`;
}


/* ============ التحليلات ============ */

export async function recordVisit(v) {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO visits (id, "sessionId", path, source, medium, campaign, referrer, device, "isNew")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [newId(), v.sessionId || null, v.path || null, v.source || "direct", v.medium || "none",
     v.campaign || null, v.referrer || null, v.device || null, v.isNew !== false]
  );
}

/**
 * ملخّص تحليلي لفترة محددة.
 * كل الأرقام محسوبة من قاعدة البيانات مباشرة — لا تقديرات ولا عيّنات.
 */
export async function getAnalytics({ days = 30 } = {}) {
  await ensureSchema();
  const pool = getPool();
  const since = `now() - interval '${Number(days)} days'`;

  const [totals, bySource, byMedium, byDay, topProducts, orderSources, topPages] = await Promise.all([
    pool.query(`SELECT
        (SELECT count(*) FROM visits WHERE "createdAt" > ${since}) AS views,
        (SELECT count(DISTINCT "sessionId") FROM visits WHERE "createdAt" > ${since}) AS sessions,
        (SELECT count(*) FROM visits WHERE "isNew" AND "createdAt" > ${since}) AS new_visitors,
        (SELECT count(*) FROM orders WHERE "createdAt" > ${since}) AS orders,
        (SELECT COALESCE(sum(total),0) FROM orders WHERE "createdAt" > ${since}) AS revenue`),

    pool.query(`SELECT source, count(DISTINCT "sessionId") AS sessions, count(*) AS views
                FROM visits WHERE "createdAt" > ${since}
                GROUP BY source ORDER BY sessions DESC LIMIT 10`),

    pool.query(`SELECT medium, count(DISTINCT "sessionId") AS sessions
                FROM visits WHERE "createdAt" > ${since}
                GROUP BY medium ORDER BY sessions DESC`),

    pool.query(`SELECT to_char(d.day,'YYYY-MM-DD') AS day,
                  COALESCE(v.n,0) AS visits, COALESCE(o.n,0) AS orders
                FROM generate_series((now() - interval '${Number(days)} days')::date, now()::date, '1 day') d(day)
                LEFT JOIN (SELECT "createdAt"::date AS day, count(DISTINCT "sessionId") n FROM visits GROUP BY 1) v ON v.day = d.day
                LEFT JOIN (SELECT "createdAt"::date AS day, count(*) n FROM orders GROUP BY 1) o ON o.day = d.day
                ORDER BY d.day`),

    pool.query(`SELECT p.id, p.name, p."imageUrl", count(*) AS times, sum(oi.qty) AS units
                FROM orders o
                CROSS JOIN LATERAL jsonb_to_recordset(o."itemsJson"::jsonb) AS oi(id text, name text, qty int, price numeric)
                JOIN products p ON p.id = oi.id
                WHERE o."createdAt" > ${since}
                GROUP BY p.id, p.name, p."imageUrl"
                ORDER BY units DESC NULLS LAST LIMIT 8`).catch(() => ({ rows: [] })),

    pool.query(`SELECT COALESCE(source,'direct') AS source, COALESCE(medium,'none') AS medium,
                  count(*) AS orders, COALESCE(sum(total),0) AS revenue
                FROM orders WHERE "createdAt" > ${since}
                GROUP BY 1,2 ORDER BY orders DESC LIMIT 12`),

    pool.query(`SELECT path, count(*) AS views FROM visits
                WHERE "createdAt" > ${since} GROUP BY path ORDER BY views DESC LIMIT 8`),
  ]);

  return {
    totals: totals.rows[0] || {},
    bySource: bySource.rows,
    byMedium: byMedium.rows,
    byDay: byDay.rows,
    topProducts: topProducts.rows,
    orderSources: orderSources.rows,
    topPages: topPages.rows,
  };
}


/* ============ فهرس خفيف للسلة ============ */

/**
 * أخف تمثيل ممكن للمنتجات — تحتاجه السلة فقط لعرض اسم وسعر وصورة.
 *
 * كان التخطيط يرسل سجل كل منتج كاملًا (بما فيه الوصف الطويل والمواصفات)
 * إلى المتصفح مع كل صفحة. عند 500 منتج يعني ذلك مئات الكيلوبايتات
 * تُنقل في كل تنقّل. هذه الدالة تُنزل الحجم إلى نحو 5% منه.
 */
export async function getProductIndex() {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT p.id, p.name, p.price, p."imageUrl", c.color AS "categoryColor", c.icon AS "categoryIcon"
     FROM products p JOIN categories c ON p."categoryId" = c.id
     WHERE p.published IS NOT FALSE`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    imageUrl: r.imageUrl,
    category: { color: r.categoryColor, icon: r.categoryIcon },
  }));
}

/** بيانات خفيفة لتوليد خريطة الموقع — بلا أوصاف أو مواصفات. */
export async function getSitemapData() {
  await ensureSchema();
  const pool = getPool();
  const [products, categories] = await Promise.all([
    pool.query(`SELECT id, name, "updatedAt", "createdAt" FROM products WHERE published IS NOT FALSE`),
    pool.query(`SELECT slug, "createdAt" FROM categories ORDER BY "sortOrder"`),
  ]);
  return { products: products.rows, categories: categories.rows };
}


/* ============ الصفحات القانونية ============ */

/** الصفحات المنشورة فقط — للتذييل وخريطة الموقع. */
export async function getLegalPages() {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT * FROM legal_pages WHERE published IS NOT FALSE ORDER BY "sortOrder"`
  );
  return rows;
}

/** كل الصفحات بما فيها غير المنشورة — للوحة التحكم. */
export async function getAllLegalPages() {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT * FROM legal_pages ORDER BY "sortOrder"`);
  return rows;
}

export async function getLegalPage(slug) {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT * FROM legal_pages WHERE slug = $1`, [slug]);
  return rows[0] || null;
}

export async function updateLegalPage(slug, data) {
  await ensureSchema();
  await getPool().query(
    `UPDATE legal_pages SET title=$1, content=$2, "metaDescription"=$3, published=$4, "updatedAt"=now()
     WHERE slug=$5`,
    [data.title, data.content || "", data.metaDescription || null, !!data.published, slug]
  );
  return getLegalPage(slug);
}
