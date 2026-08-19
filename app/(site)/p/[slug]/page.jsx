import React from "react";
import { notFound } from "next/navigation";
import { getPageBySlug } from "../../../../lib/pagesDb.js";
import { getProducts } from "../../../../lib/queries.js";
import { getCurrentAdmin } from "../../../../lib/pagePreview.js";
import PageBlocks from "../../../../components/site/PageBlocks.jsx";
import { faqSchema, JsonLd } from "../../../../lib/seo.jsx";
import { applyOverride } from "../../../../lib/seoOverride.js";
import { C } from "../../../../lib/colors.js";

export const dynamic = "force-dynamic";

/**
 * الصفحات المخصّصة تحت `/p/` لا في الجذر.
 *
 * ⚠️ السبب: مسار جذري ديناميكي `/[slug]` يلتقط كل عنوان غير
 * مطابق، فيحجب صفحة ٤٠٤ ويعطّل التحويلات الدائمة المبنية عليها
 * (§١٧). البادئة تفصل مجال الصفحات عن مسارات المتجر تمامًا.
 */
export async function generateMetadata({ params }) {
  const page = await getPageBySlug(params.slug);
  if (!page) return { title: "الصفحة غير موجودة" };

  const base = {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    robots:
      page.noIndex === true || page.noIndex === 1 || page.status !== "published"
        ? { index: false, follow: true }
        : undefined,
    openGraph: page.ogImage ? { images: [{ url: page.ogImage }] } : undefined,
  };
  return applyOverride(`/p/${params.slug}`, base);
}

export default async function CustomPage({ params }) {
  const page = await getPageBySlug(params.slug);
  if (!page) notFound();

  /**
   * المسودّة تظهر للمسؤول فقط.
   * بدون هذا لا يمكن مراجعة صفحة قبل نشرها إلا بنشرها — وهو
   * بالضبط ما يحاول نظام المسودّات منعه.
   */
  const isDraft = page.status !== "published";
  if (isDraft) {
    const admin = await getCurrentAdmin();
    if (!admin) notFound();
  }

  const needsProducts = page.blocks.some((b) => b.type === "products");
  const products = needsProducts ? await getProducts().catch(() => []) : [];

  const faqBlock = page.blocks.find((b) => b.type === "faq" && (b.props?.items || []).length);

  return (
    <div>
      {isDraft && (
        <div className="px-4 py-2.5 text-center text-[12px] font-bold"
             style={{ background: C.warning, color: "#fff" }}>
          معاينة مسودّة — هذه الصفحة غير منشورة ولا يراها الزوّار.
        </div>
      )}

      {faqBlock && <JsonLd data={faqSchema(faqBlock.props.items)} />}

      <PageBlocks blocks={page.blocks} products={products} />
    </div>
  );
}
