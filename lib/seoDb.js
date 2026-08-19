/**
 * ═══════════════════════════════════════════════════════════
 *  طبقة SEO المتقدّم
 * ═══════════════════════════════════════════════════════════
 *  التجاوزات، والتحويلات الدائمة، وفحص الصحّة.
 */

import crypto from "node:crypto";
import { getProducts, getCategories, getSettings } from "./db.js";
import { siteUrl } from "./seo.jsx";

const raw = (process.env.DATABASE_URL || "").trim();
const isPg = raw.startsWith("postgres");
const newId = () => crypto.randomBytes(12).toString("hex");
const q = (n) => (isPg ? `"${n}"` : n);
const prep = (sql) => { if (!isPg) return sql; let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
const B = (v) => (isPg ? !!v : v ? 1 : 0);

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

/** تطبيع المسار: يبدأ بشرطة، بلا شرطة أخيرة، بلا استعلام. */
export function normalizePath(p) {
  let s = String(p || "").trim().split("?")[0].split("#")[0];
  if (!s.startsWith("/")) s = "/" + s;
  if (s.length > 1) s = s.replace(/\/+$/, "");
  return s.slice(0, 500);
}

/* ═══════════════ التجاوزات ═══════════════ */

export async function listOverrides() {
  const d = await conn();
  return d.all(`SELECT * FROM seo_overrides ORDER BY path LIMIT 500`);
}

export async function getOverride(path) {
  const d = await conn();
  const rows = await d.all(`SELECT * FROM seo_overrides WHERE path = ? LIMIT 1`, [normalizePath(path)]);
  return rows[0] || null;
}

export async function saveOverride(data) {
  const d = await conn();
  const path = normalizePath(data.path);
  const existing = await getOverride(path);
  if (existing) {
    await d.run(
      `UPDATE seo_overrides SET title=?, description=?, ${q("ogImage")}=?, keywords=?, ${q("noIndex")}=?, canonical=? WHERE id=?`,
      [data.title || null, data.description || null, data.ogImage || null,
       data.keywords || null, B(data.noIndex), data.canonical || null, existing.id]
    );
    return existing.id;
  }
  const id = newId();
  await d.run(
    `INSERT INTO seo_overrides (id, path, title, description, ${q("ogImage")}, keywords, ${q("noIndex")}, canonical)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, path, data.title || null, data.description || null, data.ogImage || null,
     data.keywords || null, B(data.noIndex), data.canonical || null]
  );
  return id;
}

export async function deleteOverride(id) {
  const d = await conn();
  await d.run(`DELETE FROM seo_overrides WHERE id = ?`, [id]);
}

/* ═══════════════ التحويلات ═══════════════ */

export async function listRedirects() {
  const d = await conn();
  return d.all(`SELECT * FROM seo_redirects ORDER BY hits DESC, ${q("createdAt")} DESC LIMIT 500`);
}

export async function findRedirect(fromPath) {
  const d = await conn();
  const rows = await d.all(`SELECT * FROM seo_redirects WHERE ${q("fromPath")} = ? LIMIT 1`, [normalizePath(fromPath)]);
  return rows[0] || null;
}

export async function createRedirect({ fromPath, toPath, permanent = true }) {
  const from = normalizePath(fromPath);
  const to = normalizePath(toPath);

  /**
   * ⚠️ حمايتان لا غنى عنهما:
   *  ١) التحويل إلى النفس ينتج حلقة لا نهائية تُسقط الصفحة
   *  ٢) سلسلة A→B→C تُبطئ الزحف وتُضعف انتقال الترتيب.
   *     نحلّها بتسطيح السلسلة: لو كان `to` مصدرًا لتحويل آخر
   *     نوجّه مباشرة إلى وجهته النهائية.
   */
  if (from === to) throw new Error("لا يمكن التحويل إلى نفس المسار.");

  let finalTo = to;
  const chained = await findRedirect(to);
  if (chained && chained.toPath !== from) finalTo = chained.toPath;

  const d = await conn();
  const existing = await findRedirect(from);
  if (existing) {
    await d.run(`UPDATE seo_redirects SET ${q("toPath")} = ?, permanent = ? WHERE id = ?`,
      [finalTo, B(permanent), existing.id]);
    return existing.id;
  }
  const id = newId();
  await d.run(
    `INSERT INTO seo_redirects (id, ${q("fromPath")}, ${q("toPath")}, permanent) VALUES (?, ?, ?, ?)`,
    [id, from, finalTo, B(permanent)]
  );
  return id;
}

export async function deleteRedirect(id) {
  const d = await conn();
  await d.run(`DELETE FROM seo_redirects WHERE id = ?`, [id]);
}

export async function bumpRedirect(id) {
  try {
    const d = await conn();
    await d.run(`UPDATE seo_redirects SET hits = hits + 1 WHERE id = ?`, [id]);
  } catch { /* عدّاد إحصائي — فشله لا يمنع التحويل */ }
}

/* ═══════════════ فحص الصحّة ═══════════════ */

const LIMITS = {
  titleMin: 20, titleMax: 60,
  descMin: 70, descMax: 160,
};

/**
 * فحص عملي لا شامل.
 *
 * يركّز على ما يمنع الظهور فعلًا: عنوان مكرّر أو مفقود، وصف
 * قصير أو طويل، منتج بلا صورة (يُستبعد من Merchant Center)،
 * ومحتوى رقيق. لا نُدرج مقاييس تجميلية تُنتج قائمة طويلة لا
 * يتصرّف فيها أحد.
 */
export async function seoAudit() {
  const [products, categories, overrides, settings] = await Promise.all([
    getProducts({ includeHidden: false }).catch(() => []),
    getCategories().catch(() => []),
    listOverrides().catch(() => []),
    getSettings().catch(() => ({})),
  ]);

  const byPath = Object.fromEntries(overrides.map((o) => [o.path, o]));
  const issues = [];
  const titleSeen = new Map();

  const push = (severity, type, label, path, detail) =>
    issues.push({ severity, type, label, path, detail });

  for (const p of products) {
    const path = `/product/${p.id}`;
    const ov = byPath[path];
    const title = ov?.title || p.name || "";
    const desc = ov?.description || p.description || "";

    if (!p.imageUrl) {
      push("high", "image", p.name, path, "بلا صورة — يُستبعد من كتالوج Google وMeta تلقائيًا.");
    }
    if (title.length < LIMITS.titleMin) {
      push("medium", "title", p.name, path, `العنوان قصير (${title.length} حرفًا) — الحد المريح ${LIMITS.titleMin}.`);
    }
    if (title.length > LIMITS.titleMax) {
      push("low", "title", p.name, path, `العنوان طويل (${title.length}) — يُقصّ في نتائج البحث بعد ${LIMITS.titleMax}.`);
    }
    if (!desc) {
      push("high", "description", p.name, path, "بلا وصف — تكتب Google مقتطفًا عشوائيًا من الصفحة.");
    } else if (desc.length < LIMITS.descMin) {
      push("medium", "description", p.name, path, `الوصف قصير (${desc.length}) — الحد المريح ${LIMITS.descMin}.`);
    } else if (desc.length > LIMITS.descMax) {
      push("low", "description", p.name, path, `الوصف طويل (${desc.length}) — يُقصّ بعد ${LIMITS.descMax}.`);
    }

    const key = title.trim().toLowerCase();
    if (key) {
      const prev = titleSeen.get(key);
      if (prev) push("high", "duplicate", p.name, path, `عنوان مكرّر مع: ${prev}`);
      else titleSeen.set(key, p.name);
    }
  }

  for (const c of categories) {
    const path = `/category/${c.slug}`;
    const ov = byPath[path];
    if (!(ov?.description || c.tagline)) {
      push("medium", "description", c.name, path, "تصنيف بلا وصف — صفحة رقيقة في نظر محرّكات البحث.");
    }
    if (!/^[a-z0-9-]+$/.test(c.slug)) {
      push("low", "slug", c.name, path, "السلَغ يحوي محارف غير لاتينية — يُرمَّز في الرابط ويصعب مشاركته.");
    }
  }

  /* فحوص على مستوى الموقع */
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    push("high", "config", "الدومين", "/", "‏NEXT_PUBLIC_SITE_URL غير مضبوط — الروابط الأساسية والخريطة تُبنى بعنوان خاطئ.");
  }
  if (!settings.gsc_verification) {
    push("low", "config", "Search Console", "/", "لا يوجد وسم توثيق — لن ترى بيانات الأداء والفهرسة.");
  }
  if (!settings.contact_address) {
    push("medium", "config", "العنوان", "/", "عنوان المتجر فارغ — يُضعف ظهورك في البحث المحلي بالرياض.");
  }

  const rank = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return {
    issues,
    counts: {
      high: issues.filter((i) => i.severity === "high").length,
      medium: issues.filter((i) => i.severity === "medium").length,
      low: issues.filter((i) => i.severity === "low").length,
    },
    scanned: { products: products.length, categories: categories.length },
  };
}

/* ═══════════════ قائمة المسارات القابلة للتحرير ═══════════════ */

export async function seoPaths() {
  const [products, categories] = await Promise.all([
    getProducts({ includeHidden: false }).catch(() => []),
    getCategories().catch(() => []),
  ]);
  return [
    { path: "/", label: "الرئيسية", group: "صفحات" },
    { path: "/shop", label: "كل التشكيلة", group: "صفحات" },
    { path: "/offers", label: "العروض", group: "صفحات" },
    { path: "/occasions", label: "المناسبات", group: "صفحات" },
    { path: "/care", label: "دليل العناية", group: "صفحات" },
    { path: "/gift-finder", label: "رشّح لي هدية", group: "صفحات" },
    { path: "/about", label: "نبذة عنا", group: "صفحات" },
    { path: "/faq", label: "الأسئلة الشائعة", group: "صفحات" },
    { path: "/contact", label: "تواصل معنا", group: "صفحات" },
    ...categories.map((c) => ({ path: `/category/${c.slug}`, label: c.name, group: "تصنيفات" })),
    ...products.map((p) => ({ path: `/product/${p.id}`, label: p.name, group: "منتجات" })),
  ];
}

/** رابط مطلق آمن للعرض في اللوحة. */
export const absolute = (path) => `${siteUrl()}${normalizePath(path)}`;
