// طبقة الوصول لقاعدة البيانات.
//
// للتطوير والتجربة المحلية الآن: نستخدم SQLite (ملف حقيقي على القرص عبر وحدة node:sqlite المدمجة في Node.js).
// عند النشر الفعلي على Vercel لاحقًا: يتم استبدال محتوى هذا الملف فقط باستخدام @vercel/postgres
// بنفس أسماء الدوال بالضبط (getCategories, getProducts, createProduct...) — لن تحتاج أي صفحة
// أو مسار API آخر في المشروع للتعديل، لأنها كلها تستدعي هذه الدوال فقط ولا تعرف نوع القاعدة الفعلي.

import { DatabaseSync } from "node:sqlite";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { STORE } from "../config/store.config.js";

const DB_PATH = path.join(process.cwd(), "data", "areej.db");

/**
 * ⚠️ إصلاح خلل نواة — تسوية صفوف node:sqlite
 *
 * `node:sqlite` يُعيد صفوفًا بنموذج أولي فارغ (null prototype). React Server
 * Components ترفض تمريرها إلى أي مكوّن عميل وترمي:
 *
 *   Only plain objects, and a few built-ins, can be passed to Client
 *   Components from Server Components.
 *
 * أعراض الخلل: فشل البناء عند وجود بنرات، و500 في /admin/orders، وأي
 * دالة تُعيد صفًّا خامًا إلى مكوّن عميل مستقبلًا.
 *
 * `getProducts` و`getCategories` كانتا تنشران الصفوف يدويًا (`...r`) فنجتا
 * بالصدفة؛ بقية الدوال لا. العلاج هنا عند المصدر لا في كل دالة على حدة:
 * نغلّف `db.prepare` فتُسوَّى كل النتائج تلقائيًا، وأي دالة تُضاف لاحقًا
 * تكون سليمة بلا أن يتذكّر أحد هذه القاعدة.
 *
 * Postgres عبر `pg` غير متأثر — يُعيد كائنات عادية أصلًا.
 */
const plain = (v) => (v && typeof v === "object" ? { ...v } : v);

function withPlainRows(db) {
  const nativePrepare = db.prepare.bind(db);
  db.prepare = (sql) => {
    const stmt = nativePrepare(sql);
    return {
      all: (...a) => stmt.all(...a).map(plain),
      get: (...a) => plain(stmt.get(...a)),
      run: (...a) => stmt.run(...a),
      iterate: (...a) => stmt.iterate?.(...a),
    };
  };
  return db;
}

const globalForDb = globalThis;
/** ⭐ مُصدَّرة ليستعملها lib/customerDb.js — لم يتغيّر أي سلوك. */
export function getDb() {
  if (globalForDb.__areejDb) return globalForDb.__areejDb;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tagline TEXT,
      color TEXT DEFAULT '#0C1C77',
      icon TEXT DEFAULT 'Package',
      bannerUrl TEXT,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      fullDescription TEXT DEFAULT '',
      price REAL NOT NULL,
      oldPrice REAL,
      badge TEXT,
      imageUrl TEXT,
      freeShipping INTEGER DEFAULT 0,
      freeInstall INTEGER DEFAULT 0,
      published INTEGER DEFAULT 1,
      brand TEXT,
      stock TEXT DEFAULT 'in_stock',
      sortOrder INTEGER DEFAULT 0,
      featuredOffer INTEGER DEFAULT 0,
      rating REAL,
      reviewCount INTEGER,
      categoryId TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      placement TEXT NOT NULL,
      categoryId TEXT,
      title TEXT NOT NULL,
      subtitle TEXT,
      imageUrl TEXT,
      linkCategorySlug TEXT,
      sortOrder INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      ratio TEXT DEFAULT 'auto',
      ctaLabel TEXT,
      ctaHref TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      customerCity TEXT,
      itemsJson TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'جديد',
      orderNumber TEXT,
      source TEXT,
      medium TEXT,
      campaign TEXT,
      landingPath TEXT,
      notes TEXT,
      customerId TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    /* ── v8: حسابات العملاء ── */
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      emailVerified INTEGER DEFAULT 0,
      marketingOptIn INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      failedAttempts INTEGER DEFAULT 0,
      lockedUntil TEXT,
      lastLoginAt TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

    CREATE TABLE IF NOT EXISTS customer_sessions (
      id TEXT PRIMARY KEY,
      tokenHash TEXT UNIQUE NOT NULL,
      customerId TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      userAgent TEXT,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_csessions_token ON customer_sessions(tokenHash);

    CREATE TABLE IF NOT EXISTS customer_addresses (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      label TEXT, city TEXT, district TEXT, street TEXT, notes TEXT,
      isDefault INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_caddr_customer ON customer_addresses(customerId);

    CREATE TABLE IF NOT EXISTS customer_recipients (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      relation TEXT, phone TEXT, city TEXT, district TEXT, street TEXT, notes TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_crecip_customer ON customer_recipients(customerId);

    CREATE TABLE IF NOT EXISTS customer_reminders (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      recipientId TEXT REFERENCES customer_recipients(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      occasion TEXT,
      month INTEGER NOT NULL,
      day INTEGER NOT NULL,
      leadDays INTEGER DEFAULT 3,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_crem_customer ON customer_reminders(customerId);

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      tokenHash TEXT UNIQUE NOT NULL,
      customerId TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      expiresAt TEXT NOT NULL,
      usedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_presets_token ON password_resets(tokenHash);

    /* ── v9: المفضّلة ── */
    CREATE TABLE IF NOT EXISTS customer_favorites (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      productId TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE (customerId, productId)
    );
    CREATE INDEX IF NOT EXISTS idx_fav_customer ON customer_favorites(customerId);
    CREATE INDEX IF NOT EXISTS idx_fav_product ON customer_favorites(productId);

    /* ── v10: سجلّ استعلامات البحث ── */
    CREATE TABLE IF NOT EXISTS search_queries (
      id TEXT PRIMARY KEY,
      raw TEXT NOT NULL,
      normalized TEXT NOT NULL,
      resultCount INTEGER DEFAULT 0,
      customerId TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sq_norm ON search_queries(normalized);
    CREATE INDEX IF NOT EXISTS idx_sq_created ON search_queries(createdAt DESC);

    /* ── v11: التسويق والنمو ── */
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'percent',
      value REAL NOT NULL DEFAULT 0,
      minOrder REAL DEFAULT 0,
      maxUses INTEGER,
      usedCount INTEGER DEFAULT 0,
      perCustomerLimit INTEGER,
      categorySlug TEXT,
      startsAt TEXT,
      endsAt TEXT,
      active INTEGER DEFAULT 1,
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id TEXT PRIMARY KEY,
      couponId TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      orderId TEXT, customerId TEXT, phone TEXT,
      amount REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_redeem_coupon ON coupon_redemptions(couponId);
    CREATE INDEX IF NOT EXISTS idx_redeem_phone ON coupon_redemptions(phone);

    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id TEXT PRIMARY KEY,
      sessionId TEXT UNIQUE NOT NULL,
      customerId TEXT,
      itemsJson TEXT NOT NULL,
      total REAL DEFAULT 0,
      contactName TEXT, contactPhone TEXT,
      status TEXT DEFAULT 'open',
      recoveredOrderId TEXT,
      source TEXT, campaign TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ac_status ON abandoned_carts(status, updatedAt DESC);

    /* ── v12: CRM — contactKey نصّ حرّ: c:<id> أو p:<digits> ── */
    CREATE TABLE IF NOT EXISTS crm_notes (
      id TEXT PRIMARY KEY,
      contactKey TEXT NOT NULL,
      body TEXT NOT NULL,
      author TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_crmnotes_key ON crm_notes(contactKey, createdAt DESC);

    CREATE TABLE IF NOT EXISTS crm_tasks (
      id TEXT PRIMARY KEY,
      contactKey TEXT NOT NULL,
      title TEXT NOT NULL,
      dueAt TEXT,
      done INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      completedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_crmtasks_key ON crm_tasks(contactKey);

    CREATE TABLE IF NOT EXISTS crm_tags (
      id TEXT PRIMARY KEY,
      contactKey TEXT NOT NULL,
      tag TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE (contactKey, tag)
    );
    CREATE INDEX IF NOT EXISTS idx_crmtags_key ON crm_tags(contactKey);

    /* ── v17: الشحن والتوصيل ── */
    CREATE TABLE IF NOT EXISTS shipping_zones (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, cities TEXT DEFAULT '',
      isDefault INTEGER DEFAULT 0, sortOrder INTEGER DEFAULT 0, active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS shipping_rates (
      id TEXT PRIMARY KEY,
      zoneId TEXT NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
      name TEXT NOT NULL, description TEXT,
      price REAL DEFAULT 0, freeOver REAL, minSubtotal REAL DEFAULT 0,
      etaText TEXT, sameDay INTEGER DEFAULT 0, cutoffHour INTEGER,
      carrier TEXT DEFAULT 'manual', sortOrder INTEGER DEFAULT 0, active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_rates_zone ON shipping_rates(zoneId, sortOrder);
    CREATE TABLE IF NOT EXISTS delivery_slots (
      id TEXT PRIMARY KEY, label TEXT NOT NULL,
      startHour INTEGER NOT NULL, endHour INTEGER NOT NULL,
      surcharge REAL DEFAULT 0, sortOrder INTEGER DEFAULT 0, active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS carriers (
      code TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0, mode TEXT DEFAULT 'test',
      accountNumber TEXT, apiKey TEXT, apiSecret TEXT, extraJson TEXT,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY, orderId TEXT NOT NULL, carrier TEXT NOT NULL,
      awb TEXT, trackingUrl TEXT, status TEXT DEFAULT 'created',
      labelUrl TEXT, cost REAL DEFAULT 0, notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(orderId);

    /* ── v16: المدوّنة ومحرّر القوائم ── */
    CREATE TABLE IF NOT EXISTS post_categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT, coverImage TEXT,
      blocksJson TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      categoryId TEXT REFERENCES post_categories(id) ON DELETE SET NULL,
      author TEXT,
      readMinutes INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      seoTitle TEXT, seoDescription TEXT,
      noIndex INTEGER DEFAULT 0,
      publishedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_pub ON posts(status, publishedAt DESC);

    CREATE TABLE IF NOT EXISTS nav_items (
      id TEXT PRIMARY KEY,
      location TEXT NOT NULL DEFAULT 'header',
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      newTab INTEGER DEFAULT 0,
      accent INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_nav_loc ON nav_items(location, sortOrder);

    /* ── v15: مكتبة الوسائط ── */
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      pathname TEXT, filename TEXT, alt TEXT, mime TEXT,
      size INTEGER DEFAULT 0,
      storage TEXT DEFAULT 'blob',
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_media_created ON media(createdAt DESC);

    /* ── v14: منشئ الصفحات ── */
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      blocksJson TEXT DEFAULT '[]',
      seoTitle TEXT, seoDescription TEXT, ogImage TEXT,
      noIndex INTEGER DEFAULT 0,
      showInFooter INTEGER DEFAULT 0,
      showInHeader INTEGER DEFAULT 0,
      sortOrder INTEGER DEFAULT 0,
      publishedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

    /* ── v13: SEO المتقدّم ── */
    CREATE TABLE IF NOT EXISTS seo_overrides (
      id TEXT PRIMARY KEY,
      path TEXT UNIQUE NOT NULL,
      title TEXT, description TEXT, ogImage TEXT, keywords TEXT,
      noIndex INTEGER DEFAULT 0,
      canonical TEXT,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_seo_path ON seo_overrides(path);

    CREATE TABLE IF NOT EXISTS seo_redirects (
      id TEXT PRIMARY KEY,
      fromPath TEXT UNIQUE NOT NULL,
      toPath TEXT NOT NULL,
      permanent INTEGER DEFAULT 1,
      hits INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_redirect_from ON seo_redirects(fromPath);

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source TEXT NOT NULL,
      medium TEXT,
      campaign TEXT NOT NULL,
      landingPath TEXT DEFAULT '/',
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
  `);

  try { db.exec(`ALTER TABLE orders ADD COLUMN couponCode TEXT`); } catch {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN discount REAL DEFAULT 0`); } catch {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN shippingMethod TEXT`); } catch {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN shippingCost REAL DEFAULT 0`); } catch {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN deliveryDate TEXT`); } catch {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN deliverySlot TEXT`); } catch {}

  // ترحيل قواعد موجودة مسبقًا: العمود يُضاف مرة واحدة ويُتجاهل الخطأ بعدها
  try { db.exec(`ALTER TABLE orders ADD COLUMN customerId TEXT`); } catch {}

  globalForDb.__areejDb = withPlainRows(db);
  return globalForDb.__areejDb;
}

const newId = () => crypto.randomBytes(12).toString("hex");
const toBool = (v) => !!v;
const fromBool = (v) => (v ? 1 : 0);

const numOrNull = (v) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v);

/* ============ التصنيفات ============ */
export async function getCategories() {
  const db = getDb();
  const cats = db.prepare(`SELECT * FROM categories ORDER BY sortOrder ASC`).all();
  return cats.map((c) => ({
    ...c,
    _count: {
      products: db.prepare(`SELECT COUNT(*) as n FROM products WHERE categoryId = ?`).get(c.id).n,
    },
  }));
}

export async function getCategoryBySlug(slug) {
  const db = getDb();
  return db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(slug) || null;
}

export async function createCategory({ name, slug, tagline, color, icon }) {
  const db = getDb();
  const id = newId();
  const count = db.prepare(`SELECT COUNT(*) as n FROM categories`).get().n;
  db.prepare(
    `INSERT INTO categories (id, slug, name, tagline, color, icon, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, slug, name, tagline || null, color || "#0C1C77", icon || "Package", count + 1);
  return db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
}

export async function updateCategory(id, { name, tagline, color, icon, bannerUrl, sortOrder }) {
  const db = getDb();
  db.prepare(`UPDATE categories SET name=?, tagline=?, color=?, icon=?, bannerUrl=?, sortOrder=? WHERE id=?`).run(
    name, tagline || null, color || "#0C1C77", icon || "Package", bannerUrl || null, sortOrder ?? 0, id
  );
  return db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
}

export async function deleteCategory(id) {
  const db = getDb();
  const inUse = db.prepare(`SELECT COUNT(*) as n FROM products WHERE categoryId = ?`).get(id).n;
  if (inUse > 0) throw new Error(`لا يمكن حذف هذا التصنيف لأنه يحتوي على ${inUse} منتج`);
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
}

/* ============ البنرات ============ */
export async function getBanners({ placement } = {}) {
  const db = getDb();
  const rows = placement
    ? db.prepare(`SELECT * FROM banners WHERE placement = ? ORDER BY sortOrder ASC`).all(placement)
    : db.prepare(`SELECT * FROM banners ORDER BY sortOrder ASC`).all();
  return rows.map((r) => ({ ...r }));
}

// ⚠️ إصلاح خلل نواة: العبارة تعلن ١٢ عمودًا وكانت تربط ٩ قيم فقط —
// ratio و ctaLabel و ctaHref كانت مفقودة، فترمي الدالة استثناءً
// ويفشل إنشاء أي بنر من لوحة التحكم على SQLite.
export async function createBanner(data) {
  const db = getDb();
  const id = newId();
  db.prepare(`
    INSERT INTO banners (id, placement, categoryId, title, subtitle, imageUrl, linkCategorySlug, sortOrder, active, ratio, ctaLabel, ctaHref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.placement, data.categoryId || null, data.title, data.subtitle || null, data.imageUrl || null, data.linkCategorySlug || null, data.sortOrder ?? 0, fromBool(data.active !== false), data.ratio || "auto", data.ctaLabel || null, data.ctaHref || null);
  return { ...db.prepare(`SELECT * FROM banners WHERE id = ?`).get(id) };
}

// ⚠️ إصلاح خلل نواة: نفس الخلل في updateBanner — ١١ عمودًا و٨ قيم.
export async function updateBanner(id, data) {
  const db = getDb();
  db.prepare(`
    UPDATE banners SET placement=?, categoryId=?, title=?, subtitle=?, imageUrl=?, linkCategorySlug=?, sortOrder=?, active=?, ratio=?, ctaLabel=?, ctaHref=? WHERE id=?
  `).run(data.placement, data.categoryId || null, data.title, data.subtitle || null, data.imageUrl || null, data.linkCategorySlug || null, data.sortOrder ?? 0, fromBool(data.active !== false), data.ratio || "auto", data.ctaLabel || null, data.ctaHref || null, id);
  return { ...db.prepare(`SELECT * FROM banners WHERE id = ?`).get(id) };
}

export async function deleteBanner(id) {
  getDb().prepare(`DELETE FROM banners WHERE id = ?`).run(id);
}

/* ============ المنتجات ============ */
function mapProduct(row) {
  if (!row) return null;
  return { ...row, freeShipping: toBool(row.freeShipping), freeInstall: toBool(row.freeInstall), published: toBool(row.published) };
}

export async function getProducts({ categorySlug, includeHidden = false } = {}) {
  const db = getDb();
  const visible = includeHidden ? "" : "AND p.published != 0";
  const order = "ORDER BY p.sortOrder ASC, p.createdAt DESC";
  let rows;
  if (categorySlug) {
    rows = db.prepare(`
      SELECT p.*, c.name as categoryName, c.slug as categorySlug, c.color as categoryColor, c.icon as categoryIcon
      FROM products p JOIN categories c ON p.categoryId = c.id
      WHERE c.slug = ? ${visible} ${order}
    `).all(categorySlug);
  } else {
    rows = db.prepare(`
      SELECT p.*, c.name as categoryName, c.slug as categorySlug, c.color as categoryColor, c.icon as categoryIcon
      FROM products p JOIN categories c ON p.categoryId = c.id
      WHERE 1=1 ${visible} ${order}
    `).all();
  }
  return rows.map((r) => ({
    ...mapProduct(r),
    category: { name: r.categoryName, slug: r.categorySlug, color: r.categoryColor, icon: r.categoryIcon },
  }));
}

export async function getProductById(id) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  return mapProduct(row);
}

export async function createProduct(data) {
  const db = getDb();
  const id = newId();
  db.prepare(`
    INSERT INTO products (id, name, description, fullDescription, price, oldPrice, badge, imageUrl, freeShipping, freeInstall, categoryId, brand, stock, rating, reviewCount, sortOrder, featuredOffer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.name, data.description || "", data.fullDescription || "", Number(data.price),
    data.oldPrice ? Number(data.oldPrice) : null, data.badge || null, data.imageUrl || null,
    fromBool(data.freeShipping), fromBool(data.freeInstall), data.categoryId,
    data.brand || null, data.stock || "in_stock", numOrNull(data.rating), numOrNull(data.reviewCount),
    Number(data.sortOrder) || 0, fromBool(data.featuredOffer)
  );
  return await getProductById(id);
}

export async function updateProduct(id, data) {
  const db = getDb();
  const current = await getProductById(id);
  if (!current) throw new Error("المنتج غير موجود");
  const merged = { ...current, ...data };
  db.prepare(`
    UPDATE products SET name=?, description=?, fullDescription=?, price=?, oldPrice=?, badge=?, imageUrl=?, freeShipping=?, freeInstall=?, categoryId=?, published=?, brand=?, stock=?, rating=?, reviewCount=?, sortOrder=?, featuredOffer=?, updatedAt=datetime('now')
    WHERE id=?
  `).run(
    merged.name, merged.description, merged.fullDescription, Number(merged.price),
    merged.oldPrice === "" || merged.oldPrice === null || merged.oldPrice === undefined ? null : Number(merged.oldPrice),
    merged.badge || null, merged.imageUrl || null, fromBool(merged.freeShipping), fromBool(merged.freeInstall),
    merged.categoryId, fromBool(merged.published),
    merged.brand || null, merged.stock || "in_stock", numOrNull(merged.rating), numOrNull(merged.reviewCount),
    Number(merged.sortOrder) || 0, fromBool(merged.featuredOffer),
    id
  );
  return await getProductById(id);
}

export async function deleteProduct(id) {
  const db = getDb();
  db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
}

export async function countProducts() {
  return getDb().prepare(`SELECT COUNT(*) as n FROM products`).get().n;
}
export async function countCategories() {
  return getDb().prepare(`SELECT COUNT(*) as n FROM categories`).get().n;
}
export async function countOrders() {
  return getDb().prepare(`SELECT COUNT(*) as n FROM orders`).get().n;
}

/* ============ الطلبات ============ */
export async function getOrders() {
  return getDb().prepare(`SELECT * FROM orders ORDER BY createdAt DESC`).all();
}

export const ORDER_STATUSES = ["جديد", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];

export async function updateOrderStatus(id, status, notes) {
  const db = getDb();
  if (!ORDER_STATUSES.includes(status)) throw new Error("حالة طلب غير معروفة");
  db.prepare(`UPDATE orders SET status = ?, notes = COALESCE(?, notes) WHERE id = ?`).run(status, notes ?? null, id);
  return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) || null;
}

export async function createOrder(data) {
  const db = getDb();
  const { customerName, customerPhone, customerCity, items, total } = data;
  const id = newId();
  db.prepare(`
    INSERT INTO orders (id, orderNumber, customerName, customerPhone, customerCity, itemsJson, total, source, medium, campaign, landingPath, couponCode, discount, shippingMethod, shippingCost, deliveryDate, deliverySlot)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, await nextOrderNumber(), customerName, customerPhone, customerCity || null, JSON.stringify(items), Number(total),
         data.source || null, data.medium || null, data.campaign || null, data.landingPath || null,
         data.couponCode || null, Number(data.discount) || 0,
         data.shippingMethod || null, Number(data.shippingCost) || 0,
         data.deliveryDate || null, data.deliverySlot || null);
  return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
}


/* ============ الإعدادات العامة ============ */

export async function getSettings() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updatedAt TEXT)`);
  const rows = db.prepare(`SELECT key, value FROM settings`).all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function saveSettings(entries) {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updatedAt TEXT)`);
  const stmt = db.prepare(
    `INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = datetime('now')`
  );
  for (const [key, value] of Object.entries(entries)) stmt.run(key, value ?? null);
  return getSettings();
}

export async function nextOrderNumber() {
  const db = getDb();
  const row = db.prepare(`SELECT COUNT(*) AS n FROM orders`).get();
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  // ⚠️ إصلاح خلل نواة: كانت البادئة "AR-" مثبّتة (أريج النقاء) في كل متجر
  return `${STORE.orderPrefix || "OR"}-${yy}${mm}-${1001 + (row?.n ?? 0)}`;
}


/* ============ التحليلات (تطوير محلي) ============ */

function ensureVisits(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY, sessionId TEXT, path TEXT, source TEXT, medium TEXT,
    campaign TEXT, referrer TEXT, device TEXT, isNew INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);
}

export async function recordVisit(v) {
  const db = getDb(); ensureVisits(db);
  db.prepare(`INSERT INTO visits (id, sessionId, path, source, medium, campaign, referrer, device, isNew)
              VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(newId(), v.sessionId || null, v.path || null, v.source || "direct", v.medium || "none",
         v.campaign || null, v.referrer || null, v.device || null, v.isNew !== false ? 1 : 0);
}

export async function getAnalytics({ days = 30 } = {}) {
  const db = getDb(); ensureVisits(db);
  const since = `datetime('now','-${Number(days)} days')`;
  const q = (sql) => { try { return db.prepare(sql).all(); } catch { return []; } };
  const one = (sql) => { try { return db.prepare(sql).get() || {}; } catch { return {}; } };

  return {
    totals: one(`SELECT
      (SELECT count(*) FROM visits WHERE createdAt > ${since}) AS views,
      (SELECT count(DISTINCT sessionId) FROM visits WHERE createdAt > ${since}) AS sessions,
      (SELECT count(*) FROM visits WHERE isNew=1 AND createdAt > ${since}) AS new_visitors,
      (SELECT count(*) FROM orders WHERE createdAt > ${since}) AS orders,
      (SELECT COALESCE(sum(total),0) FROM orders WHERE createdAt > ${since}) AS revenue`),
    bySource: q(`SELECT source, count(DISTINCT sessionId) sessions, count(*) views FROM visits WHERE createdAt > ${since} GROUP BY source ORDER BY sessions DESC LIMIT 10`),
    byMedium: q(`SELECT medium, count(DISTINCT sessionId) sessions FROM visits WHERE createdAt > ${since} GROUP BY medium ORDER BY sessions DESC`),
    byDay: q(`SELECT date(createdAt) day, count(DISTINCT sessionId) visits, 0 orders FROM visits WHERE createdAt > ${since} GROUP BY 1 ORDER BY 1`),
    topProducts: [],
    orderSources: q(`SELECT COALESCE(source,'direct') source, COALESCE(medium,'none') medium, count(*) orders, COALESCE(sum(total),0) revenue FROM orders WHERE createdAt > ${since} GROUP BY 1,2 ORDER BY orders DESC LIMIT 12`),
    topPages: q(`SELECT path, count(*) views FROM visits WHERE createdAt > ${since} GROUP BY path ORDER BY views DESC LIMIT 8`),
  };
}


/* ============ فهرس خفيف للسلة ============ */

export async function getProductIndex() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.id, p.name, p.price, p.imageUrl, c.color AS categoryColor, c.icon AS categoryIcon
    FROM products p JOIN categories c ON p.categoryId = c.id
    WHERE p.published != 0
  `).all();
  return rows.map((r) => ({
    id: r.id, name: r.name, price: Number(r.price), imageUrl: r.imageUrl,
    category: { color: r.categoryColor, icon: r.categoryIcon },
  }));
}

export async function getSitemapData() {
  const db = getDb();
  return {
    products: db.prepare(`SELECT id, name, updatedAt, createdAt FROM products WHERE published != 0`).all(),
    categories: db.prepare(`SELECT slug, createdAt FROM categories ORDER BY sortOrder`).all(),
  };
}


/* ============ الصفحات القانونية ============ */

function ensureLegal(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS legal_pages (
    slug TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT,
    metaDescription TEXT, published INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0,
    updatedAt TEXT DEFAULT (datetime('now'))
  )`);
  const n = db.prepare(`SELECT count(*) c FROM legal_pages`).get()?.c ?? 0;
  if (n === 0) {
    const ins = db.prepare(`INSERT INTO legal_pages (slug,title,sortOrder,published,content) VALUES (?,?,?,0,'')`);
    ins.run("terms", "الشروط والأحكام", 1);
    ins.run("returns", "سياسة الاستبدال والاسترجاع", 2);
    ins.run("shipping", "الشحن والدفع", 3);
  }
}

export async function getLegalPages() {
  const db = getDb(); ensureLegal(db);
  return db.prepare(`SELECT * FROM legal_pages WHERE published != 0 ORDER BY sortOrder`).all();
}
export async function getAllLegalPages() {
  const db = getDb(); ensureLegal(db);
  return db.prepare(`SELECT * FROM legal_pages ORDER BY sortOrder`).all();
}
export async function getLegalPage(slug) {
  const db = getDb(); ensureLegal(db);
  return db.prepare(`SELECT * FROM legal_pages WHERE slug = ?`).get(slug) || null;
}
export async function updateLegalPage(slug, data) {
  const db = getDb(); ensureLegal(db);
  db.prepare(`UPDATE legal_pages SET title=?, content=?, metaDescription=?, published=?, updatedAt=datetime('now') WHERE slug=?`)
    .run(data.title, data.content || "", data.metaDescription || null, fromBool(data.published), slug);
  return getLegalPage(slug);
}
