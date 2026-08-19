/**
 * تطبيق تجاوزات SEO المحفوظة من اللوحة على ميتاداتا أي صفحة.
 *
 * يُستدعى داخل `generateMetadata`. القيمة المحفوظة تفوز على
 * المحسوبة، والحقل الفارغ يُترك للحساب التلقائي — فلا يُجبَر
 * المحرّر على ملء كل الحقول ليعدّل واحدًا.
 */
import { getOverride } from "./seoDb.js";

export async function applyOverride(path, base = {}) {
  let ov = null;
  try { ov = await getOverride(path); } catch { /* التجاوز تحسين لا شرط */ }
  if (!ov) return base;

  const out = { ...base };
  if (ov.title) out.title = ov.title;
  if (ov.description) out.description = ov.description;
  if (ov.keywords) out.keywords = String(ov.keywords).split(/[,،]/).map((k) => k.trim()).filter(Boolean);

  if (ov.noIndex === true || ov.noIndex === 1) {
    // follow يبقى: نمنع الفهرسة لا تتبّع الروابط الخارجة
    out.robots = { index: false, follow: true };
  }
  if (ov.canonical) out.alternates = { ...(out.alternates || {}), canonical: ov.canonical };
  if (ov.ogImage) {
    out.openGraph = { ...(out.openGraph || {}), images: [{ url: ov.ogImage }] };
  }
  return out;
}

/**
 * تحويل أو ٤٠٤.
 *
 * ⚠️ لماذا هنا لا في `not-found.jsx` وحدها:
 * حين تستدعي صفحة `notFound()` بنفسها، تكون الاستجابة قد بدأت
 * بحالة ٤٠٤، فاستدعاء `redirect()` داخل حدود not-found ينفّذ
 * المنطق (العدّاد يزيد) لكن لا يُنتج ترويسة `Location`.
 * المُختبَر: `/very-old` غير المطابق يعطي 307 صحيحًا، بينما
 * `/category/old-flowers` كان يبقى 404.
 *
 * الحل: نفحص التحويل **قبل** استدعاء `notFound()` في الصفحات
 * الديناميكية — وهي بالضبط الحالات التي تحتاجه: سلَغ تصنيف
 * تغيّر، أو منتج مفهرس حُذف.
 */
export async function redirectOrNotFound(path) {
  const { findRedirect, bumpRedirect } = await import("./seoDb.js");
  const { redirect, notFound } = await import("next/navigation");

  try {
    const rule = await findRedirect(path);
    if (rule?.toPath && rule.toPath !== path) {
      bumpRedirect(rule.id).catch(() => {});
      redirect(rule.toPath);
    }
  } catch (err) {
    // `redirect()` يعمل برمي استثناء — نمرّره ولا نبتلعه
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
  }
  notFound();
}
