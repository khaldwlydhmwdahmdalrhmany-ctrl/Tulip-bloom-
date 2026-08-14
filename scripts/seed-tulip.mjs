/**
 * ═══════════════════════════════════════════════════════════
 *  بذر بيانات توليب بلوم
 * ═══════════════════════════════════════════════════════════
 *
 *  سكربت مضاف لهذا المتجر. `scripts/seed.mjs` في النواة بقي كما هو.
 *
 *  التشغيل:  npm run seed:tulip
 *  الحذف:    npm run seed:tulip -- --reset
 *
 *  فرقان عن سكربت النواة:
 *
 *  ١) يمرّر `brand` و`stock` و`sortOrder` و`featuredOffer` — سكربت
 *     النواة يُسقطها، فتضيع حالات النفاد والحجز المسبق كلها.
 *
 *  ٢) يُدرج البنرات بـSQL خام لا عبر `createBanner`.
 *     السبب: `lib/db.sqlite.js → createBanner` فيه خلل — عبارة
 *     الإدراج تعلن ١٢ عمودًا وتربط ٩ قيم فقط (ratio و ctaLabel
 *     و ctaHref مفقودة)، فترمي الدالة استثناءً على SQLite.
 *     الالتفاف هنا لا يعدّل النواة، لكن الخلل يبقى قائمًا في لوحة
 *     التحكم عند إنشاء بنر محليًا — انظر CUSTOMIZATION_LOG.md
 */

import { createCategory, createProduct, getCategories, countProducts } from "../lib/db.js";
import { CATEGORIES, PRODUCTS, BANNERS } from "../config/catalog.config.js";

const RESET = process.argv.includes("--reset");
const raw = (process.env.DATABASE_URL || "").trim();
const isPostgres = raw.startsWith("postgres");

/* ── إدراج/حذف البنرات بـSQL خام (تجاوز خلل createBanner) ── */

async function withBannerDriver(fn) {
  if (isPostgres) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: raw, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      await fn({
        run: (sql, params = []) => client.query(sql, params),
        ph: (i) => `$${i}`,
        q: (name) => `"${name}"`,
      });
    } finally {
      await client.end();
    }
  } else {
    const { DatabaseSync } = await import("node:sqlite");
    const path = await import("path");
    const db = new DatabaseSync(path.join(process.cwd(), "data", "areej.db"));
    try {
      await fn({
        run: (sql, params = []) => db.prepare(sql).run(...params),
        ph: () => `?`,
        q: (name) => name,
      });
    } finally {
      db.close();
    }
  }
}

const newId = () => "tb_" + Math.random().toString(36).slice(2, 10);

async function seedBanners() {
  await withBannerDriver(async ({ run, ph, q }) => {
    let i = 0;
    const p = () => ph(++i);
    for (const b of BANNERS) {
      i = 0;
      await run(
        `INSERT INTO banners (id, placement, title, subtitle, ${q("linkCategorySlug")}, ${q("sortOrder")}, active, ratio)
         VALUES (${p()}, ${p()}, ${p()}, ${p()}, ${p()}, ${p()}, ${p()}, ${p()})`,
        [
          newId(), b.placement, b.title, b.subtitle || null,
          b.linkCategorySlug || null, b.sortOrder ?? 0,
          isPostgres ? b.active !== false : (b.active !== false ? 1 : 0),
          b.ratio || "auto",
        ]
      );
    }
  });
}

async function resetAll() {
  await withBannerDriver(async ({ run }) => {
    await run(`DELETE FROM products`);
    await run(`DELETE FROM banners`);
    await run(`DELETE FROM categories`);
  });
  console.log("🧹 حُذفت كل التصنيفات والمنتجات والبنرات.");
}

async function main() {
  if (RESET) {
    await resetAll();
    return;
  }

  if ((await countProducts()) > 0) {
    console.log("⚠️  القاعدة فيها منتجات مسبقًا — لن تتم إعادة التعبئة تفاديًا للتكرار.");
    console.log("    للبدء من نظيف:  npm run seed:tulip -- --reset");
    return;
  }

  console.log("🌱 التصنيفات...");
  const catBySlug = {};
  for (const c of CATEGORIES) catBySlug[c.slug] = await createCategory(c);

  console.log("🌱 المنتجات...");
  for (const p of PRODUCTS) {
    const cat = catBySlug[p.cat];
    if (!cat) throw new Error(`تصنيف غير معرّف: ${p.cat} (المنتج: ${p.name})`);
    await createProduct({
      name: p.name,
      description: p.desc,
      fullDescription: p.full,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      badge: p.badge ?? null,
      imageUrl: p.img ?? null,
      freeShipping: p.freeShipping ?? false,
      freeInstall: false,          // مُطفأ دائمًا — الشارة نصّ من مجال آخر
      categoryId: cat.id,
      brand: p.brand ?? null,
      stock: p.stock || "in_stock",
      rating: null,                // لا نجوم بلا تقييمات حقيقية
      reviewCount: null,
      sortOrder: p.sortOrder ?? 0,
      featuredOffer: p.featuredOffer ?? false,
    });
  }

  console.log("🌱 البنرات...");
  await seedBanners();

  console.log(
    `✅ تم: ${(await getCategories()).length} تصنيفات · ${await countProducts()} منتجًا · ${BANNERS.length} بنرات.`
  );
  console.log(`   القاعدة: ${isPostgres ? "Postgres" : "SQLite محلية (data/areej.db)"}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
