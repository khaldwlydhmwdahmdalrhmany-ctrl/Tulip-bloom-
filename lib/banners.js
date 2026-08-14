/**
 * مواضع البنرات ونسب العرض — مصدر واحد يستخدمه الموقع ولوحة التحكم معًا.
 */

export const BANNER_PLACEMENTS = [
  { key: "home",        label: "الصفحة الرئيسية",   note: "كاروسيل الهيرو الرئيسي" },
  { key: "category",    label: "صفحة تصنيف",         note: "يتطلب اختيار التصنيف" },
  { key: "shop",        label: "صفحة كل المنتجات",   note: "ترويسة /shop" },
  { key: "offers",      label: "صفحة العروض",        note: "ترويسة /offers" },
  { key: "maintenance", label: "باقات الصيانة",      note: "ترويسة /maintenance" },
  { key: "urgent",      label: "الصيانة العاجلة",    note: "ترويسة /maintenance/urgent" },
  { key: "contact",     label: "تواصل معنا",         note: "ترويسة /contact" },
  { key: "faq",         label: "الأسئلة الشائعة",    note: "ترويسة /faq" },
  { key: "about",       label: "نبذة عن الشركة",     note: "ترويسة /about" },
  { key: "technician",  label: "طلب فني صيانة",      note: "ترويسة /maintenance/technician" },
];

/**
 * نسب العرض المتاحة.
 * "auto" يعرض الصورة بأبعادها الطبيعية كاملة بلا قص — الخيار الافتراضي
 * لأنه يحترم التصميم الذي رفعه المستخدم بدل فرض قصّ عليه.
 * باقي الخيارات تفرض نسبة ثابتة وتقصّ الفائض (object-cover).
 */
export const BANNER_RATIOS = [
  { key: "auto",   label: "تلقائي — الحجم الطبيعي للصورة", css: null,       note: "بلا قص، يُنصح به" },
  { key: "wide",   label: "عريض جدًا 21:9",                 css: "21 / 9",   note: "شريط ممتد" },
  { key: "hero",   label: "هيرو 16:9",                      css: "16 / 9",   note: "مثل الصفحة الرئيسية" },
  { key: "banner", label: "بنر 2:1",                        css: "2 / 1",    note: "متوازن" },
  { key: "wide35", label: "بنر عريض 3.5:1",                 css: "3.5 / 1",  note: "ترويسة نحيفة" },
  { key: "square", label: "مربع 1:1",                       css: "1 / 1",    note: "للجوال" },
];

export const getRatioCss = (key) =>
  BANNER_RATIOS.find((r) => r.key === key)?.css ?? null;

export const placementLabel = (key) =>
  BANNER_PLACEMENTS.find((p) => p.key === key)?.label || key;

/** يختار أول بنر نشط مناسب لموضع معيّن. */
export function pickBanner(banners, { categoryId } = {}) {
  if (!banners?.length) return null;
  const active = banners
    .filter((b) => b.active)
    .filter((b) => (categoryId ? b.categoryId === categoryId : true))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return active[0] || null;
}
