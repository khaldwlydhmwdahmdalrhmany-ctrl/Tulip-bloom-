import { NextResponse } from "next/server";
import { getCategories, createCategory } from "../../../lib/db.js";
import { invalidateCategories } from "../../../lib/cache.js";

export async function GET() {
  invalidateCategories();
  return NextResponse.json(await getCategories());
}

export async function POST(request) {
  const body = await request.json();
  const { name, slug } = body;
  if (!name || !slug) {
    return NextResponse.json({ error: "الاسم والمعرّف (slug) مطلوبان" }, { status: 400 });
  }
  try {
    const category = await createCategory(body);
    invalidateCategories();
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "المعرّف (slug) مستخدم مسبقًا" }, { status: 400 });
  }
}
