/**
 * ═══════════════════════════════════════════════════════════
 *  بنية أقسام الصفحات — توليب بلوم
 * ═══════════════════════════════════════════════════════════
 *
 * ترتيب الأقسام وإعداداتها يُدار من هنا — لا من ملف الصفحة.
 * `type` يجب أن يطابق مفتاحًا في components/sections/registry.jsx
 *
 * ⚠️ `columns` يُبنى كصنف Tailwind ديناميكي بلا `safelist`.
 *    القيم الآمنة: 4 · 5 · 6 فقط.
 *
 * ── منطق الترتيب ──
 * هيرو تحريري (لا شريط بنرات) ← عدّاد التوصيل مباشرة تحته
 * لأن الاستعجال يعمل وقت وصول الانتباه لا بعد التمرير ←
 * المناسبة قبل النوع (الزائر يفكّر «تخرّج» لا «باقات») ←
 * لوك بوك غير متناظر ← التصنيفات ← مرشّح الهدايا في منتصف
 * الصفحة حيث يبلغ التردّد ذروته ← المقاسات ← العروض ←
 * خطوات الطلب ← دليل العناية (يطمئن قبل الشراء لا بعده) ←
 * لماذا نحن ← الثقة ← الأسئلة ← الدعوة.
 */

export const HOME_SECTIONS = [
  { type: "editorialHero", enabled: true, props: {} },

  { type: "deliveryCountdown", enabled: true, props: { cutoffHour: 18 } },

  {
    type: "occasions",
    enabled: true,
    props: {
      eyebrow: "تسوّق حسب المناسبة",
      title: "ما هي المناسبة؟",
      desc: "اختر المناسبة ونرشّح لك ثلاثة خيارات على واتساب خلال دقائق.",
    },
  },

  {
    type: "lookbook",
    enabled: true,
    props: {
      source: "bestSellers",
      eyebrow: "الأكثر طلبًا",
      title: "تشكيلة مختارة",
      desc: "ما يطلبه عملاؤنا أكثر من غيره.",
      href: "/shop",
      hrefLabel: "كل التشكيلة",
      limit: 5,
      background: "alt",
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
    type: "giftFinder",
    enabled: true,
    props: {
      eyebrow: "مساعد الاختيار",
      title: "ثلاثة أسئلة ونرشّح لك",
      desc: "أغلب من يغادر متجر ورد يغادر لأنه لم يعرف ماذا يختار — لا لأن السعر مرتفع.",
      background: "tint",
    },
  },

  { type: "sizeGuide", enabled: true, props: {} },

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
      background: "alt",
    },
  },

  {
    type: "orderSteps",
    enabled: true,
    props: {
      eyebrow: "رحلة الطلب",
      title: "كيف تصل هديتك",
      desc: "أربع خطوات من الاختيار حتى تأكيد التسليم.",
    },
  },

  {
    type: "careGuide",
    enabled: true,
    props: {
      eyebrow: "بعد التسليم",
      title: "كيف يبقى الورد أطول",
      desc: "أربع عادات تضيف يومين إلى ثلاثة لعمر أي باقة.",
      background: "alt",
    },
  },

  { type: "whyUs", enabled: true, props: {} },
  { type: "trust", enabled: true, props: {} },

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
    },
  },

  { type: "cta", enabled: true, props: {} },
];

/** أقسام صفحة التصنيف. */
export const CATEGORY_SECTIONS = [
  { type: "pageHero", enabled: true, props: {} },
  { type: "trust", enabled: true, props: {} },
  { type: "productBrowser", enabled: true, props: {} },
  { type: "cta", enabled: true, props: {} },
];

/** أقسام صفحة المتجر. */
export const SHOP_SECTIONS = [
  { type: "pageHero", enabled: true, props: {} },
  { type: "trust", enabled: true, props: {} },
  { type: "productBrowser", enabled: true, props: {} },
  { type: "sizeGuide", enabled: true, props: { background: "alt" } },
  { type: "cta", enabled: true, props: {} },
];
