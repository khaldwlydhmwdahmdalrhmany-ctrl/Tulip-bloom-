/**
 * ═══════════════════════════════════════════════════════════
 *  طبقة بيانات التسويق
 * ═══════════════════════════════════════════════════════════
 *  ملف مضاف — يعمل على SQLite وPostgres بنفس طبقة التوافق
 *  المستعملة في `customerDb.js`.
 */

import crypto from "node:crypto";
import { normalizeCode } from "./coupon.js";

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
const one = async (sql, p) => (await (await conn()).all(sql, p))[0] || null;

/* ═══════════════ الكوبونات ═══════════════ */

export async function listCoupons() {
  const d = await conn();
  return d.all(`SELECT * FROM coupons ORDER BY ${q("createdAt")} DESC LIMIT 300`);
}

export async function findCouponByCode(code) {
  return one(`SELECT * FROM coupons WHERE code = ? LIMIT 1`, [normalizeCode(code)]);
}

export async function createCoupon(data) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO coupons (id, code, type, value, ${q("minOrder")}, ${q("maxUses")},
       ${q("perCustomerLimit")}, ${q("categorySlug")}, ${q("startsAt")}, ${q("endsAt")}, active, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, normalizeCode(data.code), data.type || "percent", Number(data.value) || 0,
      Number(data.minOrder) || 0,
      data.maxUses ? Number(data.maxUses) : null,
      data.perCustomerLimit ? Number(data.perCustomerLimit) : null,
      data.categorySlug || null, D(data.startsAt), D(data.endsAt),
      B(data.active !== false), data.note || null,
    ]
  );
  return one(`SELECT * FROM coupons WHERE id = ?`, [id]);
}

export async function updateCouponStatus(id, active) {
  const d = await conn();
  await d.run(`UPDATE coupons SET active = ? WHERE id = ?`, [B(active), id]);
}

export async function deleteCoupon(id) {
  const d = await conn();
  await d.run(`DELETE FROM coupons WHERE id = ?`, [id]);
}

/** مرات استخدام العميل لكود بعينه — يُطابَق بالجوال أو معرّف الحساب. */
export async function couponUsesBy({ couponId, customerId, phone }) {
  const d = await conn();
  const digits = String(phone || "").replace(/\D/g, "");
  const rows = await d.all(
    `SELECT COUNT(*) AS n FROM coupon_redemptions
      WHERE ${q("couponId")} = ? AND (${q("customerId")} = ? OR phone = ?)`,
    [couponId, customerId || "__none__", digits || "__none__"]
  );
  return Number(rows[0]?.n || 0);
}

/**
 * تسجيل استخدام.
 * ⚠️ `usedCount` يُزاد بعبارة `= usedCount + 1` في القاعدة لا
 * بقراءة ثم كتابة: طلبان متزامنان يقرآن نفس الرقم فيُسجَّل
 * استخدام واحد بدل اثنين، ويتجاوز الكود حدّه المعلن.
 */
export async function redeemCoupon({ couponId, orderId, customerId, phone, amount }) {
  const d = await conn();
  await d.run(
    `INSERT INTO coupon_redemptions (id, ${q("couponId")}, ${q("orderId")}, ${q("customerId")}, phone, amount)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newId(), couponId, orderId || null, customerId || null,
     String(phone || "").replace(/\D/g, "") || null, Number(amount) || 0]
  );
  await d.run(`UPDATE coupons SET ${q("usedCount")} = ${q("usedCount")} + 1 WHERE id = ?`, [couponId]);
}

export async function couponPerformance() {
  const d = await conn();
  return d.all(
    `SELECT c.id, c.code, c.type, c.value, c.${q("usedCount")} AS uses,
            COALESCE(SUM(r.amount), 0) AS discounted
       FROM coupons c
       LEFT JOIN coupon_redemptions r ON r.${q("couponId")} = c.id
      GROUP BY c.id, c.code, c.type, c.value, c.${q("usedCount")}
      ORDER BY uses DESC`
  );
}

/* ═══════════════ السلات المتروكة ═══════════════ */

/**
 * حفظ/تحديث سلة مفتوحة. مفتاحها الجلسة لا العميل — أغلب من
 * يترك سلة لم يسجّل دخولًا أصلًا، والربط بالحساب يفقد أكثرهم.
 */
export async function upsertAbandonedCart({ sessionId, customerId, items, total, contactName, contactPhone, source, campaign }) {
  if (!sessionId) return;
  const d = await conn();
  const existing = await one(`SELECT id FROM abandoned_carts WHERE ${q("sessionId")} = ? LIMIT 1`, [sessionId]);
  const json = JSON.stringify(items || []).slice(0, 8000);
  const now = D(new Date());

  if (existing) {
    await d.run(
      `UPDATE abandoned_carts SET ${q("itemsJson")} = ?, total = ?, ${q("contactName")} = COALESCE(?, ${q("contactName")}),
         ${q("contactPhone")} = COALESCE(?, ${q("contactPhone")}), ${q("customerId")} = COALESCE(?, ${q("customerId")}),
         ${q("updatedAt")} = ?
       WHERE id = ? AND status = 'open'`,
      [json, Number(total) || 0, contactName || null, contactPhone || null, customerId || null, now, existing.id]
    );
    return existing.id;
  }

  const id = newId();
  await d.run(
    `INSERT INTO abandoned_carts (id, ${q("sessionId")}, ${q("customerId")}, ${q("itemsJson")}, total,
       ${q("contactName")}, ${q("contactPhone")}, source, campaign, ${q("updatedAt")})
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, sessionId, customerId || null, json, Number(total) || 0,
     contactName || null, contactPhone || null, source || null, campaign || null, now]
  );
  return id;
}

/** الطلب تمّ ← السلة لم تُهجر. يُستدعى من مسار إنشاء الطلب. */
export async function markCartRecovered(sessionId, orderId) {
  if (!sessionId) return;
  const d = await conn();
  await d.run(
    `UPDATE abandoned_carts SET status = 'recovered', ${q("recoveredOrderId")} = ?, ${q("updatedAt")} = ?
      WHERE ${q("sessionId")} = ? AND status <> 'recovered'`,
    [orderId || null, D(new Date()), sessionId]
  );
}

export async function listAbandonedCarts({ status = "open", limit = 100 } = {}) {
  const d = await conn();
  if (status === "all") {
    return d.all(`SELECT * FROM abandoned_carts ORDER BY ${q("updatedAt")} DESC LIMIT ?`, [limit]);
  }
  return d.all(
    `SELECT * FROM abandoned_carts WHERE status = ? ORDER BY ${q("updatedAt")} DESC LIMIT ?`,
    [status, limit]
  );
}

export async function setCartStatus(id, status) {
  const d = await conn();
  await d.run(`UPDATE abandoned_carts SET status = ?, ${q("updatedAt")} = ? WHERE id = ?`,
    [status, D(new Date()), id]);
}

export async function abandonedStats() {
  const d = await conn();
  const rows = await d.all(
    `SELECT status, COUNT(*) AS n, COALESCE(SUM(total),0) AS value FROM abandoned_carts GROUP BY status`
  );
  const by = Object.fromEntries(rows.map((r) => [r.status, { n: Number(r.n), value: Number(r.value) }]));
  const open = by.open?.n || 0;
  const recovered = by.recovered?.n || 0;
  const totalCarts = rows.reduce((s, r) => s + Number(r.n), 0);
  return {
    open,
    openValue: Math.round(by.open?.value || 0),
    contacted: by.contacted?.n || 0,
    recovered,
    recoveredValue: Math.round(by.recovered?.value || 0),
    recoveryRate: totalCarts ? Math.round((recovered / totalCarts) * 100) : 0,
  };
}

/* ═══════════════ الحملات ═══════════════ */

export async function listCampaigns() {
  const d = await conn();
  return d.all(`SELECT * FROM campaigns ORDER BY ${q("createdAt")} DESC LIMIT 200`);
}

export async function createCampaign(data) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO campaigns (id, name, source, medium, campaign, ${q("landingPath")}, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.source, data.medium || null, data.campaign, data.landingPath || "/", data.note || null]
  );
  return id;
}

export async function deleteCampaign(id) {
  const d = await conn();
  await d.run(`DELETE FROM campaigns WHERE id = ?`, [id]);
}

/**
 * أداء الحملات من جدول الطلبات.
 * لا نبني تتبّعًا موازيًا: أعمدة الإسناد موجودة في `orders` منذ
 * النواة، وقراءتها أدقّ من أي عدّاد منفصل قد يفترق عنها.
 */
export async function campaignPerformance({ days = 30 } = {}) {
  const d = await conn();
  const since = D(new Date(Date.now() - days * 86400000));
  return d.all(
    `SELECT COALESCE(source,'مباشر') AS source,
            COALESCE(medium,'—') AS medium,
            COALESCE(campaign,'—') AS campaign,
            COUNT(*) AS orders,
            COALESCE(SUM(total),0) AS revenue
       FROM orders
      WHERE ${q("createdAt")} >= ?
      GROUP BY source, medium, campaign
      ORDER BY revenue DESC
      LIMIT 40`,
    [since]
  );
}
