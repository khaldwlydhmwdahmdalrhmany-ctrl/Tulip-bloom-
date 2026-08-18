/**
 * مفاتيح الإعدادات العامة — مصدر واحد يستخدمه الموقع ولوحة التحكم.
 * الروابط الفارغة لا تُعرض إطلاقًا: أيقونة تواصل تقود إلى لا شيء
 * أسوأ من غيابها.
 */

export const SOCIAL_LINKS = [
  { key: "social_whatsapp", label: "واتساب",   icon: "MessageCircle", color: "#25D366", placeholder: "https://wa.me/9665xxxxxxxx" },
  { key: "social_instagram", label: "إنستغرام", icon: "Instagram",     color: "#E4405F", placeholder: "https://instagram.com/username" },
  { key: "social_x",         label: "منصة X",   icon: "Twitter",       color: "#000000", placeholder: "https://x.com/username" },
  { key: "social_tiktok",    label: "تيك توك",  icon: "Music2",        color: "#010101", placeholder: "https://tiktok.com/@username" },
  { key: "social_snapchat",  label: "سناب شات", icon: "Ghost",         color: "#FFFC00", placeholder: "https://snapchat.com/add/username" },
  { key: "social_youtube",   label: "يوتيوب",   icon: "Youtube",       color: "#FF0000", placeholder: "https://youtube.com/@channel" },
  { key: "social_linkedin",  label: "لينكدإن",  icon: "Linkedin",      color: "#0A66C2", placeholder: "https://linkedin.com/company/name" },
  { key: "social_facebook",  label: "فيسبوك",   icon: "Facebook",      color: "#1877F2", placeholder: "https://facebook.com/page" },
];

/** هوية المتجر — الشعار والاسم والوصف. */
export const IDENTITY_SETTINGS = [
  { key: "store_logo",    label: "شعار المتجر", type: "image",
    note: "يظهر في الترويسة والتذييل. يُفضّل PNG بخلفية شفافة، أو SVG. تُضغط الصورة تلقائيًا." },
  { key: "store_favicon", label: "أيقونة المتصفح (Favicon)", type: "image",
    note: "مربّعة 512×512. تظهر في تبويب المتصفح وعند حفظ الموقع على الشاشة الرئيسية." },
  { key: "store_og_image", label: "صورة المشاركة الافتراضية", type: "image",
    note: "1200×630. تظهر عند مشاركة رابط الموقع على واتساب وتويتر. للمنتجات تُستخدم صورة المنتج تلقائيًا." },
  { key: "store_name",    label: "اسم المتجر", placeholder: "اسم متجرك",
    note: "يظهر في الترويسة وعنوان المتصفح والبيانات المنظّمة." },
  { key: "store_short_name", label: "الاسم المختصر", placeholder: "متجرك" },
  { key: "store_tagline", label: "الوصف تحت الاسم", placeholder: "وصف قصير" },
  { key: "store_description", label: "وصف المتجر (للسيو)", type: "textarea",
    placeholder: "وصف قصير للمتجر يظهر في نتائج البحث…",
    note: "يظهر في نتائج البحث تحت اسم الموقع. اجعله بين 120 و155 حرفًا." },
];

/** إعدادات المتجر العامة — نصوص وأرقام كانت مكتوبة في الكود. */
export const STORE_SETTINGS = [
  { key: "whatsapp_number", label: "رقم واتساب للطلبات", placeholder: "966500000000",
    note: "بصيغة دولية بلا + وبلا مسافات. تعتمد عليه كل أزرار الطلب في الموقع." },
  { key: "store_ticker", label: "الشريط المتحرك أعلى الموقع", placeholder: "شحن مجاني فوق 500 ريال ✦ ضمان معتمد",
    note: "افصل بين العبارات بالرمز ✦ — اتركه فارغًا لإخفاء الشريط." },
  { key: "free_shipping_threshold", label: "حد الشحن المجاني (ريال)", placeholder: "500",
    note: "يظهر في الشريط والسلة. اتركه فارغًا إن لم يكن لديك حد." },
  { key: "announcement", label: "إعلان مؤقت (اختياري)", placeholder: "مثال: إجازة العيد من ٥ إلى ٩ — الطلبات تُستقبل ويُشحن بعدها",
    note: "يظهر شريطًا بارزًا في كل الصفحات. اتركه فارغًا لإخفائه." },
];

export const CONTACT_SETTINGS = [
  { key: "contact_phone",   label: "رقم الهاتف",        placeholder: "+966 53 254 0595" },
  { key: "contact_email",   label: "البريد الإلكتروني",  placeholder: "info@example.com" },
  { key: "contact_address", label: "العنوان",            placeholder: "الرياض، المملكة العربية السعودية" },
  { key: "contact_hours",   label: "أوقات العمل",        placeholder: "السبت – الخميس، 9 ص – 9 م" },
  { key: "map_query", label: "موقع الخريطة",
    placeholder: "24.7136, 46.6753",
    note: "الأدق: الإحداثيات (خط العرض، خط الطول). يقبل أيضًا اسم الحي أو رابط خرائط جوجل — لكن الرابط المختصر يظهر كزر لا كخريطة مضمّنة." },
];

import { ANALYTICS_KEYS } from "./analytics.js";

/** مفاتيح تهيئة البحث — تُحرَّر من /admin/search لا من /admin/settings */
export const SEARCH_KEYS = ["search_synonyms", "search_stopwords", "search_weights", "search_pins"];

export const ALL_SETTING_KEYS = [
  ...SEARCH_KEYS,
  ...SOCIAL_LINKS.map((s) => s.key),
  ...CONTACT_SETTINGS.map((s) => s.key),
  ...STORE_SETTINGS.map((s) => s.key),
  ...IDENTITY_SETTINGS.map((s) => s.key),
  ...ANALYTICS_KEYS,
];

/** يعيد فقط الروابط المعبّأة فعلًا. */
export function activeSocials(settings = {}) {
  return SOCIAL_LINKS
    .map((s) => ({ ...s, href: (settings[s.key] || "").trim() }))
    .filter((s) => s.href.length > 0);
}
