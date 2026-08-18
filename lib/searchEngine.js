/**
 * ═══════════════════════════════════════════════════════════
 *  محرّك البحث الداخلي
 * ═══════════════════════════════════════════════════════════
 *
 *  دوال خالصة بلا قاعدة بيانات — تعمل على الخادم والمتصفح معًا،
 *  فنفس الترتيب يظهر في البحث الفوري وفي صفحة النتائج.
 *
 *  ── لماذا لا نكتفي بـ includes() ──
 *  البحث السابق كان `hay.includes(q)`. على العربية هذا يفشل في
 *  أربع حالات شائعة، وكلها تُنتج «لا نتائج» لمنتج موجود فعلًا:
 *
 *    ١) الهمزات:   «احمر» لا تجد «أحمر»
 *    ٢) التاء:      «هديه» لا تجد «هدية»
 *    ٣) المصطلح:   «بوكيه» لا تجد «باقة»
 *    ٤) الترتيب:   «ورد احمر» لا تجد «أحمر … ورد»
 *
 *  المحرّك هنا يعالج الأربعة: تطبيع، مرادفات، تفكيك إلى كلمات،
 *  ومطابقة تقريبية للأخطاء المطبعية.
 */

import {
  SYNONYMS as DEFAULT_SYNONYMS,
  STOPWORDS as DEFAULT_STOPWORDS,
  WEIGHTS as DEFAULT_WEIGHTS,
  MIN_COVERAGE,
  MAX_RESULTS,
} from "../config/search.config.js";

/* ═══════════════ التطبيع ═══════════════ */

const TASHKEEL = /[\u064B-\u0652\u0670\u0640]/g;      // حركات + تطويل
const AR_DIGITS = /[\u0660-\u0669]/g;                  // أرقام عربية-هندية
const PUNCT = /[^\p{L}\p{N}\s]/gu;

/**
 * يُرجع صورة موحّدة للنص تُقارَن عليها كل المطابقات.
 * ⚠️ لا تُعرض هذه الصورة للمستخدم — هي للمقارنة فقط.
 */
export function normalizeArabic(input) {
  return String(input || "")
    .toLowerCase()
    .replace(TASHKEEL, "")
    .replace(AR_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")     // «هدية» و«هديه» تصيران واحدة
    .replace(/گ/g, "ك")
    .replace(/پ/g, "ب")
    .replace(PUNCT, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ═══════════════ المرادفات ═══════════════ */

/** يبني خريطة كلمة ← مجموعة مكافئاتها، بصورة مطبَّعة. */
export function buildSynonymMap(groups = DEFAULT_SYNONYMS) {
  const map = new Map();
  for (const group of groups) {
    const norm = group.map(normalizeArabic).filter(Boolean);
    for (const word of norm) {
      const set = map.get(word) || new Set();
      norm.forEach((w) => set.add(w));
      map.set(word, set);
    }
  }
  return map;
}


/* ═══════════════ السوابق الملتصقة ═══════════════ */

/**
 * أدوات التعريف والجرّ تلتصق بالكلمة في العربية: «للتخرج»
 * و«بالورد» و«والهدية». بلا معالجتها يفشل البحث الطبيعي تمامًا —
 * «زهور للتخرج» كانت تُرجع صفر نتائج رغم وجود تنسيق تخرّج.
 *
 * ⚠️ نقتصر على السوابق **متعدّدة الأحرف** ولا نجرّد حرفًا واحدًا.
 * تجريد الحرف الواحد يكسر كلمات مشروعة: «بوكيه» تصير «وكيه»،
 * و«وسط» تصير «سط». الضرر أكبر من النفع.
 *
 * والتجريد يُضاف كصورة **إضافية** لا بديلة — الأصل يبقى مرشَّحًا
 * للمطابقة، فلا نخسر شيئًا إن كان التجريد خاطئًا.
 */
const CLITIC_PREFIXES = ["وبال", "فبال", "وكال", "ولل", "بال", "كال", "فال", "وال", "لل", "ال"];

export function stemVariants(token) {
  const out = new Set([token]);
  for (const pre of CLITIC_PREFIXES) {
    if (token.startsWith(pre)) {
      const rest = token.slice(pre.length);
      if (rest.length >= 3) out.add(rest);
      break;   // أطول سابقة مطابقة تكفي
    }
  }
  return [...out];
}

/* ═══════════════ التفكيك ═══════════════ */

export function tokenize(text, stopwords = DEFAULT_STOPWORDS) {
  const stop = new Set(stopwords.map(normalizeArabic));
  return normalizeArabic(text)
    .split(" ")
    .filter((t) => t.length > 1 && !stop.has(t));
}

/**
 * يوسّع كلمات الاستعلام بمرادفاتها.
 * @returns {Array<{ token: string, variants: string[] }>}
 */
export function expandQuery(query, { synonymMap, stopwords } = {}) {
  const map = synonymMap || buildSynonymMap();
  return tokenize(query, stopwords).map((token) => {
    const variants = new Set();
    // الأصل وصوره المجرّدة، ومرادفات كل منها
    for (const form of stemVariants(token)) {
      variants.add(form);
      for (const syn of map.get(form) || []) variants.add(syn);
    }
    return { token, variants: [...variants] };
  });
}

/* ═══════════════ المطابقة التقريبية ═══════════════ */

/**
 * مسافة ليفنشتاين محدودة — تتوقّف مبكرًا عند تجاوز الحد.
 * التوقّف المبكر مهم: نقارن كل كلمة استعلام بكل كلمة في كل
 * منتج، والحساب الكامل يصبح مكلفًا مع كتالوج كبير.
 */
function editDistanceWithin(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;   // لا أمل في تحسّن الصف التالي
    prev = cur;
  }
  return prev[b.length];
}

/**
 * حد التسامح يتناسب مع طول الكلمة.
 * كلمة من ٣ أحرف بخطأ حرف واحد تصبح كلمة أخرى تمامًا، فلا
 * تسامح معها. الكلمات الطويلة تحتمل خطأً أو خطأين.
 */
function fuzzyTolerance(len) {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2;
}

/* ═══════════════ التسجيل ═══════════════ */

function fieldScore(fieldTokens, fieldText, variants, weight, weights) {
  let best = 0;

  for (const v of variants) {
    if (!v) continue;

    // مطابقة تامة لكلمة كاملة
    if (fieldTokens.has(v)) { best = Math.max(best, weight); continue; }

    // بادئة: «تولي» تجد «توليب» — مهم للبحث أثناء الكتابة
    let prefixHit = false;
    for (const ft of fieldTokens) {
      if (ft.length > v.length && ft.startsWith(v)) { prefixHit = true; break; }
    }
    if (prefixHit) { best = Math.max(best, weight * 0.8); continue; }

    // احتواء داخل النص (كلمات مركّبة)
    if (fieldText.includes(v)) { best = Math.max(best, weight * 0.6); continue; }

    // تقريبية
    const tol = fuzzyTolerance(v.length);
    if (tol > 0) {
      for (const ft of fieldTokens) {
        if (editDistanceWithin(v, ft, tol) <= tol) {
          best = Math.max(best, weight * weights.fuzzyFactor);
          break;
        }
      }
    }
  }
  return best;
}

/** يجهّز منتجًا للبحث مرة واحدة بدل إعادة التطبيع في كل استعلام. */
export function indexProduct(p, stopwords = DEFAULT_STOPWORDS) {
  const name = normalizeArabic(p.name);
  const brand = normalizeArabic(p.brand);
  const category = normalizeArabic(p.categoryName);
  const description = normalizeArabic(p.description);
  const full = normalizeArabic(p.fullDescription);
  const badge = normalizeArabic(p.badge);

  // الفهرس يحمل الأصل وصوره المجرّدة — «التخرج» في نص المنتج
  // يجب أن تُطابق «تخرج» في الاستعلام والعكس.
  const T = (s) => {
    const set = new Set();
    for (const t of tokenize(s, stopwords)) stemVariants(t).forEach((v) => set.add(v));
    return set;
  };

  return {
    product: p,
    name, brand, category, description, full, badge,
    nameT: T(name), brandT: T(brand), categoryT: T(category),
    descT: T(description), fullT: T(full), badgeT: T(badge),
  };
}

export function buildIndex(products = [], stopwords = DEFAULT_STOPWORDS) {
  return products.map((p) => indexProduct(p, stopwords));
}

/**
 * البحث.
 *
 * @param {string} query
 * @param {Array}  index      من buildIndex — أو مصفوفة منتجات خام
 * @param {object} opts       { synonyms, stopwords, weights, pins, limit }
 * @returns {Array<{ product, score, matched }>}
 */
export function searchProducts(query, index = [], opts = {}) {
  const q = String(query || "").trim();
  if (!q) return [];

  const weights = { ...DEFAULT_WEIGHTS, ...(opts.weights || {}) };
  const stopwords = opts.stopwords || DEFAULT_STOPWORDS;
  const synonymMap = opts.synonymMap || buildSynonymMap(opts.synonyms || DEFAULT_SYNONYMS);
  const pins = opts.pins || {};
  const limit = opts.limit || MAX_RESULTS;

  // يقبل منتجات خام أو فهرسًا جاهزًا
  const idx = index.length && index[0]?.product ? index : buildIndex(index, stopwords);

  const terms = expandQuery(q, { synonymMap, stopwords });
  if (!terms.length) return [];

  const phrase = normalizeArabic(q);
  const pinned = new Set(pins[phrase] || []);

  const out = [];

  for (const item of idx) {
    let score = 0;
    let matchedCount = 0;
    const matched = [];

    for (const { token, variants } of terms) {
      const s = Math.max(
        fieldScore(item.nameT, item.name, variants, weights.name, weights),
        fieldScore(item.brandT, item.brand, variants, weights.brand, weights),
        fieldScore(item.categoryT, item.category, variants, weights.category, weights),
        fieldScore(item.descT, item.description, variants, weights.description, weights),
        fieldScore(item.fullT, item.full, variants, weights.fullDescription, weights),
        fieldScore(item.badgeT, item.badge, variants, weights.badge, weights)
      );
      if (s > 0) { score += s; matchedCount++; matched.push(token); }
    }

    /**
     * شرط التغطية: يجب مطابقة نسبة من كلمات الاستعلام.
     * بدونه يُرجع «ورد احمر كبير» كل منتج فيه «ورد» — أي
     * الكتالوج كله — فيفقد البحث معناه.
     */
    if (matchedCount / terms.length < MIN_COVERAGE) continue;

    // الجملة كاملة داخل الاسم: أقوى إشارة ممكنة
    if (phrase.length > 2 && item.name.includes(phrase)) score += weights.exactPhraseName;
    if (item.name.startsWith(terms[0].token)) score += weights.nameStart;

    const p = item.product;
    if (p.stock !== "out_of_stock") score += weights.inStock;
    if (p.oldPrice && p.oldPrice > p.price) score += weights.discount;
    if (p.badge && /الأكثر مبيعًا|اختيار العملاء/.test(p.badge)) score += weights.bestSeller;

    // النافد يُعرض لكنه ينزل — إخفاؤه يجعل العميل يظن أنك لا تبيعه
    if (p.stock === "out_of_stock") score *= 0.55;

    if (pinned.has(p.id)) score += 10000;   // التثبيت اليدوي يعلو كل شيء

    out.push({ product: p, score: Math.round(score), matched });
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

/**
 * اقتراحات أثناء الكتابة: تصنيفات وأنواع زهور وأسماء منتجات.
 * منفصلة عن النتائج لأن نيّة «أكمل لي الكلمة» غير نيّة «أرني المنتجات».
 */
export function suggestTerms(query, { products = [], categories = [], popular = [], limit = 6 } = {}) {
  const q = normalizeArabic(query);
  if (q.length < 1) return [];

  const pool = [
    ...popular.map((p) => ({ label: p.query || p, type: "popular" })),
    ...categories.map((c) => ({ label: c.name, type: "category", href: `/category/${c.slug}` })),
    ...[...new Set(products.map((p) => p.brand).filter(Boolean))].map((b) => ({ label: b, type: "brand" })),
  ];

  const seen = new Set();
  return pool
    .filter((s) => {
      const n = normalizeArabic(s.label);
      if (!n.includes(q) && !n.startsWith(q)) return false;
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    })
    .slice(0, limit);
}

/** يبرز مواضع المطابقة في نص للعرض. يُرجع أجزاءً لا HTML. */
export function highlightParts(text, matched = []) {
  if (!matched.length) return [{ text, hit: false }];
  const norm = normalizeArabic(text);
  const positions = [];

  for (const m of matched) {
    let i = norm.indexOf(m);
    while (i !== -1) { positions.push([i, i + m.length]); i = norm.indexOf(m, i + m.length); }
  }
  if (!positions.length) return [{ text, hit: false }];

  positions.sort((a, b) => a[0] - b[0]);
  const parts = [];
  let cursor = 0;
  for (const [s, e] of positions) {
    if (s < cursor) continue;
    if (s > cursor) parts.push({ text: text.slice(cursor, s), hit: false });
    parts.push({ text: text.slice(s, e), hit: true });
    cursor = e;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts;
}
