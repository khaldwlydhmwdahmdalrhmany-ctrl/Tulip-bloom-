import { NextResponse } from "next/server";
import {
  listMedia, updateMediaAlt, deleteMediaRow, getMediaById, mediaUsage,
} from "../../../../lib/mediaDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */

export async function GET(request) {
  const url = new URL(request.url);
  const usageFor = url.searchParams.get("usage");
  if (usageFor) return NextResponse.json({ usage: await mediaUsage(usageFor) });

  const search = url.searchParams.get("q") || "";
  return NextResponse.json({ media: await listMedia({ search }) });
}

export async function PATCH(request) {
  const b = await request.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "المعرّف مطلوب." }, { status: 400 });
  await updateMediaAlt(b.id, b.alt);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "المعرّف مطلوب." }, { status: 400 });

  const item = await getMediaById(id);
  if (!item) return NextResponse.json({ error: "الملف غير موجود." }, { status: 404 });

  /**
   * ⚠️ الحذف يتطلب تأكيدًا صريحًا حين تكون الصورة مستعملة.
   * حذفها بلا فحص يترك مربّعًا مكسورًا في صفحة منشورة أو بطاقة
   * منتج، ولا سبيل لمعرفة السبب لاحقًا.
   */
  const usage = await mediaUsage(item.url);
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (usage.length && !force) {
    return NextResponse.json(
      { error: "هذه الصورة مستعملة.", usage },
      { status: 409 }
    );
  }

  // الحذف من التخزين ثم من السجلّ. فشل التخزين لا يمنع تنظيف السجلّ.
  try {
    if (item.storage === "blob" && process.env.BLOB_READ_WRITE_TOKEN) {
      const { del } = await import("@vercel/blob");
      await del(item.url);
    } else if (item.storage === "local") {
      const { unlink } = await import("node:fs/promises");
      const path = await import("node:path");
      // ⚠️ الرابط `/media/x.png` والملف في `public/uploads/x.png` —
      // نأخذ الاسم فقط. اشتقاق المسار من الرابط مباشرة يخطئ المجلد
      // ويترك الملف على القرص بعد حذف سجلّه.
      const base = path.basename(item.url);
      if (base && !base.includes("..")) {
        await unlink(path.join(process.cwd(), "public", "uploads", base));
      }
    }
  } catch { /* الملف قد يكون محذوفًا أصلًا */ }

  await deleteMediaRow(id);
  return NextResponse.json({ ok: true });
}
