import React from "react";
import { notFound } from "next/navigation";
import { getCategories, getProducts, getCategoryBySlug, getBanners } from "../../../../lib/queries.js";
import { C } from "../../../../lib/colors.js";
import { pickBanner } from "../../../../lib/banners.js";
import PageHero from "../../../../components/site/PageHero.jsx";
import TrustStrip from "../../../../components/site/TrustStrip.jsx";
import ProductBrowser from "../../../../components/site/ProductBrowser.jsx";
import CtaBand from "../../../../components/site/CtaBand.jsx";
import { categoryMetadata, itemListSchema, breadcrumbSchema, JsonLd } from "../../../../lib/seo.jsx";
import { CATEGORY_PAGE } from "../../../../config/content.config.js";

// السلَغ يصل من Next.js مُرمّزًا (percent-encoding) عندما يحتوي حروفًا عربية،
// لذا نفكّ الترميز قبل أي استعلام على قاعدة البيانات.
function decodeSlug(raw) {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw; // ترميز تالف — نستخدم القيمة كما هي بدل رمي استثناء
  }
}

export async function generateMetadata({ params }) {
  const category = await getCategoryBySlug(decodeSlug(params.slug));
  if (!category) return { title: "التصنيف غير موجود" };
  const products = await getProducts({ categorySlug: category.slug });
  return categoryMetadata(category, products.length);
}

export default async function CategoryPage({ params }) {
  const slug = decodeSlug(params.slug);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [categories, products, catBanners] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: slug }),
    getBanners({ placement: "category" }),
  ]);

  const relevant = catBanners.filter((b) => b.active && b.categoryId === category.id);
  const pageBanner = pickBanner(catBanners, { categoryId: category.id });
  // بنر التصنيف من لوحة البنرات له الأولوية، ثم الصورة المرفوعة على التصنيف نفسه
  const heroImage = pageBanner?.imageUrl || category.bannerUrl;

  return (
    <div>
      <JsonLd data={itemListSchema(products, category.name)} />
      <JsonLd data={breadcrumbSchema([
        { name: "الرئيسية", url: "/" },
        { name: "المنتجات", url: "/shop" },
        { name: category.name, url: `/category/${category.slug}` },
      ])} />

      <PageHero
        title={category.name}
        subtitle={category.tagline}
        imageUrl={heroImage}
        ratio={pageBanner?.ratio}
        bannerCta={pageBanner?.ctaHref ? { label: pageBanner.ctaLabel, href: pageBanner.ctaHref } : undefined}
        icon={category.icon}
        color={category.color || C.navy}
        count={products.length}
      />

      <TrustStrip />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <ProductBrowser categories={categories} products={products} activeCatSlug={slug} />
      </section>

      <CtaBand
        eyebrow={CATEGORY_PAGE.cta.eyebrow}
        title={CATEGORY_PAGE.cta.title.replace("{name}", category.name)}
        desc={CATEGORY_PAGE.cta.desc}
        primaryLabel={CATEGORY_PAGE.cta.primaryLabel}
        primaryHref={CATEGORY_PAGE.cta.primaryHref}
        whatsappMessage={`السلام عليكم، عندي استفسار عن قسم: ${category.name}`}
      />
    </div>
  );
}
