import { themeColors } from "../config/theme.config.js";
import { STORE } from "../config/store.config.js";

// ============================================================
// نظام التصميم الموحّد
// كل الألوان والقياسات والمحتوى المشترك يُشتق من هنا.
// ============================================================

const T = themeColors();

/**
 * لوحة الألوان — مشتقّة من الثيم النشط في config/theme.config.js.
 * الأسماء ثابتة عمدًا: 38 مكوّنًا يستوردون `C`، فتغيير الأسماء
 * كان سيتطلب تعديلها كلها. المصدر تغيّر، لا الواجهة.
 */
export const C = {
  navy: T.primary,
  navyDeep: T.primaryDeep,
  teal: T.accent,
  cyan: T.accentAlt,
  mint: T.soft,
  mintTint: T.softTint,

  pearl: T.surface,
  offWhite: T.surfaceAlt,
  sand: T.surfaceMuted,

  ink: T.ink,
  slate: T.muted,
  slateLight: T.mutedLight,

  line: T.line,
  lineSoft: T.lineSoft,

  danger: T.danger,
  success: T.success,
  warning: T.warning,
  gold: T.gold,
  oldPrice: T.danger,
};

// تدرجات جاهزة
export const G = {
  brand: `linear-gradient(135deg, ${C.navy}, ${C.teal})`,
  deep: `linear-gradient(120deg, ${C.navy}, ${C.navyDeep})`,
  soft: `linear-gradient(160deg, ${C.mintTint}, ${C.pearl})`,
  aqua: `linear-gradient(135deg, ${C.teal}, ${C.cyan})`,
};

// ظلال متدرجة
export const SH = {
  sm: "0 2px 8px -4px rgba(12,28,119,0.14)",
  md: "0 10px 24px -14px rgba(12,28,119,0.22)",
  lg: "0 22px 44px -22px rgba(12,28,119,0.30)",
  glow: `0 0 0 4px ${C.teal}22`,
};

// ============================================================
// التسعير والواتساب
// ============================================================

export const formatPrice = (n) => Number(n).toLocaleString(STORE.locale);

/**
 * منتج بسعر صفر = يُسعَّر حسب المواصفات (محطات، أنظمة مخصصة).
 * عرضه كـ"0 ر.س" يوحي بأنه مجاني، ويرفضه Merchant Center أيضًا.
 */
export const isQuoteProduct = (p) => !p?.price || Number(p.price) <= 0;

export const discountPercent = (price, oldPrice) =>
  oldPrice && oldPrice > price ? Math.round(100 - (price / oldPrice) * 100) : 0;

export const WHATSAPP_NUMBER = STORE.whatsapp;

/** يعطي رقم واتساب من الإعدادات إن وُجد، وإلا الرقم الافتراضي. */
export const whatsappNumber = (settings) =>
  (settings?.whatsapp_number || "").replace(/\D/g, "") || WHATSAPP_NUMBER;

export const buildWhatsAppLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// رسالة "اشتر الآن" لمنتج واحد — تنقل مباشرة لواتساب
export const buyNowLink = (product) =>
  buildWhatsAppLink(
    `السلام عليكم، أرغب في طلب:\n\n• ${product.name}\n• السعر: ${formatPrice(product.price)} ر.س\n\nأرجو تزويدي بالتفاصيل.`
  );

// ============================================================
// عناصر الثقة — تُستخدم في كل صفحات الموقع
// ملاحظة: العناصر الرقمية (عدد العملاء / متوسط التقييم) معطّلة
// حتى تُعتمد أرقام حقيقية، تفاديًا لادعاءات غير موثّقة.
// ============================================================

export { TRUST_ITEMS, FEATURES as FEATURE_ITEMS } from "../config/content.config.js";


