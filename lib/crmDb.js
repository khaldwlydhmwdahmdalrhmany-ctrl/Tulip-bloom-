/**
 * ═══════════════════════════════════════════════════════════
 *  طبقة CRM — توحيد جهات الاتصال
 * ═══════════════════════════════════════════════════════════
 *
 *  ── الفكرة المركزية ──
 *  «العميل» في متجر ورد ليس بالضرورة حسابًا مسجّلًا. أغلب
 *  الطلبات تأتي من ضيوف تركوا اسمًا ورقمًا فقط. أي CRM يعرض
 *  جدول `customers` وحده يُخفي أكثر عملائك.
 *
 *  لذلك نبني «جهة اتصال» موحّدة من مصدرين:
 *    • جدول `customers`  — الحسابات المسجّلة
 *    • جدول `orders`     — كل رقم جوال طلب ولو مرة
 *
 *  والدمج بالجوال المطبَّع (أرقامه فقط). الحساب المسجّل الذي
 *  يحمل نفس الجوال يبتلع سجلّ الضيف — لأنهما شخص واحد فعلًا.
 */

import crypto from "node:crypto";
import { getOrders } from "./db.js";
import { listCustomers } from "./customerDb.js";

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

export const digitsOnly = (v) => String(v || "").replace(/\D/g, "");

/** مفتاح جهة الاتصال — الحساب يفوز على الجوال حين يوجد الاثنان. */
export const contactKeyFor = ({ customerId, phone }) =>
  customerId ? `c:${customerId}` : `p:${digitsOnly(phone)}`;

/* ═══════════════ الشرائح ═══════════════ */

const DAY = 86400000;

/**
 * الشرائح محسوبة لا مخزّنة.
 *
 * تخزينها يعني أنها تتقادم: عميل صُنِّف «نشط» يبقى نشطًا في
 * القاعدة بعد ستة أشهر من صمته. الحساب اللحظي دائمًا صادق.
 */
export const SEGMENTS = [
  { key: "vip",       label: "كبار العملاء", hint: "٣ طلبات فأكثر أو إنفاق مرتفع" },
  { key: "repeat",    label: "متكرّرون",      hint: "طلبان فأكثر" },
  { key: "new",       label: "جدد",           hint: "طلب واحد خلال ٣٠ يومًا" },
  { key: "at_risk",   label: "معرّضون للفقد", hint: "اشترى سابقًا وصمت ٩٠ يومًا" },
  { key: "prospect",  label: "بلا طلبات",     hint: "سجّل حسابًا ولم يطلب بعد" },
  { key: "marketing", label: "يقبل التسويق",  hint: "وافق على العروض" },
];

function segmentsFor(c) {
  const out = [];
  const now = Date.now();
  const last = c.lastOrderAt ? new Date(c.lastOrderAt).getTime() : null;
  const daysSince = last ? Math.floor((now - last) / DAY) : null;

  if (c.orderCount === 0) out.push("prospect");
  if (c.orderCount >= 3 || c.lifetimeValue >= 1500) out.push("vip");
  if (c.orderCount >= 2) out.push("repeat");
  if (c.orderCount === 1 && daysSince !== null && daysSince <= 30) out.push("new");
  if (c.orderCount >= 1 && daysSince !== null && daysSince > 90) out.push("at_risk");
  if (c.marketingOptIn) out.push("marketing");
  return out;
}

/* ═══════════════ بناء جهات الاتصال ═══════════════ */

export async function buildContacts() {
  const [customers, orders, tags] = await Promise.all([
    listCustomers({ limit: 2000 }).catch(() => []),
    getOrders().catch(() => []),
    listAllTags().catch(() => []),
  ]);

  const tagsByKey = new Map();
  for (const t of tags) {
    const arr = tagsByKey.get(t.contactKey) || [];
    arr.push(t.tag);
    tagsByKey.set(t.contactKey, arr);
  }

  /** الفهرس بالجوال يسمح بابتلاع سجلّ الضيف عند وجود حساب بنفس الرقم. */
  const byPhone = new Map();
  const map = new Map();   // contactKey -> contact

  const blank = (over) => ({
    key: "", name: "", email: "", phone: "",
    registered: false, customerId: null, status: "active",
    marketingOptIn: false, createdAt: null,
    orderCount: 0, lifetimeValue: 0, lastOrderAt: null, firstOrderAt: null,
    orders: [], tags: [], segments: [],
    ...over,
  });

  for (const c of customers) {
    const key = `c:${c.id}`;
    const phone = digitsOnly(c.phone);
    const contact = blank({
      key, customerId: c.id, registered: true,
      name: c.name || "", email: c.email || "", phone,
      status: c.status || "active",
      marketingOptIn: c.marketingOptIn === true || c.marketingOptIn === 1,
      createdAt: c.createdAt,
    });
    map.set(key, contact);
    if (phone) byPhone.set(phone, contact);
  }

  for (const o of orders) {
    const phone = digitsOnly(o.customerPhone);
    // الحساب المسجّل بنفس الرقم يبتلع الطلب — شخص واحد لا اثنان
    let contact = (o.customerId && map.get(`c:${o.customerId}`)) || (phone && byPhone.get(phone));

    if (!contact) {
      const key = `p:${phone || "unknown"}`;
      contact = map.get(key) || blank({
        key, phone, name: o.customerName || "", createdAt: o.createdAt,
      });
      map.set(key, contact);
      if (phone) byPhone.set(phone, contact);
    }

    if (!contact.name && o.customerName) contact.name = o.customerName;
    contact.orderCount += 1;
    contact.lifetimeValue += Number(o.total || 0);
    contact.orders.push({
      id: o.id, orderNumber: o.orderNumber, total: Number(o.total || 0),
      status: o.status, createdAt: o.createdAt, city: o.customerCity || "",
      couponCode: o.couponCode || null,
    });

    const t = new Date(o.createdAt).getTime();
    if (!contact.lastOrderAt || t > new Date(contact.lastOrderAt).getTime()) contact.lastOrderAt = o.createdAt;
    if (!contact.firstOrderAt || t < new Date(contact.firstOrderAt).getTime()) contact.firstOrderAt = o.createdAt;
  }

  const list = [...map.values()].map((c) => ({
    ...c,
    lifetimeValue: Math.round(c.lifetimeValue),
    avgOrder: c.orderCount ? Math.round(c.lifetimeValue / c.orderCount) : 0,
    orders: c.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    tags: tagsByKey.get(c.key) || [],
    segments: segmentsFor(c),
  }));

  list.sort((a, b) => b.lifetimeValue - a.lifetimeValue || b.orderCount - a.orderCount);
  return list;
}

export async function getContact(key) {
  const all = await buildContacts();
  return all.find((c) => c.key === key) || null;
}

export function crmOverview(contacts) {
  const total = contacts.length;
  const buyers = contacts.filter((c) => c.orderCount > 0);
  const revenue = buyers.reduce((s, c) => s + c.lifetimeValue, 0);
  const repeat = contacts.filter((c) => c.orderCount >= 2).length;
  return {
    total,
    registered: contacts.filter((c) => c.registered).length,
    guests: contacts.filter((c) => !c.registered).length,
    buyers: buyers.length,
    revenue: Math.round(revenue),
    avgLtv: buyers.length ? Math.round(revenue / buyers.length) : 0,
    repeatRate: buyers.length ? Math.round((repeat / buyers.length) * 100) : 0,
    atRisk: contacts.filter((c) => c.segments.includes("at_risk")).length,
  };
}

/* ═══════════════ الملاحظات ═══════════════ */

export async function listNotes(contactKey) {
  const d = await conn();
  return d.all(`SELECT * FROM crm_notes WHERE ${q("contactKey")} = ? ORDER BY ${q("createdAt")} DESC LIMIT 200`, [contactKey]);
}

export async function addNote(contactKey, body, author) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO crm_notes (id, ${q("contactKey")}, body, author) VALUES (?, ?, ?, ?)`,
    [id, contactKey, String(body).slice(0, 4000), author || null]
  );
  return id;
}

export async function deleteNote(id) {
  const d = await conn();
  await d.run(`DELETE FROM crm_notes WHERE id = ?`, [id]);
}

/* ═══════════════ المهام ═══════════════ */

export async function listTasks(contactKey) {
  const d = await conn();
  return d.all(`SELECT * FROM crm_tasks WHERE ${q("contactKey")} = ? ORDER BY done, ${q("dueAt")} LIMIT 200`, [contactKey]);
}

/** كل المهام المستحقّة — يغذّي بطاقة «متابعات اليوم» في اللوحة. */
export async function dueTasks({ limit = 50 } = {}) {
  const d = await conn();
  return d.all(
    `SELECT * FROM crm_tasks WHERE done ${isPg ? "IS NOT TRUE" : "= 0"} ORDER BY ${q("dueAt")} LIMIT ?`,
    [limit]
  );
}

export async function addTask(contactKey, { title, dueAt }) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO crm_tasks (id, ${q("contactKey")}, title, ${q("dueAt")}) VALUES (?, ?, ?, ?)`,
    [id, contactKey, String(title).slice(0, 300), D(dueAt)]
  );
  return id;
}

export async function toggleTask(id, done) {
  const d = await conn();
  await d.run(
    `UPDATE crm_tasks SET done = ?, ${q("completedAt")} = ? WHERE id = ?`,
    [B(done), done ? D(new Date()) : null, id]
  );
}

export async function deleteTask(id) {
  const d = await conn();
  await d.run(`DELETE FROM crm_tasks WHERE id = ?`, [id]);
}

/* ═══════════════ الوسوم ═══════════════ */

export async function listAllTags() {
  const d = await conn();
  const rows = await d.all(`SELECT ${q("contactKey")} AS ck, tag FROM crm_tags LIMIT 5000`);
  return rows.map((r) => ({ contactKey: r.ck, tag: r.tag }));
}

export async function addTag(contactKey, tag) {
  const d = await conn();
  const clean = String(tag).trim().slice(0, 40);
  if (!clean) return;
  try {
    await d.run(`INSERT INTO crm_tags (id, ${q("contactKey")}, tag) VALUES (?, ?, ?)`, [newId(), contactKey, clean]);
  } catch { /* القيد الفريد رفض التكرار — الحالة المطلوبة محقّقة */ }
}

export async function removeTag(contactKey, tag) {
  const d = await conn();
  await d.run(`DELETE FROM crm_tags WHERE ${q("contactKey")} = ? AND tag = ?`, [contactKey, String(tag).trim()]);
}

/* ═══════════════ التصدير ═══════════════ */

/**
 * CSV بفاصلة منقوطة و BOM.
 * Excel العربي يفتح ملف UTF-8 بلا BOM كرموز مشوّهة، ويعامل
 * الفاصلة العادية كمحرف عادي في الإعداد الإقليمي العربي.
 */
export function contactsToCsv(contacts) {
  const head = ["الاسم", "الجوال", "البريد", "مسجّل", "عدد الطلبات", "إجمالي الشراء", "متوسط الطلب", "آخر طلب", "الشرائح", "الوسوم"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = contacts.map((c) => [
    c.name, c.phone, c.email, c.registered ? "نعم" : "لا",
    c.orderCount, c.lifetimeValue, c.avgOrder,
    c.lastOrderAt ? new Date(c.lastOrderAt).toISOString().slice(0, 10) : "",
    c.segments.map((s) => SEGMENTS.find((x) => x.key === s)?.label || s).join(" · "),
    c.tags.join(" · "),
  ].map(esc).join(";"));
  return "\uFEFF" + [head.map(esc).join(";"), ...rows].join("\r\n");
}
