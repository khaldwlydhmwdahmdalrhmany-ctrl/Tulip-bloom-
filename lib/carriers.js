/**
 * ═══════════════════════════════════════════════════════════
 *  سجلّ شركات الشحن — السوق السعودي
 * ═══════════════════════════════════════════════════════════
 *
 *  ── المبدأ: النظام يعمل قبل المفاتيح وبعدها ──
 *
 *  ربط API مع شركة شحن يحتاج عقدًا ورقم حساب ومفاتيح، وقد يستغرق
 *  أسابيع. لو جعلنا النظام يتوقّف على ذلك لبقي معطّلًا شهرًا.
 *
 *  لذلك لكل شركة **مستويان**:
 *
 *   ١) يدوي — يعمل اليوم بلا أي مفتاح: تُنشئ الشحنة في موقع
 *      الشركة، تلصق رقم البوليصة (AWB) في اللوحة، فيُولَّد رابط
 *      التتبّع تلقائيًا ويصل العميل. هذا يغطّي أغلب المتاجر
 *      الصغيرة فعليًا.
 *
 *   ٢) آلي — عند إضافة المفاتيح: إنشاء الشحنة وطباعة البوليصة
 *      وجلب الحالة برمجيًا.
 *
 *  المستوى الأول مبنيّ بالكامل. الثاني له واجهة موحّدة
 *  (`createShipment` / `track`) تُرجع `notConfigured` حتى تُضاف
 *  المفاتيح، ثم يُكتب التنفيذ لكل شركة على حدة.
 *
 *  ⚠️ روابط التتبّع قد تتغيّر من الشركات دون إشعار — راجعها
 *     عند أول استخدام فعلي.
 */

/**
 * الشركات المدعومة.
 *
 * `trackingUrl` دالة تبني رابط تتبّع من رقم البوليصة — هذه هي
 * القيمة العملية الفورية: العميل يتتبّع شحنته بلا أي تكامل.
 */
export const CARRIERS = {
  manual: {
    code: "manual",
    name: "توصيل ذاتي / مندوب المتجر",
    hint: "مناسب للتوصيل داخل الرياض بمندوبك — لا يحتاج أي ربط.",
    needsCredentials: false,
    fields: [],
    trackingUrl: () => null,
  },

  smsa: {
    code: "smsa",
    name: "سمسا إكسبرس (SMSA)",
    hint: "الأوسع انتشارًا داخل السعودية.",
    needsCredentials: true,
    fields: ["accountNumber", "apiKey"],
    trackingUrl: (awb) => `https://smsaexpress.com/track?tracknumbers=${encodeURIComponent(awb)}`,
    docs: "https://smsaexpress.com",
  },

  aramex: {
    code: "aramex",
    name: "أرامكس (Aramex)",
    hint: "قوي في الشحن الدولي والخليجي.",
    needsCredentials: true,
    fields: ["accountNumber", "apiKey", "apiSecret"],
    trackingUrl: (awb) => `https://www.aramex.com/sa/en/track/results?ShipmentNumber=${encodeURIComponent(awb)}`,
    docs: "https://www.aramex.com/developers",
  },

  naqel: {
    code: "naqel",
    name: "ناقل إكسبرس (Naqel)",
    hint: "تغطية جيدة للمدن الصغيرة.",
    needsCredentials: true,
    fields: ["accountNumber", "apiKey"],
    trackingUrl: (awb) => `https://www.naqelexpress.com/track/?awb=${encodeURIComponent(awb)}`,
    docs: "https://www.naqelexpress.com",
  },

  splonline: {
    code: "splonline",
    name: "البريد السعودي (سبل)",
    hint: "الأرخص للطرود غير المستعجلة.",
    needsCredentials: true,
    fields: ["accountNumber", "apiKey"],
    trackingUrl: (awb) => `https://splonline.com.sa/en/track-shipment/?trackingNumber=${encodeURIComponent(awb)}`,
    docs: "https://splonline.com.sa",
  },

  imile: {
    code: "imile",
    name: "آي مايل (iMile)",
    hint: "سريعة داخل المدن الكبرى.",
    needsCredentials: true,
    fields: ["accountNumber", "apiKey"],
    trackingUrl: (awb) => `https://www.imile.com/tracking?number=${encodeURIComponent(awb)}`,
    docs: "https://www.imile.com",
  },

  torod: {
    code: "torod",
    name: "طرود (Torod) — مجمّع شحن",
    hint: "يربطك بعدة شركات بمفتاح واحد — الأنسب لمن لا يريد عقودًا متعدّدة.",
    needsCredentials: true,
    fields: ["apiKey"],
    trackingUrl: (awb) => `https://track.torod.co/${encodeURIComponent(awb)}`,
    docs: "https://torod.co",
  },
};

export const CARRIER_LIST = Object.values(CARRIERS);

export function getCarrier(code) {
  return CARRIERS[code] || CARRIERS.manual;
}

/** رابط التتبّع — يعمل بلا أي مفتاح. */
export function buildTrackingUrl(code, awb) {
  if (!awb) return null;
  try { return getCarrier(code).trackingUrl(String(awb).trim()) || null; }
  catch { return null; }
}

/* ═══════════════ الواجهة الآلية ═══════════════ */

/**
 * حالات النتيجة الموحّدة لكل الشركات:
 *   { ok: true,  awb, trackingUrl, labelUrl }
 *   { ok: false, reason: "not_configured" | "not_implemented" | "error", message }
 *
 * توحيد الشكل يعني أن الواجهة الأمامية لا تتغيّر عند إضافة شركة.
 */
export function notConfigured(name) {
  return {
    ok: false,
    reason: "not_configured",
    message: `${name}: أضف بيانات الربط من لوحة التحكم أولًا.`,
  };
}

export function notImplemented(name) {
  return {
    ok: false,
    reason: "not_implemented",
    message: `${name}: الربط الآلي غير مفعّل بعد — استخدم الإدخال اليدوي لرقم البوليصة.`,
  };
}

/**
 * إنشاء شحنة.
 *
 * ⚠️ لا نستدعي أي API خارجي هنا اليوم.
 * كتابة تكامل بلا حساب اختبار حقيقي تُنتج كودًا يبدو صحيحًا
 * ويفشل عند أول استخدام — وهو أسوأ من كود غائب لأنه يُخفي
 * المشكلة حتى لحظة الشحن. الواجهة جاهزة؛ التنفيذ يُكتب لكل
 * شركة عند توفّر بيانات اختبارها.
 */
export async function createShipment(code, config, payload) {
  const carrier = getCarrier(code);

  if (code === "manual") {
    // التوصيل الذاتي لا يحتاج بوليصة — الشحنة تُنشأ محليًا
    return { ok: true, awb: null, trackingUrl: null, labelUrl: null, manual: true };
  }

  if (!config?.enabled) return notConfigured(carrier.name);

  const missing = (carrier.fields || []).filter((f) => !config[f]);
  if (missing.length) return notConfigured(carrier.name);

  return notImplemented(carrier.name);
}

export async function trackShipment(code, config, awb) {
  const carrier = getCarrier(code);
  const url = buildTrackingUrl(code, awb);

  // التتبّع بالرابط يعمل دائمًا — حتى بلا مفاتيح
  if (!config?.enabled) return { ok: true, url, status: null, viaLink: true };

  return { ok: true, url, status: null, viaLink: true };
}
