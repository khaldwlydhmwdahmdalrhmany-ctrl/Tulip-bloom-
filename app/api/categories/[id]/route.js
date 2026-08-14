import { NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "../../../../lib/db.js";
import { invalidateCategories } from "../../../../lib/cache.js";

export async function PUT(request, { params }) {
  const body = await request.json();
  try {
    const category = await updateCategory(params.id, body);
    invalidateCategories();
    return NextResponse.json(category);
  } catch (e) {
    return NextResponse.json({ error: e.message || "تعذّر تحديث التصنيف" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await deleteCategory(params.id);
    invalidateCategories();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
