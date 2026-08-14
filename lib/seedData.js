/**
 * ═══════════════════════════════════════════════════════════
 *  بيانات البذر التجريبية
 * ═══════════════════════════════════════════════════════════
 *
 * بيانات وهمية محايدة لا تنتمي لأي مجال — غرضها الوحيد أن ترى
 * المتجر يعمل فور تثبيته: التصنيفات والشبكة والسلة والبحث والفلاتر
 * وصفحة العروض وصفحة المنتج.
 *
 * ⚠️ احذفها قبل إطلاق أي متجر حقيقي:
 *    DELETE FROM products;
 *    DELETE FROM categories;
 *    DELETE FROM banners;
 *
 * كل الصور فارغة عمدًا — المكوّن يعرض بديلًا رسوميًا تلقائيًا،
 * فلا تحتاج رفع ملفات لتجربة المتجر.
 */

export const CATEGORIES = [
  { slug: "category-one",   name: "التصنيف الأول",  icon: "Package",  color: "#0C1C77", tagline: "وصف مختصر للتصنيف الأول يظهر أعلى صفحته." },
  { slug: "category-two",   name: "التصنيف الثاني", icon: "Tag",      color: "#00C6C7", tagline: "وصف مختصر للتصنيف الثاني." },
  { slug: "category-three", name: "التصنيف الثالث", icon: "Sparkles", color: "#00B9D6", tagline: "وصف مختصر للتصنيف الثالث." },
  { slug: "accessories",    name: "الإكسسوارات",    icon: "Gauge",    color: "#0C1C77", tagline: "ملحقات وقطع تكميلية." },
];

/**
 * ١٢ منتجًا تجريبيًا تغطي كل حالات العرض:
 * خصم · شارة · نفاد · كمية محدودة · حجز مسبق · تقييم · ماركات متعددة.
 */
export const PRODUCTS = [
  { cat: "category-one", name: "منتج تجريبي ١ — الأساسي", price: 199, oldPrice: null, badge: null,
    img: null, freeShipping: true, freeInstall: false, brand: "ماركة أ", stock: "in_stock",
    desc: "وصف مختصر يظهر في بطاقة المنتج وفي نتائج البحث.",
    full: "الوصف الكامل يظهر في صفحة المنتج.\n\nالمواصفات:\nالخامة: نموذجية\nالأبعاد: 20 × 30 سم\nالوزن: 1.2 كجم\n\nكل سطر بصيغة «المفتاح: القيمة» يظهر تلقائيًا في جدول المواصفات." },

  { cat: "category-one", name: "منتج تجريبي ٢ — عليه خصم", price: 249, oldPrice: 349, badge: "عرض",
    img: null, freeShipping: true, freeInstall: false, brand: "ماركة أ", stock: "in_stock",
    desc: "منتج بسعر سابق أعلى — يظهر في صفحة العروض تلقائيًا.",
    full: "الخامة: ممتازة\nالضمان: سنة واحدة\nبلد المنشأ: نموذجي" },

  { cat: "category-one", name: "منتج تجريبي ٣ — الأكثر مبيعًا", price: 450, oldPrice: null, badge: "الأكثر مبيعًا",
    img: null, freeShipping: false, freeInstall: false, brand: "ماركة ب", stock: "in_stock",
    rating: 4.6, reviewCount: 23,
    desc: "منتج بشارة رواج وتقييم — النجوم تظهر في البطاقة.",
    full: "الخامة: فاخرة\nالضمان: سنتان" },

  { cat: "category-two", name: "منتج تجريبي ٤ — جديد", price: 320, oldPrice: null, badge: "جديد",
    img: null, freeShipping: true, freeInstall: false, brand: "ماركة ب", stock: "in_stock",
    desc: "منتج بشارة حالة — لا يدخل صفحة العروض.",
    full: "الخامة: قياسية\nالسعة: متوسطة" },

  { cat: "category-two", name: "منتج تجريبي ٥ — كمية محدودة", price: 180, oldPrice: 220, badge: "كمية محدودة",
    img: null, freeShipping: false, freeInstall: false, brand: "ماركة ج", stock: "low_stock",
    desc: "حالة التوفّر تظهر بلون تحذيري في البطاقة.",
    full: "الخامة: عملية\nالضمان: 6 أشهر" },

  { cat: "category-two", name: "منتج تجريبي ٦ — غير متوفر", price: 275, oldPrice: null, badge: null,
    img: null, freeShipping: false, freeInstall: false, brand: "ماركة ج", stock: "out_of_stock",
    desc: "أزرار الشراء تُعطَّل تلقائيًا، ويظهر زر «أشعرني عند التوفّر».",
    full: "الخامة: قياسية" },

  { cat: "category-three", name: "منتج تجريبي ٧ — حجز مسبق", price: 690, oldPrice: null, badge: "حصري",
    img: null, freeShipping: true, freeInstall: true, brand: "ماركة د", stock: "preorder",
    desc: "منتج بحالة حجز مسبق مع تركيب مجاني.",
    full: "الخامة: متقدمة\nالضمان: 3 سنوات\nالتركيب: مجاني" },

  { cat: "category-three", name: "منتج تجريبي ٨ — الأعلى سعرًا", price: 1850, oldPrice: 2400, badge: "تصفية",
    img: null, freeShipping: true, freeInstall: true, brand: "ماركة د", stock: "in_stock",
    rating: 4.9, reviewCount: 8,
    desc: "منتج عالي القيمة بخصم كبير — يتصدّر صفحة العروض.",
    full: "الخامة: احترافية\nالضمان: 5 سنوات\nالتركيب: مجاني\nالدعم: أولوية" },

  { cat: "category-three", name: "منتج تجريبي ٩ — بلا شارة", price: 540, oldPrice: null, badge: null,
    img: null, freeShipping: false, freeInstall: false, brand: "ماركة أ", stock: "in_stock",
    desc: "منتج عادي بلا شارة ولا خصم.",
    full: "الخامة: قياسية" },

  { cat: "accessories", name: "ملحق تجريبي ١", price: 45, oldPrice: null, badge: null,
    img: null, freeShipping: false, freeInstall: false, brand: null, stock: "in_stock",
    desc: "منتج منخفض السعر لاختبار حد الشحن المجاني.",
    full: "الخامة: بسيطة" },

  { cat: "accessories", name: "ملحق تجريبي ٢ — باقة", price: 120, oldPrice: 160, badge: "باقة موفّرة",
    img: null, freeShipping: false, freeInstall: false, brand: "ماركة ب", stock: "in_stock",
    desc: "باقة بخصم — تدخل صفحة العروض بالشارة والسعر معًا.",
    full: "المحتويات: 3 قطع\nالضمان: 6 أشهر" },

  { cat: "accessories", name: "ملحق تجريبي ٣ — بلا وصف كامل", price: 78, oldPrice: null, badge: null,
    img: null, freeShipping: false, freeInstall: false, brand: null, stock: "in_stock",
    desc: "منتج بلا وصف كامل — تبويب المواصفات يُخفى تلقائيًا.",
    full: "" },
];

/** بنرات تجريبية بلا صور — تظهر بتدرّج لوني بديل. */
export const BANNERS = [
  { placement: "home",  title: "بنر تجريبي للصفحة الرئيسية", subtitle: "يظهر بتدرّج لوني حين لا توجد صورة.", linkCategorySlug: "category-one", sortOrder: 1, active: true, ratio: "auto" },
  { placement: "offers", title: "بنر صفحة العروض", subtitle: "استبدله ببنر العميل من لوحة التحكم.", sortOrder: 1, active: true, ratio: "auto" },
];
