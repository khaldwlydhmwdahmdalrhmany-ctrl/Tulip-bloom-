import { listPosts } from "../../../lib/blogDb.js";
import { siteUrl } from "../../../lib/seo.jsx";
import { STORE } from "../../../config/store.config.js";

export const runtime = "nodejs";
/**
 * ⚠️ ديناميكي لا مُعاد التحقّق.
 * مع `revalidate` تولّد التغذية وقت البناء — وقت لا مقالات فيه —
 * فتبقى فارغة حتى انقضاء المهلة. **مُختبَر: صفر عناصر رغم وجود
 * مقال منشور.** قرّاء RSS نادرو الطلب، فالتوليد عند الطلب أرخص
 * من تغذية خاطئة.
 */
export const dynamic = "force-dynamic";

/** تهريب XML — بدونه يكسر أي `&` أو `<` في عنوان مقال الملف كله. */
const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  const base = siteUrl();
  const posts = await listPosts({ status: "published", limit: 40 }).catch(() => []);
  const visible = posts.filter((p) => !(p.noIndex === true || p.noIndex === 1));

  const items = visible.map((p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/blog/${encodeURIComponent(p.slug)}</link>
      <guid isPermaLink="true">${base}/blog/${encodeURIComponent(p.slug)}</guid>
      <description>${esc(p.excerpt || "")}</description>
      ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ""}
      ${p.categoryName ? `<category>${esc(p.categoryName)}</category>` : ""}
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(STORE.name)} — المدوّنة</title>
    <link>${base}/blog</link>
    <description>${esc(STORE.description)}</description>
    <language>ar</language>
    <atom:link href="${base}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
