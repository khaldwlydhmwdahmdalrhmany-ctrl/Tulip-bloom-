/**
 * ═══════════════════════════════════════════════════════════
 *  الشحن والتوصيل — طبقة البيانات والتسعير
 * ═══════════════════════════════════════════════════════════
 */

import crypto from "node:crypto";
import { STORE } from "../config/store.config.js";
import { buildTrackingUrl } from "./carriers.js";

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

/* ═══════════════ تطبيع أسماء المدن ═══════════════ */

/**
 * ⚠️ مطابقة المدينة أصعب مما تبدو في العربية.
 * العميل يكتب «الرياض» أو «رياض» أو «Riyadh» أو «الریاض» بياء
 * فارسية. المطابقة الحرفية تُسقطه في المنطقة الافتراضية بسعر
 * خاطئ — وهو خطأ صامت لا يشتكي منه أحد إلا بعد الخسارة.
 */
export function normalizeCity(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ی/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/^ال/, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();
}

/* ═══════════════ المناطق ═══════════════ */

const zoneCities = (z) =>
  String(z.cities || "").split(/[,،\n]/).map((c) => normalizeCity(c)).filter(Boolean);

export async function listZones() {
  const d = await conn();
  const rows = await d.all(`SELECT * FROM shipping_zones ORDER BY ${q("sortOrder")}, name`);
  return rows.map((z) => ({
    id: z.id, name: z.name, cities: z.cities || "",
    isDefault: bool(z.isDefault), sortOrder: Number(z.sortOrder || 0), active: bool(z.active),
  }));
}

export async function createZone(data) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO shipping_zones (id, name, cities, ${q("isDefault")}, ${q("sortOrder")}, active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, String(data.name).slice(0, 120), String(data.cities || "").slice(0, 4000),
     B(data.isDefault), Number(data.sortOrder) || 0, B(data.active !== false)]
  );
  if (data.isDefault) await setDefaultZone(id);
  return id;
}

export async function updateZone(id, data) {
  const d = await conn();
  await d.run(
    `UPDATE shipping_zones SET name=?, cities=?, ${q("sortOrder")}=?, active=? WHERE id=?`,
    [String(data.name).slice(0, 120), String(data.cities || "").slice(0, 4000),
     Number(data.sortOrder) || 0, B(data.active !== false), id]
  );
  if (data.isDefault) await setDefaultZone(id);
}

/** منطقة افتراضية واحدة فقط — أكثر من واحدة يجعل الاختيار عشوائيًا. */
export async function setDefaultZone(id) {
  const d = await conn();
  await d.run(`UPDATE shipping_zones SET ${q("isDefault")} = ?`, [B(false)]);
  await d.run(`UPDATE shipping_zones SET ${q("isDefault")} = ? WHERE id = ?`, [B(true), id]);
}

export async function deleteZone(id) {
  const d = await conn();
  await d.run(`DELETE FROM shipping_zones WHERE id = ?`, [id]);
}

/* ═══════════════ الأسعار ═══════════════ */

export async function listRates(zoneId) {
  const d = await conn();
  const rows = zoneId
    ? await d.all(`SELECT * FROM shipping_rates WHERE ${q("zoneId")} = ? ORDER BY ${q("sortOrder")}, price`, [zoneId])
    : await d.all(`SELECT * FROM shipping_rates ORDER BY ${q("zoneId")}, ${q("sortOrder")}, price`);
  return rows.map((r) => ({
    id: r.id, zoneId: r.zoneId, name: r.name, description: r.description || "",
    price: Number(r.price || 0),
    freeOver: r.freeOver == null ? null : Number(r.freeOver),
    minSubtotal: Number(r.minSubtotal || 0),
    etaText: r.etaText || "", sameDay: bool(r.sameDay),
    cutoffHour: r.cutoffHour == null ? null : Number(r.cutoffHour),
    carrier: r.carrier || "manual",
    sortOrder: Number(r.sortOrder || 0), active: bool(r.active),
  }));
}

export async function createRate(data) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO shipping_rates (id, ${q("zoneId")}, name, description, price, ${q("freeOver")},
       ${q("minSubtotal")}, ${q("etaText")}, ${q("sameDay")}, ${q("cutoffHour")}, carrier, ${q("sortOrder")}, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.zoneId, String(data.name).slice(0, 120), data.description || null,
     Number(data.price) || 0,
     data.freeOver === "" || data.freeOver == null ? null : Number(data.freeOver),
     Number(data.minSubtotal) || 0, data.etaText || null,
     B(data.sameDay), data.cutoffHour == null || data.cutoffHour === "" ? null : Number(data.cutoffHour),
     data.carrier || "manual", Number(data.sortOrder) || 0, B(data.active !== false)]
  );
  return id;
}

export async function deleteRate(id) {
  const d = await conn();
  await d.run(`DELETE FROM shipping_rates WHERE id = ?`, [id]);
}

export async function toggleRate(id, active) {
  const d = await conn();
  await d.run(`UPDATE shipping_rates SET active = ? WHERE id = ?`, [B(active), id]);
}

/* ═══════════════ نوافذ التسليم ═══════════════ */

export async function listSlots() {
  const d = await conn();
  const rows = await d.all(`SELECT * FROM delivery_slots ORDER BY ${q("sortOrder")}, ${q("startHour")}`);
  return rows.map((s) => ({
    id: s.id, label: s.label,
    startHour: Number(s.startHour), endHour: Number(s.endHour),
    surcharge: Number(s.surcharge || 0),
    sortOrder: Number(s.sortOrder || 0), active: bool(s.active),
  }));
}

export async function createSlot(data) {
  const d = await conn();
  const id = newId();
  await d.run(
    `INSERT INTO delivery_slots (id, label, ${q("startHour")}, ${q("endHour")}, surcharge, ${q("sortOrder")}, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, String(data.label).slice(0, 80), Number(data.startHour) || 0, Number(data.endHour) || 0,
     Number(data.surcharge) || 0, Number(data.sortOrder) || 0, B(data.active !== false)]
  );
  return id;
}

export async function deleteSlot(id) {
  const d = await conn();
  await d.run(`DELETE FROM delivery_slots WHERE id = ?`, [id]);
}

/* ═══════════════ شركات الشحن ═══════════════ */

export async function listCarrierConfigs() {
  const d = await conn();
  const rows = await d.all(`SELECT * FROM carriers`);
  return Object.fromEntries(rows.map((r) => [r.code, {
    code: r.code, enabled: bool(r.enabled), mode: r.mode || "test",
    accountNumber: r.accountNumber || "", apiKey: r.apiKey || "",
    apiSecret: r.apiSecret || "", extraJson: r.extraJson || "",
  }]));
}

/**
 * نسخة آمنة للعرض في اللوحة.
 * ⚠️ إلزامية: تمرير المفاتيح الخام إلى مكوّن عميل يضعها في HTML
 * الصفحة، فتُقرأ من «عرض المصدر» ومن أي إضافة متصفّح.
 */
export function maskCarrierConfigs(configs) {
  const mask = (v) => (v ? `${"•".repeat(Math.max(0, Math.min(12, v.length - 4)))}${v.slice(-4)}` : "");
  return Object.fromEntries(Object.entries(configs).map(([k, c]) => [k, {
    code: c.code, enabled: c.enabled, mode: c.mode,
    accountNumber: mask(c.accountNumber),
    apiKey: mask(c.apiKey),
    apiSecret: mask(c.apiSecret),
    hasKey: !!c.apiKey, hasSecret: !!c.apiSecret, hasAccount: !!c.accountNumber,
  }]));
}

export async function saveCarrierConfig(code, data) {
  const d = await conn();
  const existing = (await d.all(`SELECT code FROM carriers WHERE code = ?`, [code]))[0];

  /**
   * الحقل الفارغ يعني «لا تغيّر» لا «امسح».
   * اللوحة تعرض المفاتيح مقنّعة؛ لو عاملنا الفراغ كمسح لضاع
   * المفتاح عند أول حفظ لتبديل الوضع من اختبار إلى مباشر.
   */
  const keep = (incoming, current) => (incoming === undefined || incoming === "" ? current : incoming);

  if (existing) {
    const cur = (await d.all(`SELECT * FROM carriers WHERE code = ?`, [code]))[0];
    await d.run(
      `UPDATE carriers SET enabled=?, mode=?, ${q("accountNumber")}=?, ${q("apiKey")}=?, ${q("apiSecret")}=?, ${q("extraJson")}=?, ${q("updatedAt")}=? WHERE code=?`,
      [B(data.enabled), data.mode === "live" ? "live" : "test",
       keep(data.accountNumber, cur.accountNumber), keep(data.apiKey, cur.apiKey),
       keep(data.apiSecret, cur.apiSecret), keep(data.extraJson, cur.extraJson),
       D(new Date()), code]
    );
    return;
  }

  await d.run(
    `INSERT INTO carriers (code, enabled, mode, ${q("accountNumber")}, ${q("apiKey")}, ${q("apiSecret")}, ${q("extraJson")})
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, B(data.enabled), data.mode === "live" ? "live" : "test",
     data.accountNumber || null, data.apiKey || null, data.apiSecret || null, data.extraJson || null]
  );
}

/* ═══════════════ الشحنات ═══════════════ */

export async function listShipments({ orderId, limit = 100 } = {}) {
  const d = await conn();
  const rows = orderId
    ? await d.all(`SELECT * FROM shipments WHERE ${q("orderId")} = ? ORDER BY ${q("createdAt")} DESC`, [orderId])
    : await d.all(`SELECT * FROM shipments ORDER BY ${q("createdAt")} DESC LIMIT ?`, [limit]);
  return rows;
}

export async function createShipmentRow({ orderId, carrier, awb, cost, notes }) {
  const d = await conn();
  const id = newId();
  const trackingUrl = buildTrackingUrl(carrier, awb);
  await d.run(
    `INSERT INTO shipments (id, ${q("orderId")}, carrier, awb, ${q("trackingUrl")}, cost, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, orderId, carrier, awb || null, trackingUrl, Number(cost) || 0, notes || null]
  );
  return id;
}

export async function updateShipmentStatus(id, status, awb) {
  const d = await conn();
  if (awb) {
    const row = (await d.all(`SELECT carrier FROM shipments WHERE id = ?`, [id]))[0];
    const url = buildTrackingUrl(row?.carrier, awb);
    await d.run(
      `UPDATE shipments SET status=?, awb=?, ${q("trackingUrl")}=?, ${q("updatedAt")}=? WHERE id=?`,
      [status, awb, url, D(new Date()), id]
    );
    return;
  }
  await d.run(`UPDATE shipments SET status=?, ${q("updatedAt")}=? WHERE id=?`, [status, D(new Date()), id]);
}

export async function deleteShipment(id) {
  const d = await conn();
  await d.run(`DELETE FROM shipments WHERE id = ?`, [id]);
}

/* ═══════════════ التسعير ═══════════════ */

/**
 * يختار المنطقة المطابقة للمدينة، أو الافتراضية.
 * الترتيب مهم: أول منطقة **مفعّلة** تحوي المدينة تفوز، ثم
 * الافتراضية. بلا افتراضية يُرجع null فيسقط النظام إلى سعر
 * `store.config.js` — النواة تبقى عاملة بلا إعداد.
 */
export async function matchZone(city) {
  const zones = (await listZones()).filter((z) => z.active);
  if (!zones.length) return null;
  const c = normalizeCity(city);
  if (c) {
    const hit = zones.find((z) => zoneCities(z).includes(c));
    if (hit) return hit;
  }
  return zones.find((z) => z.isDefault) || null;
}

/**
 * خيارات الشحن المتاحة لسلة ومدينة.
 *
 * @returns {{ zone, options: Array, slots: Array, fallback: boolean }}
 */
export async function quoteShipping({ city, subtotal = 0, now = new Date() }) {
  const zone = await matchZone(city);

  if (!zone) {
    // لا مناطق معرّفة — السلوك الأصلي للنواة
    const threshold = Number(STORE.freeShippingThreshold || 0);
    const base = Number(STORE.defaultShippingCost || 0);
    const free = threshold > 0 && subtotal >= threshold;
    return {
      zone: null, fallback: true, slots: [],
      options: [{
        id: "default", name: "التوصيل القياسي", price: free ? 0 : base,
        originalPrice: base, free, etaText: "", sameDay: false, carrier: "manual",
      }],
    };
  }

  const rates = (await listRates(zone.id)).filter((r) => r.active);
  const slots = (await listSlots()).filter((s) => s.active);
  const hour = now.getHours();

  const options = rates
    .filter((r) => subtotal >= r.minSubtotal)
    .map((r) => {
      // «نفس اليوم» يختفي بعد ساعة القطع بدل أن يَعِد بما لا يُنفَّذ
      const past = r.sameDay && r.cutoffHour != null && hour >= r.cutoffHour;
      if (past) return null;

      const free = r.freeOver != null && subtotal >= r.freeOver;
      return {
        id: r.id, name: r.name, description: r.description,
        price: free ? 0 : r.price, originalPrice: r.price, free,
        etaText: r.etaText, sameDay: r.sameDay, cutoffHour: r.cutoffHour,
        carrier: r.carrier,
        freeOverRemaining: !free && r.freeOver != null ? Math.max(0, Math.round(r.freeOver - subtotal)) : null,
      };
    })
    .filter(Boolean);

  /**
   * ⚠️ منطقة بلا خيارات = سلة لا يمكن إتمامها.
   *
   * ظهرت في الاختبار: مدينة طابقت منطقة أُنشئت ولم تُضف لها
   * أسعار بعد، فرجعت صفر خيارات — والعميل عالق بلا رسالة.
   * وقد يحدث أيضًا حين تكون كل أسعار المنطقة «نفس اليوم» وقد
   * انقضت ساعة القطع.
   *
   * السقوط إلى المنطقة الافتراضية أفضل من طريق مسدود: العميل
   * يدفع سعرًا أعلى قليلًا لكنه يُتمّ طلبه، والمشغّل يرى الخلل
   * في اللوحة لا في سلة مهجورة.
   */
  if (!options.length) {
    const fallbackZone = (await listZones()).find((z) => z.active && z.isDefault && z.id !== zone.id);
    if (fallbackZone) {
      const fbRates = (await listRates(fallbackZone.id)).filter(
        (r) => r.active && subtotal >= r.minSubtotal && !(r.sameDay && r.cutoffHour != null && hour >= r.cutoffHour)
      );
      if (fbRates.length) {
        return {
          zone: { id: fallbackZone.id, name: fallbackZone.name },
          usedFallbackZone: zone.name,
          slots,
          fallback: false,
          options: fbRates.map((r) => {
            const free = r.freeOver != null && subtotal >= r.freeOver;
            return {
              id: r.id, name: r.name, description: r.description,
              price: free ? 0 : r.price, originalPrice: r.price, free,
              etaText: r.etaText, sameDay: r.sameDay, carrier: r.carrier,
            };
          }),
        };
      }
    }

    // لا افتراضية صالحة أيضًا — نرجع لسعر التهيئة بدل ترك السلة معطّلة
    const base = Number(STORE.defaultShippingCost || 0);
    const threshold = Number(STORE.freeShippingThreshold || 0);
    const free = threshold > 0 && subtotal >= threshold;
    return {
      zone: { id: zone.id, name: zone.name },
      slots, fallback: true, noRatesConfigured: true,
      options: [{
        id: "default", name: "التوصيل القياسي", price: free ? 0 : base,
        originalPrice: base, free, etaText: "", sameDay: false, carrier: "manual",
      }],
    };
  }

  return { zone: { id: zone.id, name: zone.name }, options, slots, fallback: false };
}

/**
 * التحقّق من خيار اختاره العميل وإرجاع تكلفته المؤكَّدة.
 *
 * ⚠️ يُستدعى من الخادم عند إنشاء الطلب. لا نثق بأي تكلفة شحن
 * قادمة من المتصفح — نفس قاعدة الكوبونات (§١٥.٢).
 */
export async function resolveShipping({ city, subtotal, methodId, slotId, now = new Date() }) {
  const quote = await quoteShipping({ city, subtotal, now });
  const option =
    quote.options.find((o) => o.id === methodId) || quote.options[0] || null;

  const slot = slotId ? quote.slots.find((s) => s.id === slotId) : null;
  const surcharge = slot ? slot.surcharge : 0;

  return {
    zoneName: quote.zone?.name || "",
    method: option ? option.name : "التوصيل القياسي",
    methodId: option?.id || null,
    carrier: option?.carrier || "manual",
    cost: Math.round((option ? option.price : Number(STORE.defaultShippingCost || 0)) + surcharge),
    slotLabel: slot ? slot.label : "",
    slotId: slot?.id || null,
  };
}
