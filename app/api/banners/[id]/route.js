import { NextResponse } from "next/server";
import { updateBanner, deleteBanner } from "../../../../lib/db.js";
import { invalidateBanners } from "../../../../lib/cache.js";

export async function PUT(request, { params }) {
  const body = await request.json();
  try {
    const banner = await updateBanner(params.id, body);
    invalidateBanners();
    return NextResponse.json(banner);
  } catch (e) {
    return NextResponse.json({ error: "تعذّر تحديث البنر" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await deleteBanner(params.id);
    invalidateBanners();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "تعذّر حذف البنر" }, { status: 400 });
  }
}
