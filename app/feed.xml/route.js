import { getSitemapData } from "../../lib/queries.js";
import { getProducts } from "../../lib/db.js";
import { siteUrl } from "../../lib/seo.jsx";
import { STORE } from "../../config/store.config.js";

/**
 * تغذية المنتجات بصيغة Google Merchant Center (RSS 2.0 + namespace g:).
 *
 * تقبلها أيضًا: Meta (فيسبوك وإنستغرام) · Snapchat · TikTok · Pinterest.
 * كلها تدعم صيغة Google كمعيار مشترك، فملف واحد يخدم المنصات جميعًا.
 *
 * يتولّد من قاعدة البيانات مباشرة — أي منتج تضيفه يظهر فيه تلقائيًا،
 * وأي منتج تخفيه يخرج منه.
 */
export const revalidate = 1800;

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

/**
 * تحويل رابط الصورة إلى مطلق.
 * المنصات ترفض المسارات النسبية مثل "/images/prod_4.jpg" —
 * تحتاج رابطًا كاملًا يبدأ بـ https.
 */
const absoluteImage = (url, base) => {
  const raw = String(url || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

/** حالة التوفّر بصيغة Merchant Center. */
const availability = (stock) => {
  if (stock === "out_of_stock") return "out of stock";
  if (stock === "preorder") return "preorder";
  return "in stock";
};

export async function GET() {
  const base = siteUrl();

  let products = [];
  try {
    products = await getProducts();
  } catch {
    // فشل القاعدة يجب ألا يُنتج ملفًا معطوبًا
  }

  // المنصات ترفض المنتج بلا صورة أو بسعر صفر — نستبعده بدل أن يُرفض الملف كله
  const valid = products.filter(
    (p) => p.imageUrl && String(p.imageUrl).trim() && Number(p.price) > 0
  );

  const items = valid.map((p) => {
    const img = absoluteImage(p.imageUrl, base);
    const desc = (p.description || p.name || "").replace(/\s+/g, " ").trim().slice(0, 4900);
    const sale =
      p.oldPrice && Number(p.oldPrice) > Number(p.price)
        ? `\n      <g:sale_price>${Number(p.price).toFixed(2)} SAR</g:sale_price>`
        : "";
    // السعر المعروض هو الأصلي حين يوجد خصم، وإلا السعر الحالي
    const listPrice =
      p.oldPrice && Number(p.oldPrice) > Number(p.price) ? Number(p.oldPrice) : Number(p.price);

    return `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name.slice(0, 150))}</g:title>
      <g:description>${esc(desc)}</g:description>
      <g:link>${base}/product/${esc(p.id)}</g:link>
      <g:image_link>${esc(img)}</g:image_link>
      <g:availability>${availability(p.stock)}</g:availability>
      <g:price>${listPrice.toFixed(2)} SAR</g:price>${sale}
      <g:brand>${esc(p.brand || STORE.shortName)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${esc(p.category?.name || STORE.shortName)}</g:product_type>
      ${STORE.googleProductCategory ? `<g:google_product_category>${STORE.googleProductCategory}</g:google_product_category>` : ""}
      <g:shipping>
        <g:country>SA</g:country>
        <g:service>توصيل قياسي</g:service>
        <g:price>${p.freeShipping ? "0.00" : "25.00"} SAR</g:price>
      </g:shipping>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>{STORE.name}</title>
    <link>${base}</link>
    <description>${esc(STORE.description)}</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
