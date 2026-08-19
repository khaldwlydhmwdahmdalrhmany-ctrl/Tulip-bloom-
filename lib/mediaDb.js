/**
 * ═══════════════════════════════════════════════════════════
 *  مكتبة الوسائط — طبقة البيانات
 * ═══════════════════════════════════════════════════════════
 *
 *  ⚠️ لماذا سجلّ في القاعدة ولا نكتفي بـ`list()` من Vercel Blob:
 *   ١) لا يعمل محليًا بلا رمز — فتُصبح المكتبة عمياء في التطوير
 *   ٢) لا يحمل النص البديل (alt) وهو أهم حقل للسيو وللوصولية
 *   ٣) استدعاء خارجي في كل فتح للمكتبة، بينما القاعدة فورية
 */

import crypto from "node:crypto";

const raw = (process.env.DATABASE_URL || "").trim();
const isPg = raw.startsWith("postgres");
const newId = () => crypto.randomBytes(12).toString("hex");
const q = (n) => (isPg ? `"${n}"` : n);
const prep = (sql) => { if (!isPg) return sql; let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

let pool = null;
async function conn() {
  if (isPg) {
    if (!pool) {
      const { default: pg } = await import("pg");
      pool = new pg.Pool({ connectionString: raw, ssl: { rejectUnauthorized: false }, max: 5 });
    }
    return {
      all: async (sql, p = []) => (await pool.query(prep(sql), p)).rows,
      run: async (sql, p = []) => { await pool.query(prep(sql), p); },
    };
  }
  const { getDb } = await import("./db.sqlite.js");
  const d = getDb();
  return {
    all: async (sql, p = []) => d.prepare(sql).all(...p),
    run: async (sql, p = []) => { d.prepare(sql).run(...p); },
  };
}

/**
 * تسجيل ملف مرفوع.
 * ⚠️ لا يرمي أبدًا: فشل التسجيل يجب ألا يُفشل الرفع نفسه —
 * الصورة رُفعت فعلًا، وخسارة سطر في المكتبة أهون من خسارتها.
 */
export async function recordMedia({ url, pathname, filename, mime, size, storage }) {
  try {
    const d = await conn();
    await d.run(
      `INSERT INTO media (id, url, pathname, filename, mime, size, storage) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId(), url, pathname || null, filename || null, mime || null, Number(size) || 0, storage || "blob"]
    );
  } catch { /* القيد الفريد أو خطأ عابر — الرفع نجح وهذا ما يهم */ }
}

export async function listMedia({ search = "", limit = 200 } = {}) {
  const d = await conn();
  if (search) {
    const like = `%${String(search).toLowerCase()}%`;
    return d.all(
      `SELECT * FROM media
        WHERE LOWER(COALESCE(filename,'')) LIKE ? OR LOWER(COALESCE(alt,'')) LIKE ?
        ORDER BY ${q("createdAt")} DESC LIMIT ?`,
      [like, like, limit]
    );
  }
  return d.all(`SELECT * FROM media ORDER BY ${q("createdAt")} DESC LIMIT ?`, [limit]);
}

export async function getMediaById(id) {
  const d = await conn();
  const rows = await d.all(`SELECT * FROM media WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function updateMediaAlt(id, alt) {
  const d = await conn();
  await d.run(`UPDATE media SET alt = ? WHERE id = ?`, [String(alt || "").slice(0, 300), id]);
}

export async function deleteMediaRow(id) {
  const d = await conn();
  await d.run(`DELETE FROM media WHERE id = ?`, [id]);
}

/**
 * أين تُستعمل هذه الصورة؟
 *
 * يمنع الحذف الأعمى: حذف صورة مستعملة يترك مربّعًا مكسورًا في
 * صفحة منشورة أو بطاقة منتج، ولا سبيل لمعرفة السبب لاحقًا.
 * نفحص المنتجات والبنرات والصفحات المخصّصة.
 */
export async function mediaUsage(url) {
  if (!url) return [];
  const d = await conn();
  const like = `%${url}%`;
  const out = [];

  try {
    const products = await d.all(
      `SELECT id, name FROM products WHERE ${q("imageUrl")} = ? LIMIT 20`, [url]
    );
    products.forEach((p) => out.push({ type: "منتج", label: p.name, href: `/admin/products/${p.id}/edit` }));
  } catch {}

  try {
    const banners = await d.all(
      `SELECT id, title FROM banners WHERE ${q("imageUrl")} = ? LIMIT 20`, [url]
    );
    banners.forEach((b) => out.push({ type: "بنر", label: b.title, href: `/admin/banners` }));
  } catch {}

  try {
    // البلوكات مخزّنة كـJSON — البحث النصي كافٍ لكشف الاستعمال
    const pages = await d.all(
      `SELECT id, title FROM pages WHERE ${q("blocksJson")} LIKE ? OR ${q("ogImage")} = ? LIMIT 20`,
      [like, url]
    );
    pages.forEach((p) => out.push({ type: "صفحة", label: p.title, href: `/admin/pages/${p.id}` }));
  } catch {}

  return out;
}

export async function mediaStats() {
  const d = await conn();
  const rows = await d.all(`SELECT COUNT(*) AS n, COALESCE(SUM(size),0) AS bytes FROM media`);
  return {
    count: Number(rows[0]?.n || 0),
    bytes: Number(rows[0]?.bytes || 0),
  };
}
