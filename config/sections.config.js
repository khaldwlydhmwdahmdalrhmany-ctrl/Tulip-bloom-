/**
 * ═══════════════════════════════════════════════════════════
 *  بنية أقسام الصفحات — توليب بلوم
 * ═══════════════════════════════════════════════════════════
 *
 * ترتيب الأقسام وإعداداتها يُدار من هنا — لا من ملف الصفحة.
 * غيّر الترتيب، أو أطفئ قسمًا بـ `enabled: false`، أو كرّر قسمًا
 * بإعدادات مختلفة — بلا لمس أي مكوّن.
 *
 * `type` يجب أن يطابق مفتاحًا في components/sections/registry.jsx
 *
 * ⚠️ `columns` يُبنى كصنف Tailwind ديناميكي (`lg:grid-cols-${cols}`)
 *    والمشروع بلا `safelist`. القيم الآمنة الوحيدة هي التي تظهر
 *    حرفيًا في مكوّنات أخرى: 4 · 5 · 6. لا تستخدم غيرها.
 *
 * منطق ترتيب الرئيسية:
 *   الهيرو ← المميزات ← «ما هي المناسبة؟» (نية الشراء أولًا)
 *   ← التصنيفات ← الأكثر مبيعًا ← دليل المقاسات (يزيل التردد
 *   قبل العروض) ← العروض ← خطوات الطلب ← لماذا نحن ← الثقة
 *   ← الأسئلة ← الدعوة.
 */

export const HOME_SECTIONS = [
  {
    type: "hero",
    enabled: true,
    props: { placement: "home" },
  },
  {
    type: "features",
    enabled: true,
    props: {},
  },
  {
    // ⭐ قسم مضاف — الزائر يفكّر بالمناسبة قبل أن يفكّر بنوع الورد
    type: "occasions",
    enabled: true,
    props: {
      eyebrow: "تسوّق حسب المناسبة",
      title: "ما هي المناسبة؟",
      desc: "اختر المناسبة ونرشّح لك ثلاثة خيارات على واتساب خلال دقائق.",
    },
  },
  {
    type: "categories",
    enabled: true,
    props: {
      eyebrow: "تسوّق حسب النوع",
      title: "تصفّح أقسامنا",
      desc: "من باقة صغيرة إلى تنسيق مناسبة كاملة.",
      href: "/shop",
      columns: 4,
    },
  },
  {
    type: "productGrid",
    enabled: true,
    props: {
      source: "bestSellers",
      eyebrow: "الأكثر طلبًا",
      title: "تشكيلة مختارة",
      desc: "ما يطلبه عملاؤنا أكثر من غيره.",
      href: "/shop",
      hrefLabel: "كل التشكيلة",
      limit: 8,
    },
  },
  {
    // ⭐ قسم مضاف — بديل حقل `sizes`: يزيل تردّد «أي مقاس أطلب؟»
    type: "sizeGuide",
    enabled: true,
    props: { background: "alt" },
  },
  {
    type: "productGrid",
    enabled: true,
    props: {
      source: "offers",
      eyebrow: "وفّر أكثر",
      title: "العروض الحالية",
      desc: "خصومات فعلية لفترة محدودة.",
      href: "/offers",
      hrefLabel: "كل العروض",
      limit: 4,
      background: "tint",
    },
  },
  {
    // ⭐ قسم مضاف — بديل HowItWorks الذي يحمل نصًّا ثابتًا لمجال آخر
    type: "orderSteps",
    enabled: true,
    props: {
      eyebrow: "رحلة الطلب",
      title: "كيف تصل هديتك",
      desc: "أربع خطوات من الاختيار حتى تأكيد التسليم.",
    },
  },
  {
    type: "banner",
    enabled: false,
    props: { placement: "home", index: 1 },
  },
  {
    type: "whyUs",
    enabled: true,
    props: {},
  },
  {
    type: "trust",
    enabled: true,
    props: {},
  },
  {
    type: "testimonials",
    enabled: true,           // يختفي تلقائيًا — TESTIMONIALS فارغة عمدًا
    props: { eyebrow: "آراء عملائنا", title: "ثقة نبنيها كل يوم" },
  },
  {
    type: "faq",
    enabled: true,
    props: {
      eyebrow: "الأسئلة الشائعة",
      title: "أسئلة تصلنا كل يوم",
      desc: "لم تجد إجابتك؟ راسلنا على واتساب.",
      href: "/faq",
      background: "alt",
    },
  },
  {
    type: "cta",
    enabled: true,
    props: {},
  },
];

/** أقسام صفحة التصنيف — أبسط. */
export const CATEGORY_SECTIONS = [
  { type: "pageHero", enabled: true, props: {} },
  { type: "trust", enabled: true, props: {} },
  { type: "productBrowser", enabled: true, props: {} },
  { type: "cta", enabled: true, props: {} },
];

/** أقسام صفحة المتجر — دليل المقاسات يظهر بعد التصفّح لا قبله. */
export const SHOP_SECTIONS = [
  { type: "pageHero", enabled: true, props: {} },
  { type: "trust", enabled: true, props: {} },
  { type: "productBrowser", enabled: true, props: {} },
  { type: "sizeGuide", enabled: true, props: { background: "alt" } },
  { type: "cta", enabled: true, props: {} },
];
