import { NextResponse } from "next/server";
import { getLegalPage, updateLegalPage } from "../../../../lib/db.js";
import { invalidate, TAGS } from "../../../../lib/cache.js";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const page = await getLegalPage(params.slug);
  if (!page) return NextResponse.json({ error: "غير موجودة" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
    }
    const page = await updateLegalPage(params.slug, {
      title: String(body.title).slice(0, 200),
      content: String(body.content || "").slice(0, 60000),
      metaDescription: body.metaDescription ? String(body.metaDescription).slice(0, 300) : null,
      published: !!body.published,
    });
    invalidate(TAGS.settings);
    return NextResponse.json(page);
  } catch (err) {
    console.error("[legal] فشل الحفظ:", err.message);
    return NextResponse.json({ error: "تعذّر حفظ الصفحة" }, { status: 500 });
  }
}
