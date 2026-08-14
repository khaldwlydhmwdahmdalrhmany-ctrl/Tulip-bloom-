import { createCategory, createProduct, getCategories, countProducts } from "../lib/db.js";
import { CATEGORIES, PRODUCTS } from "../lib/seedData.js";

async function main() {
  if ((await countProducts()) > 0) {
    console.log("⚠️  قاعدة البيانات فيها منتجات مسبقًا — لن تتم إعادة التعبئة تفاديًا للتكرار.");
    return;
  }

  console.log("🌱 إضافة التصنيفات...");
  const catByslug = {};
  for (const c of CATEGORIES) catByslug[c.slug] = await createCategory(c);

  console.log("🌱 إضافة المنتجات...");
  for (const p of PRODUCTS) {
    await createProduct({
      name: p.name, description: p.desc, fullDescription: p.full, price: p.price,
      oldPrice: p.oldPrice, badge: p.badge, imageUrl: p.img,
      freeShipping: p.freeShipping, freeInstall: p.freeInstall,
      categoryId: catByslug[p.cat].id,
    });
  }

  console.log(`✅ تم بنجاح: ${(await getCategories()).length} تصنيفات، ${await countProducts()} منتج.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
