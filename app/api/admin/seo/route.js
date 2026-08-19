import { NextResponse } from "next/server";
import {
  saveOverride, deleteOverride, createRedirect, deleteRedirect, normalizePath,
} from "../../../../lib/seoDb.js";
import { saveSettings } from "../../../../lib/db.js";
import { SEO_KEYS } from "../../../../lib/settings.js";
import { invalidateSettings } from "../../../../lib/cache.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));

  try {
    if (b.action === "save-override") {
      if (!b.path) return NextResponse.json({ error: "المسار مطلوب." }, { status: 400 });
      await saveOverride(b);
      return NextResponse.json({ ok: true, path: normalizePath(b.path) }, { status: 201 });
    }

    if (b.action === "delete-override") {
      await deleteOverride(b.id);
      return NextResponse.json({ ok: true });
    }

    if (b.action === "create-redirect") {
      if (!b.fromPath || !b.toPath) {
        return NextResponse.json({ error: "المسار القديم والجديد مطلوبان." }, { status: 400 });
      }
      await createRedirect(b);
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (b.action === "delete-redirect") {
      await deleteRedirect(b.id);
      return NextResponse.json({ ok: true });
    }

    if (b.action === "save-settings") {
      // لا نقبل إلا مفاتيح SEO المعروفة
      const clean = Object.fromEntries(
        Object.entries(b.settings || {}).filter(([k]) => SEO_KEYS.includes(k) || k === "gsc_verification" || k === "bing_verification")
      );
      await saveSettings(clean);
      invalidateSettings();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "إجراء غير معروف." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "تعذّر تنفيذ الإجراء." }, { status: 400 });
  }
}
