/**
 * ═══════════════════════════════════════════════════════════
 *  المدوّنة — طبقة البيانات
 * ═══════════════════════════════════════════════════════════
 *
 *  ⚠️ المحتوى بنفس بلوكات منشئ الصفحات (`sanitizeBlocks`).
 *  السبب: مُصيِّر واحد ومنقٍّ واحد. لو بنينا محرّرًا ثانيًا بحقل
 *  HTML لعادت ثغرة XSS التي رفضناها في §١٨.١ من الباب الخلفي.
 */

import crypto from "node:crypto";
import { sanitizeBlocks, slugify } from "./pagesDb.js";

const raw = (process.env.DATABASE_URL || "").trim();
const isPg = raw.startsWith("postgres");
const newId = () => crypto.randomBytes(12).toString("hex");
const q = (n) => (isPg ? `"${n}"` : n);
const prep = (sql) => { if (!isPg) return sql; let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
const B = (v) => (isPg ? !!v : v ? 1 : 0);
const D = (d) => (d ? (isPg ? new Date(d) : new Date(d).toISOString().slice(0, 19).replace("T", " ")) : null);

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

const parseBlocks = (r) => { try { return JSON.parse(r.blocksJson || "[]"); } catch { return []; } };
const hydrate = (r) => (r ? { ...r, blocks: parseBlocks(r) } : null);

/**
 * زمن القراءة — يُحسب لا يُكتب يدويًا.
 * ٢٠٠ كلمة/دقيقة متوسط معقول للعربية. الرقم تقريبي بطبيعته،
 * لكن وجوده يرفع معدّل النقر لأنه يخبر القارئ بالتكلفة مسبقًا.
 */
export function estimateReadMinutes(blocks = [], excerpt = "") {
  let words = String(excerpt || "").split(/\s+/).filter(Boolean).length;
  for (const b of blocks) {
    for (const v of Object.values(b.props || {})) {
      if (typeof v === "string") words += v.split(/\s+/).filter(Boolean).length;
      else if (Array.isArray(v)) {
        for (const row of v) {
          for (const rv of Object.values(row || {})) {
            if (typeof rv === "string") words += rv.split(/\s+/).filter(Boolean).length;
          }
        }
      }
    }
  }
  return Math.max(1, Math.round(words / 200));
}

/* ═══════════════ التصنيفات ═══════════════ */

export async function listPostCategories() {
  const d = await conn();
  return d.all(`SELECT * FROM post_categories ORDER BY ${q("sortOrder")}, name`);
}

export async function createPostCategory({ name, slug, description }) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO post_categories (id, slug, name, description) VALUES (?, ?, ?, ?)`,
    [id, slugify(slug || name), String(name).slice(0, 120), description || null]
  );
  return id;
}

export async function deletePostCategory(id) {
  const d = await conn();
  // المقالات تبقى — `ON DELETE SET NULL` يفكّ الارتباط فقط
  await d.run(`DELETE FROM post_categories WHERE id = ?`, [id]);
}

/* ═══════════════ المقالات ═══════════════ */

const LIST_SQL = `
  SELECT p.*, c.name AS "categoryName", c.slug AS "categorySlug"
    FROM posts p LEFT JOIN post_categories c ON c.id = p.${isPg ? '"categoryId"' : "categoryId"}
`;

export async function listPosts({ status, categorySlug, limit = 200 } = {}) {
  const d = await conn();
  const where = [];
  const params = [];
  if (status) { where.push(`p.status = ?`); params.push(status); }
  if (categorySlug) { where.push(`c.slug = ?`); params.push(categorySlug); }
  params.push(limit);

  const rows = await d.all(
    `${LIST_SQL} ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY p.${q("publishedAt")} DESC NULLS LAST, p.${q("updatedAt")} DESC LIMIT ?`
      .replace("NULLS LAST", isPg ? "NULLS LAST" : ""),
    params
  );
  return rows.map(hydrate);
}

export async function getPostBySlug(slug) {
  const d = await conn();
  /** فكّ دفاعي — نفس علّة السلَغ العربي المرمَّز في §١٨.٦ */
  const raws = new Set([String(slug || "").toLowerCase()]);
  try { raws.add(decodeURIComponent(String(slug || "").toLowerCase())); } catch {}
  for (const s of raws) {
    const rows = await d.all(`${LIST_SQL} WHERE p.slug = ? LIMIT 1`, [s]);
    if (rows[0]) return hydrate(rows[0]);
  }
  return null;
}

export async function getPostById(id) {
  const d = await conn();
  const rows = await d.all(`${LIST_SQL} WHERE p.id = ? LIMIT 1`, [id]);
  return hydrate(rows[0]);
}

export async function createPost({ title, slug }) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO posts (id, slug, title, status, ${q("blocksJson")}) VALUES (?, ?, ?, 'draft', '[]')`,
    [id, slugify(slug || title), String(title).slice(0, 250)]
  );
  return id;
}

export async function updatePost(id, data) {
  const d = await conn();
  const current = await getPostById(id);
  if (!current) throw new Error("المقال غير موجود.");

  const status = ["draft", "published"].includes(data.status) ? data.status : current.status;
  const blocks = data.blocks ? sanitizeBlocks(data.blocks) : current.blocks;
  const excerpt = data.excerpt ?? current.excerpt ?? "";

  // يُثبَّت عند أول نشر — إعادة النشر لا تجعل المقال يبدو جديدًا
  const publishedAt =
    status === "published" && !current.publishedAt ? D(new Date()) : D(current.publishedAt);

  await d.run(
    `UPDATE posts SET slug=?, title=?, excerpt=?, ${q("coverImage")}=?, ${q("blocksJson")}=?,
       status=?, ${q("categoryId")}=?, author=?, ${q("readMinutes")}=?, featured=?,
       ${q("seoTitle")}=?, ${q("seoDescription")}=?, ${q("noIndex")}=?,
       ${q("publishedAt")}=?, ${q("updatedAt")}=?
     WHERE id=?`,
    [
      data.slug ? slugify(data.slug) : current.slug,
      String(data.title ?? current.title).slice(0, 250),
      String(excerpt).slice(0, 600),
      data.coverImage || null,
      JSON.stringify(blocks),
      status,
      data.categoryId || null,
      data.author ? String(data.author).slice(0, 120) : null,
      estimateReadMinutes(blocks, excerpt),
      B(data.featured),
      data.seoTitle || null, data.seoDescription || null, B(data.noIndex),
      publishedAt, D(new Date()), id,
    ]
  );
  return getPostById(id);
}

export async function deletePost(id) {
  const d = await conn();
  await d.run(`DELETE FROM posts WHERE id = ?`, [id]);
}

/** مقالات ذات صلة: نفس التصنيف أولًا، ثم الأحدث. */
export async function relatedPosts(post, limit = 3) {
  const all = await listPosts({ status: "published", limit: 40 });
  const others = all.filter((p) => p.id !== post.id);
  const same = others.filter((p) => p.categoryId && p.categoryId === post.categoryId);
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, limit);
}
