import { siteUrl } from "../lib/seo.jsx";
import { getSettings } from "../lib/db.js";

/**
 * robots.txt — يمنع فهرسة لوحة التحكم ومسارات الـ API،
 * ويشير إلى خريطة الموقع المتولّدة تلقائيًا.
 */
export const dynamic = "force-dynamic";

export default async function robots() {
  const base = siteUrl();
  const settings = await getSettings().catch(() => ({}));

  // أسطر إضافية من /admin/seo — مسار واحد في كل سطر
  const extra = String(settings.seo_robots_extra || "")
    .split("\n").map((l) => l.trim()).filter((l) => l.startsWith("/"));

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",          // لوحة التحكم
          "/api/",           // مسارات البيانات
          "/*?utm_",         // نسخ مكررة بوسوم الحملات
          "/*?gclid",
          "/*?fbclid",
          "/feed.xml",        // تغذية المنتجات — للمنصات الإعلانية لا لمحركات البحث
          "/feed.csv",
          // ⭐ صفحات خاصة بالمستخدم: لا قيمة لها في الفهرس، وفهرستها
          //    تُنتج صفحات مكرّرة وتسرّب مسارات الحساب في النتائج.
          "/account",
          "/search",          // نتائج بحث داخلية — محتوى مكرّر
          ...extra,
        ],
      },
      // زواحف الذكاء الاصطناعي التي لا تُرسل زيارات — تُستهلك النطاق بلا مقابل
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
