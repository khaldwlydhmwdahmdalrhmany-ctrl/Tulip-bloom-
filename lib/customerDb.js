/**
 * ═══════════════════════════════════════════════════════════
 *  طبقة بيانات العملاء
 * ═══════════════════════════════════════════════════════════
 *
 *  ملف مضاف. لم يُلمس `lib/db.pg.js` ولا `lib/db.sqlite.js` عدا
 *  إضافة جداول v8 — كل منطق الاستعلام هنا.
 *
 *  يعمل على المحرّكين بطبقة توافق رفيعة:
 *   • Postgres: علامات $1 وأسماء أعمدة بحالة الجمل بين اقتباسات
 *   • SQLite:   علامات ? وأسماء بلا اقتباس
 *
 *  السبب في عدم استخدام ORM: النواة كلها SQL خام، وإدخال ORM
 *  لجدول واحد يضيف تبعية ثقيلة ونمطًا ثانيًا يربك من يقرأ الكود.
 */

import crypto from "node:crypto";

const raw = (process.env.DATABASE_URL || "").trim();
const isPg = raw.startsWith("postgres");

const newId = () => crypto.randomBytes(12).toString("hex");

/* ── طبقة التوافق ── */

let pgPool = null;
async function pg() {
  if (!pgPool) {
    const { default: pgLib } = await import("pg");
    pgPool = new pgLib.Pool({
      connectionString: raw,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pgPool;
}

async function sqliteDb() {
  const { getDb } = await import("./db.sqlite.js");
  return getDb();
}

/** اسم العمود: Postgres يحتاج اقتباسًا لحالة الجمل، SQLite لا. */
const q = (name) => (isPg ? `"${name}"` : name);

/** يحوّل ? إلى $1,$2… عند Postgres. */
function prep(sql) {
  if (!isPg) return sql;
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/** القيم المنطقية: Postgres boolean، SQLite 0/1. */
const B = (v) => (isPg ? !!v : v ? 1 : 0);
/** التواريخ: Postgres يقبل Date، SQLite يحتاج نصًّا. */
const D = (d) => (isPg ? d : new Date(d).toISOString().slice(0, 19).replace("T", " "));

async function all(sql, params = []) {
  if (isPg) {
    const pool = await pg();
    const { rows } = await pool.query(prep(sql), params);
    return rows;
  }
  const db = await sqliteDb();
  return db.prepare(sql).all(...params);
}

async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  if (isPg) {
    const pool = await pg();
    await pool.query(prep(sql), params);
    return;
  }
  const db = await sqliteDb();
  db.prepare(sql).run(...params);
}

/* ═══════════════ العملاء ═══════════════ */

export async function findCustomerByEmail(email) {
  return get(`SELECT * FROM customers WHERE email = ? LIMIT 1`, [email]);
}

export async function findCustomerById(id) {
  return get(`SELECT * FROM customers WHERE id = ? LIMIT 1`, [id]);
}

export async function createCustomer({ email, passwordHash, name, phone, marketingOptIn }) {
  const id = newId();
  await run(
    `INSERT INTO customers (id, email, ${q("passwordHash")}, name, phone, ${q("marketingOptIn")})
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, email, passwordHash, name || null, phone || null, B(marketingOptIn)]
  );
  return findCustomerById(id);
}

export async function updateCustomerProfile(id, { name, phone, marketingOptIn }) {
  await run(
    `UPDATE customers SET name = ?, phone = ?, ${q("marketingOptIn")} = ? WHERE id = ?`,
    [name || null, phone || null, B(marketingOptIn), id]
  );
  return findCustomerById(id);
}

export async function setCustomerPassword(id, passwordHash) {
  await run(
    `UPDATE customers SET ${q("passwordHash")} = ?, ${q("failedAttempts")} = 0, ${q("lockedUntil")} = NULL WHERE id = ?`,
    [passwordHash, id]
  );
  // تغيير كلمة المرور يُبطل كل الجلسات — الممارسة الصحيحة:
  // لو سُرِق الحساب فتغيير كلمة المرور يطرد المهاجم فورًا.
  await run(`DELETE FROM customer_sessions WHERE ${q("customerId")} = ?`, [id]);
}

export async function recordLoginSuccess(id) {
  await run(
    `UPDATE customers SET ${q("lastLoginAt")} = ?, ${q("failedAttempts")} = 0, ${q("lockedUntil")} = NULL WHERE id = ?`,
    [D(new Date()), id]
  );
}

export async function recordLoginFailure(id, attempts, lockDate) {
  await run(
    `UPDATE customers SET ${q("failedAttempts")} = ?, ${q("lockedUntil")} = ? WHERE id = ?`,
    [attempts, lockDate ? D(lockDate) : null, id]
  );
}

export async function setCustomerStatus(id, status) {
  await run(`UPDATE customers SET status = ? WHERE id = ?`, [status, id]);
  if (status === "blocked") {
    await run(`DELETE FROM customer_sessions WHERE ${q("customerId")} = ?`, [id]);
  }
}

export async function listCustomers({ search = "", limit = 200 } = {}) {
  if (search) {
    const like = `%${search.toLowerCase()}%`;
    return all(
      `SELECT * FROM customers
       WHERE LOWER(email) LIKE ? OR LOWER(COALESCE(name,'')) LIKE ? OR COALESCE(phone,'') LIKE ?
       ORDER BY ${q("createdAt")} DESC LIMIT ?`,
      [like, like, like, limit]
    );
  }
  return all(`SELECT * FROM customers ORDER BY ${q("createdAt")} DESC LIMIT ?`, [limit]);
}

export async function countCustomers() {
  const r = await get(`SELECT COUNT(*) AS n FROM customers`);
  return Number(r?.n || 0);
}

/* ═══════════════ الجلسات ═══════════════ */

export async function createSession({ tokenHash, customerId, userAgent, expiresAt }) {
  const id = newId();
  await run(
    `INSERT INTO customer_sessions (id, ${q("tokenHash")}, ${q("customerId")}, ${q("userAgent")}, ${q("expiresAt")})
     VALUES (?, ?, ?, ?, ?)`,
    [id, tokenHash, customerId, (userAgent || "").slice(0, 250), D(expiresAt)]
  );
  return id;
}

/**
 * يُرجع العميل صاحب الجلسة، أو null.
 * يتحقّق من: وجود الجلسة، وعدم انتهائها، وأن الحساب غير محظور.
 */
export async function customerBySessionToken(tokenHash) {
  if (!tokenHash) return null;
  const row = await get(
    `SELECT s.${q("expiresAt")} AS exp, c.*
       FROM customer_sessions s
       JOIN customers c ON c.id = s.${q("customerId")}
      WHERE s.${q("tokenHash")} = ? LIMIT 1`,
    [tokenHash]
  );
  if (!row) return null;
  if (new Date(row.exp).getTime() < Date.now()) {
    await destroySession(tokenHash);
    return null;
  }
  if (row.status === "blocked") return null;
  return row;
}

export async function destroySession(tokenHash) {
  await run(`DELETE FROM customer_sessions WHERE ${q("tokenHash")} = ?`, [tokenHash]);
}

export async function destroyAllSessions(customerId) {
  await run(`DELETE FROM customer_sessions WHERE ${q("customerId")} = ?`, [customerId]);
}

/* ═══════════════ إعادة تعيين كلمة المرور ═══════════════ */

export async function createPasswordReset(customerId, tokenHash, expiresAt) {
  const id = newId();
  // رمز واحد صالح في كل مرة — إصدار جديد يُلغي القديم
  await run(`DELETE FROM password_resets WHERE ${q("customerId")} = ? AND ${q("usedAt")} IS NULL`, [customerId]);
  await run(
    `INSERT INTO password_resets (id, ${q("tokenHash")}, ${q("customerId")}, ${q("expiresAt")}) VALUES (?, ?, ?, ?)`,
    [id, tokenHash, customerId, D(expiresAt)]
  );
  return id;
}

export async function consumePasswordReset(tokenHash) {
  const row = await get(
    `SELECT * FROM password_resets WHERE ${q("tokenHash")} = ? LIMIT 1`,
    [tokenHash]
  );
  if (!row) return null;
  if (row.usedAt) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) return null;
  await run(`UPDATE password_resets SET ${q("usedAt")} = ? WHERE id = ?`, [D(new Date()), row.id]);
  return row;
}

/* ═══════════════ العناوين ═══════════════ */

export async function listAddresses(customerId) {
  return all(
    `SELECT * FROM customer_addresses WHERE ${q("customerId")} = ? ORDER BY ${q("isDefault")} DESC, ${q("createdAt")} DESC`,
    [customerId]
  );
}

export async function createAddress(customerId, d) {
  const id = newId();
  await run(
    `INSERT INTO customer_addresses (id, ${q("customerId")}, label, city, district, street, notes, ${q("isDefault")})
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, customerId, d.label || null, d.city || null, d.district || null, d.street || null, d.notes || null, B(d.isDefault)]
  );
  if (d.isDefault) await setDefaultAddress(customerId, id);
  return id;
}

export async function setDefaultAddress(customerId, addressId) {
  await run(`UPDATE customer_addresses SET ${q("isDefault")} = ? WHERE ${q("customerId")} = ?`, [B(false), customerId]);
  await run(`UPDATE customer_addresses SET ${q("isDefault")} = ? WHERE id = ? AND ${q("customerId")} = ?`, [B(true), addressId, customerId]);
}

export async function deleteAddress(customerId, addressId) {
  await run(`DELETE FROM customer_addresses WHERE id = ? AND ${q("customerId")} = ?`, [addressId, customerId]);
}

/* ═══════════════ المستلمون ═══════════════ */

export async function listRecipients(customerId) {
  return all(
    `SELECT * FROM customer_recipients WHERE ${q("customerId")} = ? ORDER BY ${q("createdAt")} DESC`,
    [customerId]
  );
}

export async function createRecipient(customerId, d) {
  const id = newId();
  await run(
    `INSERT INTO customer_recipients (id, ${q("customerId")}, name, relation, phone, city, district, street, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, customerId, d.name, d.relation || null, d.phone || null, d.city || null, d.district || null, d.street || null, d.notes || null]
  );
  return id;
}

export async function deleteRecipient(customerId, id) {
  await run(`DELETE FROM customer_recipients WHERE id = ? AND ${q("customerId")} = ?`, [id, customerId]);
}

/* ═══════════════ تذكيرات المناسبات ═══════════════ */

export async function listReminders(customerId) {
  return all(
    `SELECT r.*, p.name AS ${q("recipientName")}
       FROM customer_reminders r
       LEFT JOIN customer_recipients p ON p.id = r.${q("recipientId")}
      WHERE r.${q("customerId")} = ?
      ORDER BY r.month, r.day`,
    [customerId]
  );
}

export async function createReminder(customerId, d) {
  const id = newId();
  await run(
    `INSERT INTO customer_reminders (id, ${q("customerId")}, ${q("recipientId")}, title, occasion, month, day, ${q("leadDays")})
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, customerId, d.recipientId || null, d.title, d.occasion || null, Number(d.month), Number(d.day), Number(d.leadDays ?? 3)]
  );
  return id;
}

export async function deleteReminder(customerId, id) {
  await run(`DELETE FROM customer_reminders WHERE id = ? AND ${q("customerId")} = ?`, [id, customerId]);
}

/**
 * التذكيرات القادمة خلال نافذة أيام.
 * يُحسب في JavaScript لا في SQL: مقارنة يوم/شهر عبر حدّ السنة
 * (ديسمبر ← يناير) تُنتج استعلامًا معقّدًا ومختلفًا بين المحرّكين.
 */
export async function upcomingReminders(customerId, withinDays = 45) {
  const rows = await listReminders(customerId);
  const now = new Date();
  const y = now.getFullYear();

  return rows
    .filter((r) => r.active !== 0 && r.active !== false)
    .map((r) => {
      let next = new Date(y, r.month - 1, r.day);
      if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        next = new Date(y + 1, r.month - 1, r.day);
      }
      const days = Math.round((next - now) / 86400000);
      return { ...r, nextDate: next, daysAway: days };
    })
    .filter((r) => r.daysAway <= withinDays)
    .sort((a, b) => a.daysAway - b.daysAway);
}

/* ═══════════════ الطلبات المرتبطة ═══════════════ */

export async function ordersForCustomer(customerId) {
  return all(
    `SELECT * FROM orders WHERE ${q("customerId")} = ? ORDER BY ${q("createdAt")} DESC`,
    [customerId]
  );
}

export async function attachOrderToCustomer(orderId, customerId) {
  await run(`UPDATE orders SET ${q("customerId")} = ? WHERE id = ?`, [customerId, orderId]);
}

/** إحصاءات العميل للوحة التحكم. */
export async function customerStats(customerId) {
  const orders = await ordersForCustomer(customerId);
  const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  return {
    orderCount: orders.length,
    lifetimeValue: Math.round(total),
    avgOrder: orders.length ? Math.round(total / orders.length) : 0,
    lastOrderAt: orders[0]?.createdAt || null,
  };
}
