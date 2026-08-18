/**
 * ═══════════════════════════════════════════════════════════
 *  محرّك الاقتراحات
 * ═══════════════════════════════════════════════════════════
 *
 *  ── المبدأ الحاكم: كل اقتراح يحمل سببه ──
 *
 *  اقتراح بلا سبب يُقرأ كإعلان فيُتجاهل. اقتراح مصحوب بـ«لأن
 *  ميلاد الوالدة بعد ٥ أيام» يُقرأ كخدمة. لذلك تُعيد كل توصية
 *  حقل `reason` نصيًّا، ولا نُظهر أي منتج لا نستطيع تبرير ظهوره.
 *
 *  ── الإشارات المستعملة ──
 *  ١) تذكيرات المناسبات القادمة  — أقوى إشارة: نيّة بتاريخ محدّد
 *  ٢) تصنيفات المفضّلة            — تفضيل صريح أعلن عنه العميل
 *  ٣) تصنيفات الطلبات السابقة     — تفضيل مثبت بالدفع
 *  ٤) الخصم النشط                 — دافع لا سبب، فيرفع الترتيب
 *                                    ولا يُنشئ توصية وحده
 *
 *  ── لماذا لا «تعلّم آلي» ──
 *  متجر بعشرات المنتجات وعشرات العملاء لا يملك بيانات كافية
 *  لأي نموذج. القواعد الصريحة هنا أدقّ، وقابلة للشرح، وقابلة
 *  للتصحيح حين تُنتج نتيجة غريبة.
 */

/** ربط المناسبة بالتصنيف — يُقرأ من نص المناسبة أو عنوان التذكير. */
const OCCASION_CATEGORY = [
  { match: /ميلاد/, slugs: ["bouquets", "gift-sets", "flower-boxes"], label: "عيد ميلاد" },
  { match: /تخرّج|تخرج/, slugs: ["occasions", "bouquets"], label: "تخرّج" },
  { match: /زواج|خطوبة|زفاف|ذكرى/, slugs: ["occasions", "vase-arrangements", "flower-boxes"], label: "خطوبة أو ذكرى" },
  { match: /مولود|ولادة/, slugs: ["occasions", "gift-sets"], label: "مولود جديد" },
  { match: /شكر|اعتذار/, slugs: ["bouquets", "candles-scents"], label: "شكر أو اعتذار" },
  { match: /افتتاح|عمل|مكتب/, slugs: ["occasions", "plants"], label: "افتتاح أو عمل" },
];

function occasionMatch(text) {
  const t = String(text || "");
  return OCCASION_CATEGORY.find((o) => o.match.test(t)) || null;
}

const discountPct = (p) =>
  p.oldPrice && p.oldPrice > p.price
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
    : 0;

/**
 * يبني قائمة توصيات مرتّبة.
 *
 * @param {object} input
 * @param {Array}  input.products    كل المنتجات المنشورة
 * @param {Array}  input.favoriteIds معرّفات المفضّلة
 * @param {Array}  input.orders      طلبات العميل
 * @param {Array}  input.reminders   التذكيرات القادمة (من upcomingReminders)
 * @param {number} input.limit
 */
export function recommendProducts({
  products = [],
  favoriteIds = [],
  orders = [],
  reminders = [],
  limit = 6,
} = {}) {
  const favSet = new Set(favoriteIds);

  // المنتجات التي اشتراها فعلًا — لا نقترح نفس القطعة مرة أخرى
  const boughtIds = new Set();
  const boughtCats = new Map();

  for (const o of orders) {
    let items = [];
    try { items = JSON.parse(o.itemsJson || "[]"); } catch {}
    for (const it of items) {
      if (it?.id) boughtIds.add(it.id);
      const p = products.find((x) => x.id === it?.id);
      if (p?.categorySlug) boughtCats.set(p.categorySlug, (boughtCats.get(p.categorySlug) || 0) + 1);
    }
  }

  // تصنيفات المفضّلة
  const favCats = new Map();
  for (const id of favoriteIds) {
    const p = products.find((x) => x.id === id);
    if (p?.categorySlug) favCats.set(p.categorySlug, (favCats.get(p.categorySlug) || 0) + 1);
  }

  // أقرب تذكير لكل تصنيف مرشَّح
  const occasionCats = new Map();   // slug -> { label, daysAway, title }
  for (const r of reminders) {
    const m = occasionMatch(`${r.occasion || ""} ${r.title || ""}`);
    if (!m) continue;
    for (const slug of m.slugs) {
      const prev = occasionCats.get(slug);
      if (!prev || r.daysAway < prev.daysAway) {
        occasionCats.set(slug, { label: m.label, daysAway: r.daysAway, title: r.title });
      }
    }
  }

  const scored = [];

  for (const p of products) {
    // ما لا يُقترح إطلاقًا
    if (p.stock === "out_of_stock") continue;
    if (favSet.has(p.id)) continue;      // في مفضّلته أصلًا
    if (boughtIds.has(p.id)) continue;   // اشتراه من قبل

    let score = 0;
    let reason = "";
    let tone = "neutral";

    const occ = p.categorySlug ? occasionCats.get(p.categorySlug) : null;
    if (occ) {
      // الوزن يتناسب عكسيًا مع قرب الموعد — الأقرب أهم
      score += 100 + Math.max(0, 60 - occ.daysAway);
      reason =
        occ.daysAway <= 0 ? `لمناسبة «${occ.title}» اليوم`
        : occ.daysAway === 1 ? `لمناسبة «${occ.title}» غدًا`
        : `لمناسبة «${occ.title}» بعد ${occ.daysAway} يومًا`;
      tone = occ.daysAway <= 7 ? "urgent" : "occasion";
    } else if (p.categorySlug && favCats.has(p.categorySlug)) {
      score += 60 + favCats.get(p.categorySlug) * 5;
      reason = `لأنك تهتم بـ${p.categoryName || "هذا القسم"}`;
      tone = "taste";
    } else if (p.categorySlug && boughtCats.has(p.categorySlug)) {
      score += 45 + boughtCats.get(p.categorySlug) * 5;
      reason = `طلبت من ${p.categoryName || "هذا القسم"} من قبل`;
      tone = "history";
    }

    // الخصم دافع لا سبب: يرفع الترتيب، ولا يُنشئ توصية وحده
    const disc = discountPct(p);
    if (disc > 0) {
      score += Math.min(30, disc);
      if (reason) reason += ` · خصم ${disc}٪`;
      else if (disc >= 15) { reason = `خصم ${disc}٪ الآن`; score += 20; tone = "offer"; }
    }

    if (p.badge && /الأكثر مبيعًا|اختيار العملاء/.test(p.badge)) score += 8;
    if (p.stock === "low_stock") score += 5;

    if (!reason) continue;   // بلا سبب لا يُعرض
    scored.push({ product: p, score, reason, tone });
  }

  scored.sort((a, b) => b.score - a.score);

  /**
   * ── التنويع ──
   *
   * قيدان، وكلاهما نتج عن خلل ظهر في الاختبار:
   *
   * ١) بحد أقصى منتجان من كل تصنيف — بدونه تمتلئ القائمة بستّ
   *    باقات متشابهة فتبدو الاقتراحات كسولة.
   *
   * ٢) بحد أقصى ثلثا القائمة لإشارة المناسبة. تذكير واحد يرشّح
   *    ثلاثة تصنيفات، وبقيد التصنيف وحده يملأ الستة مواضع كلها،
   *    فتختفي إشارتا الذوق والتاريخ تمامًا. النتيجة قائمة تقول
   *    شيئًا واحدًا ستّ مرات. الحجز يضمن أن يرى العميل شيئًا
   *    يخصّه هو لا مناسبته فقط.
   */
  const OCCASION_CAP = Math.max(1, Math.ceil(limit * 0.66));
  const perCat = new Map();
  let occasionUsed = 0;
  const out = [];
  const deferred = [];

  for (const s of scored) {
    const slug = s.product.categorySlug || "_";
    const n = perCat.get(slug) || 0;
    if (n >= 2) continue;

    const isOccasion = s.tone === "occasion" || s.tone === "urgent";
    if (isOccasion && occasionUsed >= OCCASION_CAP) { deferred.push(s); continue; }

    perCat.set(slug, n + 1);
    if (isOccasion) occasionUsed++;
    out.push(s);
    if (out.length >= limit) break;
  }

  // لو لم تكفِ الإشارات الأخرى لملء القائمة، نعيد المؤجَّل
  for (const s of deferred) {
    if (out.length >= limit) break;
    out.push(s);
  }

  return out;
}

/**
 * عروض مناسبة للعميل: المخفَّضة أولًا، مع تقديم ما يوافق ذوقه.
 * منفصلة عن التوصيات لأن نيّة «أين العروض؟» غير نيّة «ماذا أهدي؟».
 */
export function personalizedOffers({ products = [], favoriteIds = [], orders = [], limit = 4 } = {}) {
  const favSet = new Set(favoriteIds);
  const favCats = new Set();
  for (const id of favoriteIds) {
    const p = products.find((x) => x.id === id);
    if (p?.categorySlug) favCats.add(p.categorySlug);
  }
  for (const o of orders) {
    let items = [];
    try { items = JSON.parse(o.itemsJson || "[]"); } catch {}
    for (const it of items) {
      const p = products.find((x) => x.id === it?.id);
      if (p?.categorySlug) favCats.add(p.categorySlug);
    }
  }

  return products
    .filter((p) => discountPct(p) > 0 && p.stock !== "out_of_stock")
    .map((p) => ({
      product: p,
      disc: discountPct(p),
      // المفضّل يُقدَّم، ثم ما يوافق ذوقه، ثم البقية بحسب نسبة الخصم
      rank: (favSet.has(p.id) ? 200 : 0) + (favCats.has(p.categorySlug) ? 100 : 0) + discountPct(p),
      onFavorite: favSet.has(p.id),
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit);
}
