import { NextResponse } from "next/server";
import {
  listNavItems, createNavItem, updateNavItem, deleteNavItem, reorderNav,
} from "../../../../lib/navDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  try {
    if (b.action === "create") {
      if (!String(b.label || "").trim() || !String(b.href || "").trim()) {
        return NextResponse.json({ error: "الاسم والرابط مطلوبان." }, { status: 400 });
      }
      /**
       * ⚠️ نقبل المسارات الداخلية والروابط الآمنة فقط.
       * `javascript:` في رابط قائمة ينفّذ كودًا عند النقر —
       * وهو حقن يمرّ من لوحة التحكم إلى كل زائر.
       */
      const href = String(b.href).trim();
      if (!/^(\/|https:\/\/|http:\/\/|mailto:|tel:)/.test(href)) {
        return NextResponse.json({ error: "الرابط يجب أن يبدأ بـ / أو https:// أو mailto: أو tel:" }, { status: 400 });
      }
      await createNavItem({ ...b, href });
      return NextResponse.json({ ok: true, items: await listNavItems() }, { status: 201 });
    }

    if (b.action === "update") {
      const href = String(b.href || "").trim();
      if (!/^(\/|https:\/\/|http:\/\/|mailto:|tel:)/.test(href)) {
        return NextResponse.json({ error: "رابط غير مسموح." }, { status: 400 });
      }
      await updateNavItem(b.id, { ...b, href });
      return NextResponse.json({ ok: true, items: await listNavItems() });
    }

    if (b.action === "delete") {
      await deleteNavItem(b.id);
      return NextResponse.json({ ok: true, items: await listNavItems() });
    }

    if (b.action === "reorder") {
      await reorderNav(Array.isArray(b.ids) ? b.ids : []);
      return NextResponse.json({ ok: true, items: await listNavItems() });
    }

    return NextResponse.json({ error: "إجراء غير معروف." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "تعذّر التنفيذ." }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ items: await listNavItems() });
}
