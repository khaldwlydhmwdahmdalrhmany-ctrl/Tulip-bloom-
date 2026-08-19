import { NextResponse } from "next/server";
import {
  listPages, createPage, updatePage, deletePage, getPageById,
} from "../../../../lib/pagesDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */

export async function GET() {
  const pages = await listPages();
  return NextResponse.json({ pages });
}

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  if (!String(b.title || "").trim()) {
    return NextResponse.json({ error: "عنوان الصفحة مطلوب." }, { status: 400 });
  }
  try {
    const id = await createPage(b);
    return NextResponse.json({ ok: true, page: await getPageById(id) }, { status: 201 });
  } catch (err) {
    const dup = /unique|duplicate/i.test(err.message || "");
    return NextResponse.json(
      { error: dup ? "هذا المسار مستخدم بالفعل." : err.message || "تعذّر الإنشاء." },
      { status: 400 }
    );
  }
}

export async function PUT(request) {
  const b = await request.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "معرّف الصفحة مطلوب." }, { status: 400 });
  try {
    const page = await updatePage(b.id, b);
    return NextResponse.json({ ok: true, page });
  } catch (err) {
    const dup = /unique|duplicate/i.test(err.message || "");
    return NextResponse.json(
      { error: dup ? "هذا المسار مستخدم بالفعل." : err.message || "تعذّر الحفظ." },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف الصفحة مطلوب." }, { status: 400 });
  await deletePage(id);
  return NextResponse.json({ ok: true });
}
