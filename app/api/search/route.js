import { NextResponse } from "next/server";
import { getProducts, getCategories } from "../../../lib/queries.js";
import { searchProducts, buildIndex, suggestTerms } from "../../../lib/searchEngine.js";
import { loadSearchConfig, logSearch, topQueries } from "../../../lib/searchDb.js";
import { getCurrentCustomer } from "../../../lib/customerSession.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * بحث المتجر — عام (لا يتطلب جلسة).
 *
 * يعمل على الخادم لا في المتصفح لسببين:
 *  ١) التهيئة (المرادفات والتثبيت) تُدار من اللوحة وتُقرأ من القاعدة
 *  ٢) التسجيل يحتاج الخادم — وسجلّ «بلا نتائج» أثمن تقرير في المتجر
 */
export async function GET(request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(60, Number(url.searchParams.get("limit")) || 24);
  const withSuggestions = url.searchParams.get("suggest") !== "0";
  const shouldLog = url.searchParams.get("log") === "1";

  if (!q) return NextResponse.json({ query: "", results: [], suggestions: [], total: 0 });

  const [products, categories, config] = await Promise.all([
    getProducts(),
    getCategories().catch(() => []),
    loadSearchConfig(),
  ]);

  const index = buildIndex(products, config.stopwords);
  const hits = searchProducts(q, index, { ...config, limit });

  let suggestions = [];
  if (withSuggestions) {
    const popular = await topQueries({ days: 60, limit: 40 }).catch(() => []);
    suggestions = suggestTerms(q, {
      products, categories,
      popular: popular.map((p) => p.sample || p.normalized),
      limit: 5,
    });
  }

  /**
   * التسجيل عند الطلب الصريح فقط (`log=1`).
   * البحث الفوري يُطلق طلبًا لكل ضغطة مفتاح تقريبًا؛ تسجيلها
   * كلها يملأ التقرير بأجزاء كلمات («ب» ثم «با» ثم «باق»).
   * الواجهة ترسل log=1 بعد توقّف الكتابة فقط.
   */
  if (shouldLog) {
    const me = await getCurrentCustomer().catch(() => null);
    await logSearch({ raw: q, resultCount: hits.length, customerId: me?.id || null });
  }

  return NextResponse.json({
    query: q,
    total: hits.length,
    suggestions,
    results: hits.map((h) => ({
      id: h.product.id,
      name: h.product.name,
      price: h.product.price,
      oldPrice: h.product.oldPrice,
      imageUrl: h.product.imageUrl,
      stock: h.product.stock,
      badge: h.product.badge,
      categoryName: h.product.categoryName,
      categorySlug: h.product.categorySlug,
      score: h.score,
      matched: h.matched,
    })),
  });
}
