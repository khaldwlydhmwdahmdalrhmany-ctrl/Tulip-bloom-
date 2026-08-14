/**
 * إسناد مصدر الزيارة (Attribution) — يُنفَّذ في المتصفح.
 *
 * الفكرة: Google Analytics يخبرك بعدد الزيارات، لكنه لا يربط الطلب في
 * قاعدة بياناتك بمصدره. هذا الملف يحلّ ذلك: يحدّد المصدر عند الوصول،
 * يحفظه 30 يومًا، ثم يُرفق مع الطلب — فتعرف أي قناة تجلب مبيعات فعلية
 * لا مجرد زيارات.
 *
 * لا نجمع IP ولا بصمة جهاز ولا أي بيانات تعريف شخصية.
 */

const STORE_KEY = "areej_attr";
const SESSION_KEY = "areej_sid";
const TTL_DAYS = 30;

/** معرّفات النقر التي تضعها المنصات الإعلانية — دليل قاطع على زيارة مدفوعة. */
const CLICK_IDS = {
  gclid:   { source: "google",    medium: "cpc" },
  gbraid:  { source: "google",    medium: "cpc" },
  wbraid:  { source: "google",    medium: "cpc" },
  msclkid: { source: "microsoft", medium: "cpc" },
  fbclid:  { source: "meta",      medium: "paid_social" },
  ttclid:  { source: "tiktok",    medium: "paid_social" },
  sccid:   { source: "snapchat",  medium: "paid_social" },
  ScCid:   { source: "snapchat",  medium: "paid_social" },
  twclid:  { source: "x",         medium: "paid_social" },
  li_fat_id: { source: "linkedin", medium: "paid_social" },
};

/** خريطة نطاقات الإحالة → مصدر ووسيط. */
const REFERRERS = [
  { match: /(^|\.)google\./,            source: "google",    medium: "organic" },
  { match: /(^|\.)bing\.com/,           source: "microsoft", medium: "organic" },
  { match: /(^|\.)yahoo\./,             source: "yahoo",     medium: "organic" },
  { match: /(^|\.)duckduckgo\.com/,     source: "duckduckgo",medium: "organic" },
  { match: /(^|\.)instagram\.com/,      source: "instagram", medium: "social" },
  { match: /(^|\.)facebook\.com|(^|\.)fb\./, source: "meta", medium: "social" },
  { match: /(^|\.)tiktok\.com/,         source: "tiktok",    medium: "social" },
  { match: /(^|\.)snapchat\.com/,       source: "snapchat",  medium: "social" },
  { match: /(^|\.)x\.com|(^|\.)twitter\.com/, source: "x",   medium: "social" },
  { match: /(^|\.)youtube\.com/,        source: "youtube",   medium: "social" },
  { match: /(^|\.)linkedin\.com/,       source: "linkedin",  medium: "social" },
  { match: /(^|\.)wa\.me|(^|\.)whatsapp\.com/, source: "whatsapp", medium: "referral" },
  { match: /(^|\.)t\.co/,               source: "x",         medium: "social" },
];

/** تسميات عربية للعرض في لوحة التحكم. */
export const SOURCE_LABELS = {
  google: "جوجل", microsoft: "مايكروسوفت / بينغ", meta: "ميتا (فيسبوك وإنستغرام)",
  instagram: "إنستغرام", tiktok: "تيك توك", snapchat: "سناب شات", x: "منصة X",
  youtube: "يوتيوب", linkedin: "لينكدإن", whatsapp: "واتساب", yahoo: "ياهو",
  duckduckgo: "DuckDuckGo", direct: "زيارة مباشرة", other: "مصادر أخرى",
};

export const MEDIUM_LABELS = {
  cpc: "بحث مدفوع", organic: "بحث مجاني", paid_social: "سوشيال مدفوع",
  social: "سوشيال مجاني", referral: "إحالة", email: "بريد", none: "مباشر", other: "أخرى",
};

/** هل الوسيط مدفوع؟ يفصل الميزانية عن المجاني في التقارير. */
export const isPaid = (medium) => medium === "cpc" || medium === "paid_social" || medium === "display";

export function labelSource(s) { return SOURCE_LABELS[s] || s || "غير معروف"; }
export function labelMedium(m) { return MEDIUM_LABELS[m] || m || "غير معروف"; }

/** يحدّد مصدر الزيارة الحالية من الرابط والإحالة. */
export function detectAttribution() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const get = (k) => params.get(k) || params.get(k.toLowerCase());

  // ١ — وسوم UTM لها الأولوية المطلقة: وضعها المسوّق بنفسه
  const utmSource = get("utm_source");
  if (utmSource) {
    return {
      source: utmSource.toLowerCase(),
      medium: (get("utm_medium") || "other").toLowerCase(),
      campaign: get("utm_campaign") || null,
    };
  }

  // ٢ — معرّف نقر إعلاني
  for (const [key, val] of Object.entries(CLICK_IDS)) {
    if (params.has(key)) {
      return { ...val, campaign: get("utm_campaign") || null };
    }
  }

  // ٣ — نطاق الإحالة
  const ref = document.referrer;
  if (ref) {
    try {
      const host = new URL(ref).hostname;
      if (host && !host.includes(window.location.hostname)) {
        const hit = REFERRERS.find((r) => r.match.test(host));
        return hit
          ? { source: hit.source, medium: hit.medium, campaign: null }
          : { source: host.replace(/^www\./, ""), medium: "referral", campaign: null };
      }
    } catch {}
  }

  // ٤ — زيارة مباشرة
  return { source: "direct", medium: "none", campaign: null };
}

/**
 * يحفظ المصدر ويعيده.
 * قاعدة الإسناد: آخر مصدر غير مباشر يفوز (last non-direct click).
 * زيارة مباشرة لاحقة لا تمحو حملة جلبت العميل أصلًا — وإلا نسبنا
 * كل المبيعات إلى "مباشر" وأخفينا القناة التي تستحق الميزانية.
 */
export function resolveAttribution() {
  if (typeof window === "undefined") return null;

  const fresh = detectAttribution();
  let stored = null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const age = (Date.now() - parsed.ts) / 86400000;
      if (age < TTL_DAYS) stored = parsed;
    }
  } catch {}

  const isDirect = fresh.source === "direct";
  const result = isDirect && stored ? stored : { ...fresh, ts: Date.now(), landingPath: window.location.pathname };

  try { localStorage.setItem(STORE_KEY, JSON.stringify(result)); } catch {}
  return result;
}

/** معرّف جلسة عشوائي — لا يعرّف بالشخص، فقط لتمييز الزيارات المكررة. */
export function sessionId() {
  if (typeof window === "undefined") return null;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function isNewVisitor() {
  if (typeof window === "undefined") return true;
  try {
    const seen = localStorage.getItem("areej_seen");
    if (!seen) { localStorage.setItem("areej_seen", "1"); return true; }
    return false;
  } catch { return true; }
}
