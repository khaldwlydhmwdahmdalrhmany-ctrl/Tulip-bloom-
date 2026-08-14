import { NextResponse } from "next/server";
import { getProducts, createProduct } from "../../../lib/db.js";
import { invalidateProducts } from "../../../lib/cache.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  // ?all=1 تستخدمه لوحة التحكم فقط لعرض المنتجات المخفية أيضًا
  const includeHidden = searchParams.get("all") === "1";
  const products = await getProducts({ categorySlug: categorySlug || undefined, includeHidden });
  invalidateProducts();
  return NextResponse.json(products);
}

export async function POST(request) {
  const body = await request.json();
  const { name, categoryId, price } = body;

  if (!name || !categoryId || price === undefined || price === null || price === "") {
    return NextResponse.json({ error: "الاسم والتصنيف والسعر مطلوبة" }, { status: 400 });
  }

  const product = await createProduct(body);
  invalidateProducts();
  return NextResponse.json(product, { status: 201 });
}
