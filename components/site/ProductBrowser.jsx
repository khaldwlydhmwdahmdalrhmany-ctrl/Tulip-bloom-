"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ArrowUpDown, Check } from "lucide-react";
import { C, SH, formatPrice } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { buildIndex, searchProducts } from "../../lib/searchEngine.js";
import ProductCard from "./ProductCard.jsx";
import { STOCK_LABELS } from "./StockBadge.jsx";
import { trackSearch, trackSearchNoResults, trackFilterUse, trackViewItemList } from "../../lib/analytics.js";

/**
 * عدد المنتجات في الدفعة الواحدة.
 * عرض 500 منتج دفعة واحدة يعني 500 عقدة DOM و500 طلب صورة —
 * يُجمّد الجوال. نعرض 24 ثم نزيد عند الطلب.
 */
const PAGE_SIZE = 24;

const SORTS = [
  { key: "relevant", label: "المختارة لك" },
  { key: "price_asc", label: "السعر: من الأقل" },
  { key: "price_desc", label: "السعر: من الأعلى" },
  { key: "discount", label: "أعلى خصم" },
  { key: "newest", label: "الأحدث" },
];

// اقتراحات بحث تتغيّر حسب القسم — أوضح من "ابحث عن منتج..."
/** نص مربّع البحث — عام يناسب أي مجال. */
/**
 * ⚠️ حقل `brand` يحمل هنا نوع الزهرة لا ماركة تجارية — لا ماركات
 * في متجر ورد. النصوص تعكس ذلك: «نوع الزهرة» لا «الماركة».
 */
const SEARCH_PLACEHOLDER = "ابحث عن باقة، مناسبة، أو نوع زهرة…";
const BRAND_LABEL = "نوع الزهرة";

function ProductBrowserInner({ categories, products, activeCatSlug }) {
  /**
   * ⚠️ إصلاح خلل نواة: النسخة السابقة كانت تحتفظ بنص البحث في
   * حالة محلية ولا تقرأ من عنوان الصفحة إطلاقًا. أي رابط بصيغة
   * `/shop?q=...` كان يصل ولا يُرشِّح شيئًا — رابط يبدو حيًّا وهو ميت.
   */
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams?.get("q") || "");
  const [sort, setSort] = useState("relevant");
  const [brands, setBrands] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // نطاق السعر مشتق من المنتجات المعروضة فعلًا
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const ps = products.map((p) => Number(p.price));
    return { min: Math.floor(Math.min(...ps)), max: Math.ceil(Math.max(...ps)) };
  }, [products]);

  const availableBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products]
  );
  const availableStocks = useMemo(
    () => [...new Set(products.map((p) => p.stock || "in_stock"))],
    [products]
  );

  const ceiling = maxPrice ?? priceBounds.max;

  /**
   * الفهرس يُبنى مرة لكل قائمة منتجات لا مع كل ضغطة مفتاح.
   * التطبيع والتفكيك أثقل من المطابقة نفسها، وإعادتهما في كل
   * حرف تُحدث تلعثمًا محسوسًا على الجوال.
   */
  const searchIndex = useMemo(() => buildIndex(products), [products]);

  const filtered = useMemo(() => {
    const q = query.trim();

    // المحرّك يتولّى العربية: تطبيع الهمزات، المرادفات،
    // السوابق الملتصقة، والمطابقة التقريبية للأخطاء المطبعية.
    let base = products;
    let ranked = null;
    if (q) {
      ranked = searchProducts(q, searchIndex, { limit: 500 });
      base = ranked.map((r) => r.product);
    }

    let out = base.filter((p) => {
      if (brands.length && !brands.includes(p.brand)) return false;
      if (stocks.length && !stocks.includes(p.stock || "in_stock")) return false;
      if (Number(p.price) > ceiling) return false;
      return true;
    });

    const disc = (p) => (p.oldPrice && p.oldPrice > p.price ? 1 - p.price / p.oldPrice : 0);
    const sorters = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      discount: (a, b) => disc(b) - disc(a),
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    };
    // مع وجود بحث، «المختارة لك» = ترتيب الصلة القادم من المحرّك.
    // إعادة الفرز افتراضيًا هنا تُلغي عمل الترتيب كله.
    if (sorters[sort]) out = [...out].sort(sorters[sort]);
    return out;
  }, [products, searchIndex, query, brands, stocks, ceiling, sort]);

  // أي تغيير في البحث أو الفلاتر يعيدنا لأول دفعة
  React.useEffect(() => { setLimit(PAGE_SIZE); }, [query, brands, stocks, maxPrice, sort]);

  // تتبّع البحث بعد توقّف الكتابة 900 مللي — لا مع كل حرف،
  // وإلا امتلأ التقرير بأجزاء كلمات بلا معنى.
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      trackSearch(q, filtered.length);
      if (filtered.length === 0) trackSearchNoResults(q);
    }, 900);
    return () => clearTimeout(t);
  }, [query, filtered.length]);

  // عرض القائمة — مرة واحدة عند فتح الصفحة
  React.useEffect(() => {
    if (products.length > 0) {
      trackViewItemList(products, activeCatSlug || "كل المنتجات", activeCatSlug || "shop");
    }
  }, []);

  const toggle = (list, setList, val) => {
    if (!list.includes(val)) trackFilterUse("brand_or_stock", val);
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const activeCount =
    brands.length + stocks.length + (maxPrice !== null && maxPrice < priceBounds.max ? 1 : 0);

  const resetAll = () => {
    setBrands([]); setStocks([]); setMaxPrice(null); setQuery("");
  };

  const placeholder = SEARCH_PLACEHOLDER;

  const hasFilters = availableBrands.length > 0 || availableStocks.length > 1 || priceBounds.max > priceBounds.min;

  return (
    <div>
      {/* شرائط التصنيفات */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 mb-5">
        <Link
          href="/shop"
          className="shrink-0 px-4 py-2.5 rounded-xl text-[13px] transition-all"
          style={!activeCatSlug
            ? { background: C.navy, color: "#fff", fontWeight: 700 }
            : { background: "#fff", color: C.slate, border: `1px solid ${C.line}`, fontWeight: 500 }}
        >
          الكل
        </Link>
        {categories.map((c) => {
          const Icon = getIcon(c.icon);
          const on = activeCatSlug === c.slug;
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] transition-all"
              style={on
                ? { background: C.navy, color: "#fff", fontWeight: 700 }
                : { background: "#fff", color: C.slate, border: `1px solid ${C.line}`, fontWeight: 500 }}
            >
              <Icon size={14} style={{ color: on ? "#fff" : (c.color || C.teal) }} /> {c.name}
            </Link>
          );
        })}
      </div>

      {/* شريط البحث + الفرز + الفلترة */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" color={C.slateLight} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="بحث في المنتجات"
            className="w-full pr-11 pl-10 py-3.5 rounded-xl text-sm outline-none transition-colors focus:border-[color:var(--c-accent)]"
            style={{ border: `1px solid ${C.line}`, background: "#fff" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="مسح البحث"
              className="absolute top-1/2 -translate-y-1/2 left-3 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: C.lineSoft, color: C.slate }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <ArrowUpDown size={14} className="absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" color={C.slateLight} />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); trackFilterUse("sort", e.target.value); }}
              aria-label="ترتيب المنتجات"
              className="w-full sm:w-auto appearance-none pr-10 pl-4 py-3.5 rounded-xl text-[13px] font-bold outline-none cursor-pointer"
              style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.navy }}
            >
              {SORTS.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className="relative flex items-center gap-2 px-5 py-3.5 rounded-xl text-[13px] font-bold shrink-0 transition-colors"
              style={panelOpen ? { background: C.navy, color: "#fff" } : { border: `1px solid ${C.line}`, background: "#fff", color: C.navy }}
            >
              <SlidersHorizontal size={14} /> تصفية
              {activeCount > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center" style={{ background: C.teal, color: "#fff" }}>
                  {activeCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* لوحة الفلاتر */}
      {panelOpen && hasFilters && (
        <div className="rise p-6 rounded-2xl mb-6 grid sm:grid-cols-3 gap-7" style={{ background: C.pearl, border: `1px solid ${C.line}` }}>
          {/* السعر */}
          {priceBounds.max > priceBounds.min && (
            <div>
              <h4 className="text-[10px] font-bold mb-3 tracking-[.14em] uppercase" style={{ color: C.slateLight }}>الحد الأعلى للسعر</h4>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={ceiling}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-current"
                style={{ accentColor: C.teal }}
                aria-label="السعر الأقصى"
              />
              <div className="flex justify-between text-[11px] mt-1" style={{ color: C.slate }}>
                <span>{formatPrice(priceBounds.min)} ر.س</span>
                <span className="font-bold" style={{ color: C.navy }}>حتى {formatPrice(ceiling)} ر.س</span>
              </div>
            </div>
          )}

          {/* الماركة */}
          {availableBrands.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold mb-3 tracking-[.14em] uppercase" style={{ color: C.slateLight }}>{BRAND_LABEL}</h4>
              <div className="flex flex-wrap gap-2">
                {availableBrands.map((b) => {
                  const on = brands.includes(b);
                  return (
                    <button
                      key={b}
                      onClick={() => toggle(brands, setBrands, b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold"
                      style={on ? { background: C.navy, color: "#fff" } : { background: C.offWhite, color: C.slate }}
                    >
                      {on && <Check size={11} />} {b}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* التوفر */}
          {availableStocks.length > 1 && (
            <div>
              <h4 className="text-[10px] font-bold mb-3 tracking-[.14em] uppercase" style={{ color: C.slateLight }}>التوفر</h4>
              <div className="flex flex-wrap gap-2">
                {availableStocks.map((s) => {
                  const on = stocks.includes(s);
                  const meta = STOCK_LABELS[s] || STOCK_LABELS.in_stock;
                  return (
                    <button
                      key={s}
                      onClick={() => toggle(stocks, setStocks, s)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold"
                      style={on ? { background: meta.color, color: "#fff" } : { background: C.offWhite, color: meta.color }}
                    >
                      {on && <Check size={11} />} {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeCount > 0 && (
            <div className="sm:col-span-3 pt-1">
              <button onClick={resetAll} className="text-xs font-bold underline" style={{ color: C.danger }}>
                مسح كل الفلاتر
              </button>
            </div>
          )}
        </div>
      )}

      {/* عدّاد النتائج */}
      <div className="flex items-center justify-between mb-5 text-xs" style={{ color: C.slate }}>
        <span>
          <strong style={{ color: C.navy }}>{filtered.length}</strong> منتج
          {filtered.length !== products.length && ` من أصل ${products.length}`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: C.offWhite }}>
          <p className="font-bold mb-1" style={{ color: C.navy }}>لا توجد منتجات مطابقة</p>
          <p className="text-sm mb-5" style={{ color: C.slate }}>جرّب توسيع نطاق السعر أو إزالة بعض الفلاتر.</p>
          <button onClick={resetAll} className="btn px-6 py-2.5 text-sm" style={{ background: C.navy, color: "#fff" }}>
            إعادة ضبط البحث
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.slice(0, limit).map((p) => (<ProductCard key={p.id} product={p} />))}
          </div>

          {filtered.length > limit && (
            <div className="flex flex-col items-center gap-3 mt-10">
              <div className="w-full max-w-xs h-1 rounded-full overflow-hidden" style={{ background: C.line }}>
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${(limit / filtered.length) * 100}%`, background: C.teal }} />
              </div>
              <span className="text-xs" style={{ color: C.slate }}>
                عرض {Math.min(limit, filtered.length)} من {filtered.length}
              </span>
              <button onClick={() => setLimit((l) => l + PAGE_SIZE)}
                      className="btn px-7 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
                عرض المزيد
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


/**
 * ⚠️ حدود Suspense إلزامية.
 *
 * `useSearchParams` يجبر Next على الخروج من التوليد الثابت، وبلا
 * غلاف Suspense يفشل بناء كل صفحة تستدعي هذا المكوّن:
 *
 *   useSearchParams() should be wrapped in a suspense boundary
 *   Error occurred prerendering page "/shop"
 *
 * الغلاف هنا لا في الصفحات: المكوّن هو مصدر القيد، فيحمل علاجه
 * معه ولا يفرضه على كل من يستعمله.
 */
export default function ProductBrowser(props) {
  return (
    <Suspense fallback={null}>
      <ProductBrowserInner {...props} />
    </Suspense>
  );
}
