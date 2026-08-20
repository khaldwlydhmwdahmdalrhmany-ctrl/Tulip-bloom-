/**
 * ═══════════════════════════════════════════════════════════
 *  المدفوعات — طبقة البيانات
 * ═══════════════════════════════════════════════════════════
 */

import crypto from "node:crypto";
import { GATEWAYS } from "./gateways.js";

const raw = (process.env.DATABASE_URL || "").trim();
const isPg = raw.startsWith("postgres");
const newId = () => crypto.randomBytes(12).toString("hex");
const q = (n) => (isPg ? `"${n}"` : n);
const prep = (sql) => { if (!isPg) return sql; let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
const B = (v) => (isPg ? !!v : v ? 1 : 0);
const D = (d) => (d ? (isPg ? new Date(d) : new Date(d).toISOString().slice(0, 19).replace("T", " ")) : null);
const bool = (v) => v === true || v === 1;

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

/* ═══════════════ إعدادات البوابات ═══════════════ */

export async function listGatewayConfigs() {
  const d = await conn();
  const rows = await d.all(`SELECT * FROM payment_gateways`);
  return Object.fromEntries(rows.map((r) => [r.code, {
    code: r.code, enabled: bool(r.enabled), mode: r.mode || "test",
    publishableKey: r.publishableKey || "", secretKey: r.secretKey || "",
    webhookSecret: r.webhookSecret || "", extraJson: r.extraJson || "",
    sortOrder: Number(r.sortOrder || 0),
  }]));
}

/**
 * ⚠️ إلزامية قبل أي تمرير للوحة.
 * المفاتيح السرّية في HTML الصفحة تُقرأ من «عرض المصدر» ومن أي
 * إضافة متصفّح. مفتاح بوابة مسرَّب يعني سحب أموال باسم المتجر.
 */
export function maskGatewayConfigs(configs) {
  const mask = (v) => (v ? `${"•".repeat(Math.max(0, Math.min(12, v.length - 4)))}${v.slice(-4)}` : "");
  return Object.fromEntries(Object.entries(configs).map(([k, c]) => [k, {
    code: c.code, enabled: c.enabled, mode: c.mode, sortOrder: c.sortOrder,
    publishableKey: mask(c.publishableKey),
    secretKey: mask(c.secretKey),
    webhookSecret: mask(c.webhookSecret),
    hasPublishable: !!c.publishableKey, hasSecret: !!c.secretKey, hasWebhook: !!c.webhookSecret,
    // الحقول غير السرّية (بيانات التحويل البنكي) تُعرض كما هي
    extra: safeExtra(c.extraJson),
  }]));
}

function safeExtra(json) {
  try { return JSON.parse(json || "{}"); } catch { return {}; }
}

export async function saveGatewayConfig(code, data) {
  if (!GATEWAYS[code]) throw new Error("بوابة غير معروفة.");
  const d = await conn();
  const cur = await one(`SELECT * FROM payment_gateways WHERE code = ?`, [code]);

  /** الفراغ يعني «لا تغيّر» لا «امسح» — اللوحة تعرض المفاتيح مقنّعة. */
  const keep = (incoming, current) => (incoming === undefined || incoming === "" ? current : incoming);

  const extra = data.extra ? JSON.stringify(data.extra) : keep(undefined, cur?.extraJson) || null;

  if (cur) {
    await d.run(
      `UPDATE payment_gateways SET enabled=?, mode=?, ${q("publishableKey")}=?, ${q("secretKey")}=?,
         ${q("webhookSecret")}=?, ${q("extraJson")}=?, ${q("sortOrder")}=?, ${q("updatedAt")}=? WHERE code=?`,
      [B(data.enabled), data.mode === "live" ? "live" : "test",
       keep(data.publishableKey, cur.publishableKey), keep(data.secretKey, cur.secretKey),
       keep(data.webhookSecret, cur.webhookSecret), extra,
       Number(data.sortOrder) || 0, D(new Date()), code]
    );
    return;
  }
  await d.run(
    `INSERT INTO payment_gateways (code, enabled, mode, ${q("publishableKey")}, ${q("secretKey")}, ${q("webhookSecret")}, ${q("extraJson")}, ${q("sortOrder")})
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, B(data.enabled), data.mode === "live" ? "live" : "test",
     data.publishableKey || null, data.secretKey || null, data.webhookSecret || null,
     extra, Number(data.sortOrder) || 0]
  );
}

/**
 * طرق الدفع المتاحة للعميل.
 * ⚠️ لا تُرجع أي مفتاح — الواجهة تحتاج الأسماء فقط.
 */
/**
 * هل بيانات التحويل البنكي مكتملة؟
 *
 * ⚠️ النصوص الافتراضية التي يزرعها `setup:launch` («— أدخل
 * الآيبان —») كانت تُعرض للعميل حرفيًا. عرض خيار دفع ببيانات
 * ناقصة أسوأ من إخفائه: العميل يؤكّد طلبه ثم لا يجد إلى أين
 * يحوّل.
 */
function bankReady(extra) {
  const filled = (v) => {
    const t = String(v || "").trim();
    return t.length > 3 && !t.includes("—") && !t.includes("أدخل");
  };
  return filled(extra.iban) && filled(extra.bankName);
}

/**
 * طرق الدفع المعروضة للعميل.
 *
 * ⚠️ ثلاثة شروط، وكلها إلزامية:
 *   ١) مفعّلة من اللوحة
 *   ٢) `implemented` — كود التكامل مكتوب فعلًا
 *   ٣) جاهزة عمليًا (مفتاح سرّي للإلكترونية، آيبان للتحويل)
 *
 * الشرط الثاني هو الحارس: تفعيل بوابة قبل كتابة تكاملها لا
 * يعرّضها للعملاء إطلاقًا.
 */
export async function availableMethods() {
  const configs = await listGatewayConfigs();
  const out = [];

  for (const def of Object.values(GATEWAYS)) {
    const cfg = configs[def.code];
    if (!cfg?.enabled) continue;
    if (!def.implemented) continue;          // ← الحارس

    if (!def.needsKeys) {
      const extra = safeExtra(cfg.extraJson);
      if (def.code === "bank_transfer" && !bankReady(extra)) continue;

      out.push({
        code: def.code, name: def.name, instant: def.instant,
        methods: def.methods, offline: true,
        extra: def.code === "bank_transfer" ? extra : undefined,
        sortOrder: cfg.sortOrder || 0,
      });
      continue;
    }

    if (!cfg.secretKey) continue;
    out.push({
      code: def.code, name: def.name, instant: def.instant,
      methods: def.methods, offline: false, mode: cfg.mode,
      sortOrder: cfg.sortOrder || 0,
    });
  }

  return out.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * تشخيص لكل بوابة — للوحة التحكم فقط.
 * يفسّر **لماذا** لا تظهر بوابة مفعّلة للعملاء، بدل أن يبحث
 * المشغّل عن السبب في السجلّات.
 */
export async function gatewayDiagnostics() {
  const configs = await listGatewayConfigs();
  return Object.fromEntries(Object.values(GATEWAYS).map((def) => {
    const cfg = configs[def.code] || {};
    const extra = safeExtra(cfg.extraJson);
    let reason = null;

    if (!cfg.enabled) reason = "غير مفعّلة";
    else if (!def.implemented) reason = "التكامل قيد الإنجاز — لن تظهر للعملاء";
    else if (def.needsKeys && !cfg.secretKey) reason = "ينقصها المفتاح السرّي";
    else if (def.needsKeys && !cfg.webhookSecret) reason = "ينقصها سرّ الـwebhook — لن يصل تأكيد الدفع";
    else if (def.code === "bank_transfer" && !bankReady(extra)) reason = "أكمل اسم البنك والآيبان";

    return [def.code, { visible: !reason, reason, implemented: !!def.implemented }];
  }));
}

/* ═══════════════ المدفوعات ═══════════════ */

export async function createPayment({ orderId, gateway, method, amount, currency = "SAR", status = "pending", providerRef, redirectUrl }) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO payments (id, ${q("orderId")}, gateway, method, amount, currency, status, ${q("providerRef")}, ${q("redirectUrl")})
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, orderId, gateway, method || null, Number(amount) || 0, currency, status, providerRef || null, redirectUrl || null]
  );
  return id;
}

export async function getPaymentByRef(providerRef) {
  if (!providerRef) return null;
  return one(`SELECT * FROM payments WHERE ${q("providerRef")} = ? LIMIT 1`, [providerRef]);
}

export async function listPayments({ orderId, limit = 100 } = {}) {
  const d = await conn();
  return orderId
    ? d.all(`SELECT * FROM payments WHERE ${q("orderId")} = ? ORDER BY ${q("createdAt")} DESC`, [orderId])
    : d.all(`SELECT * FROM payments ORDER BY ${q("createdAt")} DESC LIMIT ?`, [limit]);
}

export async function setPaymentStatus(id, status, extra = {}) {
  const d = await conn();
  await d.run(
    `UPDATE payments SET status=?, ${q("providerRef")}=COALESCE(?, ${q("providerRef")}),
       ${q("failureReason")}=?, ${q("rawJson")}=COALESCE(?, ${q("rawJson")}), ${q("updatedAt")}=? WHERE id=?`,
    [status, extra.providerRef || null, extra.failureReason || null,
     extra.raw ? String(extra.raw).slice(0, 20000) : null, D(new Date()), id]
  );
}

/**
 * تحديث حالة الدفع على الطلب.
 * ⚠️ لا نلمس `status` (حالة التجهيز) — الدفع والتجهيز محوران
 * مستقلان: طلب مدفوع قد يكون قيد التجهيز، وطلب غير مدفوع قد
 * يُشحن دفعًا عند الاستلام. خلطهما يفقد المشغّل القدرة على
 * التصفية بأيّهما.
 */
export async function setOrderPayment(orderId, { paymentStatus, paymentMethod }) {
  const d = await conn();
  await d.run(
    `UPDATE orders SET ${q("paymentStatus")}=?, ${q("paymentMethod")}=COALESCE(?, ${q("paymentMethod")}),
       ${q("paidAt")}=? WHERE id=?`,
    [paymentStatus, paymentMethod || null, paymentStatus === "paid" ? D(new Date()) : null, orderId]
  );
}

/* ═══════════════ أحداث الـwebhook ═══════════════ */

/**
 * تسجيل حدث — يُرجع false إن كان مكرّرًا.
 *
 * ⚠️ منع التكرار ليس تحسينًا بل شرط صحة. البوابات تعيد إرسال
 * الحدث حتى تتلقّى 200 (شبكة متقطّعة، مهلة، إعادة نشر). بلا
 * قيد فريد على (gateway, eventId) يُعالَج الدفع مرتين: مخزون
 * يُخصم مرتين، وإشعار يصل مرتين، وتقرير مبيعات مضاعف.
 */
export async function recordEvent({ gateway, eventId, paymentId, type, payload }) {
  const d = await conn();
  try {
    await d.run(
      `INSERT INTO payment_events (id, gateway, ${q("eventId")}, ${q("paymentId")}, type, payload)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newId(), gateway, String(eventId).slice(0, 200), paymentId || null,
       type || null, String(payload || "").slice(0, 20000)]
    );
    return true;
  } catch {
    return false;   // القيد الفريد رفضه — حدث مكرّر
  }
}

export async function listEvents({ limit = 60 } = {}) {
  const d = await conn();
  return d.all(`SELECT * FROM payment_events ORDER BY ${q("createdAt")} DESC LIMIT ?`, [limit]);
}

/* ═══════════════ تقارير ═══════════════ */

export async function paymentStats({ days = 30 } = {}) {
  const d = await conn();
  const since = D(new Date(Date.now() - days * 86400000));
  const rows = await d.all(
    `SELECT status, COUNT(*) AS n, COALESCE(SUM(amount),0) AS total
       FROM payments WHERE ${q("createdAt")} >= ? GROUP BY status`,
    [since]
  );
  const by = Object.fromEntries(rows.map((r) => [r.status, { n: Number(r.n), total: Number(r.total) }]));
  const attempts = rows.reduce((s, r) => s + Number(r.n), 0);
  const paid = by.paid?.n || 0;
  return {
    attempts,
    paid,
    failed: by.failed?.n || 0,
    pending: by.pending?.n || 0,
    revenue: Math.round(by.paid?.total || 0),
    successRate: attempts ? Math.round((paid / attempts) * 100) : 0,
  };
}
