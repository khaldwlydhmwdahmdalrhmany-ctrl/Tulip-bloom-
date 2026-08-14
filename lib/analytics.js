/**
 * إعدادات المنصات التحليلية والإعلانية.
 *
 * الفلسفة: Google Tag Manager هو نقطة الدخول الوحيدة. أي بكسل جديد
 * (ميتا، تيك توك، سناب، X) يُثبَّت من داخل حاوية GTM بلا لمس الكود.
 * حقول GA4 وClarity وUET موجودة كبديل لمن يفضّل التثبيت المباشر،
 * لكن الأنظف تركها فارغة وإدارتها كلها من GTM.
 */

export const ANALYTICS_SETTINGS = [
  {
    key: "gtm_id",
    label: "معرّف Google Tag Manager",
    placeholder: "GTM-XXXXXXX",
    pattern: /^GTM-[A-Z0-9]{4,}$/i,
    note: "الأهم — ثبّت منه كل البكسلات لاحقًا بلا تعديل الكود.",
    primary: true,
  },
  {
    key: "ga4_id",
    label: "معرّف Google Analytics 4",
    placeholder: "G-XXXXXXXXXX",
    pattern: /^G-[A-Z0-9]{6,}$/i,
    note: "اتركه فارغًا إن كنت ستربط GA4 من داخل GTM (الأفضل).",
  },
  {
    key: "gads_id",
    label: "معرّف Google Ads",
    placeholder: "AW-XXXXXXXXX",
    pattern: /^AW-\d{6,}$/i,
    note: "لتتبّع التحويلات الإعلانية مباشرة.",
  },
  {
    key: "clarity_id",
    label: "معرّف Microsoft Clarity",
    placeholder: "abcdefghij",
    note: "خرائط حرارية وتسجيل جلسات — مجاني بالكامل.",
  },
  {
    key: "uet_id",
    label: "معرّف Microsoft Ads (UET)",
    placeholder: "123456789",
    pattern: /^\d{6,}$/,
    note: "بكسل إعلانات بينغ ومايكروسوفت.",
  },
  {
    key: "gsc_verification",
    label: "توثيق Google Search Console",
    placeholder: "محتوى وسم google-site-verification",
    note: "الصق قيمة content فقط، لا الوسم كاملًا.",
  },
  {
    key: "bing_verification",
    label: "توثيق Bing Webmaster",
    placeholder: "محتوى وسم msvalidate.01",
  },
];

export const ANALYTICS_KEYS = ANALYTICS_SETTINGS.map((a) => a.key);

/** يتحقق من صيغة المعرّف قبل حقنه في الصفحة. */
export function validateAnalyticsId(key, value) {
  if (!value) return null;
  const def = ANALYTICS_SETTINGS.find((a) => a.key === key);
  if (def?.pattern && !def.pattern.test(value.trim())) {
    return `صيغة ${def.label} غير صحيحة — المتوقع مثل ${def.placeholder}`;
  }
  return null;
}

/**
 * أحداث التجارة الإلكترونية القياسية (GA4 Ecommerce).
 * تُدفَع إلى dataLayer فتلتقطها كل البكسلات المثبّتة في GTM دفعة واحدة —
 * تكتب الحدث مرة، ويستفيد منه ميتا وتيك توك وسناب وجوجل معًا.
 */
export function pushEvent(name, payload = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...payload });
}

const toItem = (p, qty = 1) => ({
  item_id: p.id,
  item_name: p.name,
  item_brand: p.brand || undefined,
  item_category: p.category?.name || undefined,
  price: Number(p.price),
  quantity: qty,
});

export const trackViewItem = (p) =>
  pushEvent("view_item", { currency: "SAR", value: Number(p.price), items: [toItem(p)] });

export const trackAddToCart = (p, qty = 1) =>
  pushEvent("add_to_cart", { currency: "SAR", value: Number(p.price) * qty, items: [toItem(p, qty)] });

export const trackBeginCheckout = (details, total) =>
  pushEvent("begin_checkout", {
    currency: "SAR",
    value: Number(total),
    items: details.map((d) => toItem(d.product, d.qty)),
  });

/**
 * الشراء. `channel` يفرّق بين مسار السلة والشراء المباشر —
 * مسارَان بسلوك مختلف تمامًا يستحقان قياسًا منفصلًا.
 */
export const trackPurchase = (orderNumber, details, total, attribution, channel = "cart") =>
  pushEvent("purchase", {
    purchase_channel: channel,
    transaction_id: orderNumber,
    currency: "SAR",
    value: Number(total),
    items: details.map((d) => toItem(d.product, d.qty)),
    traffic_source: attribution?.source,
    traffic_medium: attribution?.medium,
  });

/**
 * القيمة التقديرية لكل نوع طلب — بالريال.
 *
 * لماذا نضع قيمًا مختلفة؟ لأن Google Ads و Meta يُحسّنان بناءً على القيمة.
 * إرسال 0 لكل الطلبات يجعل الخوارزمية تعامل نموذج تواصل عابر كطلب فني
 * عاجل، فتهدر الميزانية على الأرخص.
 *
 * طريقة الحساب: متوسط الإيراد من هذا النوع × نسبة تحوّله إلى بيع فعلي.
 * عايرها بعد شهر من البيانات الحقيقية.
 */
export const LEAD_VALUES = {
  urgent_maintenance: 220,   // زيارة عاجلة — نسبة إتمام عالية جدًا
  technician_request: 180,   // صيانة/تركيب مجدول
  installation_request: 260, // طلب تركيب — يسبقه شراء غالبًا
  quote_request: 400,        // عرض سعر (شركات) — قيمة أعلى، إتمام أقل
  contact_form: 40,          // استفسار عام — نية منخفضة
};

/** فئة الطلب — تُستخدم لبناء الجماهير والتقارير. */
export const LEAD_CATEGORIES = {
  urgent_maintenance: "service",
  technician_request: "service",
  installation_request: "service",
  quote_request: "sales",
  contact_form: "general",
};

/**
 * اسم الحدث المنفصل لكل نوع طلب.
 *
 * لماذا حدثان لكل طلب؟ لأن Google Ads يستورد التحويلات **حسب اسم الحدث**
 * ولا يستطيع الاستيراد حسب قيمة معامل داخلي. فلو اكتفينا بـ generate_lead
 * لعجزنا عن فصل حملة طلب الفني عن حملة الصيانة العاجلة في Google Ads.
 *
 * الحل: حدث موحّد للتقارير + حدث باسمه للاستيراد كتحويل مستقل.
 */
export const LEAD_EVENT_NAMES = {
  urgent_maintenance: "lead_urgent",
  technician_request: "lead_technician",
  installation_request: "lead_installation",
  quote_request: "lead_quote",
  contact_form: "lead_contact",
};

export const trackLead = (type, ref, extra = {}) => {
  // مصدر الزيارة يُرفق مع الطلب — بدونه لا يمكن معرفة القناة
  // التي جلبت الطلب، ويظهر البُعد (not set) في التقارير.
  let attr = null;
  try {
    const raw = localStorage.getItem("areej_attr");
    if (raw) attr = JSON.parse(raw);
  } catch {}

  const payload = {
    lead_type: type,
    lead_category: LEAD_CATEGORIES[type] || "general",
    transaction_id: ref,
    currency: "SAR",
    value: LEAD_VALUES[type] ?? 50,
    traffic_source: attr?.source || "direct",
    traffic_medium: attr?.medium || "none",
    ...extra,
  };

  // ١) الحدث الموحّد — لتقارير GA4 والجماهير والمقارنة بين الأنواع
  pushEvent("generate_lead", payload);

  // ٢) حدث باسم النوع — ليُستورد في Google Ads كتحويل مستقل بميزانيته الخاصة
  const named = LEAD_EVENT_NAMES[type];
  if (named) pushEvent(named, payload);
};


/* ============================================================
   إشارات إضافية للتحسين وبناء الجماهير
   ============================================================ */

/**
 * عرض قائمة منتجات — يُميّز صفحة التصنيف عن صفحة المتجر عن العروض.
 * يفتح تقرير "أي تصنيف يُتصفَّح أكثر" ويبني جماهير حسب الاهتمام.
 */
export const trackViewItemList = (products, listName, listId) =>
  pushEvent("view_item_list", {
    item_list_id: listId,
    item_list_name: listName,
    items: products.slice(0, 20).map((p, i) => ({
      item_id: p.id,
      item_name: p.name,
      item_brand: p.brand || undefined,
      item_category: p.category?.name || undefined,
      price: Number(p.price),
      index: i + 1,
    })),
  });

/** استخدام البحث الداخلي — أثمن إشارة نية في المتجر. */
export const trackSearch = (term, resultsCount) =>
  pushEvent("search", { search_term: term, results_count: resultsCount });

/** بحث بلا نتائج — طلب موجود لا تلبّيه. مؤشر تجاري مباشر. */
export const trackSearchNoResults = (term) =>
  pushEvent("search_no_results", { search_term: term });

/** استخدام الفلاتر — يكشف ما يهتم به الزائر (سعر، ماركة، توفّر). */
export const trackFilterUse = (filterType, filterValue) =>
  pushEvent("filter_products", { filter_type: filterType, filter_value: String(filterValue) });

/** عرض السلة — مرحلة وسيطة بين الإضافة والدفع. */
export const trackViewCart = (details, total) =>
  pushEvent("view_cart", {
    currency: "SAR",
    value: Number(total),
    items: details.map((d) => ({
      item_id: d.product.id,
      item_name: d.product.name,
      price: Number(d.product.price),
      quantity: d.qty,
    })),
  });

/** إزالة من السلة — إشارة تردد قوية. */
export const trackRemoveFromCart = (product, qty = 1) =>
  pushEvent("remove_from_cart", {
    currency: "SAR",
    value: Number(product.price) * qty,
    items: [{ item_id: product.id, item_name: product.name, price: Number(product.price), quantity: qty }],
  });
