import { getSitemapData, getLegalPages } from "../lib/queries.js";
import { siteUrl } from "../lib/seo.jsx";

/**
 * خريطة الموقع — تتولّد تلقائيًا من قاعدة البيانات.
 * أي منتج أو تصنيف جديد يظهر فيها فور إضافته، بلا أي خطوة يدوية.
 * المنتجات المخفية مستبعدة أصلًا لأن الاستعلام يصفّي على published.
 */
export const revalidate = 3600;

const STATIC_PAGES = [
  { path: "", priority: 1.0, freq: "daily" },
  { path: "/shop", priority: 0.9, freq: "daily" },
  { path: "/offers", priority: 0.9, freq: "daily" },
  { path: "/maintenance", priority: 0.7, freq: "monthly" },
  { path: "/maintenance/technician", priority: 0.7, freq: "monthly" },
  { path: "/maintenance/urgent", priority: 0.6, freq: "monthly" },
  { path: "/about", priority: 0.6, freq: "monthly" },
  { path: "/contact", priority: 0.6, freq: "monthly" },
  { path: "/faq", priority: 0.5, freq: "monthly" },
  { path: "/privacy", priority: 0.3, freq: "yearly" },
];

export default async function sitemap() {
  const base = siteUrl();
  const now = new Date();

  let products = [];
  let categories = [];
  let legal = [];
  try {
    const data = await getSitemapData();
    products = data.products || [];
    categories = data.categories || [];
  } catch {
    // فشل القاعدة يجب ألا يُنتج خريطة معطوبة — نُخرج الصفحات الثابتة فقط
  }

  // الصفحات القانونية المنشورة فقط — المخفية لا تدخل الخريطة
  try {
    legal = (await getLegalPages()).filter((p) => p.content?.trim());
  } catch {}

  return [
    ...STATIC_PAGES.map((p) => ({
      url: `${base}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    })),
    ...categories.map((c) => ({
      url: `${base}/category/${encodeURIComponent(c.slug)}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
    ...legal.map((p) => ({
      url: `${base}/legal/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "yearly",
      priority: 0.3,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
  ];
}
