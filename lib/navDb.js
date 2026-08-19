/**
 * ═══════════════════════════════════════════════════════════
 *  محرّر القوائم — طبقة البيانات
 * ═══════════════════════════════════════════════════════════
 *
 *  ⚠️ القاعدة تتجاوز التهيئة، لا تحلّ محلّها.
 *  `NAV_LINKS` في `content.config.js` يبقى الأساس. متى وُجدت
 *  عناصر في `nav_items` لموقع ما، تفوز هي. الفائدة: متجر لم
 *  يحرّر قوائمه يعمل كما هو، ومن حرّرها لا يفاجَأ بعودتها بعد
 *  أي تحديث للتهيئة.
 */

import crypto from "node:crypto";

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

const norm = (r) => ({
  id: r.id, location: r.location, label: r.label, href: r.href,
  sortOrder: Number(r.sortOrder || 0),
  newTab: r.newTab === true || r.newTab === 1,
  accent: r.accent === true || r.accent === 1,
  active: r.active === true || r.active === 1,
});

export async function listNavItems(location) {
  const d = await conn();
  const rows = location
    ? await d.all(`SELECT * FROM nav_items WHERE location = ? ORDER BY ${q("sortOrder")}`, [location])
    : await d.all(`SELECT * FROM nav_items ORDER BY location, ${q("sortOrder")}`);
  return rows.map(norm);
}

/** العناصر المفعّلة لموقع — يُستهلك في الهيدر والفوتر. */
export async function activeNav(location) {
  try {
    return (await listNavItems(location)).filter((i) => i.active);
  } catch {
    return [];   // الجدول قد لا يوجد بعد — نعود للتهيئة
  }
}

export async function createNavItem(data) {
  const d = await conn();
  const id = newId();
  const location = data.location === "footer" ? "footer" : "header";
  await d.run(
    `INSERT INTO nav_items (id, location, label, href, ${q("sortOrder")}, ${q("newTab")}, accent, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, location, String(data.label).slice(0, 80), String(data.href).slice(0, 300),
     Number(data.sortOrder) || 0, B(data.newTab), B(data.accent), B(data.active !== false)]
  );
  return id;
}

export async function updateNavItem(id, data) {
  const d = await conn();
  await d.run(
    `UPDATE nav_items SET label=?, href=?, ${q("sortOrder")}=?, ${q("newTab")}=?, accent=?, active=? WHERE id=?`,
    [String(data.label).slice(0, 80), String(data.href).slice(0, 300),
     Number(data.sortOrder) || 0, B(data.newTab), B(data.accent), B(data.active !== false), id]
  );
}

export async function deleteNavItem(id) {
  const d = await conn();
  await d.run(`DELETE FROM nav_items WHERE id = ?`, [id]);
}

/** إعادة ترتيب دفعة واحدة — الترتيب يتغيّر كثيرًا ونداء لكل عنصر مبدّد. */
export async function reorderNav(items = []) {
  const d = await conn();
  for (const [i, id] of items.entries()) {
    await d.run(`UPDATE nav_items SET ${q("sortOrder")} = ? WHERE id = ?`, [i, id]);
  }
}
