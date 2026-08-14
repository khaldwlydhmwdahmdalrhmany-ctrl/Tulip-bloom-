import { getProducts } from "../../lib/db.js";
import { siteUrl } from "../../lib/seo.jsx";
import { STORE } from "../../config/store.config.js";

/**
 * نفس التغذية بصيغة CSV.
 *
 * بعض المنصات ترفع الكتالوج من ملف CSV لا رابط XML — خصوصًا Snapchat
 * وTikTok حين يُرفع الملف يدويًا. الأعمدة بأسماء Google القياسية
 * فتتعرّف عليها كل المنصات تلقائيًا.
 */
export const revalidate = 1800;

/** تهريب حقل CSV — الفاصلة وعلامة التنصيص والسطر الجديد تكسر الملف. */
const cell = (v = "") => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const absoluteImage = (url, base) => {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

const availability = (stock) =>
  stock === "out_of_stock" ? "out of stock" : stock === "preorder" ? "preorder" : "in stock";

export async function GET() {
  const base = siteUrl();

  let products = [];
  try { products = await getProducts(); } catch {}

  const valid = products.filter(
    (p) => p.imageUrl && String(p.imageUrl).trim() && Number(p.price) > 0
  );

  const headers = [
    "id", "title", "description", "availability", "condition",
    "price", "sale_price", "link", "image_link", "brand",
    "product_type", "google_product_category", "shipping",
  ];

  const rows = valid.map((p) => {
    const hasSale = p.oldPrice && Number(p.oldPrice) > Number(p.price);
    const listPrice = hasSale ? Number(p.oldPrice) : Number(p.price);
    return [
      p.id,
      String(p.name).slice(0, 150),
      String(p.description || p.name).slice(0, 4900),
      availability(p.stock),
      "new",
      `${listPrice.toFixed(2)} SAR`,
      hasSale ? `${Number(p.price).toFixed(2)} SAR` : "",
      `${base}/product/${p.id}`,
      absoluteImage(p.imageUrl, base),
      p.brand || STORE.shortName,
      p.category?.name || STORE.shortName,
      STORE.googleProductCategory || "",
      `SA::توصيل قياسي:${p.freeShipping ? "0.00" : "25.00"} SAR`,
    ].map(cell).join(",");
  });

  // BOM ضروري ليقرأ Excel العربية صحيحة
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="areej-products.csv"',
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
