/**
 * ═══════════════════════════════════════════════════════════
 *  منشئ الصفحات — طبقة البيانات ومخطّط البلوكات
 * ═══════════════════════════════════════════════════════════
 *
 *  ── قرار معماري: بلوكات مهيكلة لا HTML خام ──
 *  أسهل طريق لبناء منشئ صفحات هو حقل HTML واحد يُحقن في
 *  الصفحة. وهو أيضًا أوسع ثغرة XSS ممكنة: أي محرّر — أو أي
 *  حساب لوحة مخترَق — يستطيع حقن سكربت يسرق جلسات الزوّار.
 *
 *  البديل هنا: مصفوفة `{ type, props }`. كل نوع يُصيَّر بمكوّن
 *  معروف بحقول معروفة، والنص يمرّ عبر React فيُهرَّب تلقائيًا.
 *  الثمن مرونة أقل؛ المكسب أن الصفحة لا تستطيع تنفيذ كود.
 */

import crypto from "node:crypto";

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

/* ═══════════════ مخطّط البلوكات ═══════════════ */

/**
 * الحقول المسموحة لكل نوع. أي حقل خارج القائمة يُسقَط عند
 * الحفظ — فلا يتسرّب شيء غير متوقّع إلى المُصيِّر.
 *
 * `kind` يحدّد شكل الحقل في المحرّر:
 *   text · area · url · number · bool · select · list
 */
export const BLOCK_TYPES = {
  hero: {
    label: "غلاف",
    icon: "Sparkles",
    hint: "عنوان كبير مع وصف وزر — لأعلى صفحات الهبوط.",
    fields: {
      eyebrow: { kind: "text", label: "سطر علوي" },
      title: { kind: "text", label: "العنوان", required: true },
      desc: { kind: "area", label: "الوصف" },
      ctaLabel: { kind: "text", label: "نص الزر" },
      ctaHref: { kind: "url", label: "رابط الزر" },
      image: { kind: "image", label: "صورة الخلفية" },
      align: { kind: "select", label: "المحاذاة", options: ["right", "center"] },
    },
  },
  richText: {
    label: "نص",
    icon: "FileText",
    hint: "عنوان وفقرات. كل سطر فارغ يبدأ فقرة جديدة.",
    fields: {
      title: { kind: "text", label: "العنوان" },
      body: { kind: "area", label: "النص", rows: 8, required: true },
      align: { kind: "select", label: "المحاذاة", options: ["right", "center"] },
    },
  },
  image: {
    label: "صورة",
    icon: "Image",
    hint: "صورة واحدة بعرض كامل مع تعليق اختياري.",
    fields: {
      url: { kind: "image", label: "الصورة", required: true },
      alt: { kind: "text", label: "النص البديل", hint: "مهم للسيو ولقارئات الشاشة" },
      caption: { kind: "text", label: "التعليق" },
    },
  },
  gallery: {
    label: "معرض صور",
    icon: "LayoutGrid",
    hint: "شبكة صور — مناسبة لعرض أعمال سابقة.",
    fields: {
      title: { kind: "text", label: "العنوان" },
      items: { kind: "list", label: "الصور", item: { url: "image", alt: "text" } },
      columns: { kind: "select", label: "الأعمدة", options: ["2", "3", "4"] },
    },
  },
  columns: {
    label: "أعمدة",
    icon: "Columns3",
    hint: "بطاقات بأيقونة وعنوان ونص — للمزايا والخطوات.",
    fields: {
      title: { kind: "text", label: "العنوان" },
      desc: { kind: "text", label: "الوصف" },
      items: { kind: "list", label: "العناصر", item: { icon: "icon", title: "text", body: "area" } },
      columns: { kind: "select", label: "الأعمدة", options: ["2", "3", "4"] },
    },
  },
  faq: {
    label: "أسئلة",
    icon: "HelpCircle",
    hint: "أسئلة وأجوبة — تُولَّد لها بيانات منظّمة تلقائيًا.",
    fields: {
      title: { kind: "text", label: "العنوان" },
      items: { kind: "list", label: "الأسئلة", item: { q: "text", a: "area" } },
    },
  },
  products: {
    label: "منتجات",
    icon: "Package",
    hint: "شبكة منتجات من مصدر محدّد.",
    fields: {
      title: { kind: "text", label: "العنوان" },
      source: { kind: "select", label: "المصدر", options: ["bestSellers", "offers", "newest", "category"] },
      categorySlug: { kind: "text", label: "سلَغ التصنيف", hint: "عند اختيار «category»" },
      limit: { kind: "number", label: "العدد" },
    },
  },
  cta: {
    label: "دعوة لإجراء",
    icon: "Megaphone",
    hint: "شريط بارز بزر واتساب.",
    fields: {
      eyebrow: { kind: "text", label: "سطر علوي" },
      title: { kind: "text", label: "العنوان", required: true },
      desc: { kind: "area", label: "الوصف" },
      primaryLabel: { kind: "text", label: "نص الزر" },
      primaryHref: { kind: "url", label: "رابط الزر" },
      whatsappMessage: { kind: "area", label: "رسالة واتساب" },
    },
  },
  quote: {
    label: "اقتباس",
    icon: "Quote",
    hint: "جملة بارزة بخط العناوين.",
    fields: {
      text: { kind: "area", label: "النص", required: true },
      author: { kind: "text", label: "المصدر" },
    },
  },
  video: {
    label: "فيديو",
    icon: "Play",
    hint: "يوتيوب فقط — يُستخرج المعرّف من الرابط.",
    fields: {
      url: { kind: "url", label: "رابط يوتيوب", required: true },
      title: { kind: "text", label: "العنوان" },
    },
  },
  spacer: {
    label: "فاصل",
    icon: "Minus",
    hint: "مسافة رأسية.",
    fields: { size: { kind: "select", label: "الحجم", options: ["small", "medium", "large"] } },
  },
};

/** ينقّي البلوكات: أنواع معروفة، حقول معروفة، أطوال محدودة. */
export function sanitizeBlocks(input) {
  if (!Array.isArray(input)) return [];
  const out = [];

  for (const b of input.slice(0, 60)) {
    const def = BLOCK_TYPES[b?.type];
    if (!def) continue;                       // نوع مجهول يُسقَط بالكامل

    const props = {};
    for (const [key, field] of Object.entries(def.fields)) {
      const v = b.props?.[key];
      if (v === undefined || v === null) continue;

      if (field.kind === "list") {
        if (!Array.isArray(v)) continue;
        props[key] = v.slice(0, 24).map((row) => {
          const clean = {};
          for (const [ik, ikind] of Object.entries(field.item)) {
            const iv = row?.[ik];
            if (typeof iv === "string") clean[ik] = iv.slice(0, ikind === "area" ? 2000 : 300);
          }
          return clean;
        });
      } else if (field.kind === "number") {
        const num = Number(v);
        if (Number.isFinite(num)) props[key] = Math.max(0, Math.min(60, Math.round(num)));
      } else if (field.kind === "bool") {
        props[key] = !!v;
      } else {
        props[key] = String(v).slice(0, field.kind === "area" ? 6000 : 500);
      }
    }
    out.push({ type: b.type, props });
  }
  return out;
}

/** السلَغ: لاتيني وأرقام وشرطات فقط — يظهر في الرابط. */
export function slugify(input) {
  return String(input || "")
    .trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `page-${Date.now().toString(36)}`;
}

/** مسارات محجوزة — إنشاء صفحة بها يحجب مسارًا حقيقيًا. */
const RESERVED = new Set([
  "shop", "offers", "about", "contact", "faq", "privacy", "search",
  "account", "admin", "api", "category", "product", "occasions",
  "care", "gift-finder", "legal", "maintenance",
]);

export function isReservedSlug(slug) {
  return RESERVED.has(String(slug || "").toLowerCase());
}

/* ═══════════════ العمليات ═══════════════ */

const parseBlocks = (row) => {
  try { return JSON.parse(row.blocksJson || "[]"); } catch { return []; }
};

export async function listPages({ status } = {}) {
  const d = await conn();
  const rows = status
    ? await d.all(`SELECT * FROM pages WHERE status = ? ORDER BY ${q("sortOrder")}, ${q("updatedAt")} DESC`, [status])
    : await d.all(`SELECT * FROM pages ORDER BY ${q("sortOrder")}, ${q("updatedAt")} DESC LIMIT 300`);
  return rows.map((r) => ({ ...r, blocks: parseBlocks(r) }));
}

/**
 * ⚠️ فكّ دفاعي للسلَغ.
 *
 * السلَغ قد يكون عربيًا، و`params.slug` يصل من Next **مرمَّزًا**
 * (`%D8%B3…`) لا مفكوكًا مع المحارف غير اللاتينية. البحث بالقيمة
 * المرمَّزة لا يطابق شيئًا فتُرجع الصفحة ٤٠٤ رغم وجودها.
 *
 * نجرّب القيمة كما وصلت ثم مفكوكة — يغطّي الحالتين ولا يكسر
 * السلَغ اللاتيني.
 */
function slugCandidates(slug) {
  const raw = String(slug || "").toLowerCase();
  const out = new Set([raw]);
  try { out.add(decodeURIComponent(raw)); } catch { /* ترميز تالف — نتجاهله */ }
  return [...out];
}

export async function getPageBySlug(slug) {
  const d = await conn();
  for (const candidate of slugCandidates(slug)) {
    const rows = await d.all(`SELECT * FROM pages WHERE slug = ? LIMIT 1`, [candidate]);
    if (rows[0]) return { ...rows[0], blocks: parseBlocks(rows[0]) };
  }
  return null;
}

export async function getPageById(id) {
  const d = await conn();
  const rows = await d.all(`SELECT * FROM pages WHERE id = ? LIMIT 1`, [id]);
  const r = rows[0];
  return r ? { ...r, blocks: parseBlocks(r) } : null;
}

export async function createPage({ title, slug }) {
  const d = await conn();
  const id = newId();
  const s = slugify(slug || title);
  if (isReservedSlug(s)) throw new Error("هذا المسار محجوز لصفحة موجودة في المتجر.");
  await d.run(
    `INSERT INTO pages (id, slug, title, status, ${q("blocksJson")}) VALUES (?, ?, ?, 'draft', '[]')`,
    [id, s, String(title).slice(0, 200)]
  );
  return id;
}

export async function updatePage(id, data) {
  const d = await conn();
  const current = await getPageById(id);
  if (!current) throw new Error("الصفحة غير موجودة.");

  const slug = data.slug ? slugify(data.slug) : current.slug;
  if (slug !== current.slug && isReservedSlug(slug)) {
    throw new Error("هذا المسار محجوز لصفحة موجودة في المتجر.");
  }

  const status = ["draft", "published"].includes(data.status) ? data.status : current.status;
  const blocks = data.blocks ? sanitizeBlocks(data.blocks) : current.blocks;

  // تاريخ النشر يُثبَّت عند أول نشر ولا يتغيّر بعده
  const publishedAt =
    status === "published" && !current.publishedAt ? D(new Date()) : D(current.publishedAt);

  await d.run(
    `UPDATE pages SET slug=?, title=?, status=?, ${q("blocksJson")}=?, ${q("seoTitle")}=?,
       ${q("seoDescription")}=?, ${q("ogImage")}=?, ${q("noIndex")}=?, ${q("showInFooter")}=?,
       ${q("showInHeader")}=?, ${q("sortOrder")}=?, ${q("publishedAt")}=?, ${q("updatedAt")}=?
     WHERE id=?`,
    [
      slug, String(data.title ?? current.title).slice(0, 200), status, JSON.stringify(blocks),
      data.seoTitle || null, data.seoDescription || null, data.ogImage || null,
      B(data.noIndex), B(data.showInFooter), B(data.showInHeader),
      Number(data.sortOrder) || 0, publishedAt, D(new Date()), id,
    ]
  );
  return getPageById(id);
}

export async function deletePage(id) {
  const d = await conn();
  await d.run(`DELETE FROM pages WHERE id = ?`, [id]);
}

/** صفحات منشورة للتنقّل — تُستهلك في الفوتر والهيدر. */
export async function navPages() {
  const d = await conn();
  const rows = await d.all(
    `SELECT slug, title, ${q("showInFooter")} AS f, ${q("showInHeader")} AS h
       FROM pages WHERE status = 'published' ORDER BY ${q("sortOrder")}`
  );
  return rows.map((r) => ({
    slug: r.slug, title: r.title,
    inFooter: r.f === true || r.f === 1,
    inHeader: r.h === true || r.h === 1,
  }));
}
