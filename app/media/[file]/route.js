import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * خدمة الملفات المرفوعة محليًا.
 *
 * ⚠️ لماذا مسار بدل `public/` مباشرة:
 * Next يلتقط محتوى `public/` عند البناء. أي ملف يُكتب فيه بعد
 * ذلك لا يُخدَم في `next start` — **مُختبَر: الملف على القرص
 * والطلب يُرجع ٤٠٤**. هذا المسار يقرأ من القرص عند كل طلب،
 * فيعمل في `dev` و`start` معًا.
 *
 * البديل المحلي للتطوير فقط؛ في الإنتاج على Vercel يُستعمل Blob
 * ونظام الملفات للقراءة فقط أصلًا.
 */
const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".avif": "image/avif",
};

export async function GET(_request, { params }) {
  const name = String(params.file || "");

  /**
   * ⚠️ حماية من اجتياز المسار: `basename` وحدها لا تكفي مع
   * الترميز، فنرفض صراحةً أي اسم فيه شرطة مائلة أو نقطتان.
   * بدونها `..%2f..%2fetc%2fpasswd` يقرأ ملفات خارج المجلد.
   */
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(name).toLowerCase();
  if (!MIME[ext]) return new Response("Not found", { status: 404 });

  try {
    const buf = await readFile(path.join(process.cwd(), "public", "uploads", name));
    return new Response(buf, {
      headers: {
        "Content-Type": MIME[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
