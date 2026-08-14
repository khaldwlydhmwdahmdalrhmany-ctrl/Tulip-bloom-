import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "../../../../lib/auth.js";
import { countProducts, createCategory, createProduct, getCategories } from "../../../../lib/db.js";
import { CATEGORIES, PRODUCTS } from "../../../../lib/seedData.js";

export async function POST() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const existing = await countProducts();
  if (existing > 0) {
    return NextResponse.json({ error: `توجد بالفعل ${existing} منتج في القاعدة — لن تتم إعادة التعبئة لتفادي التكرار.` }, { status: 400 });
  }

  const catByslug = {};
  for (const c of CATEGORIES) catByslug[c.slug] = await createCategory(c);
  for (const p of PRODUCTS) {
    await createProduct({
      name: p.name, description: p.desc, fullDescription: p.full, price: p.price,
      oldPrice: p.oldPrice, badge: p.badge, imageUrl: p.img,
      freeShipping: p.freeShipping, freeInstall: p.freeInstall,
      categoryId: catByslug[p.cat].id,
    });
  }

  return NextResponse.json({
    ok: true,
    categories: (await getCategories()).length,
    products: await countProducts(),
  });
}
