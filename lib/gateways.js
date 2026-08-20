/**
 * ═══════════════════════════════════════════════════════════
 *  سجلّ بوابات الدفع — السوق السعودي
 * ═══════════════════════════════════════════════════════════
 *
 *  نفس مبدأ الشحن: النظام يعمل قبل المفاتيح وبعدها.
 *
 *  طريقتان تعملان **اليوم بلا أي بوابة**:
 *    • الدفع عند الاستلام
 *    • التحويل البنكي
 *
 *  والبوابات المسجّلة تعمل فور إضافة مفاتيحها من اللوحة.
 *
 *  ── قاعدة أمنية تحكم الملف كله ──
 *  **لا نصدّق العميل حين يقول «دفعت».** تأكيد الدفع يأتي حصرًا
 *  من webhook موقّع أو من استدعاء تحقّق خادم-لخادم. المتصفح
 *  يُعاد توجيهه بعد الدفع، لكن إعادة التوجيه ليست إثباتًا —
 *  يمكن استدعاء رابط النجاح يدويًا.
 */

import crypto from "node:crypto";

export const GATEWAYS = {
  cod: {
    code: "cod",
    name: "الدفع عند الاستلام",
    hint: "يعمل فورًا بلا ربط. الطلب يُسجَّل «غير مدفوع» ويُحصَّل عند التسليم.",
    needsKeys: false,
    instant: false,          // لا تحويل لصفحة دفع
    fields: [],
    methods: ["cash"],
  },

  bank_transfer: {
    code: "bank_transfer",
    name: "تحويل بنكي",
    hint: "يعمل فورًا. يعرض بيانات الحساب ويطلب إرسال الإيصال على واتساب.",
    needsKeys: false,
    instant: false,
    fields: ["iban", "bankName", "accountName"],
    methods: ["transfer"],
  },

  moyasar: {
    code: "moyasar",
    name: "ميسر (Moyasar)",
    hint: "سعودية. مدى وApple Pay وفيزا/ماستركارد. الأسهل إعدادًا.",
    needsKeys: true,
    instant: true,
    fields: ["publishableKey", "secretKey", "webhookSecret"],
    methods: ["mada", "creditcard", "applepay", "stcpay"],
    docs: "https://moyasar.com/docs",
    signature: "token",      // ترويسة توكن مشترك
  },

  tap: {
    code: "tap",
    name: "تاب (Tap Payments)",
    hint: "خليجية. مدى وKNET وبنفتسبي وApple Pay.",
    needsKeys: true,
    instant: true,
    fields: ["publishableKey", "secretKey", "webhookSecret"],
    methods: ["mada", "creditcard", "applepay", "benefit", "knet"],
    docs: "https://developers.tap.company",
    signature: "hmac",
  },

  hyperpay: {
    code: "hyperpay",
    name: "هايبر باي (HyperPay)",
    hint: "الأكثر استخدامًا لدى المتاجر الكبيرة. تحتاج عقدًا بنكيًا.",
    needsKeys: true,
    instant: true,
    fields: ["publishableKey", "secretKey", "webhookSecret"],
    methods: ["mada", "creditcard", "applepay"],
    docs: "https://wordpresshyperpay.docs.oppwa.com",
    signature: "hmac",
  },

  paytabs: {
    code: "paytabs",
    name: "بايتابس (PayTabs)",
    hint: "تدعم مدى وApple Pay والتقسيط.",
    needsKeys: true,
    instant: true,
    fields: ["publishableKey", "secretKey", "webhookSecret"],
    methods: ["mada", "creditcard", "applepay"],
    docs: "https://support.paytabs.com/en/support/solutions",
    signature: "hmac",
  },

  tabby: {
    code: "tabby",
    name: "تابي (Tabby) — تقسيط",
    hint: "قسّم على ٤ دفعات بلا فوائد. يرفع متوسط قيمة الطلب في الهدايا.",
    needsKeys: true,
    instant: true,
    fields: ["publishableKey", "secretKey", "webhookSecret"],
    methods: ["installments"],
    docs: "https://docs.tabby.ai",
    signature: "hmac",
  },

  tamara: {
    code: "tamara",
    name: "تمارا (Tamara) — تقسيط",
    hint: "ادفع لاحقًا أو قسّط. منافس تابي في السعودية.",
    needsKeys: true,
    instant: true,
    fields: ["publishableKey", "secretKey", "webhookSecret"],
    methods: ["installments"],
    docs: "https://docs.tamara.co",
    signature: "hmac",
  },

  stcpay: {
    code: "stcpay",
    name: "STC Pay",
    hint: "محفظة رقمية واسعة الانتشار. تُدعم غالبًا عبر ميسر أو تاب.",
    needsKeys: true,
    instant: true,
    fields: ["publishableKey", "secretKey", "webhookSecret"],
    methods: ["stcpay"],
    docs: "https://stcpay.com.sa",
    signature: "hmac",
  },
};

export const GATEWAY_LIST = Object.values(GATEWAYS);

export const getGateway = (code) => GATEWAYS[code] || null;

/** تسميات طرق الدفع للعرض. */
export const METHOD_LABELS = {
  cash: "نقدًا عند الاستلام",
  transfer: "تحويل بنكي",
  mada: "مدى",
  creditcard: "فيزا / ماستركارد",
  applepay: "Apple Pay",
  stcpay: "STC Pay",
  installments: "تقسيط",
  benefit: "بنفت",
  knet: "كي نت",
};

/* ═══════════════ التحقّق من توقيع الـwebhook ═══════════════ */

/**
 * ⚠️ هذه أهم دالة في نظام الدفع كله.
 *
 * مسار الـwebhook عام بالضرورة — البوابة تستدعيه من خوادمها.
 * بلا تحقّق من التوقيع يستطيع **أي شخص** إرسال طلب يقول
 * «الطلب رقم كذا مدفوع»، فتُشحن البضاعة بلا مقابل.
 *
 * `timingSafeEqual` لا `===`: المقارنة العادية تتوقّف عند أول
 * اختلاف، وفرق التوقيت يسمح باستنتاج التوقيع الصحيح بايتًا بايت.
 */
export function verifyWebhookSignature({ gateway, rawBody, headers, secret }) {
  const def = getGateway(gateway);
  if (!def) return { ok: false, reason: "gateway_unknown" };

  // البوابات بلا مفاتيح لا تملك webhook أصلًا
  if (!def.needsKeys) return { ok: false, reason: "no_webhook" };

  if (!secret) return { ok: false, reason: "no_secret" };

  const provided =
    headers.get("x-signature") ||
    headers.get("x-webhook-signature") ||
    headers.get("signature") ||
    headers.get("x-event-token") ||
    "";

  if (!provided) return { ok: false, reason: "missing_signature" };

  try {
    if (def.signature === "token") {
      // توكن مشترك يُقارَن كما هو (ميسر)
      const a = Buffer.from(provided);
      const b = Buffer.from(secret);
      if (a.length !== b.length) return { ok: false, reason: "bad_signature" };
      return crypto.timingSafeEqual(a, b)
        ? { ok: true }
        : { ok: false, reason: "bad_signature" };
    }

    // HMAC-SHA256 على الجسم الخام
    const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    const a = Buffer.from(provided.replace(/^sha256=/, "").trim());
    const b = Buffer.from(expected);
    if (a.length !== b.length) return { ok: false, reason: "bad_signature" };
    return crypto.timingSafeEqual(a, b)
      ? { ok: true }
      : { ok: false, reason: "bad_signature" };
  } catch {
    return { ok: false, reason: "verify_error" };
  }
}

/**
 * استخراج موحّد لبيانات الحدث.
 *
 * كل بوابة تسمّي حقولها مختلفًا. التوحيد هنا يعني أن معالج
 * الـwebhook واحد لكل البوابات، وإضافة بوابة لا تغيّره.
 *
 * ⚠️ الحالات المدعومة: paid · failed · refunded · pending
 */
export function normalizeEvent(gateway, body) {
  const b = body || {};

  const pick = (...keys) => {
    for (const k of keys) {
      const v = k.split(".").reduce((o, part) => (o == null ? o : o[part]), b);
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
  };

  const rawStatus = String(
    pick("status", "data.status", "payment.status", "event_type", "type") || ""
  ).toLowerCase();

  let status = "pending";
  if (/paid|captured|authorized|succe|approved|completed/.test(rawStatus)) status = "paid";
  else if (/fail|declin|error|reject/.test(rawStatus)) status = "failed";
  else if (/refund/.test(rawStatus)) status = "refunded";
  else if (/cancel|void|expire/.test(rawStatus)) status = "cancelled";

  return {
    eventId: String(pick("id", "event_id", "data.id", "payment.id") || crypto.randomUUID()),
    providerRef: String(pick("id", "data.id", "payment.id", "transaction_id", "tran_ref") || ""),
    orderRef: String(pick("metadata.orderId", "data.metadata.orderId", "order_id", "cart_id", "reference.order") || ""),
    amount: Number(pick("amount", "data.amount", "cart_amount", "total_amount") || 0),
    status,
    type: rawStatus || "unknown",
  };
}

/**
 * إنشاء عملية دفع لدى البوابة.
 *
 * ⚠️ لا استدعاءات API حقيقية هنا — نفس قرار الشحن (§٢٢.٢):
 * تكامل بلا حساب اختبار يُنتج كودًا يبدو صحيحًا ويفشل عند أول
 * عملية حقيقية، وفي الدفع الفشل يعني خسارة طلب ومال.
 * الواجهة موحّدة والتنفيذ يُكتب لكل بوابة عند توفّر بيانات اختبارها.
 */
export async function createCharge(code, config, payload) {
  const def = getGateway(code);
  if (!def) return { ok: false, reason: "gateway_unknown", message: "بوابة غير معروفة." };

  if (!def.needsKeys) {
    // الدفع عند الاستلام والتحويل: لا تحويل، الطلب يُسجَّل معلّقًا
    return { ok: true, offline: true, status: "pending", redirectUrl: null };
  }

  if (!config?.enabled) {
    return { ok: false, reason: "not_configured", message: `${def.name}: فعّل البوابة وأضف مفاتيحها من لوحة التحكم.` };
  }
  const missing = (def.fields || []).filter((f) => f !== "webhookSecret" && !config[f]);
  if (missing.length) {
    return { ok: false, reason: "not_configured", message: `${def.name}: مفاتيح ناقصة.` };
  }

  return {
    ok: false,
    reason: "not_implemented",
    message: `${def.name}: الربط الآلي غير مفعّل بعد — أضف تنفيذ الاستدعاء في lib/gateways.js`,
  };
}
